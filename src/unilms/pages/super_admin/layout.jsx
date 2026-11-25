import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const THEMES = [
  { id: 'purple', name: 'Royal Purple', color: '#7C3AED' },
  { id: 'blue', name: 'Sapphire Blue', color: '#2563EB' },
  { id: 'emerald', name: 'Emerald Green', color: '#059669' },
  { id: 'amber', name: 'Sunset Amber', color: '#D97706' },
  { id: 'rose', name: 'Crimson Rose', color: '#E11D48' },
  { id: 'teal', name: 'Deep Teal', color: '#0D9488' },
];

const SuperAdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [pageTitle, setPageTitle] = useState('Dashboard');
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const storedTheme = localStorage.getItem('theme');
        return storedTheme === 'dark' || (typeof document !== 'undefined' && document.body.classList.contains('dark-mode'));
    });
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const userDropdownRef = useRef(null);
    const [showPalette, setShowPalette] = useState(false);
    const paletteRef = useRef(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
                setShowUserDropdown(false);
            }
            if (paletteRef.current && !paletteRef.current.contains(e.target)) {
                setShowPalette(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const [activeTheme, setActiveTheme] = useState(() => {
        return localStorage.getItem('theme_accent') || localStorage.getItem('superadmin_theme') || 'blue';
    });

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

    const toggleTheme = () => {
        setIsDarkMode((prev) => !prev);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', activeTheme);
        document.body.setAttribute('data-theme', activeTheme);
        localStorage.setItem('theme_accent', activeTheme);
        localStorage.setItem('superadmin_theme', activeTheme);
    }, [activeTheme]);

    useEffect(() => {
        const path = location.pathname;
        if (path.includes('organizations')) setPageTitle('Organizations');
        else if (path.includes('org_form')) setPageTitle('Create New Organization');
        else if (path.includes('expiring')) setPageTitle('Expiring Soon');
        else if (path.includes('plans')) setPageTitle('Plans & Packages');
        else if (path.includes('payments')) setPageTitle('Payments');
        else if (path.includes('users')) setPageTitle('Admins');
        else if (path.includes('creators')) setPageTitle('Content Creators');
        else if (path.includes('activity_logs')) setPageTitle('Activity Logs');
        else if (path.includes('settings')) setPageTitle('Settings');
        else setPageTitle('Dashboard');
    }, [location]);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                /* Brand Header */
                .superadmin-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .superadmin-brand-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #6366F1 0%, #3B82F6 50%, #06B6D4 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                    font-size: 16px;
                    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.45);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    flex-shrink: 0;
                }
                .superadmin-brand-text {
                    line-height: 1.2;
                }
                .superadmin-title {
                    font-size: 16.5px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.3px;
                    font-family: 'Outfit', sans-serif;
                }
                .superadmin-subtitle {
                    font-size: 8px;
                    font-weight: 700;
                    letter-spacing: 0.9px;
                    color: #93C5FD;
                    text-transform: uppercase;
                }

                /* Navigation Items */
                .superadmin-layout .sidebar .nav-item {
                    border-radius: 10px !important;
                    margin-bottom: 5px !important;
                    padding: 0 12px !important;
                    height: 40px !important;
                    font-size: 13.5px !important;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    color: rgba(255, 255, 255, 0.84) !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                    text-decoration: none !important;
                }
                .superadmin-layout .sidebar .nav-item:hover {
                    background: rgba(255, 255, 255, 0.12) !important;
                    color: #ffffff !important;
                    transform: none !important;
                }
                .superadmin-layout .sidebar .nav-item.active {
                    background: #FFFFFF !important;
                    color: #1E3A8A !important;
                    font-weight: 700 !important;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.28), 0 1px 3px rgba(0, 0, 0, 0.1) !important;
                    transform: none !important;
                }
                .superadmin-layout .sidebar .nav-item.active i {
                    color: #2563EB !important;
                    font-size: 14.5px !important;
                }
                .superadmin-layout .sidebar .nav-item.active span {
                    color: #1E3A8A !important;
                    font-weight: 700 !important;
                }

                /* Dark mode active item contrast */
                body.dark-mode .superadmin-layout .sidebar .nav-item.active,
                html.dark-mode .superadmin-layout .sidebar .nav-item.active {
                    background: #FFFFFF !important;
                    color: #0F172A !important;
                    box-shadow: 0 4px 22px rgba(0, 0, 0, 0.55) !important;
                }
                body.dark-mode .superadmin-layout .sidebar .nav-item.active i,
                html.dark-mode .superadmin-layout .sidebar .nav-item.active i {
                    color: #2563EB !important;
                }
                body.dark-mode .superadmin-layout .sidebar .nav-item.active span,
                html.dark-mode .superadmin-layout .sidebar .nav-item.active span {
                    color: #0F172A !important;
                }

                .superadmin-layout .topbar {
                    padding: 8px 20px 4px !important;
                }
                .superadmin-layout .content-body {
                    padding: 12px 20px 28px !important;
                    width: 100% !important;
                    min-width: 0 !important;
                    box-sizing: border-box !important;
                    flex: 1;
                }

                /* Desktop specific rules */
                @media (min-width: 769px) {
                    .superadmin-layout .sidebar {
                        width: 240px !important;
                        position: relative !important;
                        display: flex !important;
                        flex-direction: column !important;
                        border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
                        box-shadow: 6px 0 35px rgba(2, 6, 23, 0.6) !important;
                        transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
                        flex-shrink: 0 !important;
                    }
                    .superadmin-layout .mobile-sidebar-toggle {
                        display: none !important;
                    }
                    .superadmin-layout .mobile-sidebar-close-btn {
                        display: none !important;
                    }
                    .superadmin-layout .sidebar-backdrop {
                        display: none !important;
                    }
                }

                /* Mobile specific rules: Fixes the giant empty gap at top! */
                @media (max-width: 768px) {
                    .superadmin-layout.body-wrapper,
                    .superadmin-layout .app-container {
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        min-height: 100vh !important;
                        height: auto !important;
                        overflow-x: hidden !important;
                    }
                    .superadmin-layout .sidebar {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        bottom: 0 !important;
                        width: 280px !important;
                        max-width: 85vw !important;
                        height: 100vh !important;
                        z-index: 1050 !important;
                        display: flex !important;
                        flex-direction: column !important;
                        transform: translateX(-100%) !important;
                        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding-top: 14px !important;
                        border-right: 1px solid rgba(255, 255, 255, 0.12) !important;
                    }
                    .superadmin-layout .sidebar.mobile-open {
                        transform: translateX(0) !important;
                        box-shadow: 0 0 50px rgba(0, 0, 0, 0.75) !important;
                    }
                    .superadmin-layout .main-content {
                        margin-left: 0 !important;
                        width: 100% !important;
                        min-width: 0 !important;
                        padding-top: 0 !important;
                        margin-top: 0 !important;
                        min-height: 100vh !important;
                        overflow-x: hidden !important;
                    }
                    .superadmin-layout .topbar {
                        position: sticky !important;
                        top: 0 !important;
                        z-index: 100 !important;
                        margin: 0 !important;
                        padding: 8px 14px !important;
                    }
                    .superadmin-layout .content-body {
                        padding: 10px 12px 24px !important;
                    }
                    .superadmin-layout .mobile-sidebar-toggle {
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                    .superadmin-layout .mobile-sidebar-close-btn {
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                }
            ` }} />

            <div className="html-wrapper" lang="en">
                <div className="body-wrapper superadmin-layout">
                    <div className="app-container">
                        {/* Mobile Sidebar Backdrop */}
                        <div 
                            className={`sidebar-backdrop ${isMobileSidebarOpen ? 'active' : ''}`}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            aria-hidden="true"
                            style={{
                                display: isMobileSidebarOpen ? 'block' : 'none',
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0, 0, 0, 0.65)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 1040
                            }}
                        />

                        <aside className={`sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
                            <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 14px' }}>
                                <div className="superadmin-brand">
                                    <div className="superadmin-brand-icon">
                                        <i className="fa-solid fa-layer-group"></i>
                                    </div>
                                    <div className="superadmin-brand-text">
                                        <div className="superadmin-title">SuperAdmin</div>
                                        <div className="superadmin-subtitle">Executive Suite</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="mobile-sidebar-close-btn"
                                    onClick={() => setIsMobileSidebarOpen(false)}
                                    aria-label="Close navigation menu"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.12)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#ffffff',
                                        width: '32px',
                                        height: '32px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            <nav className="sidebar-nav">
                                <Link to="/unilms/superadmin/dashboard" className={`nav-item ${location.pathname.includes('dashboard') ? 'active' : ''}`}>
                                    <i className="fa-solid fa-chart-pie"></i>
                                    <span>Dashboard</span>
                                </Link>

                                <Link to="/unilms/superadmin/organizations" className={`nav-item ${location.pathname.includes('organization') || location.pathname.includes('org_form') ? 'active' : ''}`}>
                                    <i className="fa-solid fa-building"></i>
                                    <span>Organizations</span>
                                </Link>
                                <Link to="/unilms/superadmin/expiring" className={`nav-item ${location.pathname.includes('expiring') ? 'active' : ''}`}>
                                    <i className="fa-solid fa-clock"></i>
                                    <span>Expiring Soon</span>
                                </Link>

                                <Link to="/unilms/superadmin/plans" className={`nav-item ${location.pathname.includes('plans') ? 'active' : ''}`}>
                                    <i className="fa-solid fa-tags"></i>
                                    <span>Plans & Packages</span>
                                </Link>

                                <Link to="/unilms/superadmin/payments" className={`nav-item ${location.pathname.includes('payments') ? 'active' : ''}`}>
                                    <i className="fa-solid fa-credit-card"></i>
                                    <span>Payments</span>
                                </Link>

                                <Link to="/unilms/superadmin/users" className={`nav-item ${location.pathname.includes('users') ? 'active' : ''}`}>
                                    <i className="fa-solid fa-users-gear"></i>
                                    <span>Admins</span>
                                </Link>
                                <Link to="/unilms/superadmin/creators" className={`nav-item ${location.pathname.includes('creators') ? 'active' : ''}`}>
                                    <i className="fa-solid fa-chalkboard-user"></i>
                                    <span>Content Creators</span>
                                </Link>

                                <Link to="/unilms/superadmin/activity_logs" className={`nav-item ${location.pathname.includes('logs') ? 'active' : ''}`}>
                                    <i className="fa-solid fa-clipboard-list"></i>
                                    <span>Activity Logs</span>
                                </Link>
                                <Link to="/unilms/superadmin/settings" className={`nav-item ${location.pathname.includes('settings') ? 'active' : ''}`}>
                                    <i className="fa-solid fa-cogs"></i>
                                    <span>Settings</span>
                                </Link>
                            </nav>
                        </aside>


                        <main className="main-content">

                            <header className="topbar">
                                <div className="topbar-main-row">
                                    <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button 
                                            type="button" 
                                            className="mobile-sidebar-toggle" 
                                            onClick={() => setIsMobileSidebarOpen(prev => !prev)}
                                            aria-label="Toggle navigation menu"
                                            style={{
                                                background: 'var(--bg-card, #ffffff)',
                                                border: '1px solid var(--border-color, #e2e8f0)',
                                                borderRadius: '10px',
                                                width: '34px',
                                                height: '34px',
                                                cursor: 'pointer',
                                                color: 'var(--text-main, #1e293b)',
                                                fontSize: '15px',
                                                flexShrink: 0
                                            }}
                                        >
                                            <i className="fa-solid fa-bars"></i>
                                        </button>
                                        <h1 id="page-title">{pageTitle}</h1>
                                    </div>
                                    <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        {/* Theme & Color Picker Trigger */}
                                        <div className="theme-palette-picker" ref={paletteRef} style={{ position: 'relative' }}>
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPalette(!showPalette)} 
                                                className="paletteBtn" 
                                                style={{ 
                                                    background: 'var(--bg-card, #ffffff)', 
                                                    border: '2px solid var(--border-color, #cbd5e1)', 
                                                    borderRadius: '50%', 
                                                    width: '36px', 
                                                    height: '36px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    cursor: 'pointer', 
                                                    color: 'var(--text-main)', 
                                                    transition: 'all 0.2s ease', 
                                                    boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))', 
                                                    fontSize: '16px', 
                                                    padding: 0 
                                                }} 
                                                title="Theme & Color Customizer"
                                            >
                                                🎨
                                            </button>
                                            {showPalette && (
                                                <div id="paletteDropdown" style={{ 
                                                    display: 'block', 
                                                    position: 'absolute', 
                                                    right: 0, 
                                                    top: '44px', 
                                                    zIndex: 9999, 
                                                    background: 'var(--bg-card, #ffffff)', 
                                                    border: '1px solid var(--border-color, #e2e8f0)', 
                                                    borderRadius: '14px', 
                                                    padding: '12px 14px', 
                                                    boxShadow: '0 12px 28px rgba(0,0,0,0.18)', 
                                                    width: '220px', 
                                                    maxWidth: 'calc(100vw - 20px)', 
                                                    boxSizing: 'border-box', 
                                                    animation: 'fadeIn 0.2s ease' 
                                                }}>
                                                    <div style={{ fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted, #64748b)', marginBottom: '8px', letterSpacing: '0.4px' }}>
                                                        Theme Accent Color
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '12px' }}>
                                                        {THEMES.map((t) => {
                                                            const isSelected = activeTheme === t.id;
                                                            return (
                                                                <button
                                                                    key={t.id}
                                                                    type="button"
                                                                    onClick={() => { setActiveTheme(t.id); setShowPalette(false); }}
                                                                    title={t.name}
                                                                    style={{
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        borderRadius: '50%',
                                                                        background: t.color,
                                                                        border: '2px solid #ffffff',
                                                                        boxShadow: isSelected 
                                                                            ? `0 0 0 2px #ffffff, 0 0 10px ${t.color}` 
                                                                            : `0 0 0 1.5px ${t.color}`,
                                                                        cursor: 'pointer',
                                                                        padding: 0,
                                                                        outline: 'none',
                                                                        transition: 'all 0.2s ease',
                                                                        transform: isSelected ? 'scale(1.15)' : 'scale(1)'
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                    <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-main, #1e293b)' }}>Dark Theme</span>
                                                        <button 
                                                            type="button" 
                                                            id="theme-toggle-btn" 
                                                            onClick={toggleTheme} 
                                                            style={{ 
                                                                background: isDarkMode ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-main, #f1f5f9)', 
                                                                border: '1px solid var(--border-color, #cbd5e1)', 
                                                                borderRadius: '16px', 
                                                                padding: '3px 8px', 
                                                                fontSize: '10.5px', 
                                                                fontWeight: '600', 
                                                                cursor: 'pointer', 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: '4px', 
                                                                color: 'var(--text-main, #1e293b)' 
                                                            }}
                                                        >
                                                            <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`} style={{ color: isDarkMode ? '#FBBF24' : '#64748b' }}></i>
                                                            <span>Toggle</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* User Profile Container with Click Dropdown */}
                                        <div className="user-profile-dropdown-wrapper" ref={userDropdownRef} style={{ position: 'relative' }}>
                                            <div 
                                                className="user-profile" 
                                                onClick={() => setShowUserDropdown(prev => !prev)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '4px 12px 4px 4px',
                                                    borderRadius: '30px',
                                                    border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                                                    background: 'var(--bg-card, #ffffff)',
                                                    cursor: 'pointer',
                                                    boxShadow: showUserDropdown ? '0 4px 14px rgba(0,0,0,0.1)' : 'var(--shadow-sm)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                title="Click to view Executive Intelligence & Account Options"
                                            >
                                                <img src="https://i.pravatar.cc/150?img=11" alt="Super Admin" className="avatar" style={{ width: '34px', height: '34px', borderRadius: '50%' }} />
                                                <div className="user-info" style={{ textAlign: 'left', lineHeight: '1.2' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span className="user-name" style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>{user?.name || 'Chief Administrator'}</span>
                                                        <i className={`fa-solid fa-chevron-down`} style={{ fontSize: '10px', color: 'var(--text-muted)', transition: 'transform 0.2s ease', transform: showUserDropdown ? 'rotate(180deg)' : 'none' }}></i>
                                                    </div>
                                                    <span className="user-role" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.email || 'Global Superuser'}</span>
                                                </div>
                                            </div>

                                            {/* The Header Dropdown Menu */}
                                            {showUserDropdown && (
                                                <div 
                                                    style={{
                                                        position: 'absolute',
                                                        top: 'calc(100% + 10px)',
                                                        right: 0,
                                                        width: '230px',
                                                        background: 'var(--bg-card, #ffffff)',
                                                        border: '1px solid var(--border-color, rgba(0,0,0,0.1))',
                                                        borderRadius: '16px',
                                                        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.18)',
                                                        padding: '14px',
                                                        zIndex: 9999,
                                                        animation: 'fadeIn 0.18s ease-out'
                                                    }}
                                                >
                                                    {/* User Identity Header */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                                        <img src="https://i.pravatar.cc/150?img=11" alt="Super Admin" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                                        <div>
                                                            <div style={{ fontWeight: '800', fontSize: '13.5px', color: 'var(--text-main)' }}>{user?.name || 'Root Administrator'}</div>
                                                            <div style={{ fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                                                                {user?.email || 'Active Superuser'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Section: Platform Settings & Sign out */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                setShowUserDropdown(false);
                                                                setShowLogoutModal(true);
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                padding: '7px 10px',
                                                                borderRadius: '8px',
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#DC2626',
                                                                fontSize: '12px',
                                                                fontWeight: '700',
                                                                cursor: 'pointer',
                                                                textAlign: 'left',
                                                                width: '100%',
                                                                marginTop: '4px'
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '16px' }}></i>
                                                            <span>Sign Out of Platform</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </header>

                            {/* Alerts (Hidden by default since there's no backend session) */}
                            {/* 
            <div id="flash-alert-box" style={{"margin":"16px 32px 0","padding":"12px 20px","background":"rgba(34, 197, 94, 0.12)","border":"1px solid rgba(34, 197, 94, 0.35)","borderRadius":"10px","color":"#16A34A","fontWeight":"600","fontSize":"14px","display":"flex","alignItems":"center","justifyContent":"space-between","animation":"modalFadeIn 0.3s ease","transition":"opacity 0.5s ease, transform 0.5s ease"}}>
                <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
                    <i className="fa-solid fa-circle-check" style={{"fontSize":"16px"}}></i>
                    <span>Success Message</span>
                </div>
                <button type="button" onClick={() => {}} style={{"background":"none","border":"none","color":"#16A34A","fontSize":"18px","cursor":"pointer","padding":"0 4px"}}>&times;</button>
            </div>
            
            <div id="flash-alert-box" style={{"margin":"16px 32px 0","padding":"12px 20px","background":"rgba(239, 68, 68, 0.12)","border":"1px solid rgba(239, 68, 68, 0.35)","borderRadius":"10px","color":"#DC2626","fontWeight":"600","fontSize":"14px","display":"flex","alignItems":"center","justifyContent":"space-between","animation":"modalFadeIn 0.3s ease","transition":"opacity 0.5s ease, transform 0.5s ease"}}>
                <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
                    <i className="fa-solid fa-circle-exclamation" style={{"fontSize":"16px"}}></i>
                    <span>Error Message</span>
                </div>
                <button type="button" onClick={() => {}} style={{"background":"none","border":"none","color":"#DC2626","fontSize":"18px","cursor":"pointer","padding":"0 4px"}}>&times;</button>
            </div>
            */}

                            <div className="content-body">
                                <Outlet />
                            </div>

                        </main>
                    </div>


                    <div id="logoutModal" style={{ "display": showLogoutModal ? "flex" : "none", "position": "fixed", "inset": "0", "zIndex": "9999", "background": "rgba(0,0,0,0.6)", "backdropFilter": "blur(6px)", "alignItems": "center", "justifyContent": "center" }}>
                        <div style={{ "background": "var(--card-bg, #fff)", "borderRadius": "24px", "padding": "32px 32px 28px", "maxWidth": "400px", "width": "90%", "textAlign": "center", "boxShadow": "0 20px 40px rgba(0,0,0,0.25)", "border": "1px solid var(--border-color, #e2e8f0)", "animation": "modalFadeIn 0.25s ease" }}>
                            <div style={{ "width": "56px", "height": "56px", "margin": "0 auto 16px", "borderRadius": "50%", "background": "rgba(239, 68, 68, 0.1)", "color": "#ef4444", "display": "flex", "alignItems": "center", "justifyContent": "center", "fontSize": "24px" }}>
                                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                            </div>
                            <h3 style={{ "margin": "0 0 8px", "fontSize": "22px", "fontWeight": "800", "color": "var(--text-primary, #0F172A)" }}>Sign Out of LMS?</h3>
                            <p style={{ "margin": "0 0 24px", "fontSize": "14px", "color": "var(--text-muted, #64748B)", "lineHeight": "1.5" }}>Are you sure you want to end your admin session?</p>
                            <div style={{ "display": "flex", "gap": "12px", "justifyContent": "center" }}>
                                <button type="button" onClick={() => setShowLogoutModal(false)} className="btn btn-outline" style={{ "flex": "1", "padding": "10px 18px", "borderRadius": "12px", "border": "1.5px solid var(--border-color, #E2E8F0)", "background": "transparent", "color": "var(--text-primary, #374151)", "fontSize": "14px", "fontWeight": "600", "cursor": "pointer", "transition": "all 0.2s" }}>Cancel</button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        logout();
                                        setShowLogoutModal(false);
                                        navigate('/unilms/superadmin/login');
                                    }} 
                                    className="btn btn-primary" 
                                    style={{ "flex": "1", "padding": "10px 18px", "borderRadius": "12px", "border": "none", "background": "#ef4444", "color": "#fff", "fontSize": "14px", "fontWeight": "600", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "cursor": "pointer", "transition": "all 0.2s", "boxShadow": "0 4px 14px rgba(239, 68, 68, 0.35)" }}
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>



                </div>
            </div>

        </>
    );
};

export default SuperAdminLayout;
