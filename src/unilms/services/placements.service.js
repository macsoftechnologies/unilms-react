import apiClient from './api';

class PlacementsService {
  // --- COMPANIES ---
  async getCompanies() {
    try {
      const res = await apiClient.get('/placements/companies');
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('Backend companies fetch failed:', e.message);
      return [];
    }
  }

  async createCompany(data) {
    const res = await apiClient.post('/placements/companies', data);
    return res.data || res;
  }

  async updateCompany(id, data) {
    const res = await apiClient.patch(`/placements/companies/${id}`, data);
    return res.data || res;
  }

  async deleteCompany(id) {
    const res = await apiClient.delete(`/placements/companies/${id}`);
    return res.data || res;
  }

  // --- RECRUITMENT DRIVES ---
  async getDrives() {
    try {
      const res = await apiClient.get('/placements/drives');
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('Backend drives fetch failed:', e.message);
      return [];
    }
  }

  async createDrive(data) {
    const res = await apiClient.post('/placements/drives', data);
    return res.data || res;
  }

  async updateDrive(id, data) {
    const res = await apiClient.patch(`/placements/drives/${id}`, data);
    return res.data || res;
  }

  async deleteDrive(id) {
    const res = await apiClient.delete(`/placements/drives/${id}`);
    return res.data || res;
  }

  // --- CANDIDATE APPLICATIONS ---
  async getApplications(driveId) {
    try {
      const res = await apiClient.get('/placements/applications', {
        params: driveId ? { driveId } : {},
      });
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('Backend applications fetch failed:', e.message);
      return [];
    }
  }

  async createApplication(data) {
    const res = await apiClient.post('/placements/applications', data);
    return res.data || res;
  }

  async updateApplicationStage(id, data) {
    const res = await apiClient.patch(`/placements/applications/${id}`, data);
    return res.data || res;
  }

  async deleteApplication(id) {
    const res = await apiClient.delete(`/placements/applications/${id}`);
    return res.data || res;
  }

  // --- JOB OFFERS ---
  async getOffers() {
    try {
      const res = await apiClient.get('/placements/offers');
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('Backend offers fetch failed:', e.message);
      return [];
    }
  }

  async createOffer(data) {
    const res = await apiClient.post('/placements/offers', data);
    return res.data || res;
  }

  async updateOffer(id, data) {
    const res = await apiClient.patch(`/placements/offers/${id}`, data);
    return res.data || res;
  }

  async deleteOffer(id) {
    const res = await apiClient.delete(`/placements/offers/${id}`);
    return res.data || res;
  }

  // --- INTERNSHIPS ---
  async getInternships() {
    try {
      const res = await apiClient.get('/placements/internships');
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('Backend internships fetch failed:', e.message);
      return [];
    }
  }

  async createInternship(data) {
    const res = await apiClient.post('/placements/internships', data);
    return res.data || res;
  }

  async updateInternship(id, data) {
    const res = await apiClient.patch(`/placements/internships/${id}`, data);
    return res.data || res;
  }

  async deleteInternship(id) {
    const res = await apiClient.delete(`/placements/internships/${id}`);
    return res.data || res;
  }
}

export const placementsService = new PlacementsService();
export default placementsService;
