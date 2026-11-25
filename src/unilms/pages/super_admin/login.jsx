import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SuperAdminLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            const res = await login({ identifier: email, password, role: 'super_admin' });
            if (res.success) {
                navigate('/unilms/superadmin/dashboard');
            } else {
                setError(res.error || 'Invalid Super Admin credentials.');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="superadmin-auth-wrapper" 
            style={{
                backgroundColor: isDarkMode ? '#0B0E14' : '#f4f7fe',
                color: isDarkMode ? '#F8FAFC' : '#1e293b',
                minHeight: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                fontFamily: "'Inter', sans-serif",
                transition: 'background-color 0.25s ease'
            }}
        >
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
                    color: isDarkMode ? '#60A5FA' : '#1E3A8A', 
                    textDecoration: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                    zIndex: 9999 
                }}
                title="Back to Landing Gateway"
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
                <i className={isDarkMode ? "fa-solid fa-sun" : "fa-solid fa-moon"} style={{ color: isDarkMode ? "#FBBF24" : "#1E3A8A" }}></i>
                <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>

            {/* Login Card */}
            <div 
                className="login-card"
                style={{
                    background: isDarkMode ? '#151A24' : '#ffffff',
                    color: isDarkMode ? '#F8FAFC' : '#1e293b',
                    padding: 'clamp(24px, 5vw, 44px) clamp(16px, 4vw, 36px)',
                    maxWidth: 'min(460px, calc(100vw - 32px))',
                    borderRadius: '20px',
                    boxShadow: isDarkMode 
                        ? '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
                        : '0 12px 35px rgba(30, 58, 138, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
                    width: '100%',
                    maxWidth: '460px',
                    boxSizing: 'border-box',
                    transition: 'all 0.25s ease'
                }}
            >
                {/* Logo & Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        margin: '0 auto 16px',
                        borderRadius: '16px',
                        background: isDarkMode ? 'rgba(37, 99, 235, 0.18)' : 'rgba(30, 58, 138, 0.08)',
                        color: isDarkMode ? '#60A5FA' : '#1E3A8A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '26px'
                    }}>
                        <i className="fa-solid fa-layer-group"></i>
                    </div>
                    <h2 style={{ 
                        margin: '0 0 8px 0', 
                        fontWeight: '800', 
                        fontSize: '24px', 
                        color: isDarkMode ? '#FFFFFF' : '#0F172A',
                        letterSpacing: '-0.3px'
                    }}>
                        Super Admin Login
                    </h2>
                    <p style={{ 
                        margin: 0, 
                        fontSize: '13.5px', 
                        color: isDarkMode ? '#94A3B8' : '#64748B' 
                    }}>
                        Root Platform & Multi-Tenant Management Portal
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
                    {/* Email Field */}
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
                            Email Address
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <i className="fa-solid fa-envelope" style={{
                                position: 'absolute',
                                left: '14px',
                                color: isDarkMode ? '#64748B' : '#94A3B8',
                                fontSize: '13px'
                            }}></i>
                            <input 
                                type="email" 
                                name="email" 
                                className="form-control" 
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required 
                                placeholder="admin@superadmin.com"
                                style={{
                                    width: '100%',
                                    padding: '12px 14px 12px 40px',
                                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #cbd5e1',
                                    borderRadius: '10px',
                                    background: isDarkMode ? '#1B212E' : '#ffffff',
                                    color: isDarkMode ? '#F8FAFC' : '#1e293b',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
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
                            <a href="#forgot" onClick={(e) => e.preventDefault()} style={{ fontSize: '12px', color: isDarkMode ? '#60A5FA' : '#1E3A8A', textDecoration: 'none', fontWeight: '600' }}>
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
                                className="form-control" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required 
                                placeholder="Enter master password"
                                style={{
                                    width: '100%',
                                    padding: '12px 40px 12px 40px',
                                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #cbd5e1',
                                    borderRadius: '10px',
                                    background: isDarkMode ? '#1B212E' : '#ffffff',
                                    color: isDarkMode ? '#F8FAFC' : '#1e293b',
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
                        style={{
                            width: '100%',
                            background: isDarkMode ? '#2563EB' : '#1E3A8A',
                            color: '#ffffff',
                            border: 'none',
                            padding: '13px',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: isDarkMode ? '0 4px 14px rgba(37, 99, 235, 0.4)' : '0 4px 14px rgba(30, 58, 138, 0.25)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span>Sign In</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SuperAdminLogin;