import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
});
