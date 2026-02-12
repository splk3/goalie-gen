import * as React from "react"

interface DrillTags {
  skill_level?: string[]
  team_drill?: string[]
  age_level?: string[]
  fundamental_skill?: string[]
  skating_skill?: string[]
  equipment?: string[]
}

interface Drill {
  tags: DrillTags
}

export interface FilterState {
  skill_level: string[]
  team_drill: string[]
  age_level: string[]
  fundamental_skill: string[]
  skating_skill: string[]
  equipment: string[]
}

/**
 * Custom hook for managing drill filtering functionality
 * Extracts shared logic between goalie-drills page and INeedADrillButton component
 */
export function useDrillFilters<T extends Drill>(drills: T[], initialFilters?: FilterState) {
  const defaultFilters: FilterState = React.useMemo(() => ({
    skill_level: [],
    team_drill: [],
    age_level: [],
    fundamental_skill: [],
    skating_skill: [],
    equipment: []
  }), [])

  const [selectedFilters, setSelectedFilters] = React.useState<FilterState>(
    initialFilters || defaultFilters
  )

  // Dynamically derive tag categories from actual drill data
  const tagCategories = React.useMemo(() => {
    const categories: Record<string, Set<string>> = {
      skill_level: new Set(),
      team_drill: new Set(),
      age_level: new Set(),
      fundamental_skill: new Set(),
      skating_skill: new Set(),
      equipment: new Set()
    }

    // Collect all unique tag values from drills
    drills.forEach(drill => {
      Object.entries(drill.tags).forEach(([category, values]) => {
        if (Array.isArray(values)) {
          values.forEach(value => categories[category]?.add(value))
        }
      })
    })

    // Convert Sets to sorted arrays for consistent display
    return Object.fromEntries(
      Object.entries(categories).map(([key, set]) => [
        key,
        Array.from(set).sort()
      ])
    )
  }, [drills])

  // Filter drills based on selected filters
  const filteredDrills = React.useMemo(() => {
    return drills.filter(drill => {
      // Check each filter category
      for (const category in selectedFilters) {
        const selectedValues = selectedFilters[category as keyof FilterState]
        if (selectedValues.length > 0) {
          const drillTagValues = drill.tags[category as keyof DrillTags] || []
          // Check if any selected value is in the drill's tags for this category
          const hasMatch = selectedValues.some(value => drillTagValues.includes(value))
          if (!hasMatch) {
            return false
          }
        }
      }
      return true
    })
  }, [drills, selectedFilters])

  // Toggle filter selection
  const toggleFilter = React.useCallback((category: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category as keyof FilterState] || []
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [category]: newValues }
    })
  }, [])

  // Remove a specific filter
  const removeFilter = React.useCallback((category: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [category]: prev[category as keyof FilterState].filter(v => v !== value)
    }))
  }, [])

  // Reset all filters
  const resetFilters = React.useCallback(() => {
    setSelectedFilters(defaultFilters)
  }, [defaultFilters])

  // Format tag name for display
  const formatTagName = React.useCallback((tag: string) => {
    return tag.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }, [])

  // Format tag value for display
  const formatTagValue = React.useCallback((value: string) => {
    return value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }, [])

  // Get all active filters
  const activeFilters = React.useMemo(() => {
    const filters: Array<{ category: string, value: string }> = []
    for (const category in selectedFilters) {
      selectedFilters[category as keyof FilterState].forEach(value => {
        filters.push({ category, value })
      })
    }
    return filters
  }, [selectedFilters])

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
    activeFilters
  }
}
