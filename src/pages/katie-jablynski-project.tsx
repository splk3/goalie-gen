import * as React from "react";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import rawMarkdown from "../content/about/katie-jablynski-project/index.md";

export default function KatieJablynskiProject() {
  return (
    <AboutPage
      title="Katie Jablynski's Project"
      subtitle="Integrating Goalie Development into Team Practices and Drills"
      rawMarkdown={rawMarkdown}
    />
  );
}

export const Head = () => <Seo title="Katie Jablynski's Project" />;
