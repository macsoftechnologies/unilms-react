import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';
import attendanceService from '../../../services/attendance.service';

const OrgAttendanceFacultyDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const loadDashboardData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [subs, cohorts, attRes] = await Promise.allSettled([
        academicsService.getSubjects(),
        academicsService.getCohorts(),
        attendanceService.getRecords({ limit: 10 })
      ]);

      const subjectList = subs.status === 'fulfilled' && Array.isArray(subs.value) ? subs.value : [];
      const cohortList = cohorts.status === 'fulfilled' && Array.isArray(cohorts.value) ? cohorts.value : [];
      const rawRecords = attRes.status === 'fulfilled' && Array.isArray(attRes.value) ? attRes.value : [];

      // Map live subjects to courses
      const mappedCourses = subjectList.map((s, idx) => {
        const matchingCohort = cohortList.find(c => c.programId === s.programId) || cohortList[0];
        return {
          id: s.id || idx,
          subject_code: s.code,
          subject_name: s.name,
          cohort_name: matchingCohort?.name || 'All Cohorts',
          program_name: s.program?.name || ''
        };
      });
      setCourses(mappedCourses);

      // Map live attendance sessions
      const mappedSessions = rawRecords.map((r, idx) => ({
        id: r.id || idx,
        date: r.date ? new Date(r.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
        subject_name: r.subject?.name || r.subjectCode || 'Academic Lecture',
        cohort_name: r.cohort?.name || r.cohortName || 'Active Batch',
        topic_taught: r.remarks || r.topicTaught || 'Curriculum Lecture Session'
      }));
      setSessions(mappedSessions);
    } catch (err) {
      console.error('Failed to load faculty attendance dashboard:', err);
      setCourses([]);
      setSessions([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadDashboardData(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(sessions, 5);

  return (
    <>
      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
          <i className="fa-solid fa-circle-check"></i>
          {toastMsg}
        </div>
      )}

      <section className="view-section active">
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
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <i className="fa-solid fa-calendar-check"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Faculty Class Attendance Monitor
                </h2>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Teaching sessions, pending marks &amp; live student presentee rates &bull; AY 2026&ndash;2027
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/unilms/org/attendance" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', whiteSpace: 'nowrap' }}>
              <i className="fa-solid fa-arrow-left" style={{ color: '#059669' }}></i>
              <span>Attendance Hub</span>
            </Link>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {loading ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              <i className="fa-solid fa-spinner fa-spin me-2"></i> Loading allocated courses from PostgreSQL...
            </div>
          ) : courses.length === 0 ? (
            <div className="card" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1', background: 'var(--card-bg, #fff)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <i className="fa-solid fa-book-open me-2" style={{ fontSize: '24px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}></i>
              No course subjects allocated yet. Configure courses under <strong>Academics &rarr; Faculty Allocations</strong>.
            </div>
          ) : (
            courses.map(course => (
              <div key={course.id} className="card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontWeight: '800', fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                      {course.subject_code}
                    </span>
                    <h3 style={{ margin: '8px 0 0', fontSize: '15.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {course.subject_name}
                    </h3>
                  </div>
                </div>
                <div style={{ marginBottom: '18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <i className="fa-solid fa-users me-1" style={{ color: '#10B981' }}></i> Cohort: <strong>{course.cohort_name}</strong>
                </div>
                <Link
                  to="/unilms/org/attendance/take"
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontWeight: '700', borderRadius: '8px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', textDecoration: 'none' }}
                >
                  <i className="fa-solid fa-user-check"></i> Mark Attendance
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Recent Sessions Table */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main, #f8fafc)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Recent Sessions Conducted</h3>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Subject</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Cohort</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Topic Taught</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={5} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No recent sessions recorded in database.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {s.date}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: '#7C3AED' }}>
                        {s.subject_name}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px' }}>
                        {s.cohort_name}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {s.topic_taught}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => showToast(`Session roll log opened for ${s.subject_name}`)}
                          className="btn btn-outline"
                          style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-eye me-1"></i> View Log
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
            itemName="sessions"
          />
        </div>
      </section>
    </>
  );
};

export default OrgAttendanceFacultyDashboard;
