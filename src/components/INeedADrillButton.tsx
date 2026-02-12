import * as React from "react"
import { useStaticQuery, graphql, navigate } from "gatsby"
import Logo from "./Logo"
import { trackEvent } from "../utils/analytics"

interface DrillNode {
  slug: string
  name: string
  tags: {
    skill_level?: string[]
    team_drill?: string[]
    age_level?: string[]
    fundamental_skill?: string[]
    skating_skill?: string[]
    equipment?: string[]
  }
}

export default function INeedADrillButton() {
  const data = useStaticQuery(graphql`
    query AllDrillsForButton {
      allDrill {
        nodes {
          slug
          name
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
  `)

  const drills: DrillNode[] = data.allDrill.nodes

  const [showModal, setShowModal] = React.useState<boolean>(false)
  const [selectedFilters, setSelectedFilters] = React.useState<Record<string, string[]>>({
    skill_level: [],
    team_drill: [],
    age_level: [],
    fundamental_skill: [],
    skating_skill: [],
    equipment: []
  })
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

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

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  // Filter drills based on selected filters
  const filteredDrills = React.useMemo(() => {
    return drills.filter(drill => {
      // Check each filter category
      for (const category in selectedFilters) {
        const selectedValues = selectedFilters[category]
        if (selectedValues.length > 0) {
          const drillTagValues = drill.tags[category as keyof typeof drill.tags] || []
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

  const getDrill = () => {
    if (filteredDrills.length === 0) {
      alert('No drills match the selected filters. Please adjust your filters and try again.')
      return
    }

    // Select a random drill from filtered drills
    const randomIndex = Math.floor(Math.random() * filteredDrills.length)
    const selectedDrill = filteredDrills[randomIndex]

    // Track event
    trackEvent('download_drill', {
      drill_name: selectedDrill.name,
      filters_applied: Object.entries(selectedFilters)
        .filter(([, values]) => values.length > 0)
        .map(([key, values]) => `${key}:${values.join(',')}`)
        .join(';')
    })

    // Navigate to the drill page
    navigate(`/drills/${selectedDrill.slug}`)
  }

  // Toggle filter selection
  const toggleFilter = (category: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category] || []
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [category]: newValues }
    })
  }

  // Remove a specific filter
  const removeFilter = (category: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [category]: prev[category].filter(v => v !== value)
    }))
  }

  // Reset all filters
  const resetFilters = () => {
    setSelectedFilters({
      skill_level: [],
      team_drill: [],
      age_level: [],
      fundamental_skill: [],
      skating_skill: [],
      equipment: []
    })
  }

  // Format tag name for display
  const formatTagName = (tag: string) => {
    return tag.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  // Format tag value for display
  const formatTagValue = (value: string) => {
    return value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  // Get all active filters
  const activeFilters = React.useMemo(() => {
    const filters: Array<{ category: string, value: string }> = []
    for (const category in selectedFilters) {
      selectedFilters[category].forEach(value => {
        filters.push({ category, value })
      })
    }
    return filters
  }, [selectedFilters])

  const handleCancel = React.useCallback(() => {
    setShowModal(false)
    resetFilters()
  }, [])

  // Close modal when Escape key is pressed
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        handleCancel()
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showModal, handleCancel])

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-white hover:bg-gray-100 dark:bg-gray-100 dark:hover:bg-gray-200 text-usa-blue font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105 text-center"
      >
        I Need a Drill!
      </button>

      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleCancel}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drill-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <Logo variant="alt" format="png" width={80} height={80} className="dark-mode-aware" />
              <h2 
                id="drill-modal-title"
                className="text-2xl font-bold text-usa-blue dark:text-blue-400"
              >
                Find a Drill
              </h2>
            </div>

            {/* Filter Dropdowns */}
            <div ref={dropdownRef} className="grid md:grid-cols-2 gap-4 mb-6">
              {Object.entries(tagCategories).map(([category, values]) => {
                if (values.length === 0) return null
                const dropdownId = `filter-${category}-menu`
                
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
                        {selectedFilters[category].length > 0 && `(${selectedFilters[category].length})`}
                        <span className="ml-2">{openDropdown === category ? '▲' : '▼'}</span>
                      </span>
                    </button>
                    
                    {openDropdown === category && (
                      <div
                        id={dropdownId}
                        role="listbox"
                        className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-60 overflow-y-auto"
                      >
                        {values.map(value => (
                          <label
                            key={value}
                            className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFilters[category].includes(value)}
                              onChange={() => toggleFilter(category, value)}
                              className="mr-3 w-4 h-4"
                            />
                            <span className="text-gray-900 dark:text-gray-100">{formatTagValue(value)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Active Filters Display */}
            {activeFilters.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-300 dark:border-gray-600">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Active Filters:</h3>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map(({ category, value }) => (
                    <div
                      key={`${category}-${value}`}
                      className="bg-usa-blue dark:bg-blue-700 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                    >
                      <span>
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

            {/* Results count */}
            <div className="mb-4 text-center text-gray-700 dark:text-gray-300">
              {filteredDrills.length} drill{filteredDrills.length !== 1 ? 's' : ''} match{filteredDrills.length === 1 ? 'es' : ''} your filters
            </div>

            <div className="flex gap-4">
              <button
                onClick={getDrill}
                className="flex-1 bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Get Drill
              </button>
              <button
                onClick={resetFilters}
                className="flex-1 bg-usa-red hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-900 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
