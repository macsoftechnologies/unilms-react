import apiClient from './api';

class AdmissionsService {
  async getDashboardStats() {
    try {
      const res = await apiClient.get('/admissions/dashboard-stats');
      return res.data || res;
    } catch (e) {
      console.warn('Backend dashboard stats fetch failed:', e.message);
      return null;
    }
  }

  // --- LEADS ---
  async getLeads(query = {}) {
    try {
      const res = await apiClient.get('/admissions/leads', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend leads fetch failed:', e.message);
      return [];
    }
  }

  async createLead(data) {
    const payload = {
      ...data,
      fullName: data.fullName || data.full_name,
      phone: data.phone,
    };
    const res = await apiClient.post('/admissions/leads', payload);
    return res.data || res;
  }

  async updateLead(id, data) {
    const payload = {
      ...data,
      fullName: data.fullName || data.full_name,
      phone: data.phone,
    };
    const res = await apiClient.patch(`/admissions/leads/${id}`, payload);
    return res.data || res;
  }

  async deleteLead(id) {
    const res = await apiClient.delete(`/admissions/leads/${id}`);
    return res.data || res;
  }

  // --- APPLICATIONS ---
  async getApplications(query = {}) {
    try {
      const res = await apiClient.get('/admissions/applications', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend applications fetch failed:', e.message);
      return [];
    }
  }

  async createApplication(data) {
    const res = await apiClient.post('/admissions/applications', data);
    return res.data || res;
  }

  async updateApplicationStatus(id, status) {
    const res = await apiClient.patch(`/admissions/applications/${id}/status`, { status });
    return res.data || res;
  }

  async issueOfferLetter(id, data = {}) {
    const res = await apiClient.post(`/admissions/applications/${id}/offer-letter`, data);
    return res.data || res;
  }

  async enrollApplication(id, data = {}) {
    const res = await apiClient.post(`/admissions/applications/${id}/enroll`, data);
    return res.data || res;
  }

  async deleteApplication(id) {
    const res = await apiClient.delete(`/admissions/applications/${id}`);
    return res.data || res;
  }

  // --- DOCUMENTS ---
  async getDocuments(query = {}) {
    try {
      const res = await apiClient.get('/admissions/documents', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend documents fetch failed:', e.message);
      return [];
    }
  }

  async uploadDocument(applicationId, data) {
    const res = await apiClient.post(`/admissions/documents/${applicationId}`, data);
    return res.data || res;
  }

  async updateDocumentVerification(id, data) {
    const res = await apiClient.patch(`/admissions/documents/${id}`, data);
    return res.data || res;
  }

  // --- CATEGORIES ---
  async getCategories() {
    try {
      const res = await apiClient.get('/admissions/categories');
      return res.data || res;
    } catch (e) {
      console.warn('Backend categories fetch failed:', e.message);
      return [];
    }
  }

  async createCategory(data) {
    const res = await apiClient.post('/admissions/categories', data);
    return res.data || res;
  }

  async updateCategory(id, data) {
    const res = await apiClient.patch(`/admissions/categories/${id}`, data);
    return res.data || res;
  }

  async deleteCategory(id) {
    const res = await apiClient.delete(`/admissions/categories/${id}`);
    return res.data || res;
  }

  // --- SCHOLARSHIPS ---
  async getScholarships(query = {}) {
    try {
      const res = await apiClient.get('/admissions/scholarships', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend scholarships fetch failed:', e.message);
      return [];
    }
  }

  async createScholarship(data) {
    const res = await apiClient.post('/admissions/scholarships', data);
    return res.data || res;
  }

  async updateScholarship(id, data) {
    const res = await apiClient.patch(`/admissions/scholarships/${id}`, data);
    return res.data || res;
  }

  async deleteScholarship(id) {
    const res = await apiClient.delete(`/admissions/scholarships/${id}`);
    return res.data || res;
  }

  // --- PAYMENTS ---
  async getPayments(query = {}) {
    try {
      const res = await apiClient.get('/admissions/payments', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend payments fetch failed:', e.message);
      return [];
    }
  }

  async createPayment(data) {
    const res = await apiClient.post('/admissions/payments', data);
    return res.data || res;
  }

  // --- COLLEGE STRENGTH CENSUS ---
  async getCollegeStrength() {
    try {
      const res = await apiClient.get('/admissions/college-strength');
      return res.data || res;
    } catch (e) {
      console.warn('Backend college strength fetch failed:', e.message);
      return [];
    }
  }

  // --- DETAINED STUDENTS ---
  async getDetainedStudents() {
    try {
      const res = await apiClient.get('/admissions/detained');
      return res.data || res;
    } catch (e) {
      console.warn('Backend detained fetch failed:', e.message);
      return [];
    }
  }

  async readmitStudent(id) {
    const res = await apiClient.post(`/admissions/detained/${id}/readmit`);
    return res.data || res;
  }

  // --- CONVERSION FUNNEL ---
  async getFunnel() {
    try {
      const res = await apiClient.get('/admissions/funnel');
      return res.data || res;
    } catch (e) {
      console.warn('Backend funnel fetch failed:', e.message);
      return [];
    }
  }
}

export const admissionsService = new AdmissionsService();
export default admissionsService;

