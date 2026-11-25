import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { facultyService } from '../../services/faculty.service';
import { leavesService } from '../../services/leaves.service';

const OrgFacultyDashboard = () => {
  const navigate = useNavigate();

  // Active persona: 'faculty' | 'class_teacher' | 'hod'
  const [activePersona, setActivePersona] = useState(() => {
    return localStorage.getItem('faculty_persona') || 'faculty';
  });

  const [loading, setLoading] = useState(false);
  const [defaulterStudents, setDefaulterStudents] = useState([]);
  const [deptFacultyWorkload, setDeptFacultyWorkload] = useState([]);
  const [stats, setStats] = useState({
    totalAllocations: 3,
    totalSessions: 3,
    syllabusDeliveryPct: 50.0,
    pendingLeaves: 1,
    totalFaculty: 5,
    defaultersCount: 0,
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [defaulterRes, allocRes, statsRes] = await Promise.allSettled([
        facultyService.getCohortDefaulters(),
        facultyService.getAllocations(),
        facultyService.getStats(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const s = statsRes.value.data || statsRes.value;
        setStats({
          totalAllocations: s.totalAllocations || 3,
          totalSessions: s.totalSessions || 3,
          syllabusDeliveryPct: Number(s.syllabusDeliveryPct) || 50.0,
          pendingLeaves: s.pendingLeaves || 0,
          totalFaculty: s.totalFaculty || 5,
          defaultersCount: s.defaultersCount || 0,
        });
      }

      if (defaulterRes.status === 'fulfilled' && Array.isArray(defaulterRes.value)) {
        const defaulters = defaulterRes.value
          .filter((s) => s.isDefaulter || s.attendance_pct < 75)
          .map((s) => ({
            id: s.id,
            roll: s.roll_number,
            name: s.name,
            attendance: s.attendance_pct,
          }));
        setDefaulterStudents(defaulters);
      }

      if (allocRes.status === 'fulfilled' && Array.isArray(allocRes.value)) {
        setDeptFacultyWorkload(
          allocRes.value.map((a) => ({
            id: a.id,
            name: a.staff ? `${a.staff.firstName} ${a.staff.lastName || ''}`.trim() : 'Faculty',
            course: `${a.subject?.code || 'SUB'} - ${a.subject?.name || 'Course'}`,
            batch: a.cohortName || 'General Cohort',
            covered: '75% (In Progress)',
            color: '#059669',
          }))
        );
      }
    } catch (e) {
      console.error('Failed to load faculty dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activePersona]);

  // 30s Background Sync Polling
  useEffect(() => {
    const timer = setInterval(() => {
      loadDashboardData();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const {
    currentPage: defaulterPage,
    setCurrentPage: setDefaulterPage,
    pageSize: defaulterSize,
    setPageSize: setDefaulterSize,
    paginatedItems: paginatedDefaulters,
    totalItems: totalDefaulters
  } = useTablePagination(defaulterStudents, 5);

  const {
    currentPage: workloadPage,
    setCurrentPage: setWorkloadPage,
    pageSize: workloadSize,
    setPageSize: setWorkloadSize,
    paginatedItems: paginatedWorkload,
    totalItems: totalWorkload
  } = useTablePagination(deptFacultyWorkload, 5);

  const facultyName = localStorage.getItem('org_user_name') || 'Faculty Member';
  const facultyEmail = localStorage.getItem('org_user_email') || '';

  // Dynamic Verified Faculty Privileges (Class Teacher, HOD)
  const [privileges, setPrivileges] = useState(() => {
    try {
      const cached = localStorage.getItem('unilms_privileges');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      isFaculty: true,
      isClassTeacher: false,
      isHOD: false,
      designation: 'Faculty Member',
      department: 'Computer Science & Engineering',
      employeeCode: 'FAC001',
      name: facultyName,
      assignedSections: []
    };
  });

  useEffect(() => {
    const fetchPrivs = async () => {
      try {
        const storedUser = localStorage.getItem('unilms_user');
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        const res = await facultyService.getPrivileges({
          email: parsed?.email || facultyEmail,
          staffId: parsed?.id
        });
        const privData = (res && res.isFaculty !== undefined) ? res : (res?.data || res);
        if (privData && privData.isFaculty !== undefined) {
          setPrivileges(privData);
          localStorage.setItem('unilms_privileges', JSON.stringify(privData));
          const currentP = localStorage.getItem('faculty_persona') || 'faculty';
          if (currentP === 'hod' && !privData.isHOD) {
            setActivePersona('faculty');
            localStorage.setItem('faculty_persona', 'faculty');
          } else if (currentP === 'class_teacher' && !privData.isClassTeacher) {
            setActivePersona('faculty');
            localStorage.setItem('faculty_persona', 'faculty');
          }
        }
      } catch (err) {
        console.warn('Failed to load faculty privileges on dashboard:', err);
      }
    };
    fetchPrivs();
  }, [facultyEmail]);

  const handlePersonaChange = (persona) => {
    if (persona === 'class_teacher' && !privileges.isClassTeacher) return;
    if (persona === 'hod' && !privileges.isHOD) return;
    setActivePersona(persona);
    localStorage.setItem('faculty_persona', persona);
    window.dispatchEvent(new Event('faculty_persona_changed'));
  };

  useEffect(() => {
    const handleStorage = () => {
      const p = localStorage.getItem('faculty_persona');
      if (p && p !== activePersona) {
        setActivePersona(p);
      }
    };
    window.addEventListener('faculty_persona_changed', handleStorage);
    return () => window.removeEventListener('faculty_persona_changed', handleStorage);
  }, [activePersona]);

  // Leave approval states for Class Teacher persona
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    let isMounted = true;
    leavesService.getLeaves({ status: 'pending' })
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : (res?.data || []);
        setLeaveRequests(list.map((l) => ({
          id: l.id,
          name: l.student ? `${l.student.firstName || ''} ${l.student.lastName || ''}`.trim() : (l.applicantName || 'Student'),
          roll: l.student?.rollNumber || l.rollNumber || 'UG-STU',
          type: l.leaveType || 'Leave Request',
          dates: `${l.startDate ? new Date(l.startDate).toLocaleDateString() : ''} - ${l.endDate ? new Date(l.endDate).toLocaleDateString() : ''}`,
          reason: l.reason || 'Leave requested',
          status: (l.status || 'pending').toLowerCase()
        })));
      })
      .catch(() => {
        if (isMounted) setLeaveRequests([]);
      });
    return () => { isMounted = false; };
  }, []);

  const handleLeaveAction = async (id, newStatus) => {
    try {
      await leavesService.updateLeaveStatus(id, newStatus);
    } catch {}
    setLeaveRequests(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  return (
    <div className="faculty-workbench-container" style={{ padding: '4px 0 24px 0' }}>
      <style>{`
        .persona-banner {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%);
          border-radius: 16px;
          padding: 18px 22px;
          color: #ffffff;
          margin-bottom: 20px;
          box-shadow: 0 10px 25px -8px rgba(79, 70, 229, 0.35);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }
        .persona-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
          background-size: 18px 18px;
          pointer-events: none;
        }
        .persona-switcher-wrapper {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .persona-switcher-label {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: #e0e7ff;
          letter-spacing: 0.5px;
          text-align: right;
        }
        .persona-pill-group {
          display: inline-flex;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 3px;
          border-radius: 12px;
          backdrop-filter: blur(8px);
          gap: 4px;
        }
        .persona-pill {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          color: #e0e7ff;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          background: transparent;
          border: none;
          transition: all 0.2s;
        }
        .persona-pill:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }
        .persona-pill.active {
          background: #ffffff;
          color: #312e81;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .faculty-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }
        @media (max-width: 1200px) {
          .faculty-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }
        @media (max-width: 580px) {
          .faculty-kpi-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
        .faculty-metric-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          min-width: 0;
        }
        .faculty-metric-card:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }
        .faculty-metric-icon {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .faculty-metric-card:hover .faculty-metric-icon {
          transform: scale(1.05);
        }
        .faculty-metric-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }
        .faculty-metric-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: var(--text-secondary, #64748b);
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .faculty-metric-value {
          font-size: 16px;
          font-weight: 800;
          line-height: 1.2;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
          letter-spacing: -0.2px;
          color: var(--text-primary, #1e293b);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .faculty-metric-sub {
          font-size: 10.5px;
          font-weight: 600;
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .workbench-grid {
          display: grid;
          grid-template-columns: 1.7fr 1.3fr;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .workbench-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        .subject-card {
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 14px;
          padding: 18px;
          background: var(--card-bg, #ffffff);
          transition: all 0.2s;
        }
        .subject-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }
        .subject-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .subject-action-btns {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tag-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .schedule-item {
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid var(--border-color, #e2e8f0);
          background: var(--card-bg, #ffffff);
          margin-bottom: 10px;
          transition: all 0.2s;
        }
        .schedule-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 3px 8px rgba(0,0,0,0.03);
        }
        .quick-links-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 768px) {
          .persona-banner {
            padding: 14px 14px !important;
            border-radius: 14px !important;
            margin-bottom: 16px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .persona-banner h1 {
            font-size: 18px !important;
            margin-bottom: 4px !important;
          }
          .persona-banner-details {
            font-size: 11.5px !important;
            gap: 6px !important;
          }
          .persona-switcher-wrapper {
            width: 100% !important;
            align-items: flex-start !important;
          }
          .persona-switcher-label {
            text-align: left !important;
            font-size: 10px !important;
            margin-bottom: 4px !important;
          }
          .persona-pill-group {
            width: 100% !important;
            display: flex !important;
            gap: 4px !important;
            padding: 3px !important;
            box-sizing: border-box !important;
          }
          .persona-pill {
            flex: 1 !important;
            justify-content: center !important;
            padding: 6px 4px !important;
            font-size: 11px !important;
            text-align: center !important;
            gap: 4px !important;
            white-space: nowrap !important;
          }
          .workbench-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .subject-card {
            padding: 12px 10px !important;
          }
          .subject-action-btns {
            width: 100% !important;
            margin-top: 4px !important;
          }
          .subject-action-btns .btn {
            flex: 1 !important;
            text-align: center !important;
            justify-content: center !important;
          }
        }
        @media (max-width: 480px) {
          .quick-links-grid {
            grid-template-columns: 1fr !important;
          }
          .faculty-workbench-container {
            padding-top: 0 !important;
          }
        }
      `}</style>

      {/* ======================================================== */}
      {/* TOP HERO & CONTEXTUAL ROLE / PERSONA SWITCHER            */}
      {/* ======================================================== */}
      <div className="persona-banner">
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#a5b4fc', marginBottom: '3px' }}>
            <i className="fa-solid fa-id-card-clip me-1"></i> Academic Leadership &amp; Instruction
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px', letterSpacing: '-0.3px', color: '#ffffff' }}>
            {privileges.name || facultyName}
          </h1>
          <div className="persona-banner-details" style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span><i className="fa-solid fa-graduation-cap me-1"></i> {privileges.designation || 'Faculty Member'}</span>
            <span>&bull;</span>
            <span><i className="fa-solid fa-building me-1"></i> {privileges.department || 'Computer Science & Engineering'}</span>
            <span>&bull;</span>
            <span><i className="fa-solid fa-hashtag me-1"></i> ID: {privileges.employeeCode || 'FAC001'}</span>
          </div>
        </div>

        {/* Active Context Status Indicator (Consolidated with Header Switcher) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            backdropFilter: 'blur(8px)'
          }}>
            <i className={`fa-solid ${activePersona === 'hod' ? 'fa-landmark' : activePersona === 'class_teacher' ? 'fa-users-rectangle' : 'fa-chalkboard-user'}`}></i>
            {activePersona === 'hod' ? 'HOD Department Desk' : activePersona === 'class_teacher' ? 'Class Teacher Monitor' : 'Faculty Workbench'}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PERSONA 1: COURSE FACULTY WORKBENCH                      */}
      {/* ======================================================== */}
      {activePersona === 'faculty' && (
        <>
          {/* Faculty KPIs matching Reference Image 8 */}
          <div className="faculty-kpi-grid">
            {/* Card 1: ALLOCATED COURSES */}
            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                <i className="fa-solid fa-book-bookmark"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">ALLOCATED COURSES</div>
                <div className="faculty-metric-value">{stats.totalAllocations} Subjects</div>
                <div className="faculty-metric-sub" style={{ color: '#7C3AED' }}>
                  <span>Active Teaching Load</span>
                </div>
              </div>
            </div>

            {/* Card 2: CONDUCTED SESSIONS */}
            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                <i className="fa-solid fa-clock"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">CONDUCTED SESSIONS</div>
                <div className="faculty-metric-value" style={{ color: '#059669' }}>{stats.totalSessions} Lectures</div>
                <div className="faculty-metric-sub" style={{ color: 'var(--text-muted, #64748b)' }}>
                  <span>Complies with AICTE Norms</span>
                </div>
              </div>
            </div>

            {/* Card 3: TARGET COHORTS */}
            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
                <i className="fa-solid fa-users"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">TARGET COHORTS</div>
                <div className="faculty-metric-value" style={{ color: '#2563EB' }}>B.Tech CSE - Sem 4</div>
                <div className="faculty-metric-sub" style={{ color: 'var(--text-muted, #64748b)' }}>
                  <span>Section A (60 Students)</span>
                </div>
              </div>
            </div>

            {/* Card 4: SYLLABUS DELIVERY */}
            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
                <i className="fa-solid fa-award"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">SYLLABUS DELIVERY</div>
                <div className="faculty-metric-value" style={{ color: '#D97706' }}>{stats.syllabusDeliveryPct}% Met</div>
                <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>NBA Target On Track</span>
                </div>
              </div>
            </div>
          </div>

          {/* Workbench Grid: Left subjects & evals, Right schedule & shortcuts */}
          <div className="workbench-grid">
            {/* Left Column */}
            <div>
              {/* Teaching Allocations Card */}
              <div className="card" style={{ borderRadius: '16px', marginBottom: '24px', background: '#ffffff', border: '1px solid var(--border-color, #e2e8f0)', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '14px' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                      <i className="fa-solid fa-book-open" style={{ color: '#4f46e5' }}></i> My Teaching Allocations &amp; Active Pedagogies
                    </h2>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', marginTop: '3px' }}>
                      Manage syllabus, modular lesson plans, and NBA course outcome rubrics
                    </div>
                  </div>
                  <Link to="/unilms/faculty/subjects" className="btn btn-primary" style={{ fontSize: '12px', padding: '7px 16px', borderRadius: '10px', background: '#4F46E5', color: '#fff', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    All Subjects <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Subject 1: CS402 */}
                  <div className="subject-card" style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>
                    <div className="subject-header-row">
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b21a8', background: '#ede9fe', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          CS402 &bull; 4.00 CREDITS
                        </span>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', margin: '8px 0 3px' }}>
                          Cloud Architecture &amp; DevOps Microservices
                        </h3>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)' }}>
                          B.Tech CSE - Semester 4 &bull; 4 Course Outcomes (CO1-CO4)
                        </div>
                      </div>
                      <div className="subject-action-btns">
                        <Link to="/unilms/faculty/attendance" className="btn btn-outline" style={{ fontSize: '11.5px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', textDecoration: 'none', fontWeight: '600' }} title="Mark Attendance">
                          <i className="fa-solid fa-clipboard-user me-1 text-primary"></i> Attendance
                        </Link>
                        <Link to="/unilms/faculty/assignments" className="btn btn-outline" style={{ fontSize: '11.5px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', textDecoration: 'none', fontWeight: '600' }} title="Assessments">
                          <i className="fa-solid fa-file-pen me-1 text-warning"></i> Tasks
                        </Link>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #e9d5ff' }}>
                      <span className="tag-pill" style={{ color: '#0284c7', background: '#e0f2fe' }}>
                        <i className="fa-solid fa-users"></i> Peer Learning
                      </span>
                      <span className="tag-pill" style={{ color: '#059669', background: '#dcfce7' }}>
                        <i className="fa-solid fa-diagram-project"></i> Project-Based (PBL)
                      </span>
                      <span className="tag-pill" style={{ color: '#d97706', background: '#fef3c7' }}>
                        <i className="fa-solid fa-lightbulb"></i> Problem Solving
                      </span>
                      <span className="tag-pill" style={{ color: '#7c3aed', background: '#ede9fe' }}>
                        <i className="fa-solid fa-chalkboard"></i> Blended Learning
                      </span>
                    </div>
                  </div>

                  {/* Subject 2: CS401 */}
                  <div className="subject-card" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                    <div className="subject-header-row">
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', background: '#e0f2fe', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          CS401 &bull; 4.00 CREDITS
                        </span>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', margin: '8px 0 3px' }}>
                          Advanced Algorithms &amp; System Design
                        </h3>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)' }}>
                          B.Tech CSE - Semester 4 &bull; 4 Course Outcomes (CO1-CO4)
                        </div>
                      </div>
                      <div className="subject-action-btns">
                        <Link to="/unilms/faculty/attendance" className="btn btn-outline" style={{ fontSize: '11.5px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', textDecoration: 'none', fontWeight: '600' }}>
                          <i className="fa-solid fa-clipboard-user me-1 text-primary"></i> Attendance
                        </Link>
                        <Link to="/unilms/faculty/assignments" className="btn btn-outline" style={{ fontSize: '11.5px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', textDecoration: 'none', fontWeight: '600' }}>
                          <i className="fa-solid fa-file-pen me-1 text-warning"></i> Tasks
                        </Link>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #bae6fd' }}>
                      <span className="tag-pill" style={{ color: '#d97706', background: '#fef3c7' }}>
                        <i className="fa-solid fa-lightbulb"></i> Problem Solving
                      </span>
                      <span className="tag-pill" style={{ color: '#0284c7', background: '#e0f2fe' }}>
                        <i className="fa-solid fa-rotate"></i> Flipped Classroom
                      </span>
                      <span className="tag-pill" style={{ color: '#7c3aed', background: '#ede9fe' }}>
                        <i className="fa-solid fa-trophy"></i> Hackathon Prep
                      </span>
                    </div>
                  </div>

                  {/* Subject 3: CS403 */}
                  <div className="subject-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <div className="subject-header-row">
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          CS403 &bull; 3.00 CREDITS
                        </span>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', margin: '8px 0 3px' }}>
                          Database Management Systems &amp; NoSQL
                        </h3>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)' }}>
                          B.Tech CSE - Semester 4 &bull; 4 Course Outcomes (CO1-CO4)
                        </div>
                      </div>
                      <div className="subject-action-btns">
                        <Link to="/unilms/faculty/attendance" className="btn btn-outline" style={{ fontSize: '11.5px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', textDecoration: 'none', fontWeight: '600' }}>
                          <i className="fa-solid fa-clipboard-user me-1 text-primary"></i> Attendance
                        </Link>
                        <Link to="/unilms/faculty/assignments" className="btn btn-outline" style={{ fontSize: '11.5px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', textDecoration: 'none', fontWeight: '600' }}>
                          <i className="fa-solid fa-file-pen me-1 text-warning"></i> Tasks
                        </Link>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #bbf7d0' }}>
                      <span className="tag-pill" style={{ color: '#059669', background: '#dcfce7' }}>
                        <i className="fa-solid fa-diagram-project"></i> Project-Based (PBL)
                      </span>
                      <span className="tag-pill" style={{ color: '#0284c7', background: '#e0f2fe' }}>
                        <i className="fa-solid fa-comments"></i> Peer Review
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Continuous Evaluation Card */}
              <div className="card" style={{ borderRadius: '16px', background: '#ffffff', border: '1px solid var(--border-color, #e2e8f0)', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '12px' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                    <i className="fa-solid fa-list-check" style={{ color: '#f59e0b' }}></i> Continuous Evaluation &amp; Rubric Grading
                  </h2>
                  <Link to="/unilms/faculty/marks" style={{ fontSize: '12.5px', color: '#4F46E5', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Evaluation Desk <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ textAlign: 'center', padding: '24px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '28px', color: '#6366f1', marginBottom: '8px' }}>
                      <i className="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b', marginBottom: '4px' }}>
                      Course Continuous Evaluation Desk
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', maxWidth: '420px', margin: '0 auto 12px' }}>
                      Record subject-wise assignment rubric scores, mid-term evaluations, and track Course Outcome (CO) attainment across enrolled cohorts.
                    </div>
                    <Link to="/unilms/faculty/marks" className="btn btn-sm" style={{ background: '#4F46E5', color: '#fff', padding: '6px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-pen-to-square"></i> Open Marks Evaluation Desk
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Today's Schedule Card */}
              <div className="card" style={{ borderRadius: '16px', marginBottom: '24px', background: '#ffffff', border: '1px solid var(--border-color, #e2e8f0)', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '12px' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                    <i className="fa-solid fa-clock" style={{ color: '#0ea5e9' }}></i> Today's Schedule (Wednesday)
                  </h2>
                  <Link to="/unilms/faculty/timetable" style={{ fontSize: '12.5px', color: '#4F46E5', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Weekly Timetable <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Period 2 */}
                  <div className="schedule-item" style={{ background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#4f46e5' }}>
                      <span>Period 2 (10:00 AM - 11:00 AM)</span>
                      <span style={{ color: '#64748b', fontWeight: '600' }}><i className="fa-solid fa-location-dot me-1"></i> Lecture Hall 101</span>
                    </div>
                    <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#1f2937', marginTop: '4px' }}>
                      Advanced Algorithms &amp; System Design
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>B.Tech CSE - Section A</span>
                      <Link to="/unilms/faculty/attendance" className="btn btn-primary" style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '8px', background: '#4F46E5', color: '#ffffff', textDecoration: 'none', fontWeight: '600' }}>
                        <i className="fa-solid fa-clipboard-user me-1"></i> Mark Attendance
                      </Link>
                    </div>
                  </div>

                  {/* Period 4 */}
                  <div className="schedule-item" style={{ background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#4f46e5' }}>
                      <span>Period 4 (02:00 PM - 03:00 PM)</span>
                      <span style={{ color: '#64748b', fontWeight: '600' }}><i className="fa-solid fa-location-dot me-1"></i> Cloud Lab 402</span>
                    </div>
                    <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#1f2937', marginTop: '4px' }}>
                      Cloud Architecture &amp; DevOps Microservices
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>B.Tech CSE - Section A</span>
                      <Link to="/unilms/faculty/attendance" className="btn btn-primary" style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '8px', background: '#4F46E5', color: '#ffffff', textDecoration: 'none', fontWeight: '600' }}>
                        <i className="fa-solid fa-clipboard-user me-1"></i> Mark Attendance
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links Card */}
              <div className="card" style={{ borderRadius: '16px', background: '#ffffff', border: '1px solid var(--border-color, #e2e8f0)', padding: '22px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 14px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '12px', color: '#1e293b' }}>
                  <i className="fa-solid fa-bolt me-1" style={{ color: '#f59e0b' }}></i> Teaching Suite Quick Links
                </h2>
                <div className="quick-links-grid">
                  <Link to="/unilms/faculty/attendance" className="btn btn-outline" style={{ fontSize: '12px', padding: '12px', justifyContent: 'flex-start', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', textDecoration: 'none', color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-clipboard-user me-2" style={{ color: '#10b981', fontSize: '15px' }}></i> Mark Attendance
                  </Link>
                  <Link to="/unilms/faculty/assignments" className="btn btn-outline" style={{ fontSize: '12px', padding: '12px', justifyContent: 'flex-start', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', textDecoration: 'none', color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-plus-circle me-2" style={{ color: '#4F46E5', fontSize: '15px' }}></i> New Assignment
                  </Link>
                  <Link to="/unilms/faculty/materials" className="btn btn-outline" style={{ fontSize: '12px', padding: '12px', justifyContent: 'flex-start', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', textDecoration: 'none', color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-file-pdf me-2" style={{ color: '#ef4444', fontSize: '15px' }}></i> Upload Lecture PDF
                  </Link>
                  <Link to="/unilms/faculty/co_po_matrix" className="btn btn-outline" style={{ fontSize: '12px', padding: '12px', justifyContent: 'flex-start', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', textDecoration: 'none', color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-chart-line me-2" style={{ color: '#8b5cf6', fontSize: '15px' }}></i> CO-PO Mapping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* PERSONA 2: CLASS TEACHER MONITOR                         */}
      {/* ======================================================== */}
      {activePersona === 'class_teacher' && (
        <>
          {/* Class Teacher KPIs matching Reference Image 9 */}
          <div className="faculty-kpi-grid">
            {/* Card 1: CLASS TEACHER SECTION */}
            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                <i className="fa-solid fa-users"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">CLASS TEACHER SECTION</div>
                <div className="faculty-metric-value">CSE - 4th Sem (A)</div>
                <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                  <span>60 Enrolled Undergraduates</span>
                </div>
              </div>
            </div>

            {/* Card 2: CUMULATIVE ATTENDANCE */}
            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                <i className="fa-solid fa-chart-pie"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">CUMULATIVE ATTENDANCE</div>
                <div className="faculty-metric-value" style={{ color: '#7C3AED' }}>89.4% Avg</div>
                <div className="faculty-metric-sub" style={{ color: 'var(--text-muted, #64748b)' }}>
                  <span>Across All 5 Semester Subjects</span>
                </div>
              </div>
            </div>

            {/* Card 3: DEFAULTERS WATCHLIST */}
            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">DEFAULTERS WATCHLIST</div>
                <div className="faculty-metric-value" style={{ color: '#EF4444' }}>2 Students</div>
                <div className="faculty-metric-sub" style={{ color: '#EF4444' }}>
                  <span>Below 75% Exam Eligibility</span>
                </div>
              </div>
            </div>

            {/* Card 4: PENDING LEAVES & OD */}
            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
                <i className="fa-solid fa-envelope-open-text"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">PENDING LEAVES &amp; OD</div>
                <div className="faculty-metric-value" style={{ color: '#D97706' }}>2 Requests</div>
                <div className="faculty-metric-sub" style={{ color: 'var(--text-muted, #64748b)' }}>
                  <span>Awaiting Proctor Approval</span>
                </div>
              </div>
            </div>
          </div>

          <div className="workbench-grid">
            {/* Left: Defaulters */}
            <div>
              <div className="card" style={{ borderRadius: '16px', marginBottom: '24px', background: '#ffffff', border: '1px solid var(--border-color, #e2e8f0)', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-triangle-exclamation"></i> Cumulative Attendance Defaulters (&lt; 75%)
                    </h2>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Aggregate attendance across all 5 semester subjects</div>
                  </div>
                  <Link to="/unilms/faculty/class_teacher_monitor" className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', textDecoration: 'none', color: '#374151', fontWeight: '600' }}>
                    Detailed Cohort Monitor <i className="fa-solid fa-arrow-right ms-1"></i>
                  </Link>
                </div>

                <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Roll No</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Student Name</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Attendance</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <TableSkeletonLoader columns={4} rows={defaulterSize || 3} />
                      ) : paginatedDefaulters.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                            No attendance defaulters found.
                          </td>
                        </tr>
                      ) : (
                        paginatedDefaulters.map(st => (
                          <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: '700' }}>{st.roll}</td>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{st.name}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>{st.attendance}%</span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button type="button" onClick={() => alert(`Notice sent to guardian of ${st.name}`)} style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}>
                                <i className="fa-solid fa-bell me-1"></i> Send Parent Alert
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <TablePagination
                    currentPage={defaulterPage}
                    totalItems={totalDefaulters}
                    pageSize={defaulterSize}
                    onPageChange={setDefaulterPage}
                    onPageSizeChange={setDefaulterSize}
                    itemName="defaulter students"
                  />
                </div>
              </div>
            </div>

            {/* Right: Leave requests & notes */}
            <div>
              <div className="card" style={{ borderRadius: '16px', background: '#ffffff', border: '1px solid var(--border-color, #e2e8f0)', padding: '22px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 14px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                  <i className="fa-solid fa-envelope-open-text" style={{ color: '#f59e0b' }}></i> Pending Leave / OD Approvals
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {leaveRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
                      <i className="fa-solid fa-circle-check text-success me-1"></i> No pending leave or on-duty requests from class cohort.
                    </div>
                  ) : (
                    leaveRequests.map(req => (
                    <div key={req.id} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: req.status === 'approved' ? '#f0fdf4' : req.status === 'declined' ? '#fef2f2' : '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#1e293b' }}>{req.name} ({req.roll})</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '10px' }}>{req.type}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}><i className="fa-solid fa-calendar me-1"></i> {req.dates}</div>
                      <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px' }}>{req.reason}</div>
                      
                      {req.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => handleLeaveAction(req.id, 'approved')} style={{ flex: 1, padding: '5px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            <i className="fa-solid fa-check me-1"></i> Approve
                          </button>
                          <button type="button" onClick={() => handleLeaveAction(req.id, 'declined')} style={{ flex: 1, padding: '5px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            <i className="fa-solid fa-xmark me-1"></i> Decline
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: '700', color: req.status === 'approved' ? '#15803d' : '#b91c1c' }}>
                          Status: {req.status === 'approved' ? '✓ Approved' : '✗ Declined'}
                        </div>
                      )}
                    </div>
                  )))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* PERSONA 3: HOD DESK                                      */}
      {/* ======================================================== */}
      {activePersona === 'hod' && (
        <>
          {/* HOD KPIs matching Reference Image 7 */}
          <div className="faculty-kpi-grid">
            {/* Card 1: Department Faculty */}
            <div className="faculty-metric-card" style={{ borderLeft: '3.5px solid #0D9488' }}>
              <div className="faculty-metric-info" style={{ width: '100%' }}>
                <div className="faculty-metric-label">DEPARTMENT FACULTY</div>
                <div className="faculty-metric-value" style={{ color: '#0D9488' }}>18 Professors</div>
                <div className="faculty-metric-sub" style={{ color: 'var(--text-muted, #64748b)' }}>
                  <span>Computer Science &amp; Engg</span>
                </div>
              </div>
            </div>

            {/* Card 2: NBA OBE Attainment */}
            <div className="faculty-metric-card" style={{ borderLeft: '3.5px solid #10B981' }}>
              <div className="faculty-metric-info" style={{ width: '100%' }}>
                <div className="faculty-metric-label">NBA OBE ATTAINMENT</div>
                <div className="faculty-metric-value">94.2%</div>
                <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                  <i className="fa-solid fa-arrow-trend-up"></i>
                  <span>Accreditation Target Met</span>
                </div>
              </div>
            </div>

            {/* Card 3: Active Courses */}
            <div className="faculty-metric-card" style={{ borderLeft: '3.5px solid #0284C7' }}>
              <div className="faculty-metric-info" style={{ width: '100%' }}>
                <div className="faculty-metric-label">ACTIVE COURSES</div>
                <div className="faculty-metric-value" style={{ color: '#0284C7' }}>24 Subjects</div>
                <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                  <i className="fa-solid fa-check"></i>
                  <span>All 100% Allocated</span>
                </div>
              </div>
            </div>

            {/* Card 4: Lab Occupancy */}
            <div className="faculty-metric-card" style={{ borderLeft: '3.5px solid #F59E0B' }}>
              <div className="faculty-metric-info" style={{ width: '100%' }}>
                <div className="faculty-metric-label">LAB OCCUPANCY</div>
                <div className="faculty-metric-value" style={{ color: '#D97706' }}>88.4%</div>
                <div className="faculty-metric-sub" style={{ color: 'var(--text-muted, #64748b)' }}>
                  <span>AI, Cloud &amp; Networks Labs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="workbench-grid">
            <div>
              <div className="card" style={{ borderRadius: '16px', marginBottom: '24px', background: '#ffffff', border: '1px solid var(--border-color, #e2e8f0)', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '12px' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-network-wired" style={{ color: '#4F46E5' }}></i> Department Workload &amp; Faculty Allocations
                  </h2>
                  <Link to="/unilms/org/academics/allocations" className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: '#4F46E5', color: '#fff', textDecoration: 'none', fontWeight: '600' }}>
                    Manage Allocations <i className="fa-solid fa-arrow-right ms-1"></i>
                  </Link>
                </div>

                <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>Faculty Member</th>
                        <th style={{ padding: '10px 12px' }}>Course Assigned</th>
                        <th style={{ padding: '10px 12px' }}>Batch</th>
                        <th style={{ padding: '10px 12px' }}>Syllabus Covered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <TableSkeletonLoader columns={4} rows={workloadSize || 3} />
                      ) : paginatedWorkload.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                            No faculty workloads found.
                          </td>
                        </tr>
                      ) : (
                        paginatedWorkload.map(fw => (
                          <tr key={fw.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: '700' }}>{fw.name}</td>
                            <td style={{ padding: '12px' }}>{fw.course}</td>
                            <td style={{ padding: '12px' }}>{fw.batch}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ color: fw.color, fontWeight: '700' }}>{fw.covered}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <TablePagination
                    currentPage={workloadPage}
                    totalItems={totalWorkload}
                    pageSize={workloadSize}
                    onPageChange={setWorkloadPage}
                    onPageSizeChange={setWorkloadSize}
                    itemName="faculty workloads"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="card" style={{ borderRadius: '16px', background: '#ffffff', border: '1px solid var(--border-color, #e2e8f0)', padding: '22px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 14px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '10px', color: '#1e293b' }}>
                  <i className="fa-solid fa-sliders me-1" style={{ color: '#4F46E5' }}></i> HOD Executive Actions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link to="/unilms/faculty/allocations" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', textDecoration: 'none', color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span><i className="fa-solid fa-user-tie me-2 text-primary"></i> Allocate Teaching Load</span>
                    <i className="fa-solid fa-chevron-right text-muted"></i>
                  </Link>
                  <Link to="/unilms/faculty/subjects" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', textDecoration: 'none', color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span><i className="fa-solid fa-book me-2 text-primary"></i> Review Department Curricula</span>
                    <i className="fa-solid fa-chevron-right text-muted"></i>
                  </Link>
                  <Link to="/unilms/faculty/timetable" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', textDecoration: 'none', color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span><i className="fa-solid fa-calendar-days me-2 text-primary"></i> Department Timetable Master</span>
                    <i className="fa-solid fa-chevron-right text-muted"></i>
                  </Link>
                  <Link to="/unilms/faculty/po_setup" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', textDecoration: 'none', color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span><i className="fa-solid fa-award me-2 text-primary"></i> NBA CO-PO Attainment Report</span>
                    <i className="fa-solid fa-chevron-right text-muted"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrgFacultyDashboard;
