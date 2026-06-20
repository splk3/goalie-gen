import * as React from "react";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import rawMarkdown from "../content/about/patrick-boyle-project/index.md";

export default function PatrickBoyleProject() {
  return (
    <AboutPage
      title="Patrick Boyle's Project"
      subtitle="Creating a website and tools to help clubs, coaches, and goalies equip themselves for success in recruiting, developing, and retaining goalies while building a love for the position."
      rawMarkdown={rawMarkdown}
    />
  );
}

export const Head = () => <Seo title="Patrick Boyle's Project" />;
