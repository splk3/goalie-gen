import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DownloadDrillPdfButton from "../DownloadDrillPdfButton";
import { trackEvent } from "../../utils/analytics";

// Mock analytics
jest.mock("../../utils/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockGenerateDrillPdfBlob = jest.fn();

// Mock dynamic import for generating PDF
jest.mock("../../utils/generateDrillPdf", () => {
  return {
    generateDrillPdfBlob: (...args: unknown[]) => mockGenerateDrillPdfBlob(...args),
  };
});

describe("DownloadDrillPdfButton", () => {
  const mockDrillData = {
    name: 'Test Drill <|>?:*"', // Add special characters to test filename sanitation
    drill_steps: ["Step 1"],
    coaching_focus_points: ["Focus 1"],
    drill_creation_date: "2023-01-01",
    tags: {
      skill_level: ["Beginner"],
      age_level: ["10U"],
      space_required: ["Half Ice"],
    },
  };

  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  let originalAlert: typeof window.alert;
  let originalConsoleError: typeof console.error;

  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => "blob:test-url");
    URL.revokeObjectURL = jest.fn();
    originalAlert = window.alert;
    originalConsoleError = console.error;
  });

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    window.alert = originalAlert;
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    console.error = jest.fn();
  });

  it("renders correctly", async () => {
    render(
      <DownloadDrillPdfButton
        drillData={mockDrillData as unknown as import("../../types/drill").DrillData}
        drillFolder="test-folder"
        drillSlug="test-drill"
      />
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Download Drill" })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Download Drill" })).not.toBeDisabled());
  });

  it("handles successful PDF generation and button state changes", async () => {
    const mockBlob = new Blob(["test-pdf-content"], { type: "application/pdf" });

    mockGenerateDrillPdfBlob.mockImplementation(async (drillData: import("../../types/drill").DrillData, drillFolder: string, onProgress: import("../../utils/generateDrillPdf").DrillPdfProgressCallback) => {
      onProgress("Processing layout...");
      return new Promise((resolve) => setTimeout(() => resolve(mockBlob), 10));
    });

    const user = userEvent.setup();
    render(
      <DownloadDrillPdfButton
        drillData={mockDrillData as unknown as import("../../types/drill").DrillData}
        drillFolder="test-folder"
        drillSlug="test-drill"
      />
    );

    const button = screen.getByRole("button", { name: "Download Drill" });
    expect(button).not.toBeDisabled();

    const clickPromise = user.click(button);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Loading images..." })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Loading images..." })).toBeDisabled();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Processing layout..." })).toBeInTheDocument();
    });

    await clickPromise;
    await waitFor(() => expect(trackEvent).toHaveBeenCalled());

    expect(trackEvent).toHaveBeenCalledWith("download_drill", {
      drill_name: mockDrillData.name,
      drill_slug: "test-drill",
      age_group: "10U",
      skill_level: "Beginner",
      source_page: "drill_page",
    });

    await waitFor(() => expect(screen.getByRole("button", { name: "Download Drill" })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Download Drill" })).not.toBeDisabled());
  });

  it("handles generic error during PDF generation", async () => {
    const error = new Error("Generic failure");
    mockGenerateDrillPdfBlob.mockRejectedValueOnce(error);

    const user = userEvent.setup();
    render(
      <DownloadDrillPdfButton
        drillData={mockDrillData as unknown as import("../../types/drill").DrillData}
        drillFolder="test-folder"
        drillSlug="test-drill"
      />
    );

    const button = screen.getByRole("button", { name: "Download Drill" });
    await user.click(button);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Error generating PDF:", error);
    });

    expect(window.alert).toHaveBeenCalledWith(
      "Failed to generate PDF. Please ensure your browser supports PDF generation and try again."
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Download Drill" })).not.toBeDisabled());
  });

  it("handles Out of Memory error during PDF generation", async () => {
    const error = new Error("Javascript heap out of memory");
    mockGenerateDrillPdfBlob.mockRejectedValueOnce(error);

    const user = userEvent.setup();
    render(
      <DownloadDrillPdfButton
        drillData={mockDrillData as unknown as import("../../types/drill").DrillData}
        drillFolder="test-folder"
        drillSlug="test-drill"
      />
    );

    const button = screen.getByRole("button", { name: "Download Drill" });
    await user.click(button);

    // Wait for the error handling to complete
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Error generating PDF:", error);
    });

    expect(window.alert).toHaveBeenCalledWith(
      "Unable to generate PDF: one or more images are too large. Try reducing image sizes and try again."
    );

    // Button should be re-enabled
    await waitFor(() => expect(screen.getByRole("button", { name: "Download Drill" })).not.toBeDisabled());
  });
});