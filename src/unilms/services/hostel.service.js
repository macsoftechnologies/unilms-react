import apiClient from './api';

class HostelService {
  async getHostels() {
    try {
      const res = await apiClient.get('/hostel');
      return Array.isArray(res) ? res : (res?.data || []);
    } catch (e) {
      console.warn('Backend hostels fetch failed:', e.message);
      return [];
    }
  }

  async createHostel(data) {
    const res = await apiClient.post('/hostel', data);
    return res?.data || res;
  }

  async updateHostel(id, data) {
    const res = await apiClient.put(`/hostel/${id}`, data);
    return res?.data || res;
  }

  async deleteHostel(id) {
    const res = await apiClient.delete(`/hostel/${id}`);
    return res?.data || res;
  }

  async getRooms(hostelId) {
    try {
      const res = await apiClient.get('/hostel/rooms', {
        params: hostelId && hostelId !== 'all' ? { hostelId } : {},
      });
      return Array.isArray(res) ? res : (res?.data || []);
    } catch (e) {
      console.warn('Backend hostel rooms fetch failed:', e.message);
      return [];
    }
  }

  async createRoom(data) {
    const res = await apiClient.post('/hostel/rooms', data);
    return res?.data || res;
  }

  async updateRoom(id, data) {
    const res = await apiClient.put(`/hostel/rooms/${id}`, data);
    return res?.data || res;
  }

  async deleteRoom(id) {
    const res = await apiClient.delete(`/hostel/rooms/${id}`);
    return res?.data || res;
  }

  async getAllocations(roomId) {
    try {
      const res = await apiClient.get('/hostel/allocations', {
        params: roomId ? { roomId } : {},
      });
      return Array.isArray(res) ? res : (res?.data || []);
    } catch (e) {
      console.warn('Backend hostel allocations fetch failed:', e.message);
      return [];
    }
  }

  async createAllocation(data) {
    const res = await apiClient.post('/hostel/allocations', data);
    return res?.data || res;
  }

  async deleteAllocation(id) {
    const res = await apiClient.delete(`/hostel/allocations/${id}`);
    return res?.data || res;
  }

  async getOutings(status) {
    try {
      const res = await apiClient.get('/hostel/outings', {
        params: status && status !== 'all' ? { status } : {},
      });
      return Array.isArray(res) ? res : (res?.data || []);
    } catch (e) {
      console.warn('Backend hostel outings fetch failed:', e.message);
      return [];
    }
  }

  async createOuting(data) {
    const res = await apiClient.post('/hostel/outings', data);
    return res?.data || res;
  }

  async updateOutingStatus(id, status) {
    const res = await apiClient.put(`/hostel/outings/${id}/status`, { status });
    return res?.data || res;
  }

  async deleteOuting(id) {
    const res = await apiClient.delete(`/hostel/outings/${id}`);
    return res?.data || res;
  }
}

export const hostelService = new HostelService();
export default hostelService;
