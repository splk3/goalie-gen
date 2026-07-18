import * as React from "react";
import { formatDrillTagValue } from "../utils/drillTagLabels";

interface DrillTags {
  skill_level?: string[];
  team_drill?: string;
  age_level?: string[];
  fundamental_skill?: string[];
  skating_skill?: string[];
  equipment?: string[];
  space_required?: string[];
}

interface Drill {
  tags: DrillTags;
}

export interface FilterState {
  skill_level: string[];
  team_drill: string[];
  age_level: string[];
  fundamental_skill: string[];
  skating_skill: string[];
  equipment: string[];
  space_required: string[];
}

export type FilterCategory = keyof FilterState;

export interface DrillFilterOptions {
  defaultFilters?: Partial<FilterState>;
  spaceMatching?: "exact" | "capacity";
}

const FILTER_CATEGORIES: FilterCategory[] = [
  "skill_level",
  "team_drill",
  "age_level",
  "fundamental_skill",
  "skating_skill",
  "equipment",
  "space_required",
];

export const DEFAULT_FILTER_STATE: FilterState = {
  skill_level: [],
  team_drill: [],
  age_level: [],
  fundamental_skill: [],
  skating_skill: [],
  equipment: [],
  space_required: [],
};

export const SPACE_AVAILABLE_VALUES = [
  "full_ice",
  "half_ice",
  "whole_zone",
  "flexible",
  "half_zone",
  "crease_only",
];

const SPACE_CAPACITY_RANK: Record<string, number> = {
  crease_only: 0,
  half_zone: 1,
  flexible: 2,
  whole_zone: 3,
  half_ice: 4,
  full_ice: 5,
};

const AGE_LEVEL_RANK: Record<string, number> = {
  "10_and_under": 0,
  "12U": 1,
  "14U": 2,
  "16U_and_older": 3,
};

/**
 * Custom hook for managing drill filtering functionality
 * Extracts shared logic between goalie-drills page and INeedADrillButton component
 */
export function useDrillFilters<T extends Drill>(
  drills: T[],
  initialFilters?: FilterState,
  options: DrillFilterOptions = {}
) {
  const { defaultFilters: configuredDefaults, spaceMatching = "exact" } = options;
  const defaultFilters = React.useMemo(
    () => ({
      ...DEFAULT_FILTER_STATE,
      ...configuredDefaults,
    }),
    [configuredDefaults]
  );

  const [selectedFilters, setSelectedFilters] = React.useState<FilterState>(() => ({
    ...defaultFilters,
    ...(initialFilters || {}),
  }));

  const activeFilterEntries = React.useMemo(
    () =>
      FILTER_CATEGORIES.filter((category) => selectedFilters[category].length > 0).map(
        (category) => ({
          category,
          values: selectedFilters[category],
          valueSet: new Set(selectedFilters[category]),
        })
      ),
    [selectedFilters]
  );

  // Dynamically derive tag categories from actual drill data
  const tagCategories = React.useMemo(() => {
    const categories = FILTER_CATEGORIES.reduce(
      (acc, category) => {
        acc[category] = new Set<string>();
        return acc;
      },
      {} as Record<FilterCategory, Set<string>>
    );

    // Collect all unique tag values from drills
    drills.forEach((drill) => {
      FILTER_CATEGORIES.forEach((category) => {
        const values = drill.tags[category as keyof DrillTags];
        if (Array.isArray(values)) {
          values.forEach((value) => categories[category].add(value));
        } else if (typeof values === "string") {
          categories[category].add(values);
        }
      });
    });

    // Convert Sets to sorted arrays for consistent display
    return Object.fromEntries(
      Object.entries(categories).map(([key, set]) => [key, Array.from(set).sort()])
    ) as Record<FilterCategory, string[]>;
  }, [drills]);

  // Filter drills based on selected filters
  const filteredDrills = React.useMemo(() => {
    if (activeFilterEntries.length === 0) {
      return drills;
    }

    return drills.filter((drill) => {
      for (const activeFilter of activeFilterEntries) {
        const rawTagValue = drill.tags[activeFilter.category as keyof DrillTags];
        const drillTagValues = Array.isArray(rawTagValue)
          ? rawTagValue
          : rawTagValue
            ? [rawTagValue]
            : [];
        const hasMatch =
          activeFilter.category === "age_level"
            ? drillTagValues.some((drillValue) => {
                if (activeFilter.valueSet.has(drillValue)) {
                  return true;
                }

                if (drillValue === "all") {
                  return activeFilter.values.some((selectedValue) => selectedValue !== "all");
                }

                const drillRank = AGE_LEVEL_RANK[drillValue];
                return activeFilter.values.some((selectedValue) => {
                  const selectedRank = AGE_LEVEL_RANK[selectedValue];
                  return (
                    selectedRank !== undefined &&
                    drillRank !== undefined &&
                    selectedRank >= drillRank
                  );
                });
              })
            : activeFilter.category === "equipment" && activeFilter.valueSet.has("none")
              ? drillTagValues.length === 0 ||
                drillTagValues.some((value) => activeFilter.valueSet.has(value))
              : activeFilter.category === "space_required" && spaceMatching === "capacity"
                ? drillTagValues.some((drillValue) =>
                    activeFilter.values.some((selectedValue) => {
                      const selectedRank = SPACE_CAPACITY_RANK[selectedValue];
                      const drillRank = SPACE_CAPACITY_RANK[drillValue];
                      return (
                        selectedRank !== undefined &&
                        drillRank !== undefined &&
                        selectedRank >= drillRank
                      );
                    })
                  )
                : drillTagValues.some((value) => activeFilter.valueSet.has(value));
        if (!hasMatch) {
          return false;
        }
      }
      return true;
    });
  }, [activeFilterEntries, drills, spaceMatching]);

  // Toggle filter selection
  const toggleFilter = React.useCallback((category: FilterCategory, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[category];
      const newValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: newValues };
    });
  }, []);

  // Remove a specific filter
  const removeFilter = React.useCallback((category: FilterCategory, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: prev[category].filter((v) => v !== value),
    }));
  }, []);

  // Reset all filters
  const resetFilters = React.useCallback(() => {
    setSelectedFilters(defaultFilters);
  }, [defaultFilters]);

  // Format tag name for display
  const formatTagName = React.useCallback((tag: string) => {
    return tag
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, []);

  // Format tag value for display
  const formatTagValue = React.useCallback((value: string) => {
    return formatDrillTagValue(value);
  }, []);

  // Get all active filters
  const activeFilters = React.useMemo(() => {
    return activeFilterEntries.flatMap(({ category, values }) =>
      values.map((value) => ({ category, value }))
    );
  }, [activeFilterEntries]);

  return {
    selectedFilters,
    setSelectedFilters,
    tagCategories,
    filteredDrills,
    toggleFilter,
    removeFilter,
    resetFilters,
    formatTagName,
    formatTagValue,
    activeFilters,
  };
}
