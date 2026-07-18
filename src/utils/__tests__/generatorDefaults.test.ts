import {
  extractLevel3SectionsByPrefix,
  getSeasonOverviewMarkdown,
  selectRandomLevel3Section,
} from "../generatorDefaults";

const seasonOverviewMd = `## Season Overview

### Selected Overview Placeholder

[SEASON_OVERVIEW_SELECTED]

### 8U Starter Content Placeholder

[SEASON_OVERVIEW_8U_STARTER]

### 10U Starter Content Placeholder

[SEASON_OVERVIEW_10U_STARTER]

### 12U Starter Content Placeholder

[SEASON_OVERVIEW_12U_STARTER]

### 14U Starter Content Placeholder

[SEASON_OVERVIEW_14U_STARTER]

### 16U and older Starter Content Placeholder

[SEASON_OVERVIEW_16U_AND_OLDER_STARTER]
`;

describe("getSeasonOverviewMarkdown", () => {
  it("uses 14U starter content for 14U selections", () => {
    const markdown = getSeasonOverviewMarkdown(true, "14U", seasonOverviewMd);
    expect(markdown).toContain("[SEASON_OVERVIEW_14U_STARTER]");
  });

  describe("level-3 sample content selection", () => {
    const markdown = [
      "### Placeholder",
      "Placeholder content.",
      "",
      "### Sample Content 1",
      "First sample.",
      "",
      "### Sample Content - Formal",
      " ",
      "",
      "### Sample Content 2",
      "Second sample.",
    ].join("\n");

    it("discovers non-empty sections by heading prefix", () => {
      expect(extractLevel3SectionsByPrefix(markdown, "Sample Content")).toEqual([
        "First sample.",
        "Second sample.",
      ]);
    });

    it("selects a discovered section using the random index", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.99);

      try {
        expect(selectRandomLevel3Section(markdown, "Sample Content", "Placeholder")).toBe(
          "Second sample."
        );
      } finally {
        randomSpy.mockRestore();
      }
    });

    it("falls back to the named section when no matching section is usable", () => {
      expect(
        selectRandomLevel3Section(
          "### Placeholder\nFallback content.\n\n### Sample Content 1\n ",
          "Sample Content",
          "Placeholder"
        )
      ).toBe("Fallback content.");
    });

    it("uses the named section when sample content is disabled", () => {
      expect(selectRandomLevel3Section(markdown, "Sample Content", "Placeholder", false)).toBe(
        "Placeholder content."
      );
    });
  });

  it("uses 16U and older starter content for 16U and older selections", () => {
    const markdown = getSeasonOverviewMarkdown(true, "16U and older", seasonOverviewMd);
    expect(markdown).toContain("[SEASON_OVERVIEW_16U_AND_OLDER_STARTER]");
  });
});
