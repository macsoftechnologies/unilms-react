import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import academicsService from '../../services/academics.service';
import { getCurrentAcademicYear, getAcademicYearOptions } from '../../utils/date';

const THEMES = [
  { id: 'purple', name: 'Royal Purple', color: '#7C3AED' },
  { id: 'blue', name: 'Sapphire Blue', color: '#2563EB' },
  { id: 'emerald', name: 'Emerald Green', color: '#059669' },
  { id: 'amber', name: 'Sunset Amber', color: '#D97706' },
  { id: 'rose', name: 'Crimson Rose', color: '#E11D48' },
  { id: 'teal', name: 'Deep Teal', color: '#0D9488' },
];

const NAV_ITEMS = [
  {
    path: '/unilms/analytics/dashboard',
    label: 'MIS Cockpit',
    icon: 'fa-solid fa-chart-pie',
    badge: 'Boardroom',
    badgeColor: '#7C3AED',
    desc: 'Master institutional KPIs & financials'
  },
  {
    path: '/unilms/analytics/joining_analytics',
    label: 'Admissions & Yield',
    icon: 'fa-solid fa-filter-circle-dollar',
    badge: '7-Stage',
    badgeColor: '#0284C7',
    desc: 'Pipeline drop-offs & lead channel ROI'
  },
  {
    path: '/unilms/analytics/student_analysis',
    label: 'Student 360°',
    icon: 'fa-solid fa-user-shield',
    badge: 'Early Alert',
    badgeColor: '#DC2626',
    desc: 'Attendance < 75%, backlogs & dossier'
  },
  {
    path: '/unilms/analytics/reports',
    label: 'Central Reports',
    icon: 'fa-solid fa-table-list',
    badge: 'SSR Audit',
    badgeColor: '#059669',
    desc: 'Statutory compliance & multi-format export'
  }
];

const EXECUTIVE_PORTALS = [
  {
    category: 'Executive Intelligence & Audit',
    links: [
      { path: '/unilms/analytics/dashboard', label: 'Institutional MIS Cockpit', icon: 'fa-solid fa-chart-pie', badge: 'Active' },
      { path: '/unilms/analytics/joining_analytics', label: 'Admissions & Yield Diagnostics', icon: 'fa-solid fa-filter-circle-dollar', badge: '7-Stage' },
      { path: '/unilms/analytics/student_analysis', label: 'Student 360° & Early Risk Radar', icon: 'fa-solid fa-user-shield', badge: 'Alerts' },
      { path: '/unilms/analytics/reports', label: 'NAAC / NIRF Statutory SSR Sheets', icon: 'fa-solid fa-award', badge: 'Ledgers' },
    ]
  },
  {
    category: 'Institutional Core Systems',
    links: [
      { path: '/unilms/org/admissions/dashboard', label: 'Admissions CRM & Enrollment', icon: 'fa-solid fa-id-card-clip' },
      { path: '/unilms/faculty/dashboard', label: 'Academic Instruction & Faculty', icon: 'fa-solid fa-chalkboard-user' },
      { path: '/unilms/org/mis/reports', label: 'Central Fee Collections & Aging', icon: 'fa-solid fa-sack-dollar' },
      { path: '/unilms/org/admissions/dashboard', label: 'Campus Admin Main Console', icon: 'fa-solid fa-building-columns' }
    ]
  }
];

const ExecutiveAnalyticsLayout = () => {
  const location = useLocation();
  const { currentTenant } = useTenant();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'dark' || (typeof document !== 'undefined' && document.body.classList.contains('dark-mode'));
  });
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('theme_accent') || localStorage.getItem('superadmin_theme') || 'purple';
  });
  const [session, setSession] = useState(getCurrentAcademicYear());
  const [academicYears, setAcademicYears] = useState([]);

  useEffect(() => {
    academicsService.getAcademicYears().then(res => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      setAcademicYears(list);
      if (list.length > 0) {
        const active = list.find(y => y.status === 'active' || y.isCurrent) || list[0];
        if (active && !session) setSession(active.name || active.year);
      }
    }).catch(() => {});
  }, []);

  // Dropdown & Mobile Menu States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalsDropdownOpen, setPortalsDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const portalsRef = useRef(null);
  const themeRef = useRef(null);
  const profileRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (portalsRef.current && !portalsRef.current.contains(e.target)) {
        setPortalsDropdownOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setPortalsDropdownOpen(false);
    setThemeDropdownOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.body.setAttribute('data-theme', activeTheme);
    localStorage.setItem('theme_accent', activeTheme);
  }, [activeTheme]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('joining_analytics') || p.includes('funnel')) return 'Admission ➔ Joining Pipeline & Yield Diagnostics';
    if (p.includes('student_analysis') || p.includes('at_risk')) return 'Student 360° Academic Radar & Retention Alerts';
    if (p.includes('reports')) return 'Institutional MIS Central Reports & NAAC SSR Ledgers';
    return 'Institutional MIS & Boardroom Executive Cockpit';
  };

  return (
    <div className="executive-analytics-app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', background: 'var(--bg-main, #F1F5F9)', color: 'var(--text-main, #0F172A)' }}>
      {/* Modern Top-Navigation CSS Rules */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .executive-topbar-primary {
          background: #0B1120;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(14px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }
        .executive-topbar-secondary {
          background: var(--bg-card, #ffffff);
          border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
          padding: 8px 28px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          position: sticky;
          top: 65px;
          z-index: 95;
          backdrop-filter: blur(14px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          min-height: 52px;
        }
        .analytics-top-nav-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .analytics-top-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          color: var(--text-muted, #64748B);
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          border-radius: 10px;
          background: transparent;
          border: 1.5px solid transparent;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          cursor: pointer;
        }
        .analytics-top-nav-link:hover {
          color: var(--text-main, #0F172A);
          background: var(--bg-main, #F1F5F9);
        }
        .analytics-top-nav-link.active {
          color: var(--primary, #4F46E5);
          background: rgba(99, 102, 241, 0.09);
          border-color: var(--primary, #4F46E5);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.12);
        }
        .analytics-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 0;
          background: var(--bg-main, #F1F5F9);
        }
        .analytics-page-body {
          flex: 1;
          width: 100%;
          max-width: 1720px;
          margin: 0 auto;
          padding: 24px 32px;
          box-sizing: border-box;
        }
        .nav-icon-badge {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          background: rgba(99, 102, 241, 0.1);
          color: var(--primary, #4F46E5);
          transition: all 0.2s ease;
        }
        .analytics-top-nav-link.active .nav-icon-badge {
          background: var(--primary, #4F46E5);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
        }
        .portal-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          width: 520px;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          padding: 16px;
          z-index: 110;
          margin-top: 6px;
          animation: fadeIn 0.15s ease;
        }
        .theme-popover-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 260px;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.18);
          padding: 16px;
          z-index: 110;
          animation: fadeIn 0.15s ease;
        }
        .mobile-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(11, 17, 32, 0.7);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          justify-content: flex-end;
          animation: fadeIn 0.2s ease;
        }
        .mobile-drawer-panel {
          width: 320px;
          max-width: 85vw;
          height: 100%;
          background: #0B1120;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          box-shadow: -10px 0 35px rgba(0,0,0,0.6);
        }
        @media (max-width: 1024px) {
          .desktop-nav-tabs-wrapper {
            display: none !important;
          }
          .mobile-hamburger-btn {
            display: inline-flex !important;
          }
          .analytics-page-body {
            padding: 16px;
          }
          .executive-topbar-primary {
            padding: 10px 16px;
          }
          .executive-topbar-secondary {
            padding: 8px 16px;
          }
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}} />

      {/* ========================================================================= */}
      {/* 1. PRIMARY TOP NAVIGATION BAR (Sticky Brand & Global Utilities)          */}
      {/* ========================================================================= */}
      <header className="executive-topbar-primary">
        {/* Left: Brand Identity & Campus Live Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/unilms/analytics/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 50%, #EC4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '18px',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              flexShrink: 0
            }}>
              <i className="fa-solid fa-chart-line"></i>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px', fontFamily: "'Outfit', sans-serif" }}>
                Unilms Intelligence
              </div>
              <div style={{ fontSize: '9.5px', fontWeight: '800', letterSpacing: '0.8px', color: '#A78BFA', textTransform: 'uppercase' }}>
                Executive Suite &bull; v3.2
              </div>
            </div>
          </Link>

          {/* Institutional Badge (Desktop) */}
          <div className="hide-on-mobile" style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#F1F5F9' }}>{currentTenant?.name || 'Institution Portal'}</span>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', fontSize: '9.5px', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              NAAC A++
            </span>
            <div style={{ fontSize: '10px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' }}></span>
              Telemetry Live
            </div>
          </div>
        </div>

        {/* Right: Session Selector, Print Dossier, Theme Popover, Profile, Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Academic Session Selector */}
          <div className="hide-on-mobile" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '5px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <i className="fa-regular fa-calendar-days" style={{ color: '#A78BFA', fontSize: '13px' }}></i>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                color: '#ffffff',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {academicYears.length > 0 ? (
                academicYears.map(ay => (
                  <option key={ay.id} value={ay.name || ay.year} style={{ background: '#0B1120', color: '#ffffff' }}>
                    AY {ay.name || ay.year} {ay.status === 'active' ? '(Active)' : ''}
                  </option>
                ))
              ) : (
                getAcademicYearOptions().map(opt => (
                  <option key={opt} value={opt} style={{ background: '#0B1120', color: '#ffffff' }}>AY {opt}</option>
                ))
              )}
            </select>
          </div>

          {/* Print Boardroom Dossier */}
          <button
            type="button"
            onClick={() => window.print()}
            className="hide-on-mobile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-file-pdf"></i>
            <span>Print Dossier</span>
          </button>

          {/* Theme & Display Mode Dropdown Trigger */}
          <div ref={themeRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              title="Theme & Display Settings"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <i className="fa-solid fa-palette" style={{ color: THEMES.find(t => t.id === activeTheme)?.color || '#A78BFA' }}></i>
            </button>

            {themeDropdownOpen && (
              <div className="theme-popover-menu">
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Accent Theme
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '14px' }}>
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTheme(t.id)}
                      title={t.name}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: t.color,
                        border: activeTheme === t.id ? '2px solid var(--text-main)' : '1px solid rgba(0,0,0,0.15)',
                        boxShadow: activeTheme === t.id ? `0 0 8px ${t.color}` : 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transform: activeTheme === t.id ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                    />
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>Display Mode</span>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      style={{
                        background: 'var(--bg-main, #f1f5f9)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`} style={{ color: isDarkMode ? '#FBBF24' : '#64748B' }}></i>
                      <span>{isDarkMode ? 'Light' : 'Dark'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Return to Admin Button */}
          <Link
            to="/unilms/org/admissions/dashboard"
            className="hide-on-mobile"
            title="Return to Admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '9px',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Admin</span>
          </Link>

          {/* Profile Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '3px 10px 3px 4px',
            borderRadius: '25px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                minWidth: '30px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '12px',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.35)',
                textTransform: 'uppercase'
              }}
            >
              RA
            </div>
            <div className="hide-on-mobile">
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#ffffff', lineHeight: '1.1' }}>Root Administrator</div>
              <div style={{ fontSize: '9.5px', color: '#10B981', fontWeight: '700' }}>Chief Academic Officer</div>
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. SECONDARY TOP NAVIGATION BAR (Horizontal Tabs & More Dropdown)         */}
      {/* ========================================================================= */}
      <nav className="executive-topbar-secondary desktop-nav-tabs-wrapper">
        <div className="analytics-top-nav-tabs">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.includes(item.path) || (item.path.includes('dashboard') && location.pathname === '/unilms/analytics');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`analytics-top-nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon-badge">
                  <i className={item.icon}></i>
                </span>
                <span>{item.label}</span>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: isActive ? item.badgeColor : 'rgba(0,0,0,0.06)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.15s ease'
                }}>
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 3. MOBILE OFFCANVAS DRAWER MENU                                          */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px' }}>
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: '#ffffff' }}>Unilms Executive</div>
                  <div style={{ fontSize: '10px', color: '#A78BFA' }}>Suite v3.2 &bull; NAAC A++</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                Executive Navigation
              </div>

              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname.includes(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      background: isActive ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)' : 'rgba(255, 255, 255, 0.04)',
                      border: isActive ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
                      color: isActive ? '#ffffff' : '#94A3B8',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isActive ? item.badgeColor : 'rgba(255, 255, 255, 0.08)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                      <i className={item.icon}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#ffffff' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{item.desc}</div>
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', background: item.badgeColor, color: '#fff' }}>
                      {item.badge}
                    </span>
                  </Link>
                );
              })}

              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '16px', marginBottom: '4px' }}>
                Operational Switcher
              </div>
              <Link
                to="/unilms/org/admissions/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#CBD5E1',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Return to Admin</span>
              </Link>
            </div>

            {/* Mobile Footer (Session & Appearance) */}
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: '#070A12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '700' }}>Theme Accent</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTheme(t.id)}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: t.color,
                        border: activeTheme === t.id ? '2px solid #ffffff' : 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#CBD5E1', fontWeight: '600' }}>Mode</span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} me-1`}></i>
                  {isDarkMode ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MAIN BODY CONTAINER (Full Available Page Width)                        */}
      {/* ========================================================================= */}
      <div className="analytics-main-content">
        <main className="analytics-page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ExecutiveAnalyticsLayout;
