import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import lmsStudentService from '../../services/lmsStudent.service';

const LmsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(() => lmsStudentService.getCachedDashboardData());
  const [loading, setLoading] = useState(() => !lmsStudentService.getCachedDashboardData());

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        const data = await lmsStudentService.getDashboardData();
        if (isMounted && data) setDashboardData(data);
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
  const totalBilled = feeSummary.totalBilled !== undefined ? feeSummary.totalBilled : (feeSummary.totalFees || 0);
  const balanceDue = feeSummary.totalBalance !== undefined ? feeSummary.totalBalance : 0;
  const activeCieCount = dashboardData?.assessments?.activeCount || 0;
  const videoCourses = Array.isArray(dashboardData?.courses) ? dashboardData.courses : [];
  const assessmentsList = Array.isArray(dashboardData?.assessments?.list) ? dashboardData.assessments.list : [];

  const studentName = student.name || localStorage.getItem('org_user_name') || 'Student';
  const programName = student.program || 'Degree Program';
  const cohortName = student.cohort || 'General Section';
  const rollNo = student.rollNumber || '';
  const attendanceRate = attendance.attendanceRate !== undefined ? attendance.attendanceRate : (attendance.attendancePercentage || 0);
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
            <div style={{ fontSize: '16.5px', fontWeight: '800', color: activeCieCount > 0 ? 'var(--text-main, #0F172A)' : 'var(--text-muted, #64748B)', marginTop: '2px', lineHeight: '1.2' }}>
              {activeCieCount > 0 ? `${activeCieCount} Active CIE` : 'No Active CIE'}
            </div>
            <div style={{ fontSize: '10px', color: activeCieCount > 0 ? 'var(--warning, #F59E0B)' : 'var(--text-muted, #64748B)', fontWeight: '700', marginTop: '2px' }}>
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
              borderLeft: `3.5px solid ${balanceDue > 0 ? 'var(--warning, #F59E0B)' : totalBilled === 0 ? 'var(--border, #CBD5E1)' : 'var(--success, #10B981)'}`,
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
            <div style={{ fontSize: '16.5px', fontWeight: '800', color: balanceDue > 0 ? 'var(--warning, #F59E0B)' : totalBilled === 0 ? 'var(--text-muted, #64748B)' : 'var(--success, #10B981)', marginTop: '2px', lineHeight: '1.2' }}>
              {totalBilled === 0 ? '₹0' : `₹${Number(balanceDue).toLocaleString('en-IN')}`}
            </div>
            <div style={{ fontSize: '10px', color: balanceDue > 0 ? '#DC2626' : totalBilled === 0 ? 'var(--text-muted, #64748B)' : 'var(--success, #10B981)', fontWeight: '600', marginTop: '2px' }}>
              {balanceDue > 0 ? 'Pending Dues' : totalBilled === 0 ? 'No Invoices Issued' : '100% Cleared / No Dues'}
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

            {videoCourses.length > 0 ? (
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
                        <i className="fa-solid fa-layer-group me-1"></i> {videoCourses[0].lessons || 12} Lessons
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>
                      {videoCourses[0].title}
                    </h3>
                    <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: "0", lineHeight: "1.4" }}>
                      {videoCourses[0].description}
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
            ) : (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                <i className="fa-solid fa-video-slash" style={{ fontSize: '26px', marginBottom: '8px', display: 'block', opacity: 0.5 }}></i>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main, #0F172A)' }}>No published blended courses assigned yet</div>
                <div style={{ fontSize: '12px', marginTop: '3px' }}>Course video masterclasses published by your faculty will appear here</div>
              </div>
            )}
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
              {assessmentsList.length > 0 ? (
                assessmentsList.map((asm, idx) => (
                  <div key={idx} style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span className="badge" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706", fontWeight: "700", fontSize: "11px", padding: "2px 8px", borderRadius: "10px" }}>
                          <i className="fa-solid fa-clock me-1"></i> {asm.status || 'Pending Submission'}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{asm.subjectCode || 'Course'} &bull; {asm.subjectName || ''}</span>
                      </div>
                      <div style={{ fontWeight: "700", fontSize: "14px", marginBottom: "2px" }}>
                        {asm.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Due: {asm.dueDate || 'End of Term'} &bull; Max Marks: {asm.maxMarks || 25.00}
                      </div>
                    </div>
                    <Link to="/unilms/lms/assessments" className="btn btn-outline" style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "10px" }}>
                      Submit Work
                    </Link>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                  <i className="fa-regular fa-folder-open" style={{ fontSize: '26px', marginBottom: '8px', display: 'block', opacity: 0.5 }}></i>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main, #0F172A)' }}>No pending lab milestones or assessments</div>
                  <div style={{ fontSize: '12px', marginTop: '3px' }}>Upcoming internal continuous evaluations will appear here</div>
                </div>
              )}
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
                Today • {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {todayClasses.length > 0 ? (
                todayClasses.map((item, idx) => (
                  <div key={idx} className="timeline-item">
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "2px" }}>
                      {item.startTime} - {item.endTime} {item.period ? `• Period ${item.period}` : ''}
                    </div>
                    <div style={{ fontWeight: "700", fontSize: "13.5px", marginBottom: "2px" }}>
                      {item.subjectName || item.subject || 'Class Session'}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      <i className="fa-solid fa-user-tie me-1"></i> {item.facultyName || item.faculty || 'Faculty'} &bull; <i className="fa-solid fa-door-open me-1"></i> {item.room || 'Classroom'}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                  <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '26px', marginBottom: '8px', display: 'block', opacity: 0.5 }}></i>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main, #0F172A)' }}>No classes scheduled for today</div>
                  <div style={{ fontSize: '12px', marginTop: '3px' }}>Check your full section weekly timetable grid</div>
                </div>
              )}
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