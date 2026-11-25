import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import lmsStudentService from '../../services/lmsStudent.service';

const LmsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        const data = await lmsStudentService.getDashboardData();
        if (isMounted) setDashboardData(data);
      } catch (err) {
        console.warn('Failed to load live student data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { isMounted = false; };
  }, []);

  const student = dashboardData?.student || {};
  const attendance = dashboardData?.attendance || {};
  const feeSummary = dashboardData?.fees?.summary || {};
  const timetable = dashboardData?.timetable || {};
  const todayClasses = Array.isArray(timetable.today) ? timetable.today : [];

  const studentName = student.name || localStorage.getItem('org_user_name') || 'Student';
  const programName = student.program || 'Degree Program';
  const cohortName = student.cohort || 'General Section';
  const rollNo = student.rollNumber || '';
  const attendanceRate = attendance.attendanceRate !== undefined ? attendance.attendanceRate : (attendance.attendancePercentage || 0);
  const balanceDue = feeSummary.totalBalance !== undefined ? feeSummary.totalBalance : 0;
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      {/* Main Header Banner with Deep Cosmic Slate Indigo Gradient */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #090E1A 0%, #111A33 35%, #182852 70%, #203A78 100%)',
          borderRadius: '13px',
          padding: '14px 20px',
          color: '#FFFFFF',
          marginBottom: '16px',
          border: '1px solid rgba(129, 140, 248, 0.22)',
          boxShadow: '0 4px 18px -2px rgba(17, 26, 51, 0.45)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(129, 140, 248, 0.12)',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                backdropFilter: 'blur(8px)',
                padding: '2.5px 9px',
                borderRadius: '16px',
                fontSize: '9.5px',
                fontWeight: '700',
                color: '#A5B4FC',
                marginBottom: '5px'
              }}
            >
              <i className="fa-solid fa-graduation-cap" style={{ fontSize: '9px' }}></i> {programName} &bull; {cohortName} {rollNo ? `• Roll: ${rollNo}` : ''}
            </div>
            <h1
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '17px',
                fontWeight: '800',
                margin: '0 0 3px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Welcome back, {studentName}! 👋
            </h1>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#C7D2FE', maxWidth: '680px', lineHeight: '1.4' }}>
              Academic schedule for <strong>{todayFormatted}</strong> &bull; Current attendance health: <strong>{attendanceRate}%</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/unilms/lms/learn"
              style={{
                background: '#FFFFFF',
                color: '#1E1B4B',
                padding: '5px 12px',
                borderRadius: '7px',
                fontSize: '10.5px',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
            >
              <i className="fa-solid fa-play" style={{ fontSize: '9px' }}></i> Continue Learning
            </Link>
            <Link
              to="/unilms/lms/timetable"
              style={{
                background: 'rgba(255, 255, 255, 0.14)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                backdropFilter: 'blur(8px)',
                padding: '5px 11px',
                borderRadius: '7px',
                fontSize: '10.5px',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fa-solid fa-calendar-days"></i> Full Timetable
            </Link>
          </div>
        </div>
      </div>

      {/* Academic Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}
      >
        <Link
          to="/unilms/lms/attendance"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            className="card"
            style={{
              padding: '9px 13px',
              borderLeft: '3.5px solid var(--primary, #4F46E5)',
              borderTop: '1px solid var(--border, #E2E8F0)',
              borderRight: '1px solid var(--border, #E2E8F0)',
              borderBottom: '1px solid var(--border, #E2E8F0)',
              borderRadius: '10px',
              background: 'var(--surface, #FFFFFF)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              height: '100%'
            }}
          >
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
              Semester Attendance
            </div>
            <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '2px', lineHeight: '1.2' }}>
              {attendanceRate}% <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Overall</span>
            </div>
            <div style={{ fontSize: '10px', color: attendanceRate >= 75 ? 'var(--success, #10B981)' : '#EF4444', fontWeight: '700', marginTop: '2px' }}>
              <i className={`fa-solid ${attendanceRate >= 75 ? 'fa-circle-check' : 'fa-triangle-exclamation'} me-1`}></i>
              {attendanceRate >= 75 ? 'Good Standing' : 'Detention Alert (<75%)'}
            </div>
          </div>
        </Link>

        <Link
          to="/unilms/lms/assessments"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            className="card"
            style={{
              padding: '9px 13px',
              borderLeft: '3.5px solid var(--success, #10B981)',
              borderTop: '1px solid var(--border, #E2E8F0)',
              borderRight: '1px solid var(--border, #E2E8F0)',
              borderBottom: '1px solid var(--border, #E2E8F0)',
              borderRadius: '10px',
              background: 'var(--surface, #FFFFFF)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              height: '100%'
            }}
          >
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
              Continuous Evaluation
            </div>
            <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
              CIE-1 Scheduled
            </div>
            <div style={{ fontSize: '10px', color: 'var(--warning, #F59E0B)', fontWeight: '700', marginTop: '2px' }}>
              <i className="fa-solid fa-clock me-1"></i> Continuous Internal Evaluation
            </div>
          </div>
        </Link>

        <Link
          to="/unilms/lms/timetable"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            className="card"
            style={{
              padding: '9px 13px',
              borderLeft: '3.5px solid #06B6D4',
              borderTop: '1px solid var(--border, #E2E8F0)',
              borderRight: '1px solid var(--border, #E2E8F0)',
              borderBottom: '1px solid var(--border, #E2E8F0)',
              borderRadius: '10px',
              background: 'var(--surface, #FFFFFF)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              height: '100%'
            }}
          >
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
              Active Timetable
            </div>
            <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
              Weekly Grid <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Live</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
              <i className="fa-solid fa-calendar-check me-1"></i> Section Academic Periods
            </div>
          </div>
        </Link>

        <Link
          to="/unilms/lms/fees"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            className="card"
            style={{
              padding: '9px 13px',
              borderLeft: `3.5px solid ${balanceDue > 0 ? 'var(--warning, #F59E0B)' : 'var(--success, #10B981)'}`,
              borderTop: '1px solid var(--border, #E2E8F0)',
              borderRight: '1px solid var(--border, #E2E8F0)',
              borderBottom: '1px solid var(--border, #E2E8F0)',
              borderRadius: '10px',
              background: 'var(--surface, #FFFFFF)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              height: '100%'
            }}
          >
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
              Term Fee Balance
            </div>
            <div style={{ fontSize: '16.5px', fontWeight: '800', color: balanceDue > 0 ? 'var(--warning, #F59E0B)' : 'var(--success, #10B981)', marginTop: '2px', lineHeight: '1.2' }}>
              ₹{Number(balanceDue).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '10px', color: balanceDue > 0 ? '#DC2626' : 'var(--success, #10B981)', fontWeight: '600', marginTop: '2px' }}>
              {balanceDue > 0 ? 'Pending Dues' : '100% Cleared / No Dues'}
            </div>
          </div>
        </Link>
      </div>

      <div className="lms-dashboard-main-grid">
        <div>
          <div className="card" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "19px", fontWeight: "800", marginBottom: "2px" }}>
                  <i className="fa-solid fa-play-circle me-2" style={{ color: "var(--primary)" }}></i> Active Video Courses (Blended Learning)
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0" }}>Resume video masterclasses and download modular notes</p>
              </div>
              <Link to="/unilms/lms/learn" className="btn btn-outline" style={{ fontSize: "12.5px", padding: "6px 14px", borderRadius: "20px" }}>
                All Courses <i className="fa-solid fa-arrow-right ms-1"></i>
              </Link>
            </div>

            <div className="quick-course-card">
              <div className="quick-course-thumb">
                <i className="fa-solid fa-play"></i>
              </div>
              <div style={{ flex: "1", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span className="badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "12px" }}>
                      Blended Learning
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      <i className="fa-solid fa-layer-group me-1"></i> 12 Lessons
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>
                    Cloud Architecture & Microservices 2026
                  </h3>
                  <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: "0", lineHeight: "1.4" }}>
                    Learn containerization, serverless microservices, and modern Kubernetes deployments...
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid var(--border)", marginTop: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#10b981", fontWeight: "700" }}>
                    <i className="fa-solid fa-circle-check me-1"></i> Active Course
                  </div>
                  <Link to="/unilms/lms/learn" className="btn btn-primary" style={{ padding: "6px 16px", fontSize: "12.5px", borderRadius: "20px" }}>
                    Resume Video <i className="fa-solid fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "19px", fontWeight: "800", margin: "0" }}>
                <i className="fa-solid fa-file-pen me-2" style={{ color: "#f59e0b" }}></i> Assessments & Lab Milestones
              </h2>
              <Link to="/unilms/lms/assessments" className="btn btn-outline" style={{ fontSize: "12.5px", padding: "6px 14px", borderRadius: "20px" }}>
                View All
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span className="badge" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706", fontWeight: "700", fontSize: "11px", padding: "2px 8px", borderRadius: "10px" }}>
                      <i className="fa-solid fa-clock me-1"></i> Pending Submission
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>CS402 &bull; Cloud Architecture & DevOps</span>
                  </div>
                  <div style={{ fontWeight: "700", fontSize: "14px", marginBottom: "2px" }}>
                    Lab Milestone 1: Microservices Docker Compose Setup
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Due: 18 Oct 2026, 11:59 PM &bull; Max Marks: 25.00
                  </div>
                </div>
                <Link to="/unilms/lms/assessments" className="btn btn-outline" style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "10px" }}>
                  Submit Work
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "18px", fontWeight: "800", margin: "0" }}>
                <i className="fa-solid fa-calendar-day me-2" style={{ color: "var(--primary)" }}></i> Today's Schedule
              </h2>
              <span className="badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "10px" }}>
                Today • Monday
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="timeline-item">
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "2px" }}>
                  09:00 AM - 09:50 AM • Period 1
                </div>
                <div style={{ fontWeight: "700", fontSize: "13.5px", marginBottom: "2px" }}>
                  Advanced Algorithms & System Design
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  <i className="fa-solid fa-user-tie me-1"></i> Prof. Ananya Iyer &bull; <i className="fa-solid fa-door-open me-1"></i> Lecture Hall 101
                </div>
              </div>

              <div className="timeline-item">
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "2px" }}>
                  09:50 AM - 10:40 AM • Period 2
                </div>
                <div style={{ fontWeight: "700", fontSize: "13.5px", marginBottom: "2px" }}>
                  Cloud Architecture & DevOps Microservices
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  <i className="fa-solid fa-user-tie me-1"></i> Dr. Arvind Ramesh &bull; <i className="fa-solid fa-door-open me-1"></i> Cloud Lab 402
                </div>
              </div>

              <div className="timeline-item active" style={{ background: "rgba(239, 68, 68, 0.05)", padding: "10px", borderRadius: "10px", borderLeft: "3px solid #ef4444" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "2px" }}>
                  <div style={{ fontSize: "11.5px", color: "#dc2626", fontWeight: "700" }}>
                    10:55 AM - 11:45 AM • Period 3 (Test)
                  </div>
                  <span className="badge" style={{ background: "#ef4444", color: "white", fontSize: "10px", fontWeight: "800", padding: "2px 6px", borderRadius: "6px" }}>
                    TEST LIVE NOW
                  </span>
                </div>
                <div style={{ fontWeight: "700", fontSize: "13.5px", marginBottom: "2px", color: "#991b1b" }}>
                  WEEKLY TEST 1: Advanced Algorithms (CBT)
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  <i className="fa-solid fa-user-tie me-1"></i> Prof. Ananya Iyer &bull; <i className="fa-solid fa-door-open me-1"></i> CBT Hall 2 (25 Marks)
                </div>
              </div>
            </div>

            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
              <Link to="/unilms/lms/timetable" className="btn btn-outline" style={{ width: "100%", fontSize: "13px", borderRadius: "12px" }}>
                View Complete Week Timetable <i className="fa-solid fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>

          <div className="card" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(56, 189, 248, 0.08))", borderColor: "rgba(99, 102, 241, 0.2)" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: "0" }}>
                <i className="fa-solid fa-bullseye"></i>
              </div>
              <div>
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "15px", fontWeight: "700", marginBottom: "4px" }}>
                  NBA OBE Attainment Matrix Live
                </h4>
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.4", marginBottom: "10px" }}>
                  Your continuous assessment marks are automatically aggregated for PO1–PO12 NBA Graduate Attributes.
                </p>
                <Link to="/unilms/lms/obe" style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary)", textDecoration: "none" }}>
                  View My Attainment Scorecard <i className="fa-solid fa-chevron-right ms-1"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LmsDashboard;