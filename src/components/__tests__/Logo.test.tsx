import * as React from "react";
import { render, screen } from "@testing-library/react";
import Logo from "../Logo";

// gatsby is mocked via __mocks__/gatsby.js; withPrefix returns the path unchanged

describe("Logo", () => {
  it("renders the default (full, dark) logo", () => {
    render(<Logo />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/logos/logo-dark.svg");
    expect(img).toHaveAttribute("alt", "Goalie Gen - Development Plans");
  });

  it("renders the alt variant (dark) logo when variant='alt' without dark-mode-aware class", () => {
    render(<Logo variant="alt" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/images/logos/logo-alt-dark.svg");
  });

  it("renders two images for the alt dark-mode-aware variant", () => {
    render(<Logo variant="alt" className="dark-mode-aware" />);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "/images/logos/logo-alt-light.svg");
    expect(images[1]).toHaveAttribute("src", "/images/logos/logo-alt-dark.svg");
  });

  it("renders in png format when format='png'", () => {
    render(<Logo format="png" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/images/logos/logo-dark.png");
  });

  it("applies provided width and height attributes", () => {
    render(<Logo width={200} height={50} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "200");
    expect(img).toHaveAttribute("height", "50");
  });

  it("applies extra className to the rendered img element", () => {
    render(<Logo className="my-custom-class" />);
    const img = screen.getByRole("img");
    expect(img).toHaveClass("my-custom-class");
  });
});
