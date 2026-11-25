import apiClient from './api';

class PayrollService {
  async getPayrollRuns() {
    try {
      const res = await apiClient.get('/payroll/runs');
      return res.data || res;
    } catch (e) {
      console.warn('Backend payroll runs fetch failed:', e.message);
      return [];
    }
  }

  async generatePayrollRun(data) {
    const res = await apiClient.post('/payroll/runs', data);
    return res.data || res;
  }

  async disbursePayroll(runId) {
    const res = await apiClient.post(`/payroll/runs/${runId}/disburse`);
    return res.data || res;
  }

  async getPayslips(query = {}) {
    try {
      const res = await apiClient.get('/payroll/payslips', { params: query });
      return res.data || res;
    } catch (e) {
      console.warn('Backend payslips fetch failed:', e.message);
      return [];
    }
  }

  // Components
  async getComponents() {
    try {
      const res = await apiClient.get('/payroll/components');
      return res.data || res;
    } catch (e) {
      console.warn('Backend payroll components fetch failed:', e.message);
      return [];
    }
  }

  async createComponent(data) {
    const res = await apiClient.post('/payroll/components', data);
    return res.data || res;
  }

  async updateComponent(id, data) {
    const res = await apiClient.put(`/payroll/components/${id}`, data);
    return res.data || res;
  }

  async deleteComponent(id) {
    const res = await apiClient.delete(`/payroll/components/${id}`);
    return res.data || res;
  }

  // Structures
  async getStructures() {
    try {
      const res = await apiClient.get('/payroll/structures');
      return res.data || res;
    } catch (e) {
      console.warn('Backend salary structures fetch failed:', e.message);
      return [];
    }
  }

  async createStructure(data) {
    const res = await apiClient.post('/payroll/structures', data);
    return res.data || res;
  }

  async updateStructure(id, data) {
    const res = await apiClient.put(`/payroll/structures/${id}`, data);
    return res.data || res;
  }

  async deleteStructure(id) {
    const res = await apiClient.delete(`/payroll/structures/${id}`);
    return res.data || res;
  }
}

export const payrollService = new PayrollService();
export default payrollService;
