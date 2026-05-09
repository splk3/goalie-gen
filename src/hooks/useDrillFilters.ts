import * as React from "react";

interface DrillTags {
  skill_level?: string[];
  team_drill?: string[];
  age_level?: string[];
  fundamental_skill?: string[];
  skating_skill?: string[];
  equipment?: string[];
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
}

const FILTER_CATEGORIES: Array<keyof FilterState> = [
  "skill_level",
  "team_drill",
  "age_level",
  "fundamental_skill",
  "skating_skill",
  "equipment",
];

export const DEFAULT_FILTER_STATE: FilterState = {
  skill_level: [],
  team_drill: [],
  age_level: [],
  fundamental_skill: [],
  skating_skill: [],
  equipment: [],
};

/**
 * Custom hook for managing drill filtering functionality
 * Extracts shared logic between goalie-drills page and INeedADrillButton component
 */
export function useDrillFilters<T extends Drill>(drills: T[], initialFilters?: FilterState) {
  const [selectedFilters, setSelectedFilters] = React.useState<FilterState>(() => ({
    ...DEFAULT_FILTER_STATE,
    ...(initialFilters || {}),
  }));

  const defaultFilters = React.useMemo(
    () => ({
      ...DEFAULT_FILTER_STATE,
    }),
    []
  );

  const activeFilterEntries = React.useMemo(
    () =>
      FILTER_CATEGORIES.filter((category) => selectedFilters[category].length > 0).map((category) => ({
        category,
        values: selectedFilters[category],
        valueSet: new Set(selectedFilters[category]),
      })),
    [selectedFilters]
  );

  // Dynamically derive tag categories from actual drill data
  const tagCategories = React.useMemo(() => {
    const categories = FILTER_CATEGORIES.reduce(
      (acc, category) => {
        acc[category] = new Set<string>();
        return acc;
      },
      {} as Record<keyof FilterState, Set<string>>
    );

    // Collect all unique tag values from drills
    drills.forEach((drill) => {
      Object.entries(drill.tags).forEach(([category, values]) => {
        if (Array.isArray(values)) {
          values.forEach((value) => categories[category]?.add(value));
        }
      });
    });

    // Convert Sets to sorted arrays for consistent display
    return Object.fromEntries(
      Object.entries(categories).map(([key, set]) => [key, Array.from(set).sort()])
    );
  }, [drills]);

  // Filter drills based on selected filters
  const filteredDrills = React.useMemo(() => {
    if (activeFilterEntries.length === 0) {
      return drills;
    }

    return drills.filter((drill) => {
      for (const activeFilter of activeFilterEntries) {
        const drillTagValues = drill.tags[activeFilter.category as keyof DrillTags] || [];
        const hasMatch = drillTagValues.some((value) => activeFilter.valueSet.has(value));
        if (!hasMatch) {
          return false;
        }
      }
      return true;
    });
  }, [activeFilterEntries, drills]);

  // Toggle filter selection
  const toggleFilter = React.useCallback((category: string, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[category as keyof FilterState] || [];
      const newValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: newValues };
    });
  }, []);

  // Remove a specific filter
  const removeFilter = React.useCallback((category: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: prev[category as keyof FilterState].filter((v) => v !== value),
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
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
