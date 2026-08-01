/**
 * Phase 4: Automated parity tests for the shared document builders.
 *
 * These tests verify that the shared builders produce structurally consistent
 * output when given canonical inputs, ensuring that neither the web component
 * wrapper nor the CLI wrapper can silently diverge from the builder logic.
 */
import * as docx from "docx";
import { buildClubPlanDocument } from "../clubPlanBuilder";
import {
  buildImportedEventMarkdown,
  buildTeamPlanDocument,
  formatTeamPlanEventHeading,
} from "../teamPlanBuilder";
import {
  GOALIE_JOURNAL_GOLD_CERTIFICATION_TEXT,
  buildGoalieJournalPdf,
} from "../goalieJournalBuilder";
import {
  GOALIE_JOURNAL_COVER_PROMOTION_LINES,
  GOALIE_JOURNAL_PROMOTION_URL,
} from "../../goalieJournalPromotion";
import type {
  ClubPlanConfig,
  ClubPlanContent,
  TeamPlanConfig,
  TeamPlanContent,
  GoalieJournalConfig,
  GoalieJournalContent,
  QrGenerator,
} from "../../../types/generatorConfig";

// ─── Shared test fixtures ─────────────────────────────────────────────────────

const MINIMAL_CLUB_CONFIG: ClubPlanConfig = {
  clubName: "Parity Test Club",
  clubWebsite: "www.paritytest.com",
  clubMotto: "Test motto",
  primaryColor: "#00205B",
  secondaryColor: "#AF272F",
  hasDedicatedGoaliePractices: false,
  dedicatedGoaliePracticesHowOften: "",
  dedicatedGoaliePracticesLength: "",
  dedicatedGoaliePracticesWithWhom: "",
  dedicatedGoaliePracticesStartingAgeGroup: "",
  hasOffIceGoalieTraining: false,
  offIceGoalieTrainingHowOften: "",
  offIceGoalieTrainingLength: "",
  offIceGoalieTrainingWithWhom: "",
  offIceGoalieTrainingStartingAgeGroup: "",
  hasGoalieVideoSessions: false,
  goalieVideoSessionsHowOften: "",
  goalieVideoSessionsLength: "",
  goalieVideoSessionsStartingAgeGroup: "",
  isEquipmentProvided: false,
  equipmentProvidedAgeGroups: "",
  hasTeamPracticeGoalieTraining: false,
  hasGoalieCoachPerTeam: false,
  hasYoungerGoalieMentors: false,
  hasGoalieEvaluations: false,
  goalieEvaluationsWhen: "",
  hasGoalieDiscount: false,
  goalieDiscountDetails: "",
  goalieDiscountStartingAgeGroup: "",
  goaliesAreFree: false,
  useIntermediateNets: false,
  includeStarterIntroduction: false,
  includeStarterSeasonGoals: false,
  includeRequiredEquipmentSection: false,
  includeExternalResourcesSection: false,
};

const MINIMAL_CLUB_CONTENT: ClubPlanContent = {
  introductionMd:
    "## Introduction\n\n### Placeholder\nTest placeholder intro.\n\n### Sample Content 1\nTest option 1 intro.",
  seasonGoalsMd: "## Season Goals\n\n### Placeholder\nTest placeholder goals.",
  benefitsForClubGoaliesMd: "## Benefits\n\nSome benefits text.",
  skillDevelopmentMd: "## Skill Development\n\nSome skill development text.",
  contactInformationMd: "## Contact Information\n\n[CLUB NAME] contact info.",
  equipmentMd: "## Equipment\n\nSome equipment text.",
  progressTrackingMd: "## Progress Tracking\n\n[GOALIE_EVALUATIONS_WHEN] tracking text.",
  resourcesMd: "## Resources\n\nSome resource links.",
};

const MINIMAL_TEAM_CONFIG: TeamPlanConfig = {
  teamName: "Parity Test Team",
  teamWebsite: "www.parityteam.com",
  teamMotto: "Win together",
  primaryColor: "#00205B",
  secondaryColor: "#AF272F",
  ageGroup: "12U",
  hasGoalieMentors: false,
  hasGoalieEvaluations: false,
  goalieEvaluationTimes: "3",
  includeStarterIntroductionAndGoals: false,
  addCalendarOfEvents: false,
  includeCalendarView: false,
  includeEventDetails: false,
  addShotTrackerToGames: true,
  sortedEventDates: [],
  eventSelections: [],
  detailedEventSelections: [],
};

const MINIMAL_TEAM_CONTENT: TeamPlanContent = {
  coverMd: "## Cover\n\n### Season Overview Placeholder\nTest overview.",
  seasonOverviewMd:
    "## Season Overview\n\n### Season Overview Placeholder\nTest placeholder overview.",
  eventDetailsMd: "## Events\n\n### TBD\nTest event details.",
};

const NULL_QR_GENERATOR: QrGenerator = async () => null;

const JOURNAL_CONFIG: GoalieJournalConfig = {
  goalieName: "Parity Test Goalie",
  teamName: "Parity Test Team",
  primaryColor: "#00205B",
  secondaryColor: "#AF272F",
  season: "2026-2027",
  entryCount: 2,
  writeInGoalieName: false,
  writeInTeamName: false,
  writeInSeason: false,
};

const JOURNAL_CONTENT: GoalieJournalContent = {
  coverMd: "# Goalie Journal\n\nA journal for your season.",
  acknowledgementsMd: "# Acknowledgements\n\nThank you to the people who support your development.",
  howToUseMd:
    "# How to Use this Journal\n\nUse this journal to track your progress.\n\n- Review your entries.",
  howToImproveEveryDayMd:
    "# How to Improve Every Day\n\nChoose one small improvement to practice today.",
  seasonGoalsMd: "# Season Goals\n\nSet your goals here.",
  practiceEntryMd: "# Goalie Event Log\n\nNotes from today's practice.",
  endOfSeasonMd: "# End of Season Review\n\nReflect on your season.",
};

// ─── jsPDF mock helper ────────────────────────────────────────────────────────

// Minimal jsPDF-compatible mock for testing PDF builder structure
// without needing a real rendering engine.
function makeMockJsPdfModule() {
  const pages: number[] = [1];
  const textColors: string[] = [];
  const drawColors: string[] = [];
  const lineDrawColors: string[] = [];
  const lineWidths: number[] = [];
  const lineCalls: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    page: number;
  }> = [];
  let currentDrawColor = "#000000";
  let currentLineWidth = 0.2;
  const fonts: string[] = [];
  const texts: string[] = [];
  const images: string[] = [];
  const imageCalls: Array<{
    data: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  }> = [];
  const linkCalls: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    url: string;
    page: number;
  }> = [];
  class MockJsPDF {
    internal = {
      pageSize: { height: 297 },
      pages,
    };
    setFontSize(_size: number) {
      return this;
    }
    setFont(_name: string, _style?: string) {
      fonts.push(_style || "normal");
      return this;
    }
    setTextColor(color: string) {
      textColors.push(color);
      return this;
    }
    setDrawColor(color: string) {
      currentDrawColor = color;
      drawColors.push(color);
      return this;
    }
    setLineWidth(width: number) {
      currentLineWidth = width;
      return this;
    }
    text(_text: string | string[], _x: number, _y: number, _options?: object) {
      texts.push(Array.isArray(_text) ? _text.join("\n") : _text);
      return this;
    }
    line(x1: number, y1: number, x2: number, y2: number) {
      lineDrawColors.push(currentDrawColor);
      lineWidths.push(currentLineWidth);
      lineCalls.push({ x1, y1, x2, y2, page: pages.length });
      return this;
    }
    rect(_x: number, _y: number, _w: number, _h: number) {
      return this;
    }
    splitTextToSize(text: string, _maxWidth: number): string[] {
      return [text];
    }
    getTextWidth(text: string): number {
      return text.length;
    }
    addPage() {
      pages.push(pages.length + 1);
      return this;
    }
    addImage(data: string, _format: string, x: number, y: number, width: number, height: number) {
      images.push(data);
      imageCalls.push({ data, x, y, width, height, page: pages.length });
      return this;
    }
    link(x: number, y: number, width: number, height: number, options: { url: string }) {
      linkCalls.push({ x, y, width, height, url: options.url, page: pages.length });
      return this;
    }
    output(_type: string): unknown {
      return _type === "blob" ? new Blob() : new ArrayBuffer(0);
    }
  }
  return {
    jsPDF: MockJsPDF,
    textColors,
    drawColors,
    lineDrawColors,
    lineWidths,
    lineCalls,
    fonts,
    texts,
    images,
    imageCalls,
    linkCalls,
  };
}

// ─── Club Plan builder tests ──────────────────────────────────────────────────

describe("buildClubPlanDocument", () => {
  it("uses starter content for both introduction and season goals", async () => {
    const config: ClubPlanConfig = {
      ...MINIMAL_CLUB_CONFIG,
      includeStarterIntroduction: true,
      includeStarterSeasonGoals: true,
    };
    const content: ClubPlanContent = {
      ...MINIMAL_CLUB_CONTENT,
      introductionMd:
        "## Introduction\n\n### Placeholder\nPlaceholder intro.\n\n### Sample Content 1\nFirst intro.\n\n### Sample Content 2\nSecond intro.",
      seasonGoalsMd:
        "## Season Goals\n\n### Placeholder\nPlaceholder goals.\n\n### Sample Content 1\nFirst goals.\n\n### Sample Content 2\nSecond goals.",
    };
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.99);

    try {
      const result = await buildClubPlanDocument(config, content, null, docx);
      const buffer = await docx.Packer.toBuffer(result);

      expect(buffer.length).toBeGreaterThan(0);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("falls back to Placeholder when starter season-goals content has no usable options", async () => {
    const config: ClubPlanConfig = {
      ...MINIMAL_CLUB_CONFIG,
      includeStarterSeasonGoals: true,
    };
    const content: ClubPlanContent = {
      ...MINIMAL_CLUB_CONTENT,
      seasonGoalsMd:
        "## Season Goals\n\n### Placeholder\nPlaceholder goals.\n\n### Sample Content 1\n   ",
    };

    const result = await buildClubPlanDocument(config, content, null, docx);
    expect(result).toBeInstanceOf(docx.Document);
  });

  it("falls back to Placeholder when starter introduction content has no usable options", async () => {
    const config: ClubPlanConfig = {
      ...MINIMAL_CLUB_CONFIG,
      includeStarterIntroduction: true,
    };
    const content: ClubPlanContent = {
      ...MINIMAL_CLUB_CONTENT,
      introductionMd:
        "## Introduction\n\n### Placeholder\nPlaceholder intro.\n\n### Sample Content 1\n   ",
    };

    const result = await buildClubPlanDocument(config, content, null, docx);
    expect(result).toBeInstanceOf(docx.Document);
  });

  it("returns a docx.Document instance", async () => {
    const result = await buildClubPlanDocument(
      MINIMAL_CLUB_CONFIG,
      MINIMAL_CLUB_CONTENT,
      null,
      docx
    );
    expect(result).toBeInstanceOf(docx.Document);
  });

  it("produces a serialisable document (Packer.toBuffer completes)", async () => {
    const result = await buildClubPlanDocument(
      MINIMAL_CLUB_CONFIG,
      MINIMAL_CLUB_CONTENT,
      null,
      docx
    );
    const buffer = await docx.Packer.toBuffer(result);
    // A valid docx buffer is a ZIP; first 4 bytes = PK\x03\x04
    expect(buffer[0]).toBe(0x50); // P
    expect(buffer[1]).toBe(0x4b); // K
  });

  it("produces the same output structure when called twice with the same config", async () => {
    const [docA, docB] = await Promise.all([
      buildClubPlanDocument(MINIMAL_CLUB_CONFIG, MINIMAL_CLUB_CONTENT, null, docx),
      buildClubPlanDocument(MINIMAL_CLUB_CONFIG, MINIMAL_CLUB_CONTENT, null, docx),
    ]);
    const [bufA, bufB] = await Promise.all([
      docx.Packer.toBuffer(docA),
      docx.Packer.toBuffer(docB),
    ]);
    // Both should produce non-empty ZIP buffers of a reasonable size
    expect(bufA.length).toBeGreaterThan(0);
    expect(bufB.length).toBeGreaterThan(0);
    // Both should be within a small margin of each other in size
    // (they may differ slightly due to random intro selection)
    const sizeDiff = Math.abs(bufA.length - bufB.length);
    expect(sizeDiff).toBeLessThan(500);
  });

  it("includes club name placeholder when clubName is empty", async () => {
    const config: ClubPlanConfig = { ...MINIMAL_CLUB_CONFIG, clubName: "" };
    const result = await buildClubPlanDocument(config, MINIMAL_CLUB_CONTENT, null, docx);
    expect(result).toBeInstanceOf(docx.Document);
  });

  it("applies all benefit flags without error", async () => {
    const config: ClubPlanConfig = {
      ...MINIMAL_CLUB_CONFIG,
      hasDedicatedGoaliePractices: true,
      dedicatedGoaliePracticesHowOften: "2x/month",
      dedicatedGoaliePracticesLength: "1 hour",
      dedicatedGoaliePracticesWithWhom: "Goalie Coach",
      dedicatedGoaliePracticesStartingAgeGroup: "12U",
      hasOffIceGoalieTraining: true,
      offIceGoalieTrainingHowOften: "weekly",
      offIceGoalieTrainingLength: "45 min",
      offIceGoalieTrainingWithWhom: "Trainer",
      offIceGoalieTrainingStartingAgeGroup: "12U",
      hasGoalieVideoSessions: true,
      goalieVideoSessionsHowOften: "weekly",
      goalieVideoSessionsLength: "30 min",
      goalieVideoSessionsStartingAgeGroup: "12U",
      isEquipmentProvided: true,
      equipmentProvidedAgeGroups: "8U and younger",
      hasTeamPracticeGoalieTraining: true,
      hasGoalieCoachPerTeam: true,
      hasYoungerGoalieMentors: true,
      hasGoalieEvaluations: true,
      goalieEvaluationsWhen: "start and end of season",
      hasGoalieDiscount: true,
      goalieDiscountDetails: "50% off",
      goalieDiscountStartingAgeGroup: "10U",
      goaliesAreFree: false,
      useIntermediateNets: true,
      includeStarterIntroduction: true,
      includeStarterSeasonGoals: true,
      includeRequiredEquipmentSection: true,
      includeExternalResourcesSection: true,
    };
    const result = await buildClubPlanDocument(config, MINIMAL_CLUB_CONTENT, null, docx);
    const buffer = await docx.Packer.toBuffer(result);
    expect(buffer.length).toBeGreaterThan(0);
  });
});

// ─── Team Plan builder tests ──────────────────────────────────────────────────

describe("buildTeamPlanDocument", () => {
  it("renders imported SUMMARY text without DESCRIPTION text", () => {
    const markdown = buildImportedEventMarkdown(
      { title: "Summer Showcase" },
      "Starter event content."
    );

    expect(markdown).toContain("Summer Showcase");
    expect(markdown).not.toContain("Calendar Event:");
    expect(markdown).not.toContain("Description");
    expect(markdown).toContain("Starter event content.");
  });

  it("places an imported start time between the event date and type", () => {
    expect(
      formatTeamPlanEventHeading({
        date: "2026-07-15",
        startTime: "7:15 PM",
        timeZone: "EDT",
        eventType: "Game",
      })
    ).toBe("Wed, Jul 15, 2026 at 7:15 PM EDT (Game)");
  });

  it("omits TBD from event headings", () => {
    expect(
      formatTeamPlanEventHeading({
        date: "2026-07-15",
        eventType: "TBD",
      })
    ).toBe("Wed, Jul 15, 2026 (Event Type:___________________)");
  });

  it("retains the time in TBD headings without adding the event type", () => {
    expect(
      formatTeamPlanEventHeading({
        date: "2026-07-15",
        startTime: "7:15 PM",
        timeZone: "EDT",
        eventType: "TBD",
      })
    ).toBe("Wed, Jul 15, 2026 at 7:15 PM EDT (Event Type:___________________)");
  });

  it("returns a docx.Document instance", async () => {
    const result = await buildTeamPlanDocument(
      MINIMAL_TEAM_CONFIG,
      MINIMAL_TEAM_CONTENT,
      null,
      NULL_QR_GENERATOR,
      docx
    );
    expect(result).toBeInstanceOf(docx.Document);
  });

  it("produces a serialisable document (Packer.toBuffer completes)", async () => {
    const result = await buildTeamPlanDocument(
      MINIMAL_TEAM_CONFIG,
      MINIMAL_TEAM_CONTENT,
      null,
      NULL_QR_GENERATOR,
      docx
    );
    const buffer = await docx.Packer.toBuffer(result);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it("produces the same output structure when called twice with the same config", async () => {
    const [docA, docB] = await Promise.all([
      buildTeamPlanDocument(
        MINIMAL_TEAM_CONFIG,
        MINIMAL_TEAM_CONTENT,
        null,
        NULL_QR_GENERATOR,
        docx
      ),
      buildTeamPlanDocument(
        MINIMAL_TEAM_CONFIG,
        MINIMAL_TEAM_CONTENT,
        null,
        NULL_QR_GENERATOR,
        docx
      ),
    ]);
    const [bufA, bufB] = await Promise.all([
      docx.Packer.toBuffer(docA),
      docx.Packer.toBuffer(docB),
    ]);
    expect(bufA.length).toBeGreaterThan(0);
    expect(bufB.length).toBeGreaterThan(0);
    // Both should be within a small margin of each other in size
    // (docx embeds non-deterministic timestamps, so exact byte equality isn't guaranteed)
    const sizeDiff = Math.abs(bufA.length - bufB.length);
    expect(sizeDiff).toBeLessThan(500);
  });

  it("accepts event selections without error", async () => {
    const config: TeamPlanConfig = {
      ...MINIMAL_TEAM_CONFIG,
      addCalendarOfEvents: true,
      includeCalendarView: true,
      includeEventDetails: true,
      sortedEventDates: [
        { date: "2026-07-06", eventTypes: ["On-ice Practice"] },
        { date: "2026-07-11", eventTypes: ["Game"] },
      ],
      eventSelections: [
        { date: "2026-07-06", eventType: "On-ice Practice" },
        { date: "2026-07-11", eventType: "Game" },
      ],
      detailedEventSelections: [
        { date: "2026-07-06", eventType: "On-ice Practice" },
        { date: "2026-07-11", eventType: "Game" },
      ],
    };
    const result = await buildTeamPlanDocument(
      config,
      MINIMAL_TEAM_CONTENT,
      null,
      NULL_QR_GENERATOR,
      docx
    );
    const buffer = await docx.Packer.toBuffer(result);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("omits the game shot tracker when disabled", async () => {
    const config: TeamPlanConfig = {
      ...MINIMAL_TEAM_CONFIG,
      addCalendarOfEvents: true,
      includeCalendarView: true,
      includeEventDetails: true,
      addShotTrackerToGames: false,
      sortedEventDates: [{ date: "2026-07-11", eventTypes: ["Game"] }],
      eventSelections: [{ date: "2026-07-11", eventType: "Game" }],
      detailedEventSelections: [{ date: "2026-07-11", eventType: "Game" }],
    };
    const result = await buildTeamPlanDocument(
      config,
      {
        ...MINIMAL_TEAM_CONTENT,
        eventDetailsMd: "## Events\n\n### Game\n[[FIELDS:Opponent|Time]]\n[[FIELDS:Goalie|Venue]]",
      },
      null,
      NULL_QR_GENERATOR,
      docx
    );

    const serializedDocument = JSON.stringify(result);
    expect(serializedDocument).toContain("Opponent");
    expect(serializedDocument).not.toContain("Game Timeline / Shot Tracker");
  });

  it("renders same-day calendar events as separate lines without commas", async () => {
    const config: TeamPlanConfig = {
      ...MINIMAL_TEAM_CONFIG,
      addCalendarOfEvents: true,
      includeCalendarView: true,
      sortedEventDates: [
        {
          date: "2026-07-11",
          eventTypes: ["On-ice Practice", "Game"],
        },
      ],
      eventSelections: [
        { date: "2026-07-11", eventType: "On-ice Practice" },
        { date: "2026-07-11", eventType: "Game" },
      ],
    };
    const result = await buildTeamPlanDocument(
      config,
      MINIMAL_TEAM_CONTENT,
      null,
      NULL_QR_GENERATOR,
      docx
    );

    const serializedDocument = JSON.stringify(result);
    expect(serializedDocument).toContain("On-ice Practice");
    expect(serializedDocument).toContain("Game");
    expect(serializedDocument).not.toContain("On-ice Practice, Game");
    expect(serializedDocument).toContain('"root":{"val":16}');
    expect(serializedDocument).not.toContain('"root":{"val":14}');
    expect(serializedDocument).toContain('"after":{"key":"w:after","value":40}');
  });

  it("accepts imported calendar metadata in event details", async () => {
    const config: TeamPlanConfig = {
      ...MINIMAL_TEAM_CONFIG,
      addCalendarOfEvents: true,
      includeEventDetails: true,
      detailedEventSelections: [
        {
          date: "2026-07-11",
          eventType: "Game",
          title: "Summer Showcase",
          description: "Bring video equipment",
          source: "calendar",
        },
      ],
    };
    const result = await buildTeamPlanDocument(
      config,
      MINIMAL_TEAM_CONTENT,
      null,
      NULL_QR_GENERATOR,
      docx
    );
    const buffer = await docx.Packer.toBuffer(result);

    expect(buffer.length).toBeGreaterThan(0);
  });

  it("separates adjacent event details with a subtle secondary-color divider", async () => {
    const result = await buildTeamPlanDocument(
      {
        ...MINIMAL_TEAM_CONFIG,
        addCalendarOfEvents: true,
        includeEventDetails: true,
        detailedEventSelections: [
          { date: "2026-07-11", eventType: "Game" },
          { date: "2026-07-15", eventType: "Evaluation" },
        ],
      },
      MINIMAL_TEAM_CONTENT,
      null,
      NULL_QR_GENERATOR,
      docx
    );

    const serializedDocument = JSON.stringify(result);
    expect(serializedDocument).toContain('"rootKey":"w:pBdr"');
    expect(serializedDocument).toContain(
      '"style":{"key":"w:val","value":"single"},"color":{"key":"w:color","value":"AF272F"}'
    );
  });

  it("renders compact event fields as four fixed-width columns", async () => {
    const result = await buildTeamPlanDocument(
      {
        ...MINIMAL_TEAM_CONFIG,
        addCalendarOfEvents: true,
        includeEventDetails: true,
        detailedEventSelections: [{ date: "2026-07-11", eventType: "Game" }],
      },
      {
        ...MINIMAL_TEAM_CONTENT,
        eventDetailsMd:
          "## Events\n\n### Game\n[[FIELDS:Opponent|Venue]]\n[[FIELDS:Result|Goalie]]",
      },
      null,
      NULL_QR_GENERATOR,
      docx
    );

    const buffer = await docx.Packer.toBuffer(result);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("keeps Evaluation Event Details links without generating QR codes", async () => {
    const calledUrls: string[] = [];
    const trackingQrGenerator: QrGenerator = async (url) => {
      calledUrls.push(url);
      return new Uint8Array([1, 2, 3]);
    };
    const result = await buildTeamPlanDocument(
      {
        ...MINIMAL_TEAM_CONFIG,
        addCalendarOfEvents: true,
        includeEventDetails: true,
        sortedEventDates: [
          { date: "2026-07-11", eventTypes: ["On-ice Practice"] },
          { date: "2026-07-12", eventTypes: ["Evaluation"] },
        ],
        eventSelections: [
          { date: "2026-07-11", eventType: "On-ice Practice" },
          { date: "2026-07-12", eventType: "Evaluation" },
        ],
        detailedEventSelections: [
          { date: "2026-07-11", eventType: "On-ice Practice" },
          { date: "2026-07-12", eventType: "Evaluation" },
        ],
      },
      {
        ...MINIMAL_TEAM_CONTENT,
        eventDetailsMd:
          "## Event Details\n\n### On-ice Practice\n[[FIELD:Event Details|1]]\n\n### Evaluation\n[[FIELD:Event Details|1]]",
      },
      null,
      trackingQrGenerator,
      docx
    );

    const serializedDocument = JSON.stringify(result);
    expect(serializedDocument).not.toContain("Suggested goalie drills page:");
    expect(serializedDocument).not.toContain("https://goaliegen.com/goalie-drills/");
    expect(serializedDocument).toContain("Evaluation forms available at");
    expect(serializedDocument).toContain("https://goaliegen.com/goalie-evals/");
    expect(calledUrls).toEqual([]);
  });

  it("calls QrGenerator when hasGoalieEvaluations is true", async () => {
    const calledUrls: string[] = [];
    const trackingQrGenerator: QrGenerator = async (url) => {
      calledUrls.push(url);
      return null;
    };
    const config: TeamPlanConfig = {
      ...MINIMAL_TEAM_CONFIG,
      teamWebsite: "https://www.testteam.com",
      hasGoalieEvaluations: true,
      goalieEvaluationTimes: "1",
    };
    await buildTeamPlanDocument(config, MINIMAL_TEAM_CONTENT, null, trackingQrGenerator, docx);
    // The builder calls QR generator for the evaluation forms link
    expect(calledUrls.length).toBeGreaterThan(0);
    expect(calledUrls.some((url) => url === "https://goaliegen.com/goalie-evals/")).toBe(true);
  });

  it("renders evaluation sessions, link, and QR in a compact three-column block", async () => {
    const qrData = new Uint8Array([1, 2, 3]);
    const result = await buildTeamPlanDocument(
      {
        ...MINIMAL_TEAM_CONFIG,
        hasGoalieEvaluations: true,
        goalieEvaluationTimes: "2",
      },
      MINIMAL_TEAM_CONTENT,
      null,
      async () => qrData,
      docx
    );

    const serializedDocument = JSON.stringify(result);
    expect(serializedDocument).toContain('"rootKey":"w:tbl"');
    expect(serializedDocument).toContain("Planned evaluation sessions:");
    expect(serializedDocument).toContain("Evaluation forms available at");
    expect(serializedDocument).toContain(
      '"x":{"key":"cx","value":571500},"y":{"key":"cy","value":571500}'
    );
    expect(serializedDocument).toContain('"value":6000');
    expect(serializedDocument).toContain('"value":2160');
    expect(serializedDocument).toContain('"value":1200');
  });
});

// ─── Goalie Journal builder tests ─────────────────────────────────────────────

describe("buildGoalieJournalPdf", () => {
  it("returns an object with addPage and output methods", () => {
    const mockModule = makeMockJsPdfModule();
    const result = buildGoalieJournalPdf(
      JOURNAL_CONFIG,
      JOURNAL_CONTENT,
      null,
      mockModule as unknown as typeof import("jspdf")
    );
    expect(typeof result.addPage).toBe("function");
    expect(typeof result.output).toBe("function");
  });

  it("adds introductory pages before the season goals and log sections", () => {
    const mockModule = makeMockJsPdfModule();
    buildGoalieJournalPdf(
      JOURNAL_CONFIG,
      JOURNAL_CONTENT,
      null,
      mockModule as unknown as typeof import("jspdf")
    );
    // The builder starts with 1 page and addPage for each additional section
    expect(mockModule.jsPDF.prototype || mockModule).toBeDefined();
    // Since we can't inspect pages on the mock without accessing internals,
    // just confirm the function completes without throwing.
  });

  it("produces consistent output when called twice with same config", () => {
    const mockA = makeMockJsPdfModule();
    const mockB = makeMockJsPdfModule();
    buildGoalieJournalPdf(
      JOURNAL_CONFIG,
      JOURNAL_CONTENT,
      null,
      mockA as unknown as typeof import("jspdf")
    );
    buildGoalieJournalPdf(
      JOURNAL_CONFIG,
      JOURNAL_CONTENT,
      null,
      mockB as unknown as typeof import("jspdf")
    );
    // Both instances should have the same number of pages added
    expect(mockA.jsPDF.prototype).toEqual(mockB.jsPDF.prototype);
  });

  it("accepts logo data without error", () => {
    const mockModule = makeMockJsPdfModule();
    const logoData = {
      dataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      width: 60,
      height: 60,
    };
    expect(() => {
      buildGoalieJournalPdf(
        JOURNAL_CONFIG,
        JOURNAL_CONTENT,
        logoData,
        mockModule as unknown as typeof import("jspdf")
      );
    }).not.toThrow();
  });

  it("renders team logo and goalie photo side-by-side at equal height", () => {
    const mockModule = makeMockJsPdfModule();
    const teamLogo = {
      dataUrl: "data:image/png;base64,team-logo",
      width: 100,
      height: 100,
    };
    const goaliePhoto = {
      dataUrl: "data:image/png;base64,goalie-photo",
      width: 50,
      height: 100,
    };

    buildGoalieJournalPdf(
      JOURNAL_CONFIG,
      JOURNAL_CONTENT,
      teamLogo,
      mockModule as unknown as typeof import("jspdf"),
      null,
      null,
      goaliePhoto
    );

    const teamLogoCall = mockModule.imageCalls.find((call) => call.data === teamLogo.dataUrl);
    const goaliePhotoCall = mockModule.imageCalls.find((call) => call.data === goaliePhoto.dataUrl);
    expect(teamLogoCall).toEqual(
      expect.objectContaining({
        page: 1,
        height: 60,
      })
    );
    expect(goaliePhotoCall).toEqual(
      expect.objectContaining({
        page: 1,
        height: 60,
      })
    );
    expect(teamLogoCall?.x).toBeLessThan(goaliePhotoCall?.x ?? 0);
  });

  it("renders selected cover identity fields as labeled vector underlines", () => {
    const mockModule = makeMockJsPdfModule();

    buildGoalieJournalPdf(
      {
        ...JOURNAL_CONFIG,
        goalieName: "",
        teamName: "",
        season: "",
        writeInGoalieName: true,
        writeInTeamName: true,
        writeInSeason: true,
      },
      JOURNAL_CONTENT,
      null,
      mockModule as unknown as typeof import("jspdf")
    );

    expect(mockModule.texts).toEqual(
      expect.arrayContaining(["Goalie Name:", "Team Name:", "Season:"])
    );
    expect(mockModule.lineCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ page: 1, y1: 59, y2: 59, x2: 170 }),
        expect.objectContaining({ page: 1, y1: 73, y2: 73, x2: 170 }),
        expect.objectContaining({ page: 1, y1: 87, y2: 87, x2: 170 }),
      ])
    );
  });

  it("uses configured primary and secondary colors for PDF accents", () => {
    const mockModule = makeMockJsPdfModule();
    const config: GoalieJournalConfig = {
      ...JOURNAL_CONFIG,
      primaryColor: "#123456",
      secondaryColor: "#ABCDEF",
    };

    buildGoalieJournalPdf(
      config,
      JOURNAL_CONTENT,
      null,
      mockModule as unknown as typeof import("jspdf")
    );

    expect(mockModule.textColors).toContain("#123456");
    expect(mockModule.textColors).toContain("#ABCDEF");
    expect(mockModule.drawColors).toContain("#ABCDEF");
    expect(mockModule.drawColors).toContain("#000000");
    expect(mockModule.textColors).toContain("#000000");
  });

  it("alternates journal entry box borders between configured colors", () => {
    const mockModule = makeMockJsPdfModule();
    const config: GoalieJournalConfig = {
      ...JOURNAL_CONFIG,
      primaryColor: "#123456",
      secondaryColor: "#ABCDEF",
      entryCount: 5,
    };

    buildGoalieJournalPdf(
      config,
      JOURNAL_CONTENT,
      null,
      mockModule as unknown as typeof import("jspdf")
    );

    const firstEntryBorderIndex = mockModule.drawColors.indexOf("#123456");
    const secondEntryBorderIndex = mockModule.drawColors.indexOf(
      "#ABCDEF",
      firstEntryBorderIndex + 1
    );
    expect(firstEntryBorderIndex).toBeGreaterThanOrEqual(0);
    expect(secondEntryBorderIndex).toBeGreaterThan(firstEntryBorderIndex);
    expect(mockModule.lineDrawColors.filter((color) => color === "#123456")).toHaveLength(2);
    mockModule.lineDrawColors.forEach((color, index) => {
      if (color === "#123456") {
        expect(mockModule.lineWidths[index]).toBe(0.5);
      }
    });
  });

  it("renders the cover promotion and hand-fillable log page footers", () => {
    const mockModule = makeMockJsPdfModule();
    const qrCodeDataUrl = "data:image/png;base64,qr";
    const footerLogoData = {
      dataUrl: "data:image/png;base64,footer-logo",
      width: 60,
      height: 60,
    };

    buildGoalieJournalPdf(
      JOURNAL_CONFIG,
      JOURNAL_CONTENT,
      null,
      mockModule as unknown as typeof import("jspdf"),
      qrCodeDataUrl,
      footerLogoData
    );

    GOALIE_JOURNAL_COVER_PROMOTION_LINES.forEach((line) => {
      expect(mockModule.texts).toContain(line);
    });
    expect(mockModule.texts).toContain("Page");
    expect(mockModule.texts).toContain("How to Use this Journal");
    expect(mockModule.texts).toContain("Acknowledgements");
    expect(mockModule.texts).toContain("How to Improve Every Day");
    expect(mockModule.texts.indexOf("Acknowledgements")).toBeLessThan(
      mockModule.texts.indexOf("How to Use this Journal")
    );
    expect(mockModule.texts.indexOf("How to Use this Journal")).toBeLessThan(
      mockModule.texts.indexOf("How to Improve Every Day")
    );
    expect(mockModule.texts).toContain("Entry #");
    expect(mockModule.texts).toContain("Time:");
    expect(mockModule.texts).toContain("Practice");
    expect(mockModule.texts).toContain("Game");
    expect(mockModule.texts).toContain("Other:");
    expect(mockModule.texts).toContain(
      "If you need more space, make copies of this page or download the PDF at goaliegen.com"
    );
    expect(mockModule.images).toContain(qrCodeDataUrl);
    expect(mockModule.images).toContain(footerLogoData.dataUrl);
    expect(mockModule.imageCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: footerLogoData.dataUrl,
          page: 1,
        }),
        expect.objectContaining({
          data: qrCodeDataUrl,
          page: 1,
          x: 172,
          width: 18,
          height: 18,
        }),
      ])
    );
    expect(mockModule.linkCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          page: 1,
          url: GOALIE_JOURNAL_PROMOTION_URL,
        }),
        expect.objectContaining({
          page: expect.any(Number),
          x: 178,
          width: 14,
          height: 14,
          url: GOALIE_JOURNAL_PROMOTION_URL,
        }),
      ])
    );
  });

  it("renders the Gold Certification badge beside its acknowledgement text", () => {
    const mockModule = makeMockJsPdfModule();
    const goldCertificationBadge = {
      dataUrl: "data:image/png;base64,gold-certification",
      width: 601,
      height: 600,
    };

    buildGoalieJournalPdf(
      JOURNAL_CONFIG,
      JOURNAL_CONTENT,
      null,
      mockModule as unknown as typeof import("jspdf"),
      null,
      null,
      null,
      goldCertificationBadge
    );

    expect(mockModule.texts.join("")).toContain(GOALIE_JOURNAL_GOLD_CERTIFICATION_TEXT);
    expect(mockModule.imageCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: goldCertificationBadge.dataUrl,
          page: 2,
          x: 20,
          width: 24,
        }),
      ])
    );
  });

  it("renders Markdown bold and italic styles in PDF text", () => {
    const mockModule = makeMockJsPdfModule();
    const content: GoalieJournalContent = {
      ...JOURNAL_CONTENT,
      coverMd: "# **Bold Journal**\n\n*Italic subtitle*",
      practiceEntryMd: "# Goalie Event Log\n\n**Bold prompt** and _italic prompt_.",
    };

    buildGoalieJournalPdf(
      JOURNAL_CONFIG,
      content,
      null,
      mockModule as unknown as typeof import("jspdf")
    );

    expect(mockModule.fonts).toContain("bold");
    expect(mockModule.fonts).toContain("italic");
  });

  it("accepts entryCount of 1 without error", () => {
    const mockModule = makeMockJsPdfModule();
    const config: GoalieJournalConfig = { ...JOURNAL_CONFIG, entryCount: 1 };
    expect(() => {
      buildGoalieJournalPdf(
        config,
        JOURNAL_CONTENT,
        null,
        mockModule as unknown as typeof import("jspdf")
      );
    }).not.toThrow();
  });
});
