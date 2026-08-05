import * as React from "react";
import { withPrefix } from "gatsby";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import DrillMarkdown from "../components/DrillMarkdown";
import GoalieJournalButton from "../components/GoalieJournalButton";
import whyUseJournalMd from "../content/about/goalie-journals/why-should-i-use-a-goalie-journal.md";
import createPersonalizedJournalMd from "../content/about/goalie-journals/create-a-personalized-goalie-journal.md";
import maximizeEntriesMd from "../content/about/goalie-journals/how-to-maximize-journal-entries.md";
import { buildCacheBustedAssetPath } from "../utils/staticAsset";

const ctaLabel = "Generate Personalized Goalie Journal";

const journalScreenshots = [
  {
    src: "/images/about/goalie-journals/journal-generator-home-card.png",
    alt: "Goalie Gen homepage For Goalies card with the journal generator button",
    caption: "Start from the button below or the For Goalies section on the homepage.",
  },
  {
    src: "/images/about/goalie-journals/journal-generator-modal-overview.png",
    alt: "Goalie journal generator modal showing profile and season setup fields",
    caption: (
      <>
        <p>Set goalie identity and season details for a personalized journal cover.</p>
        <p className="mt-2">
          Choose write-in options when you want hand-written details on the printed journal.
        </p>
      </>
    ),
  },
  {
    src: "/images/about/goalie-journals/journal-generator-finish.png",
    alt: "Goalie journal generator finish state with download controls",
    caption: "Generate the PDF journal, then save and begin daily use.",
  },
];

function GoalieJournalCta() {
  return (
    <GoalieJournalButton
      label={ctaLabel}
      className="max-w-3xl text-base md:text-lg py-3 px-6 md:px-8"
    />
  );
}

export default function AboutGoalieJournals() {
  return (
    <AboutPage
      title="About Goalie Journals"
      subtitle="Learn how the Goalie Journal generator works and how to get the most out of it for your goalies."
      showComingSoonNotice={false}
      sections={[
        {
          heading: "Why Should I Use a Goalie Journal?",
          content: (
            <DrillMarkdown
              markdown={whyUseJournalMd}
              className="text-gray-700 dark:text-gray-300 space-y-4"
            />
          ),
          cta: <GoalieJournalCta />,
        },
        {
          heading: "Create a Personalized Goalie Journal",
          content: (
            <div className="space-y-6">
              <DrillMarkdown
                markdown={createPersonalizedJournalMd}
                className="text-gray-700 dark:text-gray-300 space-y-4"
              />
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {journalScreenshots.map((item) => (
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
          cta: <GoalieJournalCta />,
        },
        {
          heading: "How to Maximize the Benefit of Journal Entries",
          content: (
            <DrillMarkdown
              markdown={maximizeEntriesMd}
              className="text-gray-700 dark:text-gray-300 space-y-4"
            />
          ),
          cta: <GoalieJournalCta />,
        },
      ]}
    />
  );
}

export const Head = () => <Seo title="About Goalie Journals" />;
