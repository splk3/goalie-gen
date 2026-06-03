import { loadImageAsDataURL, generateDrillPdf } from "../generateDrillPdf";
import type { DrillPdfProgressCallback } from "../generateDrillPdf";
import type { DrillData } from "../../types/drill";
import {
  estimateDrillPdfPages,
  shouldPlaceProgressionsOnSecondPage,
} from "../estimateDrillPdfPages";
import * as drillPdfPaginationShared from "../drillPdfPaginationShared";
import * as estimateDrillPdfPagesModule from "../estimateDrillPdfPages";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

const mockQrCodeToDataURL = jest.fn(
  async () => "data:image/png;base64,MOCK"
);
jest.mock("qrcode", () => ({
  toDataURL: (...args: unknown[]) => mockQrCodeToDataURL(...args),
}));

const loadDrillFixture = (folder: string): DrillData => {
  const drillPath = path.resolve(__dirname, `../../../drills/${folder}/drill.yml`);
  return yaml.load(fs.readFileSync(drillPath, "utf8"), {
    schema: yaml.FAILSAFE_SCHEMA,
  }) as DrillData;
};

type TraceOp = "addImage" | "splitTextToSize";

interface DrawTraceEntry {
  order: number;
  op: TraceOp;
  args: unknown[];
}

const trimText = (value: string): string => {
  if (value.length <= 80) {
    return value;
  }
  return `${value.slice(0, 77)}...`;
};

const sanitizeTraceValue = (value: unknown): unknown => {
  if (typeof value === "number") {
    return Number(value.toFixed(2));
  }
  if (typeof value === "string") {
    return trimText(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeTraceValue(item));
  }
  if (value && typeof value === "object") {
    const asRecord = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(asRecord)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, sanitizeTraceValue(entryValue)])
    );
  }
  return value;
};

const getPdfDrawTrace = async (
  drillData: DrillData,
  drillFolder: string
): Promise<DrawTraceEntry[]> => {
  const jspdf = await import("jspdf");
  const methods: TraceOp[] = ["addImage", "splitTextToSize"];
  const spies = methods.map((method) =>
    jest.spyOn(
      jspdf.jsPDF.API as unknown as Record<string, (...args: unknown[]) => unknown>,
      method
    )
  );

  try {
    await generateDrillPdf(drillData, drillFolder);
    const trace: DrawTraceEntry[] = [];

    methods.forEach((method, index) => {
      const spy = spies[index];
      spy.mock.calls.forEach((call, callIndex) => {
        trace.push({
          order: spy.mock.invocationCallOrder[callIndex],
          op: method,
          args: call.map((arg) => sanitizeTraceValue(arg)),
        });
      });
    });

    return trace.sort((a, b) => a.order - b.order);
  } finally {
    spies.forEach((spy) => {
      spy.mockRestore();
    });
  }
};

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
    mockQrCodeToDataURL.mockClear();
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
    const addImageSpy = jest.spyOn(
      jspdf.jsPDF.API as unknown as { addImage: (...args: unknown[]) => unknown },
      "addImage"
    );

    await generateDrillPdf(baseDrillData, "test-folder");

    const hasSingleColumnDrillImage = addImageSpy.mock.calls.some((call) => {
      const width = call[4];
      return typeof width === "number" && Math.abs(width - 127.5) < 0.6;
    });
    expect(hasSingleColumnDrillImage).toBe(true);
  });

  it("renders the drill diagram before the Drill Information section in single-column layout", async () => {
    setupMocks({ imageWidth: 1200, imageHeight: 800 });
    const jspdf = await import("jspdf");
    const addImageSpy = jest.spyOn(
      jspdf.jsPDF.API as unknown as { addImage: (...args: unknown[]) => unknown },
      "addImage"
    );
    const splitTextSpy = jest.spyOn(
      jspdf.jsPDF.API as unknown as { splitTextToSize: (...args: unknown[]) => unknown },
      "splitTextToSize"
    );

    await generateDrillPdf(baseDrillData, "test-folder");

    const drillImageCallIndex = addImageSpy.mock.calls.findIndex((call) => {
      const width = call[4];
      return typeof width === "number" && Math.abs(width - 127.5) < 0.6;
    });
    expect(drillImageCallIndex).toBeGreaterThanOrEqual(0);

    const drillImageCallOrder = addImageSpy.mock.invocationCallOrder[drillImageCallIndex];
    const descriptionSplitCallIndexes = splitTextSpy.mock.calls
      .map((call, index) => ({ value: call[0], index }))
      .filter((entry) => entry.value === baseDrillData.description)
      .map((entry) => entry.index);
    expect(descriptionSplitCallIndexes.length).toBeGreaterThan(0);

    const descriptionSplitCallOrder =
      splitTextSpy.mock.invocationCallOrder[
        descriptionSplitCallIndexes[descriptionSplitCallIndexes.length - 1]
      ];
    expect(drillImageCallOrder).toBeLessThan(descriptionSplitCallOrder);
  });

  it("falls back to two-column image width when single-column main layout overflows", async () => {
    setupMocks({ imageWidth: 1200, imageHeight: 800 });
    const jspdf = await import("jspdf");
    const addImageSpy = jest.spyOn(
      jspdf.jsPDF.API as unknown as { addImage: (...args: unknown[]) => unknown },
      "addImage"
    );
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

  it("renders sectioned coaching focus points as headings with nested bullets", async () => {
    setupMocks({ imageWidth: 1200, imageHeight: 800 });
    const jspdf = await import("jspdf");
    const splitTextSpy = jest.spyOn(
      jspdf.jsPDF.API as unknown as { splitTextToSize: (...args: unknown[]) => unknown },
      "splitTextToSize"
    );

    await generateDrillPdf(
      {
        ...baseDrillData,
        coaching_focus_points: [
          {
            "Movement Quality:": ["Explode on the first push", "Arrive set at each point"],
          },
          "Track puck into body",
        ],
      },
      "test-folder"
    );

    const splitValues = splitTextSpy.mock.calls.map((call) => call[0]);
    expect(splitValues).toContain("Movement Quality:");
    expect(splitValues).toContain("• Explode on the first push");
    expect(splitValues).toContain("• Arrive set at each point");
    expect(splitValues).toContain("• Track puck into body");
  });

  it("uses single-column image width for shot-rebound-recovery", async () => {
    setupMocks({ imageWidth: 1200, imageHeight: 800 });
    const jspdf = await import("jspdf");
    const addImageSpy = jest.spyOn(
      jspdf.jsPDF.API as unknown as { addImage: (...args: unknown[]) => unknown },
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

  it("uses single-column image width for beat-the-pass", async () => {
    setupMocks({ imageWidth: 1081, imageHeight: 523 });
    const jspdf = await import("jspdf");
    const addImageSpy = jest.spyOn(
      jspdf.jsPDF.API as unknown as { addImage: (...args: unknown[]) => unknown },
      "addImage"
    );
    const drillData = loadDrillFixture("beat-the-pass");

    await generateDrillPdf(drillData, "beat-the-pass");

    const hasSingleColumnDrillImage = addImageSpy.mock.calls.some((call) => {
      const width = call[4];
      return typeof width === "number" && Math.abs(width - 127.5) < 0.6;
    });
    expect(hasSingleColumnDrillImage).toBe(true);
  });

  it("renders video URL as a clickable link and adds an inline QR code image", async () => {
    setupMocks({ imageWidth: 1200, imageHeight: 800 });
    const jspdf = await import("jspdf");
    const addImageSpy = jest.spyOn(
      jspdf.jsPDF.API as unknown as { addImage: (...args: unknown[]) => unknown },
      "addImage"
    );
    const textWithLinkSpy = jest.spyOn(
      jspdf.jsPDF.API as unknown as { textWithLink: (...args: unknown[]) => unknown },
      "textWithLink"
    );
    const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    await generateDrillPdf(
      {
        ...baseDrillData,
        video: videoUrl,
      },
      "test-folder"
    );

    expect(mockQrCodeToDataURL).toHaveBeenCalledWith(
      videoUrl,
      expect.objectContaining({
        margin: 0,
      })
    );
    expect(textWithLinkSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({
        url: videoUrl,
      })
    );
    expect(
      addImageSpy.mock.calls.some((call) => {
        return call[0] === "data:image/png;base64,MOCK";
      })
    ).toBe(true);
  });

  it("keeps butterfly-map-series in two-column mode", async () => {
    setupMocks({ imageWidth: 862, imageHeight: 411 });
    const jspdf = await import("jspdf");
    const addImageSpy = jest.spyOn(
      jspdf.jsPDF.API as unknown as { addImage: (...args: unknown[]) => unknown },
      "addImage"
    );
    const drillData = loadDrillFixture("butterfly-map-series");

    await generateDrillPdf(drillData, "butterfly-map-series");

    const hasSingleColumnDrillImage = addImageSpy.mock.calls.some((call) => {
      const width = call[4];
      return typeof width === "number" && Math.abs(width - 127.5) < 0.6;
    });
    expect(hasSingleColumnDrillImage).toBe(false);
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

describe("generateDrillPdf visual regression traces", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks({ imageWidth: 1600, imageHeight: 900 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("matches full-width first-page layout trace for shot-rebound-recovery", async () => {
    const drillData = loadDrillFixture("shot-rebound-recovery");
    const trace = await getPdfDrawTrace(drillData, "shot-rebound-recovery");
    expect({
      totalOps: trace.length,
      firstOps: trace.slice(0, 80),
      lastOps: trace.slice(-40),
    }).toMatchSnapshot();
  });

  it("matches dedicated progression-card trace for rim-stop-cut-across", async () => {
    const drillData = loadDrillFixture("rim-stop-cut-across");
    const trace = await getPdfDrawTrace(drillData, "rim-stop-cut-across");
    expect({
      totalOps: trace.length,
      firstOps: trace.slice(0, 120),
      lastOps: trace.slice(-60),
    }).toMatchSnapshot();
  });

  it("matches dense inline-content trace for two-shot", async () => {
    const drillData = loadDrillFixture("two-shot");
    const trace = await getPdfDrawTrace(drillData, "two-shot");
    expect({
      totalOps: trace.length,
      firstOps: trace.slice(0, 100),
      lastOps: trace.slice(-50),
    }).toMatchSnapshot();
  });
});

describe("generateDrillPdf overflow handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks({ imageWidth: 1600, imageHeight: 900 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders a placeholder card when a progression cannot be placed", async () => {
    const splitTextSpy = jest.spyOn(
      (await import("jspdf")).jsPDF.API as unknown as Record<
        string,
        (...args: unknown[]) => unknown
      >,
      "splitTextToSize"
    );
    jest
      .spyOn(estimateDrillPdfPagesModule, "shouldPlaceProgressionsOnSecondPage")
      .mockReturnValue(true);
    jest.spyOn(drillPdfPaginationShared, "planDedicatedProgressionCards").mockReturnValue({
      pagesUsed: 1,
      placements: [],
      compactedCardIndices: [],
      overflowCardIndices: [0],
    });

    const drillData = {
      name: "Overflow Placeholder",
      description: "Short",
      drill_steps: ["Step one"],
      coaching_focus_points: ["Focus detail"],
      drill_image: "diagram.png",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
      drill_progressions: [
        {
          progression_name: "Unplaced Progression",
          progression_description: "Full progression details",
        },
      ],
    } as DrillData;

    await generateDrillPdf(drillData, "test-folder");

    expect(
      splitTextSpy.mock.calls.some((call) =>
        JSON.stringify(call[0]).includes("This progression was omitted from the PDF")
      )
    ).toBe(true);
  });
});
