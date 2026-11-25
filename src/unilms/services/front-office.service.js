import apiClient from './api';

class FrontOfficeService {
  // --- Dashboard Telemetry ---
  async getStats() {
    try {
      const res = await apiClient.get('/front-office/stats');
      return res?.data?.data || res?.data || res;
    } catch (e) {
      console.warn('Backend front-office stats fetch failed:', e.message);
      return null;
    }
  }

  // --- 1. Visitor Gatepasses & Badges ---
  async getVisitors(status) {
    try {
      const res = await apiClient.get('/front-office/visitors', { params: status ? { status } : {} });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend visitors fetch failed:', e.message);
      return [];
    }
  }

  async getVisitorById(id) {
    const res = await apiClient.get(`/front-office/visitors/${id}`);
    return res?.data?.data || res?.data || res;
  }

  async createVisitor(data) {
    const res = await apiClient.post('/front-office/visitors', data);
    return res?.data?.data || res?.data || res;
  }

  async updateVisitor(id, data) {
    const res = await apiClient.put(`/front-office/visitors/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async checkoutVisitor(id) {
    const res = await apiClient.put(`/front-office/visitors/${id}/checkout`);
    return res?.data?.data || res?.data || res;
  }

  async deleteVisitor(id) {
    const res = await apiClient.delete(`/front-office/visitors/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- 2. Postal & Courier Dispatches ---
  async getPostal(type) {
    try {
      const res = await apiClient.get('/front-office/postal', { params: type ? { type } : {} });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend postal fetch failed:', e.message);
      return [];
    }
  }

  async createPostal(data) {
    const res = await apiClient.post('/front-office/postal', data);
    return res?.data?.data || res?.data || res;
  }

  async updatePostal(id, data) {
    const res = await apiClient.put(`/front-office/postal/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deletePostal(id) {
    const res = await apiClient.delete(`/front-office/postal/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- 3. Telephonic Call Logs ---
  async getCalls() {
    try {
      const res = await apiClient.get('/front-office/calls');
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend calls fetch failed:', e.message);
      return [];
    }
  }

  async createCall(data) {
    const res = await apiClient.post('/front-office/calls', data);
    return res?.data?.data || res?.data || res;
  }

  async updateCall(id, data) {
    const res = await apiClient.put(`/front-office/calls/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteCall(id) {
    const res = await apiClient.delete(`/front-office/calls/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- 4. Admission & Public Enquiries ---
  async getEnquiries(params = {}) {
    try {
      const res = await apiClient.get('/front-office/enquiries', { params });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend enquiries fetch failed:', e.message);
      return [];
    }
  }

  async createEnquiry(data) {
    const res = await apiClient.post('/front-office/enquiries', data);
    return res?.data?.data || res?.data || res;
  }

  async updateEnquiry(id, data) {
    const res = await apiClient.put(`/front-office/enquiries/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async addFollowup(id, data) {
    const res = await apiClient.post(`/front-office/enquiries/${id}/followups`, data);
    return res?.data?.data || res?.data || res;
  }

  async convertToLead(id) {
    const res = await apiClient.post(`/front-office/enquiries/${id}/convert-to-lead`);
    return res?.data?.data || res?.data || res;
  }

  async deleteEnquiry(id) {
    const res = await apiClient.delete(`/front-office/enquiries/${id}`);
    return res?.data?.data || res?.data || res;
  }
}

export const frontOfficeService = new FrontOfficeService();
export default frontOfficeService;
