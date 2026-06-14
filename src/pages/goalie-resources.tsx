import * as React from "react";
import * as yaml from "js-yaml";
import Seo from "../components/SEO";
import PageLayout from "../components/PageLayout";
import ResourceList from "../components/ResourceList";
import DownloadMaterialButton from "../components/DownloadMaterialButton";
import GoalieJournalButton from "../components/GoalieJournalButton";
import ShareButton from "../components/ShareButton";
import BackLinkButton from "../components/BackLinkButton";
import rawResourceList from "../data/goalie-resources-list.yml";
import type { ResourceListData } from "../types/resources";

const resourceData = yaml.load(rawResourceList) as ResourceListData;

export default function GoalieResources() {
  return (
    <PageLayout>
      <div className="bg-usa-red dark:bg-red-900 text-usa-white p-8 rounded-lg shadow-lg mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">Goalie Resources</h1>
            <p className="text-lg">
              Resources for goalies and parents to support goaltender development.
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

      <div className="max-w-2xl mx-auto space-y-8">
        <ResourceList items={resourceData["resource-list"]} />

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4">
            About Goalie Resources
          </h2>
          <div className="text-gray-700 dark:text-gray-300 space-y-4">
            <p>
              This section is dedicated to providing resources specifically for young goalies and
              their parents.
            </p>
            <p>
              Whether you&apos;re new to playing goal or looking to take your game to the next
              level, these resources will help support your development journey.
            </p>
            <p>Future content will include:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Mental preparation tips and techniques</li>
              <li>Equipment guides and maintenance advice</li>
              <li>At-home training exercises</li>
              <li>Nutrition and fitness recommendations</li>
              <li>Goal-setting worksheets</li>
              <li>Parent guides for supporting young goalies</li>
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">
            Available Tools
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

export const Head = () => <Seo title="Goalie Resources" />;
