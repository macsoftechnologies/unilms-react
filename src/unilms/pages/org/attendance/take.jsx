import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import studentsService from '../../../services/students.service';
import attendanceService from '../../../services/attendance.service';

const OrgAttendanceTake = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const subjectId = searchParams.get('subject');
  const sessionDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [students, setStudents] = useState([]);
  const [topicTaught, setTopicTaught] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await studentsService.getStudents();
      const list = (Array.isArray(res) ? res : []).map(s => ({
        id: s.id,
        roll_number: s.rollNumber || s.roll_number || 'STU-00',
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.user?.name || s.name || 'Student',
        sectionId: s.sectionId,
        status: 'PRESENT'
      }));
      setStudents(list);
    } catch (err) {
      console.error('Fetch students error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
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
    showToast('All students marked as Present.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (students.length === 0) {
      showToast('No students available to record attendance.');
      return;
    }

    const presentCount = students.filter(s => s.status === 'PRESENT').length;
    const absentCount = students.filter(s => s.status === 'ABSENT').length;
    const lateCount = students.filter(s => s.status === 'LATE').length;

    const confirmed = await confirm({
      title: 'Confirm Submit Classroom Register',
      message: `Commit period attendance for ${sessionDate}?`,
      details: [
        `Date of Session: ${sessionDate}`,
        `Breakdown: ${presentCount} Present • ${absentCount} Absent • ${lateCount} Late (${students.length} Total)`,
        `Session Topic: ${topicTaught || 'General Classroom Lecture'}`
      ],
      confirmText: 'Yes, Submit Register',
      variant: 'primary',
      icon: 'fa-solid fa-cloud-arrow-up'
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        sectionId: s.sectionId || undefined,
        subjectId: subjectId || undefined,
        date: sessionDate,
        status: s.status,
        remarks: topicTaught || undefined
      }));

      await attendanceService.markBatch({ records, date: sessionDate, subjectId: subjectId || undefined });
      showToast(`Classroom register saved! (${presentCount}/${students.length} present). Redirecting...`);
      setTimeout(() => navigate('/unilms/org/attendance'), 1200);
    } catch (err) {
      console.error('Submit attendance error:', err);
      showToast(err.response?.data?.message || 'Failed to submit attendance records.');
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
  } = useTablePagination(students, 10);

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
            <i className="fa-solid fa-user-check"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Live Classroom Attendance Register
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Date: <strong>{sessionDate}</strong> &bull; Record instant period attendance
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

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '20px', marginBottom: '24px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Topic Taught Today / Session Notes</label>
            <input 
              type="text" 
              value={topicTaught} 
              onChange={(e) => setTopicTaught(e.target.value)} 
              className="form-control" 
              placeholder="e.g. Microservices Orchestration & Docker Compose" 
              style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 12px' }}
            />
          </div>
        </div>

        <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ width: '120px', textAlign: 'center', padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase' }}>Roll No</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase' }}>Student Name</th>
                  <th style={{ width: '320px', textAlign: 'center', padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase' }}>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={3} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No students enrolled in this institution.
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
            <i className="fa-solid fa-cloud-arrow-up me-2"></i> {submitting ? 'Submitting to Database...' : 'Submit Classroom Attendance'}
          </button>
        </div>
      </form>
    </>
  );
};

export default OrgAttendanceTake;
