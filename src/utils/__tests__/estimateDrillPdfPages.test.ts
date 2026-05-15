import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import type { DrillData } from "../../types/drill";
import { estimateDrillPdfPages } from "../estimateDrillPdfPages";

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
        team_drill: ["no"],
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
        team_drill: ["no"],
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
        team_drill: ["no"],
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

  it("accounts for a long drill name that expands the header when estimating page count", () => {
    // 22 short coaching points produces content just under the short-name first-page limit
    // but just over the long-name first-page limit (the expanded header reduces available
    // space by ~5 mm, which is enough to push this drill to a second page).
    const baseDrillData = {
      name: "Short Name",
      description: "Short",
      drill_steps: [] as string[],
      coaching_focus_points: Array.from({ length: 22 }, () => "quick"),
      drill_image: "",
      tags: {
        team_drill: ["no"],
      },
      drill_creation_date: "2026-01-01",
    } as DrillData;

    // Name > 80 chars wraps to 3 lines in the header title area (TITLE_CHARS_PER_LINE = 40),
    // reducing available first-page space by ~5 mm compared to a short, single-line name.
    const longNameDrillData: DrillData = {
      ...baseDrillData,
      name: "A Very Long Drill Name That Must Wrap to Three Lines in the PDF Header Title Area",
    };

    expect(estimateDrillPdfPages(baseDrillData)).toBe(1);
    expect(estimateDrillPdfPages(longNameDrillData)).toBe(2);
  });
});
