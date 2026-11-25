import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const CreatorLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const uri = location.pathname;
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem('theme') || localStorage.getItem('unilms_student_mode') || localStorage.getItem('org_theme_mode');
    if (storedTheme === 'dark') return true;
    if (storedTheme === 'light') return false;
    return typeof document !== 'undefined' && document.body.classList.contains('dark-mode');
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('unilms_student_mode', 'dark');
      localStorage.setItem('org_theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      localStorage.setItem('unilms_student_mode', 'light');
      localStorage.setItem('org_theme_mode', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleLogout = () => {
    document.querySelector('.modal-backdrop')?.remove();
    document.body.classList.remove('modal-open');
    document.body.style = '';
    navigate('/unilms/creator/login');
  };

  return (
    <div className={`creator-studio-wrapper ${isDarkMode ? 'dark-mode' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .creator-studio-wrapper {
          --primary: #6366f1;
          --primary-hover: #4f46e5;
          --primary-light: #eef2ff;
          --primary-gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          --secondary-gradient: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          --accent-gradient: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          --success-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
          --bg-body: #f4f7fe;
          --card-bg: #ffffff;
          --text-dark: #0f172a;
          --text-secondary: #475569;
          --text-muted: #64748b;
          --border-color: #e2e8f0;
          --navbar-bg: #ffffff;
          --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
          --card-shadow-hover: 0 12px 24px -4px rgba(79, 70, 229, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
          --card-radius: 16px;

          font-family: 'Plus Jakarta Sans', sans-serif;
          background-color: var(--bg-body);
          color: var(--text-dark);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-size: 13px;
          transition: background-color 0.25s ease, color 0.25s ease;
        }

        /* Dark Mode Theme Variables */
        body.dark-mode .creator-studio-wrapper,
        html.dark-mode .creator-studio-wrapper,
        .creator-studio-wrapper.dark-mode {
          --bg-body: #0b0e14 !important;
          --card-bg: #151a24 !important;
          --text-dark: #f8fafc !important;
          --text-secondary: #cbd5e1 !important;
          --text-muted: #94a3b8 !important;
          --border-color: rgba(255, 255, 255, 0.1) !important;
          --navbar-bg: #151a24 !important;
          background-color: #0b0e14 !important;
          color: #f8fafc !important;
        }

        /* Navbar */
        .creator-navbar {
          background: var(--navbar-bg);
          border-bottom: 1px solid var(--border-color);
          padding: 0.75rem 0;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
          transition: all 0.25s ease;
        }

        .creator-brand-badge {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: var(--primary-gradient);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
        }

        .creator-brand-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-dark);
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .creator-brand-subtitle {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .creator-nav-link {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-secondary);
          text-decoration: none;
          padding: 0.55rem 1.1rem;
          border-radius: 10px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
        }

        .creator-nav-link:hover {
          color: var(--primary);
          background-color: rgba(99, 102, 241, 0.12);
        }

        .creator-nav-link.active {
          color: #ffffff !important;
          background: var(--primary-gradient);
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
        }

        .creator-user-pill {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          padding: 0.4rem 0.85rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .creator-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary-gradient);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .content-container {
          max-width: 1240px;
          width: 100%;
          margin: 0 auto;
          padding: clamp(16px, 3vw, 32px) clamp(10px, 2.5vw, 24px) 4rem; width: 100%; box-sizing: border-box; min-width: 0;
          flex: 1;
        }

        .modern-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--card-radius);
          box-shadow: var(--card-shadow);
          transition: all 0.25s ease;
        }

        .modern-card:hover {
          box-shadow: var(--card-shadow-hover);
        }

        .btn-gradient-primary {
          background: var(--primary-gradient);
          color: #ffffff !important;
          border: none;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
          transition: all 0.2s ease;
        }

        .btn-gradient-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
        }

        /* Typography */
        .creator-studio-wrapper h1,
        .creator-studio-wrapper h2,
        .creator-studio-wrapper h3,
        .creator-studio-wrapper h4,
        .creator-studio-wrapper h5,
        .creator-studio-wrapper h6 {
          font-family: 'Outfit', sans-serif !important;
          color: var(--text-dark) !important;
        }

        /* Dark Mode Component Overrides */
        body.dark-mode .creator-studio-wrapper h1,
        body.dark-mode .creator-studio-wrapper h2,
        body.dark-mode .creator-studio-wrapper h3,
        body.dark-mode .creator-studio-wrapper h4,
        body.dark-mode .creator-studio-wrapper h5,
        body.dark-mode .creator-studio-wrapper h6,
        body.dark-mode .creator-studio-wrapper .text-dark,
        .creator-studio-wrapper.dark-mode h1,
        .creator-studio-wrapper.dark-mode h2,
        .creator-studio-wrapper.dark-mode h3,
        .creator-studio-wrapper.dark-mode h4,
        .creator-studio-wrapper.dark-mode h5,
        .creator-studio-wrapper.dark-mode h6,
        .creator-studio-wrapper.dark-mode .text-dark {
          color: #ffffff !important;
        }

        body.dark-mode .creator-studio-wrapper .text-secondary,
        .creator-studio-wrapper.dark-mode .text-secondary {
          color: #cbd5e1 !important;
        }

        body.dark-mode .creator-studio-wrapper .text-muted,
        .creator-studio-wrapper.dark-mode .text-muted {
          color: #94a3b8 !important;
        }

        body.dark-mode .creator-studio-wrapper .modern-card,
        .creator-studio-wrapper.dark-mode .modern-card {
          background: #151a24 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
          color: #f8fafc !important;
        }

        body.dark-mode .creator-studio-wrapper .bg-white,
        .creator-studio-wrapper.dark-mode .bg-white {
          background-color: #151a24 !important;
          color: #f8fafc !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        body.dark-mode .creator-studio-wrapper .bg-light,
        .creator-studio-wrapper.dark-mode .bg-light {
          background-color: #1b212e !important;
          color: #f8fafc !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        body.dark-mode .creator-studio-wrapper .form-control,
        .creator-studio-wrapper.dark-mode .form-control {
          background-color: #1b212e !important;
          color: #f8fafc !important;
          border-color: rgba(255, 255, 255, 0.16) !important;
        }

        body.dark-mode .creator-studio-wrapper .input-group-text,
        .creator-studio-wrapper.dark-mode .input-group-text {
          background-color: #1b212e !important;
          color: #94a3b8 !important;
          border-color: rgba(255, 255, 255, 0.16) !important;
        }

        body.dark-mode .creator-studio-wrapper .btn-outline-secondary,
        .creator-studio-wrapper.dark-mode .btn-outline-secondary {
          color: #cbd5e1 !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }

        body.dark-mode .creator-studio-wrapper .btn-outline-secondary:hover,
        .creator-studio-wrapper.dark-mode .btn-outline-secondary:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }

        body.dark-mode .creator-studio-wrapper .btn-light,
        .creator-studio-wrapper.dark-mode .btn-light {
          background-color: #1b212e !important;
          color: #f8fafc !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }

        body.dark-mode .creator-studio-wrapper .list-group-item,
        .creator-studio-wrapper.dark-mode .list-group-item {
          background-color: #151a24 !important;
          color: #f8fafc !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        body.dark-mode .creator-studio-wrapper .modal-content,
        .creator-studio-wrapper.dark-mode .modal-content {
          background-color: #151a24 !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          color: #f8fafc !important;
        }

        body.dark-mode .creator-studio-wrapper .dropdown-menu,
        .creator-studio-wrapper.dark-mode .dropdown-menu {
          background-color: #151a24 !important;
          border: 1px solid rgba(255, 255, 255, 0.14) !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45) !important;
        }

        body.dark-mode .creator-studio-wrapper .dropdown-item,
        .creator-studio-wrapper.dark-mode .dropdown-item {
          color: #f8fafc !important;
        }

        body.dark-mode .creator-studio-wrapper .dropdown-item:hover,
        .creator-studio-wrapper.dark-mode .dropdown-item:hover,
        body.dark-mode .creator-studio-wrapper .dropdown-item:focus,
        .creator-studio-wrapper.dark-mode .dropdown-item:focus {
          background-color: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }

        body.dark-mode .creator-studio-wrapper .dropdown-divider,
        .creator-studio-wrapper.dark-mode .dropdown-divider {
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        body.dark-mode .creator-studio-wrapper table th,
        .creator-studio-wrapper.dark-mode table th {
          color: #94a3b8 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        body.dark-mode .creator-studio-wrapper table td,
        .creator-studio-wrapper.dark-mode table td {
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #f8fafc !important;
        }

        .creator-theme-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          color: var(--text-dark);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }

        .creator-theme-toggle-btn:hover {
          transform: translateY(-1px);
          border-color: var(--primary);
        }
      ` }} />

      {/* Top Navbar */}
      <nav className="creator-navbar">
        <div className="container-fluid d-flex justify-content-between align-items-center" style={{ maxWidth: '1240px', padding: '0 clamp(10px, 2.5vw, 24px)', flexWrap: 'wrap', gap: '8px' }}>
          <div className="d-flex align-items-center gap-4">
            <Link to="/unilms/creator/courses" className="creator-brand d-flex align-items-center gap-3 text-decoration-none">
              <div className="creator-brand-badge">
                <i className="fa-solid fa-clapperboard"></i>
              </div>
              <div>
                <div className="creator-brand-title">UniLMS</div>
                <div className="creator-brand-subtitle">Creator Studio</div>
              </div>
            </Link>

            <div className="d-none d-md-flex align-items-center gap-2">
              <Link to="/unilms/creator/courses" className={`creator-nav-link ${(!uri.includes('create') && !uri.includes('builder') && !uri.includes('preview')) ? 'active' : ''}`}>
                <i className="fa-solid fa-layer-group"></i> My Courses
              </Link>
              <Link to="/unilms/creator/create" className={`creator-nav-link ${uri.includes('create') ? 'active' : ''}`}>
                <i className="fa-solid fa-circle-plus"></i> + Create New Course
              </Link>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              id="creatorThemeToggleBtn"
              onClick={toggleTheme}
              className="creator-theme-toggle-btn"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <i className={isDarkMode ? "fa-solid fa-sun" : "fa-solid fa-moon"} style={{ color: isDarkMode ? "#FBBF24" : "#6366F1", fontSize: "13px" }}></i>
              <span className="d-none d-sm-inline">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>

            {/* User Profile Pill */}
            <div className="d-none d-sm-flex align-items-center">
              <div className="creator-user-pill">
                <div className="creator-avatar">
                  P
                </div>
                <div className="text-start pe-1">
                  <div className="fw-bold mb-1" style={{ fontSize: '0.85rem', lineHeight: '1', color: 'var(--text-dark)' }}>
                    Prof. Vikram Rao (Course Director)
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-muted)' }}>
                    Verified Creator
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button 
              type="button" 
              className="btn-sidebar-logout" 
              style={{ width: 'auto', padding: '6px 14px', borderRadius: '8px' }} 
              onClick={() => setShowLogoutModal(true)}
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>
      {/* Mobile Navigation Ribbon for screens <= 768px */}
      <div className="creator-mobile-nav">
        <Link to="/unilms/creator/courses" className={`creator-nav-link ${(!uri.includes('create') && !uri.includes('builder') && !uri.includes('preview')) ? 'active' : ''}`} style={{ fontSize: '12px', padding: '5px 12px' }}>
          <i className="fa-solid fa-layer-group"></i> My Courses
        </Link>
        <Link to="/unilms/creator/create" className={`creator-nav-link ${uri.includes('create') ? 'active' : ''}`} style={{ fontSize: '12px', padding: '5px 12px' }}>
          <i className="fa-solid fa-circle-plus"></i> + Create Course
        </Link>
        <Link to="/unilms/creator/builder" className={`creator-nav-link ${uri.includes('builder') ? 'active' : ''}`} style={{ fontSize: '12px', padding: '5px 12px' }}>
          <i className="fa-solid fa-screwdriver-wrench"></i> Studio Builder
        </Link>
        <Link to="/unilms/creator/preview" className={`creator-nav-link ${uri.includes('preview') ? 'active' : ''}`} style={{ fontSize: '12px', padding: '5px 12px' }}>
          <i className="fa-regular fa-eye"></i> Student View
        </Link>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '24px', padding: '32px 32px 28px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid var(--border-color, #E2E8F0)', animation: 'modalFadeIn 0.25s ease' }}>
            <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: 'var(--text-dark, #0F172A)' }}>Sign Out of LMS?</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--text-muted, #64748B)', lineHeight: '1.5' }}>Are you sure you want to end your creator studio session?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" onClick={() => setShowLogoutModal(false)} className="btn btn-outline" style={{ flex: '1', padding: '10px 18px', borderRadius: '12px', border: '1.5px solid var(--border-color, #E2E8F0)', background: 'transparent', color: 'var(--text-dark, #374151)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleLogout} className="btn btn-primary" style={{ flex: '1', padding: '10px 18px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)' }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="content-container">
        <Outlet />
      </div>

      {/* Logout Modal */}
      <div className="modal fade" id="logoutModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
          <div className="modal-content rounded-4 border-0 shadow-lg p-4 text-center">
            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle" style={{ width: '64px', height: '64px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
              <i className="fa-solid fa-arrow-right-from-bracket fa-2x"></i>
            </div>
            <h5 className="fw-bold mb-2 brand-font">Confirm Logout</h5>
            <p className="text-muted small mb-4">Are you sure you want to log out of Creator Studio? You will need to sign in again to create or edit courses.</p>
            <div className="d-flex justify-content-center gap-2">
              <button type="button" className="btn btn-light rounded-pill px-4 fw-semibold" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn-danger rounded-pill px-4 fw-semibold" onClick={handleLogout}>Yes, Logout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorLayout;
