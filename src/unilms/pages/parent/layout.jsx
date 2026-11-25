import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const ParentLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [parentInfo, setParentInfo] = useState({
    name: 'Parent / Guardian',
    initials: 'PG',
    wardInfo: 'Registered Ward',
  });
  const path = location.pathname;

  useEffect(() => {
    // 1. Try reading logged-in user from localStorage
    try {
      const stored = localStorage.getItem('unilms_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) {
          const names = u.name.split(' ');
          const inits = names.length >= 2 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : u.name.slice(0, 2).toUpperCase();
          setParentInfo(prev => ({ ...prev, name: u.name, initials: inits }));
        }
      }
    } catch {}

    // 2. Fetch children to get dynamic ward name
    import('../../services/parent.service').then(({ parentService }) => {
      parentService.getChildren().then(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (list.length > 0) {
          const p = list[0];
          const st = p.student;
          const parentName = p.fatherName || p.motherName || 'Parent Guardian';
          const names = parentName.split(' ');
          const inits = names.length >= 2 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : parentName.slice(0, 2).toUpperCase();
          const wardText = st ? `Parent of ${st.firstName} (${st.rollNumber})` : 'Registered Ward';

          setParentInfo({
            name: parentName,
            initials: inits,
            wardInfo: wardText,
          });
        }
      }).catch(() => {});
    });
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    setShowLogout(false);
    navigate('/unilms/parent/login');
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --parent-primary: #4F46E5;
          --parent-primary-hover: #4338CA;
          --parent-bg: #F8FAFC;
          --parent-sidebar-bg: #0F172A;
          --parent-text-main: #0F172A;
          --parent-text-muted: #64748B;
          --parent-border: #E2E8F0;
        }

        .parent-portal-layout {
          display: flex;
          min-height: 100vh;
          background-color: var(--parent-bg);
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: var(--parent-text-main);
        }

        .parent-sidebar {
          width: 260px;
          background: var(--parent-sidebar-bg);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 1000;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
          transition: transform 0.3s ease;
        }

        .parent-sidebar-header {
          padding: 24px 20px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .parent-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #ffffff;
        }

        .parent-brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #4F46E5, #818CF8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        }

        .parent-nav-menu {
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          flex: 1;
        }

        .parent-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .parent-nav-item:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(3px);
        }

        .parent-nav-item.active {
          color: #4F46E5;
          background: #ffffff;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .parent-nav-item.active i {
          color: #4F46E5;
        }

        .parent-sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(0, 0, 0, 0.2);
        }

        .parent-student-pill {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .parent-main-content {
          margin-left: 260px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: calc(100% - 260px);
        }

        .parent-topbar {
          background: #ffffff;
          border-bottom: 1px solid var(--parent-border);
          padding: 12px clamp(12px, 3vw, 24px); flex-wrap: wrap; gap: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 900;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        @media (max-width: 991px) {
          .parent-sidebar {
            transform: translateX(-100%);
          }
          .parent-sidebar.open {
            transform: translateX(0);
          }
          .parent-main-content {
            margin-left: 0;
            width: 100%;
          }
        }
      ` }} />

      <div className="parent-portal-layout">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div 
            className="parent-sidebar-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 995
            }}
          />
        )}
        {/* Left Sidebar */}
        <aside className={`parent-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <div>
            <div className="parent-sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link to="/unilms/parent/dashboard" className="parent-brand" onClick={() => setMobileMenuOpen(false)}>
                <div className="parent-brand-icon">
                  <i className="fa-solid fa-graduation-cap"></i>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', lineHeight: '1.2' }}>UniLMS</div>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.8px', color: '#94A3B8', textTransform: 'uppercase' }}>Parent Portal</div>
                </div>
              </Link>
              <button 
                type="button" 
                onClick={() => setMobileMenuOpen(false)}
                className="d-lg-none"
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                aria-label="Close sidebar"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <nav className="parent-nav-menu">
              <Link to="/unilms/parent/dashboard" className={`parent-nav-item ${path.includes('dashboard') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-house" style={{ width: '20px' }}></i>
                <span>Dashboard</span>
              </Link>
              <Link to="/unilms/parent/attendance" className={`parent-nav-item ${path.includes('attendance') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-user-check" style={{ width: '20px' }}></i>
                <span>Attendance</span>
              </Link>
              <Link to="/unilms/parent/fees" className={`parent-nav-item ${path.includes('fees') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-indian-rupee-sign" style={{ width: '20px' }}></i>
                <span>Fee Payments</span>
              </Link>
              <Link to="/unilms/parent/marks" className={`parent-nav-item ${path.includes('marks') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-award" style={{ width: '20px' }}></i>
                <span>Marks & Grades</span>
              </Link>
              <Link to="/unilms/parent/homework" className={`parent-nav-item ${path.includes('homework') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-file-signature" style={{ width: '20px' }}></i>
                <span>Homework & Tasks</span>
              </Link>
              <Link to="/unilms/parent/timetable" className={`parent-nav-item ${path.includes('timetable') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-calendar-days" style={{ width: '20px' }}></i>
                <span>Class Timetable</span>
              </Link>
            </nav>
          </div>

          {/* Sidebar Footer with Sign Out Button at the Bottom */}
          <div className="parent-sidebar-footer">
            <div className="parent-student-pill">
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(79, 70, 229, 0.25)',
                color: '#818CF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '13px'
              }}>
                {parentInfo.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {parentInfo.name}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {parentInfo.wardInfo}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-sidebar-logout"
              onClick={() => setShowLogout(true)}
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="parent-main-content">
          <header className="parent-topbar" style={{ padding: '12px clamp(12px, 3vw, 24px)', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <button
                type="button"
                className="d-lg-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: 'var(--parent-text-main)',
                  flexShrink: 0
                }}
                aria-label="Toggle navigation"
              >
                <i className="fa-solid fa-bars"></i>
              </button>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(15px, 2.8vw, 18px)', fontWeight: '800', color: 'var(--parent-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {path.includes('attendance') ? 'Student Attendance Telemetry' :
                   path.includes('fees') ? 'Fee Invoices & Ledger' :
                   path.includes('marks') ? 'Grade Card & Examination Marks' :
                   path.includes('homework') ? 'Homework & Lab Milestones' :
                   path.includes('timetable') ? 'Weekly Class Timetable' :
                   'Parent Guardian Dashboard'}
                </h1>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: '#ECFDF5', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #A7F3D0', whiteSpace: 'nowrap' }}>
                <i className="fa-solid fa-circle-check me-1"></i> Active Enrolled Ward
              </span>
            </div>
          </header>

          <main style={{ padding: 'clamp(12px, 2.5vw, 24px)', flex: 1, width: '100%', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0 }}>
            <Outlet />
          </main>
        </div>
      </div>

      {/* Sign Out Modal */}
      {showLogout && (
        <div id="parentLogoutModal" style={{ display: 'flex', position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px 32px 28px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0', animation: 'modalFadeIn 0.25s ease' }}>
            <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>Sign Out of LMS?</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748B', lineHeight: '1.5' }}>Are you sure you want to end your parent session?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" onClick={() => setShowLogout(false)} className="btn btn-outline" style={{ flex: '1', padding: '10px 18px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: 'transparent', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleLogout} className="btn btn-primary" style={{ flex: '1', padding: '10px 18px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)' }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ParentLayout;
