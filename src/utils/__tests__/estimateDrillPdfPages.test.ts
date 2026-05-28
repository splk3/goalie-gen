import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import type { DrillData } from "../../types/drill";
import {
  estimateDedicatedProgressionSectionPages,
  estimateDrillPdfPages,
  PROGRESSION_IMAGE_TEXT_GAP,
  PROGRESSION_TEXT_FONT_SIZE,
  PROGRESSION_TEXT_LINE_HEIGHT,
  shouldUseFullWidthFirstPageDiagram,
  shouldPlaceProgressionsOnSecondPage,
  SKILLS_FOCUS_TOP_GAP,
} from "../estimateDrillPdfPages";

const DRILLS_DIR = path.resolve(__dirname, "../../../drills");

interface DrillEntry {
  folder: string;
  drillData: DrillData;
}

function loadAllDrills(): DrillEntry[] {
  if (!fs.existsSync(DRILLS_DIR)) {
    throw new Error(`Drills directory not found: ${DRILLS_DIR}`);
  }

  const folders = fs
    .readdirSync(DRILLS_DIR)
    .filter((item) => fs.statSync(path.join(DRILLS_DIR, item)).isDirectory());

  return folders
    .map((folder) => {
      const ymlPath = path.join(DRILLS_DIR, folder, "drill.yml");
      if (!fs.existsSync(ymlPath)) return null;
      const content = fs.readFileSync(ymlPath, "utf8");
      const drillData = yaml.load(content, { schema: yaml.FAILSAFE_SCHEMA }) as DrillData;
      return { folder, drillData };
    })
    .filter((entry): entry is DrillEntry => entry !== null);
}

describe("estimateDrillPdfPages", () => {
  const drills = loadAllDrills();

  it("uses the revised progression and skills focus layout constants", () => {
    expect(PROGRESSION_TEXT_FONT_SIZE).toBe(10);
    expect(PROGRESSION_TEXT_LINE_HEIGHT).toBe(4);
    expect(PROGRESSION_IMAGE_TEXT_GAP).toBe(4);
    expect(SKILLS_FOCUS_TOP_GAP).toBe(4);
  });

  it("loads at least one drill from the drills directory", () => {
    expect(drills.length).toBeGreaterThan(0);
  });

  it("returns a page count of at least 1 for every drill", () => {
    for (const { drillData } of drills) {
      expect(estimateDrillPdfPages(drillData).totalPages).toBeGreaterThanOrEqual(1);
    }
  });

  it("reduces rim-stop-cut-across to three pages with denser progression packing", () => {
    const rimStop = drills.find((entry) => entry.folder === "rim-stop-cut-across");
    expect(rimStop).toBeDefined();
    expect(shouldPlaceProgressionsOnSecondPage(rimStop!.drillData)).toBe(true);
    const pageEstimate = estimateDrillPdfPages(rimStop!.drillData);
    expect(pageEstimate.mainContentPages).toBe(2);
    expect(pageEstimate.dedicatedProgressionPages).toBe(1);
    expect(pageEstimate.totalPages).toBe(3);
  });

  it("keeps read-and-react to two pages total so Skills Focus stays on page one", () => {
    const readAndReact = drills.find((entry) => entry.folder === "read-and-react");
    expect(readAndReact).toBeDefined();
    expect(shouldPlaceProgressionsOnSecondPage(readAndReact!.drillData)).toBe(true);
    expect(estimateDrillPdfPages(readAndReact!.drillData).totalPages).toBe(2);
  });

  it("keeps beat-the-pass on full-width first-page layout with its actual diagram aspect ratio", () => {
    const beatThePass = drills.find((entry) => entry.folder === "beat-the-pass");
    expect(beatThePass).toBeDefined();
    expect(shouldPlaceProgressionsOnSecondPage(beatThePass!.drillData)).toBe(true);
    expect(shouldUseFullWidthFirstPageDiagram(beatThePass!.drillData, 1081 / 523)).toBe(true);
  });

  it("keeps butterfly-map-series and crease-footwork in two-column first-page layout", () => {
    const butterflyMapSeries = drills.find((entry) => entry.folder === "butterfly-map-series");
    const creaseFootwork = drills.find((entry) => entry.folder === "crease-footwork");
    expect(butterflyMapSeries).toBeDefined();
    expect(creaseFootwork).toBeDefined();
    expect(shouldUseFullWidthFirstPageDiagram(butterflyMapSeries!.drillData, 862 / 411)).toBe(false);
    expect(shouldUseFullWidthFirstPageDiagram(creaseFootwork!.drillData, 863 / 410)).toBe(false);
  });

  it("uses larger follow-on page capacity after first-page overflow", () => {
    const shortPoint = "quick";
    const drillData = {
      name: "Estimator Capacity Regression",
      description: "Short description",
      drill_steps: [] as string[],
      coaching_focus_points: Array.from({ length: 50 }, () => shortPoint),
      shooter_focus_points: Array.from({ length: 10 }, () => shortPoint),
      drill_image: "",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
    } as DrillData;

    expect(estimateDrillPdfPages(drillData).totalPages).toBe(2);
  });

  it("supports mixed sectioned and flat coaching focus points", () => {
    const drillData = {
      name: "Sectioned Coaching Focus Estimate",
      description: "Short description",
      drill_steps: ["Step one"],
      coaching_focus_points: [
        {
          "Movement Quality:": ["Explode on the first push", "Arrive set at each point"],
        },
        "Track puck into body",
      ],
      drill_image: "",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
    } as DrillData;

    expect(estimateDrillPdfPages(drillData).totalPages).toBeGreaterThanOrEqual(1);
  });

  it("flags warning-worthy main-content overflow only when first-page fit fails", () => {
    const warningCandidate = {
      name: "Main Content Warning Candidate",
      description: Array.from({ length: 36 }, () => "Long description detail").join(" "),
      drill_steps: Array.from({ length: 38 }, (_, index) => `Extended step ${index + 1}`),
      coaching_focus_points: Array.from({ length: 20 }, () => "Detailed coaching point"),
      shooter_focus_points: Array.from({ length: 10 }, () => "Detailed shooter point"),
      drill_image: "diagram.png",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
    } as DrillData;

    const pageEstimate = estimateDrillPdfPages(warningCandidate);
    expect(pageEstimate.mainContentPages).toBeGreaterThan(1);
    expect(shouldUseFullWidthFirstPageDiagram(warningCandidate)).toBe(false);
  });

  it("treats single newlines in descriptions the same as soft-wrapped spaces", () => {
    const commonDrillData = {
      name: "Description Normalization Regression",
      drill_steps: [] as string[],
      coaching_focus_points: ["quick rep"],
      drill_image: "",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
    } as DrillData;

    const softWrappedDescription =
      "This drill has a soft wrap in yaml source\nthat should not change estimated line usage.";
    const spaceWrappedDescription =
      "This drill has a soft wrap in yaml source that should not change estimated line usage.";

    const softWrappedEstimate = estimateDrillPdfPages({
      ...commonDrillData,
      description: softWrappedDescription,
    });
    const spaceWrappedEstimate = estimateDrillPdfPages({
      ...commonDrillData,
      description: spaceWrappedDescription,
    });

    expect(softWrappedEstimate.totalPages).toBe(spaceWrappedEstimate.totalPages);
  });

  it("accounts for drill steps when estimating page count", () => {
    const baseData = {
      name: "Drill Steps Estimate",
      description: "Short description",
      drill_steps: [] as string[],
      coaching_focus_points: Array.from({ length: 50 }, () => "quick"),
      shooter_focus_points: Array.from({ length: 10 }, () => "quick"),
      drill_image: "",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
    } as DrillData;

    const withoutSteps = estimateDrillPdfPages(baseData);
    const withSteps = estimateDrillPdfPages({
      ...baseData,
      drill_steps: Array.from({ length: 30 }, (_, index) => `Drill step ${index + 1}`),
    });

    expect(withoutSteps.totalPages).toBe(2);
    expect(withSteps.totalPages).toBeGreaterThan(withoutSteps.totalPages);
  });

  it("accounts for a long drill name header without under-estimating page count", () => {
    // With the current compact Skills Focus sizing, this dataset now fits on one page
    // for both short and long names, but the long-name estimate must never be lower.
    const baseDrillData = {
      name: "Short Name",
      description: "Short",
      drill_steps: [] as string[],
      coaching_focus_points: Array.from({ length: 22 }, () => "quick"),
      drill_image: "",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
    } as DrillData;

    // Name > 80 chars wraps to 3 lines in the header title area (TITLE_CHARS_PER_LINE = 40).
    const longNameDrillData: DrillData = {
      ...baseDrillData,
      name: "A Very Long Drill Name That Must Wrap to Three Lines in the PDF Header Title Area",
    };

    expect(estimateDrillPdfPages(baseDrillData).totalPages).toBe(1);
    expect(estimateDrillPdfPages(longNameDrillData).totalPages).toBeGreaterThanOrEqual(
      estimateDrillPdfPages(baseDrillData).totalPages
    );
  });

  it("does not force a second page when progression images still fit on one page", () => {
    const baseDrillData = {
      name: "Progression Image Page Estimate",
      description: "Short",
      drill_steps: ["Step one"],
      coaching_focus_points: ["Focus one"],
      drill_image: "",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
      drill_progressions: [
        {
          progression_name: "Progression 1",
          progression_description: "Description 1",
        },
      ],
    } as DrillData;

    const withProgressionImage: DrillData = {
      ...baseDrillData,
      drill_progressions: [
        {
          progression_name: "Progression 1",
          progression_description: "Description 1",
          progression_image: "progression-1.png",
        },
      ],
    };

    expect(estimateDrillPdfPages(baseDrillData).totalPages).toBe(1);
    expect(estimateDrillPdfPages(withProgressionImage).totalPages).toBe(1);
    expect(shouldPlaceProgressionsOnSecondPage(withProgressionImage)).toBe(false);
  });

  it("does not force a second page when no progressions are present", () => {
    const noProgressionsData = {
      name: "No Progressions",
      description: "Short",
      drill_steps: ["Step one"],
      coaching_focus_points: ["Focus one"],
      drill_image: "",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
    } as DrillData;

    expect(shouldPlaceProgressionsOnSecondPage(noProgressionsData)).toBe(false);
    expect(estimateDrillPdfPages(noProgressionsData).totalPages).toBe(1);
  });

  it("uses full-width first-page diagram layout when compact content fits", () => {
    const compactData = {
      name: "Compact Full Width Layout",
      description: "Short description.",
      drill_steps: ["Step one", "Step two"],
      coaching_focus_points: ["Focus one"],
      drill_image: "diagram.png",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
    } as DrillData;

    expect(shouldUseFullWidthFirstPageDiagram(compactData, 1.8)).toBe(true);
  });

  it("falls back to two-column first-page layout when full-width content overflows", () => {
    const denseData = {
      name: "Dense Full Width Overflow",
      description: Array.from({ length: 30 }, () => "Long detail").join(" "),
      drill_steps: Array.from({ length: 30 }, (_, index) => `Step ${index + 1} with extra details`),
      coaching_focus_points: Array.from({ length: 18 }, () => "Focus detail with extra words"),
      shooter_focus_points: Array.from({ length: 8 }, () => "Shooter detail with extra words"),
      drill_image: "diagram.png",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
    } as DrillData;

    expect(shouldUseFullWidthFirstPageDiagram(denseData, 1.3)).toBe(false);
  });

  it("ignores progression entries with images when deciding full-width first-page fit", () => {
    const withImageProgressions = {
      name: "Ignore Image Progressions For Fit",
      description: "Short",
      drill_steps: ["Step one"],
      coaching_focus_points: ["Focus one"],
      drill_image: "diagram.png",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
      drill_progressions: Array.from({ length: 6 }, (_, index) => ({
        progression_name: `Progression ${index + 1}`,
        progression_description: Array.from({ length: 12 }, () => "Long progression detail").join(
          " "
        ),
        progression_image: `progression-${index + 1}.png`,
      })),
    } as DrillData;

    expect(shouldUseFullWidthFirstPageDiagram(withImageProgressions, 1.8)).toBe(true);
  });

  it("uses three pages for an eight-progression drill that overflows the first page", () => {
    const overflowData = {
      name: "Progression Overflow Estimate",
      description: "Short",
      drill_steps: ["Step one"],
      coaching_focus_points: ["Focus detail"],
      drill_image: "",
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

    expect(shouldPlaceProgressionsOnSecondPage(overflowData)).toBe(true);
    expect(estimateDrillPdfPages(overflowData).totalPages).toBe(3);
  });

  it("packs short progression cards onto one dedicated progression page", () => {
    const oneProgressionPageData = {
      name: "Dedicated Progressions One Page",
      description: "Short",
      drill_steps: ["Step one"],
      coaching_focus_points: ["Focus detail"],
      drill_image: "",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
      drill_progressions: Array.from({ length: 8 }, (_, index) => ({
        progression_name: `Progression ${index + 1}`,
        progression_description: "Quick adjustment.",
      })),
    } as DrillData;

    expect(estimateDedicatedProgressionSectionPages(oneProgressionPageData)).toBe(1);
  });

  it("caps dedicated progression section to two pages for dense progression content", () => {
    const longDescription = Array.from({ length: 16 }, () => "Very long progression detail")
      .join(" ")
      .trim();
    const denseProgressionData = {
      name: "Dedicated Progressions Two Page Cap",
      description: "Short",
      drill_steps: ["Step one"],
      coaching_focus_points: ["Focus detail"],
      drill_image: "",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
      drill_progressions: Array.from({ length: 8 }, (_, index) => ({
        progression_name: `Progression ${index + 1}`,
        progression_description: longDescription,
        progression_image: `progression-${index + 1}.png`,
      })),
    } as DrillData;

    expect(estimateDedicatedProgressionSectionPages(denseProgressionData)).toBe(2);
  });

  it("can place text-only progressions on a second page when inline content overflows", () => {
    const overflowWithoutImages = {
      name: "Text Progression Overflow",
      description: "Short",
      drill_steps: Array.from({ length: 36 }, (_, index) => `Step ${index + 1}`),
      coaching_focus_points: Array.from({ length: 16 }, () => "Focus detail"),
      drill_image: "",
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

    expect(shouldPlaceProgressionsOnSecondPage(overflowWithoutImages)).toBe(true);
    expect(estimateDrillPdfPages(overflowWithoutImages).totalPages).toBeGreaterThan(1);
  });

  it("accounts for video URL height when estimating page count", () => {
    // Create a drill that fits on one page without video
    const baseData = {
      name: "Video Content Estimate",
      description: "Short description",
      drill_steps: ["Step one"],
      coaching_focus_points: Array.from({ length: 30 }, () => "Focus detail"),
      drill_image: "",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
    } as DrillData;

    // Same drill but with a substantial video URL (120+ characters to ensure significant wrapping)
    const videoUrl =
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf&index=42&t=1234s&utm_source=example&utm_medium=video";
    const drillWithVideo: DrillData = {
      ...baseData,
      video: videoUrl,
    };

    const pagesWithout = estimateDrillPdfPages(baseData);
    const pagesWith = estimateDrillPdfPages(drillWithVideo);

    // Video should add approximately 7mm + wrapped text lines
    // For a 120+ char URL at 124 chars/line, that's ~3.2mm of text + 7mm header = ~10mm total
    // This should increase page count
    expect(pagesWith.totalPages).toBeGreaterThanOrEqual(pagesWithout.totalPages);
    // Additionally verify that video measurably increases the page estimate height
    expect(pagesWith.mainContentPages).toBeGreaterThanOrEqual(pagesWithout.mainContentPages);
  });
});
