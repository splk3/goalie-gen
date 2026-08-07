import * as React from "react";
import { withPrefix } from "gatsby";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import DownloadMaterialButton from "../components/DownloadMaterialButton";
import rawMarkdown from "../content/about/katie-jablynski-project/index.md";
import { buildCacheBustedAssetPath } from "../utils/staticAsset";

export default function KatieJablynskiProject() {
  return (
    <AboutPage
      title="Katie Jablynski's Project"
      subtitle="Integrating Goalie Development into Team Practices and Drills using USA Hockey's Drill Design Continuum and 5 Elements of Good Drill Design."
      rawMarkdown={rawMarkdown}
      showComingSoonNotice={false}
      topCta={
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400">
              Katie Jablynski Presentation
            </h2>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              View the slide deck below or download it for offline use.
            </p>
          </div>
          <iframe
            src={withPrefix(buildCacheBustedAssetPath("/presentations/katie-gold-presenation.pdf"))}
            title="Katie Jablynski presentation PDF"
            className="h-[70vh] min-h-[30rem] w-full rounded-lg border border-gray-300 shadow-lg dark:border-gray-600"
          />
          <DownloadMaterialButton
            title="Download Katie Jablynski Presentation"
            fileName="katie-gold-presenation.pdf"
            folder="presentations"
          />
        </div>
      }
    />
  );
}

export const Head = () => <Seo title="Katie Jablynski's Project" />;
