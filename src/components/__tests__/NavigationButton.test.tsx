import * as React from "react";
import { render, screen } from "@testing-library/react";
import NavigationButton from "../NavigationButton";
import BackLinkButton from "../BackLinkButton";

// gatsby is mocked via __mocks__/gatsby.js; Link renders as a plain <a> tag

describe("NavigationButton", () => {
  it("renders a link with the correct href", () => {
    render(<NavigationButton to="/goalie-drills">Drills</NavigationButton>);
    const link = screen.getByRole("link", { name: "Drills" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/goalie-drills");
  });

  it("renders children text inside the link", () => {
    render(<NavigationButton to="/">Home</NavigationButton>);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("applies additional className prop", () => {
    render(
      <NavigationButton to="/" className="extra-class">
        Home
      </NavigationButton>
    );
    const link = screen.getByRole("link", { name: "Home" });
    expect(link).toHaveClass("extra-class");
  });

  it("uses the blue variant styling by default", () => {
    render(<NavigationButton to="/">Home</NavigationButton>);
    const link = screen.getByRole("link", { name: "Home" });
    expect(link.className).toMatch(/bg-usa-blue/);
  });

  it("uses the red variant styling when variant='red'", () => {
    render(
      <NavigationButton to="/" variant="red">
        Home
      </NavigationButton>
    );
    const link = screen.getByRole("link", { name: "Home" });
    expect(link.className).toMatch(/bg-usa-red/);
  });
});

describe("BackLinkButton", () => {
  it("renders a link with the correct href and label", () => {
    render(<BackLinkButton to="/goalie-drills">Back to Drills</BackLinkButton>);

    const link = screen.getByRole("link", { name: "Back to Drills" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/goalie-drills");
  });

  it("applies the responsive mobile-friendly classes", () => {
    render(<BackLinkButton to="/">Back to Home</BackLinkButton>);

    const link = screen.getByRole("link", { name: "Back to Home" });
    expect(link).toHaveClass("max-w-full");
    expect(link).toHaveClass("justify-center");
    expect(link).toHaveClass("sm:w-auto");
  });

  it("merges additional classes", () => {
    render(
      <BackLinkButton to="/" className="w-full max-w-xs">
        Back to Home
      </BackLinkButton>
    );

    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveClass("w-full", "max-w-xs");
  });
});
