import * as React from "react";
import { withPrefix } from "gatsby";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import DownloadMaterialButton from "../components/DownloadMaterialButton";
import rawMarkdown from "../content/about/james-kujawski-project/index.md";
import { buildCacheBustedAssetPath } from "../utils/staticAsset";

const FULL_PRESENTATION_URL =
  "https://docs.google.com/presentation/d/1afi7C1_RCYAZBWF8VfPIM0WuVhKEPyDz/edit?usp=sharing&ouid=116610288340277897255&rtpof=true&sd=true";

export default function JamesKujawskiProject() {
  return (
    <AboutPage
      title="James Kujawski's Project"
      subtitle="Modernizing Goalie Drill Design using a constraints-led approach and flexible, progression and options-based adaptability."
      rawMarkdown={rawMarkdown}
      showComingSoonNotice={false}
      topCta={
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400">
              James Kujawski Presentation
            </h2>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              View the slide deck below or download it for offline use.
            </p>
          </div>
          <iframe
            src={withPrefix(
              buildCacheBustedAssetPath(
                "/presentations/james-kujawski-presentation-no-videos.pdf"
              )
            )}
            title="James Kujawski presentation PDF"
            className="h-[70vh] min-h-[30rem] w-full rounded-lg border border-gray-300 shadow-lg dark:border-gray-600"
          />
          <div className="space-y-3">
            <DownloadMaterialButton
              title="Download Presentation (No Videos)"
              fileName="james-kujawski-presentation-no-videos.pdf"
              folder="presentations"
            />
            <a
              href={FULL_PRESENTATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-usa-red hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 text-usa-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105 text-center"
              aria-label="Download Full Presentation (Videos Included)"
            >
              Download Full Presentation (Videos Included)
            </a>
          </div>
        </div>
      }
    />
  );
}

export const Head = () => <Seo title="James Kujawski's Project" />;
