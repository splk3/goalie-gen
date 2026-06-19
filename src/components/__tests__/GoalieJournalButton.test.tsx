import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GoalieJournalButton from "../GoalieJournalButton";

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
    expect(
      screen.getByRole("button", { name: "Generate Goalie Journal" })
    ).toBeInTheDocument();
  });
});
