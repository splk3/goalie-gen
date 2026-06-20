import * as React from "react";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import rawMarkdown from "../content/about/team-plans/index.md";

export default function AboutTeamPlans() {
  return (
    <AboutPage
      title="About Team Development Plans"
      subtitle="Learn how the Team Development Plan generator works and how to get the most out of it for your coaching staff."
      rawMarkdown={rawMarkdown}
    />
  );
}

export const Head = () => <Seo title="About Team Development Plans" />;
