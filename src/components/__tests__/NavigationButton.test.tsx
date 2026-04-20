import * as React from "react";
import { render, screen } from "@testing-library/react";
import NavigationButton from "../NavigationButton";

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
