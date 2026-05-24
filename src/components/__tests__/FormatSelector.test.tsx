import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormatSelector from "../FormatSelector";

describe("FormatSelector", () => {
  it("checks the DOCX radio when format='docx'", () => {
    render(<FormatSelector format="docx" onChange={() => {}} name="test-format" />);
    expect(screen.getByRole("radio", { name: /word/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /pdf/i })).not.toBeChecked();
  });

  it("checks the PDF radio when format='pdf'", () => {
    render(<FormatSelector format="pdf" onChange={() => {}} name="test-format" />);
    expect(screen.getByRole("radio", { name: /pdf/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /word/i })).not.toBeChecked();
  });

  it("calls onChange with 'pdf' when the PDF radio is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FormatSelector format="docx" onChange={onChange} name="test-format" />);

    await user.click(screen.getByRole("radio", { name: /pdf/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("pdf");
  });

  it("calls onChange with 'docx' when the DOCX radio is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FormatSelector format="pdf" onChange={onChange} name="test-format" />);

    await user.click(screen.getByRole("radio", { name: /word/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("docx");
  });

  it("disables both radios when disabled=true", () => {
    render(<FormatSelector format="docx" onChange={() => {}} name="test-format" disabled />);
    expect(screen.getByRole("radio", { name: /word/i })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /pdf/i })).toBeDisabled();
  });

  it("does not call onChange when a disabled radio is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FormatSelector format="docx" onChange={onChange} name="test-format" disabled />);
    await user.click(screen.getByRole("radio", { name: /pdf/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders a fieldset with a legend labelling the group", () => {
    const { container } = render(
      <FormatSelector format="docx" onChange={() => {}} name="test-format" />
    );
    const fieldset = container.querySelector("fieldset");
    expect(fieldset).not.toBeNull();
    const legend = fieldset?.querySelector("legend");
    expect(legend).not.toBeNull();
    expect(legend?.textContent).toMatch(/output format/i);
  });
});
