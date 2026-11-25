import React, { createContext, useContext, useState } from 'react';
import apiClient from '../services/api';
import { useTenant } from './TenantContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { tenant, selectTenantByCode } = useTenant();

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('unilms_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('unilms_access_token') || null);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(user && token);
  const role = user?.role || null;

  const login = async ({ identifier, password, role: requestedRole, orgCode }) => {
    setLoading(true);

    try {
      const code = orgCode || tenant?.code || 'AIT';

      // 1. Super Admin login
      if (requestedRole === 'super_admin' || requestedRole === 'superadmin') {
        const res = await apiClient.post('/auth/superadmin/login', {
          email: identifier,
          password,
        });

        const authData = res.data || res;
        localStorage.removeItem('unilms_privileges');
        localStorage.removeItem('faculty_persona');
        localStorage.setItem('unilms_access_token', authData.accessToken);
        localStorage.setItem('unilms_user', JSON.stringify(authData.user));
        localStorage.setItem('org_user_role', 'super_admin');
        localStorage.setItem('user_role', 'super_admin');
        setUser(authData.user);
        setToken(authData.accessToken);
        return { success: true, user: authData.user };
      }

      // 2. Institutional Login (Campus Admin, Faculty, Student, Parent)
      const res = await apiClient.post('/auth/login', {
        orgCode: code,
        identifier,
        password,
      });

      const authData = res.data || res;
      localStorage.removeItem('unilms_privileges');
      localStorage.removeItem('faculty_persona');
      localStorage.setItem('unilms_access_token', authData.accessToken);
      localStorage.setItem('unilms_refresh_token', authData.refreshToken);
      localStorage.setItem('unilms_user', JSON.stringify(authData.user));
      localStorage.setItem('org_user_role', authData.user.role);
      localStorage.setItem('user_role', authData.user.role);
      localStorage.setItem('org_user_name', authData.user.name || '');
      localStorage.setItem('org_user_email', authData.user.email || '');
      localStorage.setItem('unilms_tenant_code', code);
      localStorage.setItem('active_org_code', code);

      setUser(authData.user);
      setToken(authData.accessToken);

      return { success: true, user: authData.user };
    } catch (err) {
      console.error('Authentication Error:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Authentication failed. Please verify your institution code, identifier, and password.';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    const keysToRemove = [
      'unilms_access_token',
      'unilms_refresh_token',
      'unilms_user',
      'org_user_role',
      'user_role',
      'unilms_privileges',
      'faculty_persona',
      'org_user_name',
      'org_user_email',
      'unilms_tenant_code',
      'unilms_access_groups',
      'active_tab',
      'active_org_code',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setUser(null);
    setToken(null);
  };

  const hasRole = (requiredRoles) => {
    if (!role) return false;
    if (role === 'super_admin') return true;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(role);
    }
    return role === requiredRoles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

