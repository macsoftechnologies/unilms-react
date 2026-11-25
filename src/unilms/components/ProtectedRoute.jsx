import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles = [], requiredPrivilege = null, fallbackLogin = '/unilms' }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        width: '100%',
        color: '#6366f1',
        fontFamily: "'Outfit', sans-serif"
      }}>
        Loading session...
      </div>
    );
  }

  // Not authenticated -> redirect to appropriate login
  if (!isAuthenticated) {
    let loginUrl = fallbackLogin;
    if (location.pathname.startsWith('/superadmin') || location.pathname.startsWith('/unilms/superadmin')) {
      loginUrl = '/superadmin/login';
    } else if (location.pathname.startsWith('/lms') || location.pathname.startsWith('/unilms/lms')) {
      loginUrl = '/lms/login';
    } else if (location.pathname.startsWith('/faculty') || location.pathname.startsWith('/unilms/faculty')) {
      loginUrl = '/org/login';
    } else if (location.pathname.startsWith('/parent') || location.pathname.startsWith('/unilms/parent')) {
      loginUrl = '/parent/login';
    } else if (location.pathname.startsWith('/creator') || location.pathname.startsWith('/unilms/creator')) {
      loginUrl = '/creator/login';
    } else if (location.pathname.startsWith('/org') || location.pathname.startsWith('/unilms/org')) {
      loginUrl = '/org/login';
    }

    return <Navigate to={loginUrl} state={{ from: location }} replace />;
  }

  const userRole = (role || localStorage.getItem('org_user_role') || localStorage.getItem('user_role') || '').toLowerCase().trim();
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'superadmin';
  const isCampusAdmin = userRole === 'campus_admin' || userRole === 'admin';

  // 1. Check general role authorization
  if (allowedRoles.length > 0 && !isSuperAdmin) {
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase().trim());
    const isAuthorized = normalizedAllowed.includes(userRole) || (isCampusAdmin && normalizedAllowed.includes('admin'));

    if (!isAuthorized) {
      return (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          fontFamily: "'Outfit', sans-serif",
          maxWidth: '560px',
          margin: '40px auto',
          background: 'var(--card-bg, #fff)',
          borderRadius: '18px',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '48px', color: '#EF4444', marginBottom: '16px' }}>
            <i className="fa-solid fa-shield-halved" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            Access Restricted
          </h2>
          <p style={{ color: '#6B7280', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
            Your account role (<strong>{userRole || 'unauthorized'}</strong>) does not have permission to access this administrative desk.
          </p>
          <a
            href={userRole === 'faculty' ? '/unilms/faculty/dashboard' : '/unilms'}
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: '#4F46E5',
              color: '#fff',
              borderRadius: '10px',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            {userRole === 'faculty' ? 'Return to Faculty Workbench' : 'Return to Gateway'}
          </a>
        </div>
      );
    }
  }

  // 2. Check granular faculty privilege requirements (e.g. HOD or Class Teacher specific routes)
  if (requiredPrivilege && !isSuperAdmin && !isCampusAdmin) {
    let privs = {};
    try {
      const cached = localStorage.getItem('unilms_privileges');
      if (cached) privs = JSON.parse(cached);
    } catch {}

    const userName = localStorage.getItem('org_user_name') || 'Faculty Member';

    if (requiredPrivilege === 'hod' && !privs.isHOD) {
      return (
        <div style={{
          padding: '60px 24px',
          textAlign: 'center',
          fontFamily: "'Outfit', sans-serif",
          maxWidth: '580px',
          margin: '50px auto',
          background: 'var(--card-bg, #fff)',
          borderRadius: '20px',
          border: '1px solid rgba(79, 70, 229, 0.25)',
          boxShadow: '0 12px 36px rgba(79, 70, 229, 0.08)'
        }}>
          <div style={{ fontSize: '50px', color: '#4F46E5', marginBottom: '16px' }}>
            <i className="fa-solid fa-landmark" />
          </div>
          <h2 style={{ fontSize: '23px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-main, #1e1b4b)' }}>
            HOD Leadership Privilege Required
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '24px' }}>
            You are logged in as <strong>{userName}</strong> (Course Faculty). Clicking this external link does not grant access because this departmental workload and syllabus governance desk is strictly restricted to designated <strong>Heads of Department (HOD)</strong>.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="/unilms/faculty/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                background: '#4F46E5',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: '700',
                textDecoration: 'none',
                fontSize: '13.5px'
              }}
            >
              <i className="fa-solid fa-arrow-left"></i> Return to Faculty Workbench
            </a>
          </div>
        </div>
      );
    }

    if (requiredPrivilege === 'class_teacher' && !privs.isClassTeacher) {
      return (
        <div style={{
          padding: '60px 24px',
          textAlign: 'center',
          fontFamily: "'Outfit', sans-serif",
          maxWidth: '580px',
          margin: '50px auto',
          background: 'var(--card-bg, #fff)',
          borderRadius: '20px',
          border: '1px solid rgba(147, 51, 234, 0.25)',
          boxShadow: '0 12px 36px rgba(147, 51, 234, 0.08)'
        }}>
          <div style={{ fontSize: '50px', color: '#9333EA', marginBottom: '16px' }}>
            <i className="fa-solid fa-users-rectangle" />
          </div>
          <h2 style={{ fontSize: '23px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-main, #1e1b4b)' }}>
            Class Teacher Assignment Required
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '24px' }}>
            You are logged in as <strong>{userName}</strong>. This cohort radar and proctoring desk is restricted to faculty members who hold an active <strong>Class Teacher</strong> allocation for a student section.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="/unilms/faculty/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                background: '#9333EA',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: '700',
                textDecoration: 'none',
                fontSize: '13.5px'
              }}
            >
              <i className="fa-solid fa-arrow-left"></i> Return to Faculty Workbench
            </a>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;

