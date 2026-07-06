import * as React from "react";
import { render, screen } from "@testing-library/react";
import UsaHockeyGoldBanner from "../UsaHockeyGoldBanner";
import { useStaticQuery } from "gatsby";

jest.mock("gatsby", () => {
  const React = require("react");
  const gatsby = jest.requireActual("gatsby");

  return {
    ...gatsby,
    graphql: jest.fn(),
    Link: jest
      .fn()
      .mockImplementation(({ to, children, className, ...rest }) =>
        React.createElement("a", { href: to, className, ...rest }, children)
      ),
    StaticQuery: jest.fn(),
    useStaticQuery: jest.fn(),
    withPrefix: jest.fn((path) => path),
  };
});

describe("UsaHockeyGoldBanner", () => {
  beforeEach(() => {
    (useStaticQuery as jest.Mock).mockReturnValue({
      site: {
        siteMetadata: {
          copyrightYear: 2024,
        },
      },
    });
  });

  it("renders a dark-mode-aware footer logo with a dark variant and transparent background", () => {
    render(<UsaHockeyGoldBanner showCopyright showTerms />);

    const images = screen.getAllByRole("img");
    const lightModeLogo = images.find((img) =>
      img.getAttribute("src")?.includes("/images/logos/logo-alt-light-whitebg.png")
    );
    const darkModeLogo = images.find((img) =>
      img.getAttribute("src")?.includes("/images/logos/logo-alt-dark.png")
    );

    expect(lightModeLogo).toBeInTheDocument();
    expect(darkModeLogo).toBeInTheDocument();
    expect(darkModeLogo?.closest("div")).toHaveClass("dark:bg-transparent");
  });
});
