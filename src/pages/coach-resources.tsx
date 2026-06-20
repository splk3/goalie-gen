import * as React from "react";
import * as yaml from "js-yaml";
import Seo from "../components/SEO";
import PageLayout from "../components/PageLayout";
import ResourceList from "../components/ResourceList";
import DownloadMaterialButton from "../components/DownloadMaterialButton";
import GoalieJournalButton from "../components/GoalieJournalButton";
import ShareButton from "../components/ShareButton";
import BackLinkButton from "../components/BackLinkButton";
import rawResourceList from "../data/coach-resources-list.yml";
import type { ResourceListData } from "../types/resources";

const resourceData = yaml.load(rawResourceList, {
  schema: yaml.FAILSAFE_SCHEMA,
}) as ResourceListData;

export default function CoachResources() {
  return (
    <PageLayout>
      <div className="bg-usa-red dark:bg-red-900 text-usa-white p-8 rounded-lg shadow-lg mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">Coach Resources</h1>
            <p className="text-lg">
              Essential tools and resources for coaching youth hockey goalies.
            </p>
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
        <ResourceList items={resourceData["resource-list"]} />

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
          <BackLinkButton to="/" className="w-full max-w-xs sm:w-auto">
            Back to Home
          </BackLinkButton>
        </div>
      </div>
    </PageLayout>
  );
}

export const Head = () => <Seo title="Coach Resources" />;
