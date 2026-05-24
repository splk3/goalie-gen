import * as React from "react";
import { render, screen } from "@testing-library/react";
import BackLinkButton from "../BackLinkButton";

describe("BackLinkButton", () => {
  it("renders a link with the correct href and label", () => {
    render(<BackLinkButton to="/goalie-drills">Back to Drills</BackLinkButton>);

    const link = screen.getByRole("link", { name: "Back to Drills" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/goalie-drills");
  });

  it("applies the responsive mobile-friendly classes by default", () => {
    render(<BackLinkButton to="/">Back to Home</BackLinkButton>);

    const link = screen.getByRole("link", { name: "Back to Home" });
    expect(link).toHaveClass("w-full");
    expect(link).toHaveClass("max-w-full");
    expect(link).toHaveClass("justify-center");
    expect(link).toHaveClass("sm:w-auto");
  });

  it("merges additional classes", () => {
    render(
      <BackLinkButton to="/" className="max-w-xs">
        Back to Home
      </BackLinkButton>
    );

    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveClass("w-full", "max-w-xs");
  });
});
