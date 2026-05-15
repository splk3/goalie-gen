import * as React from "react";
import { render, screen } from "@testing-library/react";
import DrillTemplate from "../drill";

jest.mock("../../utils/generateDrillPdf", () => ({
  generateDrillPdf: jest.fn(),
}));
jest.mock("../../utils/videoUtils", () => ({
  getEmbedUrl: jest.fn(() => ""),
  getVideoThumbnail: jest.fn(() => ""),
}));
jest.mock("../../components/SEO", () => () => null);
jest.mock(
  "../../components/Logo",
  () =>
    function MockLogo() {
      return <div>Logo</div>;
    }
);
jest.mock(
  "../../components/DarkModeToggle",
  () =>
    function MockDarkModeToggle() {
      return <button>Dark Mode</button>;
    }
);
jest.mock(
  "../../components/DownloadDrillPdfButton",
  () =>
    function MockDownloadDrillPdfButton() {
      return <button>Download PDF</button>;
    }
);
jest.mock(
  "../../components/UsaHockeyGoldBanner",
  () =>
    function MockUsaHockeyGoldBanner() {
      return <div>Gold Banner</div>;
    }
);

const basePageContext = {
  slug: "test-drill",
  drillFolder: "test-drill",
  drillData: {
    name: "Test Drill",
    description: "Description text",
    coaching_focus_points: ["Focus point 1"],
    drill_image: "test-drill-image.png",
    drill_creation_date: "2026-01-01",
    tags: {
      team_drill: ["no"],
    },
  },
};

describe("DrillTemplate", () => {
  it("renders drill_steps as an ordered list directly below description", () => {
    const { container } = render(
      <DrillTemplate
        pageContext={{
          ...basePageContext,
          drillData: {
            ...basePageContext.drillData,
            drill_steps: ["Step one", "Step two"],
          },
        }}
      />
    );

    expect(screen.getByText("Description text")).toBeInTheDocument();
    expect(screen.getByText("Step one")).toBeInTheDocument();
    expect(screen.getByText("Step two")).toBeInTheDocument();

    const orderedLists = container.querySelectorAll("ol");
    expect(orderedLists).toHaveLength(1);
  });

  it("does not render drill_steps when missing or empty", () => {
    const { rerender } = render(<DrillTemplate pageContext={basePageContext} />);
    expect(screen.queryByText("Step one")).not.toBeInTheDocument();

    rerender(
      <DrillTemplate
        pageContext={{
          ...basePageContext,
          drillData: {
            ...basePageContext.drillData,
            drill_steps: [],
          },
        }}
      />
    );

    expect(screen.queryByText("Step one")).not.toBeInTheDocument();
  });
});
