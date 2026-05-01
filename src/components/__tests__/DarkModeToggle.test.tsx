import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import DarkModeToggle from "../DarkModeToggle";

describe("DarkModeToggle", () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Reset DOM
    document.documentElement.className = "";

    // Mock localStorage
    localStorageMock = {};
    const mockStorage = {
      getItem: jest.fn((key) => localStorageMock[key] || null),
      setItem: jest.fn((key, value) => {
        localStorageMock[key] = value.toString();
      }),
      removeItem: jest.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: jest.fn(() => {
        localStorageMock = {};
      }),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders with aria-label 'Toggle dark mode' when not mounted (initial render / SSR)", () => {
    const html = renderToString(<DarkModeToggle />);
    expect(html).toContain('aria-label="Toggle dark mode"');
  });

  it("loads dark mode if it is saved in localStorage", async () => {
    localStorageMock["theme"] = "dark";

    render(<DarkModeToggle />);

    // Check that aria-label reflects dark mode state
    const button = await screen.findByRole("button", { name: "Switch to light mode" });
    expect(button).toBeInTheDocument();

    // Check that dark class was added
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("loads light mode if it is saved in localStorage", async () => {
    localStorageMock["theme"] = "light";

    render(<DarkModeToggle />);

    // Check that aria-label reflects light mode state
    const button = await screen.findByRole("button", { name: "Switch to dark mode" });
    expect(button).toBeInTheDocument();

    // Check that dark class is not present
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggles dark mode when clicked", async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle />);

    // Initial state (light mode)
    const button = await screen.findByRole("button", { name: "Switch to dark mode" });
    expect(button).toBeInTheDocument();

    // Click to toggle to dark mode
    await user.click(button);

    // Check new state
    expect(await screen.findByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.setItem).toHaveBeenCalledWith("theme", "dark");

    // Click to toggle back to light mode
    await user.click(await screen.findByRole("button", { name: "Switch to light mode" }));

    // Check new state
    expect(await screen.findByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.setItem).toHaveBeenCalledWith("theme", "light");
  });
});
