import * as React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import GoalieDrills from "../goalie-drills";

jest.mock("../../components/PageLayout", () => {
  return function MockPageLayout({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

describe("GoalieDrills page", () => {
  const createDrill = (
    index: number,
    overrides?: Partial<{
      slug: string;
      name: string;
      description: string;
      drill_steps: string[];
      coaching_focus_points: string[];
      shooter_focus_points: string[];
      drill_image: string;
      drill_creation_date: string;
      drill_updated_date?: string;
      tags: {
        skill_level: string[];
        team_drill: string;
        age_level: string[];
        fundamental_skill: string[];
        skating_skill: string[];
        equipment: string[];
        space_required: string[];
      };
    }>
  ) => ({
    slug: `drill-${index}`,
    name: `Drill ${index}`,
    description: `Description ${index}`,
    drill_steps: [`Step ${index}`],
    coaching_focus_points: [`Coaching point ${index}`],
    shooter_focus_points: [`Shooter point ${index}`],
    drill_image: `drill-${index}.png`,
    drill_creation_date: "2026-01-01",
    drill_updated_date: "2026-01-02",
    tags: {
      skill_level: [index % 2 === 0 ? "beginner" : "advanced"],
      team_drill: index % 2 === 0 ? "yes" : "no",
      age_level: ["12U"],
      fundamental_skill: ["positioning"],
      skating_skill: ["t_push"],
      equipment: ["cones"],
      space_required: ["flexible"],
    },
    ...overrides,
  });

  const data = {
    allDrill: {
      nodes: [
        {
          slug: "team-drill",
          name: "Team Drill",
          description: "Great for rebound control and crease awareness.",
          drill_steps: ["Start at post", "Recover to center lane quickly"],
          coaching_focus_points: ["Track puck into body", "Control second save"],
          shooter_focus_points: ["Shoot low for rebounds"],
          drill_image: "team.png",
          drill_creation_date: "2026-01-01",
          drill_updated_date: "2026-01-02",
          tags: {
            skill_level: ["beginner"],
            team_drill: "yes",
            age_level: ["12U"],
            fundamental_skill: ["positioning"],
            skating_skill: ["t_push"],
            equipment: ["cones"],
            space_required: ["full_ice"],
          },
        },
        {
          slug: "goalie-drill",
          name: "Goalie Drill",
          description: "Works on elite tracking and reading release points.",
          drill_steps: ["Shallow angle setup", "React to pass across seam"],
          coaching_focus_points: ["Stay patient on feet", "Hands in front"],
          shooter_focus_points: ["Change release timing"],
          drill_image: "goalie.png",
          drill_creation_date: "2026-01-01",
          drill_updated_date: "2026-01-02",
          tags: {
            skill_level: ["advanced"],
            team_drill: "no",
            age_level: ["14U"],
            fundamental_skill: ["tracking"],
            skating_skill: ["shuffle"],
            equipment: [],
            space_required: ["whole_zone"],
          },
        },
      ],
    },
  };
  const largeData = {
    allDrill: {
      nodes: Array.from({ length: 20 }, (_, index) => createDrill(index + 1)),
    },
  };

  it("renders a Share a Drill Idea link that opens in a new tab", () => {
    render(<GoalieDrills data={data} />);

    const submitLink = screen.getByRole("link", { name: "Share a Drill Idea" });
    expect(submitLink).toBeInTheDocument();
    expect(submitLink).toHaveAttribute(
      "href",
      "https://github.com/splk3/goalie-gen/issues/new?template=new-drill-template.yml"
    );
    expect(submitLink).toHaveAttribute("target", "_blank");
    expect(submitLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows updated above created when present and hides updated when missing", () => {
    const dataWithMissingUpdatedDate = {
      allDrill: {
        nodes: [
          data.allDrill.nodes[0],
          {
            ...data.allDrill.nodes[1],
            drill_updated_date: undefined,
          },
        ],
      },
    };

    render(<GoalieDrills data={dataWithMissingUpdatedDate} />);

    const teamDrillCard = screen.getByRole("link", { name: "Team Drill" });
    expect(within(teamDrillCard).getByText("Team Drill!")).toBeInTheDocument();
    const teamDrillBadge = within(teamDrillCard).getByText("Team Drill!").closest("p");
    expect(teamDrillBadge?.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("/images/trophy.svg")
    );
    expect(within(teamDrillCard).getByText("Created:")).toBeInTheDocument();
    expect(within(teamDrillCard).getByText("Updated:")).toBeInTheDocument();
    expect(within(teamDrillCard).getByText("Created:").parentElement).toHaveTextContent(
      "Created: 2026-01-01"
    );
    expect(within(teamDrillCard).getByText("Updated:").parentElement).toHaveTextContent(
      "Updated: 2026-01-02"
    );
    expect(teamDrillCard).toHaveTextContent(/Updated:\s*2026-01-02[\s\S]*Created:\s*2026-01-01/);

    const goalieDrillCard = screen.getByRole("link", { name: "Goalie Drill" });
    expect(within(goalieDrillCard).getByText("Created:").parentElement).toHaveTextContent(
      "Created: 2026-01-01"
    );
    expect(within(goalieDrillCard).queryByText("Updated:")).not.toBeInTheDocument();
    expect(within(goalieDrillCard).queryByText("Team Drill!")).not.toBeInTheDocument();
  });

  it("shows New Content! or Updated Content! based on dates within the last 30 days", () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date("2026-01-20T12:00:00.000Z"));

      const freshnessData = {
        allDrill: {
          nodes: [
            createDrill(1, {
              slug: "fresh-updated",
              name: "Fresh Updated",
              drill_creation_date: "2025-11-01",
              drill_updated_date: "2026-01-10",
            }),
            createDrill(2, {
              slug: "fresh-created",
              name: "Fresh Created",
              drill_creation_date: "2026-01-05",
              drill_updated_date: undefined,
            }),
            createDrill(3, {
              slug: "stale-drill",
              name: "Stale Drill",
              drill_creation_date: "2025-11-01",
              drill_updated_date: "2025-12-01",
            }),
          ],
        },
      };

      render(<GoalieDrills data={freshnessData} />);

      const freshUpdatedCard = screen.getByRole("link", { name: "Fresh Updated" });
      const freshUpdatedBadge = within(freshUpdatedCard).getByText("Updated Content!").closest("p");
      expect(freshUpdatedBadge?.querySelector("img")).toHaveAttribute(
        "src",
        expect.stringContaining("/images/fire.svg")
      );

      const freshCreatedCard = screen.getByRole("link", { name: "Fresh Created" });
      expect(within(freshCreatedCard).getByText("New Content!")).toBeInTheDocument();

      const staleCard = screen.getByRole("link", { name: "Stale Drill" });
      expect(within(staleCard).queryByText("Updated Content!")).not.toBeInTheDocument();
      expect(within(staleCard).queryByText("New Content!")).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("syncs filters when location.search changes while mounted", async () => {
    const { rerender } = render(<GoalieDrills data={data} location={{ search: "" }} />);

    const teamDrillButton = screen.getByRole("button", { name: /Team Drill/i });
    expect(teamDrillButton).not.toHaveTextContent("(1)");

    rerender(<GoalieDrills data={data} location={{ search: "?team_drill=yes" }} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Team Drill/i })).toHaveTextContent("(1)");
    });
  });

  it("normalizes legacy single_zone URL filters to whole_zone", async () => {
    window.history.replaceState(null, "", "/goalie-drills");
    render(<GoalieDrills data={data} location={{ search: "?space_required=single_zone" }} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Space Required/i })).toHaveTextContent("(1)");
      expect(screen.getByRole("link", { name: "Goalie Drill" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Team Drill" })).not.toBeInTheDocument();
      expect(window.location.search).toContain("space_required=whole_zone");
    });
  });

  it("updates URL query params when dropdown filters are selected", async () => {
    window.history.replaceState(null, "", "/goalie-drills");
    render(<GoalieDrills data={data} />);

    fireEvent.click(screen.getByRole("button", { name: /Team Drill/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Yes" }));

    await waitFor(() => {
      expect(window.location.search).toContain("team_drill=yes");
    });
  });

  it("filters drills by text across name, description, steps, and focus points", () => {
    render(<GoalieDrills data={data} />);

    const searchInput = screen.getByRole("searchbox", { name: /Text Search/i });

    fireEvent.change(searchInput, { target: { value: "release timing" } });
    expect(screen.getByRole("link", { name: "Goalie Drill" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Team Drill" })).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "recover to center lane" } });
    expect(screen.getByRole("link", { name: "Team Drill" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Goalie Drill" })).not.toBeInTheDocument();
  });

  it("shows zero results when text search has no matches", () => {
    render(<GoalieDrills data={data} />);

    fireEvent.change(screen.getByRole("searchbox", { name: /Text Search/i }), {
      target: { value: "not-a-real-drill-text" },
    });

    expect(screen.getByText("Showing 0 drills")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Team Drill" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Goalie Drill" })).not.toBeInTheDocument();
  });

  it("initializes and updates text query from URL search params", async () => {
    window.history.replaceState(null, "", "/goalie-drills");

    const { rerender } = render(
      <GoalieDrills data={data} location={{ search: "?q=release+timing" }} />
    );

    expect(screen.getByRole("searchbox", { name: /Text Search/i })).toHaveValue("release timing");
    expect(screen.getByRole("link", { name: "Goalie Drill" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Team Drill" })).not.toBeInTheDocument();

    rerender(<GoalieDrills data={data} location={{ search: "?q=rebound" }} />);

    await waitFor(() => {
      expect(screen.getByRole("searchbox", { name: /Text Search/i })).toHaveValue("rebound");
    });

    fireEvent.change(screen.getByRole("searchbox", { name: /Text Search/i }), {
      target: { value: "center lane" },
    });

    await waitFor(() => {
      expect(window.location.search).toContain("q=center+lane");
    });
  });

  it("reset filters clears selected tag filters and text query", async () => {
    window.history.replaceState(null, "", "/goalie-drills");
    render(<GoalieDrills data={data} />);

    const searchInput = screen.getByRole("searchbox", { name: /Text Search/i });
    fireEvent.change(searchInput, { target: { value: "rebound" } });
    expect(searchInput).toHaveValue("rebound");
    expect(screen.getByText("Showing 1 drill")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Team Drill/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Yes" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Team Drill/i })).toHaveTextContent("(1)");
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset Filters" }));

    await waitFor(() => {
      expect(searchInput).toHaveValue("");
      expect(screen.getByRole("button", { name: /Team Drill/i })).not.toHaveTextContent("(1)");
      expect(screen.getByText("Showing 2 drills")).toBeInTheDocument();
      expect(window.location.search).not.toContain("team_drill=yes");
      expect(window.location.search).not.toContain("q=");
    });
  });

  it("keeps combined shareable URL state for text, dropdown filters, and sort", async () => {
    window.history.replaceState(null, "", "/goalie-drills");
    render(<GoalieDrills data={data} />);

    fireEvent.change(screen.getByRole("searchbox", { name: /Text Search/i }), {
      target: { value: "rebound" },
    });
    fireEvent.change(screen.getByLabelText("Sort by:"), { target: { value: "created_oldest" } });
    fireEvent.click(screen.getByRole("button", { name: /Team Drill/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Yes" }));

    await waitFor(() => {
      expect(window.location.search).toContain("q=rebound");
      expect(window.location.search).toContain("team_drill=yes");
      expect(window.location.search).toContain("sort=created_oldest");
    });
  });

  it("resets to page 1 in URL when filters change from a paged view", async () => {
    window.history.replaceState(null, "", "/goalie-drills?page=2");
    render(<GoalieDrills data={largeData} location={{ search: "?page=2" }} />);

    fireEvent.click(screen.getByRole("button", { name: /Team Drill/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Yes" }));

    await waitFor(() => {
      expect(window.location.search).toContain("team_drill=yes");
      expect(window.location.search).not.toContain("page=");
    });
  });

  it("preserves page from URL when text query is hydrated from location search", async () => {
    window.history.replaceState(null, "", "/goalie-drills");
    const { rerender } = render(<GoalieDrills data={largeData} location={{ search: "" }} />);

    rerender(<GoalieDrills data={largeData} location={{ search: "?q=drill&page=2" }} />);

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);
      expect(params.get("q")).toBe("drill");
      expect(params.get("page")).toBe("2");
    });
  });

  it("serializes and hydrates multiple values for the same filter category", async () => {
    window.history.replaceState(null, "", "/goalie-drills");
    const { rerender } = render(<GoalieDrills data={data} location={{ search: "" }} />);

    fireEvent.click(screen.getByRole("button", { name: /Skill Level/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Beginner" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Advanced" }));

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);
      expect(params.get("skill_level")).toBe("advanced,beginner");
    });

    rerender(<GoalieDrills data={data} location={{ search: "?skill_level=advanced,beginner" }} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Skill Level/i })).toHaveTextContent("(2)");
    });
  });
});
