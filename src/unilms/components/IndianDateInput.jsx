import React, { useRef, useState, useEffect } from 'react';

/**
 * Indian Standard Date Input Component
 * Displays strictly in DD/MM/YYYY format with Indian localization,
 * while seamlessly interoperating with ISO (YYYY-MM-DD) state values.
 */
const IndianDateInput = ({
  value = '',
  onChange,
  id,
  name,
  required = false,
  placeholder = 'DD/MM/YYYY',
  disabled = false,
  className = 'form-control',
  style = {},
  min,
  max
}) => {
  const hiddenDateRef = useRef(null);

  // Convert YYYY-MM-DD to DD/MM/YYYY
  const toDisplayFormat = (isoStr) => {
    if (!isoStr) return '';
    try {
      const parts = String(isoStr).split('T')[0].split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const [y, m, d] = parts;
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
      return isoStr;
    } catch {
      return isoStr;
    }
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD
  const toIsoFormat = (displayStr) => {
    if (!displayStr) return '';
    try {
      const parts = displayStr.trim().split('/');
      if (parts.length === 3) {
        const [d, m, y] = parts;
        if (d && m && y && y.length === 4) {
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }
      return displayStr;
    } catch {
      return displayStr;
    }
  };

  const [displayText, setDisplayText] = useState(() => toDisplayFormat(value));

  useEffect(() => {
    setDisplayText(toDisplayFormat(value));
  }, [value]);

  const isoValue = value ? String(value).split('T')[0] : '';

  const handlePickerChange = (e) => {
    const pickedIso = e.target.value; // e.g. "2026-12-31"
    setDisplayText(toDisplayFormat(pickedIso));
    if (onChange) {
      onChange(pickedIso);
    }
  };

  const handleTextChange = (e) => {
    let input = e.target.value;
    setDisplayText(input);

    // If matches complete DD/MM/YYYY, trigger onChange
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(input.trim())) {
      const converted = toIsoFormat(input.trim());
      if (onChange) {
        onChange(converted);
      }
    }
  };

  const openCalendar = () => {
    if (disabled) return;
    if (hiddenDateRef.current) {
      if (typeof hiddenDateRef.current.showPicker === 'function') {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current.focus();
      }
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '100%',
        ...style
      }}
      className="indian-date-input-container"
    >
      <input
        type="text"
        id={id}
        name={name}
        className={className}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={displayText}
        onChange={handleTextChange}
        style={{
          width: '100%',
          paddingRight: '38px',
          boxSizing: 'border-box'
        }}
      />
      {/* Hidden native date input for browser calendar picker */}
      <input
        type="date"
        ref={hiddenDateRef}
        value={isoValue}
        min={min}
        max={max}
        tabIndex={-1}
        onChange={handlePickerChange}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: '1px',
          height: '1px',
          right: '12px'
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={openCalendar}
        disabled={disabled}
        title="Choose date (DD/MM/YYYY)"
        style={{
          position: 'absolute',
          right: '8px',
          background: 'none',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '6px 8px',
          color: 'var(--primary, #0284C7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '15px'
        }}
      >
        <i className="fa-regular fa-calendar-days"></i>
      </button>
    </div>
  );
};

export default IndianDateInput;

