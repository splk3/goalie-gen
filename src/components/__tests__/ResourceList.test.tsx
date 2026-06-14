import * as React from "react";
import { render, screen } from "@testing-library/react";
import ResourceList from "../ResourceList";
import type { ResourceItem } from "../../types/resources";

const sampleItems: ResourceItem[] = [
  {
    name: "How to Structure a Goaltending Development Program - Hiroki Wakabayashi",
    description:
      "Learn how to develop a goaltending development plan for your club following the strategies identified by Hiroki Wakabayashi as part of the USA Hockey Goaltending Gold Class of 2024",
    link: "https://worldhockeylab.com/how_to_structure_a_goaltending_development_program/",
  },
  {
    name: "USA Hockey Goaltending Resources",
    description: "Official USA Hockey resources and information for goaltending programs.",
    link: "https://www.usahockey.com/goaltending",
  },
];

describe("ResourceList", () => {
  it("renders the default heading when no heading prop is supplied", () => {
    render(<ResourceList items={sampleItems} />);
    expect(screen.getByRole("heading", { name: "External Resources" })).toBeInTheDocument();
  });

  it("renders a custom heading when supplied", () => {
    render(<ResourceList items={sampleItems} heading="Club Links" />);
    expect(screen.getByRole("heading", { name: "Club Links" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "External Resources" })).not.toBeInTheDocument();
  });

  it("renders a link for each resource item", () => {
    render(<ResourceList items={sampleItems} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(sampleItems.length);
  });

  it("renders each resource name as link text", () => {
    render(<ResourceList items={sampleItems} />);
    for (const item of sampleItems) {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    }
  });

  it("renders each resource description", () => {
    render(<ResourceList items={sampleItems} />);
    for (const item of sampleItems) {
      expect(screen.getByText(item.description)).toBeInTheDocument();
    }
  });

  it("sets href, target, and rel on each link", () => {
    render(<ResourceList items={sampleItems} />);
    const links = screen.getAllByRole("link");
    links.forEach((link, i) => {
      expect(link).toHaveAttribute("href", sampleItems[i].link);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("renders a 'Visit resource' label on each link", () => {
    render(<ResourceList items={sampleItems} />);
    const visitLabels = screen.getAllByText("Visit resource");
    expect(visitLabels).toHaveLength(sampleItems.length);
  });

  it("returns null and renders nothing when items array is empty", () => {
    const { container } = render(<ResourceList items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null and renders nothing when items is undefined", () => {
    // Cast to any to simulate a missing/undefined prop (e.g. YAML parse failure)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { container } = render(<ResourceList items={undefined as any} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a single item without error", () => {
    render(<ResourceList items={[sampleItems[0]]} />);
    expect(screen.getByText(sampleItems[0].name)).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
