import apiClient from './api';

class LeavesService {
  async getLeaves(query = {}) {
    try {
      const res = await apiClient.get('/leaves', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend leaves fetch failed:', e.message);
      return [];
    }
  }

  async applyLeave(data) {
    const res = await apiClient.post('/leaves', data);
    return res.data || res;
  }

  async updateLeaveStatus(id, status, approvedBy = 'Campus Administrator') {
    const res = await apiClient.patch(`/leaves/${id}/status`, { status, approvedBy });
    return res.data || res;
  }

  async deleteLeave(id) {
    const res = await apiClient.delete(`/leaves/${id}`);
    return res.data || res;
  }
}

export const leavesService = new LeavesService();
export default leavesService;

