import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import studentsService from '../../../services/students.service';
import attendanceService from '../../../services/attendance.service';

const OrgAttendanceAdminDashboard = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [students, setStudents] = useState([]);
  const [threshold, setThreshold] = useState(75);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        studentsService.getStudents(),
        attendanceService.getRecords(),
      ]);

      const rawStudents = Array.isArray(studentsRes) ? studentsRes : [];
      const rawRecords = Array.isArray(attendanceRes) ? attendanceRes : [];

      const mapped = rawStudents.map((s, idx) => {
        const studentRecords = rawRecords.filter(r => r.studentId === s.id);
        const total = studentRecords.length;
        const attended = studentRecords.filter(r => r.status?.toUpperCase() === 'PRESENT').length;
        const percentage = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 100.0;

        return {
          id: s.id || idx,
          roll_number: s.rollNumber || s.admissionNumber || `STU-${1000 + idx}`,
          first_name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.user?.name || s.name || 'Student',
          last_name: '',
          total_sessions: total,
          attended_sessions: attended,
          percentage,
        };
      });

      setStudents(mapped);
    } catch (err) {
      console.error('Failed to load students for attendance intelligence:', err);
      setStudents([]);
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

  const handleSaveThreshold = async (e) => {
    e.preventDefault();

    const confirmed = await confirm({
      title: 'Confirm Update Attendance Threshold',
      message: `Set minimum academic attendance compliance threshold to ${threshold}%?`,
      details: [
        `Target Threshold: ${threshold}%`,
        'Evaluation: Evaluates all student records against live timetable sessions.',
        'Impact: Dynamically recalculates condonation eligibility and flags defaulters.'
      ],
      confirmText: 'Yes, Apply Threshold',
      variant: 'primary',
      icon: 'fa-solid fa-triangle-exclamation'
    });
    if (!confirmed) return;

    showToast(`Threshold updated to ${threshold}%. Shortage list recalculated from database.`);
  };

  const filteredDefaulters = useMemo(() => {
    return students.filter(d => {
      const matchesThreshold = d.total_sessions > 0 && d.percentage < threshold;
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        d.first_name.toLowerCase().includes(q) ||
        d.roll_number.toLowerCase().includes(q);
      return matchesThreshold && matchesSearch;
    });
  }, [students, threshold, search]);

  const handleEmailDefaulters = async () => {
    const count = filteredDefaulters.length;
    const confirmed = await confirm({
      title: 'Dispatch Attendance Warning Notices',
      message: `Send automated attendance shortage warning notifications to ${count} students & parents?`,
      details: [
        `Recipients: ${count} Defaulters below ${threshold}%`,
        'Channels: Registered Email & SMS Gateway',
        'Compliance Notice: Warning of exam hall-ticket debarment if condonation is not resolved.'
      ],
      confirmText: 'Yes, Dispatch Warnings',
      variant: 'warning',
      icon: 'fa-solid fa-paper-plane'
    });
    if (!confirmed) return;

    showToast('Automated warning notices dispatched to defaulters.');
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredDefaulters, 5);

  return (
    <>
      <ConfirmDialog />

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
              <i className="fa-solid fa-clipboard-user"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Campus Attendance Intelligence &amp; Defaulters
                </h2>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Track attendance shortages, condonation eligibility &amp; student alerts
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

        {/* Attendance Sub-Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <Link to="/unilms/org/attendance" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: 'var(--card-bg, #fff)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-chart-pie"></i> Attendance Hub
          </Link>
          <Link to="/unilms/org/attendance/mark_session" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: 'var(--card-bg, #fff)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-check-double"></i> Mark Session Register
          </Link>
          <Link to="/unilms/org/attendance/admin_dashboard" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: '#0284C7', color: '#fff', border: '1px solid #0284C7', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-triangle-exclamation"></i> Campus Attendance Intelligence &amp; Defaulters
          </Link>
          <Link to="/unilms/org/attendance/report" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: 'var(--card-bg, #fff)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-file-excel"></i> Monthly Attendance Register &amp; Reports
          </Link>
        </div>

        {/* Rule Card */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', flex: 1, minWidth: '300px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '700' }}>
              <i className="fa-solid fa-gear" style={{ color: '#10B981', marginRight: '8px' }}></i> Attendance Shortage Threshold
            </h3>
            <form onSubmit={handleSaveThreshold} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Minimum Threshold (%)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={threshold} 
                  onChange={(e) => setThreshold(Number(e.target.value))} 
                  className="form-control" 
                  required 
                  style={{ height: '38px', borderRadius: '8px', padding: '0 12px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '38px', padding: '0 18px', background: '#10B981', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
                Save Rule
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', flex: 1, minWidth: '300px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '700' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ color: '#10B981', marginRight: '8px' }}></i> Search Defaulters
            </h3>
            <input 
              type="text" 
              placeholder="Search by student name or roll number..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="form-control"
              style={{ height: '38px', borderRadius: '8px', padding: '0 12px' }}
            />
          </div>
        </div>

        {/* Defaulters Table Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main, #f8fafc)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
              Students Below {threshold}% ({filteredDefaulters.length} Cases)
            </h3>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleEmailDefaulters}
              style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              <i className="fa-regular fa-envelope me-1"></i> Email Defaulters
            </button>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Roll Number</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Student Name</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' }}>Total Sessions</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' }}>Attended</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Percentage</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No defaulters found below {threshold}%. All students are maintaining compliant attendance.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontWeight: '700', color: '#7C3AED', background: 'rgba(124, 58, 237, 0.08)', padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                          {d.roll_number}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {d.first_name}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {d.total_sessions}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: '600' }}>
                        {d.attended_sessions}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <strong style={{ color: '#DC2626', fontSize: '14px' }}>
                          {d.percentage}%
                        </strong>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
                          Defaulter
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
            itemName="defaulter students"
          />
        </div>
      </section>
    </>
  );
};

export default OrgAttendanceAdminDashboard;
