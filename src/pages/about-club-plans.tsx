import * as React from "react";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import rawMarkdown from "../content/about/club-plans/index.md";

export default function AboutClubPlans() {
  return (
    <AboutPage
      title="About Club Development Plans"
      subtitle="Learn how the Club Development Plan generator works and how to get the most out of it for your organization."
      rawMarkdown={rawMarkdown}
    />
  );
}

export const Head = () => <Seo title="About Club Development Plans" />;
