import * as React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ShareButton from "../ShareButton";

// Save original navigator properties
const originalShare = navigator.share;
const originalClipboard = navigator.clipboard;

afterEach(() => {
  Object.defineProperty(navigator, "share", {
    value: originalShare,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(navigator, "clipboard", {
    value: originalClipboard,
    writable: true,
    configurable: true,
  });
  jest.useRealTimers();
});

describe("ShareButton", () => {
  it("renders with default label", () => {
    render(<ShareButton />);
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(<ShareButton label="Share Goalie Gen" />);
    expect(screen.getByRole("button", { name: /share goalie gen/i })).toBeInTheDocument();
  });

  it("renders the share SVG icon", () => {
    const { container } = render(<ShareButton />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("applies custom className", () => {
    render(<ShareButton className="my-custom-class" />);
    expect(screen.getByRole("button")).toHaveClass("my-custom-class");
  });

  it("uses navigator.share when available", async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    render(<ShareButton label="Share" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /share/i }));
    });

    expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({ url: expect.any(String) }));
  });

  it("copies to clipboard when navigator.share is unavailable", async () => {
    jest.useFakeTimers();
    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    render(<ShareButton label="Share" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /share/i }));
    });

    expect(mockWriteText).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();

    // Label resets after 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
    });
  });

  it("handles navigator.share cancellation gracefully", async () => {
    const mockShare = jest.fn().mockRejectedValue(new Error("AbortError"));
    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    render(<ShareButton />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    // Should not throw; label stays as "Share"
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });
});
