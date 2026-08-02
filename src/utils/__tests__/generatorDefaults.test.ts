import {
  extractLevel3SectionsByPrefix,
  getDefaultJournalSeason,
  getEventContentMarkdown,
  getSeasonOverviewMarkdown,
  normalizeJournalSeason,
  normalizeJournalSeasonGoals,
  parseJournalEntryCount,
  sanitizeJournalFilenamePart,
  selectRandomLevel3Section,
} from "../generatorDefaults";

const seasonOverviewMd = `## Season Overview

### Season Overview Placeholder

[SEASON_OVERVIEW_SELECTED]

### All Ages Starter Content

[SEASON_OVERVIEW_ALL_AGES_STARTER]

### 8U Starter Content

[SEASON_OVERVIEW_8U_STARTER]

### 10U Starter Content

[SEASON_OVERVIEW_10U_STARTER]

### 12U Starter Content

[SEASON_OVERVIEW_12U_STARTER]

### 14U Starter Content

[SEASON_OVERVIEW_14U_STARTER]

### 16U and older Starter Content

[SEASON_OVERVIEW_16U_AND_OLDER_STARTER]
`;

describe("goalie journal defaults", () => {
  it("builds the default season from the supplied date", () => {
    expect(getDefaultJournalSeason(new Date("2026-08-01T12:00:00Z"))).toBe("2026-2027");
  });

  it("normalizes non-empty free-form seasons", () => {
    expect(normalizeJournalSeason("  Middle-School  ")).toBe("Middle-School");
    expect(normalizeJournalSeason("   ")).toBeNull();
  });

  it("normalizes up to three nonblank Season Goals", () => {
    expect(
      normalizeJournalSeasonGoals([" First goal ", " ", "Second goal", "Third goal", "Fourth goal"])
    ).toEqual(["First goal", "Second goal", "Third goal"]);
  });

  it.each([
    ["1", 1],
    ["24", 24],
    ["100", 100],
    [24, 24],
  ])("parses valid journal entry count %p", (value, expected) => {
    expect(parseJournalEntryCount(value)).toBe(expected);
  });

  it.each(["", "0", "101", "1.5", "abc", -1, 24.5])(
    "rejects invalid journal entry count %p",
    (value) => {
      expect(parseJournalEntryCount(value)).toBeNull();
    }
  );

  it("sanitizes free-form values for journal filenames", () => {
    expect(sanitizeJournalFilenamePart(" Middle / School ", "Season")).toBe("Middle_School");
    expect(sanitizeJournalFilenamePart("...", "Season")).toBe("Season");
  });
});

describe("getSeasonOverviewMarkdown", () => {
  it("uses all-ages content followed by the selected age-group content", () => {
    const markdown = getSeasonOverviewMarkdown(true, "14U", seasonOverviewMd);
    expect(markdown).toContain("[SEASON_OVERVIEW_ALL_AGES_STARTER]");
    expect(markdown).toContain("[SEASON_OVERVIEW_14U_STARTER]");
    expect(markdown.indexOf("[SEASON_OVERVIEW_ALL_AGES_STARTER]")).toBeLessThan(
      markdown.indexOf("[SEASON_OVERVIEW_14U_STARTER]")
    );
    expect(markdown).toContain(
      "[SEASON_OVERVIEW_ALL_AGES_STARTER]\n\n[SEASON_OVERVIEW_14U_STARTER]"
    );
  });

  describe("getEventContentMarkdown", () => {
    const eventDetailsMd = [
      "## Event Details",
      "",
      "### TBD",
      "TBD content.",
      "",
      "### On-ice Practice",
      "Practice content.",
      "",
      "### Off-ice Practice",
      "Off-ice content.",
      "",
      "### Video Review",
      "Video content.",
      "",
      "### Evaluation",
      "Evaluation content.",
      "",
      "### Game",
      "Game content.",
    ].join("\n");

    it.each([
      ["On-ice Practice", "Practice content."],
      ["Off-ice Practice", "Off-ice content."],
      ["Video Review", "Video content."],
      ["Evaluation", "Evaluation content."],
      ["Game", "Game content."],
      ["TBD", "TBD content."],
    ])("uses the exact event-type section for %s", (eventType, expectedContent) => {
      expect(getEventContentMarkdown(eventType, eventDetailsMd)).toBe(expectedContent);
    });

    it("uses the event-type-specific placeholder when its section is missing", () => {
      expect(getEventContentMarkdown("Game", "## Event Details")).toBe(
        "[EVENT_DETAILS_GAME_CONTENT]"
      );
      expect(getEventContentMarkdown("Off-ice Practice", "## Event Details")).toBe(
        "[EVENT_DETAILS_OFF_ICE_CONTENT]"
      );
    });

    it("uses the selected placeholder for unknown event types", () => {
      expect(getEventContentMarkdown("Custom Event", "## Event Details")).toBe(
        "[EVENT_DETAILS_SELECTED]"
      );
    });
  });

  it("uses the season overview placeholder when starter content is disabled", () => {
    const markdown = getSeasonOverviewMarkdown(false, "14U", seasonOverviewMd);
    expect(markdown).toContain("[SEASON_OVERVIEW_SELECTED]");
    expect(markdown).not.toContain("[SEASON_OVERVIEW_ALL_AGES_STARTER]");
    expect(markdown).not.toContain("[SEASON_OVERVIEW_14U_STARTER]");
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
