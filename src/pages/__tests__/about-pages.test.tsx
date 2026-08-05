import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import AboutClubPlans from "../about-club-plans";
import AboutTeamPlans from "../about-team-plans";
import AboutGoalieJournals from "../about-goalie-journals";
import FundamentalSkillsAndGoodDrillDesign from "../fundamental-skills-and-good-drill-design";
import PatrickBoyleProject from "../patrick-boyle-project";
import KatieJablynskiProject from "../katie-jablynski-project";
import JamesKujawskiProject from "../james-kujawski-project";

// .md files are mapped to "test-file-stub" by Jest's moduleNameMapper.
// PageLayout, ShareButton, and BackLinkButton are mocked to isolate page rendering.

jest.mock(
  "../../content/goalie-journal/acknowledgements.md",
  () => `
    ## Acknowledgements

    Thank you to Coach Z at [ztending.com](https://ztending.com).
    Special thanks to Dr. Beuker at [athletemindsetperformance.com](https://athletemindsetperformance.com).
  `
);

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

jest.mock("../../components/GenerateClubPlanButton", () => {
  return function MockGenerateClubPlanButton({
    label = "Generate Club Development Plan",
  }: {
    label?: string;
  }) {
    return <button>{label}</button>;
  };
});

jest.mock("../../components/GenerateTeamPlanButton", () => {
  return function MockGenerateTeamPlanButton({
    label = "Generate Team Development Plan",
  }: {
    label?: string;
  }) {
    return <button>{label}</button>;
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

jest.mock("../../components/GoalieJournalButton", () => {
  return function MockGoalieJournalButton({ label = "Goalie Journal" }: { label?: string }) {
    return <button>{label}</button>;
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

    it("renders the requested section headings", () => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "What is a Goalie Development Plan?",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Create a Goalie Development Plan for your Club",
        })
      ).toBeInTheDocument();
    });

    it("renders section-end CTAs for the club generator", () => {
      expect(
        screen.getAllByRole("button", {
          name: "Generate a Goalie Development Plan for Your Club",
        })
      ).toHaveLength(2);
    });

    it("does not render the Content Coming Soon notice", () => {
      expect(screen.queryByText(/Content Coming Soon!/i)).not.toBeInTheDocument();
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

    it("renders the requested section headings", () => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "What is a Team Goalie Development Plan?",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Create a Goalie Development Plan for your Team",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Fundamental Skills and Good Drill Design",
        })
      ).toBeInTheDocument();
    });

    it("renders section-end CTAs for the team generator", () => {
      expect(
        screen.getAllByRole("button", {
          name: "Generate a Goalie Development Plan for Your Team",
        })
      ).toHaveLength(2);
    });

    it("links to fundamental skills and drill design guidance", () => {
      expect(
        screen.getByRole("link", {
          name: "Learn About Fundamental Skills and Drill Design",
        })
      ).toHaveAttribute("href", "/fundamental-skills-and-good-drill-design");
    });

    it("does not render the Content Coming Soon notice", () => {
      expect(screen.queryByText(/Content Coming Soon!/i)).not.toBeInTheDocument();
    });

    it("renders a Back to Home link", () => {
      expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
    });
  });

  describe("FundamentalSkillsAndGoodDrillDesign (/fundamental-skills-and-good-drill-design)", () => {
    beforeEach(() => render(<FundamentalSkillsAndGoodDrillDesign />));

    it("renders the correct h1 title", () => {
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Fundamental Skills and Good Drill Design",
        })
      ).toBeInTheDocument();
    });

    it("renders the moved content sections", () => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Fundamental Skills of Goaltending",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Elements of Good Drill Design",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByAltText("USA Hockey five elements of good drill design diagram")
      ).toBeInTheDocument();
      expect(
        screen.getByAltText(
          "USA Hockey drill design continuum from unopposed practice to game-like play"
        )
      ).toBeInTheDocument();
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

    it("renders the requested section headings", () => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Why Should I Use a Goalie Journal?",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Create a Personalized Goalie Journal",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "How to Maximize the Benefit of Journal Entries",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Acknowledgements",
        })
      ).toBeInTheDocument();
    });

    it("renders section-end CTAs for the goalie journal generator", () => {
      expect(
        screen.getAllByRole("button", {
          name: "Generate Personalized Goalie Journal",
        })
      ).toHaveLength(3);
    });

    it("renders the updated journal screenshots and captions", () => {
      expect(
        screen.getByAltText(
          "Goalie Gen homepage For Goalies card with the journal generator button"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByAltText(
          "Goalie journal generator modal showing profile and season setup fields"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByAltText("Goalie journal generator finish state with download controls")
      ).toBeInTheDocument();
      expect(
        screen.queryByAltText(
          "Goalie journal generator write-in options for printable customization"
        )
      ).not.toBeInTheDocument();
      expect(
        screen.queryByAltText(
          "Goalie journal generator action area with generate and cancel controls"
        )
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("Start from the button below or the For Goalies section on the homepage.")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Choose write-in options when you want hand-written details on the printed journal."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText("Generate the PDF journal, then save and begin daily use.")
      ).toBeInTheDocument();
    });

    it("renders acknowledgements with linked domains", () => {
      const acknowledgementsSection = screen.getByRole("region", {
        name: "Acknowledgements",
      });
      expect(
        within(acknowledgementsSection).queryByRole("heading", {
          level: 4,
          name: "Acknowledgements",
        })
      ).not.toBeInTheDocument();
      expect(
        within(acknowledgementsSection).getByRole("link", { name: "ztending.com" })
      ).toHaveAttribute("href", "https://ztending.com");
      expect(
        within(acknowledgementsSection).getByRole("link", {
          name: "athletemindsetperformance.com",
        })
      ).toHaveAttribute("href", "https://athletemindsetperformance.com");
    });

    it("does not render the Content Coming Soon notice", () => {
      expect(screen.queryByText(/Content Coming Soon!/i)).not.toBeInTheDocument();
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

    it("renders the updated project description", () => {
      expect(
        screen.getByText(
          "Integrating Goalie Development into Team Practices and Drills using USA Hockey's Drill Design Continuum and 5 Elements of Good Drill Design."
        )
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
