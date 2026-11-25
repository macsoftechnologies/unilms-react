import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient, { getActiveTenantIdentifier } from '../services/api';

export const DEFAULT_TENANTS = [
  {
    id: '',
    code: '',
    name: 'UniLMS Institution Portal',
    tagline: 'Multi-Tenant Unified Cloud Campus',
    domain: '',
    plan: 'Standard',
    cms_enabled: true,
    lms_enabled: true,
    obe_enabled: true,
    branding: {
      primaryColor: '#7C3AED',
      primaryHover: '#6D28D9',
      primaryLight: '#F3E8FF',
      accentColor: '#06B6D4',
      logoUrl: '',
      sidebarTheme: 'purple',
    },
  },
];

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const [tenantList, setTenantList] = useState(DEFAULT_TENANTS);
  const [currentTenant, setCurrentTenant] = useState(DEFAULT_TENANTS[0]);

  // Load live tenants from NestJS backend on mount
  useEffect(() => {
    async function fetchTenants() {
      try {
        const res = await apiClient.get('/tenants/lookup');
        const liveTenants = res.data || res;
        if (Array.isArray(liveTenants) && liveTenants.length > 0) {
          setTenantList(liveTenants);
          const activeCode = getActiveTenantIdentifier();
          const matched = liveTenants.find(t => t.code === activeCode) || liveTenants[0];
          setCurrentTenant(matched);
        }
      } catch (e) {
        console.warn('Backend tenant lookup fallback to default:', e.message);
      }
    }
    fetchTenants();
  }, []);

  // Dynamic CSS variables & page title injection
  useEffect(() => {
    if (!currentTenant) return;

    localStorage.setItem('unilms_tenant_code', currentTenant.code);
    localStorage.setItem('active_org_code', currentTenant.code);
    localStorage.setItem('unilms_active_tenant_id', currentTenant.id);

    const branding = currentTenant.branding || {};
    const root = document.documentElement;

    const primaryColor = branding.primaryColor || currentTenant.primaryColor || '#7C3AED';
    const primaryHover = branding.primaryHover || currentTenant.primaryHover || '#6D28D9';

    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--primary-color', primaryColor);
    root.style.setProperty('--primary-hover', primaryHover);

    document.title = `${currentTenant.name} — UniLMS Platform`;
  }, [currentTenant]);

  const selectTenantByCode = (code) => {
    const target = tenantList.find((t) => t.code.toUpperCase() === code.toUpperCase());
    if (target) {
      setCurrentTenant(target);
      return target;
    }
    return null;
  };

  const registerNewTenant = (newTenantData) => {
    setTenantList((prev) => [newTenantData, ...prev]);
    setCurrentTenant(newTenantData);
  };

  return (
    <TenantContext.Provider
      value={{
        tenant: currentTenant,
        currentTenant,
        allTenants: tenantList,
        selectTenantByCode,
        registerNewTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

