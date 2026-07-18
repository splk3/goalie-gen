import * as React from "react";
import * as yaml from "js-yaml";
import Seo from "../components/SEO";
import PageLayout from "../components/PageLayout";
import ResourceList from "../components/ResourceList";
import ShareButton from "../components/ShareButton";
import BackLinkButton from "../components/BackLinkButton";
import rawResourceList from "../data/equipment-fitting-resources-list.yml";
import type { ResourceListData } from "../types/resources";

const resourceData = yaml.load(rawResourceList, {
  schema: yaml.FAILSAFE_SCHEMA,
}) as ResourceListData;

export default function EquipmentFitting() {
  return (
    <PageLayout>
      <div className="bg-usa-red dark:bg-red-900 text-usa-white p-8 rounded-lg shadow-lg mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">Equipment Fitting</h1>
            <p className="text-lg">
              Guides and resources to help goalies and families find properly fitted goaltending
              equipment.
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
        <ResourceList items={resourceData["resource-list"]} />

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4">
            About Equipment Fitting
          </h2>
          <div className="text-gray-700 dark:text-gray-300 space-y-4">
            <p>
              Properly fitted equipment helps goalies move safely, perform effectively, and get the
              most from their development. Use these resources as a starting point when comparing
              equipment and preparing for a fitting.
            </p>
            <p>
              Manufacturer guidance can vary by product and model. When a manufacturer does not
              publish a dedicated sizing guide, consult the product information and retailer
              measurement charts, and work with an experienced goalie equipment fitter when
              possible.
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

export const Head = () => <Seo title="Equipment Fitting" />;
