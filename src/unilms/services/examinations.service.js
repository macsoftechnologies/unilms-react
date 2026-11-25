import apiClient from './api';

class ExaminationsService {
  async getExams() {
    try {
      const res = await apiClient.get('/examinations');
      return res.data || res;
    } catch (e) {
      console.warn('Backend exams fetch failed:', e.message);
      return [];
    }
  }

  async createExam(data) {
    const res = await apiClient.post('/examinations', data);
    return res.data || res;
  }

  async updateExam(id, data) {
    const res = await apiClient.patch(`/examinations/${id}`, data);
    return res.data || res;
  }

  async deleteExam(id) {
    const res = await apiClient.delete(`/examinations/${id}`);
    return res.data || res;
  }

  async getSchedules(examId) {
    try {
      const res = await apiClient.get('/examinations/schedules', { params: examId ? { examId } : {} });
      return res.data || res;
    } catch (e) {
      console.warn('Backend exam schedules fetch failed:', e.message);
      return [];
    }
  }

  async createSchedule(data) {
    const res = await apiClient.post('/examinations/schedules', data);
    return res.data || res;
  }

  async updateSchedule(id, data) {
    const res = await apiClient.patch(`/examinations/schedules/${id}`, data);
    return res.data || res;
  }

  async deleteSchedule(id) {
    const res = await apiClient.delete(`/examinations/schedules/${id}`);
    return res.data || res;
  }

  async getMarks(scheduleId) {
    try {
      const res = await apiClient.get(`/examinations/schedules/${scheduleId}/marks`);
      return res.data || res;
    } catch (e) {
      console.warn('Backend exam marks fetch failed:', e.message);
      return [];
    }
  }

  async saveMarks(scheduleId, marks) {
    const res = await apiClient.post(`/examinations/schedules/${scheduleId}/marks`, { marks });
    return res.data || res;
  }

  async getHallTicket(studentId, examId) {
    try {
      const res = await apiClient.get('/examinations/hall-ticket', { params: { studentId, examId } });
      return res.data || res;
    } catch (e) {
      console.warn('Backend hall ticket fetch failed:', e.message);
      return null;
    }
  }

  async getReports(examId) {
    try {
      const res = await apiClient.get('/examinations/reports', { params: examId ? { examId } : {} });
      return res.data || res;
    } catch (e) {
      console.warn('Backend examination reports fetch failed:', e.message);
      return null;
    }
  }

  // --- ACADEMIC BACKLOGS & ARREARS ---
  async getBacklogs() {
    try {
      const res = await apiClient.get('/examinations/backlogs');
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('Backend backlogs fetch failed:', e.message);
      return [];
    }
  }

  async createBacklog(data) {
    const res = await apiClient.post('/examinations/backlogs', data);
    return res.data || res;
  }

  async updateBacklog(id, data) {
    const res = await apiClient.patch(`/examinations/backlogs/${id}`, data);
    return res.data || res;
  }

  async deleteBacklog(id) {
    const res = await apiClient.delete(`/examinations/backlogs/${id}`);
    return res.data || res;
  }
}

export const examinationsService = new ExaminationsService();
export default examinationsService;
