import * as React from "react";
import { render, screen } from "@testing-library/react";
import CoachResources from "../coach-resources";

jest.mock("../../components/PageLayout", () => {
  return function MockPageLayout({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

jest.mock("../../components/ShareButton", () => {
  return function MockShareButton() {
    return <button>Share</button>;
  };
});

jest.mock("../../components/BackLinkButton", () => {
  return function MockBackLinkButton({ children, to }: { children: React.ReactNode; to: string }) {
    return <a href={to}>{children}</a>;
  };
});

jest.mock("../../components/DownloadMaterialButton", () => {
  return function MockDownloadMaterialButton({ title }: { title: string }) {
    return <button>{title}</button>;
  };
});

jest.mock("../../components/NavigationButton", () => {
  return function MockNavigationButton({
    children,
    to,
  }: {
    children: React.ReactNode;
    to: string;
  }) {
    return <a href={to}>{children}</a>;
  };
});

jest.mock("../../components/ResourceList", () => {
  return function MockResourceList() {
    return <h2>Helpful External Resources</h2>;
  };
});

describe("CoachResources page", () => {
  it("renders Coach Tools before Helpful External Resources without Evaluation Forms", () => {
    render(<CoachResources />);

    const headings = screen.getAllByRole("heading");
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Coach Resources",
      "Coach Tools",
      "Helpful External Resources",
      "About Coach Resources",
    ]);
    expect(screen.queryByRole("heading", { name: "Evaluation Forms" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Goalie Evaluations" })).toHaveAttribute(
      "href",
      "/goalie-evals"
    );
    expect(screen.getByRole("link", { name: "Team Goalie Development" })).toHaveAttribute(
      "href",
      "/about-team-plans"
    );
    expect(screen.getByRole("link", { name: "Goalie Journal" })).toHaveAttribute(
      "href",
      "/about-goalie-journals"
    );
    expect(screen.getByRole("link", { name: "Equipment Fitting" })).toHaveAttribute(
      "href",
      "/equipment-fitting"
    );
    const toolControls = screen
      .getByRole("heading", { name: "Coach Tools" })
      .parentElement?.querySelectorAll("button, a");
    expect(Array.from(toolControls ?? []).map((control) => control.textContent)).toEqual([
      "Team Goalie Development",
      "Goalie Journal",
      "Goalie Evaluations",
      "Coach Z's Zone Map",
      "Goalie-Friendly Practice Checklist",
      "Equipment Fitting",
    ]);
  });
});
