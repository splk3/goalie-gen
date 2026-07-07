import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("switches the footer logo when dark mode is enabled", async () => {
    document.documentElement.classList.remove("dark");
    render(<UsaHockeyGoldBanner showCopyright showTerms />);

    const logo = screen.getByAltText("Goalie Gen");
    expect(logo).toHaveAttribute("src", "/images/logos/logo-alt-light-whitebg.png");

    document.documentElement.classList.add("dark");

    await waitFor(() => {
      expect(logo).toHaveAttribute("src", "/images/logos/logo-alt-dark.png");
    });
  });
});
