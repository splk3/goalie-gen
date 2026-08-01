import * as React from "react";
import { render, screen } from "@testing-library/react";
import DrillTemplate from "../drill";
import { shouldPlaceProgressionsOnSecondPage } from "../../utils/estimateDrillPdfPages";
import { getEmbedUrl } from "../../utils/videoUtils";

jest.mock("../../utils/generateDrillPdf", () => ({
  generateDrillPdf: jest.fn(),
}));
jest.mock("../../utils/videoUtils", () => ({
  getEmbedUrl: jest.fn((url: string) =>
    url.includes("vimeo.com")
      ? "https://player.vimeo.com/video/123456"
      : "https://www.youtube.com/embed/video-id"
  ),
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
      space_required: ["flexible"],
    },
  },
};

describe("DrillTemplate", () => {
  beforeEach(() => {
    jest.mocked(shouldPlaceProgressionsOnSecondPage).mockReturnValue(false);
    jest.mocked(getEmbedUrl).mockClear();
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

  it("does not render a list when drill_steps is empty", () => {
    const { container } = render(<DrillTemplate pageContext={basePageContext} />);
    const orderedLists = container.querySelectorAll("ol");
    expect(orderedLists).toHaveLength(0);
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

  it("renders the main video before drill progressions for screen and browser print", () => {
    render(
      <DrillTemplate
        pageContext={{
          ...basePageContext,
          drillData: {
            ...basePageContext.drillData,
            video: "https://youtu.be/video-id",
            drill_progressions: [
              {
                progression_name: "Progression 1",
                progression_description: "Progression details",
              },
            ],
          },
        }}
      />
    );

    const videoHeading = screen.getByText("Video Demonstration");
    const progressionHeading = screen.getByText("Drill Progressions");
    expect(
      videoHeading.compareDocumentPosition(progressionHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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

  it("uses the progression media column for a video-only progression", () => {
    render(
      <DrillTemplate
        pageContext={{
          ...basePageContext,
          drillData: {
            ...basePageContext.drillData,
            drill_progressions: [
              {
                progression_name: "Video Only",
                progression_description: "Video details",
                progression_video: "https://youtu.be/video-id",
              },
            ],
          },
        }}
      />
    );

    const iframe = screen.getByTitle("Video Only progression video 1");
    expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/video-id");
    expect(iframe.parentElement).toHaveClass("print:hidden");
    expect(screen.getByText("Video details").closest(".grid")).toHaveClass(
      "grid",
      "md:grid-cols-2",
      "print:grid-cols-1"
    );
  });

  it("renders a progression image before its video with a unique accessible title", () => {
    render(
      <DrillTemplate
        pageContext={{
          ...basePageContext,
          drillData: {
            ...basePageContext.drillData,
            drill_progressions: [
              {
                progression_name: "Both Media",
                progression_description: "Both details",
                progression_image: "progression.png",
                progression_video: "https://vimeo.com/123456",
              },
            ],
          },
        }}
      />
    );

    const image = screen.getByAltText("Both Media diagram");
    const iframe = screen.getByTitle("Both Media progression video 1");
    expect(screen.getByText("Both details").closest(".grid")).toHaveClass("print:grid-cols-2");
    expect(image.compareDocumentPosition(iframe) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(iframe).toHaveAttribute("allow", expect.stringContaining("picture-in-picture"));
    expect(iframe).toHaveAttribute("sandbox", expect.stringContaining("allow-presentation"));
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

  it("renders sectioned coaching focus points with nested bullets", () => {
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

    expect(screen.getByText("Movement Quality:")).toBeInTheDocument();
    expect(screen.getByText("Explode on the first push")).toBeInTheDocument();
    expect(screen.getByText("Arrive set at each point")).toBeInTheDocument();
    expect(screen.getByText("Track puck into body")).toBeInTheDocument();
  });

  it("renders Space Required after Equipment Needed and hides it from print", () => {
    render(
      <DrillTemplate
        pageContext={{
          ...basePageContext,
          drillData: {
            ...basePageContext.drillData,
            tags: {
              team_drill: "no",
              equipment: ["cones"],
              space_required: ["full_ice", "crease_only"],
            },
          },
        }}
      />
    );

    const spaceLabel = screen.getByText("Space Required:");
    expect(spaceLabel).toBeInTheDocument();
    expect(screen.getByText("Full Ice, Crease Only")).toBeInTheDocument();

    // The Space Required block must be hidden in print/PDF output.
    const spaceContainer = spaceLabel.closest("div");
    expect(spaceContainer).not.toBeNull();
    expect(spaceContainer).toHaveClass("print:hidden");
  });

  it("does not render Space Required when the tag is absent", () => {
    render(
      <DrillTemplate
        pageContext={{
          ...basePageContext,
          drillData: {
            ...basePageContext.drillData,
            tags: {
              team_drill: "no",
              space_required: [],
            },
          },
        }}
      />
    );

    expect(screen.queryByText("Space Required:")).not.toBeInTheDocument();
  });
});
