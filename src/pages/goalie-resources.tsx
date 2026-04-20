import * as React from "react";
import { Link } from "gatsby";
import Seo from "../components/SEO";
import PageLayout from "../components/PageLayout";
import DownloadMaterialButton from "../components/DownloadMaterialButton";
import GoalieJournalButton from "../components/GoalieJournalButton";

export default function GoalieResources() {
  return (
    <PageLayout>
      <div className="bg-usa-red dark:bg-red-900 text-usa-white p-8 rounded-lg shadow-lg mb-8">
        <h1 className="text-4xl font-bold mb-4">Goalie Resources</h1>
        <p className="text-lg">
          Resources for goalies and parents to support goaltender development.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
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
          <Link
            to="/"
            className="text-usa-blue dark:text-blue-400 hover:underline text-lg font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

export const Head = () => <Seo title="Goalie Resources" />;
