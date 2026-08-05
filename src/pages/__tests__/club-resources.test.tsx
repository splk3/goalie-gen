import * as React from "react";
import { render, screen } from "@testing-library/react";
import ClubResources from "../club-resources";

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

describe("ClubResources page", () => {
  it("renders Club Tools before Helpful External Resources", () => {
    render(<ClubResources />);

    const headings = screen.getAllByRole("heading");
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Club Resources",
      "Club Tools",
      "Helpful External Resources",
      "About Club Resources",
    ]);
    expect(screen.getByRole("link", { name: "Club Goalie Development" })).toHaveAttribute(
      "href",
      "/about-club-plans"
    );
    expect(screen.getByRole("link", { name: "Team Goalie Development" })).toHaveAttribute(
      "href",
      "/about-team-plans"
    );
    expect(
      screen.getByRole("link", { name: "Fundamental Skills and Good Drill Design" })
    ).toHaveAttribute("href", "/fundamental-skills-and-good-drill-design");
    expect(screen.getByRole("link", { name: "Goalie Evaluations" })).toHaveAttribute(
      "href",
      "/goalie-evals"
    );
    expect(screen.getByRole("link", { name: "Equipment Fitting" })).toHaveAttribute(
      "href",
      "/equipment-fitting"
    );
  });
});
