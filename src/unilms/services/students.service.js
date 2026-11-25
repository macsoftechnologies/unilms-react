import apiClient from './api';

class StudentsService {
  async getStudents(query = {}) {
    try {
      const res = await apiClient.get('/students', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend students fetch failed:', e.message);
      return [];
    }
  }

  async getStudentById(id) {
    const res = await apiClient.get(`/students/${id}`);
    return res.data || res;
  }

  async createStudent(data) {
    const res = await apiClient.post('/students', data);
    return res.data || res;
  }

  async bulkImport(students) {
    const res = await apiClient.post('/students/bulk-import', { students });
    return res.data || res;
  }

  async updateStudent(id, data) {
    const res = await apiClient.put(`/students/${id}`, data);
    return res.data || res;
  }

  async deleteStudent(id) {
    const res = await apiClient.delete(`/students/${id}`);
    return res.data || res;
  }

  async bulkPromote(data) {
    const res = await apiClient.post('/students/bulk-promote', data);
    return res.data || res;
  }

  // --- STUDENT PORTAL & DIGITAL ID ---
  async getSelfServiceSummary(studentId) {
    const res = await apiClient.get('/students/portal/self-service-summary', { params: { studentId } });
    return res.data || res;
  }

  async getDigitalId(studentId) {
    const res = await apiClient.get('/students/portal/digital-id', { params: { studentId } });
    return res.data || res;
  }

  async getCertificateRequests(studentId) {
    const res = await apiClient.get('/students/portal/certificate-requests', { params: { studentId } });
    return res.data || res;
  }

  async createCertificateRequest(data) {
    const res = await apiClient.post('/students/portal/certificate-requests', data);
    return res.data || res;
  }

  async getComplaints(studentId) {
    const res = await apiClient.get('/students/portal/complaints', { params: { studentId } });
    return res.data || res;
  }

  async createComplaint(data) {
    const res = await apiClient.post('/students/portal/complaints', data);
    return res.data || res;
  }

  async updateComplaint(id, data) {
    const res = await apiClient.patch(`/students/portal/complaints/${id}`, data);
    return res.data || res;
  }

  async getFeedbacks(studentId) {
    const res = await apiClient.get('/students/portal/feedbacks', { params: { studentId } });
    return res.data || res;
  }

  async createFeedback(data) {
    const res = await apiClient.post('/students/portal/feedbacks', data);
    return res.data || res;
  }

  async getAcademicNotices() {
    const res = await apiClient.get('/students/portal/notices');
    return res.data || res;
  }

  async createAcademicNotice(data) {
    const res = await apiClient.post('/students/portal/notices', data);
    return res.data || res;
  }

  async getExamRegistrations(studentId) {
    const res = await apiClient.get('/students/portal/exam-registrations', { params: { studentId } });
    return res.data || res;
  }

  async createExamRegistration(data) {
    const res = await apiClient.post('/students/portal/exam-registrations', data);
    return res.data || res;
  }
}

export const studentsService = new StudentsService();
export default studentsService;

