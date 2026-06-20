import * as React from "react";
import { render, screen } from "@testing-library/react";
import AboutPage from "../AboutPage";

jest.mock("../PageLayout", () => {
  return function MockPageLayout({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

jest.mock("../ShareButton", () => {
  return function MockShareButton() {
    return <button>Share</button>;
  };
});

jest.mock("../BackLinkButton", () => {
  return function MockBackLinkButton({ children, to }: { children: React.ReactNode; to: string }) {
    return <a href={to}>{children}</a>;
  };
});

describe("AboutPage", () => {
  const defaultProps = {
    title: "About Test Plans",
    subtitle: "A subtitle for testing purposes.",
    rawMarkdown: "Some **markdown** content.",
  };

  it("renders the page title as an h1", () => {
    render(<AboutPage {...defaultProps} />);
    expect(screen.getByRole("heading", { level: 1, name: "About Test Plans" })).toBeInTheDocument();
  });

  it("renders the subtitle in the hero banner", () => {
    render(<AboutPage {...defaultProps} />);
    expect(screen.getByText("A subtitle for testing purposes.")).toBeInTheDocument();
  });

  it("renders the Content Coming Soon notice", () => {
    render(<AboutPage {...defaultProps} />);
    expect(screen.getByText(/Content Coming Soon!/i)).toBeInTheDocument();
  });

  it("renders the Back to Home link pointing to /", () => {
    render(<AboutPage {...defaultProps} />);
    const backLink = screen.getByRole("link", { name: /back to home/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("renders markdown content via DrillMarkdown", () => {
    render(<AboutPage {...defaultProps} rawMarkdown="Hello from markdown." />);
    expect(screen.getByText("Hello from markdown.")).toBeInTheDocument();
  });
});
