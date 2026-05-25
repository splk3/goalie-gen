import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import GoalieDrills from "../goalie-drills";

jest.mock("../../components/PageLayout", () => {
  return function MockPageLayout({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

describe("GoalieDrills page", () => {
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
          },
        },
      ],
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

  it("syncs filters when location.search changes while mounted", async () => {
    const { rerender } = render(<GoalieDrills data={data} location={{ search: "" }} />);

    const teamDrillButton = screen.getByRole("button", { name: /Team Drill/i });
    expect(teamDrillButton).not.toHaveTextContent("(1)");

    rerender(<GoalieDrills data={data} location={{ search: "?team_drill=yes" }} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Team Drill/i })).toHaveTextContent("(1)");
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

    const { rerender } = render(<GoalieDrills data={data} location={{ search: "?q=release+timing" }} />);

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
    });
  });
});
