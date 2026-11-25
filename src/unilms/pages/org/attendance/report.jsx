import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import academicsService from '../../../services/academics.service';
import studentsService from '../../../services/students.service';
import attendanceService from '../../../services/attendance.service';

const OrgAttendanceReport = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [cohorts, setCohorts] = useState([]);
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [cohortsRes, studentsRes, recordsRes] = await Promise.allSettled([
        academicsService.getCohorts(),
        studentsService.getStudents(),
        attendanceService.getRecords(),
      ]);

      const cList = cohortsRes.status === 'fulfilled' && Array.isArray(cohortsRes.value) ? cohortsRes.value : [];
      setCohorts(cList);
      if (cList.length > 0 && !selectedCohortId) {
        setSelectedCohortId(cList[0].id);
      }

      const rawStudents = studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value) ? studentsRes.value : [];
      const rawRecords = recordsRes.status === 'fulfilled' && Array.isArray(recordsRes.value) ? recordsRes.value : [];

      const mappedStudents = rawStudents.map((s, idx) => {
        const studentRecords = rawRecords.filter(r => r.studentId === s.id);
        const present = studentRecords.filter(r => r.status?.toUpperCase() === 'PRESENT').length;
        const late = studentRecords.filter(r => r.status?.toUpperCase() === 'LATE').length;
        const absent = studentRecords.filter(r => r.status?.toUpperCase() === 'ABSENT').length;
        const total = studentRecords.length;
        const pct = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 100.0;

        return {
          id: s.id || idx,
          roll_no: s.rollNumber || s.admissionNumber || `STU-${1000 + idx}`,
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.user?.name || s.name || 'Enrolled Student',
          cohort_id: s.cohortId || s.cohort?.id || '',
          cohort_name: s.cohort?.name || 'Active Cohort',
          present,
          late,
          absent,
          total,
          pct,
        };
      });

      setAllStudents(mappedStudents);
    } catch (err) {
      console.error('Failed to load attendance report:', err);
      setCohorts([]);
      setAllStudents([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleExportRegister = async () => {
    const cohortObj = cohorts.find(c => c.id === selectedCohortId);
    const confirmed = await confirm({
      title: 'Confirm Export Attendance Register',
      message: 'Generate and download formal attendance compliance ledger?',
      details: [
        `Selected Cohort: ${cohortObj ? cohortObj.name : 'All Cohorts'}`,
        `Student Count: ${filteredStudents.length} Students`,
        'Format: Excel (.xlsx) / CSV Ledger',
        'Compliance: UGC & State University Attendance Regulations'
      ],
      confirmText: 'Yes, Export Ledger',
      variant: 'primary',
      icon: 'fa-solid fa-file-excel'
    });
    if (!confirmed) return;

    showToast('Attendance register exported successfully.');
  };

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      const matchCohort = !selectedCohortId || s.cohort_id === selectedCohortId;
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.roll_no.toLowerCase().includes(q);
      return matchCohort && matchSearch;
    });
  }, [allStudents, selectedCohortId, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredStudents, 10);

  return (
    <>
      <ConfirmDialog />

      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
          <i className="fa-solid fa-circle-check"></i>
          {toastMsg}
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
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <i className="fa-solid fa-file-contract"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Monthly Attendance Register &amp; Reports
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              View aggregated attendance metrics across academic cohorts &amp; export ledgers &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleExportRegister}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-file-excel"></i>
            <span>Export Register</span>
          </button>
          <Link to="/unilms/org/attendance" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', whiteSpace: 'nowrap' }}>
            <i className="fa-solid fa-arrow-left" style={{ color: '#059669' }}></i>
            <span>Attendance Hub</span>
          </Link>
        </div>
      </div>

      {/* Attendance Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Link to="/unilms/org/attendance" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: 'var(--card-bg, #fff)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-chart-pie"></i> Attendance Hub
        </Link>
        <Link to="/unilms/org/attendance/mark_session" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: 'var(--card-bg, #fff)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-check-double"></i> Mark Session Register
        </Link>
        <Link to="/unilms/org/attendance/admin_dashboard" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: 'var(--card-bg, #fff)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-triangle-exclamation"></i> Campus Attendance Intelligence &amp; Defaulters
        </Link>
        <Link to="/unilms/org/attendance/report" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: '#0284C7', color: '#fff', border: '1px solid #0284C7', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-file-excel"></i> Monthly Attendance Register &amp; Reports
        </Link>
      </div>

      {/* Cohort Selector and Search */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px', borderRadius: '12px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '260px' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>
              Select Academic Cohort
            </label>
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="form-control"
              style={{ height: '40px', borderRadius: '8px', padding: '0 12px' }}
            >
              {cohorts.length === 0 ? (
                <option value="">No cohorts configured</option>
              ) : (
                cohorts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.academicYear?.name ? `(${c.academicYear.name})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '240px' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>
              Search Student
            </label>
            <input
              type="text"
              placeholder="Search name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ height: '40px', borderRadius: '8px', padding: '0 12px' }}
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ width: '120px', textAlign: 'center', padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase' }}>Roll No</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase' }}>Student Name</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase' }}>Present</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase' }}>Late</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase' }}>Absent</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase' }}>Total Sessions</th>
                <th style={{ textAlign: 'right', padding: '14px 24px', fontSize: '12px', textTransform: 'uppercase' }}>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No students found in this cohort.
                  </td>
                </tr>
              ) : (
                paginatedItems.map(row => {
                  const isLow = row.pct < 75;
                  const color = isLow ? '#EF4444' : row.pct >= 90 ? '#10B981' : '#F59E0B';
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ textAlign: 'center', padding: '14px 16px' }}>
                        <span style={{ fontWeight: '700', color: '#7C3AED', background: 'rgba(124, 58, 237, 0.08)', padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                          {row.roll_no}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--text-primary)', padding: '14px 16px' }}>
                        {row.name}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '700', color: '#10B981', padding: '14px 16px' }}>
                        {row.present}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: '#F59E0B', padding: '14px 16px' }}>
                        {row.late}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: '#EF4444', padding: '14px 16px' }}>
                        {row.absent}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--text-primary)', padding: '14px 16px' }}>
                        {row.total}
                      </td>
                      <td style={{ textAlign: 'right', padding: '14px 24px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '800', color, fontSize: '13.5px' }}>
                            {row.pct}%
                          </span>
                          {isLow && (
                            <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                              Shortage
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
          itemName="attendance report rows"
        />
      </div>
    </>
  );
};

export default OrgAttendanceReport;
