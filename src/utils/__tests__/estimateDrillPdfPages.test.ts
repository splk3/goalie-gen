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
      coaching_focus_points: Array.from({ length: 50 }, () => shortPoint),
      shooter_focus_points: Array.from({ length: 10 }, () => shortPoint),
      images: [],
      tags: {
        team_drill: ["no"],
      },
      drill_creation_date: "2026-01-01",
    } as DrillData;

    expect(estimateDrillPdfPages(drillData)).toBe(2);
  });
});
