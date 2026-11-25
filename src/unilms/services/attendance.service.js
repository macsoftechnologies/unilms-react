import apiClient from './api';

class AttendanceService {
  async getRecords(query = {}) {
    try {
      const res = await apiClient.get('/attendance/records', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend attendance records fetch failed:', e.message);
      return [];
    }
  }

  async markBatch(data) {
    const res = await apiClient.post('/attendance/mark-batch', data);
    return res.data || res;
  }

  async getSummary(date) {
    try {
      const res = await apiClient.get('/attendance/summary', { params: date ? { date } : {} });
      return res.data || res;
    } catch (e) {
      console.warn('Backend attendance summary fetch failed:', e.message);
      return null;
    }
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;

