import * as React from "react";
import { Link } from "gatsby";
import Seo from "../components/SEO";
import PageLayout from "../components/PageLayout";
import ExternalLinkButton from "../components/ExternalLinkButton";
import DownloadMaterialButton from "../components/DownloadMaterialButton";
import GoalieJournalButton from "../components/GoalieJournalButton";
import ShareButton from "../components/ShareButton";

export default function CoachResources() {
  return (
    <PageLayout>
      <div className="bg-usa-red dark:bg-red-900 text-usa-white p-8 rounded-lg shadow-lg mb-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">Coach Resources</h1>
            <p className="text-lg">Essential tools and resources for coaching youth hockey goalies.</p>
          </div>
          <div className="flex-shrink-0">
            <ShareButton
              label="Share"
              className="inline-flex items-center gap-2 justify-center rounded-md bg-white px-4 py-2 font-semibold text-usa-red transition-colors hover:bg-gray-100"
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">
            External Resources
          </h2>
          <div className="space-y-4">
            <ExternalLinkButton
              href="https://www.usahockey.com/goaltendingplans"
              trackingLabel="USA Hockey Goalie Plans"
            >
              USA Hockey Goalie Plans
            </ExternalLinkButton>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">
            Evaluation Forms
          </h2>
          <div className="space-y-3">
            <DownloadMaterialButton
              title="Goalie Evaluation Form"
              fileName="goalie-evaluation-form.pdf"
            />
            <DownloadMaterialButton
              title="Single-Game Review Form"
              fileName="goalie-single-game-review.pdf"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">
            Additional Tools
          </h2>
          <div className="space-y-3">
            <DownloadMaterialButton title="Coach Z's Zone Map" fileName="coach-z-zone-map.pdf" />
            <GoalieJournalButton />
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-usa-blue hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                clipRule="evenodd"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

export const Head = () => <Seo title="Coach Resources" />;
