import * as React from "react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="px-6 py-2 font-semibold rounded transition-colors bg-usa-blue hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-usa-blue dark:disabled:hover:bg-blue-600"
        aria-label="Previous page"
      >
        Previous
      </button>
      
      <div 
        className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        aria-live="polite"
      >
        Page {currentPage} of {totalPages}
      </div>
      
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="px-6 py-2 font-semibold rounded transition-colors bg-usa-blue hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-usa-blue dark:disabled:hover:bg-blue-600"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  )
}
