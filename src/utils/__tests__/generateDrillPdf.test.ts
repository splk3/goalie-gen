import { loadImageAsDataURL, generateDrillPdf } from "../generateDrillPdf";
import type { DrillPdfProgressCallback } from "../generateDrillPdf";
import type { DrillData } from "../../types/drill";
import {
  estimateDrillPdfPages,
  shouldPlaceProgressionsOnSecondPage,
} from "../estimateDrillPdfPages";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

// ---------------------------------------------------------------------------
// Browser API mocks
// ---------------------------------------------------------------------------

// Track canvas instances created during tests so we can inspect dimensions.
interface MockCanvasInstance {
  width: number;
  height: number;
  drawImageArgs: unknown[];
  toDataURLFn: () => string;
}

let lastCanvas: MockCanvasInstance | null = null;

const defaultToDataURL = () => "data:image/png;base64,MOCK";

/**
 * Wire up fresh mocks for Image, canvas, and related APIs before each test.
 * Returns helpers to control image dimensions and toDataURL behaviour.
 */
function setupMocks(opts?: {
  imageWidth?: number;
  imageHeight?: number;
  toDataURL?: () => string;
  failLoad?: boolean;
}) {
  const imgWidth = opts?.imageWidth ?? 100;
  const imgHeight = opts?.imageHeight ?? 100;
  const toDataURLFn = opts?.toDataURL ?? defaultToDataURL;
  const failLoad = opts?.failLoad ?? false;

  lastCanvas = null;

  // --- Mock HTMLCanvasElement ---
  const mockDrawImage = jest.fn((...args: unknown[]) => {
    if (lastCanvas) {
      lastCanvas.drawImageArgs = args;
    }
  });

  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    value: jest.fn(() => ({ drawImage: mockDrawImage })),
    writable: true,
    configurable: true,
  });

  Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
    value: jest.fn(function (this: HTMLCanvasElement) {
      if (lastCanvas) {
        return lastCanvas.toDataURLFn();
      }
      return toDataURLFn();
    }),
    writable: true,
    configurable: true,
  });

  // Override document.createElement to capture canvas dimensions.
  const originalCreate = document.createElement.bind(document);
  jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    if (tagName === "canvas") {
      const canvas = originalCreate("canvas") as HTMLCanvasElement;
      const instance: MockCanvasInstance = {
        get width() {
          return canvas.width;
        },
        set width(v: number) {
          canvas.width = v;
        },
        get height() {
          return canvas.height;
        },
        set height(v: number) {
          canvas.height = v;
        },
        drawImageArgs: [],
        toDataURLFn,
      };
      lastCanvas = instance;
      return canvas;
    }
    return originalCreate(tagName);
  });

  // --- Mock Image ---
  class MockImage {
    crossOrigin = "";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readonly width = imgWidth;
    readonly height = imgHeight;

    set src(_value: string) {
      // Simulate the browser dispatching load/error asynchronously.
      setTimeout(() => {
        if (failLoad) {
          this.onerror?.();
        } else {
          this.onload?.();
        }
      }, 0);
    }

    get src(): string {
      return "";
    }
  }

  Object.defineProperty(global, "Image", {
    value: MockImage,
    writable: true,
    configurable: true,
  });

  return { toDataURLFn };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("loadImageAsDataURL", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("returns a data URL and the canvas dimensions for a normal-sized image", async () => {
    setupMocks({ imageWidth: 200, imageHeight: 100 });

    const promise = loadImageAsDataURL("http://example.com/normal.png");
    jest.runAllTimers();

    const result = await promise;
    expect(result.dataURL).toBe("data:image/png;base64,MOCK");
    expect(result.width).toBe(200);
    expect(result.height).toBe(100);
  });

  it("downscales images that exceed MAX_CANVAS_DIMENSION (2048) in width", async () => {
    // 4096 × 1024: width exceeds 2048, scale = 2048/4096 = 0.5
    setupMocks({ imageWidth: 4096, imageHeight: 1024 });

    const promise = loadImageAsDataURL("http://example.com/wide.png");
    jest.runAllTimers();

    const result = await promise;
    expect(result.width).toBe(2048);
    expect(result.height).toBe(512);
  });

  it("downscales images that exceed MAX_CANVAS_DIMENSION (2048) in height", async () => {
    // 1024 × 4096: height exceeds 2048, scale = 2048/4096 = 0.5
    setupMocks({ imageWidth: 1024, imageHeight: 4096 });

    const promise = loadImageAsDataURL("http://example.com/tall.png");
    jest.runAllTimers();

    const result = await promise;
    expect(result.width).toBe(512);
    expect(result.height).toBe(2048);
  });

  it("downscales images exceeding 2048 in both dimensions (limited by larger axis)", async () => {
    // 6000 × 4000: scale = 2048/6000 ≈ 0.3413, expected ~2048 × 1365
    setupMocks({ imageWidth: 6000, imageHeight: 4000 });

    const promise = loadImageAsDataURL("http://example.com/huge.png");
    jest.runAllTimers();

    const result = await promise;
    expect(result.width).toBe(2048);
    expect(result.height).toBe(Math.round(4000 * (2048 / 6000)));
    expect(result.height).toBeLessThanOrEqual(2048);
  });

  it("does not downscale images at exactly MAX_CANVAS_DIMENSION", async () => {
    setupMocks({ imageWidth: 2048, imageHeight: 2048 });

    const promise = loadImageAsDataURL("http://example.com/exact.png");
    jest.runAllTimers();

    const result = await promise;
    expect(result.width).toBe(2048);
    expect(result.height).toBe(2048);
  });

  it("rejects with a descriptive error when the image fails to load", async () => {
    setupMocks({ failLoad: true });

    const promise = loadImageAsDataURL("http://example.com/missing.png");
    jest.runAllTimers();

    await expect(promise).rejects.toThrow("Failed to load image:");
  });

  it("translates a QuotaExceededError DOMException from toDataURL into an out-of-memory error", async () => {
    setupMocks({
      imageWidth: 100,
      imageHeight: 100,
      toDataURL: () => {
        throw new DOMException("Canvas area exceeds the maximum limit", "QuotaExceededError");
      },
    });

    const promise = loadImageAsDataURL("http://example.com/oom.png");
    jest.runAllTimers();

    await expect(promise).rejects.toThrow(/out of memory/i);
  });

  it("does NOT translate a SecurityError DOMException as an OOM error", async () => {
    const securityError = new DOMException("The operation is insecure.", "SecurityError");
    setupMocks({
      imageWidth: 100,
      imageHeight: 100,
      toDataURL: () => {
        throw securityError;
      },
    });

    const promise = loadImageAsDataURL("http://example.com/cors-err.png");
    jest.runAllTimers();

    // Must not be wrapped with OOM message; the original SecurityError propagates.
    await expect(promise).rejects.toThrow(securityError);
    await expect(promise).rejects.not.toThrow(/out of memory/i);
  });

  it("translates a memory-related Error from toDataURL into an out-of-memory error", async () => {
    setupMocks({
      imageWidth: 100,
      imageHeight: 100,
      toDataURL: () => {
        throw new Error("Out of memory");
      },
    });

    const promise = loadImageAsDataURL("http://example.com/oom2.png");
    jest.runAllTimers();

    await expect(promise).rejects.toThrow(/out of memory/i);
  });

  it("propagates non-OOM errors from toDataURL without wrapping", async () => {
    const originalError = new Error("Some unexpected canvas error");
    setupMocks({
      imageWidth: 100,
      imageHeight: 100,
      toDataURL: () => {
        throw originalError;
      },
    });

    const promise = loadImageAsDataURL("http://example.com/unknown-err.png");
    jest.runAllTimers();

    await expect(promise).rejects.toThrow(originalError);
  });

  it("serves a cached promise for the same path within TTL", async () => {
    // Use a unique path to avoid interference from other tests
    const path = `http://example.com/cached-img-${Date.now()}.png`;
    setupMocks({ imageWidth: 50, imageHeight: 50 });

    const p1 = loadImageAsDataURL(path);
    const p2 = loadImageAsDataURL(path);
    jest.runAllTimers();

    // Both calls must resolve to the identical promise object (cache hit).
    expect(p1).toBe(p2);
    await p1;
  });
});

// ---------------------------------------------------------------------------
// Type-level smoke test for DrillPdfProgressCallback
// ---------------------------------------------------------------------------
describe("DrillPdfProgressCallback type", () => {
  it("is callable with a string message", () => {
    const messages: string[] = [];
    const callback: DrillPdfProgressCallback = (msg) => {
      messages.push(msg);
    };
    callback("Loading images...");
    callback("Generating PDF...");
    callback("Finalizing...");
    expect(messages).toEqual(["Loading images...", "Generating PDF...", "Finalizing..."]);
  });
});

describe("generateDrillPdf layout selection", () => {
  jest.setTimeout(20000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const baseDrillData: DrillData = {
    name: "Layout Selection Test Drill",
    description: "Short description for layout testing.",
    drill_steps: ["Step one", "Step two"],
    coaching_focus_points: ["Focus one", "Focus two"],
    drill_image: "diagram.png",
    tags: {
      team_drill: "no",
      fundamental_skill: ["angles"],
      skating_skill: ["t-push"],
    },
    drill_creation_date: "2026-01-01",
  };

  it("uses centered 75% width image when single-column main layout fits one page", async () => {
    setupMocks({ imageWidth: 1200, imageHeight: 800 });
    const jspdf = await import("jspdf");
    const addImageSpy = jest.spyOn(jspdf.jsPDF.API as { addImage: (...args: unknown[]) => unknown }, "addImage");

    await generateDrillPdf(baseDrillData, "test-folder");

    const hasSingleColumnDrillImage = addImageSpy.mock.calls.some((call) => {
      const width = call[4];
      return typeof width === "number" && Math.abs(width - 127.5) < 0.6;
    });
    expect(hasSingleColumnDrillImage).toBe(true);
  });

  it("falls back to two-column image width when single-column main layout overflows", async () => {
    setupMocks({ imageWidth: 1200, imageHeight: 800 });
    const jspdf = await import("jspdf");
    const addImageSpy = jest.spyOn(jspdf.jsPDF.API as { addImage: (...args: unknown[]) => unknown }, "addImage");
    const overflowData: DrillData = {
      ...baseDrillData,
      description: Array.from({ length: 40 }, () => "Very long description text").join(" "),
      drill_steps: Array.from({ length: 40 }, (_, index) => `Extended step ${index + 1}`),
      coaching_focus_points: Array.from({ length: 20 }, () => "Detailed coaching point text"),
      shooter_focus_points: Array.from({ length: 12 }, () => "Detailed shooter point text"),
    };

    await generateDrillPdf(overflowData, "test-folder");

    const hasSingleColumnDrillImage = addImageSpy.mock.calls.some((call) => {
      const width = call[4];
      return typeof width === "number" && Math.abs(width - 127.5) < 0.6;
    });
    expect(hasSingleColumnDrillImage).toBe(false);
  });

  it("uses single-column image width for shot-rebound-recovery", async () => {
    setupMocks({ imageWidth: 1200, imageHeight: 800 });
    const jspdf = await import("jspdf");
    const addImageSpy = jest.spyOn(
      jspdf.jsPDF.API as { addImage: (...args: unknown[]) => unknown },
      "addImage"
    );
    const drillPath = path.resolve(__dirname, "../../../drills/shot-rebound-recovery/drill.yml");
    const drillData = yaml.load(fs.readFileSync(drillPath, "utf8"), {
      schema: yaml.FAILSAFE_SCHEMA,
    }) as DrillData;

    await generateDrillPdf(drillData, "shot-rebound-recovery");

    const hasSingleColumnDrillImage = addImageSpy.mock.calls.some((call) => {
      const width = call[4];
      return typeof width === "number" && Math.abs(width - 127.5) < 0.6;
    });
    expect(hasSingleColumnDrillImage).toBe(true);
  });
});

describe("generateDrillPdf pagination regression alignment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks({ imageWidth: 1600, imageHeight: 900 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const loadDrillFixture = (folder: string): DrillData => {
    const drillPath = path.resolve(__dirname, `../../../drills/${folder}/drill.yml`);
    return yaml.load(fs.readFileSync(drillPath, "utf8"), {
      schema: yaml.FAILSAFE_SCHEMA,
    }) as DrillData;
  };

  it("keeps rim-stop-cut-across in dedicated progression-page mode", async () => {
    const folder = "rim-stop-cut-across";
    const drillData = loadDrillFixture(folder);

    expect(shouldPlaceProgressionsOnSecondPage(drillData)).toBe(true);
    const pageEstimate = estimateDrillPdfPages(drillData);
    expect(pageEstimate).toMatchObject({
      mainContentPages: 2,
      dedicatedProgressionPages: 1,
      totalPages: 3,
    });

    const doc = await generateDrillPdf(drillData, folder);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(doc.getNumberOfPages()).toBeLessThanOrEqual(pageEstimate.totalPages);
  });

  it("keeps progression-image drills aligned between estimator and generator", async () => {
    const withImageProgressions = {
      name: "Regression Image Progression Alignment",
      description: "Short",
      drill_steps: ["Step one"],
      coaching_focus_points: ["Focus detail"],
      drill_image: "diagram.png",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
      drill_progressions: Array.from({ length: 8 }, (_, index) => ({
        progression_name: `Progression ${index + 1}`,
        progression_description:
          "Long progression details intended to force dedicated progression pagination when rendered inline.",
        progression_image: `progression-${index + 1}.png`,
      })),
    } as DrillData;

    expect(shouldPlaceProgressionsOnSecondPage(withImageProgressions)).toBe(true);
    const pageEstimate = estimateDrillPdfPages(withImageProgressions);
    expect(pageEstimate.dedicatedProgressionPages).toBeGreaterThan(0);

    const doc = await generateDrillPdf(withImageProgressions, "test-folder");
    expect(doc.getNumberOfPages()).toBe(pageEstimate.totalPages);
  });

  it("keeps text-only progression drills aligned between estimator and generator", async () => {
    const textOnlyProgressions = {
      name: "Regression Text Progression Alignment",
      description: "Short",
      drill_steps: Array.from({ length: 36 }, (_, index) => `Step ${index + 1}`),
      coaching_focus_points: Array.from({ length: 16 }, () => "Focus detail"),
      drill_image: "diagram.png",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
      drill_progressions: [
        {
          progression_name: "Progression 1",
          progression_description:
            "Longer progression details intended to consume enough inline space to trigger dedicated progression pagination behavior.",
        },
        {
          progression_name: "Progression 2",
          progression_description:
            "Additional progression text to ensure the overall inline render would exceed one page before moving progressions.",
        },
      ],
    } as DrillData;

    expect(shouldPlaceProgressionsOnSecondPage(textOnlyProgressions)).toBe(true);
    const pageEstimate = estimateDrillPdfPages(textOnlyProgressions);
    expect(pageEstimate.dedicatedProgressionPages).toBeGreaterThan(0);

    const doc = await generateDrillPdf(textOnlyProgressions, "test-folder");
    expect(doc.getNumberOfPages()).toBe(pageEstimate.totalPages);
  });
});
