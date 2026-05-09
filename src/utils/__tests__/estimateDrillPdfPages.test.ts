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
    return [];
  }

  const folders = fs
    .readdirSync(DRILLS_DIR)
    .filter((item) => fs.statSync(path.join(DRILLS_DIR, item)).isDirectory());

  return folders
    .map((folder) => {
      const ymlPath = path.join(DRILLS_DIR, folder, "drill.yml");
      if (!fs.existsSync(ymlPath)) return null;
      const content = fs.readFileSync(ymlPath, "utf8");
      const drillData = yaml.load(content) as DrillData;
      return { folder, drillData };
    })
    .filter((entry): entry is DrillEntry => entry !== null);
}

describe("estimateDrillPdfPages", () => {
  const drills = loadAllDrills();

  it("returns a page count of at least 1 for every drill", () => {
    for (const { drillData } of drills) {
      expect(estimateDrillPdfPages(drillData)).toBeGreaterThanOrEqual(1);
    }
  });

  it("reports drills estimated to need more than one page", () => {
    const multiPageDrills: string[] = [];

    for (const { folder, drillData } of drills) {
      const pages = estimateDrillPdfPages(drillData);
      if (pages > 1) {
        multiPageDrills.push(
          `${folder} ("${drillData.name}") — estimated ${pages} page(s)`
        );
      }
    }

    if (multiPageDrills.length > 0) {
      console.warn(
        "\n⚠️  Drills estimated to need more than 1 PDF page (consider shortening content):\n" +
          multiPageDrills.map((d) => `   • ${d}`).join("\n") +
          "\n"
      );
    }

    // This assertion always passes — the test exists to surface the warning, not to fail.
    expect(multiPageDrills).toBeDefined();
  });
});
