import * as React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GenerateTeamPlanButton from "../GenerateTeamPlanButton";
import { loadDocxModule } from "../../utils/loadExportModules";
import * as teamPlanCalendarGrid from "../../utils/teamPlanCalendarGrid";

jest.mock("../../utils/analytics", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../utils/loadExportModules", () => ({
  loadDocxModule: jest.fn(),
}));

jest.mock(
  "../../content/team-plan/event-details.md",
  () => `## Event Details

### Selected Event Content
[EVENT_DETAILS_SELECTED]

### Practice Event Content
[EVENT_DETAILS_PRACTICE_CONTENT]

### Game Event Content
[[FIELDS:Opponent|Time]]
[[FIELDS:Goalie|Venue]]
[[FIELD:Game Notes|4]]

### Tournament Event Content
[EVENT_DETAILS_TOURNAMENT_CONTENT]

### Off-Ice Event Content
[EVENT_DETAILS_OFF_ICE_CONTENT]`
);

jest.mock("../Logo", () => {
  function MockLogo() {
    return <div data-testid="logo" />;
  }

  return MockLogo;
});

jest.mock("../ImageUploader", () => {
  function MockImageUploader() {
    return <div data-testid="image-uploader" />;
  }

  return MockImageUploader;
});

const mockedLoadDocxModule = jest.mocked(loadDocxModule);

beforeEach(() => {
  mockedLoadDocxModule.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function openModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /generate team development plan/i }));
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Team Name"), "Springfield Goalies");
  await user.selectOptions(screen.getByLabelText("Age Group"), "10U");
}

function getCalendarEventTypesFieldset(): HTMLElement {
  const label = screen.getByText("Calendar Event Types");
  const fieldset = label.closest("fieldset");
  if (!fieldset) {
    throw new Error("Calendar Event Types fieldset not found");
  }
  return fieldset;
}

function getDetailedEntryEventTypesFieldset(): HTMLElement {
  const label = screen.getByText("Event Types for Detailed Entries");
  const fieldset = label.closest("fieldset");
  if (!fieldset) {
    throw new Error("Event Types for Detailed Entries fieldset not found");
  }
  return fieldset;
}

function getTestIcsDateTime(daysFromToday: number, hour: number): string {
  const today = new Date();
  const date = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + daysFromToday, hour)
  );
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `${datePart}T${String(hour).padStart(2, "0")}0000Z`;
}

describe("GenerateTeamPlanButton", () => {
  it("shows DOCX-only UI and team-specific fields", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);

    expect(screen.getByLabelText("Team Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Team/Club Website (Optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Team/Club Motto/Mission (Optional)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Skill Level")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Number of Practices (0-50)")).not.toBeInTheDocument();
    expect(screen.queryByText(/output format/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /word/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /pdf/i })).not.toBeInTheDocument();
  });

  it("shows updated age group options", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);

    const ageGroupSelect = screen.getByLabelText("Age Group");
    expect(within(ageGroupSelect).getByRole("option", { name: "14U" })).toBeInTheDocument();
    expect(
      within(ageGroupSelect).getByRole("option", { name: "16U and older" })
    ).toBeInTheDocument();
    expect(within(ageGroupSelect).queryByRole("option", { name: "14U+" })).not.toBeInTheDocument();
  });

  it("shows primary and secondary team color controls with USA defaults", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);

    const primaryColorPicker = screen.getByLabelText("Primary Team Color");
    const primaryHexInput = screen.getByLabelText("Primary Team Color Hex");
    const secondaryColorPicker = screen.getByLabelText("Secondary Team Color");
    const secondaryHexInput = screen.getByLabelText("Secondary Team Color Hex");

    expect(primaryColorPicker).toHaveValue("#00205b");
    expect(primaryHexInput).toHaveValue("#00205B");
    expect(secondaryColorPicker).toHaveValue("#af272f");
    expect(secondaryHexInput).toHaveValue("#AF272F");

    await user.clear(secondaryHexInput);
    await user.type(secondaryHexInput, "#654321");

    expect(secondaryColorPicker).toHaveValue("#654321");
  });

  it("renders new team-plan toggles with expected defaults", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);

    expect(
      screen.getByRole("switch", { name: "Add suggested goalie drill for each practice?" })
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("switch", {
        name: "Does this team have a goalie mentor(s) from an older team(s)?",
      })
    ).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: "Do goalies receive evaluations?" })).toHaveAttribute(
      "aria-checked",
      "false"
    );
    expect(
      screen.getByRole("switch", { name: "Add starter content for introduction and season goals?" })
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("switch", { name: "Add calendar of events?" })).toHaveAttribute(
      "aria-checked",
      "false"
    );
    expect(screen.queryByText("Event Planning")).not.toBeInTheDocument();
  });

  it("keeps switch thumb aligned and track classes consistent across enabled/disabled states", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);

    const enabledSwitch = screen.getByRole("switch", {
      name: "Add suggested goalie drill for each practice?",
    });
    const disabledSwitch = screen.getByRole("switch", {
      name: "Does this team have a goalie mentor(s) from an older team(s)?",
    });
    const enabledThumb = enabledSwitch.querySelector("span");
    const disabledThumb = disabledSwitch.querySelector("span");

    expect(enabledSwitch).toHaveClass("overflow-hidden", "w-11", "bg-usa-blue", "dark:bg-blue-500");
    expect(disabledSwitch).toHaveClass(
      "overflow-hidden",
      "w-11",
      "bg-gray-400",
      "dark:bg-gray-600"
    );
    expect(enabledThumb).toHaveClass("translate-x-5");
    expect(disabledThumb).toHaveClass("translate-x-0");
    expect(enabledThumb).not.toHaveClass("translate-x-6");
    expect(disabledThumb).not.toHaveClass("translate-x-6");

    await user.click(enabledSwitch);
    expect(enabledThumb).toHaveClass("translate-x-0");
    expect(enabledSwitch).toHaveClass("bg-gray-400", "dark:bg-gray-600");
  });

  it("shows evaluation count input only when evaluations are enabled and defaults it to 3", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);

    expect(
      screen.queryByLabelText("Number of evaluation times during season")
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Do goalies receive evaluations?" }));

    const evaluationsInput = screen.getByLabelText("Number of evaluation times during season");
    expect(evaluationsInput).toBeInTheDocument();
    expect(evaluationsInput).toHaveValue(3);
  });

  it("validates evaluation times as a positive whole number when evaluations are enabled", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("switch", { name: "Do goalies receive evaluations?" }));

    const evaluationsInput = screen.getByLabelText("Number of evaluation times during season");
    await user.clear(evaluationsInput);
    await user.type(evaluationsInput, "1.5");

    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(
      screen.getByText("Evaluation times must be a positive whole number")
    ).toBeInTheDocument();
  });

  it("generates team plan doc without practice plans section", async () => {
    const user = userEvent.setup();
    const mockDocument = jest.fn((config) => ({ config }));
    const mockParagraph = jest.fn((options) => ({ options }));
    const mockTextRun = jest.fn((options) => ({ options }));

    mockedLoadDocxModule.mockResolvedValue({
      AlignmentType: { CENTER: "CENTER", LEFT: "LEFT" },
      Document: mockDocument,
      ExternalHyperlink: jest.fn((options) => ({ options })),
      HeadingLevel: { HEADING_1: "H1", HEADING_2: "H2", HEADING_3: "H3" },
      ImageRun: jest.fn((options) => ({ options })),
      Packer: { toBlob: jest.fn(async () => new Blob(["test-doc"])) },
      Paragraph: mockParagraph,
      Table: jest.fn((options) => ({ options })),
      TableCell: jest.fn((options) => ({ options })),
      TableLayoutType: { FIXED: "FIXED" },
      TableRow: jest.fn((options) => ({ options })),
      TextRun: mockTextRun,
      VerticalAlign: { CENTER: "CENTER", TOP: "TOP" },
      WidthType: { PERCENTAGE: "PERCENTAGE", DXA: "DXA" },
      Header: jest.fn((options) => ({ options })),
      Footer: jest.fn((options) => ({ options })),
      BorderStyle: { SINGLE: "SINGLE" },
      TabStopType: { RIGHT: "RIGHT", LEFT: "LEFT" },
      PageNumber: { CURRENT: "CURRENT", TOTAL_PAGES: "TOTAL_PAGES" },
    } as never);

    render(<GenerateTeamPlanButton />);
    await openModal(user);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(mockDocument).toHaveBeenCalledTimes(1);
    const docArgument = mockDocument.mock.calls[0][0];
    const serializedDoc = JSON.stringify(docArgument);
    expect(serializedDoc).not.toContain("Practice 1");
    expect(serializedDoc).not.toContain("Practice Plans");
    expect(serializedDoc).not.toContain("Number of Practices");
    expect(serializedDoc).not.toContain("Experience Level");
    expect(serializedDoc).not.toContain("SKILL_LEVEL");
  });

  it("keeps calendar months flowing naturally without forced page breaks", async () => {
    const user = userEvent.setup();
    const mockParagraph = jest.fn((options) => ({ options }));
    const mockTable = jest.fn((options) => ({ options }));
    const mockTextRun = jest.fn((options) => ({ options }));

    jest.spyOn(teamPlanCalendarGrid, "buildEventCalendarMonths").mockReturnValue([
      {
        monthKey: "2026-01",
        monthLabel: "Month 1",
        weeks: [
          [
            { dayOfMonth: 1, eventTypes: ["Game"], hasEvents: true },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
          ],
        ],
      },
      {
        monthKey: "2026-02",
        monthLabel: "Month 2",
        weeks: [
          [
            { dayOfMonth: 2, eventTypes: ["Game"], hasEvents: true },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
          ],
        ],
      },
      {
        monthKey: "2026-03",
        monthLabel: "Month 3",
        weeks: [
          [
            { dayOfMonth: 3, eventTypes: ["Game"], hasEvents: true },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
          ],
        ],
      },
      {
        monthKey: "2026-04",
        monthLabel: "Month 4",
        weeks: [
          [
            { dayOfMonth: 4, eventTypes: ["Game"], hasEvents: true },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
            { dayOfMonth: null, eventTypes: [], hasEvents: false },
          ],
        ],
      },
    ]);

    mockedLoadDocxModule.mockResolvedValue({
      AlignmentType: { CENTER: "CENTER", LEFT: "LEFT" },
      Document: jest.fn((config) => ({ config })),
      ExternalHyperlink: jest.fn((options) => ({ options })),
      HeadingLevel: { HEADING_1: "H1", HEADING_2: "H2", HEADING_3: "H3" },
      ImageRun: jest.fn((options) => ({ options })),
      Packer: { toBlob: jest.fn(async () => new Blob(["test-doc"])) },
      Paragraph: mockParagraph,
      Table: mockTable,
      TableCell: jest.fn((options) => ({ options })),
      TableLayoutType: { FIXED: "FIXED" },
      TableRow: jest.fn((options) => ({ options })),
      TextRun: mockTextRun,
      VerticalAlign: { CENTER: "CENTER", TOP: "TOP" },
      WidthType: { PERCENTAGE: "PERCENTAGE", DXA: "DXA" },
      Header: jest.fn((options) => ({ options })),
      Footer: jest.fn((options) => ({ options })),
      BorderStyle: { SINGLE: "SINGLE" },
      TabStopType: { RIGHT: "RIGHT", LEFT: "LEFT" },
      PageNumber: { CURRENT: "CURRENT", TOTAL_PAGES: "TOTAL_PAGES" },
    } as never);

    render(<GenerateTeamPlanButton />);
    await openModal(user);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates Manually" }));
    await user.click(screen.getByRole("button", { name: / 1,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));
    await user.click(screen.getByRole("button", { name: "Generate" }));

    const monthHeadingParagraphs = mockParagraph.mock.calls
      .map(([options]) => options)
      .filter((options) => /^Month [1-4]$/.test(options.children?.[0]?.options?.text ?? ""));

    expect(monthHeadingParagraphs).toHaveLength(4);
    expect(monthHeadingParagraphs.every((options) => options.pageBreakBefore === undefined)).toBe(
      true
    );
    expect(monthHeadingParagraphs.every((options) => options.keepNext === true)).toBe(true);

    const calendarTables = mockTable.mock.calls
      .map(([options]) => options)
      .filter((options) => options.rows?.[0]?.options?.tableHeader === true);
    expect(calendarTables).toHaveLength(4);
    expect(
      calendarTables.every((table) =>
        table.rows.every((row: { options?: { cantSplit?: boolean } }) => row.options?.cantSplit)
      )
    ).toBe(true);
  });

  it("filters event details output by selected detailed-entry event types", async () => {
    const user = userEvent.setup();
    const mockDocument = jest.fn((config) => ({ config }));

    mockedLoadDocxModule.mockResolvedValue({
      AlignmentType: { CENTER: "CENTER", LEFT: "LEFT" },
      Document: mockDocument,
      ExternalHyperlink: jest.fn((options) => ({ options })),
      HeadingLevel: { HEADING_1: "H1", HEADING_2: "H2", HEADING_3: "H3" },
      ImageRun: jest.fn((options) => ({ options })),
      Packer: { toBlob: jest.fn(async () => new Blob(["test-doc"])) },
      Paragraph: jest.fn((options) => ({ options })),
      Table: jest.fn((options) => ({ options })),
      TableCell: jest.fn((options) => ({ options })),
      TableLayoutType: { FIXED: "FIXED" },
      TableRow: jest.fn((options) => ({ options })),
      TextRun: jest.fn((options) => ({ options })),
      VerticalAlign: { CENTER: "CENTER", TOP: "TOP" },
      WidthType: { PERCENTAGE: "PERCENTAGE", DXA: "DXA" },
      Header: jest.fn((options) => ({ options })),
      Footer: jest.fn((options) => ({ options })),
      BorderStyle: { SINGLE: "SINGLE" },
      TabStopType: { RIGHT: "RIGHT", LEFT: "LEFT" },
      PageNumber: { CURRENT: "CURRENT", TOTAL_PAGES: "TOTAL_PAGES" },
    } as never);

    render(<GenerateTeamPlanButton />);
    await openModal(user);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates Manually" }));
    await user.click(screen.getByRole("button", { name: / 8,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));
    await user.click(screen.getByRole("checkbox", { name: /more than one event on this date/i }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: /additional event type 2 for/i }),
      "Game"
    );

    await user.click(
      within(getDetailedEntryEventTypesFieldset()).getByRole("checkbox", { name: "Game" })
    );

    await user.click(screen.getByRole("button", { name: "Generate" }));
    await waitFor(() => expect(mockDocument).toHaveBeenCalledTimes(1));

    const docArgument = mockDocument.mock.calls[0][0];
    const serializedDoc = JSON.stringify(docArgument);
    expect(serializedDoc).toContain("[EVENT_DETAILS_PRACTICE_CONTENT]");
    expect(serializedDoc).not.toContain("[EVENT_DETAILS_GAME_CONTENT]");
    expect(serializedDoc).not.toContain("Goals");
    expect(serializedDoc).not.toContain("Shots");
    expect(serializedDoc).not.toContain("Totals");
  });

  it("adds the game event score diagram when game entries are included in event details", async () => {
    const user = userEvent.setup();
    const mockDocument = jest.fn((config) => ({ config }));
    const mockTable = jest.fn((options) => ({ options }));

    mockedLoadDocxModule.mockResolvedValue({
      AlignmentType: { CENTER: "CENTER", LEFT: "LEFT" },
      Document: mockDocument,
      ExternalHyperlink: jest.fn((options) => ({ options })),
      HeadingLevel: { HEADING_1: "H1", HEADING_2: "H2", HEADING_3: "H3" },
      ImageRun: jest.fn((options) => ({ options })),
      Packer: { toBlob: jest.fn(async () => new Blob(["test-doc"])) },
      Paragraph: jest.fn((options) => ({ options })),
      Table: mockTable,
      TableCell: jest.fn((options) => ({ options })),
      TableLayoutType: { FIXED: "FIXED" },
      TableRow: jest.fn((options) => ({ options })),
      TextRun: jest.fn((options) => ({ options })),
      VerticalAlign: { CENTER: "CENTER", TOP: "TOP" },
      WidthType: { PERCENTAGE: "PERCENTAGE", DXA: "DXA" },
      Header: jest.fn((options) => ({ options })),
      Footer: jest.fn((options) => ({ options })),
      BorderStyle: { SINGLE: "SINGLE", NONE: "NONE" },
      TabStopType: { RIGHT: "RIGHT", LEFT: "LEFT" },
      PageNumber: { CURRENT: "CURRENT", TOTAL_PAGES: "TOTAL_PAGES" },
    } as never);

    render(<GenerateTeamPlanButton />);
    await openModal(user);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates Manually" }));
    await user.click(screen.getByRole("button", { name: / 9,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));
    await user.selectOptions(screen.getByRole("combobox", { name: /event type for/i }), "Game");

    await user.click(screen.getByRole("button", { name: "Generate" }));
    await waitFor(() => expect(mockDocument).toHaveBeenCalledTimes(1));

    const docArgument = mockDocument.mock.calls[0][0];
    const serializedDoc = JSON.stringify(docArgument);

    expect(serializedDoc).not.toContain("[EVENT_DETAILS_GAME_CONTENT]");
    expect(serializedDoc).toContain("Opponent");
    expect(serializedDoc).toContain("Time");
    expect(serializedDoc).toContain("Goalie");
    expect(serializedDoc).toContain("Venue");
    expect(serializedDoc).toContain("Goals");
    expect(serializedDoc).toContain("Shots");
    expect(serializedDoc).toContain("1st");
    expect(serializedDoc).toContain("2nd");
    expect(serializedDoc).toContain("3rd");
    expect(serializedDoc).toContain("OT");
    expect(serializedDoc).toContain("Totals");
    expect(serializedDoc).toContain('"width":{"size":9360,"type":"DXA"}');
    expect(serializedDoc).toContain('"columnWidths":[1200,2178,2178,2178,726,900]');
    expect(serializedDoc).toContain('"layout":"FIXED"');

    const gameTimelineParagraph = mockDocument.mock.calls[0][0].sections
      .flatMap(
        (section: { children: Array<{ options?: { children?: unknown[] } }> }) => section.children
      )
      .find(
        (child: { options?: { children?: Array<{ options?: { text?: string } }> } }) =>
          child.options?.children?.[0]?.options?.text === "Game Timeline"
      );
    expect(gameTimelineParagraph?.options?.pageBreakBefore).toBeUndefined();

    const gameTimelineTable = mockTable.mock.calls
      .map(([options]) => options)
      .find((options) => options.columnWidths?.[0] === 1200);
    expect(
      gameTimelineTable?.rows.every(
        (row: { options?: { cantSplit?: boolean } }) => row.options?.cantSplit
      )
    ).toBe(true);
  });
});

describe("GenerateTeamPlanButton event planning UI", () => {
  it("renders manual and calendar-feed event actions with default import dates", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));

    expect(screen.getByRole("button", { name: "Add Event Dates Manually" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Event Dates from Calendar Feed" }));

    expect(screen.getByRole("dialog", { name: "Import Calendar Events" })).toBeInTheDocument();
    expect(screen.getByLabelText("Calendar feed URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Calendar import start date")).toHaveValue(
      new Date().toISOString().slice(0, 10)
    );
    expect(screen.getByRole("button", { name: "Upload an .ics file" })).toBeInTheDocument();
  });

  it("imports feed events and merges them into the existing event set", async () => {
    const user = userEvent.setup();
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          "UID:imported-game",
          `DTSTART:${getTestIcsDateTime(1, 18)}`,
          `DTEND:${getTestIcsDateTime(1, 19)}`,
          "SUMMARY:Summer Showcase",
          "DESCRIPTION:Team game",
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n"),
    });
    global.fetch = fetchMock;

    render(<GenerateTeamPlanButton />);
    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates Manually" }));
    await user.click(screen.getByRole("button", { name: / 1,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates from Calendar Feed" }));
    await user.type(
      screen.getByLabelText("Calendar feed URL"),
      "https://calendar.example/feed.ics"
    );
    await user.click(screen.getByRole("button", { name: "Import from URL" }));

    await waitFor(() => expect(screen.getByText(/Imported 1 event/)).toBeInTheDocument());
    expect(screen.getAllByRole("button", { name: /delete all events for/i })).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledWith("https://calendar.example/feed.ics");
    global.fetch = originalFetch;
  });

  it("expands the import dates when finite feed events fall outside the defaults", async () => {
    const user = userEvent.setup();
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          "UID:outside-range-early",
          "DTSTART;VALUE=DATE:20200101",
          "SUMMARY:Early Event",
          "END:VEVENT",
          "BEGIN:VEVENT",
          "UID:outside-range-late",
          "DTSTART;VALUE=DATE:20300101",
          "SUMMARY:Late Event",
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n"),
    });

    render(<GenerateTeamPlanButton />);
    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates from Calendar Feed" }));
    await user.type(
      screen.getByLabelText("Calendar feed URL"),
      "https://calendar.example/feed.ics"
    );
    await user.click(screen.getByRole("button", { name: "Import from URL" }));

    await waitFor(() => expect(screen.getByText("Imported 2 events.")).toBeInTheDocument());
    expect(screen.getByLabelText("Calendar import start date")).toHaveValue("2020-01-01");
    expect(screen.getByLabelText("Calendar import end date")).toHaveValue("2030-01-01");
    expect(screen.getAllByRole("button", { name: /delete all events for/i })).toHaveLength(2);

    global.fetch = originalFetch;
  });

  it("imports an uploaded .ics file when URL access is unavailable", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);
    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates from Calendar Feed" }));

    const file = new File(["calendar"], "team.ics", { type: "text/calendar" });
    Object.defineProperty(file, "text", {
      value: async () =>
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          "UID:uploaded-practice",
          `DTSTART:${getTestIcsDateTime(2, 18)}`,
          "SUMMARY:Practice",
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n"),
    });
    fireEvent.change(screen.getByLabelText("Upload an .ics file"), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText("Imported 1 event.")).toBeInTheDocument());
  });

  it("offers the original feed URL for download after a CORS-style fetch failure", async () => {
    const user = userEvent.setup();
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const openMock = jest.spyOn(window, "open").mockImplementation(() => null);
    global.fetch = fetchMock;

    render(<GenerateTeamPlanButton />);
    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates from Calendar Feed" }));
    await user.type(
      screen.getByLabelText("Calendar feed URL"),
      "https://calendar.example/feed.ics"
    );
    await user.click(screen.getByRole("button", { name: "Import from URL" }));

    const downloadButton = await screen.findByRole("button", { name: "Download Feed" });
    expect(screen.getByRole("alert")).toHaveTextContent(/CORS/i);
    await user.click(downloadButton);
    await waitFor(() =>
      expect(openMock).toHaveBeenCalledWith(
        "https://calendar.example/feed.ics",
        "_blank",
        "noopener,noreferrer"
      )
    );

    global.fetch = originalFetch;
    openMock.mockRestore();
  });

  it("opens the existing file picker from the downloaded-feed action", async () => {
    const user = userEvent.setup();
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    render(<GenerateTeamPlanButton />);
    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates from Calendar Feed" }));
    await user.type(
      screen.getByLabelText("Calendar feed URL"),
      "https://calendar.example/feed.ics"
    );
    await user.click(screen.getByRole("button", { name: "Import from URL" }));

    await screen.findByRole("button", { name: "Use Downloaded Feed" });
    await user.click(screen.getByRole("button", { name: "Use Downloaded Feed" }));

    const file = new File(["calendar"], "calendar-feed.ics", { type: "text/calendar" });
    Object.defineProperty(file, "text", {
      value: async () =>
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          "UID:downloaded-feed-event",
          `DTSTART:${getTestIcsDateTime(3, 18)}`,
          "SUMMARY:Downloaded Practice",
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n"),
    });
    fireEvent.change(screen.getByLabelText("Upload an .ics file"), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText("Imported 1 event.")).toBeInTheDocument());
    global.fetch = originalFetch;
  });

  it("shows event planning section only when calendar of events is enabled", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);

    expect(screen.queryByText("Event Planning")).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));

    expect(screen.getByText("Event Planning")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Include calendar view?" })).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Include details for each event?" })
    ).toBeInTheDocument();
    const calendarFieldset = getCalendarEventTypesFieldset();
    expect(
      within(calendarFieldset).getByRole("checkbox", { name: "On-ice Practice" })
    ).toBeChecked();
    expect(screen.getByText("Event Types for Detailed Entries")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "TBD" })).toBeEnabled();
    expect(screen.getByRole("img", { name: "Calendar Event Types help" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Event Types for Detailed Entries help" })
    ).toBeInTheDocument();
  });

  it("persists selected dates and applies default event-type fallback rules", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates Manually" }));
    await user.click(screen.getByRole("button", { name: / 1,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));

    const eventTypeSelect = screen.getByRole("combobox", { name: /event type for/i });
    expect(eventTypeSelect).toHaveValue("On-ice Practice");

    await user.click(screen.getByRole("checkbox", { name: /more than one event on this date/i }));
    const secondEventTypeSelect = screen.getByRole("combobox", {
      name: /additional event type 2 for/i,
    });
    await user.selectOptions(secondEventTypeSelect, "Off-ice Practice");

    await user.click(
      within(getCalendarEventTypesFieldset()).getByRole("checkbox", { name: "On-ice Practice" })
    );
    expect(eventTypeSelect).toHaveValue("Game");
    expect(secondEventTypeSelect).toHaveValue("Off-ice Practice");

    await user.click(
      within(getCalendarEventTypesFieldset()).getByRole("checkbox", { name: "Off-ice Practice" })
    );
    expect(secondEventTypeSelect).toHaveValue("Game");

    await user.click(
      within(getCalendarEventTypesFieldset()).getByRole("checkbox", { name: "Game" })
    );
    expect(eventTypeSelect).toHaveValue("Evaluation");
    expect(secondEventTypeSelect).toHaveValue("Evaluation");
  });

  it("falls back selected event dates to TBD when all configurable event types are disabled", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates Manually" }));
    await user.click(screen.getByRole("button", { name: / 2,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));
    await user.click(screen.getByRole("checkbox", { name: /more than one event on this date/i }));

    const configurableTypes = [
      "On-ice Practice",
      "Off-ice Practice",
      "Video Review",
      "Evaluation",
      "Game",
    ] as const;

    for (const eventType of configurableTypes) {
      await user.click(
        within(getCalendarEventTypesFieldset()).getByRole("checkbox", { name: eventType })
      );
    }

    const eventTypeSelect = screen.getByRole("combobox", { name: /event type for/i });
    const secondEventTypeSelect = screen.getByRole("combobox", {
      name: /additional event type 2 for/i,
    });
    expect(eventTypeSelect).toHaveValue("TBD");
    expect(secondEventTypeSelect).toHaveValue("TBD");
    expect(within(eventTypeSelect).getAllByRole("option")).toHaveLength(1);
    expect(within(eventTypeSelect).getByRole("option", { name: "TBD" })).toBeInTheDocument();
    expect(within(secondEventTypeSelect).getAllByRole("option")).toHaveLength(1);
    expect(within(secondEventTypeSelect).getByRole("option", { name: "TBD" })).toBeInTheDocument();
  });

  it("supports adding and removing additional event type selectors for a selected date", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates Manually" }));
    await user.click(screen.getByRole("button", { name: / 3,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));

    expect(
      screen.queryByRole("combobox", { name: /additional event type 2 for/i })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /more than one event on this date/i }));
    expect(
      screen.getByRole("combobox", { name: /additional event type 2 for/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add another event type for/i }));
    expect(
      screen.getByRole("combobox", { name: /additional event type 3 for/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove additional event type 3 for/i }));
    expect(
      screen.queryByRole("combobox", { name: /additional event type 3 for/i })
    ).not.toBeInTheDocument();
  });

  it("reconciles all 3+ event selectors when enabled event types change", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates Manually" }));
    await user.click(screen.getByRole("button", { name: / 4,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));
    await user.click(screen.getByRole("checkbox", { name: /more than one event on this date/i }));
    await user.click(screen.getByRole("button", { name: /add another event type for/i }));

    const firstEventTypeSelect = screen.getByRole("combobox", { name: /event type for/i });
    const secondEventTypeSelect = screen.getByRole("combobox", {
      name: /additional event type 2 for/i,
    });
    const thirdEventTypeSelect = screen.getByRole("combobox", {
      name: /additional event type 3 for/i,
    });

    await user.selectOptions(secondEventTypeSelect, "Off-ice Practice");
    await user.selectOptions(thirdEventTypeSelect, "Video Review");
    expect(firstEventTypeSelect).toHaveValue("On-ice Practice");
    expect(secondEventTypeSelect).toHaveValue("Off-ice Practice");
    expect(thirdEventTypeSelect).toHaveValue("Video Review");

    await user.click(
      within(getCalendarEventTypesFieldset()).getByRole("checkbox", { name: "Off-ice Practice" })
    );
    expect(secondEventTypeSelect).toHaveValue("On-ice Practice");

    await user.click(
      within(getCalendarEventTypesFieldset()).getByRole("checkbox", { name: "On-ice Practice" })
    );
    expect(firstEventTypeSelect).toHaveValue("Game");
    expect(secondEventTypeSelect).toHaveValue("Game");
    expect(thirdEventTypeSelect).toHaveValue("Video Review");

    await user.click(
      within(getCalendarEventTypesFieldset()).getByRole("checkbox", { name: "Video Review" })
    );
    await user.click(
      within(getCalendarEventTypesFieldset()).getByRole("checkbox", { name: "Evaluation" })
    );
    await user.click(
      within(getCalendarEventTypesFieldset()).getByRole("checkbox", { name: "Game" })
    );
    expect(firstEventTypeSelect).toHaveValue("TBD");
    expect(secondEventTypeSelect).toHaveValue("TBD");
    expect(thirdEventTypeSelect).toHaveValue("TBD");
  });

  it("greys out detailed-entry event types disabled in calendar and re-checks when re-enabled", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));

    const calendarFieldset = getCalendarEventTypesFieldset();
    const detailedFieldset = getDetailedEntryEventTypesFieldset();
    const detailedOffIceCheckbox = within(detailedFieldset).getByRole("checkbox", {
      name: "Off-ice Practice",
    });

    await user.click(detailedOffIceCheckbox);
    expect(detailedOffIceCheckbox).not.toBeChecked();

    await user.click(within(calendarFieldset).getByRole("checkbox", { name: "Off-ice Practice" }));
    await waitFor(() => expect(detailedOffIceCheckbox).toBeDisabled());
    expect(
      within(detailedFieldset).getByText("(Must be enabled in Calendar view.)")
    ).toBeInTheDocument();

    await user.click(within(calendarFieldset).getByRole("checkbox", { name: "Off-ice Practice" }));
    await waitFor(() => {
      const reenabledDetailedOffIceCheckbox = within(
        getDetailedEntryEventTypesFieldset()
      ).getByRole("checkbox", {
        name: "Off-ice Practice",
      });
      expect(reenabledDetailedOffIceCheckbox).toBeEnabled();
      expect(reenabledDetailedOffIceCheckbox).toBeChecked();
    });
  });

  it("hides detailed-entry type controls when include-event-details is disabled", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    expect(screen.getByText("Event Types for Detailed Entries")).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Include details for each event?" }));
    expect(screen.queryByText("Event Types for Detailed Entries")).not.toBeInTheDocument();
  });

  it("deletes an entire selected date entry after confirmation", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates Manually" }));
    await user.click(screen.getByRole("button", { name: / 5,/ }));
    await user.click(screen.getByRole("button", { name: / 6,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));

    const moreThanOneCheckboxes = screen.getAllByRole("checkbox", {
      name: /more than one event on this date/i,
    });
    await user.click(moreThanOneCheckboxes[0]);
    expect(
      screen.getByRole("combobox", { name: /additional event type 2 for/i })
    ).toBeInTheDocument();

    const deleteDateButtons = screen.getAllByRole("button", { name: /delete all events for/i });
    await user.click(deleteDateButtons[0]);

    const confirmationDialog = screen.getByRole("dialog", { name: "Delete event date?" });
    expect(confirmationDialog).toBeInTheDocument();
    await user.click(within(confirmationDialog).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Delete event date?" })).not.toBeInTheDocument()
    );
    expect(
      screen.queryByRole("combobox", { name: /additional event type 2 for/i })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /delete all events for/i })).toHaveLength(1);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add Event Dates Manually" })).toHaveFocus()
    );
  });

  it("keeps selected date entry unchanged when delete confirmation is cancelled", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates Manually" }));
    await user.click(screen.getByRole("button", { name: / 7,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));

    const deleteDateButton = screen.getByRole("button", { name: /delete all events for/i });
    await user.click(deleteDateButton);
    const confirmationDialog = screen.getByRole("dialog", { name: "Delete event date?" });
    expect(confirmationDialog).toBeInTheDocument();

    await user.click(within(confirmationDialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Delete event date?" })).not.toBeInTheDocument()
    );
    expect(screen.getAllByRole("button", { name: /delete all events for/i })).toHaveLength(1);
    await waitFor(() => expect(deleteDateButton).toHaveFocus());
  });
});
