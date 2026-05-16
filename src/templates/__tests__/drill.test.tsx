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
    drill_steps: [] as string[],
    coaching_focus_points: ["Focus point 1"],
    drill_image: "test-drill-image.png",
    drill_creation_date: "2026-01-01",
    tags: {
      team_drill: "no",
    },
  },
};

describe("DrillTemplate", () => {
  it("renders the Drill Information heading and drill_steps as an ordered list", () => {
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

    expect(screen.getByText("Drill Information")).toBeInTheDocument();
    expect(screen.getByText("Description text")).toBeInTheDocument();
    expect(screen.getByText("Step one")).toBeInTheDocument();
    expect(screen.getByText("Step two")).toBeInTheDocument();

    const orderedLists = container.querySelectorAll("ol");
    expect(orderedLists).toHaveLength(1);
  });

  it("does not render description paragraph when description is absent", () => {
    const { container } = render(
      <DrillTemplate
        pageContext={{
          ...basePageContext,
          drillData: {
            ...basePageContext.drillData,
            description: undefined,
            drill_steps: ["Step one"],
          },
        }}
      />
    );

    expect(screen.getByText("Drill Information")).toBeInTheDocument();
    expect(screen.queryByText("Description text")).not.toBeInTheDocument();
    expect(screen.getByText("Step one")).toBeInTheDocument();
    const paragraphs = container.querySelectorAll("p");
    const descParagraph = Array.from(paragraphs).find((p) =>
      p.textContent?.includes("Description text")
    );
    expect(descParagraph).toBeUndefined();
  });

  it("renders an empty ordered list when drill_steps is an empty array", () => {
    const { container } = render(<DrillTemplate pageContext={basePageContext} />);
    const orderedLists = container.querySelectorAll("ol");
    expect(orderedLists).toHaveLength(1);
    expect(orderedLists[0].querySelectorAll("li")).toHaveLength(0);
  });

  it("renders a Back to Drills link defaulting to /goalie-drills", () => {
    render(<DrillTemplate pageContext={basePageContext} />);
    const links = screen.getAllByRole("link", { name: /back to drills/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/goalie-drills");
  });

  it("renders Share buttons on the drill page", () => {
    render(<DrillTemplate pageContext={basePageContext} />);
    const shareButtons = screen.getAllByRole("button", { name: /share/i });
    expect(shareButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("renders progression name, description, and optional image", () => {
    render(
      <DrillTemplate
        pageContext={{
          ...basePageContext,
          drillData: {
            ...basePageContext.drillData,
            drill_progressions: [
              {
                progression_name: "Progression 1",
                progression_description: "Progression details here",
              },
              {
                progression_name: "Progression 2",
                progression_description: "Progression with image",
                progression_image: "progression-2.png",
              },
            ],
          },
        }}
      />
    );

    expect(screen.getByText("Drill Progressions")).toBeInTheDocument();
    expect(screen.getByText("Progression 1")).toBeInTheDocument();
    expect(screen.getByText("Progression details here")).toBeInTheDocument();
    expect(screen.getByText("Progression 2")).toBeInTheDocument();
    expect(screen.getByText("Progression with image")).toBeInTheDocument();
    expect(screen.getByAltText("Progression 2 diagram")).toBeInTheDocument();
  });
});
