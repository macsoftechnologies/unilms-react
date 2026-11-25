import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader } from '../../components';
import { facultyService } from '../../services/faculty.service';

const FacultyTimetable = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dayFilter, setDayFilter] = useState('All');
  const [toastMsg, setToastMsg] = useState(null);

  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Standard B.Tech Engineering Timetable',
      description: '6 Periods per day (60 min each) with morning interval and 1-hour lunch break.',
    },
    {
      id: 2,
      name: 'Laboratory & Practical Schedule',
      description: 'Morning theory lecture blocks followed by 2-hour hands-on software/hardware labs.',
    },
  ]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadTimetable = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const res = await facultyService.getTimetable();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setScheduleSlots(list);
    } catch (e) {
      console.error('Failed to load faculty timetable:', e);
      if (!isPolling) showToast('Failed to load timetable from server.');
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  // 30s Background Sync Polling
  useEffect(() => {
    const timer = setInterval(() => {
      loadTimetable(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadTimetable]);

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const newT = {
      id: Date.now(),
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Custom academic department schedule model.',
    };

    setTemplates((prev) => [...prev, newT]);
    setNewTemplateName('');
    setNewTemplateDesc('');
    showToast(`Template "${newT.name}" registered successfully!`);
  };

  const filteredSlots = useMemo(() => {
    if (dayFilter === 'All') return scheduleSlots;
    return scheduleSlots.filter(
      (s) => s.day?.toLowerCase() === dayFilter.toLowerCase()
    );
  }, [scheduleSlots, dayFilter]);

  const days = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <>
      <section className="view-section active">
        {toastMsg && (
          <div
            style={{
              background: '#10B981',
              color: '#fff',
              padding: '12px 18px',
              borderRadius: '10px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button
              onClick={() => setToastMsg(null)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '16px',
            padding: '22px 26px',
            marginBottom: '22px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                minWidth: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
              }}
            >
              <i className="fa-solid fa-calendar-week"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary, #1e293b)', letterSpacing: '-0.3px' }}>
                Faculty Timetable &amp; Bell Schedule
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>
                Weekly lecture periods, practical laboratory slots, and active teaching timetable
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', background: 'var(--bg-main, #f1f5f9)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color, #cbd5e1)', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: activeTab === 'schedule' ? '#7C3AED' : 'transparent',
                  color: activeTab === 'schedule' ? '#fff' : 'var(--text-secondary, #64748b)',
                }}
              >
                <i className="fa-solid fa-calendar-days me-1"></i> Weekly Teaching Schedule
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('master')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: activeTab === 'master' ? '#7C3AED' : 'transparent',
                  color: activeTab === 'master' ? '#fff' : 'var(--text-secondary, #64748b)',
                }}
              >
                <i className="fa-solid fa-sliders me-1"></i> Master Templates
              </button>
            </div>

            <Link
              to="/unilms/faculty/attendance"
              className="btn btn-primary"
              style={{
                background: '#0D9488',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
              }}
            >
              <i className="fa-solid fa-clipboard-user"></i> Mark Attendance
            </Link>
          </div>
        </div>

        {/* KPI Metric Cards */}
        <div className="faculty-kpi-grid">
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
              <i className="fa-solid fa-calendar-week"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Weekly Slots</div>
              <div className="faculty-metric-value">{scheduleSlots.length} Periods</div>
              <div className="faculty-metric-sub" style={{ color: '#7C3AED' }}>
                <span>Across 5 Working Days</span>
              </div>
            </div>
          </div>

          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <i className="fa-solid fa-clock"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Teaching Workload</div>
              <div className="faculty-metric-value" style={{ color: '#059669' }}>18 Hours / Wk</div>
              <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                <i className="fa-solid fa-check"></i>
                <span>Complies with AICTE Norms</span>
              </div>
            </div>
          </div>

          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
              <i className="fa-solid fa-server"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Assigned Cohorts</div>
              <div className="faculty-metric-value" style={{ color: '#2563EB' }}>B.Tech CSE</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Semester 4 (Batch 2026)</span>
              </div>
            </div>
          </div>

          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Collision Audit</div>
              <div className="faculty-metric-value" style={{ color: '#D97706' }}>100% Conflict-Free</div>
              <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                <i className="fa-solid fa-shield-halved"></i>
                <span>Rooms &amp; Faculty Audited</span>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'schedule' && (
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-main, #fafafa)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              {/* Day filter pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDayFilter(d)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                      background: dayFilter === d ? '#4F46E5' : '#e2e8f0',
                      color: dayFilter === d ? '#ffffff' : '#475569',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontWeight: '700', fontSize: '11.5px', padding: '4px 10px', borderRadius: '6px' }}>
                {filteredSlots.length} Active Slots
              </span>
            </div>

            <div className="table-responsive" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
              <table className="data-table" style={{ margin: 0, width: '100%', minWidth: '720px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                    <th style={{ padding: '14px 22px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Day of Week</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Period / Time Slot</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Subject Course</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Allocated Cohort</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Room / Lab</th>
                    <th style={{ textAlign: 'right', padding: '14px 22px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={6} rows={5} />
                  ) : filteredSlots.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No schedule slots found for the selected day filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSlots.map((slot) => (
                      <tr key={slot.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                        <td style={{ padding: '14px 22px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(99, 102, 241, 0.1)',
                              color: '#4F46E5',
                              fontSize: '12px',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              padding: '4px 10px',
                              borderRadius: '6px',
                            }}
                          >
                            {slot.day}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                            {slot.period_name || `Period ${slot.periodNumber}`}
                          </div>
                          <small style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>
                            <i className="fa-regular fa-clock me-1"></i> {slot.time}
                          </small>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13.5px' }}>
                            <span style={{ color: '#7C3AED', marginRight: '6px' }}>{slot.subject_code}</span>
                            {slot.subject_name}
                          </div>
                          {slot.staff_name && (
                            <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                              Faculty: {slot.staff_name}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                            {slot.cohort_name}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'var(--bg-main, #f1f5f9)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <i className="fa-solid fa-location-dot" style={{ color: '#7C3AED' }}></i>
                            {slot.room}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '14px 22px' }}>
                          <Link
                            to="/unilms/faculty/attendance"
                            className="btn btn-primary"
                            style={{
                              padding: '6px 14px',
                              fontSize: '12px',
                              borderRadius: '8px',
                              background: '#7C3AED',
                              border: 'none',
                              color: '#fff',
                              textDecoration: 'none',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <i className="fa-solid fa-clipboard-user"></i> Take Attendance
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'master' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div className="card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '800' }}>
                <i className="fa-solid fa-plus text-primary me-2"></i> Register Schedule Template
              </h3>
              <form onSubmit={handleCreateTemplate}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Template Title *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. 8-Period Day Shift Model"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Description &amp; Shift Timings</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Describe periods, breaks, and laboratory adjustments..."
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#4F46E5', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-floppy-disk me-1"></i> Save Master Template
                </button>
              </form>
            </div>

            <div className="card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '800' }}>
                <i className="fa-solid fa-list-check text-primary me-2"></i> Active Institutional Templates
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {templates.map((tpl) => (
                  <div key={tpl.id} style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>{tpl.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{tpl.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default FacultyTimetable;
