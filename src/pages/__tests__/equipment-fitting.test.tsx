import * as React from "react";
import { render, screen } from "@testing-library/react";
import EquipmentFitting from "../equipment-fitting";

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

jest.mock("../../components/ResourceList", () => {
  return function MockResourceList() {
    return <h2>External Resources</h2>;
  };
});

describe("EquipmentFitting page", () => {
  it("renders the page heading, resource section, and home link", () => {
    render(<EquipmentFitting />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Equipment Fitting" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "External Resources" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
  });
});
