import * as React from "react"
import { Link, graphql } from "gatsby"
import Seo from "../components/SEO"
import Logo from "../components/Logo"
import DarkModeToggle from "../components/DarkModeToggle"
import Pagination from "../components/Pagination"
import UsaHockeyGoldBanner from "../components/UsaHockeyGoldBanner"

interface DrillNode {
  slug: string
  name: string
  images: string[]
  drill_creation_date: string
  drill_updated_date?: string
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
    drill_creation_date: node.drill_creation_date,
    drill_updated_date: node.drill_updated_date,
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

  // Initialize pagination from URL "page" query parameter if present
  const getInitialPage = React.useCallback(() => {
    if (location?.search) {
      const searchParams = new URLSearchParams(location.search)
      const pageParam = searchParams.get("page")
      if (pageParam) {
        const parsed = parseInt(pageParam, 10)
        if (!Number.isNaN(parsed) && parsed > 0) {
          return parsed
        }
      }
    }
    return 1
  }, [location?.search])

  // Initialize sort from URL "sort" query parameter if present
  const getInitialSort = React.useCallback(() => {
    if (location?.search) {
      const searchParams = new URLSearchParams(location.search)
      const sortParam = searchParams.get("sort")
      if (sortParam === "created_newest" || sortParam === "created_oldest" || sortParam === "updated_newest" || sortParam === "updated_oldest") {
        return sortParam
      }
    }
    return "created_newest"
  }, [location?.search])

  // State for selected filters - initialize from URL if present
  const [selectedFilters, setSelectedFilters] = React.useState<Record<string, string[]>>(getInitialFilters)

  // State for pagination - initialize from URL if present
  const [currentPage, setCurrentPage] = React.useState<number>(getInitialPage)
  const itemsPerPage = 15

  // State for sorting - initialize from URL if present
  const [sortOrder, setSortOrder] = React.useState<"created_newest" | "created_oldest" | "updated_newest" | "updated_oldest">(getInitialSort)

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

  // Sort drills based on sortOrder
  const sortedDrills = React.useMemo(() => {
    const sorted = [...filteredDrills]

    sorted.sort((a, b) => {
      // Determine which date field to use based on sort order
      const isUpdatedSort = sortOrder === "updated_newest" || sortOrder === "updated_oldest"
      const dateFieldA = isUpdatedSort ? a.drill_updated_date : a.drill_creation_date
      const dateFieldB = isUpdatedSort ? b.drill_updated_date : b.drill_creation_date

      // Handle drills without dates - they go to the end
      if (!dateFieldA && !dateFieldB) return 0
      if (!dateFieldA) return 1
      if (!dateFieldB) return -1

      const dateA = new Date(dateFieldA).getTime()
      const dateB = new Date(dateFieldB).getTime()

      // NaN guard - treat invalid dates as missing
      const isInvalidA = Number.isNaN(dateA)
      const isInvalidB = Number.isNaN(dateB)

      if (isInvalidA && isInvalidB) return 0
      if (isInvalidA) return 1
      if (isInvalidB) return -1

      // Sort based on direction (newest vs oldest)
      const isNewest = sortOrder === "created_newest" || sortOrder === "updated_newest"
      return isNewest ? dateB - dateA : dateA - dateB
    })

    return sorted
  }, [filteredDrills, sortOrder])

  // Reset to page 1 when filters change
  // Use a stable key to prevent unnecessary rerenders
  const filterKey = React.useMemo(() => {
    // Create a stable key by sorting categories and their values
    const sortedEntries = Object.entries(selectedFilters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, values]) => `${key}:${[...values].sort().join(',')}`)
      .join('|')
    return sortedEntries
  }, [selectedFilters])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [filterKey])

  // Keep pagination state synchronized with the URL
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const searchParams = new URLSearchParams(window.location.search)

    if (currentPage > 1) {
      searchParams.set("page", String(currentPage))
    } else {
      // Remove "page" when on the first page to keep URLs clean
      searchParams.delete("page")
    }

    const searchString = searchParams.toString()
    const newUrl =
      window.location.pathname +
      (searchString ? `?${searchString}` : "") +
      window.location.hash

    window.history.replaceState(null, "", newUrl)
  }, [currentPage])

  // Keep sort state synchronized with the URL
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const searchParams = new URLSearchParams(window.location.search)

    if (sortOrder !== "created_newest") {
      searchParams.set("sort", sortOrder)
    } else {
      // Remove "sort" when it's the default value to keep URLs clean
      searchParams.delete("sort")
    }

    const searchString = searchParams.toString()
    const newUrl =
      window.location.pathname +
      (searchString ? `?${searchString}` : "") +
      window.location.hash

    window.history.replaceState(null, "", newUrl)
  }, [sortOrder])

  // Calculate pagination values
  const totalPages = Math.ceil(sortedDrills.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDrills = sortedDrills.slice(startIndex, endIndex)

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

        {/* Sort Section */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-900 dark:text-gray-100 font-semibold">
              Showing {sortedDrills.length} drill{sortedDrills.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-gray-900 dark:text-gray-100 font-semibold">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "created_newest" | "created_oldest" | "updated_newest" | "updated_oldest")}
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
          {paginatedDrills.map((drill) => (
            <Link
              key={drill.slug}
              to={`/drills/${drill.slug}`}
              aria-label={drill.name}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow block"
            >
              <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                <img
                  src={`/drills/${drill.slug}/${drill.image}`}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-usa-blue dark:text-blue-400 mb-4" aria-hidden="true">
                  {drill.name}
                </h2>
                <span aria-hidden="true" className="inline-block bg-usa-blue dark:bg-blue-600 text-white font-semibold py-2 px-6 rounded">
                  View Drill
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        <div className="mt-8 text-center">
          <Link 
            to="/"
            className="text-usa-blue dark:text-blue-400 hover:underline text-lg font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </main>

      <footer className="bg-usa-blue dark:bg-gray-800 text-usa-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <UsaHockeyGoldBanner showCopyright showTerms />
        </div>
      </footer>
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
`
