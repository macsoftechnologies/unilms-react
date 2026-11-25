import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

const ParentLogin = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const { tenant } = useTenant();
  const [orgCode, setOrgCode] = useState(tenant?.code || localStorage.getItem('unilms_tenant_code') || '');
  const [identifier, setIdentifier] = useState('');
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({
        orgCode: orgCode.trim().toUpperCase(),
        identifier,
        password,
        role: 'parent',
      });
      if (res.success) {
        const returnedRole = (res.user?.role || '').toLowerCase().trim();
        if (returnedRole !== 'parent') {
          logout();
          if (returnedRole === 'student') {
            setError('Student account detected. Please sign in via the Student LMS Portal at /lms/login.');
          } else if (returnedRole === 'admin' || returnedRole === 'campus_admin') {
            setError('Administrator account detected. Please sign in via the Organization Admin Portal at /org/login.');
          } else if (returnedRole === 'faculty') {
            setError('Faculty account detected. Please sign in via the Faculty Portal at /org/login.');
          } else if (returnedRole === 'super_admin' || returnedRole === 'superadmin') {
            setError('Super Admin account detected. Please sign in via the Super Admin Portal at /superadmin/login.');
          } else {
            setError('Access denied. This portal is strictly reserved for Parents.');
          }
          return;
        }
        navigate('/unilms/parent/dashboard');
      } else {
        setError(res.error || 'Authentication failed. Please check mobile/roll number and password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="parent-auth-wrapper"
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
        .parent-auth-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 460px;
          border-radius: 20px;
          padding: clamp(24px, 5vw, 44px) clamp(16px, 4vw, 36px); max-width: min(460px, calc(100vw - 32px));
          box-sizing: border-box;
          transition: all 0.25s ease;
        }
      ` }} />

      {/* Back to Gateway */}
      <Link 
        to="/" 
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
          color: isDarkMode ? '#34D399' : '#059669', 
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
          top: '16px',
          right: '16px',
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
        <i className={isDarkMode ? "fa-solid fa-sun" : "fa-solid fa-moon"} style={{ color: isDarkMode ? "#FBBF24" : "#059669" }}></i>
        <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
      </button>

      {/* Ambient background glows */}
      <div 
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          filter: 'blur(150px)',
          opacity: isDarkMode ? 0.15 : 0.2,
          top: '-80px',
          right: '-80px',
          background: 'radial-gradient(circle, #10B981, #06B6D4)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div 
        style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          filter: 'blur(150px)',
          opacity: isDarkMode ? 0.12 : 0.18,
          bottom: '-100px',
          left: '-80px',
          background: 'radial-gradient(circle, #059669, #3B82F6)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main Login Card */}
      <div 
        className="parent-auth-card"
        style={{
          background: isDarkMode ? '#151A24' : '#ffffff',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
          boxShadow: isDarkMode 
            ? '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)' 
            : '0 12px 35px rgba(5, 150, 105, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Header with Icon */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 16px',
            borderRadius: '16px',
            background: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)',
            color: isDarkMode ? '#34D399' : '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: isDarkMode ? '0 4px 14px rgba(16, 185, 129, 0.25)' : '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}>
            <i className="fa-solid fa-user-group"></i>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            borderRadius: '20px',
            color: isDarkMode ? '#34D399' : '#059669',
            fontSize: '11.5px',
            fontWeight: '700',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            Guardians Portal
          </div>

          <h2 style={{
            margin: '0 0 8px 0',
            fontWeight: '800',
            fontSize: '24px',
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
            letterSpacing: '-0.3px',
            fontFamily: "'Outfit', sans-serif"
          }}>
            Parent Portal Login
          </h2>

          <p style={{
            margin: 0,
            fontSize: '13.5px',
            color: isDarkMode ? '#94A3B8' : '#64748B',
            lineHeight: '1.5'
          }}>
            Real-time telemetry on student attendance, academic grades, fee dues &amp; teacher notices.
          </p>
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

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          {/* Organization Code Input */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              marginBottom: '7px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: isDarkMode ? '#CBD5E1' : '#475569'
            }}>
              Campus / Organization Code
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <i className="fa-solid fa-building-columns" style={{
                position: 'absolute',
                left: '14px',
                color: isDarkMode ? '#64748B' : '#94A3B8',
                fontSize: '14px'
              }}></i>
              <input 
                type="text" 
                name="org_code" 
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                required 
                autoFocus 
                placeholder="e.g. AIT, SXG"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #CBD5E1',
                  borderRadius: '10px',
                  background: isDarkMode ? '#1B212E' : '#F8FAFC',
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '0.8px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
            </div>
          </div>

          {/* Mobile / Roll Number Input */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              marginBottom: '7px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: isDarkMode ? '#CBD5E1' : '#475569'
            }}>
              Registered Mobile or Roll Number
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <i className="fa-solid fa-phone" style={{
                position: 'absolute',
                left: '14px',
                color: isDarkMode ? '#64748B' : '#94A3B8',
                fontSize: '13px'
              }}></i>
              <input 
                type="text" 
                name="parent_identifier" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required 
                autoFocus 
                placeholder="e.g. 9876543210 or 26CSE001"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #CBD5E1',
                  borderRadius: '10px',
                  background: isDarkMode ? '#1B212E' : '#F8FAFC',
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '7px'
            }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: isDarkMode ? '#CBD5E1' : '#475569'
              }}>
                Password
              </label>
              <a href="#forgot" onClick={(e) => e.preventDefault()} style={{ fontSize: '12px', color: isDarkMode ? '#34D399' : '#059669', textDecoration: 'none', fontWeight: '600' }}>
                Forgot?
              </a>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <i className="fa-solid fa-lock" style={{
                position: 'absolute',
                left: '14px',
                color: isDarkMode ? '#64748B' : '#94A3B8',
                fontSize: '13px'
              }}></i>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 40px',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #CBD5E1',
                  borderRadius: '10px',
                  background: isDarkMode ? '#1B212E' : '#F8FAFC',
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxSizing: 'border-box',
                  outline: 'none',
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

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#64748b' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '13px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isDarkMode ? '0 4px 16px rgba(16, 185, 129, 0.4)' : '0 4px 14px rgba(5, 150, 105, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <i className={loading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-arrow-right-to-bracket"}></i>
            <span>{loading ? 'Authenticating with Campus Server...' : 'Access Parent Portal'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ParentLogin;