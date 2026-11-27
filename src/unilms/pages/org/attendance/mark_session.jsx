import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import studentsService from '../../../services/students.service';
import academicsService from '../../../services/academics.service';
import attendanceService from '../../../services/attendance.service';

const OrgAttendanceMarkSession = () => {
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [cohorts, setCohorts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [topicTaught, setTopicTaught] = useState('Operating System Kernels & CPU Process Scheduling');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [cohortsRes, subjectsRes, studentsRes] = await Promise.all([
        academicsService.getCohorts(),
        academicsService.getSubjects(),
        studentsService.getStudents(),
      ]);

      const cList = Array.isArray(cohortsRes) ? cohortsRes : [];
      const sList = Array.isArray(subjectsRes) ? subjectsRes : [];
      const stuList = Array.isArray(studentsRes) ? studentsRes : [];

      setCohorts(cList);
      setSubjects(sList);

      if (cList.length > 0) setSelectedCohortId(cList[0].id);
      if (sList.length > 0) setSelectedSubjectId(sList[0].id);

      const mappedStudents = stuList.map((s) => ({
        id: s.id,
        roll_number: s.rollNumber || s.roll_number || 'STU-00',
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.user?.name || s.name || 'Enrolled Student',
        sectionId: s.sectionId,
        cohortId: s.cohortId,
        status: 'PRESENT',
      }));
      setStudents(mappedStudents);
    } catch (err) {
      console.error('Failed to load session roll-call data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleStatusChange = (id, newStatus) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleMarkAllPresent = async () => {
    const confirmed = await confirm({
      title: 'Confirm Mark All Present',
      message: 'Set attendance status to PRESENT for all students in register?',
      details: `This will mark all ${students.length} students as Present for ${sessionDate}.`,
      confirmText: 'Yes, Mark All Present',
      variant: 'primary',
      icon: 'fa-solid fa-check-double'
    });
    if (!confirmed) return;

    setStudents(prev => prev.map(s => ({ ...s, status: 'PRESENT' })));
    showToast(`All ${students.length} students marked as Present.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (students.length === 0) {
      showToast('No students enrolled in this register.');
      return;
    }

    const presentCount = students.filter(s => s.status === 'PRESENT').length;
    const absentCount = students.filter(s => s.status === 'ABSENT').length;
    const lateCount = students.filter(s => s.status === 'LATE').length;
    const sub = subjects.find(s => s.id === selectedSubjectId);

    const confirmed = await confirm({
      title: 'Confirm Save Attendance Register',
      message: `Persist attendance session for ${sessionDate}?`,
      details: [
        `Subject: ${sub ? `${sub.code} - ${sub.name}` : 'Curriculum Course'}`,
        `Date of Session: ${sessionDate}`,
        `Attendance Breakdown: ${presentCount} Present • ${absentCount} Absent • ${lateCount} Late (${students.length} Total)`,
        `Topic Taught: ${topicTaught || 'General Lecture Session'}`
      ],
      confirmText: 'Yes, Commit Register to DB',
      variant: 'primary',
      icon: 'fa-solid fa-cloud-arrow-up'
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        sectionId: s.sectionId || undefined,
        subjectId: selectedSubjectId || undefined,
        date: sessionDate,
        status: s.status,
        remarks: topicTaught || undefined,
      }));

      await attendanceService.markBatch({
        date: sessionDate,
        subjectId: selectedSubjectId || undefined,
        records,
      });

      showToast(`Classroom attendance saved! (${presentCount}/${students.length} Present).`);
      setTimeout(() => navigate('/unilms/org/attendance'), 1200);
    } catch (err) {
      console.error('Failed to submit attendance records:', err);
      showToast('Error saving attendance: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(students, 6);

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
              <i className="fa-solid fa-check-double"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Mark Period Attendance Session
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Record classroom attendance, toggle present/absent &amp; sync with university records
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleMarkAllPresent}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-check-double text-success"></i>
              <span>Mark All Present</span>
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
          <Link to="/unilms/org/attendance/mark_session" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: '#0284C7', color: '#fff', border: '1px solid #0284C7', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-check-double"></i> Mark Session Register
          </Link>
          <Link to="/unilms/org/attendance/admin_dashboard" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: 'var(--card-bg, #fff)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-triangle-exclamation"></i> Campus Attendance Intelligence &amp; Defaulters
          </Link>
          <Link to="/unilms/org/attendance/report" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', background: 'var(--card-bg, #fff)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-file-excel"></i> Monthly Attendance Register &amp; Reports
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: '20px', marginBottom: '24px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Date of Session</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={sessionDate} 
                  onChange={(e) => setSessionDate(e.target.value)} 
                  required 
                  style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 12px' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Subject Course</label>
                <select
                  className="form-control"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 12px' }}
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Topic Taught / Notes</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={topicTaught} 
                  onChange={(e) => setTopicTaught(e.target.value)} 
                  placeholder="e.g. Distributed Process Synchronization" 
                  style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 12px' }}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main, #f8fafc)' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                <i className="fa-solid fa-users text-primary me-2" style={{ color: '#059669' }}></i> Enrolled Students Roster ({students.length} Total)
              </span>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: '700', fontSize: '11.5px', padding: '4px 10px', borderRadius: '6px' }}>
                Live Session Roster
              </span>
            </div>

            <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ width: '140px', textAlign: 'center', padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase' }}>Roll No</th>
                    <th style={{ padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase' }}>Student Name</th>
                    <th style={{ width: '320px', textAlign: 'center', padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase' }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={3} rows={pageSize || 6} />
                  ) : paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No enrolled students found in this institution.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ textAlign: 'center', padding: '14px 16px' }}>
                          <span style={{ fontWeight: '700', color: '#7C3AED', background: 'rgba(124, 58, 237, 0.08)', padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                            {s.roll_number}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700', padding: '14px 16px', color: 'var(--text-primary)' }}>
                          {s.name}
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 16px' }}>
                          <div style={{ display: 'inline-flex', gap: '4px', background: 'var(--bg-main, #f1f5f9)', padding: '3px', borderRadius: '8px' }}>
                            {[
                              { key: 'PRESENT', label: 'Present', color: '#10B981' },
                              { key: 'LATE', label: 'Late', color: '#F59E0B' },
                              { key: 'ABSENT', label: 'Absent', color: '#EF4444' }
                            ].map(item => {
                              const isSelected = s.status === item.key;
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => handleStatusChange(s.id, item.key)}
                                  style={{
                                    border: 'none',
                                    padding: '5px 14px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    background: isSelected ? item.color : 'transparent',
                                    color: isSelected ? '#fff' : 'var(--text-secondary)'
                                  }}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
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
              itemName="students"
            />
          </div>

          <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link
              to="/unilms/org/attendance"
              className="btn btn-outline"
              style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '700', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)' }}
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={submitting || students.length === 0}
              className="btn btn-primary" 
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none', padding: '12px 32px', fontSize: '15px', fontWeight: '700', borderRadius: '10px', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)' }}
            >
              <i className="fa-solid fa-cloud-arrow-up me-2"></i> {submitting ? 'Committing...' : 'Submit Session Register'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
};

export default OrgAttendanceMarkSession;
