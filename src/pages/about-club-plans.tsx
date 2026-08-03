import * as React from "react";
import { withPrefix } from "gatsby";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import DrillMarkdown from "../components/DrillMarkdown";
import GenerateClubPlanButton from "../components/GenerateClubPlanButton";
import whatIsGoalieDevelopmentPlanMd from "../content/about/club-plans/what-is-goalie-development-plan.md";
import createClubPlanMd from "../content/about/club-plans/create-goalie-development-plan-for-your-club.md";
import { buildCacheBustedAssetPath } from "../utils/staticAsset";

const ctaLabel = "Generate a Goalie Development Plan for Your Club";

const screenshotItems = [
  {
    src: "/images/about/club-plans/club-generator-home-card.png",
    alt: "Goalie Gen homepage For Organizations card with the club plan generator button",
    caption: "From the homepage, start in the For Organizations section.",
  },
  {
    src: "/images/about/club-plans/club-generator-modal-overview.png",
    alt: "Open club development plan generator modal with club details and logo section",
    caption: "Enter club details and optionally upload a logo for automatic color extraction.",
  },
  {
    src: "/images/about/club-plans/club-generator-training-options.png",
    alt: "Club development plan generator showing training detail toggles and content section options",
    caption: "Configure training support options and starter content sections before generating.",
  },
];

function ClubPlanGeneratorCta() {
  return (
    <GenerateClubPlanButton
      label={ctaLabel}
      className="w-full max-w-3xl text-base md:text-lg py-3 px-6 md:px-8"
    />
  );
}

export default function AboutClubPlans() {
  return (
    <AboutPage
      title="About Club Development Plans"
      subtitle="Learn how the Club Development Plan generator works and how to get the most out of it for your organization."
      showComingSoonNotice={false}
      sections={[
        {
          heading: "What is a Goalie Development Plan?",
          content: (
            <DrillMarkdown
              markdown={whatIsGoalieDevelopmentPlanMd}
              className="text-gray-700 dark:text-gray-300 space-y-4"
            />
          ),
          cta: <ClubPlanGeneratorCta />,
        },
        {
          heading: "Create a Goalie Development Plan for your Club",
          content: (
            <div className="space-y-6">
              <DrillMarkdown
                markdown={createClubPlanMd}
                className="text-gray-700 dark:text-gray-300 space-y-4"
              />
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {screenshotItems.map((item) => (
                  <figure
                    key={item.src}
                    className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <img
                      src={withPrefix(buildCacheBustedAssetPath(item.src))}
                      alt={item.alt}
                      className="w-full h-auto rounded-md border border-gray-300 dark:border-gray-600"
                      loading="lazy"
                    />
                    <figcaption className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                      {item.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ),
          cta: <ClubPlanGeneratorCta />,
        },
      ]}
    />
  );
}

export const Head = () => <Seo title="About Club Development Plans" />;
