import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import academicsService from '../../../services/academics.service';

const OrgTimetableIndex = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'master'
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Standard B.Tech Collegiate Schedule', description: 'Mon-Fri 7 periods + 2 break intervals (UGC standard)' },
    { id: 2, name: 'Postgraduate Research & Lab Timetable', description: 'Afternoon dedicated 3-hour laboratory & seminar slots' }
  ]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const fetchLiveSlots = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await academicsService.getTimetableSlots();
      if (Array.isArray(data) && data.length > 0) {
        setScheduleSlots(
          data.map((s) => ({
            id: s.id,
            day: s.day || s.dayOfWeek || 'Monday',
            period_name: s.period ? (s.period.name || `Period ${s.period.periodNumber}`) : 'Period 1',
            time: s.period ? `${s.period.startTime} - ${s.period.endTime}` : '09:00 AM - 10:00 AM',
            subject_code: s.subject?.code || 'GEN',
            subject_name: s.subject?.name || 'Academic Course',
            cohort_name: s.cohort?.name || s.section?.name || 'All Cohorts',
            room: s.room || 'Room 101',
          }))
        );
      } else {
        setScheduleSlots([]);
      }
    } catch (err) {
      console.warn('Failed to fetch timetable slots from backend:', err);
      setScheduleSlots([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSlots();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchLiveSlots(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const schedulePagination = useTablePagination(scheduleSlots, 5);
  const templatePagination = useTablePagination(templates, 5);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const confirmed = await confirm({
      title: 'Confirm Create Master Template',
      message: `Create schedule template "${newTemplateName.trim()}"?`,
      details: [
        `Template Name: ${newTemplateName.trim()}`,
        `Description: ${newTemplateDesc.trim() || 'Custom academic department schedule.'}`,
        'Scope: Master Schedule Grid & Automated Bell Setup'
      ],
      confirmText: 'Yes, Create Template',
      variant: 'primary',
      icon: 'fa-solid fa-table-cells'
    });
    if (!confirmed) return;

    const newT = {
      id: Date.now(),
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Custom academic department schedule.'
    };

    setTemplates(prev => [...prev, newT]);
    setNewTemplateName('');
    setNewTemplateDesc('');
    showToast(`Template "${newT.name}" created successfully!`);
  };

  return (
    <>
      <ConfirmDialog />

      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

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
              <i className="fa-solid fa-calendar-week"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Timetable &amp; Periods
                </h2>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Weekly lecture periods, practical laboratory slots, and master schedule configurations
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', background: 'var(--bg-main, #f1f5f9)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)', gap: '4px' }}>
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
                  color: activeTab === 'schedule' ? '#fff' : 'var(--text-secondary)'
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
                  color: activeTab === 'master' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                <i className="fa-solid fa-sliders me-1"></i> Master Templates
              </button>
            </div>
            <Link
              to="/unilms/org/timetable/builder"
              className="btn btn-outline"
              style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#7C3AED', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-grid-2"></i> Timetable Matrix Grid
            </Link>
            <Link
              to="/unilms/org/attendance"
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#fff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-clipboard-user"></i> Mark Attendance
            </Link>
          </div>
        </div>

        {activeTab === 'schedule' && (
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main, #fafafa)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                <i className="fa-solid fa-clock-rotate-left text-primary me-2" style={{ color: '#7C3AED' }}></i> Weekly Allocated Periods
              </span>
              <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontWeight: '700', fontSize: '11.5px', padding: '4px 10px', borderRadius: '6px' }}>
                {scheduleSlots.length} Active Slots / Week
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ margin: 0, width: '100%' }}>
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
                    <TableSkeletonLoader columns={6} rows={schedulePagination.pageSize || 5} />
                  ) : schedulePagination.paginatedItems.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No scheduled slots found in database.</td></tr>
                  ) : (
                    schedulePagination.paginatedItems.map((slot) => (
                      <tr key={slot.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 22px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '6px' }}>
                            {slot.day}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                            {slot.period_name}
                          </div>
                          <small style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>
                            <i className="fa-regular fa-clock me-1"></i> {slot.time}
                          </small>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13.5px' }}>
                            <span style={{ color: '#7C3AED', marginRight: '6px' }}>{slot.subject_code}:</span>
                            {slot.subject_name}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                            <i className="fa-solid fa-graduation-cap" style={{ color: '#7C3AED' }}></i>
                            {slot.cohort_name}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-door-open" style={{ color: '#059669' }}></i> {slot.room}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '14px 22px' }}>
                          <Link
                            to="/unilms/org/attendance"
                            className="btn btn-sm"
                            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: '700', fontSize: '11.5px', borderRadius: '8px', textDecoration: 'none', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <i className="fa-solid fa-check-to-slot"></i> Take Attendance
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={schedulePagination.currentPage}
              totalItems={schedulePagination.totalItems}
              pageSize={schedulePagination.pageSize}
              onPageChange={schedulePagination.setCurrentPage}
              onPageSizeChange={schedulePagination.setPageSize}
              itemName="allocated slots"
            />
          </div>
        )}

        {activeTab === 'master' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div>
              <div className="card" style={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', padding: '22px' }}>
                <h2 style={{ marginTop: 0, fontSize: '17px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-table-cells" style={{ color: '#7C3AED' }}></i> Master Schedule Templates
                </h2>
                <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table className="data-table" style={{ width: '100%' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                        <th style={{ padding: '12px 16px' }}>Template Name</th>
                        <th style={{ padding: '12px 16px' }}>Description</th>
                        <th style={{ textAlign: 'right', padding: '12px 16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <TableSkeletonLoader columns={3} rows={templatePagination.pageSize || 5} />
                      ) : templatePagination.paginatedItems.length === 0 ? (
                        <tr><td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No templates configured.</td></tr>
                      ) : (
                        templatePagination.paginatedItems.map(t => (
                          <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '14px 16px', fontWeight: '700', color: '#7C3AED' }}>{t.name}</td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{t.description}</td>
                            <td style={{ textAlign: 'right', padding: '14px 16px' }}>
                              <Link
                                to="/unilms/org/timetable/periods"
                                className="btn btn-primary"
                                style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', background: '#7C3AED', textDecoration: 'none', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                              >
                                <i className="fa-solid fa-clock me-1"></i> Setup Periods
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  currentPage={templatePagination.currentPage}
                  totalItems={templatePagination.totalItems}
                  pageSize={templatePagination.pageSize}
                  onPageChange={templatePagination.setCurrentPage}
                  onPageSizeChange={templatePagination.setPageSize}
                  itemName="schedule templates"
                />
              </div>
            </div>

            <div>
              <div className="card" style={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', padding: '22px' }}>
                <h2 style={{ marginTop: 0, fontSize: '17px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-plus-circle" style={{ color: '#7C3AED' }}></i> Create New Template
                </h2>
                <form onSubmit={handleCreateTemplate}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Template Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Standard B.Tech Schedule"
                      required
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Brief details about daily period duration, breaks..."
                      value={newTemplateDesc}
                      onChange={(e) => setNewTemplateDesc(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '10px', fontWeight: '700', borderRadius: '8px', background: '#7C3AED', border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }}
                  >
                    <i className="fa-solid fa-plus me-1"></i> Create Template
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgTimetableIndex;
