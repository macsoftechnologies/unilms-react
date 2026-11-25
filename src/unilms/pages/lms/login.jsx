import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

const LmsLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { tenant, currentTenant } = useTenant();
  const [orgCode, setOrgCode] = useState(currentTenant?.code || tenant?.code || localStorage.getItem('unilms_tenant_code') || '');
  const [rollNumber, setRollNumber] = useState('');
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
        identifier: rollNumber,
        password,
        role: 'student',
        orgCode: orgCode.trim().toUpperCase(),
      });
      if (res.success) {
        navigate('/unilms/lms/dashboard');
      } else {
        setError(res.error || 'Authentication failed. Please verify roll number and password.');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="lms-auth-wrapper"
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
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        transition: 'background-color 0.25s ease'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .lms-auth-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1040px;
          border-radius: 24px;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          overflow: hidden;
          min-height: 590px;
          transition: all 0.25s ease;
        }
        @media (max-width: 920px) {
          .lms-auth-card {
            grid-template-columns: 1fr;
            max-width: 480px;
          }
          .lms-hero-side {
            display: none !important;
          }
        }
        .lms-feature-item {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          padding: 12px 18px;
          border-radius: 14px;
          transition: all 0.25s ease;
        }
        .lms-feature-item:hover {
          background: rgba(255, 255, 255, 0.14);
          transform: translateX(4px);
        }
      ` }} />

      {/* Back to Gateway Button */}
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

      {/* Ambient background glows */}
      <div 
        style={{
          position: 'absolute',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          filter: 'blur(150px)',
          opacity: isDarkMode ? 0.18 : 0.25,
          top: '-100px',
          left: '-100px',
          background: 'radial-gradient(circle, #4F46E5, #06B6D4)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div 
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          filter: 'blur(150px)',
          opacity: isDarkMode ? 0.15 : 0.2,
          bottom: '-120px',
          right: '-80px',
          background: 'radial-gradient(circle, #8B5CF6, #EC4899)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main Auth Card */}
      <div 
        className="lms-auth-card"
        style={{
          background: isDarkMode ? '#151A24' : '#ffffff',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
          boxShadow: isDarkMode 
            ? '0 25px 65px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)' 
            : '0 20px 50px -10px rgba(79, 70, 229, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Left Hero Showcase */}
        <div 
          className="lms-hero-side"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
            padding: '48px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(12px)',
                padding: '7px 16px',
                borderRadius: '30px',
                fontSize: '12.5px',
                fontWeight: '600',
                letterSpacing: '0.4px',
                color: '#ffffff',
                marginBottom: '26px'
              }}
            >
              <i className="fa-solid fa-graduation-cap" style={{ color: '#38BDF8' }}></i>
              <span>{currentTenant?.name || tenant?.name || 'UniLMS Campus Portal'}</span>
            </div>

            <h1 
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '32px',
                fontWeight: '800',
                lineHeight: 1.25,
                letterSpacing: '-0.5px',
                marginBottom: '14px',
                color: '#ffffff'
              }}
            >
              Empowering Next-Gen <br />
              <span style={{
                background: 'linear-gradient(120deg, #38BDF8, #A5B4FC, #F472B6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Engineering &amp; Learning
              </span>
            </h1>

            <p style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: '1.6', marginBottom: '28px', maxWidth: '420px' }}>
              Autonomous Engineering Campus • Approved by AICTE, New Delhi • NAAC 'A+' Grade &amp; NBA Accredited Institution
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="lms-feature-item">
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(79, 70, 229, 0.4))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38BDF8',
                  fontSize: '15px',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-play"></i>
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#F1F5F9', display: 'block' }}>Blended Learning Video Hub</span>
                  <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: '400' }}>Modular chapters &amp; downloadable study notes</span>
                </div>
              </div>

              <div className="lms-feature-item">
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(79, 70, 229, 0.4))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38BDF8',
                  fontSize: '15px',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-code-branch"></i>
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#F1F5F9', display: 'block' }}>OBE-Mapped Assessments</span>
                  <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: '400' }}>CO/PO mapping &amp; rubric-based grading</span>
                </div>
              </div>

              <div className="lms-feature-item">
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(79, 70, 229, 0.4))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38BDF8',
                  fontSize: '15px',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-chart-pie"></i>
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#F1F5F9', display: 'block' }}>Grade Card &amp; Smart Attendance</span>
                  <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: '400' }}>Live semester progress &amp; timetable tracking</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            position: 'relative',
            zIndex: 2,
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '12px',
            color: '#94A3B8'
          }}>
            <span><i className="fa-solid fa-location-dot" style={{ color: '#38BDF8', marginRight: '6px' }}></i> Cyber Valley Campus</span>
            <span><i className="fa-solid fa-shield-halved" style={{ color: '#38BDF8', marginRight: '6px' }}></i> AICTE / NBA Certified</span>
          </div>
        </div>

        {/* Right Form Side */}
        <div 
          style={{
            padding: '44px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: isDarkMode ? '#151A24' : '#ffffff',
            color: isDarkMode ? '#F8FAFC' : '#0F172A',
            transition: 'all 0.25s ease'
          }}
        >
          <div style={{ marginBottom: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.1)',
                color: isDarkMode ? '#818CF8' : '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>
                <i className="fa-solid fa-building-columns"></i>
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                color: isDarkMode ? '#818CF8' : '#4F46E5',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {currentTenant?.name || tenant?.name || 'Campus Portal'}
              </span>
            </div>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '25px',
              fontWeight: '800',
              color: isDarkMode ? '#FFFFFF' : '#0F172A',
              letterSpacing: '-0.4px',
              margin: '0 0 6px 0'
            }}>
              Student Portal Sign In
            </h2>
            <p style={{ margin: 0, color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: '13.5px' }}>
              Access your personalized semester courses, lectures &amp; assignments
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

          <form onSubmit={handleLogin} id="studentLoginForm">
            {/* Campus Code Input */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                color: isDarkMode ? '#CBD5E1' : '#475569',
                marginBottom: '7px'
              }}>
                <span>Campus / Organization Code</span>
                <span style={{ fontSize: '11px', color: isDarkMode ? '#64748B' : '#94A3B8', fontWeight: '500', textTransform: 'none' }}>e.g. AIT, SXG</span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-building-columns" style={{
                  position: 'absolute',
                  left: '15px',
                  color: isDarkMode ? '#64748B' : '#94A3B8',
                  fontSize: '15px'
                }}></i>
                <input
                  type="text"
                  name="org_code"
                  id="orgCodeInput"
                  placeholder="Enter Campus Code (e.g. AIT)"
                  required
                  autoFocus
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
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

            {/* Roll Number Input */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                color: isDarkMode ? '#CBD5E1' : '#475569',
                marginBottom: '7px'
              }}>
                <span>Student Roll Number</span>
                <span style={{ fontSize: '11px', color: isDarkMode ? '#64748B' : '#94A3B8', fontWeight: '500', textTransform: 'none' }}>e.g. 26CSE001</span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-id-card" style={{
                  position: 'absolute',
                  left: '15px',
                  color: isDarkMode ? '#64748B' : '#94A3B8',
                  fontSize: '15px'
                }}></i>
                <input
                  type="text"
                  name="roll_number"
                  id="rollNumberInput"
                  placeholder="Enter student roll number"
                  required
                  autoFocus
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
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

            {/* Password Input */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                color: isDarkMode ? '#CBD5E1' : '#475569',
                marginBottom: '7px'
              }}>
                <span>Password</span>
                <a href="#forgot" onClick={(e) => e.preventDefault()} style={{ fontSize: '12px', color: isDarkMode ? '#818CF8' : '#4F46E5', textDecoration: 'none', fontWeight: '600', textTransform: 'none' }}>
                  Forgot?
                </a>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-lock" style={{
                  position: 'absolute',
                  left: '15px',
                  color: isDarkMode ? '#64748B' : '#94A3B8',
                  fontSize: '15px'
                }}></i>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="passwordInput"
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

            {/* Submit Button */}
            <button 
              type="submit" 
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '15.5px',
                fontWeight: '700',
                letterSpacing: '0.2px',
                cursor: 'pointer',
                boxShadow: isDarkMode ? '0 4px 16px rgba(79, 70, 229, 0.5)' : '0 6px 18px rgba(79, 70, 229, 0.3)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <span>Sign In to Student Portal</span>
              <i className="fa-solid fa-arrow-right" style={{ fontSize: '13px' }}></i>
            </button>
          </form>

          {/* Portal Switch Link */}
          <div style={{
            marginTop: '22px',
            textAlign: 'center',
            fontSize: '12.5px',
            color: isDarkMode ? '#94A3B8' : '#64748B'
          }}>
            <span>Faculty or Administrator?{' '}
              <Link to="/unilms/faculty/login" style={{ color: isDarkMode ? '#818CF8' : '#4F46E5', textDecoration: 'none', fontWeight: '600' }}>
                Staff Login Portal <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px' }}></i>
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LmsLogin;