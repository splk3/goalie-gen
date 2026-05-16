import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import type { DrillData } from "../../types/drill";
import {
  estimateDrillPdfPages,
  shouldPlaceProgressionsOnSecondPage,
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

  it("loads at least one drill from the drills directory", () => {
    expect(drills.length).toBeGreaterThan(0);
  });

  it("returns a page count of at least 1 for every drill", () => {
    for (const { drillData } of drills) {
      expect(estimateDrillPdfPages(drillData)).toBeGreaterThanOrEqual(1);
    }
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

    expect(estimateDrillPdfPages(drillData)).toBe(2);
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

    expect(softWrappedEstimate).toBe(spaceWrappedEstimate);
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

    expect(withoutSteps).toBe(2);
    expect(withSteps).toBeGreaterThan(withoutSteps);
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

    expect(estimateDrillPdfPages(baseDrillData)).toBe(1);
    expect(estimateDrillPdfPages(longNameDrillData)).toBeGreaterThanOrEqual(
      estimateDrillPdfPages(baseDrillData)
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

    expect(estimateDrillPdfPages(baseDrillData)).toBe(1);
    expect(estimateDrillPdfPages(withProgressionImage)).toBe(1);
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
    expect(estimateDrillPdfPages(noProgressionsData)).toBe(1);
  });

  it("places progressions on a second page when full drill content cannot fit one page", () => {
    const overflowData = {
      name: "Progression Overflow Estimate",
      description: "Short",
      drill_steps: Array.from({ length: 40 }, (_, index) => `Step ${index + 1}`),
      coaching_focus_points: Array.from({ length: 20 }, () => "Focus detail"),
      drill_image: "",
      tags: {
        team_drill: "no",
      },
      drill_creation_date: "2026-01-01",
      drill_progressions: [
        {
          progression_name: "Progression 1",
          progression_description: "Description 1",
          progression_image: "progression-1.png",
        },
      ],
    } as DrillData;

    expect(shouldPlaceProgressionsOnSecondPage(overflowData)).toBe(true);
    expect(estimateDrillPdfPages(overflowData)).toBeGreaterThan(1);
  });
});
