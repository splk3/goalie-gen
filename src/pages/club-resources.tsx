import * as React from "react";
import * as yaml from "js-yaml";
import Seo from "../components/SEO";
import PageLayout from "../components/PageLayout";
import ResourceList from "../components/ResourceList";
import ShareButton from "../components/ShareButton";
import BackLinkButton from "../components/BackLinkButton";
import rawResourceList from "../data/club-resources-list.yml";
import type { ResourceListData } from "../types/resources";

const resourceData = yaml.load(rawResourceList, {
  schema: yaml.FAILSAFE_SCHEMA,
}) as ResourceListData;

export default function ClubResources() {
  return (
    <PageLayout>
      <div className="bg-usa-red dark:bg-red-900 text-usa-white p-8 rounded-lg shadow-lg mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">Club Resources</h1>
            <p className="text-lg">
              Resources and tools for managing club-wide goaltending development programs.
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

      <div className="max-w-2xl mx-auto">
        <ResourceList items={resourceData["resource-list"]} />

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4">
            About Club Resources
          </h2>
          <div className="text-gray-700 dark:text-gray-300 space-y-4">
            <p>
              This page is dedicated to providing resources for hockey clubs managing multiple teams
              and coordinating goaltending development across age groups.
            </p>
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

export const Head = () => <Seo title="Club Resources" />;
