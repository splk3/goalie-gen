import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SliderToggle from "../SliderToggle";

describe("SliderToggle", () => {
  it("renders correctly with label and initial unchecked state", () => {
    const handleChange = jest.fn();
    render(
      <SliderToggle
        id="test-toggle"
        label="Test Toggle Label"
        enabled={false}
        onChange={handleChange}
        disabled={false}
      />
    );

    const toggle = screen.getByRole("switch", { name: "Test Toggle Label" });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).not.toBeDisabled();
  });

  it("renders correctly with label and initial checked state", () => {
    const handleChange = jest.fn();
    render(
      <SliderToggle
        id="test-toggle"
        label="Test Toggle Label"
        enabled={true}
        onChange={handleChange}
        disabled={false}
      />
    );

    const toggle = screen.getByRole("switch", { name: "Test Toggle Label" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange callback when clicked", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <SliderToggle
        id="test-toggle"
        label="Test Toggle Label"
        enabled={false}
        onChange={handleChange}
        disabled={false}
      />
    );

    const toggle = screen.getByRole("switch", { name: "Test Toggle Label" });
    await user.click(toggle);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("does not call onChange callback when disabled", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <SliderToggle
        id="test-toggle"
        label="Test Toggle Label"
        enabled={false}
        onChange={handleChange}
        disabled={true}
      />
    );

    const toggle = screen.getByRole("switch", { name: "Test Toggle Label" });
    expect(toggle).toBeDisabled();

    await user.click(toggle);
    expect(handleChange).not.toHaveBeenCalled();
  });
});
