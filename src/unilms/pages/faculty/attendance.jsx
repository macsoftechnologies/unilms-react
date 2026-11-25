import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { facultyService } from '../../services/faculty.service';
import { academicsService } from '../../services/academics.service';
import { studentsService } from '../../services/students.service';

const FacultyAttendance = () => {
  const [sessions, setSessions] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  const [cohort, setCohort] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [topicTaught, setTopicTaught] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Roll call modal state
  const [activeSessionForRoll, setActiveSessionForRoll] = useState(null);
  const [currentStudents, setCurrentStudents] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessRes, cohortRes, subRes, stRes] = await Promise.allSettled([
        facultyService.getSessions(),
        academicsService.getCohorts(),
        academicsService.getSubjects(),
        studentsService.getStudents(),
      ]);

      if (sessRes.status === 'fulfilled' && Array.isArray(sessRes.value)) {
        setSessions(
          sessRes.value.map((s) => ({
            id: s.id,
            date: new Date(s.sessionDate).toISOString().split('T')[0],
            cohort_name: s.cohortName,
            subject_code: s.subject?.code || 'SUB',
            subject_name: s.subject?.name || 'Course',
            topic_taught: s.topicTaught,
            present: s.presentStudents,
            total: s.totalStudents,
            status: s.status,
          }))
        );
      }

      if (cohortRes.status === 'fulfilled' && Array.isArray(cohortRes.value)) {
        setCohorts(cohortRes.value);
        if (cohortRes.value.length > 0 && !cohort) {
          setCohort(cohortRes.value[0].name);
        }
      }

      if (subRes.status === 'fulfilled' && Array.isArray(subRes.value)) {
        setSubjects(subRes.value);
        if (subRes.value.length > 0 && !subjectId) {
          setSubjectId(subRes.value[0].id);
        }
      }

      if (stRes.status === 'fulfilled' && Array.isArray(stRes.value)) {
        setStudents(
          stRes.value.map((st) => ({
            id: st.id,
            roll: st.rollNumber,
            name: `${st.firstName} ${st.lastName || ''}`.trim(),
            status: 'Present',
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedSessions,
    totalItems,
  } = useTablePagination(sessions, 5);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    const selSub = subjects.find((s) => s.id === subjectId) || subjects[0];
    if (!selSub) {
      alert('Please configure courses first.');
      return;
    }

    const newSession = {
      id: 'temp-' + Date.now(),
      date: sessionDate,
      cohort_name: cohort || 'General',
      subject_id: selSub.id,
      subject_code: selSub.code,
      subject_name: selSub.name,
      topic_taught: topicTaught.trim() || 'General Course Lecture',
      present: students.length,
      total: students.length,
      status: 'In Progress',
    };

    setCurrentStudents(
      students.map((st) => ({
        ...st,
        status: 'Present',
      }))
    );
    setActiveSessionForRoll(newSession);
  };

  const handleOpenRollCall = async (session) => {
    try {
      const full = await facultyService.getSessionById(session.id);
      if (full && full.attendances && full.attendances.length > 0) {
        setCurrentStudents(
          full.attendances.map((a) => ({
            id: a.student?.id || a.studentId,
            roll: a.student?.rollNumber || 'N/A',
            name: a.student ? `${a.student.firstName} ${a.student.lastName || ''}`.trim() : 'Student',
            status: a.status === 'PRESENT' ? 'Present' : a.status === 'LATE' ? 'Late' : 'Absent',
          }))
        );
      } else {
        setCurrentStudents(students);
      }
    } catch (e) {
      setCurrentStudents(students);
    }
    setActiveSessionForRoll(session);
  };

  const handleStatusChange = (stId, status) => {
    setCurrentStudents((prev) => prev.map((s) => (s.id === stId ? { ...s, status } : s)));
  };

  const markAllStudents = (status) => {
    setCurrentStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSaveRollCall = async (e) => {
    e.preventDefault();
    if (!activeSessionForRoll) return;

    try {
      const attendances = currentStudents.map((st) => ({
        studentId: st.id,
        status: st.status.toUpperCase(),
      }));

      // Get current staff profile ID or fallback
      const staffRes = await facultyService.getAllocations();
      const staffId = staffRes?.[0]?.staffId || activeSessionForRoll.staff_id;

      const payload = {
        staffId: staffId || '00000000-0000-0000-0000-000000000000',
        subjectId: activeSessionForRoll.subject_id || subjects[0]?.id,
        cohortName: activeSessionForRoll.cohort_name,
        sessionDate: activeSessionForRoll.date,
        topicTaught: activeSessionForRoll.topic_taught,
        attendances,
      };

      const saved = await facultyService.createSession(payload);
      showToast(`Attendance ledger saved for ${activeSessionForRoll.subject_code}!`);
      setActiveSessionForRoll(null);
      setTopicTaught('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save attendance ledger.');
    }
  };

  // Metrics
  const avgTurnout =
    sessions.length > 0
      ? (
          sessions.reduce((acc, s) => acc + (s.total > 0 ? (s.present / s.total) * 100 : 0), 0) /
          sessions.length
        ).toFixed(1)
      : '0.0';

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
            border: '1px solid var(--border-color)',
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
              <i className="fa-solid fa-clipboard-user"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Attendance Tracker
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Create classroom sessions, take real-time roll call, and track batch attendance metrics.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => showToast('Attendance Analytics Report Generated.')}
              className="btn btn-outline"
              style={{
                background: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <i className="fa-solid fa-chart-pie" style={{ color: '#7C3AED' }}></i>
              <span>View Reports</span>
            </button>
            <Link
              to="/unilms/faculty/dashboard"
              className="btn btn-outline"
              style={{
                background: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Workbench</span>
            </Link>
          </div>
        </div>

        <div className="faculty-kpi-grid">
          {/* Card 1: Total Sessions */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
              <i className="fa-solid fa-calendar-days"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Total Sessions</div>
              <div className="faculty-metric-value">{sessions.length} Recorded</div>
              <div className="faculty-metric-sub" style={{ color: '#7C3AED' }}>
                <span>Academic Semester Ledger</span>
              </div>
            </div>
          </div>

          {/* Card 2: Batch Attendance */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <i className="fa-solid fa-chart-line"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Batch Attendance</div>
              <div className="faculty-metric-value" style={{ color: '#059669' }}>{avgTurnout}% Avg</div>
              <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                <i className="fa-solid fa-arrow-trend-up"></i>
                <span>Classroom Turnout</span>
              </div>
            </div>
          </div>

          {/* Card 3: Active Courses */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
              <i className="fa-solid fa-book-open"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Active Courses</div>
              <div className="faculty-metric-value" style={{ color: '#2563EB' }}>{subjects.length} Subjects</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Allocated Teaching Load</span>
              </div>
            </div>
          </div>

          {/* Card 4: Enrolled Students */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Enrolled Roster</div>
              <div className="faculty-metric-value" style={{ color: '#D97706' }}>{students.length} Students</div>
              <div className="faculty-metric-sub" style={{ color: '#D97706' }}>
                <i className="fa-solid fa-id-card"></i>
                <span>Active Student Profiles</span>
              </div>
            </div>
          </div>
        </div>

        <div className="faculty-responsive-grid">
          {/* Create New Session Card */}
          <div style={{ minWidth: 0, maxWidth: '100%' }}>
            <div className="card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
              <h2 style={{ marginTop: 0, fontSize: '17px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-calendar-plus" style={{ color: '#7C3AED' }}></i> Create New Session
              </h2>
              <form onSubmit={handleCreateSession}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Class Cohort *</label>
                  <select
                    className="form-control"
                    required
                    value={cohort}
                    onChange={(e) => setCohort(e.target.value)}
                  >
                    {cohorts.length > 0 ? (
                      cohorts.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <option value="General Batch">General Batch</option>
                    )}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Subject Course *</label>
                  <select
                    className="form-control"
                    required
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                  >
                    {subjects.length > 0 ? (
                      subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} - {s.name}
                        </option>
                      ))
                    ) : (
                      <option value="">No subjects configured</option>
                    )}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Session Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Topic Taught</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Tree Traversal, Graph BFS..."
                    value={topicTaught}
                    onChange={(e) => setTopicTaught(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px 14px', fontWeight: '700', borderRadius: '10px', background: '#7C3AED', border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)', fontSize: '13.5px', whiteSpace: 'normal', lineHeight: '1.3', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <i className="fa-solid fa-clipboard-user"></i>
                  <span>Create Session &amp; Take Attendance</span>
                </button>
              </form>
            </div>
          </div>

          {/* Recent Sessions List */}
          <div style={{ minWidth: 0, maxWidth: '100%' }}>
            <div className="card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ color: '#7C3AED' }}></i> Recent Class Sessions
                </h2>
                <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}>
                  {sessions.length} Recorded
                </span>
              </div>

              <div className="table-responsive" style={{ width: '100%', maxWidth: '100%', minWidth: 0, border: '1px solid var(--border-color)', borderRadius: '10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', display: 'block', boxSizing: 'border-box' }}>
                <table className="data-table" style={{ width: '100%', minWidth: '660px', margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Cohort</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Subject &amp; Topic</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Attendance</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableSkeletonLoader columns={5} rows={pageSize || 5} />
                    ) : paginatedSessions.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          No class sessions recorded yet. Create one using the form on the left.
                        </td>
                      </tr>
                    ) : (
                      paginatedSessions.map((s) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '14px 16px', fontWeight: '600' }}>{s.date}</td>
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#4F46E5', background: 'rgba(99, 102, 241, 0.1)', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                              {s.cohort_name}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                              <span style={{ color: '#7C3AED', marginRight: '6px' }}>{s.subject_code}</span>
                              {s.subject_name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              Topic: {s.topic_taught}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: '700', color: '#059669', fontSize: '12.5px' }}>
                              {s.present}/{s.total} Present
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : 0}% Turnout
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', padding: '14px 16px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenRollCall(s)}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', background: '#7C3AED', border: 'none', color: '#fff', cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-pen me-1"></i> Edit Roll
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <TablePagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  itemName="class sessions"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Roll Call */}
        {activeSessionForRoll && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', boxSizing: 'border-box' }}>
            <div className="card" style={{ width: '100%', maxWidth: 'min(780px, calc(100vw - 20px))', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', background: 'var(--card-bg, #fff)', padding: '18px 14px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                    <i className="fa-solid fa-clipboard-user text-primary me-2"></i> Mark Attendance: {activeSessionForRoll.subject_code}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Cohort: {activeSessionForRoll.cohort_name} &bull; Date: {activeSessionForRoll.date}
                  </p>
                </div>
                <button
                  onClick={() => setActiveSessionForRoll(null)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  Student Roll Call Ledger ({currentStudents.length} Students)
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => markAllStudents('Present')}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px' }}
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => markAllStudents('Absent')}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px' }}
                  >
                    All Absent
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveRollCall}>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: '700' }}>Roll No</th>
                        <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: '700' }}>Student Name</th>
                        <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentStudents.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                            No students registered in this institution.
                          </td>
                        </tr>
                      ) : (
                        currentStudents.map((st) => (
                          <tr key={st.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '10px 14px', fontWeight: '600', fontSize: '13px' }}>{st.roll}</td>
                            <td style={{ padding: '10px 14px', fontSize: '13px' }}>{st.name}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                {['Present', 'Late', 'Absent'].map((mode) => (
                                  <button
                                    key={mode}
                                    type="button"
                                    onClick={() => handleStatusChange(st.id, mode)}
                                    style={{
                                      border: 'none',
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      background:
                                        st.status === mode
                                          ? mode === 'Present'
                                            ? '#059669'
                                            : mode === 'Late'
                                            ? '#D97706'
                                            : '#DC2626'
                                          : '#fff',
                                      color: st.status === mode ? '#fff' : 'var(--text-secondary)',
                                    }}
                                  >
                                    {mode}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveSessionForRoll(null)}
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', borderRadius: '8px', background: '#7C3AED', color: '#fff', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Save Attendance Ledger
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default FacultyAttendance;
