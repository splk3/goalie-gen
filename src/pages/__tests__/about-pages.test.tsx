import * as React from "react";
import { render, screen } from "@testing-library/react";
import AboutClubPlans from "../about-club-plans";
import AboutTeamPlans from "../about-team-plans";
import AboutGoalieJournals from "../about-goalie-journals";
import PatrickBoyleProject from "../patrick-boyle-project";
import KatieJablynskiProject from "../katie-jablynski-project";
import JamesKujawskiProject from "../james-kujawski-project";

// .md files are mapped to "test-file-stub" by Jest's moduleNameMapper.
// PageLayout, ShareButton, and BackLinkButton are mocked to isolate page rendering.

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

describe("About pages", () => {
  describe("AboutClubPlans (/about-club-plans)", () => {
    beforeEach(() => render(<AboutClubPlans />));

    it("renders the correct h1 title", () => {
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "About Club Development Plans",
        })
      ).toBeInTheDocument();
    });

    it("renders the Content Coming Soon notice", () => {
      expect(screen.getByText(/Content Coming Soon!/i)).toBeInTheDocument();
    });

    it("renders a Back to Home link", () => {
      expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
    });
  });

  describe("AboutTeamPlans (/about-team-plans)", () => {
    beforeEach(() => render(<AboutTeamPlans />));

    it("renders the correct h1 title", () => {
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "About Team Development Plans",
        })
      ).toBeInTheDocument();
    });

    it("renders the Content Coming Soon notice", () => {
      expect(screen.getByText(/Content Coming Soon!/i)).toBeInTheDocument();
    });

    it("renders a Back to Home link", () => {
      expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
    });
  });

  describe("AboutGoalieJournals (/about-goalie-journals)", () => {
    beforeEach(() => render(<AboutGoalieJournals />));

    it("renders the correct h1 title", () => {
      expect(
        screen.getByRole("heading", { level: 1, name: "About Goalie Journals" })
      ).toBeInTheDocument();
    });

    it("renders the Content Coming Soon notice", () => {
      expect(screen.getByText(/Content Coming Soon!/i)).toBeInTheDocument();
    });

    it("renders a Back to Home link", () => {
      expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
    });
  });

  describe("PatrickBoyleProject (/patrick-boyle-project)", () => {
    beforeEach(() => render(<PatrickBoyleProject />));

    it("renders the correct h1 title", () => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Patrick Boyle's Project" })
      ).toBeInTheDocument();
    });

    it("renders the Content Coming Soon notice", () => {
      expect(screen.getByText(/Content Coming Soon!/i)).toBeInTheDocument();
    });

    it("renders a Back to Home link", () => {
      expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
    });
  });

  describe("KatieJablynskiProject (/katie-jablynski-project)", () => {
    beforeEach(() => render(<KatieJablynskiProject />));

    it("renders the correct h1 title", () => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Katie Jablynski's Project" })
      ).toBeInTheDocument();
    });

    it("renders the Content Coming Soon notice", () => {
      expect(screen.getByText(/Content Coming Soon!/i)).toBeInTheDocument();
    });

    it("renders a Back to Home link", () => {
      expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
    });
  });

  describe("JamesKujawskiProject (/james-kujawski-project)", () => {
    beforeEach(() => render(<JamesKujawskiProject />));

    it("renders the correct h1 title", () => {
      expect(
        screen.getByRole("heading", { level: 1, name: "James Kujawski's Project" })
      ).toBeInTheDocument();
    });

    it("renders the Content Coming Soon notice", () => {
      expect(screen.getByText(/Content Coming Soon!/i)).toBeInTheDocument();
    });

    it("renders a Back to Home link", () => {
      expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
    });
  });
});
