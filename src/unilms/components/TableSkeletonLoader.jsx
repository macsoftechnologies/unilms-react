import React from 'react';

/**
 * Standardized Table Skeleton Loader (Shimmer Placeholders)
 * Renders animated shimmer rows and columns matching the table structure.
 * 
 * @param {number} columns - Number of columns to render in each row (default 5)
 * @param {number} rows - Number of skeleton rows to render (default 5)
 * @param {boolean} asTbody - If true, wraps rows in <tbody>. If false, returns <><tr>...</tr></> (default false)
 * @param {Array<string>} widths - Optional array of custom widths for each column (e.g. ['60px', '200px', '140px'])
 */
const TableSkeletonLoader = ({ 
  columns = 5, 
  rows = 5, 
  asTbody = false,
  widths = null 
}) => {
  // Pre-configured proportional widths to simulate realistic data columns
  const defaultWidths = [
    '50px',   // ID / Code
    '180px',  // Name / Title
    '140px',  // Subtitle / Dept
    '100px',  // Category / Status
    '90px',   // Date
    '80px',   // Amount / Metric
    '70px'    // Actions
  ];

  const getColWidth = (cIdx) => {
    if (widths && widths[cIdx]) return widths[cIdx];
    return defaultWidths[cIdx % defaultWidths.length] || '100px';
  };

  const rowsMarkup = Array.from({ length: rows }).map((_, rIdx) => (
    <tr 
      key={`skeleton-row-${rIdx}`} 
      className="skeleton-row"
      style={{ 
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        transition: 'background 0.15s ease'
      }}
    >
      {Array.from({ length: columns }).map((_, cIdx) => (
        <td 
          key={`skeleton-cell-${rIdx}-${cIdx}`}
          style={{ 
            padding: '14px 18px', 
            verticalAlign: 'middle' 
          }}
        >
          <div 
            className="skeleton-shimmer-bar"
            style={{
              height: cIdx === 0 ? '16px' : '14px',
              width: getColWidth(cIdx),
              maxWidth: '100%',
              borderRadius: '6px'
            }}
          />
        </td>
      ))}
    </tr>
  ));

  if (asTbody) {
    return <tbody>{rowsMarkup}</tbody>;
  }

  return <>{rowsMarkup}</>;
};

export default TableSkeletonLoader;

