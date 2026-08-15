import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as qrCode from "qrcode";
import GoalieJournalButton from "../GoalieJournalButton";
import { GOALIE_JOURNAL_PROMOTION_URL } from "../../utils/goalieJournalPromotion";
import {
  DEFAULT_JOURNAL_ENTRY_COUNT,
  getDefaultJournalSeason,
} from "../../utils/generatorDefaults";
import { extractPaletteHexColorsFromDataUrl } from "../../utils/teamColors";

const mockBuildGoalieJournalPdf = jest.fn((..._args: unknown[]) => ({
  output: jest.fn(() => new Blob()),
}));

jest.mock("../../utils/builders/goalieJournalBuilder", () => ({
  buildGoalieJournalPdf: (...args: unknown[]) => mockBuildGoalieJournalPdf(...args),
}));

jest.mock("../../utils/loadExportModules", () => ({
  loadJsPdfModule: jest.fn(async () => ({})),
}));

jest.mock("qrcode", () => ({
  toDataURL: jest.fn(async () => "data:image/png;base64,qr"),
}));

jest.mock("../../utils/teamColors", () => ({
  DEFAULT_PRIMARY_TEAM_COLOR: "#00205B",
  DEFAULT_SECONDARY_TEAM_COLOR: "#AF272F",
  normalizeHexRgbColor: (input: string) => input.toUpperCase(),
  extractPaletteHexColorsFromDataUrl: jest.fn(async () => []),
}));

jest.mock("../Logo", () => {
  function MockLogo() {
    return <div data-testid="logo" />;
  }

  return MockLogo;
});

jest.mock("../ImageUploader", () => {
  function MockImageUploader({
    onImageCropped,
    label = "Image (Optional)",
    inputId = "image-upload-input",
  }: {
    onImageCropped: (_file: File | null, previewUrl: string | null) => void;
    label?: string;
    inputId?: string;
  }) {
    return (
      <button
        type="button"
        data-testid={inputId}
        onClick={() => onImageCropped(null, `data:image/png;base64,${inputId}`)}
      >
        {label}
      </button>
    );
  }

  return MockImageUploader;
});

function installImageMocks(): () => void {
  const originalImage = global.Image;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  class MockImage {
    width = 1;
    height = 1;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(_value: string) {
      this.onload?.();
    }
  }
  Object.defineProperty(global, "Image", { configurable: true, value: MockImage });
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: jest.fn(() => ({ drawImage: jest.fn() })),
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
    configurable: true,
    value: jest.fn(() => "data:image/png;base64,default-logo"),
  });

  return () => {
    Object.defineProperty(global, "Image", { configurable: true, value: originalImage });
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: originalGetContext,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
      configurable: true,
      value: originalToDataURL,
    });
  };
}

describe("GoalieJournalButton", () => {
  beforeEach(() => {
    mockBuildGoalieJournalPdf.mockClear();
    jest.mocked(qrCode.toDataURL).mockClear();
    jest.mocked(extractPaletteHexColorsFromDataUrl).mockClear();
  });

  it("shows season and journal entry controls with shared defaults", async () => {
    const user = userEvent.setup();
    render(<GoalieJournalButton />);

    await user.click(screen.getByRole("button", { name: "Goalie Journal" }));

    expect(screen.getByLabelText("Season")).toHaveValue(getDefaultJournalSeason());
    expect(screen.getByLabelText("Number of Journal Entries")).toHaveValue(
      DEFAULT_JOURNAL_ENTRY_COUNT
    );
    const teamLogoInput = screen.getByRole("button", { name: "Team Logo (Optional)" });
    const goaliePhotoInput = screen.getByRole("button", { name: "Goalie Photo (Optional)" });
    const seasonGoalsGroup = screen.getByRole("group", { name: "Season Goals" });
    expect(
      seasonGoalsGroup.compareDocumentPosition(goaliePhotoInput) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      goaliePhotoInput.compareDocumentPosition(teamLogoInput) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("shows primary and secondary team color controls with USA defaults", async () => {
    const user = userEvent.setup();
    render(<GoalieJournalButton />);

    await user.click(screen.getByRole("button", { name: "Goalie Journal" }));

    const primaryColorPicker = screen.getByLabelText("Primary Team Color");
    const primaryHexInput = screen.getByLabelText("Primary Team Color Hex");
    const secondaryColorPicker = screen.getByLabelText("Secondary Team Color");
    const secondaryHexInput = screen.getByLabelText("Secondary Team Color Hex");

    expect(primaryColorPicker).toHaveValue("#00205b");
    expect(primaryHexInput).toHaveValue("#00205B");
    expect(secondaryColorPicker).toHaveValue("#af272f");
    expect(secondaryHexInput).toHaveValue("#AF272F");

    await user.clear(primaryHexInput);
    await user.type(primaryHexInput, "#112233");

    expect(primaryColorPicker).toHaveValue("#112233");
  });

  it("renders a custom trigger label when the label prop is provided", () => {
    render(<GoalieJournalButton label="Generate Goalie Journal" />);
    expect(screen.getByRole("button", { name: "Generate Goalie Journal" })).toBeInTheDocument();
  });

  it("passes edited journal settings to the journal PDF builder", async () => {
    const user = userEvent.setup();
    const restoreImageMocks = installImageMocks();

    render(<GoalieJournalButton />);

    try {
      await user.click(screen.getByRole("button", { name: "Goalie Journal" }));
      await user.click(screen.getByTestId("journal-team-logo"));
      await user.click(screen.getByTestId("journal-goalie-photo"));
      await waitFor(() => {
        expect(extractPaletteHexColorsFromDataUrl).toHaveBeenCalledWith(
          "data:image/png;base64,journal-team-logo",
          6
        );
      });
      expect(extractPaletteHexColorsFromDataUrl).not.toHaveBeenCalledWith(
        "data:image/png;base64,journal-goalie-photo",
        expect.anything()
      );

      const goalieNameInput = screen.getByLabelText("Goalie Name");
      const teamNameInput = screen.getByLabelText("Team Name");
      const seasonInput = screen.getByLabelText("Season");
      const entryCountInput = screen.getByLabelText("Number of Journal Entries");
      const primaryHexInput = screen.getByLabelText("Primary Team Color Hex");
      const secondaryHexInput = screen.getByLabelText("Secondary Team Color Hex");
      const firstGoalInput = screen.getByLabelText("Goal 1");
      const thirdGoalInput = screen.getByLabelText("Goal 3");

      await user.type(goalieNameInput, "Test Goalie");
      await user.type(teamNameInput, "Test Team");
      await user.clear(seasonInput);
      await user.type(seasonInput, "Middle-School");
      await user.clear(entryCountInput);
      await user.type(entryCountInput, "36");
      await user.clear(primaryHexInput);
      await user.type(primaryHexInput, "#123456");
      await user.clear(secondaryHexInput);
      await user.type(secondaryHexInput, "#ABCDEF");
      await user.type(firstGoalInput, "Improve rebound control");
      await user.type(thirdGoalInput, "Communicate with defenders");
      await user.click(screen.getByRole("button", { name: "Generate" }));

      await waitFor(() => {
        expect(qrCode.toDataURL).toHaveBeenCalledWith(GOALIE_JOURNAL_PROMOTION_URL, {
          margin: 1,
          width: 160,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        expect(mockBuildGoalieJournalPdf).toHaveBeenCalledWith(
          expect.objectContaining({
            primaryColor: "#123456",
            secondaryColor: "#ABCDEF",
            season: "Middle-School",
            entryCount: 36,
            seasonGoals: ["Improve rebound control", "Communicate with defenders"],
            writeInGoalieName: false,
            writeInTeamName: false,
            writeInSeason: false,
            writeInSeasonGoals: false,
          }),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            dataUrl: "data:image/png;base64,journal-goalie-photo",
          }),
          expect.objectContaining({
            dataUrl: "data:image/png;base64,default-logo",
          }),
          expect.anything()
        );
      });
    } finally {
      restoreImageMocks();
    }
  });

  it("requires a non-empty season", async () => {
    const user = userEvent.setup();
    render(<GoalieJournalButton />);

    await user.click(screen.getByRole("button", { name: "Goalie Journal" }));
    await user.type(screen.getByLabelText("Goalie Name"), "Test Goalie");
    await user.type(screen.getByLabelText("Team Name"), "Test Team");
    await user.clear(screen.getByLabelText("Season"));
    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(screen.getByText("Please enter a season")).toBeInTheDocument();
    expect(mockBuildGoalieJournalPdf).not.toHaveBeenCalled();
  });

  it("requires the journal entry count to be a whole number from 1 to 100", async () => {
    const user = userEvent.setup();
    render(<GoalieJournalButton />);

    await user.click(screen.getByRole("button", { name: "Goalie Journal" }));
    await user.type(screen.getByLabelText("Goalie Name"), "Test Goalie");
    await user.type(screen.getByLabelText("Team Name"), "Test Team");
    await user.clear(screen.getByLabelText("Number of Journal Entries"));
    await user.type(screen.getByLabelText("Number of Journal Entries"), "101");
    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(
      screen.getByText("Number of journal entries must be a whole number between 1 and 100")
    ).toBeInTheDocument();
    expect(mockBuildGoalieJournalPdf).not.toHaveBeenCalled();
  });

  it("restores season and entry count defaults after cancelling", async () => {
    const user = userEvent.setup();
    render(<GoalieJournalButton />);

    await user.click(screen.getByRole("button", { name: "Goalie Journal" }));
    await user.clear(screen.getByLabelText("Season"));
    await user.type(screen.getByLabelText("Season"), "Spring");
    await user.clear(screen.getByLabelText("Number of Journal Entries"));
    await user.type(screen.getByLabelText("Number of Journal Entries"), "12");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Goalie Journal" }));

    expect(screen.getByLabelText("Season")).toHaveValue(getDefaultJournalSeason());
    expect(screen.getByLabelText("Number of Journal Entries")).toHaveValue(
      DEFAULT_JOURNAL_ENTRY_COUNT
    );
  });

  it("disables fields selected for writing in later and restores them after cancelling", async () => {
    const user = userEvent.setup();
    render(<GoalieJournalButton />);

    await user.click(screen.getByRole("button", { name: "Goalie Journal" }));
    const goalieNameInput = screen.getByLabelText("Goalie Name");
    const teamNameInput = screen.getByLabelText("Team Name");
    const seasonInput = screen.getByLabelText("Season");
    const seasonGoalInputs = [1, 2, 3].map((number) => screen.getByLabelText(`Goal ${number}`));
    await user.type(seasonGoalInputs[0], "Improve positioning");

    await user.click(
      screen.getByRole("checkbox", {
        name: "Write Goalie Name in later on printed journal",
      })
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "Write Team Name in later on printed journal",
      })
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "Write Season in later on printed journal",
      })
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "Write Season Goals in later on printed journal",
      })
    );

    expect(goalieNameInput).toBeDisabled();
    expect(teamNameInput).toBeDisabled();
    expect(seasonInput).toBeDisabled();
    seasonGoalInputs.forEach((input) => expect(input).toBeDisabled());

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Goalie Journal" }));

    expect(screen.getByLabelText("Goalie Name")).toBeEnabled();
    expect(screen.getByLabelText("Team Name")).toBeEnabled();
    expect(screen.getByLabelText("Season")).toBeEnabled();
    [1, 2, 3].forEach((number) => expect(screen.getByLabelText(`Goal ${number}`)).toBeEnabled());
    expect(screen.getByLabelText("Goal 1")).toHaveValue("");
  });

  it("uses printable Season Goal fields when all goal inputs are blank", async () => {
    const user = userEvent.setup();
    const restoreImageMocks = installImageMocks();
    render(<GoalieJournalButton />);

    try {
      await user.click(screen.getByRole("button", { name: "Goalie Journal" }));
      await user.type(screen.getByLabelText("Goalie Name"), "Test Goalie");
      await user.type(screen.getByLabelText("Team Name"), "Test Team");
      await user.click(screen.getByRole("button", { name: "Generate" }));

      await waitFor(() => {
        expect(mockBuildGoalieJournalPdf).toHaveBeenCalledWith(
          expect.objectContaining({
            seasonGoals: [],
            writeInSeasonGoals: true,
          }),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          null,
          expect.anything(),
          expect.anything()
        );
      });
    } finally {
      restoreImageMocks();
    }
  });

  it("generates with blank identity values when all fields are marked for writing in later", async () => {
    const user = userEvent.setup();
    const restoreImageMocks = installImageMocks();
    render(<GoalieJournalButton />);

    try {
      await user.click(screen.getByRole("button", { name: "Goalie Journal" }));
      await user.click(
        screen.getByRole("checkbox", {
          name: "Write Goalie Name in later on printed journal",
        })
      );
      await user.click(
        screen.getByRole("checkbox", {
          name: "Write Team Name in later on printed journal",
        })
      );
      await user.click(
        screen.getByRole("checkbox", {
          name: "Write Season in later on printed journal",
        })
      );
      await user.click(screen.getByRole("button", { name: "Generate" }));

      await waitFor(() => {
        expect(mockBuildGoalieJournalPdf).toHaveBeenCalledWith(
          expect.objectContaining({
            goalieName: "",
            teamName: "",
            season: getDefaultJournalSeason(),
            seasonGoals: [],
            writeInGoalieName: true,
            writeInTeamName: true,
            writeInSeason: true,
            writeInSeasonGoals: true,
          }),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          null,
          expect.objectContaining({
            dataUrl: "data:image/png;base64,default-logo",
          }),
          expect.anything()
        );
      });
      expect(screen.queryByText(/Please enter/)).not.toBeInTheDocument();
    } finally {
      restoreImageMocks();
    }
  });
});
