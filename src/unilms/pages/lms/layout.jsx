import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import './lms.css';

const LmsLayout = () => {
  const { currentTenant, tenant } = useTenant();
  const activeTenant = currentTenant || tenant;
  const isLmsEnabled = activeTenant ? (activeTenant.lmsEnabled !== false && activeTenant.lms_enabled !== false) : true;
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [showLogout, setShowLogout] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studentInfo] = useState(() => {
    try {
      const stored = localStorage.getItem('unilms_user');
      if (stored) {
        const u = JSON.parse(stored);
        return {
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Enrolled Student',
          rollNumber: u.rollNumber || u.roll_number || 'STU-ONLINE',
          program: u.program || 'Degree Program'
        };
      }
    } catch (e) {}
    return { name: 'Enrolled Student', rollNumber: 'STU-ONLINE', program: 'Degree Program' };
  });
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('unilms_student_theme') || 'purple';
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('unilms_student_mode') === 'dark';
  });
  const paletteRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('unilms_student_theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      localStorage.setItem('unilms_student_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('unilms_student_mode', 'light');
    }
  }, [isDarkMode]);

  // Automatically close mobile sidebar on route transition
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [path]);

  // Lock body scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('mobile-sidebar-open');
    } else {
      document.body.classList.remove('mobile-sidebar-open');
    }
    return () => {
      document.body.classList.remove('mobile-sidebar-open');
    };
  }, [isSidebarOpen]);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
        setShowPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setShowPalette(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTheme = (themeId) => {
    setCurrentTheme(themeId);
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const themesList = [
    { id: 'purple', name: 'Royal Purple', color: '#7C3AED' },
    { id: 'blue', name: 'Sapphire Blue', color: '#2563EB' },
    { id: 'emerald', name: 'Emerald Green', color: '#059669' },
    { id: 'amber', name: 'Sunset Amber', color: '#D97706' },
    { id: 'rose', name: 'Crimson Rose', color: '#E11D48' },
    { id: 'teal', name: 'Deep Teal', color: '#0D9488' }
  ];

  const handleLogout = (e) => {
    e.preventDefault();
    setShowLogout(false);
    navigate('/unilms/lms/login');
  };

  const getPageName = () => {
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('assessments') || path.includes('assignments')) return 'Assignments & Tests';
    if (path.includes('quizzes')) return 'CBT Quizzes';
    if (path.includes('timetable')) return 'Class Timetable';
    if (path.includes('attendance')) return 'Attendance';
    if (path.includes('grade_card')) return 'Semester Grade Card';
    if (path.includes('materials')) return 'Course Materials';
    if (path.includes('obe')) return 'OBE Matrix';
    if (path.includes('internships')) return 'Industry Internships';
    if (path.includes('placements')) return 'Placements Hub';
    if (path.includes('learn')) return 'LMS Learning Cloud';
    if (path.includes('fees')) return 'Fee Ledger & Dues';
    if (path.includes('self_service')) return 'Self Service Desk';
    if (path.includes('certificate_requests')) return 'Certificates Desk';
    if (path.includes('exam_applications')) return 'Exam Registration';
    if (path.includes('diary')) return 'Academic Diary';
    if (path.includes('hostel')) return 'Hostel Accommodation';
    if (path.includes('transport')) return 'Campus Transport';
    if (path.includes('complaints')) return 'Grievance Desk';
    if (path.includes('feedback')) return 'Course Feedback';
    return '';
  };

  return (
    <>
      <div className="html-wrapper" lang="en">
        <div className="body-wrapper">
          {/* Mobile Overlay Backdrop */}
          <div 
            className={`sidebar-backdrop ${isSidebarOpen ? 'active' : ''}`} 
            id="sidebarBackdrop" 
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          {/* Persistent Sidebar */}
          <aside className={`lms-sidebar ${isSidebarOpen ? 'active' : ''}`} id="lmsSidebar">
            {/* Header Brand */}
            <div className="sidebar-brand">
              <div className="brand-logo-icon">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <div className="brand-text-box">
                <div className="brand-title">{currentTenant?.name || 'UniLMS Campus'}</div>
                <div className="brand-subtitle">UniLMS Student Portal</div>
              </div>
              <button 
                type="button" 
                className="sidebar-close-btn" 
                onClick={() => setIsSidebarOpen(false)}
                title="Close Navigation"
                aria-label="Close Navigation"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Student Profile Identity Card */}
            <div className="sidebar-student-card">
              <div className="student-avatar">
                {studentInfo.name.charAt(0)}
              </div>
              <div className="student-info">
                <div className="student-name">{studentInfo.name}</div>
                <div className="student-roll">
                  <span className="student-roll-badge">{studentInfo.rollNumber}</span>
                  <span>&bull; {studentInfo.program}</span>
                </div>
              </div>
            </div>

            {/* Full Unified Navigation Menu with All Items */}
            <div className="sidebar-nav-container">
              {/* Academics & Learning */}
              <div className="nav-category-header">Academics &amp; Learning</div>
              <Link to="/unilms/lms/dashboard" className={`sidebar-nav-link ${path.includes('dashboard') ? 'active' : ''}`}>
                <i className="fa-solid fa-gauge-high nav-icon"></i>
                <span>Dashboard</span>
              </Link>
              <Link to="/unilms/lms/assignments" className={`sidebar-nav-link ${path.includes('assignments') ? 'active' : ''}`}>
                <i className="fa-solid fa-file-pen nav-icon" style={{ color: "#ec4899" }}></i>
                <span>Assessments &amp; Assignments</span>
              </Link>
              <Link to="/unilms/lms/quizzes" className={`sidebar-nav-link ${path.includes('quizzes') ? 'active' : ''}`}>
                <i className="fa-solid fa-circle-question nav-icon" style={{ color: "#059669" }}></i>
                <span>CBT Quizzes &amp; Tests</span>
              </Link>
              <Link to="/unilms/lms/timetable" className={`sidebar-nav-link ${path.includes('timetable') ? 'active' : ''}`}>
                <i className="fa-solid fa-calendar-days nav-icon"></i>
                <span>Class Timetable</span>
              </Link>
              <Link to="/unilms/lms/attendance" className={`sidebar-nav-link ${path.includes('attendance') ? 'active' : ''}`}>
                <i className="fa-solid fa-clipboard-user nav-icon"></i>
                <span>Attendance Monitor</span>
              </Link>
              <Link to="/unilms/lms/portal/grade_card" className={`sidebar-nav-link ${path.includes('grade_card') ? 'active' : ''}`}>
                <i className="fa-solid fa-award nav-icon"></i>
                <span>Semester Grade Card</span>
              </Link>
              <Link to="/unilms/lms/materials" className={`sidebar-nav-link ${path.includes('materials') ? 'active' : ''}`}>
                <i className="fa-solid fa-book-open nav-icon" style={{ color: "#38bdf8" }}></i>
                <span>Course Materials &amp; Notes</span>
              </Link>
              <Link to="/unilms/lms/obe" className={`sidebar-nav-link ${path.includes('obe') ? 'active' : ''}`}>
                <i className="fa-solid fa-bullseye nav-icon"></i>
                <span>OBE Outcomes &amp; Matrix</span>
              </Link>

              {/* Career & Industry */}
              <div className="nav-category-header">Career &amp; Industry</div>
              <Link to="/unilms/lms/internships" className={`sidebar-nav-link ${path.includes('internships') ? 'active' : ''}`}>
                <i className="fa-solid fa-briefcase nav-icon"></i>
                <span>Industry Internships</span>
              </Link>
              <Link to="/unilms/lms/placements" className={`sidebar-nav-link ${path.includes('placements') ? 'active' : ''}`}>
                <i className="fa-solid fa-building-user nav-icon"></i>
                <span>Placements Hub</span>
              </Link>
              {isLmsEnabled && (
                <Link to="/unilms/lms/learn" className={`sidebar-nav-link ${path.includes('learn') ? 'active' : ''}`}>
                  <i className="fa-solid fa-graduation-cap nav-icon" style={{ color: "#A855F7" }}></i>
                  <span>Next-Gen LMS Cloud</span>
                  <span className="nav-pill-badge">PRO</span>
                </Link>
              )}

              {/* Student Services & Desk */}
              <div className="nav-category-header">Campus Life &amp; Services</div>
              <Link to="/unilms/lms/fees" className={`sidebar-nav-link ${path.includes('fees') ? 'active' : ''}`}>
                <i className="fa-solid fa-indian-rupee-sign nav-icon"></i>
                <span>Fee Ledger &amp; Dues</span>
              </Link>
              <Link to="/unilms/lms/portal/self_service" className={`sidebar-nav-link ${path.includes('self_service') ? 'active' : ''}`}>
                <i className="fa-solid fa-receipt nav-icon"></i>
                <span>Self Service</span>
              </Link>
              <Link to="/unilms/lms/portal/certificate_requests" className={`sidebar-nav-link ${path.includes('certificate_requests') ? 'active' : ''}`}>
                <i className="fa-solid fa-certificate nav-icon" style={{ color: "#EAB308" }}></i>
                <span>Certificates</span>
              </Link>
              <Link to="/unilms/lms/portal/exam_applications" className={`sidebar-nav-link ${path.includes('exam_applications') ? 'active' : ''}`}>
                <i className="fa-solid fa-file-signature nav-icon"></i>
                <span>Exam Applications</span>
              </Link>
              <Link to="/unilms/lms/portal/diary" className={`sidebar-nav-link ${path.includes('diary') ? 'active' : ''}`}>
                <i className="fa-solid fa-book-bookmark nav-icon" style={{ color: "#14B8A6" }}></i>
                <span>Campus Notices &amp; Diary</span>
              </Link>
              <Link to="/unilms/lms/portal/hostel" className={`sidebar-nav-link ${path.includes('hostel') ? 'active' : ''}`}>
                <i className="fa-solid fa-hotel nav-icon"></i>
                <span>Residential Hostel</span>
              </Link>
              <Link to="/unilms/lms/portal/transport" className={`sidebar-nav-link ${path.includes('transport') ? 'active' : ''}`}>
                <i className="fa-solid fa-bus nav-icon"></i>
                <span>Campus Transit</span>
              </Link>
              <Link to="/unilms/lms/portal/complaints" className={`sidebar-nav-link ${path.includes('complaints') ? 'active' : ''}`}>
                <i className="fa-solid fa-shield-halved nav-icon" style={{ color: "#F43F5E" }}></i>
                <span>Complaints &amp; Grievances</span>
              </Link>
              <Link to="/unilms/lms/portal/feedback" className={`sidebar-nav-link ${path.includes('feedback') ? 'active' : ''}`}>
                <i className="fa-solid fa-comment-dots nav-icon"></i>
                <span>Course Feedback</span>
              </Link>
            </div>
          </aside>

          {/* Main Viewport Wrapper */}
          <div className="lms-main-wrapper">
            {/* Top Responsive Header Navbar */}
            <header className="lms-top-header">
              <div className="header-left">
                <button 
                  type="button"
                  className="btn-mobile-toggle" 
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open sidebar navigation"
                  title="Toggle Navigation"
                >
                  <i className="fa-solid fa-bars"></i>
                </button>
                <div className="page-breadcrumb">
                  <span className="breadcrumb-root">Student Portal</span>
                  {getPageName() && (
                    <>
                      <i className="fa-solid fa-chevron-right breadcrumb-sep" style={{ fontSize: "11px", opacity: 0.5 }}></i>
                      <span className="current">{getPageName()}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="header-right">
                {isLmsEnabled && (
                  <Link to="/unilms/lms/learn" className="lms-launch-btn" title="Open Next-Gen LMS Learning Cloud">
                    <span className="lms-btn-icon"><i className="fa-solid fa-graduation-cap"></i></span>
                    <span className="lms-btn-text">
                      <span className="lms-btn-name">LMS Portal</span>
                      <span className="lms-btn-tag">Next-Gen ✨</span>
                    </span>
                    <span className="lms-btn-arrow"><i className="fa-solid fa-arrow-up-right-from-square"></i></span>
                  </Link>
                )}

                <div className="term-badge-header">
                  <i className="fa-solid fa-graduation-cap"></i>
                  <span className="term-text-full">Semester 4 (2026-2027)</span>
                  <span className="term-text-short">Sem 4</span>
                </div>

                {/* Theme Palette & Dark Mode Controls */}
                <div className="theme-control-box" ref={paletteRef} style={{ position: 'relative' }}>
                  <button 
                    type="button" 
                    className={`theme-btn ${showPalette ? 'active' : ''}`} 
                    onClick={() => setShowPalette((prev) => !prev)} 
                    title="Change Color Palette"
                  >
                    <i className="fa-solid fa-palette"></i>
                  </button>
                  <button 
                    type="button" 
                    className="theme-btn" 
                    onClick={handleToggleDarkMode} 
                    title="Toggle Dark/Light Mode"
                  >
                    <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                  </button>

                  {/* Palette Modal Dropdown */}
                  {showPalette && (
                    <div 
                      id="paletteDropdownMenu" 
                      className="palette-dropdown-menu"
                    >
                      <div className="palette-title">
                        Theme Color
                      </div>
                      <div className="palette-colors-row">
                        {themesList.map((t) => {
                          const isSelected = currentTheme === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleSelectTheme(t.id)}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: t.color,
                                border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                                boxShadow: isSelected ? '0 0 0 2px rgba(255, 255, 255, 0.35)' : 'none',
                                transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                padding: 0
                              }}
                              title={t.name}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Student Profile Dropdown Trigger */}
                <div className="user-profile-dropdown-wrapper" ref={userDropdownRef} style={{ position: 'relative' }}>
                  <div 
                    className="header-avatar" 
                    title={`${studentInfo.name} (${studentInfo.rollNumber})`}
                    onClick={() => setShowUserDropdown(prev => !prev)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {studentInfo.name.charAt(0)}
                  </div>

                  {showUserDropdown && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        right: 0,
                        width: '240px',
                        maxWidth: 'calc(100vw - 20px)',
                        boxSizing: 'border-box',
                        background: 'var(--surface, #ffffff)',
                        border: '1px solid var(--border, rgba(0,0,0,0.1))',
                        borderRadius: '16px',
                        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.18)',
                        padding: '14px',
                        zIndex: 9999,
                        animation: 'fadeIn 0.18s ease-out'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border, rgba(0,0,0,0.06))' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px' }}>
                          {studentInfo.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '13.5px', color: 'var(--text-main, #0F172A)' }}>
                            {studentInfo.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>
                            {studentInfo.rollNumber} &bull; {studentInfo.program}
                          </div>
                        </div>
                      </div>

                      <div style={{ margin: '8px 0', borderTop: '1px solid var(--border, rgba(0,0,0,0.06))' }}></div>

                      <button 
                        type="button" 
                        onClick={() => {
                          setShowUserDropdown(false);
                          setShowLogout(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%'
                        }}
                      >
                        <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '16px' }}></i>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Sub-Page Content Container */}
            <main className="lms-page-container">
              <Outlet />
            </main>
          </div>

          {/* Sign Out Modal Confirmation */}
          {showLogout && (
            <div id="lmsLogoutModal" style={{ display: "flex", position: "fixed", inset: "0", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 9999, alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "380px", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.25)", border: "1px solid var(--border)" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", margin: "0 auto 16px" }}>
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>Sign Out of LMS?</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>Are you sure you want to end your student session?</p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={() => setShowLogout(false)} className="btn btn-outline" style={{ flex: "1" }}>Cancel</button>
                  <button type="button" onClick={handleLogout} className="btn btn-primary" style={{ flex: "1", background: "#ef4444", border: "none", color: "white" }}>Sign Out</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LmsLayout;
