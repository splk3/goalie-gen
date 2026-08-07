import * as React from "react";
import { withPrefix } from "gatsby";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import DownloadMaterialButton from "../components/DownloadMaterialButton";
import rawMarkdown from "../content/about/patrick-boyle-project/index.md";
import { buildCacheBustedAssetPath } from "../utils/staticAsset";

export default function PatrickBoyleProject() {
  return (
    <AboutPage
      title="Patrick Boyle's Project"
      subtitle="Creating a website and tools to help clubs, coaches, and goalies equip themselves for success in recruiting, developing, and retaining goalies while building a love for the position."
      rawMarkdown={rawMarkdown}
      showComingSoonNotice={false}
      topCta={
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400">
              Patrick Boyle Presentation
            </h2>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              View the slide deck below or download it for offline use.
            </p>
          </div>
          <iframe
            src={`${withPrefix(buildCacheBustedAssetPath("/presentations/patrick-presentation.pdf"))}#navpanes=0&view=Fit`}
            title="Patrick Boyle presentation PDF"
            className="h-[70vh] min-h-[30rem] w-full rounded-lg border border-gray-300 shadow-lg dark:border-gray-600"
          />
          <DownloadMaterialButton
            title="Download Patrick Boyle Presentation"
            fileName="patrick-presentation.pdf"
            folder="presentations"
          />
        </div>
      }
    />
  );
}

export const Head = () => <Seo title="Patrick Boyle's Project" />;
