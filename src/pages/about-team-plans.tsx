import * as React from "react";
import { withPrefix } from "gatsby";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import DrillMarkdown from "../components/DrillMarkdown";
import GenerateTeamPlanButton from "../components/GenerateTeamPlanButton";
import whatIsTeamPlanMd from "../content/about/team-plans/what-is-team-goalie-development-plan.md";
import createTeamPlanMd from "../content/about/team-plans/create-goalie-development-plan-for-your-team.md";
import implementationInfoMd from "../content/about/team-plans/goalie-development-implementation-info.md";
import sampleDrillsMd from "../content/about/team-plans/sample-drills-and-good-drill-design.md";
import { buildCacheBustedAssetPath } from "../utils/staticAsset";

const ctaLabel = "Generate a Goalie Development Plan for Your Team";

const teamGeneratorScreenshots = [
  {
    src: "/images/about/team-plans/team-generator-home-card.png",
    alt: "Goalie Gen homepage For Coaches card with the team plan generator button",
    caption: "Start from the For Coaches section on the homepage.",
  },
  {
    src: "/images/about/team-plans/team-generator-modal-overview.png",
    alt: "Open team plan generator modal with team profile and setup fields",
    caption: "Enter team profile details and optional logo/branding inputs.",
  },
  {
    src: "/images/about/team-plans/team-generator-evaluations-options.png",
    alt: "Team plan generator showing goalie evaluation and starter content options",
    caption: "Configure goalie evaluations and starter content sections for your season plan.",
  },
  {
    src: "/images/about/team-plans/team-generator-calendar-options.png",
    alt: "Team plan generator showing calendar and event detail options",
    caption: "Enable calendar/event planning features and choose detailed event entry behavior.",
  },
  {
    src: "/images/about/team-plans/team-generator-generate-actions.png",
    alt: "Team plan generator action area with generate and cancel controls",
    caption: "Generate the document when setup is complete, then download and customize.",
  },
];

const implementationDiagrams = [
  {
    src: "/images/drill-design/goaltending-skills-cycle.png",
    alt: "Goaltending skills cycle diagram",
    caption: "Goaltending Skills Cycle",
  },
  {
    src: "/images/drill-design/goaltending-skills-pyramid.png",
    alt: "Goaltending skills pyramid diagram",
    caption: "Goaltending Skills Pyramid",
  },
  {
    src: "/images/drill-design/fundamental-skills-by-exp-1-movement.png",
    alt: "Fundamental goalie movement skills by experience level diagram",
    caption: "Fundamental Skills by Experience: Movement",
  },
  {
    src: "/images/drill-design/fundamental-skills-by-exp-2-saves.png",
    alt: "Fundamental goalie save skills by experience level diagram",
    caption: "Fundamental Skills by Experience: Saves",
  },
];

function TeamPlanGeneratorCta() {
  return (
    <GenerateTeamPlanButton
      label={ctaLabel}
      className="w-full max-w-3xl text-base md:text-lg py-3 px-6 md:px-8"
    />
  );
}

export default function AboutTeamPlans() {
  return (
    <AboutPage
      title="About Team Development Plans"
      subtitle="Learn how the Team Development Plan generator works and how to get the most out of it for your coaching staff."
      showComingSoonNotice={false}
      sections={[
        {
          heading: "What is a Team Goalie Development Plan?",
          content: (
            <DrillMarkdown
              markdown={whatIsTeamPlanMd}
              className="text-gray-700 dark:text-gray-300 space-y-4"
            />
          ),
          cta: <TeamPlanGeneratorCta />,
        },
        {
          heading: "Create a Goalie Development Plan for your Team",
          content: (
            <div className="space-y-6">
              <DrillMarkdown
                markdown={createTeamPlanMd}
                className="text-gray-700 dark:text-gray-300 space-y-4"
              />
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {teamGeneratorScreenshots.map((item) => (
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
          cta: <TeamPlanGeneratorCta />,
        },
        {
          heading: "Goalie Development Information to Assist you in Implementing Your Plan",
          content: (
            <div className="space-y-6">
              <DrillMarkdown
                markdown={implementationInfoMd}
                className="text-gray-700 dark:text-gray-300 space-y-4"
              />
              <div className="grid gap-6 md:grid-cols-2">
                {implementationDiagrams.map((item) => (
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
          cta: <TeamPlanGeneratorCta />,
        },
        {
          heading: "Sample Drills and Good Drill Design",
          content: (
            <DrillMarkdown
              markdown={sampleDrillsMd}
              className="text-gray-700 dark:text-gray-300 space-y-4"
            />
          ),
          cta: <TeamPlanGeneratorCta />,
        },
      ]}
    />
  );
}

export const Head = () => <Seo title="About Team Development Plans" />;
