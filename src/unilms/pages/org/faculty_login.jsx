import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

const OrgFacultyLogin = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const { tenant, currentTenant } = useTenant();
  const [orgCode, setOrgCode] = useState(currentTenant?.code || tenant?.code || localStorage.getItem('unilms_tenant_code') || '');
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || localStorage.getItem('unilms_student_mode') || localStorage.getItem('org_theme_mode');
    if (storedTheme === 'dark' || document.body.classList.contains('dark-mode')) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      localStorage.setItem('unilms_student_mode', 'light');
      localStorage.setItem('org_theme_mode', 'light');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('unilms_student_mode', 'dark');
      localStorage.setItem('org_theme_mode', 'dark');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({
        orgCode: orgCode.trim().toUpperCase(),
        identifier: employeeCode,
        password,
        role: 'faculty',
      });
      if (res.success) {
        const returnedRole = (res.user?.role || '').toLowerCase().trim();
        if (returnedRole === 'student') {
          logout();
          setError('Student account detected. Please sign in via the Student LMS Portal at /lms/login.');
          return;
        }
        if (returnedRole === 'parent') {
          logout();
          setError('Parent account detected. Please sign in via the Parent Portal at /parent/login.');
          return;
        }
        if (returnedRole === 'super_admin' || returnedRole === 'superadmin') {
          logout();
          setError('Super Admin account detected. Please sign in via the Super Admin Portal at /superadmin/login.');
          return;
        }
        localStorage.setItem('org_user_role', returnedRole || 'faculty');
        localStorage.setItem('org_user_name', res.user?.name || employeeCode);
        localStorage.setItem('org_user_email', res.user?.email || employeeCode);
        localStorage.setItem('faculty_persona', 'faculty');
        navigate('/unilms/faculty/dashboard');
      } else {
        setError(res.error || 'Authentication failed. Please verify faculty ID and password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="faculty-auth-wrapper"
      style={{
        backgroundColor: isDarkMode ? '#0B0E14' : '#F4F7FE',
        color: isDarkMode ? '#F8FAFC' : '#0F172A',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '30px 20px',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        transition: 'background-color 0.25s ease'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .faculty-login-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 980px;
          border-radius: 24px;
          display: flex;
          overflow: hidden;
          min-height: 580px;
          transition: all 0.25s ease;
        }
        @media (max-width: 860px) {
          .faculty-login-card {
            flex-direction: column;
            max-width: 480px;
          }
          .faculty-brand-panel {
            display: none !important;
          }
        }
        .faculty-feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .faculty-feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          font-weight: 500;
          color: #E0E7FF;
        }
        .faculty-feature-item i {
          color: #34D399;
          font-size: 15px;
          flex-shrink: 0;
        }
      ` }} />

      {/* Back to Gateway */}
      <Link 
        to="/unilms/" 
        style={{ 
          position: 'absolute', 
          top: '24px', 
          left: '24px', 
          width: '42px', 
          height: '42px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: isDarkMode ? '#151A24' : '#ffffff', 
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0', 
          borderRadius: '50%', 
          color: isDarkMode ? '#818CF8' : '#4F46E5', 
          textDecoration: 'none', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
          zIndex: 9999,
          transition: 'all 0.2s ease'
        }}
        title="Back to Gateway"
      >
        <i className="fa-solid fa-arrow-left"></i>
      </Link>

      {/* Dark / Light Mode Toggle Button */}
      <button 
        type="button" 
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '24px',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
          background: isDarkMode ? '#151A24' : '#ffffff',
          color: isDarkMode ? '#F8FAFC' : '#1e293b',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          zIndex: 9999,
          transition: 'all 0.2s ease'
        }}
      >
        <i className={isDarkMode ? "fa-solid fa-sun" : "fa-solid fa-moon"} style={{ color: isDarkMode ? "#FBBF24" : "#4F46E5" }}></i>
        <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
      </button>

      {/* Main Container Card */}
      <div 
        className="faculty-login-card"
        style={{
          background: isDarkMode ? '#151A24' : '#ffffff',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
          boxShadow: isDarkMode 
            ? '0 25px 65px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)' 
            : '0 20px 50px -10px rgba(79, 70, 229, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Left Brand Panel */}
        <div 
          className="faculty-brand-panel"
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
            color: 'white',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '400px',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#C7D2FE',
              marginBottom: '24px'
            }}>
              <i className="fa-solid fa-chalkboard-user"></i> UniLMS Academic Suite
            </div>

            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '27px',
              fontWeight: '800',
              lineHeight: 1.25,
              margin: '0 0 12px 0',
              color: '#ffffff'
            }}>
              Faculty &amp; Teaching Workspace
            </h1>

            <p style={{ fontSize: '13.5px', lineHeight: '1.6', color: '#C7D2FE', margin: '0 0 26px 0' }}>
              Dedicated professor workbench for course syllabus delivery, class attendance tracking, continuous evaluations, and OBE outcome attainment.
            </p>

            <ul className="faculty-feature-list">
              <li className="faculty-feature-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Course Subjects, Lesson Plans &amp; Active Pedagogies</span>
              </li>
              <li className="faculty-feature-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Classroom Attendance &amp; Defaulter Telemetry</span>
              </li>
              <li className="faculty-feature-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>4-in-1 Continuous Evaluation &amp; Rubrics</span>
              </li>
              <li className="faculty-feature-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Outcome-Based Education (NBA CO-PO Attainment)</span>
              </li>
              <li className="faculty-feature-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Weekly Teaching Timetable &amp; Schedules</span>
              </li>
            </ul>
          </div>

          <div style={{ fontSize: '12px', color: '#A5B4FC', marginTop: '28px' }}>
            {currentTenant?.name || tenant?.name || 'Academic Institution'}
          </div>
        </div>

        {/* Right Form Panel */}
        <div 
          style={{
            flex: 1,
            padding: '44px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: isDarkMode ? '#151A24' : '#ffffff',
            color: isDarkMode ? '#F8FAFC' : '#0F172A',
            transition: 'all 0.25s ease'
          }}
        >
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '26px',
              fontWeight: '800',
              margin: '0 0 6px 0',
              color: isDarkMode ? '#FFFFFF' : '#0F172A',
              letterSpacing: '-0.3px'
            }}>
              Faculty Sign In
            </h2>
            <div style={{ fontSize: '13.5px', color: isDarkMode ? '#94A3B8' : '#64748B' }}>
              Log in with your Faculty Email or Employee ID
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label 
                htmlFor="org_code"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                  color: isDarkMode ? '#CBD5E1' : '#475569'
                }}
              >
                CAMPUS / ORGANIZATION CODE
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-building-columns" style={{
                  position: 'absolute',
                  left: '15px',
                  color: isDarkMode ? '#64748B' : '#94A3B8',
                  fontSize: '14px'
                }}></i>
                <input 
                  type="text" 
                  id="org_code" 
                  name="org_code" 
                  placeholder="e.g. AIT, SXG, HAE" 
                  value={orgCode} 
                  onChange={(e) => setOrgCode(e.target.value.toUpperCase())} 
                  required 
                  autoFocus 
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    fontWeight: '700',
                    letterSpacing: '0.8px',
                    background: isDarkMode ? '#1B212E' : '#F8FAFC',
                    color: isDarkMode ? '#F8FAFC' : '#0F172A',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #CBD5E1',
                    borderRadius: '10px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label 
                htmlFor="employee_code"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                  color: isDarkMode ? '#CBD5E1' : '#475569'
                }}
              >
                FACULTY EMAIL OR EMPLOYEE ID
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-user-tie" style={{
                  position: 'absolute',
                  left: '15px',
                  color: isDarkMode ? '#64748B' : '#94A3B8',
                  fontSize: '14px'
                }}></i>
                <input 
                  type="text" 
                  id="employee_code" 
                  name="employee_code" 
                  placeholder="e.g. faculty@institution.edu or Employee ID" 
                  required 
                  autoFocus 
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    fontWeight: '500',
                    background: isDarkMode ? '#1B212E' : '#F8FAFC',
                    color: isDarkMode ? '#F8FAFC' : '#0F172A',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #CBD5E1',
                    borderRadius: '10px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <label 
                  htmlFor="password"
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: isDarkMode ? '#CBD5E1' : '#475569'
                  }}
                >
                  PASSWORD
                </label>
                <a href="#forgot" onClick={(e) => e.preventDefault()} style={{ fontSize: '12px', color: isDarkMode ? '#818CF8' : '#4F46E5', textDecoration: 'none', fontWeight: '600' }}>
                  Forgot?
                </a>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-lock" style={{
                  position: 'absolute',
                  left: '15px',
                  color: isDarkMode ? '#64748B' : '#94A3B8',
                  fontSize: '14px'
                }}></i>
                <input 
                  type={showPassword ? "text" : "password"}
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 42px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    fontWeight: '500',
                    background: isDarkMode ? '#1B212E' : '#F8FAFC',
                    color: isDarkMode ? '#F8FAFC' : '#0F172A',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #CBD5E1',
                    borderRadius: '10px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDarkMode ? '#94A3B8' : '#64748B',
                    fontSize: '14px',
                    padding: '4px'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? '#64748b' : 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: isDarkMode ? '0 4px 16px rgba(79, 70, 229, 0.5)' : '0 6px 18px rgba(79, 70, 229, 0.3)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className={loading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-right-to-bracket"}></i>
              <span>{loading ? 'Authenticating with Campus Server...' : 'Access Faculty Portal'}</span>
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '13px',
            color: isDarkMode ? '#94A3B8' : '#64748B'
          }}>
            Are you a College Administrator?{' '}
            <Link to="/unilms/org/login" style={{ color: isDarkMode ? '#818CF8' : '#4F46E5', textDecoration: 'none', fontWeight: '600' }}>
              Campus Admin ERP Login &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgFacultyLogin;