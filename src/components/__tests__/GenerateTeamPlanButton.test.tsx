import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
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
  await user.selectOptions(screen.getByLabelText("Age Group"), "10u");
  await user.selectOptions(screen.getByLabelText("Skill Level"), "intermediate");
}

describe("GenerateTeamPlanButton", () => {
  it("shows DOCX-only UI and team-specific fields", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);

    expect(screen.getByLabelText("Team Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Team/Club Website (Optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Team/Club Motto/Mission (Optional)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Number of Practices (0-50)")).not.toBeInTheDocument();
    expect(screen.queryByText(/output format/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /word/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /pdf/i })).not.toBeInTheDocument();
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
    expect(disabledSwitch).toHaveClass("overflow-hidden", "w-11", "bg-gray-400", "dark:bg-gray-600");
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

    expect(screen.queryByLabelText("Number of evaluation times during season")).not.toBeInTheDocument();

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

  it("generates team plan doc without number-of-practices content and retains Practice 1 flow", async () => {
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
    } as never);

    render(<GenerateTeamPlanButton />);
    await openModal(user);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(mockDocument).toHaveBeenCalledTimes(1);
    const docArgument = mockDocument.mock.calls[0][0];
    const serializedDoc = JSON.stringify(docArgument);
    expect(serializedDoc).toContain("Practice 1");
    expect(serializedDoc).not.toContain("Number of Practices");
  });

  it("renders two calendar months per page in team-plan DOCX calendar view", async () => {
    const user = userEvent.setup();
    const mockParagraph = jest.fn((options) => ({ options }));
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
      Table: jest.fn((options) => ({ options })),
      TableCell: jest.fn((options) => ({ options })),
      TableLayoutType: { FIXED: "FIXED" },
      TableRow: jest.fn((options) => ({ options })),
      TextRun: mockTextRun,
      VerticalAlign: { CENTER: "CENTER", TOP: "TOP" },
      WidthType: { PERCENTAGE: "PERCENTAGE", DXA: "DXA" },
    } as never);

    render(<GenerateTeamPlanButton />);
    await openModal(user);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates" }));
    await user.click(screen.getByRole("button", { name: / 1,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));
    await user.click(screen.getByRole("button", { name: "Generate" }));

    const monthHeadingParagraphs = mockParagraph.mock.calls
      .map(([options]) => options)
      .filter((options) => /^Month [1-4]$/.test(options.children?.[0]?.options?.text ?? ""));

    expect(monthHeadingParagraphs).toHaveLength(4);
    expect(monthHeadingParagraphs.map((options) => options.pageBreakBefore)).toEqual([
      false,
      false,
      true,
      false,
    ]);
  });
});

describe("GenerateTeamPlanButton event planning UI", () => {
  it("shows event planning section only when calendar of events is enabled", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);

    expect(screen.queryByText("Event Planning")).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));

    expect(screen.getByText("Event Planning")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Include calendar view?" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Include details for each event?" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "On-ice Practice" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "TBD event type is always enabled" })).toBeDisabled();
  });

  it("persists selected dates and applies default event-type fallback rules", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates" }));
    await user.click(screen.getByRole("button", { name: / 1,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));

    const eventTypeSelect = screen.getByRole("combobox", { name: /event type for/i });
    expect(eventTypeSelect).toHaveValue("On-ice Practice");

    await user.click(screen.getByRole("checkbox", { name: /more than one event on this date/i }));
    const secondEventTypeSelect = screen.getByRole("combobox", { name: /additional event type 2 for/i });
    await user.selectOptions(secondEventTypeSelect, "Off-ice Practice");

    await user.click(screen.getByRole("checkbox", { name: "On-ice Practice" }));
    expect(eventTypeSelect).toHaveValue("Game");
    expect(secondEventTypeSelect).toHaveValue("Off-ice Practice");

    await user.click(screen.getByRole("checkbox", { name: "Off-ice Practice" }));
    expect(secondEventTypeSelect).toHaveValue("Game");

    await user.click(screen.getByRole("checkbox", { name: "Game" }));
    expect(eventTypeSelect).toHaveValue("Evaluation");
    expect(secondEventTypeSelect).toHaveValue("Evaluation");
  });

  it("falls back selected event dates to TBD when all configurable event types are disabled", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates" }));
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
      await user.click(screen.getByRole("checkbox", { name: eventType }));
    }

    const eventTypeSelect = screen.getByRole("combobox", { name: /event type for/i });
    const secondEventTypeSelect = screen.getByRole("combobox", { name: /additional event type 2 for/i });
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
    await user.click(screen.getByRole("button", { name: "Add Event Dates" }));
    await user.click(screen.getByRole("button", { name: / 3,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));

    expect(screen.queryByRole("combobox", { name: /additional event type 2 for/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /more than one event on this date/i }));
    expect(screen.getByRole("combobox", { name: /additional event type 2 for/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add another event type for/i }));
    expect(screen.getByRole("combobox", { name: /additional event type 3 for/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove additional event type 3 for/i }));
    expect(screen.queryByRole("combobox", { name: /additional event type 3 for/i })).not.toBeInTheDocument();
  });

  it("reconciles all 3+ event selectors when enabled event types change", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates" }));
    await user.click(screen.getByRole("button", { name: / 4,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));
    await user.click(screen.getByRole("checkbox", { name: /more than one event on this date/i }));
    await user.click(screen.getByRole("button", { name: /add another event type for/i }));

    const firstEventTypeSelect = screen.getByRole("combobox", { name: /event type for/i });
    const secondEventTypeSelect = screen.getByRole("combobox", { name: /additional event type 2 for/i });
    const thirdEventTypeSelect = screen.getByRole("combobox", { name: /additional event type 3 for/i });

    await user.selectOptions(secondEventTypeSelect, "Off-ice Practice");
    await user.selectOptions(thirdEventTypeSelect, "Video Review");
    expect(firstEventTypeSelect).toHaveValue("On-ice Practice");
    expect(secondEventTypeSelect).toHaveValue("Off-ice Practice");
    expect(thirdEventTypeSelect).toHaveValue("Video Review");

    await user.click(screen.getByRole("checkbox", { name: "Off-ice Practice" }));
    expect(secondEventTypeSelect).toHaveValue("On-ice Practice");

    await user.click(screen.getByRole("checkbox", { name: "On-ice Practice" }));
    expect(firstEventTypeSelect).toHaveValue("Game");
    expect(secondEventTypeSelect).toHaveValue("Game");
    expect(thirdEventTypeSelect).toHaveValue("Video Review");

    await user.click(screen.getByRole("checkbox", { name: "Video Review" }));
    await user.click(screen.getByRole("checkbox", { name: "Evaluation" }));
    await user.click(screen.getByRole("checkbox", { name: "Game" }));
    expect(firstEventTypeSelect).toHaveValue("TBD");
    expect(secondEventTypeSelect).toHaveValue("TBD");
    expect(thirdEventTypeSelect).toHaveValue("TBD");
  });

  it("deletes an entire selected date entry after confirmation", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates" }));
    await user.click(screen.getByRole("button", { name: / 5,/ }));
    await user.click(screen.getByRole("button", { name: / 6,/ }));
    await user.click(screen.getByRole("button", { name: "OK" }));

    const moreThanOneCheckboxes = screen.getAllByRole("checkbox", {
      name: /more than one event on this date/i,
    });
    await user.click(moreThanOneCheckboxes[0]);
    expect(screen.getByRole("combobox", { name: /additional event type 2 for/i })).toBeInTheDocument();

    const deleteDateButtons = screen.getAllByRole("button", { name: /delete all events for/i });
    await user.click(deleteDateButtons[0]);

    const confirmationDialog = screen.getByRole("dialog", { name: "Delete event date?" });
    expect(confirmationDialog).toBeInTheDocument();
    await user.click(within(confirmationDialog).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Delete event date?" })).not.toBeInTheDocument()
    );
    expect(screen.queryByRole("combobox", { name: /additional event type 2 for/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /delete all events for/i })).toHaveLength(1);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add Event Dates" })).toHaveFocus()
    );
  });

  it("keeps selected date entry unchanged when delete confirmation is cancelled", async () => {
    const user = userEvent.setup();
    render(<GenerateTeamPlanButton />);

    await openModal(user);
    await user.click(screen.getByRole("switch", { name: "Add calendar of events?" }));
    await user.click(screen.getByRole("button", { name: "Add Event Dates" }));
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
