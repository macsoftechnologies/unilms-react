/**
 * Global Indian Standard Date & Time Formatter (DD/MM/YYYY in IST / Asia/Kolkata)
 */

export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
};

// Global default override so all native toLocaleDateString() calls render DD/MM/YYYY in IST
if (typeof Date !== 'undefined' && !Date.__unilms_date_patched) {
  Date.__unilms_date_patched = true;

  const originalToLocaleDateString = Date.prototype.toLocaleDateString;
  Date.prototype.toLocaleDateString = function (locale, options) {
    const loc = locale || 'en-IN';
    const opts = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
      ...options
    };
    return originalToLocaleDateString.call(this, loc, opts);
  };

  const originalToLocaleString = Date.prototype.toLocaleString;
  Date.prototype.toLocaleString = function (locale, options) {
    const loc = locale || 'en-IN';
    const opts = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
      ...options
    };
    return originalToLocaleString.call(this, loc, opts);
  };
}

export default {
  formatDate,
  formatDateTime
};

