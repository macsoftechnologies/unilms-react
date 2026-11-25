import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const getActiveTenantIdentifier = () => {
  if (typeof window === 'undefined') return 'ORG1';

  // 1. If an access token exists, derive tenantCode directly from JWT payload to ensure 100% token parity
  const token = localStorage.getItem('unilms_access_token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.tenantCode) return payload.tenantCode;
    } catch {}
  }

  const hostname = window.location.hostname.toLowerCase();
  
  if (
    hostname !== 'localhost' &&
    hostname !== '127.0.0.1' &&
    !hostname.endsWith('.internal')
  ) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const sub = parts[0];
      if (!['www', 'api', 'app', 'superadmin', 'admin', 'stage', 'dev'].includes(sub)) {
        return sub.toUpperCase();
      }
    }
  }

  return (
    localStorage.getItem('unilms_tenant_code') ||
    localStorage.getItem('active_org_code') ||
    ''
  );
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('unilms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantCode = getActiveTenantIdentifier();
    if (tenantCode) {
      config.headers['X-Tenant-Code'] = tenantCode;
    }

    if (typeof window !== 'undefined') {
      config.headers['X-Tenant-Domain'] = window.location.hostname;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('unilms_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;
          if (newAccessToken) {
            localStorage.setItem('unilms_access_token', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          localStorage.removeItem('unilms_access_token');
          localStorage.removeItem('unilms_refresh_token');
          localStorage.removeItem('unilms_user');
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/unilms';
          }
        }
      }
    }

    const resData = error.response?.data;
    let errorMessage = 'An unexpected network error occurred.';

    if (resData?.message) {
      errorMessage = Array.isArray(resData.message)
        ? resData.message.join('; ')
        : resData.message;
    } else if (resData?.error) {
      errorMessage = resData.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = error.response?.status;
    enhancedError.response = error.response;
    return Promise.reject(enhancedError);
  }
);

export default apiClient;

