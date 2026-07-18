/**
 * Schema and content validation tests for the resources-list YAML source files.
 *
 * These tests read YAML files directly from disk (bypassing webpack/Jest
 * moduleNameMapper) to validate that each file stays well-formed and that
 * every resource item meets the expected schema before it ever reaches the UI.
 *
 * Add new assertions here whenever the ResourceItem schema gains new required
 * fields or new constraints (e.g. allowed domains, maximum description length).
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import type { ResourceListData, ResourceItem } from "../../types/resources";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(__dirname, "../../../src/data");

/**
 * Loads and parses a resources-list YAML file by name.
 * Throws if the file is missing or unparsable.
 */
function loadResourceList(fileName: string): ResourceListData {
  const filePath = path.join(DATA_DIR, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  return yaml.load(raw, { schema: yaml.FAILSAFE_SCHEMA }) as ResourceListData;
}

/**
 * Returns true if the string is a syntactically valid, absolute HTTPS URL.
 */
function isValidHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Shared schema validator — run against every YAML file
// ---------------------------------------------------------------------------

function validateResourceListFile(fileName: string) {
  describe(fileName, () => {
    let data: ResourceListData;
    let items: ResourceItem[];

    beforeAll(() => {
      data = loadResourceList(fileName);
      items = data["resource-list"];
    });

    it("has a top-level 'resource-list' key", () => {
      expect(data).toHaveProperty("resource-list");
    });

    it("'resource-list' is a non-empty array", () => {
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it("every item has a non-empty 'name' string", () => {
      for (const item of items) {
        expect(typeof item.name).toBe("string");
        expect(item.name.trim().length).toBeGreaterThan(0);
      }
    });

    it("every item has a non-empty 'description' string", () => {
      for (const item of items) {
        expect(typeof item.description).toBe("string");
        expect(item.description.trim().length).toBeGreaterThan(0);
      }
    });

    it("every item has a valid external HTTPS URL", () => {
      for (const item of items) {
        expect(typeof item.link).toBe("string");
        expect(isValidHttpsUrl(item.link)).toBe(true);
      }
    });

    it("has no duplicate 'link' values", () => {
      const links = items.map((item) => item.link);
      const uniqueLinks = new Set(links);
      expect(uniqueLinks.size).toBe(links.length);
    });

    it("has no duplicate 'name' values", () => {
      const names = items.map((item) => item.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("every item has no unexpected extra keys", () => {
      const allowedKeys = new Set(["name", "description", "link"]);
      for (const item of items) {
        const extraKeys = Object.keys(item).filter((k) => !allowedKeys.has(k));
        expect(extraKeys).toHaveLength(0);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Per-file content checks
// ---------------------------------------------------------------------------

describe("resources-list YAML source files", () => {
  // ── Schema validation (runs for every file) ──────────────────────────────
  validateResourceListFile("club-resources-list.yml");
  validateResourceListFile("coach-resources-list.yml");
  validateResourceListFile("goalie-resources-list.yml");
  validateResourceListFile("equipment-fitting-resources-list.yml");

  // ── Cross-file consistency ────────────────────────────────────────────────
  describe("cross-file consistency", () => {
    const FILES = [
      "club-resources-list.yml",
      "coach-resources-list.yml",
      "goalie-resources-list.yml",
      "equipment-fitting-resources-list.yml",
    ] as const;

    it("all three resource list files are present in src/data/", () => {
      for (const file of FILES) {
        expect(fs.existsSync(path.join(DATA_DIR, file))).toBe(true);
      }
    });

    it("each file starts with its expected lead resource", () => {
      const expectedFirstItems = {
        "club-resources-list.yml": {
          name: "USA Hockey Goaltending Homepage",
          link: "https://www.usahockey.com/goaltending",
        },
        "coach-resources-list.yml": {
          name: "USA Hockey Goaltending Homepage",
          link: "https://www.usahockey.com/goaltending",
        },
        "goalie-resources-list.yml": {
          name: "USA Hockey Goaltending Homepage",
          link: "https://www.usahockey.com/goaltending",
        },
        "equipment-fitting-resources-list.yml": {
          name: "USA Hockey Goaltending Equipment Fitting Guidance",
          link: "https://www.usahockeygoaltending.com/page/show/866196-equipment",
        },
      } as const;

      for (const file of FILES) {
        const data = loadResourceList(file);
        const first = data["resource-list"][0];
        expect(first.name).toBe(expectedFirstItems[file].name);
        expect(first.link).toBe(expectedFirstItems[file].link);
      }
    });
  });

  // ── Spot-check known content ──────────────────────────────────────────────
  describe("club-resources-list.yml known content", () => {
    it("contains the USA Hockey Goaltending link", () => {
      const data = loadResourceList("club-resources-list.yml");
      const links = data["resource-list"].map((i) => i.link);
      expect(links).toContain("https://www.usahockey.com/goaltending");
    });
  });

  describe("coach-resources-list.yml known content", () => {
    it("contains the USA Hockey Goalie Plans link", () => {
      const data = loadResourceList("coach-resources-list.yml");
      const links = data["resource-list"].map((i) => i.link);
      expect(links).toContain("https://www.usahockey.com/goaltendingplans");
    });
  });

  describe("stance and movement basics resource", () => {
    it("uses the requested name and description in all resource lists", () => {
      const expected = {
        name: "USA Hockey Goaltending Stance and Movement Basics",
        description:
          "Detailed descriptions and video demonstrations of the primary stance, positioning, and movement techniques that serve as the foundation for all goalie development.",
        link: "https://www.usahockeygoaltending.com/page/show/866192-goaltender-basics",
      };

      for (const file of [
        "club-resources-list.yml",
        "coach-resources-list.yml",
        "goalie-resources-list.yml",
      ]) {
        const item = loadResourceList(file)["resource-list"].find(
          (resource) => resource.link === expected.link
        );
        expect(item).toEqual(expected);
      }
    });
  });

  describe("equipment-fitting-resources-list.yml known content", () => {
    it("contains the supplied manufacturer and fitting resources", () => {
      const data = loadResourceList("equipment-fitting-resources-list.yml");
      const links = data["resource-list"].map((i) => i.link);

      expect(links).toEqual(
        expect.arrayContaining([
          "https://www.usahockeygoaltending.com/page/show/866196-equipment",
          "https://www.bauer.com/pages/size-guide-goalie-pads",
          "https://www.goalies-only.com/fit-guide/",
          "https://us.ccmhockey.com/Goalie/Category/Pads",
          "https://www.true-sports.com/",
          "https://vaughnhockey.com/",
          "https://www.warrior.com/en/guide/hockey-goalie-leg-pad-sizing",
        ])
      );
    });
  });

  describe("equipment-fitting page links", () => {
    it("is excluded from all external resource lists", () => {
      for (const file of [
        "club-resources-list.yml",
        "coach-resources-list.yml",
        "goalie-resources-list.yml",
      ]) {
        const data = loadResourceList(file);
        expect(data["resource-list"].map((item) => item.link)).not.toContain("/equipment-fitting");
      }
    });
  });
});
