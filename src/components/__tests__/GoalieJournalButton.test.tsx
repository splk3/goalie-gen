import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GoalieJournalButton from "../GoalieJournalButton";

const mockBuildGoalieJournalPdf = jest.fn((..._args: unknown[]) => ({
  output: jest.fn(() => new Blob()),
}));

jest.mock("../../utils/builders/goalieJournalBuilder", () => ({
  buildGoalieJournalPdf: (...args: unknown[]) => mockBuildGoalieJournalPdf(...args),
}));

jest.mock("../../utils/loadExportModules", () => ({
  loadJsPdfModule: jest.fn(async () => ({})),
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
  }: {
    onImageCropped: (_file: File | null, previewUrl: string | null) => void;
  }) {
    return (
      <button
        type="button"
        data-testid="image-uploader"
        onClick={() => onImageCropped(null, "data:image/png;base64,test")}
      >
        Upload logo
      </button>
    );
  }

  return MockImageUploader;
});

describe("GoalieJournalButton", () => {
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

  it("passes edited colors to the journal PDF builder", async () => {
    const user = userEvent.setup();
    const originalImage = global.Image;
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

    render(<GoalieJournalButton />);

    try {
      await user.click(screen.getByRole("button", { name: "Goalie Journal" }));
      await user.click(screen.getByTestId("image-uploader"));

      const goalieNameInput = screen.getByLabelText("Goalie Name");
      const teamNameInput = screen.getByLabelText("Team Name");
      const primaryHexInput = screen.getByLabelText("Primary Team Color Hex");
      const secondaryHexInput = screen.getByLabelText("Secondary Team Color Hex");

      await user.type(goalieNameInput, "Test Goalie");
      await user.type(teamNameInput, "Test Team");
      await user.clear(primaryHexInput);
      await user.type(primaryHexInput, "#123456");
      await user.clear(secondaryHexInput);
      await user.type(secondaryHexInput, "#ABCDEF");
      await user.click(screen.getByRole("button", { name: "Generate" }));

      await waitFor(() => {
        expect(mockBuildGoalieJournalPdf).toHaveBeenCalledWith(
          expect.objectContaining({
            primaryColor: "#123456",
            secondaryColor: "#ABCDEF",
          }),
          expect.anything(),
          expect.anything(),
          expect.anything()
        );
      });
    } finally {
      Object.defineProperty(global, "Image", { configurable: true, value: originalImage });
    }
  });
});
