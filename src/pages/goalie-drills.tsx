import * as React from "react"
import { Link, graphql } from "gatsby"
import Seo from "../components/SEO"
import Logo from "../components/Logo"
import DarkModeToggle from "../components/DarkModeToggle"

interface DrillNode {
  slug: string
  name: string
  images: string[]
  tags: {
    skill_level?: string[]
    team_drill?: string[]
    age_level?: string[]
    fundamental_skill?: string[]
    skating_skill?: string[]
    equipment?: string[]
  }
}

interface GoalieDrillsProps {
  data: {
    allDrill: {
      nodes: DrillNode[]
    }
  }
  location?: {
    search: string
  }
}

export default function GoalieDrills({ data, location }: GoalieDrillsProps) {
  const drills = data.allDrill.nodes.map(node => ({
    slug: node.slug,
    name: node.name,
    image: node.images && node.images.length > 0 ? node.images[0] : 'placeholder.png',
    tags: node.tags
  }))

  // Dynamically derive tag categories from actual drill data
  // This ensures the filter options always match the available drills
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

  // Parse URL search parameters to initialize filters
  const getInitialFilters = React.useCallback(() => {
    const initialFilters: Record<string, string[]> = {
      skill_level: [],
      team_drill: [],
      age_level: [],
      fundamental_skill: [],
      skating_skill: [],
      equipment: []
    }

    if (location?.search) {
      const searchParams = new URLSearchParams(location.search)
      
      // Check for each filter category in URL params
      Object.keys(initialFilters).forEach(category => {
        const paramValue = searchParams.get(category)
        if (paramValue) {
          // Support comma-separated values for multiple selections
          initialFilters[category] = paramValue.split(',').filter(v => v.trim())
        }
      })
    }

    return initialFilters
  }, [location?.search])

  // State for selected filters - initialize from URL if present
  const [selectedFilters, setSelectedFilters] = React.useState<Record<string, string[]>>(getInitialFilters)

  // State for dropdown visibility
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

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

  return (
    <div className="min-h-screen bg-usa-white dark:bg-gray-900 transition-colors">
      <header className="bg-usa-blue dark:bg-gray-800 text-usa-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link to="/">
              <Logo variant="full" format="png" className="w-32 md:w-48 lg:w-64" />
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="bg-usa-red dark:bg-red-900 text-usa-white p-8 rounded-lg shadow-lg mb-8">
          <h1 className="text-4xl font-bold mb-4">Goalie Drills</h1>
          <p className="text-lg">
            Develop your goalies during goalie-focused time or involve the whole team!
          </p>
        </div>

        {/* Filter Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4">Filter Drills</h2>
          
          {/* Filter Dropdowns */}
          <div ref={dropdownRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(tagCategories).map(([category, values]) => {
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Active Filters:</h3>
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
          {filteredDrills.map((drill) => (
            <div 
              key={drill.slug}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                <img
                  src={`/drills/${drill.slug}/${drill.image}`}
                  alt={drill.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-usa-blue dark:text-blue-400 mb-4">
                  {drill.name}
                </h2>
                <Link
                  to={`/drills/${drill.slug}`}
                  className="inline-block bg-usa-blue hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition-colors"
                >
                  View Drill
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link 
            to="/"
            className="text-usa-blue dark:text-blue-400 hover:underline text-lg font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}

export const Head = () => <Seo title="Goalie Drills" />

export const query = graphql`
  query GoalieDrillsPage {
    allDrill {
      nodes {
        slug
        name
        images
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
`
