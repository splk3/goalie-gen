import * as React from "react";
import * as yaml from "js-yaml";
import Seo from "../components/SEO";
import PageLayout from "../components/PageLayout";
import ResourceList from "../components/ResourceList";
import DownloadMaterialButton from "../components/DownloadMaterialButton";
import NavigationButton from "../components/NavigationButton";
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
              className="inline-flex items-center gap-2 justify-center rounded-md bg-white dark:bg-white/90 px-4 py-2 font-semibold text-usa-red transition-colors hover:bg-gray-100 dark:hover:bg-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <blockquote className="bg-white dark:bg-gray-800 border-l-4 border-usa-red dark:border-red-400 p-8 rounded-lg shadow-lg">
          <p className="text-xl italic text-gray-700 dark:text-gray-300">
            &ldquo;A gardener doesn&apos;t grow flowers, they create environments that make flowers
            grow.&rdquo;
          </p>
          <cite className="block mt-4 text-right font-semibold not-italic text-usa-blue dark:text-blue-400">
            Thomas Magnusson, Director of Goaltending in Sweden
          </cite>
        </blockquote>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">Coach Tools</h2>
          <div className="flex flex-col gap-3">
            <NavigationButton to="/about-team-plans">Team Goalie Development</NavigationButton>
            <NavigationButton to="/fundamental-skills-and-good-drill-design">
              Fundamental Skills and Good Drill Design
            </NavigationButton>
            <NavigationButton to="/about-goalie-journals">Goalie Journal</NavigationButton>
            <NavigationButton to="/goalie-evals">Goalie Evaluations</NavigationButton>
            <DownloadMaterialButton
              title="Coach Z's Zone Map"
              fileName="coach-z-zone-map.pdf"
              folder="diagrams"
            />
            <DownloadMaterialButton
              title="Goalie-Friendly Practice Checklist"
              fileName="goalie-check-list.pdf"
            />
            <NavigationButton to="/equipment-fitting">Equipment Fitting</NavigationButton>
          </div>
        </div>

        <ResourceList items={resourceData["resource-list"]} heading="Helpful External Resources" />

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4">
            About Coach Resources
          </h2>
          <div className="text-gray-700 dark:text-gray-300 space-y-4">
            <p>
              This page provides coaches with practical tools and resources to support goalie
              development, evaluate progress, and build consistent training experiences for their
              goalies and teams.
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

export const Head = () => <Seo title="Coach Resources" />;
