import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GenerateClubPlanButton from "../GenerateClubPlanButton";

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

describe("GenerateClubPlanButton", () => {
  it("shows club naming fields and no format selector options", async () => {
    const user = userEvent.setup();
    render(<GenerateClubPlanButton />);

    await user.click(screen.getByRole("button", { name: /generate club development plan/i }));

    expect(screen.getByLabelText("Club Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your club name")).toBeInTheDocument();
    expect(screen.queryByText(/team name/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/output format/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /word/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /pdf/i })).not.toBeInTheDocument();
  });

  it("shows primary and secondary club color controls with USA defaults", async () => {
    const user = userEvent.setup();
    render(<GenerateClubPlanButton />);

    await user.click(screen.getByRole("button", { name: /generate club development plan/i }));

    const primaryColorPicker = screen.getByLabelText("Primary Club Color");
    const primaryHexInput = screen.getByLabelText("Primary Club Color Hex");
    const secondaryColorPicker = screen.getByLabelText("Secondary Club Color");
    const secondaryHexInput = screen.getByLabelText("Secondary Club Color Hex");

    expect(primaryColorPicker).toHaveValue("#00205b");
    expect(primaryHexInput).toHaveValue("#00205B");
    expect(secondaryColorPicker).toHaveValue("#af272f");
    expect(secondaryHexInput).toHaveValue("#AF272F");

    await user.clear(primaryHexInput);
    await user.type(primaryHexInput, "#123456");

    expect(primaryColorPicker).toHaveValue("#123456");
  });

  it("disables goalie discount field when goalies are free is checked", async () => {
    const user = userEvent.setup();
    render(<GenerateClubPlanButton />);

    await user.click(screen.getByRole("button", { name: /generate club development plan/i }));
    await user.click(screen.getByLabelText("Does your club offer a goalie discount?"));

    const discountInput = screen.getByLabelText("Goalie Discount");
    const startingAgeGroupInput = screen.getByLabelText("Starting Age Group");
    expect(discountInput).toBeEnabled();
    expect(startingAgeGroupInput).toBeInTheDocument();

    await user.click(screen.getByLabelText("Goalies are Free!"));
    expect(discountInput).toBeDisabled();
  });

  it("shows dedicated goalie practice detail fields when enabled", async () => {
    const user = userEvent.setup();
    render(<GenerateClubPlanButton />);

    await user.click(screen.getByRole("button", { name: /generate club development plan/i }));

    expect(screen.queryByLabelText("How Often?")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Does your club have dedicated goalie practices?"));

    expect(screen.getByLabelText("How Often?")).toBeInTheDocument();
    expect(screen.getByLabelText("Length of sessions")).toBeInTheDocument();
    expect(screen.getByLabelText("With whom?")).toBeInTheDocument();
    expect(screen.getByLabelText("Starting Age Group")).toBeInTheDocument();
  });

  it("omits with whom for video sessions and applies video defaults", async () => {
    const user = userEvent.setup();
    render(<GenerateClubPlanButton />);

    await user.click(screen.getByRole("button", { name: /generate club development plan/i }));
    await user.click(screen.getByLabelText("Does your club have goalie-specific video sessions?"));

    expect(screen.getByLabelText("How Often?")).toHaveValue("weekly");
    expect(screen.getByLabelText("Length of sessions")).toHaveValue("30 minutes");
    expect(screen.queryByLabelText("With whom?")).not.toBeInTheDocument();
  });

  it("renders content section selectors as enabled sliders by default", async () => {
    const user = userEvent.setup();
    render(<GenerateClubPlanButton />);

    await user.click(screen.getByRole("button", { name: /generate club development plan/i }));

    const introSlider = screen.getByRole("switch", {
      name: "Add starter content for introduction?",
    });
    const seasonGoalsSlider = screen.getByRole("switch", {
      name: "Add starter content for Season Goals?",
    });
    const equipmentSlider = screen.getByRole("switch", {
      name: "Include a required equipment section?",
    });
    const resourcesSlider = screen.getByRole("switch", {
      name: "Include a section for helpful external goaltending resources?",
    });

    expect(introSlider).toHaveAttribute("aria-checked", "true");
    expect(seasonGoalsSlider).toHaveAttribute("aria-checked", "true");
    expect(equipmentSlider).toHaveAttribute("aria-checked", "true");
    expect(resourcesSlider).toHaveAttribute("aria-checked", "true");

    await user.click(resourcesSlider);
    expect(resourcesSlider).toHaveAttribute("aria-checked", "false");
  });

  it("shows intermediate nets toggle at the top of Club Training Details", async () => {
    const user = userEvent.setup();
    render(<GenerateClubPlanButton />);

    await user.click(screen.getByRole("button", { name: /generate club development plan/i }));

    const netsToggle = screen.getByLabelText(
      "Does your club use intermediate-sized nets for 8U and younger teams?"
    );
    expect(netsToggle).toBeInTheDocument();
    expect(netsToggle).not.toBeChecked();

    await user.click(netsToggle);
    expect(netsToggle).toBeChecked();
  });
});
