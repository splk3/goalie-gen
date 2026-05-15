import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HamburgerMenu from "../HamburgerMenu";

describe("HamburgerMenu", () => {
  it("renders the hamburger button", () => {
    render(<HamburgerMenu />);
    expect(screen.getByRole("button", { name: /open navigation menu/i })).toBeInTheDocument();
  });

  it("menu is closed by default", () => {
    render(<HamburgerMenu />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("opens the menu when the hamburger button is clicked", () => {
    render(<HamburgerMenu />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("sets aria-expanded to true when open", () => {
    render(<HamburgerMenu />);
    const button = screen.getByRole("button", { name: /open navigation menu/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("shows all navigation links when open", () => {
    render(<HamburgerMenu />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Goalie Drills" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Team Drills with Goalie Focus" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Goalie Evaluations" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Club Resources" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Coach Resources" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Goalie Resources" })).toBeInTheDocument();
  });

  it("closes the menu when the close button is clicked", () => {
    render(<HamburgerMenu />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close navigation menu/i }));
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("closes the menu when Escape is pressed", () => {
    render(<HamburgerMenu />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("closes the menu when a nav link is clicked", () => {
    render(<HamburgerMenu />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));
    fireEvent.click(screen.getByRole("link", { name: "Home" }));
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
