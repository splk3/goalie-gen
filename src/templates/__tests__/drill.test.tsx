import * as React from "react";
import { render, screen } from "@testing-library/react";
import DrillTemplate from "../drill";
import { shouldPlaceProgressionsOnSecondPage } from "../../utils/estimateDrillPdfPages";

jest.mock("../../utils/generateDrillPdf", () => ({
  generateDrillPdf: jest.fn(),
}));
jest.mock("../../utils/videoUtils", () => ({
  getEmbedUrl: jest.fn(() => ""),
  getVideoThumbnail: jest.fn(() => ""),
}));
jest.mock("../../components/SEO", () => () => null);
jest.mock("../../utils/estimateDrillPdfPages", () => ({
  shouldPlaceProgressionsOnSecondPage: jest.fn(() => false),
}));
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
  "../../components/HamburgerMenu",
  () =>
    function MockHamburgerMenu() {
      return <button aria-label="Open navigation menu">Menu</button>;
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
  beforeEach(() => {
    jest.mocked(shouldPlaceProgressionsOnSecondPage).mockReturnValue(false);
  });

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

  it("renders the page without a main drill image when drill_image is absent", () => {
    render(
      <DrillTemplate
        pageContext={{
          ...basePageContext,
          drillData: {
            ...basePageContext.drillData,
            drill_image: undefined,
          },
        }}
      />
    );

    expect(screen.getByText("Drill Information")).toBeInTheDocument();
    expect(screen.queryByAltText("Drill diagram")).not.toBeInTheDocument();
  });

  it("renders a Back to Drills link defaulting to /goalie-drills", () => {
    render(<DrillTemplate pageContext={basePageContext} />);
    const links = screen.getAllByRole("link", { name: /back to drills/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/goalie-drills");
  });

  it("stacks the top drill actions for mobile layouts", () => {
    render(<DrillTemplate pageContext={basePageContext} />);

    const links = screen.getAllByRole("link", { name: /back to drills/i });
    expect(links[0]).toHaveClass("w-full", "sm:w-auto");
  });

  it("renders the hamburger menu in the screen header", () => {
    render(<DrillTemplate pageContext={basePageContext} />);
    expect(screen.getByRole("button", { name: /open navigation menu/i })).toBeInTheDocument();
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
            drill_progressions: Array.from({ length: 8 }, (_, index) => ({
              progression_name: `Progression ${index + 1}`,
              progression_description: `Progression details ${index + 1}`,
              ...(index === 1 ? { progression_image: "progression-2.png" } : {}),
            })),
          },
        }}
      />
    );

    expect(screen.getByText("Drill Progressions")).toBeInTheDocument();
    expect(screen.getByText("Progression 1")).toBeInTheDocument();
    expect(screen.getByText("Progression details 1")).toBeInTheDocument();
    expect(screen.getByText("Progression 8")).toBeInTheDocument();
    expect(screen.getByText("Progression details 8")).toBeInTheDocument();
    expect(screen.getByAltText("Progression 2 diagram")).toBeInTheDocument();
  });

  it("adds a print page break class to progressions when placement helper requires page two", () => {
    jest.mocked(shouldPlaceProgressionsOnSecondPage).mockReturnValue(true);

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
            ],
          },
        }}
      />
    );

    const progressionHeading = screen.getByText("Drill Progressions");
    expect(progressionHeading.closest("div")).toHaveClass("print-break-before-page");
  });

  it("renders sectioned coaching focus points with bold headings and nested bullets", () => {
    render(
      <DrillTemplate
        pageContext={{
          ...basePageContext,
          drillData: {
            ...basePageContext.drillData,
            coaching_focus_points: [
              {
                "Movement Quality:": ["Explode on the first push", "Arrive set at each point"],
              },
              "Track puck into body",
            ],
          },
        }}
      />
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Movement Quality:" })
    ).toBeInTheDocument();
    expect(screen.getByText("Explode on the first push")).toBeInTheDocument();
    expect(screen.getByText("Arrive set at each point")).toBeInTheDocument();
    expect(screen.getByText("Track puck into body")).toBeInTheDocument();
  });
});
