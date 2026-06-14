import * as React from "react";
import type { ResourceItem } from "../types/resources";
import { trackEvent } from "../utils/analytics";

interface ResourceListProps {
  /** Array of resource items to render. */
  items: ResourceItem[];
  /** Section heading shown above the list. Defaults to "External Resources". */
  heading?: string;
}

/**
 * Renders a list of external resource links with a name, description, and link.
 *
 * Each item is sourced from a page-specific `resources-list.yml` file located
 * in `src/data/` and parsed by the page before being passed here. This keeps
 * the data-loading concern at the page layer while keeping the UI reusable.
 *
 * @example
 * import rawYaml from "../data/club-resources-list.yml";
 * import yaml from "js-yaml";
 * import type { ResourceListData } from "../types/resources";
 *
 * const data = yaml.load(rawYaml) as ResourceListData;
 * <ResourceList items={data["resource-list"]} />
 */
export default function ResourceList({ items, heading = "External Resources" }: ResourceListProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-6">{heading}</h2>
      <ul className="space-y-6">
        {items.map((item) => (
          <li
            key={item.link}
            className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-6 last:pb-0"
          >
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
              onClick={() => {
                trackEvent("external_link_click", {
                  label: item.name,
                  url: item.link,
                });
              }}
            >
              <span className="block text-usa-blue dark:text-blue-400 font-semibold text-lg group-hover:underline mb-1">
                {item.name}
              </span>
              <span className="block text-gray-600 dark:text-gray-300 text-sm">
                {item.description}
              </span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-usa-blue dark:text-blue-400 group-hover:underline">
                Visit resource
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
