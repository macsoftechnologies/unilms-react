import React from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';

const Gateway = () => {
    const { tenant } = useTenant();
    return (
        <div className="landing-page-container">
            <style dangerouslySetInnerHTML={{ __html: `
                .landing-page-container {
                    --primary: #4F46E5;
                    --primary-dark: #3730A3;
                    --primary-light: #EEF2FF;
                    --bg-page: #0B0F19;
                    --card-bg: rgba(17, 24, 39, 0.75);
                    --card-border: rgba(255, 255, 255, 0.08);
                    --card-hover-border: rgba(99, 102, 241, 0.4);
                    --text-main: #F9FAFB;
                    --text-muted: #9CA3AF;
                    --text-dim: #6B7280;

                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: var(--bg-page);
                    color: var(--text-main);
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow-x: hidden;
                    background-image: 
                        radial-gradient(circle at 15% 15%, rgba(79, 70, 229, 0.18) 0%, transparent 40%),
                        radial-gradient(circle at 85% 20%, rgba(14, 165, 233, 0.15) 0%, transparent 45%),
                        radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.12) 0%, transparent 50%);
                    background-attachment: fixed;
                }

                .landing-page-container * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                /* Top Navigation Header */
                .landing-page-container .header-nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 48px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    backdrop-filter: blur(12px);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }

                .landing-page-container .brand-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-decoration: none;
                    color: white;
                }

                .landing-page-container .brand-icon {
                    width: 42px;
                    height: 42px;
                    background: linear-gradient(135deg, #4F46E5, #06B6D4);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    color: white;
                    box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4);
                }

                .landing-page-container .brand-title {
                    font-size: 22px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    background: linear-gradient(135deg, #FFFFFF 40%, #A5B4FC 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .landing-page-container .header-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px;
                    background: rgba(16, 185, 129, 0.12);
                    border: 1px solid rgba(16, 185, 129, 0.25);
                    border-radius: 9999px;
                    color: #34D399;
                    font-size: 13px;
                    font-weight: 600;
                }

                .landing-page-container .header-badge .dot {
                    width: 8px;
                    height: 8px;
                    background: #10B981;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }

                /* Hero Section */
                .landing-page-container .hero-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 64px 24px 32px;
                    text-align: center;
                }

                .landing-page-container .hero-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 16px;
                    background: rgba(99, 102, 241, 0.12);
                    border: 1px solid rgba(99, 102, 241, 0.25);
                    border-radius: 9999px;
                    color: #A5B4FC;
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 24px;
                }

                .landing-page-container .hero-title,
                .landing-page-container h1.hero-title {
                    font-size: clamp(38px, 5.2vw, 58px) !important;
                    font-weight: 800 !important;
                    line-height: 1.22 !important;
                    letter-spacing: -0.025em !important;
                    margin-bottom: 20px !important;
                    color: #FFFFFF !important;
                    font-family: 'Outfit', sans-serif !important;
                }

                .landing-page-container .hero-title span,
                .landing-page-container h1.hero-title span {
                    font-size: inherit !important;
                    display: inline-block !important;
                    margin-top: 4px !important;
                    background: linear-gradient(120deg, #60A5FA 0%, #A78BFA 45%, #E879F9 100%) !important;
                    -webkit-background-clip: text !important;
                    -webkit-text-fill-color: transparent !important;
                    color: transparent !important;
                }

                .landing-page-container .hero-subtitle,
                .landing-page-container p.hero-subtitle {
                    font-size: clamp(16px, 1.8vw, 18px) !important;
                    color: #94A3B8 !important;
                    max-width: 780px !important;
                    margin: 0 auto 52px !important;
                    line-height: 1.65 !important;
                    font-weight: 400 !important;
                }

                /* Portals Grid */
                .landing-page-container .portals-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
                    gap: 24px;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 24px 64px;
                    width: 100%;
                }

                .landing-page-container .portal-card {
                    background: var(--card-bg);
                    border: 1px solid var(--card-border);
                    border-radius: 20px;
                    padding: clamp(20px, 4vw, 32px) clamp(16px, 3.5vw, 28px);
                    text-decoration: none;
                    color: inherit;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    position: relative;
                    backdrop-filter: blur(16px);
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }

                .landing-page-container .portal-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: var(--accent-gradient, linear-gradient(90deg, #4F46E5, #06B6D4));
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .landing-page-container .portal-card:hover {
                    transform: translateY(-6px);
                    border-color: var(--card-hover-border);
                    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 30px -10px var(--accent-glow, rgba(99, 102, 241, 0.2));
                }

                .landing-page-container .portal-card:hover::before {
                    opacity: 1;
                }

                .landing-page-container .portal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .landing-page-container .portal-icon-box {
                    width: 54px;
                    height: 54px;
                    border-radius: 16px;
                    background: var(--icon-bg, rgba(79, 70, 229, 0.15));
                    color: var(--icon-color, #818CF8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    transition: transform 0.3s ease;
                }

                .landing-page-container .portal-card:hover .portal-icon-box {
                    transform: scale(1.08);
                }

                .landing-page-container .portal-tag {
                    font-size: 11.5px;
                    font-weight: 700;
                    padding: 5px 12px;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.08);
                    color: #94A3B8;
                    text-transform: uppercase;
                    letter-spacing: 0.6px;
                }

                .landing-page-container .portal-title,
                .landing-page-container h3.portal-title,
                h3.portal-title {
                    font-size: 24px !important;
                    font-weight: 800 !important;
                    margin-bottom: 12px !important;
                    color: #FFFFFF !important;
                    letter-spacing: -0.015em !important;
                    line-height: 1.3 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                }

                .landing-page-container .portal-desc {
                    font-size: 14.5px;
                    color: #94A3B8;
                    line-height: 1.6;
                    margin-bottom: 24px;
                }

                .landing-page-container .portal-features {
                    list-style: none;
                    margin-bottom: 28px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .landing-page-container .portal-features li {
                    font-size: 13.5px;
                    color: #D1D5DB;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .landing-page-container .portal-features li i {
                    color: var(--icon-color, #818CF8);
                    font-size: 12px;
                }

                .landing-page-container .portal-cta {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 14.5px;
                    font-weight: 600;
                    color: var(--icon-color, #818CF8);
                    padding-top: 18px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    transition: gap 0.2s ease;
                }

                .landing-page-container .portal-card:hover .portal-cta i {
                    transform: translateX(4px);
                }

                .landing-page-container .portal-cta i {
                    transition: transform 0.2s ease;
                }

                /* Specific Portal Themes */
                .landing-page-container .portal-student {
                    --icon-bg: rgba(99, 102, 241, 0.15);
                    --icon-color: #818CF8;
                    --accent-gradient: linear-gradient(90deg, #6366F1, #818CF8);
                    --accent-glow: rgba(99, 102, 241, 0.3);
                }

                .landing-page-container .portal-faculty {
                    --icon-bg: rgba(99, 102, 241, 0.15);
                    --icon-color: #818CF8;
                    --accent-gradient: linear-gradient(90deg, #6366F1, #A855F7);
                    --accent-glow: rgba(99, 102, 241, 0.3);
                }

                .landing-page-container .portal-faculty .portal-tag {
                    background: rgba(99, 102, 241, 0.12);
                    color: #818CF8;
                }

                .landing-page-container .portal-org {
                    --icon-bg: rgba(2, 132, 199, 0.15);
                    --icon-color: #38BDF8;
                    --accent-gradient: linear-gradient(90deg, #0284C7, #38BDF8);
                    --accent-glow: rgba(2, 132, 199, 0.3);
                }

                .landing-page-container .portal-parent {
                    --icon-bg: rgba(16, 185, 129, 0.15);
                    --icon-color: #34D399;
                    --accent-gradient: linear-gradient(90deg, #10B981, #34D399);
                    --accent-glow: rgba(16, 185, 129, 0.3);
                }

                .landing-page-container .portal-creator {
                    --icon-bg: rgba(168, 85, 247, 0.15);
                    --icon-color: #C084FC;
                    --accent-gradient: linear-gradient(90deg, #9333EA, #C084FC);
                    --accent-glow: rgba(168, 85, 247, 0.3);
                }

                .landing-page-container .portal-admissions {
                    --icon-bg: rgba(245, 158, 11, 0.15);
                    --icon-color: #FBBF24;
                    --accent-gradient: linear-gradient(90deg, #D97706, #FBBF24);
                    --accent-glow: rgba(245, 158, 11, 0.3);
                }

                .landing-page-container .portal-superadmin {
                    --icon-bg: rgba(244, 63, 94, 0.15);
                    --icon-color: #FB7185;
                    --accent-gradient: linear-gradient(90deg, #E11D48, #FB7185);
                    --accent-glow: rgba(244, 63, 94, 0.3);
                }

                /* Platform Stats Banner */
                .landing-page-container .platform-highlights {
                    background: rgba(17, 24, 39, 0.5);
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    padding: 40px 24px;
                    margin-top: auto;
                }

                .landing-page-container .highlights-container {
                    max-width: 1100px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 24px;
                    text-align: center;
                }

                .landing-page-container .highlight-item h4 {
                    font-size: 26px;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 6px;
                }

                .landing-page-container .highlight-item p {
                    font-size: 13.5px;
                    color: var(--text-muted);
                }

                /* Footer */
                .landing-page-container .footer-bar {
                    padding: 24px 48px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 13px;
                    color: var(--text-dim);
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .landing-page-container .footer-links {
                    display: flex;
                    gap: 20px;
                }

                .landing-page-container .footer-links a {
                    color: var(--text-dim);
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .landing-page-container .footer-links a:hover {
                    color: var(--text-muted);
                }

                @media (max-width: 768px) {
                    .landing-page-container .header-nav { padding: 16px 20px; }
                    .landing-page-container .portals-grid { grid-template-columns: 1fr; padding: 0 12px 40px; gap: 16px; }
                    .landing-page-container .hero-title { font-size: clamp(26px, 6vw, 42px) !important; }
                    .landing-page-container .hero-container { padding: 36px 14px 28px !important; }
                    .landing-page-container .footer-bar { padding: 20px; flex-direction: column; text-align: center; }
                }
            ` }} />


            {/* Top Navigation */}
            <header className="header-nav">
                <Link to="/unilms/" className="brand-logo">
                    <div className="brand-icon">
                        <i className="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div>
                        <div className="brand-title">UniLMS</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '500' }}>
                            {tenant?.name || 'Enterprise Academic Cloud'}
                        </div>
                    </div>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="header-badge">
                        <span className="dot"></span>
                        <span>Enterprise Cloud Active</span>
                    </div>
                </div>
            </header>

            {/* Main Hero */}
            <div className="hero-container">
                <div className="hero-pill">
                    <i className="fa-solid fa-sparkles"></i>
                    Next-Generation Academic ERP & Learning Experience
                </div>
                <h1 className="hero-title" style={{ fontSize: 'clamp(38px, 5.2vw, 58px)', fontWeight: '800', lineHeight: 1.22, color: '#FFFFFF' }}>
                    Unified Cloud for Higher Education &<br />
                    <span style={{ fontSize: 'inherit', display: 'inline-block', marginTop: '4px', background: 'linear-gradient(120deg, #60A5FA 0%, #A78BFA 45%, #E879F9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligent Learning</span>
                </h1>
                <p className="hero-subtitle">
                    Welcome to the centralized gateway. Please select your dedicated portal below to access courses, academic operations, fee management, or governance suites.
                </p>
            </div>

            {/* Portals Grid (3 Core End-User Portals) */}
            <div className="portals-grid">
                
                {/* 1. Student LMS Portal */}
                <Link to="/unilms/lms/login" className="portal-card portal-student">
                    <div>
                        <div className="portal-header">
                            <div className="portal-icon-box">
                                <i className="fa-solid fa-graduation-cap"></i>
                            </div>
                            <span className="portal-tag">Students</span>
                        </div>
                        <h3 className="portal-title">Student LMS Portal</h3>
                        <p className="portal-desc">Access multimedia courses, interactive lessons, auto-graded CBT quizzes, assignments, attendance, and exam hall tickets.</p>
                        <ul className="portal-features">
                            <li><i className="fa-solid fa-circle-check"></i> Interactive Video & Lesson Player</li>
                            <li><i className="fa-solid fa-circle-check"></i> Live Timetable & Period Attendance</li>
                            <li><i className="fa-solid fa-circle-check"></i> Grade Cards, Fees & Digital Self-Service</li>
                        </ul>
                    </div>
                    <div className="portal-cta">
                        <span>Access Student LMS</span>
                        <i className="fa-solid fa-arrow-right"></i>
                    </div>
                </Link>

                {/* 2. Faculty & Staff Portal */}
                <Link to="/unilms/org/login" className="portal-card portal-faculty">
                    <div>
                        <div className="portal-header">
                            <div className="portal-icon-box">
                                <i className="fa-solid fa-chalkboard-user"></i>
                            </div>
                            <span className="portal-tag">Faculty & Staff</span>
                        </div>
                        <h3 className="portal-title">Faculty & Staff Portal</h3>
                        <p className="portal-desc">Unified portal for professors, department HODs, functional non-teaching staff, and campus administration.</p>
                        <ul className="portal-features">
                            <li><i className="fa-solid fa-circle-check"></i> Course Delivery, Lesson Plans & Rubrics</li>
                            <li><i className="fa-solid fa-circle-check"></i> Daily Period Attendance & Mentoring</li>
                            <li><i className="fa-solid fa-circle-check"></i> Academic Operations, Grading & Administration</li>
                        </ul>
                    </div>
                    <div className="portal-cta">
                        <span>Sign In as Staff / Faculty</span>
                        <i className="fa-solid fa-arrow-right"></i>
                    </div>
                </Link>

                {/* 3. Parent Guardian Portal */}
                <Link to="/unilms/parent/login" className="portal-card portal-parent">
                    <div>
                        <div className="portal-header">
                            <div className="portal-icon-box">
                                <i className="fa-solid fa-user-group"></i>
                            </div>
                            <span className="portal-tag">Guardians</span>
                        </div>
                        <h3 className="portal-title">Parent Guardian Portal</h3>
                        <p className="portal-desc">Dedicated dashboard for parents to monitor academic progress, daily attendance, fee dues, and teacher correspondence.</p>
                        <ul className="portal-features">
                            <li><i className="fa-solid fa-circle-check"></i> Real-Time Attendance & Leave Status</li>
                            <li><i className="fa-solid fa-circle-check"></i> Fee Invoices, Dues & Payment Receipts</li>
                            <li><i className="fa-solid fa-circle-check"></i> Multi-Child Switching with Single Login</li>
                        </ul>
                    </div>
                    <div className="portal-cta">
                        <span>Login as Parent</span>
                        <i className="fa-solid fa-arrow-right"></i>
                    </div>
                </Link>

            </div>

            {/* Platform Highlights Section */}
            <div className="platform-highlights">
                <div className="highlights-container">
                    <div className="highlight-item">
                        <h4>16+ Modules</h4>
                        <p>Comprehensive ERP, Academics & LMS</p>
                    </div>
                    <div className="highlight-item">
                        <h4>Multi-Tenant</h4>
                        <p>Complete Institutional Data Isolation</p>
                    </div>
                    <div className="highlight-item">
                        <h4>OBE & NBA Ready</h4>
                        <p>Outcome Attainment & CO-PO Matrices</p>
                    </div>
                    <div className="highlight-item">
                        <h4>99.9% Uptime</h4>
                        <p>Secure Enterprise Architecture</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="footer-bar">
                <div>
                    &copy; 2026 UniLMS Cloud Platform. All rights reserved.
                </div>
                <div className="footer-links">
                    <Link to="/unilms/lms/login">Student LMS</Link>
                    <Link to="/unilms/org/login">Faculty & Staff</Link>
                    <Link to="/unilms/parent/login">Parent Portal</Link>
                </div>
            </footer>
        </div>
    );
};

export default Gateway;
