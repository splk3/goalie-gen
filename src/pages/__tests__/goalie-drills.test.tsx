import * as React from "react";
import { render, screen } from "@testing-library/react";
import GoalieDrills from "../goalie-drills";

jest.mock("../../components/PageLayout", () => {
  return function MockPageLayout({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

describe("GoalieDrills page", () => {
  it("renders a Submit a New Drill link that opens in a new tab", () => {
    const data = {
      allDrill: {
        nodes: [
          {
            slug: "test-drill",
            name: "Test Drill",
            images: ["test.png"],
            drill_creation_date: "2026-01-01",
            drill_updated_date: "2026-01-02",
            tags: {
              skill_level: ["beginner"],
              team_drill: ["yes"],
              age_level: ["10u"],
              fundamental_skill: ["positioning"],
              skating_skill: ["t_push"],
              equipment: ["cones"],
            },
          },
        ],
      },
    };

    render(<GoalieDrills data={data} />);

    const submitLink = screen.getByRole("link", { name: "Submit a New Drill" });
    expect(submitLink).toBeInTheDocument();
    expect(submitLink).toHaveAttribute(
      "href",
      "https://github.com/splk3/goalie-gen/issues/new?template=new-drill-template.yml"
    );
    expect(submitLink).toHaveAttribute("target", "_blank");
    expect(submitLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
