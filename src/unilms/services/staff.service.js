import apiClient from './api';

class StaffService {
  async getStaff(query = {}) {
    try {
      const res = await apiClient.get('/staff', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend staff fetch failed:', e.message);
      return [];
    }
  }

  async getStaffById(id) {
    const res = await apiClient.get(`/staff/${id}`);
    return res.data || res;
  }

  async createStaff(data) {
    const res = await apiClient.post('/staff', data);
    return res.data || res;
  }

  async updateStaff(id, data) {
    const res = await apiClient.put(`/staff/${id}`, data);
    return res.data || res;
  }

  async deleteStaff(id) {
    const res = await apiClient.delete(`/staff/${id}`);
    return res.data || res;
  }

  // Duties & Workload
  async getDuties(query = {}) {
    try {
      const res = await apiClient.get('/staff/duties', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend duties fetch failed:', e.message);
      return [];
    }
  }

  async createDuty(data) {
    const res = await apiClient.post('/staff/duties', data);
    return res.data || res;
  }

  async updateDuty(id, data) {
    const res = await apiClient.put(`/staff/duties/${id}`, data);
    return res.data || res;
  }

  async deleteDuty(id) {
    const res = await apiClient.delete(`/staff/duties/${id}`);
    return res.data || res;
  }

  // Certificates
  async getCertificates(query = {}) {
    try {
      const res = await apiClient.get('/staff/certificates', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend certificates fetch failed:', e.message);
      return [];
    }
  }

  async createCertificate(data) {
    const res = await apiClient.post('/staff/certificates', data);
    return res.data || res;
  }

  async deleteCertificate(id) {
    const res = await apiClient.delete(`/staff/certificates/${id}`);
    return res.data || res;
  }

  // Checklists
  async getChecklists(query = {}) {
    try {
      const res = await apiClient.get('/staff/checklists', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend checklists fetch failed:', e.message);
      return [];
    }
  }

  async createChecklist(data) {
    const res = await apiClient.post('/staff/checklists', data);
    return res.data || res;
  }

  async updateChecklist(id, data) {
    const res = await apiClient.put(`/staff/checklists/${id}`, data);
    return res.data || res;
  }

  async deleteChecklist(id) {
    const res = await apiClient.delete(`/staff/checklists/${id}`);
    return res.data || res;
  }
}

export const staffService = new StaffService();
export default staffService;
