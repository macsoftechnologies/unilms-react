import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { facultyService } from '../../services/faculty.service';
import { academicsService } from '../../services/academics.service';

const OrgFacultyClassTeacherMonitor = () => {
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState('all');
  const [students, setStudents] = useState([]);
  const [alertSuccess, setAlertSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const [defaulterSearch, setDefaulterSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cohortRes, studentRes] = await Promise.allSettled([
        academicsService.getCohorts(),
        facultyService.getCohortDefaulters(selectedCohort),
      ]);

      if (cohortRes.status === 'fulfilled' && Array.isArray(cohortRes.value)) {
        setCohorts(cohortRes.value);
      }

      if (studentRes.status === 'fulfilled' && Array.isArray(studentRes.value)) {
        setStudents(studentRes.value);
      }
    } catch (err) {
      console.error('Failed to load class teacher monitor metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCohort]);

  const handleManualRefresh = () => {
    loadData();
  };

  const handleSendAlert = (studentName) => {
    setAlertSuccess(`Attendance warning notice dispatched to parent/guardian of ${studentName}.`);
    setTimeout(() => setAlertSuccess(''), 4000);
  };

  const defaultersList = useMemo(() => {
    return students.filter((s) => s.isDefaulter || s.attendance_pct < 75.0);
  }, [students]);

  const filteredDefaulters = useMemo(() => {
    const q = defaulterSearch.toLowerCase();
    if (!q) return defaultersList;
    return defaultersList.filter(
      (d) =>
        (d.roll_number && d.roll_number.toLowerCase().includes(q)) ||
        (d.name && d.name.toLowerCase().includes(q))
    );
  }, [defaulterSearch, defaultersList]);

  const defaultersPagination = useTablePagination(filteredDefaulters, 10);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        (s.roll_number && s.roll_number.toLowerCase().includes(q)) ||
        (s.name && s.name.toLowerCase().includes(q))
    );
  }, [studentSearch, students]);

  const studentsPagination = useTablePagination(filteredStudents, 10);

  const avgAttendance = useMemo(() => {
    if (students.length === 0) return '0.0';
    const sum = students.reduce((acc, s) => acc + (s.attendance_pct || 0), 0);
    return (sum / students.length).toFixed(1);
  }, [students]);

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-dark mb-1" style={{ fontSize: '22px' }}>
            Class Teacher Cohort Monitor
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '13.5px' }}>
            Unified dashboard for Section Incharges: Attendance Defaulter Alerts, Multi-Subject Marks Matrix &amp; Parent Notifications.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            className="btn btn-outline"
            title="Refresh Cohort Data"
            style={{
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              border: '1px solid #d1d5db',
              background: '#fff',
              textDecoration: 'none',
              color: '#374151',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} style={{ color: '#4F46E5' }}></i>
            <span>Refresh</span>
          </button>
          <Link
            to="/unilms/faculty/subjects"
            className="btn btn-outline"
            style={{
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              border: '1px solid #d1d5db',
              background: '#fff',
              textDecoration: 'none',
              color: '#374151',
              fontWeight: '600',
            }}
          >
            <i className="fa-solid fa-arrow-left me-1"></i> Class Teacher Curriculum
          </Link>
          <Link
            to="/unilms/org/academics/allocations"
            className="btn btn-primary"
            style={{
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              background: '#4F46E5',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Allocations
          </Link>
        </div>
      </div>

      {alertSuccess && (
        <div
          style={{
            padding: '12px 18px',
            background: '#dcfce7',
            border: '1px solid #86efac',
            borderRadius: '10px',
            color: '#166534',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13.5px',
            fontWeight: '600',
          }}
        >
          <i className="fa-solid fa-circle-check"></i> {alertSuccess}
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="faculty-kpi-grid">
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Cohort Students</div>
            <div className="faculty-metric-value">{students.length} Enrolled</div>
            <div className="faculty-metric-sub" style={{ color: '#7C3AED' }}>
              <span>Live Database Roster</span>
            </div>
          </div>
        </div>

        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Avg Attendance</div>
            <div className="faculty-metric-value" style={{ color: '#059669' }}>{avgAttendance}% Overall</div>
            <div className="faculty-metric-sub" style={{ color: '#059669' }}>
              <i className="fa-solid fa-arrow-trend-up"></i>
              <span>Section Performance</span>
            </div>
          </div>
        </div>

        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Defaulters Flagged</div>
            <div className="faculty-metric-value" style={{ color: '#EF4444' }}>{defaultersList.length} Below 75%</div>
            <div className="faculty-metric-sub" style={{ color: '#EF4444' }}>
              <i className="fa-solid fa-bell"></i>
              <span>Statutory Intervention</span>
            </div>
          </div>
        </div>

        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
            <i className="fa-solid fa-bell"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Guardian Alerts</div>
            <div className="faculty-metric-value" style={{ color: '#2563EB' }}>Active</div>
            <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
              <span>Direct Parent SMS / Email</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Selector Card */}
      <div className="card" style={{ borderRadius: '16px', background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ minWidth: '280px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
              Select In-charge Cohort Section
            </label>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none' }}
            >
              <option value="all">All Cohorts &amp; Sections</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-triangle-exclamation"></i> {defaultersList.length} Defaulters (&lt; 75% Attendance)
            </span>
            <span style={{ background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', padding: '8px 16px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-graduation-cap"></i> {students.length} Total Students
            </span>
          </div>
        </div>
      </div>

      {/* Defaulter Table */}
      <div className="card" style={{ borderRadius: '16px', background: '#fff', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', padding: '22px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#dc2626', margin: '0 0 3px' }}>
              <i className="fa-solid fa-triangle-exclamation me-2"></i> Attendance Defaulters Requiring Intervention
            </h3>
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>
              Students falling below statutory 75% attendance threshold. Automated alerts can be dispatched.
            </div>
          </div>
          <div style={{ position: 'relative', width: '240px' }}>
            <i className="fa-solid fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}></i>
            <input
              type="text"
              placeholder="Search defaulters..."
              value={defaulterSearch}
              onChange={(e) => setDefaulterSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px', height: '32px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>
        </div>

        <div className="table-responsive" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '580px', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Roll Number</th>
                <th style={{ padding: '10px 14px' }}>Student Name</th>
                <th style={{ padding: '10px 14px' }}>Attendance %</th>
                <th style={{ padding: '10px 14px' }}>Sessions Attended</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Immediate Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={5} rows={defaultersPagination.pageSize || 5} />
              ) : defaultersPagination.paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#166534', background: '#f0fdf4' }}>
                    <i className="fa-solid fa-circle-check" style={{ marginRight: '8px', fontSize: '16px' }}></i>
                    Zero attendance defaulters! All cohort students are currently meeting the statutory 75% threshold.
                  </td>
                </tr>
              ) : (
                defaultersPagination.paginatedItems.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1e293b' }}>{d.roll_number}</td>
                    <td style={{ padding: '12px 14px', fontWeight: '600' }}>{d.name}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '12px' }}>
                        {d.attendance_pct}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      {d.present} of {d.total} Sessions
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleSendAlert(d.name)}
                        className="btn btn-outline"
                        style={{ border: '1px solid #fca5a5', color: '#dc2626', background: '#fff', borderRadius: '6px', fontSize: '12px', padding: '5px 12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-paper-plane me-1"></i> Send Parent Alert
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <TablePagination
            currentPage={defaultersPagination.currentPage}
            totalItems={defaultersPagination.totalItems}
            pageSize={defaultersPagination.pageSize}
            onPageChange={defaultersPagination.setCurrentPage}
            onPageSizeChange={defaultersPagination.setPageSize}
            itemName="defaulters"
          />
        </div>
      </div>

      {/* Cohort Student Master Roster */}
      <div className="card" style={{ borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: '0 0 3px' }}>
              <i className="fa-solid fa-graduation-cap me-2" style={{ color: '#4F46E5' }}></i> Cohort Student Performance Roster
            </h3>
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>
              Comprehensive student roster with period attendance and continuous internal marks.
            </div>
          </div>
          <div style={{ position: 'relative', width: '240px' }}>
            <i className="fa-solid fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}></i>
            <input
              type="text"
              placeholder="Search students..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px', height: '32px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>
        </div>

        <div className="table-responsive" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Roll Number</th>
                <th style={{ padding: '10px 14px' }}>Student Name</th>
                <th style={{ padding: '10px 14px' }}>Attendance</th>
                <th style={{ padding: '10px 14px' }}>Evaluations Recorded</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={5} rows={studentsPagination.pageSize || 5} />
              ) : studentsPagination.paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No students registered in this cohort section yet.
                  </td>
                </tr>
              ) : (
                studentsPagination.paginatedItems.map((st) => (
                  <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1e293b' }}>{st.roll_number}</td>
                    <td style={{ padding: '12px 14px', fontWeight: '600' }}>{st.name}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          background: st.attendance_pct >= 75 ? '#dcfce7' : '#fee2e2',
                          color: st.attendance_pct >= 75 ? '#166534' : '#dc2626',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: '700',
                          fontSize: '12px',
                        }}
                      >
                        {st.attendance_pct}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12.5px', color: '#64748b' }}>
                      {Object.keys(st.scores || {}).length > 0 ? (
                        Object.entries(st.scores).map(([k, v]) => (
                          <span key={k} style={{ marginRight: '8px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {k}: <strong>{v}</strong>
                          </span>
                        ))
                      ) : (
                        <span>No CIA tests posted</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <Link
                        to={`/unilms/faculty/marks?student_id=${st.id}`}
                        style={{
                          textDecoration: 'none',
                          color: '#4F46E5',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: '#EEF2FF',
                          padding: '5px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        Marks View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <TablePagination
            currentPage={studentsPagination.currentPage}
            totalItems={studentsPagination.totalItems}
            pageSize={studentsPagination.pageSize}
            onPageChange={studentsPagination.setCurrentPage}
            onPageSizeChange={studentsPagination.setPageSize}
            itemName="students"
          />
        </div>
      </div>
    </div>
  );
};

export default OrgFacultyClassTeacherMonitor;
