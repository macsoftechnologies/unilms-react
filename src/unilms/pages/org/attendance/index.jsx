import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import attendanceService from '../../../services/attendance.service';
import academicsService from '../../../services/academics.service';

const OrgAttendanceIndex = () => {
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [cohorts, setCohorts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [telemetry, setTelemetry] = useState({ totalRecords: 0, presentCount: 0, absentCount: 0, lateCount: 0, attendanceRate: 0 });

  const [cohort, setCohort] = useState('');
  const [subject, setSubject] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const fetchMetadata = async () => {
    try {
      setLoading(true);
      const [cohortsData, subjectsData] = await Promise.all([
        academicsService.getCohorts(),
        academicsService.getSubjects()
      ]);
      setCohorts(Array.isArray(cohortsData) ? cohortsData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      if (Array.isArray(cohortsData) && cohortsData.length > 0) setCohort(cohortsData[0].id);
      if (Array.isArray(subjectsData) && subjectsData.length > 0) setSubject(subjectsData[0].id);
    } catch (err) {
      console.error('Fetch attendance metadata error:', err);
    } finally {
      setLoading(false);
    }
  };

  const pollTelemetryAndRecords = async () => {
    try {
      const [summary, recs] = await Promise.all([
        attendanceService.getSummary(sessionDate),
        attendanceService.getRecords({ date: sessionDate })
      ]);
      if (summary) setTelemetry(summary);
      setRecords(Array.isArray(recs) ? recs : []);
    } catch (err) {
      console.warn('Attendance telemetry poll error:', err.message);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Smart Polling Interval (every 12 seconds for live classroom sync, paused when tab hidden)
  useEffect(() => {
    pollTelemetryAndRecords();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        pollTelemetryAndRecords();
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [sessionDate]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!cohort || !subject) {
      showToast('Please select a Cohort and Subject.');
      return;
    }
    const cohortObj = cohorts.find(c => c.id === cohort);
    const subObj = subjects.find(s => s.id === subject);

    const confirmed = await confirm({
      title: 'Confirm Open Roll Call Register',
      message: `Open attendance register for ${subObj ? `${subObj.code} - ${subObj.name}` : 'Subject'}?`,
      details: [
        `Academic Cohort: ${cohortObj ? cohortObj.name : 'Selected Batch'}`,
        `Subject Course: ${subObj ? `${subObj.name} (${subObj.code})` : 'Operating system (CS111)'}`,
        `Session Date: ${sessionDate}`,
        'Action: Initializes live period roll-call matrix'
      ],
      confirmText: 'Yes, Open Register',
      variant: 'primary',
      icon: 'fa-solid fa-clipboard-user'
    });
    if (!confirmed) return;

    navigate(`/unilms/org/attendance/take?cohort=${cohort}&subject=${subject}&date=${sessionDate}`);
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(records, 10);

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
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
              }}
            >
              <i className="fa-solid fa-clipboard-user"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Attendance Tracker &amp; Live Telemetry
                </h2>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Real-time roll call registers, attendance compliance rates &amp; classroom logs
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              to="/unilms/org/attendance/mark_session"
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-check-double text-success"></i>
              <span>Mark Session Register</span>
            </Link>
            <Link
              to="/unilms/org/attendance/take"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-user-check"></i>
              <span>Take Live Attendance</span>
            </Link>
          </div>
        </div>

        {/* Attendance Sub-Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <Link to="/unilms/org/attendance" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: '#0284C7', color: '#fff', border: '1px solid #0284C7', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-chart-pie"></i> Attendance Hub
          </Link>
          <Link to="/unilms/org/attendance/mark_session" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: 'var(--card-bg, #fff)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-check-double"></i> Mark Session Register
          </Link>
          <Link to="/unilms/org/attendance/admin_dashboard" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: 'var(--card-bg, #fff)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-triangle-exclamation"></i> Campus Attendance Intelligence &amp; Defaulters
          </Link>
          <Link to="/unilms/org/attendance/report" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: 'var(--card-bg, #fff)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-file-excel"></i> Monthly Attendance Register &amp; Reports
          </Link>
        </div>

        {/* Live Telemetry KPI Cards */}
        {(() => {
          const rate = telemetry.attendanceRate ?? telemetry.students?.percentage ?? 0;
          const present = telemetry.presentCount ?? telemetry.students?.present ?? 0;
          const absent = telemetry.absentCount ?? telemetry.students?.absent ?? 0;
          const total = telemetry.totalRecords ?? telemetry.students?.total ?? 0;

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Attendance Rate</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#0284C7', marginTop: '4px' }}>{rate}%</div>
                  <div style={{ fontSize: '12px', color: '#10B981', marginTop: '2px', fontWeight: '600' }}>Live Synchronized</div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className="fa-solid fa-chart-line"></i>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Present Marks</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#10B981', marginTop: '4px' }}>{present}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Total on {sessionDate}</div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className="fa-solid fa-user-check"></i>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Absent Count</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#EF4444', marginTop: '4px' }}>{absent}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Requiring follow-up</div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className="fa-solid fa-user-xmark"></i>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total Enrolled</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#6366F1', marginTop: '4px' }}>{total}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Database entries</div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className="fa-solid fa-database"></i>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 2-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Create New Session Card */}
          <div>
            <div className="card" style={{ padding: '22px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
              <h2 style={{ marginTop: 0, fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
                Open Roll Call Register
              </h2>
              <form onSubmit={handleCreateSession}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>
                    Academic Cohort
                  </label>
                  <select
                    className="form-control"
                    required
                    value={cohort}
                    onChange={(e) => setCohort(e.target.value)}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 12px' }}
                  >
                    <option value="">Select Cohort</option>
                    {cohorts.map(c => {
                      const yearLabel = c.academicYear?.name || (typeof c.academicYear === 'string' ? c.academicYear : '');
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} {yearLabel ? `(${yearLabel})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>
                    Subject
                  </label>
                  <select
                    className="form-control"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 12px' }}
                  >
                    <option value="">Select Subject...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>
                    Session Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 12px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    fontWeight: '700', 
                    borderRadius: '10px', 
                    background: '#0284C7', 
                    border: 'none', 
                    color: '#fff', 
                    cursor: 'pointer', 
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px' 
                  }}
                >
                  <i className="fa-solid fa-clipboard-user"></i> Open Register &amp; Mark Attendance
                </button>
              </form>
            </div>
          </div>

          {/* Real Attendance Records Table Card */}
          <div>
            <div className="card" style={{ padding: '22px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
              <h2 style={{ marginTop: 0, fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
                Live Attendance Logs for {sessionDate}
              </h2>

              <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                      <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase' }}>STUDENT / STAFF</th>
                      <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase' }}>SUBJECT</th>
                      <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase' }}>DATE</th>
                      <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableSkeletonLoader columns={4} rows={pageSize || 5} />
                    ) : paginatedItems.length === 0 ? (
                      <tr><td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No attendance entries logged for this date yet. Open register on the left to mark roll call.</td></tr>
                    ) : (
                      paginatedItems.map((r) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                            {r.student?.user?.name || (r.student ? `${r.student.firstName} ${r.student.lastName || ''}`.trim() : '') || r.staff?.user?.name || (r.staff ? `${r.staff.firstName} ${r.staff.lastName || ''}`.trim() : '') || 'Academic Member'}
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{r.student?.rollNumber || r.staff?.employeeCode || ''}</div>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{r.subject?.name || 'General Session'}</td>
                          <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{r.date ? r.date.split('T')[0] : sessionDate}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              background: r.status?.toUpperCase() === 'PRESENT' ? 'rgba(16, 185, 129, 0.1)' : r.status?.toUpperCase() === 'LATE' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: r.status?.toUpperCase() === 'PRESENT' ? '#10B981' : r.status?.toUpperCase() === 'LATE' ? '#F59E0B' : '#EF4444'
                            }}>
                              {r.status}
                            </span>
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
                itemName="attendance logs"
              />
            </div>
          </div>

        </div>
      </section>
    </>
  );
};

export default OrgAttendanceIndex;
