import * as React from "react";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import rawMarkdown from "../content/about/goalie-journals/index.md";

export default function AboutGoalieJournals() {
  return (
    <AboutPage
      title="About Goalie Journals"
      subtitle="Learn how the Goalie Journal generator works and how to get the most out of it for your goalies."
      rawMarkdown={rawMarkdown}
    />
  );
}

export const Head = () => <Seo title="About Goalie Journals" />;
