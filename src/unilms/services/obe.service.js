import apiClient from './api';

class ObeService {
  async getCos(subjectId) {
    try {
      const res = await apiClient.get('/obe/cos', { params: subjectId ? { subjectId } : {} });
      return res.data || res;
    } catch (e) {
      console.warn('Backend COs fetch failed:', e.message);
      return [];
    }
  }

  async createCo(data) {
    const res = await apiClient.post('/obe/cos', data);
    return res.data || res;
  }

  async getPos(programId) {
    try {
      const res = await apiClient.get('/obe/pos', { params: programId ? { programId } : {} });
      return res.data || res;
    } catch (e) {
      console.warn('Backend POs fetch failed:', e.message);
      return [];
    }
  }

  async createPo(data) {
    const res = await apiClient.post('/obe/pos', data);
    return res.data || res;
  }

  async getMatrix(subjectId) {
    try {
      const res = await apiClient.get(`/obe/matrix/${subjectId}`);
      return res.data || res;
    } catch (e) {
      console.warn('Backend CO-PO matrix fetch failed:', e.message);
      return { subject: null, cos: [], pos: [], mappings: {} };
    }
  }

  async saveMapping(data) {
    const res = await apiClient.post('/obe/matrix/mapping', data);
    return res.data || res;
  }

  async getAttainmentReport(subjectId, academicYear) {
    try {
      const res = await apiClient.get('/obe/attainment-report', {
        params: { subjectId, academicYear },
      });
      return res.data || res;
    } catch (e) {
      console.warn('Backend attainment report fetch failed:', e.message);
      return { attainments: [], poAttainments: {} };
    }
  }
}

export const obeService = new ObeService();
export default obeService;

