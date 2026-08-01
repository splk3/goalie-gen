import * as React from "react";
import * as yaml from "js-yaml";
import Seo from "../components/SEO";
import PageLayout from "../components/PageLayout";
import ResourceList from "../components/ResourceList";
import DownloadMaterialButton from "../components/DownloadMaterialButton";
import NavigationButton from "../components/NavigationButton";
import ShareButton from "../components/ShareButton";
import BackLinkButton from "../components/BackLinkButton";
import rawResourceList from "../data/goalie-resources-list.yml";
import type { ResourceListData } from "../types/resources";

const resourceData = yaml.load(rawResourceList, {
  schema: yaml.FAILSAFE_SCHEMA,
}) as ResourceListData;

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
              className="inline-flex items-center gap-2 justify-center rounded-md bg-white dark:bg-white/90 px-4 py-2 font-semibold text-usa-red transition-colors hover:bg-gray-100 dark:hover:bg-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        <blockquote className="bg-white dark:bg-gray-800 border-l-4 border-usa-red dark:border-red-400 p-8 rounded-lg shadow-lg">
          <p className="text-xl italic text-gray-700 dark:text-gray-300">
            &ldquo;Every day I wake up, it&apos;s a good day&rdquo;
          </p>
          <cite className="block mt-4 text-right font-semibold not-italic text-usa-blue dark:text-blue-400">
            Abbey Levy, PWHL Goalie, Team USA IIHF World Champion
          </cite>
        </blockquote>

        <blockquote className="bg-white dark:bg-gray-800 border-l-4 border-usa-red dark:border-red-400 p-8 rounded-lg shadow-lg">
          <p className="text-xl italic text-gray-700 dark:text-gray-300">
            &ldquo;The most important part of development is facing adversity.&rdquo;
          </p>
          <cite className="block mt-4 text-right font-semibold not-italic text-usa-blue dark:text-blue-400">
            Brian Daccord, StopItGoaltending CEO &amp; Former NHL Goalie Coach
          </cite>
        </blockquote>

        <blockquote className="bg-white dark:bg-gray-800 border-l-4 border-usa-red dark:border-red-400 p-8 rounded-lg shadow-lg">
          <p className="text-xl italic text-gray-700 dark:text-gray-300">
            &ldquo;I wouldn&rsquo;t change the people I&rsquo;ve met; I would change the opportunity
            to give myself a faster start. I&rsquo;d look into a mental coach, nutrition coach,
            better training programs. I&rsquo;d give myself a better opportunity to optimize
            potential performance on the same path.&rdquo;
          </p>
          <cite className="block mt-4 text-right font-semibold not-italic text-usa-blue dark:text-blue-400">
            Scott Wedgewood, NHL Goalie
          </cite>
        </blockquote>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">Goalie Tools</h2>
          <div className="flex flex-col gap-3">
            <NavigationButton to="/about-goalie-journals">Goalie Journal</NavigationButton>
            <DownloadMaterialButton title="Coach Z's Zone Map" fileName="coach-z-zone-map.pdf" />
            <NavigationButton to="/equipment-fitting">Equipment Fitting</NavigationButton>
          </div>
        </div>

        <ResourceList items={resourceData["resource-list"]} heading="Helpful External Resources" />

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4">
            About Goalie Resources
          </h2>
          <div className="text-gray-700 dark:text-gray-300 space-y-4">
            <p>
              This section is dedicated to providing resources specifically for goalies and their
              families.
            </p>
            <p>
              Whether you&apos;re new to playing goal or looking to take your game to the next
              level, these resources will help support your development journey.
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

export const Head = () => <Seo title="Goalie Resources" />;
