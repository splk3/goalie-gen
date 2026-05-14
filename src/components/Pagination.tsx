import * as React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const normalizedCurrentPage =
    totalPages > 0 ? Math.min(Math.max(currentPage, 1), totalPages) : currentPage;

  React.useEffect(() => {
    if (totalPages <= 0) {
      return;
    }

    if (currentPage !== normalizedCurrentPage) {
      onPageChange(normalizedCurrentPage);
    }
  }, [currentPage, normalizedCurrentPage, onPageChange, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (normalizedCurrentPage > 1) {
      onPageChange(normalizedCurrentPage - 1);
    }
  };

  const handleNext = () => {
    if (normalizedCurrentPage < totalPages) {
      onPageChange(normalizedCurrentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <button
        onClick={handlePrevious}
        disabled={normalizedCurrentPage <= 1}
        className="px-6 py-2 font-semibold rounded transition-colors bg-usa-blue hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-usa-blue dark:disabled:hover:bg-blue-600"
        aria-label="Previous page"
      >
        Previous
      </button>

      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100" aria-live="polite">
        Page {normalizedCurrentPage} of {totalPages}
      </div>

      <button
        onClick={handleNext}
        disabled={normalizedCurrentPage >= totalPages}
        className="px-6 py-2 font-semibold rounded transition-colors bg-usa-blue hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-usa-blue dark:disabled:hover:bg-blue-600"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}
