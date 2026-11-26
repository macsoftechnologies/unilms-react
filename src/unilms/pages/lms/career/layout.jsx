import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useTenant } from '../../../context/TenantContext';
import '../../../career.css';

const LmsCareerLayout = () => {
  const { currentTenant, tenant } = useTenant();
  const activeTenant = currentTenant || tenant;
  const isLmsEnabled = activeTenant ? (activeTenant.lmsEnabled !== false && activeTenant.lms_enabled !== false) : true;
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const user = (() => { try { return JSON.parse(localStorage.getItem('unilms_user') || '{}'); } catch { return {}; } })();
  const studentInitial = (user.name || user.firstName || 'Student').charAt(0).toUpperCase();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setShowPalette(false);
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
    { id: 'purple', name: 'Purple', color: '#6366f1' },
    { id: 'blue', name: 'Blue', color: '#2563eb' },
    { id: 'emerald', name: 'Emerald', color: '#059669' },
    { id: 'amber', name: 'Amber', color: '#ea580c' },
    { id: 'rose', name: 'Rose', color: '#e11d48' },
    { id: 'teal', name: 'Teal', color: '#0d9488' }
  ];

  if (!isLmsEnabled) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '40px 32px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>
            <i className="fa-solid fa-lock"></i>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>LMS Feature Restricted</h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            Next-Gen LMS Cloud is currently not enabled for <strong>{activeTenant?.name || 'this institution'}</strong>. Please contact your campus IT administrator to activate the LMS license.
          </p>
          <Link to="/unilms/lms/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }}>
            <i className="fa-solid fa-arrow-left"></i> Return to Student Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="career-layout-container">
      <style>{`
        .career-topbar {
          padding: 0 32px;
          height: 64px;
        }
        .career-main-content {
          padding: 32px 36px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        .career-right-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .career-portal-text, .career-logout-text {
          display: inline;
        }
        @media (max-width: 768px) {
          .career-topbar {
            padding: 0 12px !important;
            height: 56px !important;
          }
          .career-main-content {
            padding: 16px 12px !important;
          }
          .career-right-actions {
            gap: 6px !important;
          }
          .career-portal-btn {
            padding: 6px 10px !important;
            font-size: 11.5px !important;
          }
          .career-portal-text, .career-logout-text {
            display: none !important;
          }
          .btn-sidebar-logout {
            padding: 6px 10px !important;
          }
        }
        @media (max-width: 380px) {
          .career-topbar {
            padding: 0 8px !important;
          }
          .career-main-content {
            padding: 12px 8px !important;
          }
        }
      `}</style>
      {/* Top Navbar matching Image 2 */}
      <nav className="career-topbar" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <Link to="/unilms/lms/learn" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '15px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}>
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '17px', fontWeight: '800', color: '#ffffff' }}>
              Uni<span style={{
                background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>LMS</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="d-none d-md-flex">
            <Link
              to="/unilms/lms/learn"
              className={`ct-nav-link ${path.includes('/learn') ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none',
                color: path.includes('/learn') ? '#ffffff' : '#94a3b8',
                background: path.includes('/learn') ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2))' : 'transparent',
                boxShadow: path.includes('/learn') ? 'inset 0 0 0 1px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <i className="fa-solid fa-play-circle" style={{ color: path.includes('/learn') ? '#a78bfa' : 'inherit' }}></i>
              <span>Masterclasses</span>
            </Link>

            <Link
              to="/unilms/lms/career/resume"
              className={`ct-nav-link ${path.includes('/resume') ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none',
                color: path.includes('/resume') ? '#ffffff' : '#94a3b8',
                background: path.includes('/resume') ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2))' : 'transparent',
                boxShadow: path.includes('/resume') ? 'inset 0 0 0 1px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <i className="fa-solid fa-file-lines"></i>
              <span>Resume</span>
            </Link>

            <Link
              to="/unilms/lms/career/mock_interview"
              className={`ct-nav-link ${path.includes('/mock_interview') ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none',
                color: path.includes('/mock_interview') ? '#ffffff' : '#94a3b8',
                background: path.includes('/mock_interview') ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2))' : 'transparent',
                boxShadow: path.includes('/mock_interview') ? 'inset 0 0 0 1px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <i className="fa-solid fa-microphone-lines"></i>
              <span>Interviews</span>
            </Link>

            <Link
              to="/unilms/lms/career/portfolio"
              className={`ct-nav-link ${path.includes('/portfolio') ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none',
                color: path.includes('/portfolio') ? '#ffffff' : '#94a3b8',
                background: path.includes('/portfolio') ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2))' : 'transparent',
                boxShadow: path.includes('/portfolio') ? 'inset 0 0 0 1px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <i className="fa-solid fa-globe"></i>
              <span>Portfolio</span>
            </Link>

            <Link
              to="/unilms/lms/career"
              className={`ct-nav-link ${path === '/unilms/lms/career' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none',
                color: path === '/unilms/lms/career' ? '#ffffff' : '#94a3b8',
                background: path === '/unilms/lms/career' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2))' : 'transparent',
                boxShadow: path === '/unilms/lms/career' ? 'inset 0 0 0 1px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <i className="fa-solid fa-th-large"></i>
              <span>Hub</span>
            </Link>
          </div>
        </div>

        {/* Right side actions */}
        <div className="career-right-actions">
          <Link
            to="/unilms/lms/dashboard"
            className="career-portal-btn"
            title="Back to Student Portal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-arrow-left"></i> <span className="career-portal-text">Student Portal</span>
          </Link>

          <button
            type="button"
            className="btn-sidebar-logout"
            onClick={() => setShowLogoutModal(true)}
            title="Sign Out"
            style={{ width: 'auto', padding: '6px 14px', borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span className="career-logout-text ms-1">Sign Out</span>
          </button>

          <div 
            ref={paletteRef}
            className="theme-control-box" 
            style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 6px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <button 
              type="button" 
              className={`theme-btn ${showPalette ? 'active' : ''}`}
              title="Theme Color" 
              onClick={() => setShowPalette(!showPalette)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: showPalette ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                border: showPalette ? '2px solid #ffffff' : '2px solid transparent',
                color: showPalette ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0
              }}
            >
              <i className="fa-solid fa-palette"></i>
            </button>
            <button 
              type="button" 
              className="theme-btn" 
              title="Toggle Dark/Light Mode" 
              onClick={handleToggleDarkMode}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '2px solid transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0
              }}
            >
              <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>

            {/* Palette Modal Dropdown */}
            {showPalette && (
              <div 
                style={{
                  position: 'absolute',
                  right: '0',
                  top: '48px',
                  zIndex: 1000,
                  background: '#111827',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '18px',
                  padding: '16px 20px',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
                  width: '240px'
                }}
              >
                <div style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  color: '#94a3b8',
                  marginBottom: '12px',
                  letterSpacing: '0.6px',
                  fontFamily: "'Outfit', sans-serif"
                }}>
                  Theme Color
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
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

          {/* User Avatar */}
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '14px',
            boxShadow: '0 3px 10px rgba(99, 102, 241, 0.4)'
          }}>
            {studentInitial}
          </div>

          <button
            type="button"
            className="d-md-none"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>
      </nav>

      {/* Mobile nav menu */}
      {mobileOpen && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.98)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <Link onClick={() => setMobileOpen(false)} to="/unilms/lms/learn" style={{ color: '#fff', textDecoration: 'none', padding: '8px 0', fontWeight: '600' }}><i className="fa-solid fa-play-circle me-2"></i> Masterclasses</Link>
          <Link onClick={() => setMobileOpen(false)} to="/unilms/lms/career/resume" style={{ color: '#fff', textDecoration: 'none', padding: '8px 0', fontWeight: '600' }}><i className="fa-solid fa-file-lines me-2"></i> Resume Builder</Link>
          <Link onClick={() => setMobileOpen(false)} to="/unilms/lms/career/mock_interview" style={{ color: '#fff', textDecoration: 'none', padding: '8px 0', fontWeight: '600' }}><i className="fa-solid fa-microphone-lines me-2"></i> Mock Interviews</Link>
          <Link onClick={() => setMobileOpen(false)} to="/unilms/lms/career/portfolio" style={{ color: '#fff', textDecoration: 'none', padding: '8px 0', fontWeight: '600' }}><i className="fa-solid fa-globe me-2"></i> Digital Portfolio</Link>
          <Link onClick={() => setMobileOpen(false)} to="/unilms/lms/career" style={{ color: '#fff', textDecoration: 'none', padding: '8px 0', fontWeight: '600' }}><i className="fa-solid fa-th-large me-2"></i> Career Hub</Link>
        </div>
      )}

      {/* Page Body */}
      <main className="career-main-content">
        <React.Suspense fallback={
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ width: '28px', height: '28px', border: '2.5px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'unilmsSpin 0.75s linear infinite' }} />
          </div>
        }>
          <Outlet />
        </React.Suspense>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px 32px 28px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0', animation: 'modalFadeIn 0.25s ease' }}>
            <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>Sign Out of LMS?</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748B', lineHeight: '1.5' }}>Are you sure you want to end your student session?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" onClick={() => setShowLogoutModal(false)} className="btn btn-outline" style={{ flex: '1', padding: '10px 18px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: 'transparent', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={() => { setShowLogoutModal(false); navigate('/unilms/lms/login'); }} className="btn btn-primary" style={{ flex: '1', padding: '10px 18px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)' }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LmsCareerLayout;