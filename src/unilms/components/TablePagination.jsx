import React, { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Standardized Reusable Table Pagination Component
 * Features:
 * - Previous & Next buttons with icon indicators
 * - Page numbers with intelligent ellipsis windowing
 * - Highlighted active page pill
 * - Total records & active range indicator (e.g. "Showing 1 to 10 of 48 records")
 * - Page size selector (10, 25, 50, 100)
 * - Mobile responsive design (stacks gracefully on touch screens)
 */
export const TablePagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  itemName = 'records',
  className = ''
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Calculate range
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    if (safeCurrentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (safeCurrentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(safeCurrentPage - 1);
      pages.push(safeCurrentPage);
      pages.push(safeCurrentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handlePageClick = (page) => {
    if (typeof page === 'number' && page !== safeCurrentPage && page >= 1 && page <= totalPages) {
      if (onPageChange) onPageChange(page);
    }
  };

  const handleSizeChange = (e) => {
    const newSize = Number(e.target.value);
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
    if (onPageChange) {
      onPageChange(1);
    }
  };

  return (
    <div className={`table-pagination-container ${className}`}>
      {/* Left: Summary Info & Page Size */}
      <div className="table-pagination-info">
        <div style={{ fontWeight: '500' }}>
          {totalItems === 0 ? (
            <span>No {itemName} found</span>
          ) : (
            <span>
              Showing <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{startItem}</strong> to{' '}
              <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{endItem}</strong> of{' '}
              <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{totalItems}</strong> {itemName}
            </span>
          )}
        </div>

        {pageSizeOptions && pageSizeOptions.length > 0 && (
          <div className="table-pagination-pagesize">
            <span>Show:</span>
            <select
              className="table-pagination-select"
              value={pageSize}
              onChange={handleSizeChange}
              aria-label="Select rows per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation Buttons */}
      {totalItems > 0 && (
        <div className="table-pagination-nav" role="navigation" aria-label="Table Pagination">
          {/* Previous Button */}
          <button
            type="button"
            className="table-pagination-btn"
            onClick={() => handlePageClick(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
            title="Previous Page"
            aria-label="Previous Page"
          >
            <i className="fa-solid fa-chevron-left" style={{ fontSize: '11px', marginRight: '4px' }}></i>
            <span className="pagination-text-label">Prev</span>
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="table-pagination-ellipsis">
                  &hellip;
                </span>
              );
            }
            const isActive = page === safeCurrentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                className={`table-pagination-btn ${isActive ? 'active' : ''}`}
                onClick={() => handlePageClick(page)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${page}`}
              >
                {page}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            type="button"
            className="table-pagination-btn"
            onClick={() => handlePageClick(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= totalPages}
            title="Next Page"
            aria-label="Next Page"
          >
            <span className="pagination-text-label">Next</span>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', marginLeft: '4px' }}></i>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Custom Hook for client-side pagination with auto-resetting on dependency/filter changes
 */
export const useTablePagination = (items = [], initialPageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 if current page becomes invalid
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    if (!items || !items.length) return [];
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, currentPage, pageSize]);

  const resetPage = useCallback(() => setCurrentPage(1), []);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalPages,
    totalItems,
    resetPage
  };
};

export default TablePagination;

