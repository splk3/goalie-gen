import * as React from "react";
import { Link, graphql } from "gatsby";
import Seo from "../components/SEO";
import PageLayout from "../components/PageLayout";
import Pagination from "../components/Pagination";
import { buildCacheBustedAssetPath } from "../utils/staticAsset";
import { DEFAULT_FILTER_STATE, FilterState, useDrillFilters } from "../hooks/useDrillFilters";
import ShareButton from "../components/ShareButton";

interface DrillNode {
  slug: string;
  name: string;
  drill_image: string;
  drill_creation_date: string;
  drill_updated_date?: string;
  tags: {
    skill_level?: string[];
    team_drill?: string;
    age_level?: string[];
    fundamental_skill?: string[];
    skating_skill?: string[];
    equipment?: string[];
  };
}

interface GoalieDrillsProps {
  data: {
    allDrill: {
      nodes: DrillNode[];
    };
  };
  location?: {
    search: string;
  };
}

type SortOrder = "created_newest" | "created_oldest" | "updated_newest" | "updated_oldest";

interface DrillCardData extends DrillNode {
  imageUrl: string;
  creationTimestamp: number | null;
  updatedTimestamp: number | null;
}

const parseTimestamp = (value?: string): number | null => {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export default function GoalieDrills({ data, location }: GoalieDrillsProps) {
  const search = location?.search || "";
  const initialSearchParams = React.useMemo(() => new URLSearchParams(search), [search]);
  const drills = React.useMemo<DrillCardData[]>(
    () =>
      data.allDrill.nodes.map((node) => {
        const image = node.drill_image || "placeholder.png";
        const creationTimestamp = parseTimestamp(node.drill_creation_date);
        return {
          ...node,
          imageUrl: buildCacheBustedAssetPath(`/drills/${node.slug}/${image}`),
          creationTimestamp,
          updatedTimestamp: parseTimestamp(node.drill_updated_date) ?? creationTimestamp,
        };
      }),
    [data.allDrill.nodes]
  );

  const initialFilters = React.useMemo<FilterState>(() => {
    const parsedFilters: FilterState = {
      ...DEFAULT_FILTER_STATE,
    };

    Object.keys(parsedFilters).forEach((category) => {
      const paramValue = initialSearchParams.get(category);
      if (paramValue) {
        parsedFilters[category as keyof FilterState] = paramValue
          .split(",")
          .filter((v) => v.trim());
      }
    });

    return parsedFilters;
  }, [initialSearchParams]);

  const initialPage = React.useMemo(() => {
    const pageParam = initialSearchParams.get("page");
    if (!pageParam) {
      return 1;
    }

    const parsed = parseInt(pageParam, 10);
    return !Number.isNaN(parsed) && parsed > 0 ? parsed : 1;
  }, [initialSearchParams]);

  const initialSort = React.useMemo<SortOrder>(() => {
    const sortParam = initialSearchParams.get("sort");
    if (
      sortParam === "created_newest" ||
      sortParam === "created_oldest" ||
      sortParam === "updated_newest" ||
      sortParam === "updated_oldest"
    ) {
      return sortParam;
    }
    return "updated_newest";
  }, [initialSearchParams]);

  const {
    selectedFilters,
    tagCategories,
    filteredDrills,
    toggleFilter,
    removeFilter,
    resetFilters,
    formatTagName,
    formatTagValue,
    activeFilters,
  } = useDrillFilters(drills, initialFilters);

  // State for pagination - initialize from URL if present
  const [currentPage, setCurrentPage] = React.useState<number>(initialPage);
  const itemsPerPage = 15;

  // State for sorting - initialize from URL if present
  const [sortOrder, setSortOrder] = React.useState<SortOrder>(initialSort);

  // State for dropdown visibility
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  // Sort drills based on sortOrder
  const sortedDrills = React.useMemo(() => {
    const sorted = [...filteredDrills];

    sorted.sort((a, b) => {
      const isUpdatedSort = sortOrder === "updated_newest" || sortOrder === "updated_oldest";
      const dateA = isUpdatedSort ? a.updatedTimestamp : a.creationTimestamp;
      const dateB = isUpdatedSort ? b.updatedTimestamp : b.creationTimestamp;
      if (dateA === null && dateB === null) return 0;
      if (dateA === null) return 1;
      if (dateB === null) return -1;

      // Sort based on direction (newest vs oldest)
      const isNewest = sortOrder === "created_newest" || sortOrder === "updated_newest";
      return isNewest ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [filteredDrills, sortOrder]);

  // Reset to page 1 when filters change
  // Use a stable key to prevent unnecessary rerenders
  const filterKey = React.useMemo(() => {
    // Create a stable key by sorting categories and their values
    const sortedEntries = Object.entries(selectedFilters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, values]) => `${key}:${[...values].sort().join(",")}`)
      .join("|");
    return sortedEntries;
  }, [selectedFilters]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterKey]);

  // Keep pagination state synchronized with the URL
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    if (currentPage > 1) {
      searchParams.set("page", String(currentPage));
    } else {
      // Remove "page" when on the first page to keep URLs clean
      searchParams.delete("page");
    }

    const searchString = searchParams.toString();
    const newUrl =
      window.location.pathname + (searchString ? `?${searchString}` : "") + window.location.hash;

    window.history.replaceState(null, "", newUrl);
  }, [currentPage]);

  // Keep sort state synchronized with the URL
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    if (sortOrder !== "updated_newest") {
      searchParams.set("sort", sortOrder);
    } else {
      // Remove "sort" when it's the default value to keep URLs clean
      searchParams.delete("sort");
    }

    const searchString = searchParams.toString();
    const newUrl =
      window.location.pathname + (searchString ? `?${searchString}` : "") + window.location.hash;

    window.history.replaceState(null, "", newUrl);
  }, [sortOrder]);

  // Calculate pagination values
  const totalPages = Math.ceil(sortedDrills.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDrills = sortedDrills.slice(startIndex, endIndex);

  return (
    <PageLayout>
      <div className="bg-usa-red dark:bg-red-900 text-usa-white p-8 rounded-lg shadow-lg mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">Goalie Drills</h1>
            <p className="text-lg">
              Develop your goalies during goalie-focused time or involve the whole team!
            </p>
          </div>
          <div className="flex-shrink-0 w-full md:w-auto flex flex-wrap justify-center md:justify-end gap-3">
            <ShareButton
              label="Share"
              title="Goalie Drills — Goalie Gen"
              className="inline-flex items-center gap-2 justify-center rounded-md bg-white px-4 py-2 font-semibold text-usa-red transition-colors hover:bg-gray-100"
            />
            <a
              href="https://github.com/splk3/goalie-gen/issues/new?template=new-drill-template.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 font-semibold text-usa-red transition-colors hover:bg-gray-100"
            >
              Share a Drill Idea
            </a>
          </div>
        </div>
      </div>

      {/* Sort Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-900 dark:text-gray-100 font-semibold">
            Showing {sortedDrills.length} drill{sortedDrills.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-gray-900 dark:text-gray-100 font-semibold">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(
                  e.target.value as
                    | "created_newest"
                    | "created_oldest"
                    | "updated_newest"
                    | "updated_oldest"
                )
              }
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <option value="created_newest">Creation Date: Newest First</option>
              <option value="created_oldest">Creation Date: Oldest First</option>
              <option value="updated_newest">Updated Date: Newest First</option>
              <option value="updated_oldest">Updated Date: Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4">Filter Drills</h2>

        {/* Filter Dropdowns */}
        <div ref={dropdownRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Object.entries(tagCategories).map(([category, values]) => {
            const filterCategory = category as keyof FilterState;
            const dropdownId = `filter-${category}-menu`;

            return (
              <div key={category} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === category ? null : category)}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left flex justify-between items-center"
                  aria-expanded={openDropdown === category}
                  aria-haspopup="listbox"
                  aria-controls={dropdownId}
                >
                  <span className="font-semibold">{formatTagName(category)}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFilters[filterCategory].length > 0 &&
                      `(${selectedFilters[filterCategory].length})`}
                    <span className="ml-2">{openDropdown === category ? "▲" : "▼"}</span>
                  </span>
                </button>

                {openDropdown === category && (
                  <div
                    id={dropdownId}
                    role="listbox"
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-60 overflow-y-auto"
                  >
                    {values.map((value) => (
                      <label
                        key={value}
                        className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFilters[filterCategory].includes(value)}
                          onChange={() => toggleFilter(category, value)}
                          className="mr-3 w-4 h-4"
                        />
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatTagValue(value)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reset Button */}
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="bg-usa-red hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-900 text-white font-semibold py-2 px-6 rounded transition-colors"
          >
            Reset Filters
          </button>
        </div>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Active Filters:
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(({ category, value }) => (
                <div
                  key={`${category}-${value}`}
                  className="bg-usa-blue dark:bg-blue-700 text-white px-3 py-1 rounded-full flex items-center gap-2"
                >
                  <span className="text-sm">
                    {formatTagName(category)}: {formatTagValue(value)}
                  </span>
                  <button
                    onClick={() => removeFilter(category, value)}
                    className="hover:bg-blue-800 dark:hover:bg-blue-900 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                    aria-label={`Remove ${category} filter: ${value}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {paginatedDrills.map((drill) => (
          <Link
            key={drill.slug}
            to={`/drills/${drill.slug}`}
            aria-label={drill.name}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow block"
          >
            <div className="aspect-video bg-gray-200 dark:bg-gray-700">
              <img
                src={drill.imageUrl}
                alt=""
                className="w-full h-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="p-6">
              <h2
                className="text-xl font-bold text-usa-blue dark:text-blue-400 mb-4"
                aria-hidden="true"
              >
                {drill.name}
              </h2>
              <span
                aria-hidden="true"
                className="inline-block bg-usa-blue dark:bg-blue-600 text-white font-semibold py-2 px-6 rounded"
              >
                View Drill
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <div className="mt-8 text-center">
        <Link
          to="/"
          className="bg-usa-blue hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </PageLayout>
  );
}

export const Head = () => <Seo title="Goalie Drills" />;

export const query = graphql`
  query GoalieDrillsPage {
    allDrill {
      nodes {
        slug
        name
        drill_image
        drill_creation_date
        drill_updated_date
        tags {
          skill_level
          team_drill
          age_level
          fundamental_skill
          skating_skill
          equipment
        }
      }
    }
  }
`;
