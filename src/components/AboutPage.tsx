import * as React from "react";
import PageLayout from "./PageLayout";
import DrillMarkdown from "./DrillMarkdown";
import BackLinkButton from "./BackLinkButton";
import ShareButton from "./ShareButton";

export interface AboutPageSection {
  heading: string;
  content: React.ReactNode;
  cta?: React.ReactNode;
}

interface AboutPageProps {
  /** Page title shown in the hero banner and as the <h1>. */
  title: string;
  /** Short description shown beneath the title in the hero banner. */
  subtitle: string;
  /** Raw markdown string imported via webpack asset/source. */
  rawMarkdown?: string;
  /** Optional top call-to-action rendered above page content sections. */
  topCta?: React.ReactNode;
  /** Optional structured sections for richer "About" page content. */
  sections?: AboutPageSection[];
  /** Controls whether the "Content Coming Soon" notice is shown. */
  showComingSoonNotice?: boolean;
}

/**
 * Shared template for the "About …" informational pages (Club Plans, Team Plans,
 * Goalie Journals). Content is managed via per-page markdown files under
 * src/content/about/.
 */
export default function AboutPage({
  title,
  subtitle,
  rawMarkdown,
  topCta,
  sections,
  showComingSoonNotice = true,
}: AboutPageProps) {
  const hasSections = (sections?.length ?? 0) > 0;
  const getSectionId = (heading: string) => heading.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <PageLayout>
      {/* Hero banner */}
      <div className="bg-usa-blue dark:bg-blue-900 text-usa-white p-8 rounded-lg shadow-lg mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <p className="text-lg">{subtitle}</p>
          </div>
          <div className="flex-shrink-0">
            <ShareButton
              label="Share"
              className="inline-flex items-center gap-2 justify-center rounded-md bg-white dark:bg-white/90 px-4 py-2 font-semibold text-usa-blue transition-colors hover:bg-gray-100 dark:hover:bg-white dark:text-usa-blue"
            />
          </div>
        </div>
      </div>

      <div className={`mx-auto space-y-8 ${hasSections ? "max-w-5xl" : "max-w-2xl"}`}>
        {topCta && <div className="text-center">{topCta}</div>}

        {showComingSoonNotice && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 p-6 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 font-semibold text-lg text-center">
              🚧 Content Coming Soon!
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 text-center mt-2">
              We&apos;re working on detailed information for this page. Check back soon!
            </p>
          </div>
        )}

        {hasSections ? (
          sections?.map((section) => (
            <section
              key={section.heading}
              aria-labelledby={getSectionId(section.heading)}
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg space-y-6"
            >
              <h2
                id={getSectionId(section.heading)}
                className="text-2xl md:text-3xl font-bold text-usa-blue dark:text-blue-400"
              >
                {section.heading}
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">{section.content}</div>
              {section.cta && <div className="pt-2 text-center">{section.cta}</div>}
            </section>
          ))
        ) : (
          rawMarkdown && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <DrillMarkdown
                markdown={rawMarkdown}
                className="text-gray-700 dark:text-gray-300 space-y-4"
              />
            </div>
          )
        )}

        {/* Back link */}
        <div className="text-center">
          <BackLinkButton to="/" className="w-full max-w-xs sm:w-auto">
            Back to Home
          </BackLinkButton>
        </div>
      </div>
    </PageLayout>
  );
}
