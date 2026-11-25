import apiClient from './api';

class SuperAdminService {
  // --- DASHBOARD TELEMETRY ---
  async getDashboardStats() {
    const res = await apiClient.get('/superadmin/dashboard-stats');
    return res.data || res;
  }

  // --- ORGANIZATIONS (TENANTS) ---
  async getOrganizations() {
    const res = await apiClient.get('/superadmin/tenants');
    const list = res.data || res;
    return Array.isArray(list) ? list : [];
  }

  async getOrganizationById(id) {
    const res = await apiClient.get(`/superadmin/tenants/${id}`);
    return res.data || res;
  }

  async createOrganization(orgData) {
    const code = (orgData.code || `ORG${Date.now()}`).toUpperCase().trim();
    const payload = {
      name: orgData.name,
      code,
      domain: orgData.domain || `${code.toLowerCase()}.unilms.com`,
      adminEmail: orgData.adminEmail || `admin@${code.toLowerCase()}.edu`,
      adminPassword: orgData.adminPassword || 'Password@123',
      planId: Number(orgData.planId) || 2,
      cmsEnabled: orgData.cmsEnabled ?? orgData.cms_enabled ?? true,
      lmsEnabled: orgData.lmsEnabled ?? orgData.lms_enabled ?? true,
      obeEnabled: orgData.obeEnabled ?? orgData.obe_enabled ?? false,
      primaryColor: orgData.primaryColor || '#7C3AED',
      confirmPayment: orgData.confirmPayment ?? true,
      paymentMethod: orgData.paymentMethod || 'Razorpay Online',
    };

    const res = await apiClient.post('/superadmin/tenants', payload);
    return res.data || res;
  }

  async updateOrganization(id, orgData) {
    const payload = {
      name: orgData.name,
      domain: orgData.domain,
      adminEmail: orgData.adminEmail,
      primaryColor: orgData.primaryColor,
      planId: orgData.planId ? Number(orgData.planId) : undefined,
      cmsEnabled: orgData.cmsEnabled ?? orgData.cms_enabled,
      lmsEnabled: orgData.lmsEnabled ?? orgData.lms_enabled,
      obeEnabled: orgData.obeEnabled ?? orgData.obe_enabled,
      status: orgData.status,
    };

    const res = await apiClient.patch(`/superadmin/tenants/${id}`, payload);
    return res.data || res;
  }

  async deleteOrganization(id) {
    const res = await apiClient.delete(`/superadmin/tenants/${id}`);
    return res.data || res;
  }

  async toggleOrganizationStatus(id) {
    const res = await apiClient.patch(`/superadmin/tenants/${id}/status`);
    const data = res.data || res;
    return data?.status || data;
  }

  async renewOrganization(id, renewData) {
    const payload = {
      planId: renewData.planId ? Number(renewData.planId) : undefined,
      amount: renewData.amount ? Number(renewData.amount) : undefined,
      paymentMethod: renewData.paymentMethod || 'Renewal / Offline',
    };
    const res = await apiClient.post(`/superadmin/tenants/${id}/renew`, payload);
    return res.data || res;
  }

  // --- PLANS ---
  async getPlans() {
    const res = await apiClient.get('/superadmin/plans');
    const list = res.data || res;
    return Array.isArray(list) ? list : [];
  }

  async createPlan(planData) {
    const payload = {
      name: planData.name,
      price: Number(planData.price) || 0,
      durationMonths: Number(planData.durationMonths || planData.duration_months) || 1,
      maxStudents: Number(planData.maxStudents) || 1000,
      features: planData.features || '',
      cmsEnabled: planData.cmsEnabled ?? true,
      lmsEnabled: planData.lmsEnabled ?? true,
      obeEnabled: planData.obeEnabled ?? false,
    };
    const res = await apiClient.post('/superadmin/plans', payload);
    return res.data || res;
  }

  async updatePlan(id, planData) {
    const payload = {
      name: planData.name,
      price: planData.price !== undefined ? Number(planData.price) : undefined,
      durationMonths:
        planData.durationMonths !== undefined || planData.duration_months !== undefined
          ? Number(planData.durationMonths || planData.duration_months)
          : undefined,
      maxStudents: planData.maxStudents !== undefined ? Number(planData.maxStudents) : undefined,
      features: planData.features,
      cmsEnabled: planData.cmsEnabled,
      lmsEnabled: planData.lmsEnabled,
      obeEnabled: planData.obeEnabled,
    };
    const res = await apiClient.patch(`/superadmin/plans/${id}`, payload);
    return res.data || res;
  }

  async deletePlan(id) {
    const res = await apiClient.delete(`/superadmin/plans/${id}`);
    return res.data || res;
  }

  // --- PLATFORM ADMINISTRATORS ---
  async getAdmins() {
    const res = await apiClient.get('/superadmin/admins');
    const list = res.data || res;
    return Array.isArray(list) ? list : [];
  }

  async createAdmin(adminData) {
    const payload = {
      email: adminData.email,
      password: adminData.password,
      name: adminData.name || 'Platform Admin',
    };
    const res = await apiClient.post('/superadmin/admins', payload);
    return res.data || res;
  }

  async updateAdmin(id, adminData) {
    const payload = {
      email: adminData.email,
      name: adminData.name,
      password: adminData.password || undefined,
    };
    const res = await apiClient.patch(`/superadmin/admins/${id}`, payload);
    return res.data || res;
  }

  async deleteAdmin(id) {
    const res = await apiClient.delete(`/superadmin/admins/${id}`);
    return res.data || res;
  }

  // --- CONTENT CREATORS ---
  async getCreators() {
    const res = await apiClient.get('/superadmin/creators');
    const list = res.data || res;
    return Array.isArray(list) ? list : [];
  }

  async createCreator(creatorData) {
    const payload = {
      name: creatorData.name,
      email: creatorData.email,
      password: creatorData.password,
      tenantId: creatorData.tenantId,
      status: creatorData.status || 'active',
    };
    const res = await apiClient.post('/superadmin/creators', payload);
    return res.data || res;
  }

  async updateCreator(id, creatorData) {
    const payload = {
      name: creatorData.name,
      email: creatorData.email,
      status: creatorData.status,
      tenantId: creatorData.tenantId,
      password: creatorData.password || undefined,
    };
    const res = await apiClient.patch(`/superadmin/creators/${id}`, payload);
    return res.data || res;
  }

  async deleteCreator(id) {
    const res = await apiClient.delete(`/superadmin/creators/${id}`);
    return res.data || res;
  }

  // --- PAYMENTS ---
  async getPayments() {
    const res = await apiClient.get('/superadmin/payments');
    const list = res.data || res;
    return Array.isArray(list) ? list : [];
  }

  // --- ACTIVITY LOGS ---
  async getActivityLogs() {
    const res = await apiClient.get('/superadmin/activity-logs');
    const list = res.data || res;
    return Array.isArray(list) ? list : [];
  }

  // --- PLATFORM SETTINGS (PAYMENT GATEWAYS, SMTP, SMS) ---
  async getSettings() {
    try {
      const res = await apiClient.get('/superadmin/settings');
      return res.data || res || {};
    } catch (err) {
      console.warn('Failed to fetch platform settings from DB:', err);
      return {};
    }
  }

  async saveSetting(key, data) {
    const res = await apiClient.post(`/superadmin/settings/${key}`, data);
    return res.data || res;
  }
}

export const superAdminService = new SuperAdminService();
export default superAdminService;
