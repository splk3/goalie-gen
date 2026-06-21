import * as React from "react";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import rawMarkdown from "../content/about/james-kujawski-project/index.md";

export default function JamesKujawskiProject() {
  return (
    <AboutPage
      title="James Kujawski's Project"
      subtitle="Modernizing Goalie Drill Design using a constraints-led approach and flexible, progression and options-based adaptability."
      rawMarkdown={rawMarkdown}
    />
  );
}

export const Head = () => <Seo title="James Kujawski's Project" />;
