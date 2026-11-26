import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import academicsService from '../../../services/academics.service';

const formatTimeTo12Hour = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const formattedH = h < 10 ? `0${h}` : `${h}`;
  return `${formattedH}:${m} ${ampm}`;
};

const defaultPeriods = [
  { period_name: 'Period 1', start_time: '09:00 AM', end_time: '09:50 AM', is_break: false, periodNumber: 1 },
  { period_name: 'Period 2', start_time: '09:50 AM', end_time: '10:40 AM', is_break: false, periodNumber: 2 },
  { period_name: 'Morning Interval / Tea Break', start_time: '10:40 AM', end_time: '10:55 AM', is_break: true, periodNumber: 3 },
  { period_name: 'Period 3', start_time: '10:55 AM', end_time: '11:45 AM', is_break: false, periodNumber: 4 },
  { period_name: 'Period 4', start_time: '11:45 AM', end_time: '12:35 PM', is_break: false, periodNumber: 5 },
  { period_name: 'Lunch Break & Recess', start_time: '12:35 PM', end_time: '01:25 PM', is_break: true, periodNumber: 6 },
  { period_name: 'Period 5', start_time: '01:25 PM', end_time: '02:15 PM', is_break: false, periodNumber: 7 },
  { period_name: 'Period 6', start_time: '02:15 PM', end_time: '03:05 PM', is_break: false, periodNumber: 8 },
  { period_name: 'Period 7', start_time: '03:05 PM', end_time: '03:55 PM', is_break: false, periodNumber: 9 }
];

const OrgTimetablePeriods = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [periods, setPeriods] = useState([]);
  const [periodName, setPeriodName] = useState('');
  const [startTime, setStartTime] = useState('04:00 PM');
  const [endTime, setEndTime] = useState('04:50 PM');
  const [isBreak, setIsBreak] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const loadPeriods = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await academicsService.getTimetablePeriods();
      if (Array.isArray(data) && data.length > 0) {
        setPeriods(data.map(p => ({
          ...p,
          period_name: p.name,
          start_time: p.startTime,
          end_time: p.endTime,
          is_break: p.isBreak,
        })));
      } else {
        setPeriods([]);
      }
    } catch (e) {
      console.error('Failed to load periods:', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadPeriods(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddPeriod = async (e) => {
    e.preventDefault();
    if (!periodName.trim()) return;

    const formattedStart = formatTimeTo12Hour(startTime);
    const formattedEnd = formatTimeTo12Hour(endTime);

    const confirmed = await confirm({
      title: 'Confirm Add Timetable Period',
      message: `Add period slot "${periodName.trim()}" to campus bell schedule?`,
      details: [
        `Period Name: ${periodName.trim()}`,
        `Time Duration: ${formattedStart} - ${formattedEnd}`,
        `Type: ${isBreak ? 'Recess / Interval Break' : 'Academic Lecture Period'}`
      ],
      confirmText: 'Yes, Add Slot',
      variant: 'primary',
      icon: 'fa-solid fa-clock'
    });
    if (!confirmed) return;

    try {
      await academicsService.createTimetablePeriod({
        name: periodName.trim(),
        startTime: formattedStart,
        endTime: formattedEnd,
        isBreak,
        periodNumber: periods.length + 1,
      });
      setPeriodName('');
      setIsBreak(false);
      showToast(`Slot "${periodName.trim()}" added to PostgreSQL.`);
      await loadPeriods();
    } catch (err) {
      alert('Error creating period: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirm({
      title: 'Confirm Delete Period Slot',
      message: `Delete period "${name}" from campus bell schedule?`,
      details: 'This will permanently remove the bell schedule period and unassign any lecture sessions linked to it in the database.',
      confirmText: 'Yes, Delete Slot',
      variant: 'danger',
      icon: 'fa-solid fa-trash-can'
    });
    if (!confirmed) return;

    try {
      await academicsService.deleteTimetablePeriod(id);
      showToast(`Slot "${name}" removed.`);
      await loadPeriods();
    } catch (err) {
      alert('Error deleting period: ' + err.message);
    }
  };

  const handleAutoGen = async () => {
    if (periods && periods.length > 0) {
      const confirmed = await confirm({
        title: 'Reset & Re-generate Bell Schedule',
        message: `Currently ${periods.length} periods exist in the bell schedule. Replace them with the standard 7-period collegiate schedule?`,
        details: [
          'All existing periods will be refreshed to avoid duplicate period slots in the database.',
          'Standard collegiate schedule contains 9 slots (7 lectures + 2 breaks).'
        ],
        confirmText: 'Yes, Replace & Generate',
        variant: 'warning',
        icon: 'fa-solid fa-wand-magic-sparkles'
      });
      if (!confirmed) return;

      // Delete existing periods first to avoid duplicates
      for (const p of periods) {
        try {
          await academicsService.deleteTimetablePeriod(p.id);
        } catch (e) {
          // ignore if already deleted
        }
      }
    } else {
      const confirmed = await confirm({
        title: 'Generate Collegiate Bell Schedule',
        message: 'Auto-generate standard 7-period collegiate bell schedule in PostgreSQL?',
        details: [
          '7 Academic Lecture Periods (50m each) + Morning Interval (15m) + Lunch Recess (50m)',
          'Total Generated: 9 Bell Schedule Slots in database'
        ],
        confirmText: 'Yes, Generate Schedule',
        variant: 'primary',
        icon: 'fa-solid fa-wand-magic-sparkles'
      });
      if (!confirmed) return;
    }

    for (const dp of defaultPeriods) {
      await academicsService.createTimetablePeriod({
        name: dp.period_name,
        startTime: dp.start_time,
        endTime: dp.end_time,
        isBreak: dp.is_break,
        periodNumber: dp.periodNumber,
      });
    }
    setIsModalOpen(false);
    showToast('Standard 7-period collegiate bell schedule generated in PostgreSQL!');
    await loadPeriods();
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(periods, 12);

  return (
    <>
      <ConfirmDialog />

      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
          <i className="fa-solid fa-circle-check"></i>
          {toastMsg}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <Link 
          to="/unilms/org/timetable" 
          style={{ color: '#7C3AED', textDecoration: 'none', fontSize: '13.5px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Timetable Templates
        </Link>
      </div>

      {/* Top Header Card */}
      <div
        style={{
          background: 'var(--card-bg, #fff)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: 'clamp(16px, 3vw, 22px) clamp(18px, 3vw, 26px)',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              minWidth: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
            }}
          >
            <i className="fa-solid fa-clock"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Class Periods &amp; Bell Schedule Configurations
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Define daily lecture time slots, morning intervals, and recess breaks for templates
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => setIsModalOpen(true)} 
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#fff', border: 'none', padding: '10px 18px', fontWeight: '700', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>⚡ Auto-Generate Schedule</span>
          </button>
          <Link 
            to="/unilms/org/timetable" 
            className="btn btn-outline" 
            style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-arrow-left" style={{ color: '#7C3AED' }}></i>
            <span>Timetable Hub</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Configured Periods Table Card */}
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Configured Daily Periods ({periods.length} Slots)
            </h3>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Period / Break Name</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Time Slot</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' }}>Slot Category</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={4} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No period slots added yet.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {p.period_name}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>
                        {p.start_time} - {p.end_time}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {p.is_break ? (
                          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px' }}>
                            <i className="fa-solid fa-mug-hot me-1"></i> {p.period_name.toLowerCase().includes('lunch') ? 'Lunch Recess' : 'Morning Break'}
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px' }}>
                            <i className="fa-solid fa-chalkboard-user me-1"></i> Academic Class
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button 
                          type="button" 
                          onClick={() => handleDelete(p.id, p.period_name)}
                          className="btn-icon text-danger" 
                          style={{ background: 'none', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '6px', color: '#DC2626', cursor: 'pointer' }} 
                          title="Delete Slot"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="periods & breaks"
          />
        </div>

        {/* Add Slot Card */}
        <div>
          <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
              <i className="fa-solid fa-plus-circle me-1" style={{ color: '#7C3AED' }}></i> Add Custom Slot
            </h3>
            <form onSubmit={handleAddPeriod}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Period Name / Title <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  className="form-control" 
                  placeholder="e.g. Period 1, Library / Sports" 
                  required 
                  style={{ width: '100%', height: '38px', borderRadius: '8px', padding: '0 12px' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Start Time <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="e.g. 04:00 PM"
                    className="form-control" 
                    required 
                    style={{ width: '100%', height: '38px', borderRadius: '8px', padding: '0 10px' }} 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    End Time <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="e.g. 04:50 PM"
                    className="form-control" 
                    required 
                    style={{ width: '100%', height: '38px', borderRadius: '8px', padding: '0 10px' }} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={isBreak}
                    onChange={(e) => setIsBreak(e.target.checked)}
                  />
                  This slot is an Interval / Lunch Break
                </label>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', background: '#7C3AED', border: 'none', padding: '10px', fontWeight: '700', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-plus me-1"></i> Add Period Slot
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Auto Gen Drawer */}
      <div 
        className={`drawer-overlay ${isModalOpen ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target.classList.contains('drawer-overlay')) setIsModalOpen(false);
        }}
      >
        <div className="drawer-content" style={{ maxWidth: '540px' }}>
          <div className="drawer-header" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', color: '#fff', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#fff' }}>
              <i className="fa-solid fa-wand-magic-sparkles me-2"></i> Auto-Generate Timetable Schedule
            </h3>
            <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} style={{ color: '#fff', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="drawer-body" style={{ padding: '22px' }}>
            <div style={{ background: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <i className="fa-solid fa-circle-info me-1" style={{ color: '#7C3AED' }}></i> Automatically generate standard 7 academic lecture periods and morning/lunch break intervals according to UGC collegiate guidelines.
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              This will populate Period 1 (09:00 AM) through Period 7 (03:55 PM) with standard 50-minute teaching intervals directly in PostgreSQL.
            </p>
          </div>

          <div className="drawer-footer" style={{ padding: '16px 22px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleAutoGen} style={{ background: '#7C3AED', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              Generate Timetable Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrgTimetablePeriods;
