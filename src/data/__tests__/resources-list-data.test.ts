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

    it("every item has a 'link' that is a valid HTTPS URL", () => {
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

  // ── Cross-file consistency ────────────────────────────────────────────────
  describe("cross-file consistency", () => {
    const FILES = [
      "club-resources-list.yml",
      "coach-resources-list.yml",
      "goalie-resources-list.yml",
    ];

    it("all three resource list files are present in src/data/", () => {
      for (const file of FILES) {
        expect(fs.existsSync(path.join(DATA_DIR, file))).toBe(true);
      }
    });

    it("each file starts with its expected lead resource", () => {
      const expectedFirstItems = {
        "club-resources-list.yml": {
          name: "How to Structure a Goaltending Development Program - Hiroki Wakabayashi",
          link: "https://worldhockeylab.com/how_to_structure_a_goaltending_development_program/",
        },
        "coach-resources-list.yml": {
          name: "USA Hockey Goaltender Basics",
          link: "https://www.usahockeygoaltending.com/page/show/866192-goaltender-basics",
        },
        "goalie-resources-list.yml": {
          name: "USA Hockey Goaltender Basics",
          link: "https://www.usahockeygoaltending.com/page/show/866192-goaltender-basics",
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
});
