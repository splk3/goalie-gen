import * as React from "react";
import { render, screen } from "@testing-library/react";
import GoalieResources from "../goalie-resources";

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

describe("GoalieResources page", () => {
  it("renders About Goalie Resources below Helpful External Resources", () => {
    render(<GoalieResources />);

    const headings = screen.getAllByRole("heading");
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Goalie Resources",
      "Goalie Tools",
      "Helpful External Resources",
      "About Goalie Resources",
    ]);
  });

  it("renders Goalie Journal first with a stacked tools layout", () => {
    render(<GoalieResources />);

    const toolControls = screen
      .getByRole("heading", { name: "Goalie Tools" })
      .parentElement?.querySelectorAll("button, a");
    expect(Array.from(toolControls ?? []).map((control) => control.textContent)).toEqual([
      "Goalie Journal",
      "Coach Z's Zone Map",
      "Equipment Fitting",
    ]);
    expect(screen.getByRole("link", { name: "Goalie Journal" })).toHaveAttribute(
      "href",
      "/about-goalie-journals"
    );
    expect(screen.getByRole("link", { name: "Equipment Fitting" })).toHaveAttribute(
      "href",
      "/equipment-fitting"
    );
  });
});
