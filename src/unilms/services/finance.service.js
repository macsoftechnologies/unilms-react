import apiClient from './api';

class FinanceService {
  // --- FEE STRUCTURES ---
  async getFeeStructures() {
    try {
      const res = await apiClient.get('/finance/structures');
      return res.data || res;
    } catch (e) {
      console.warn('Backend fee structures fetch failed:', e.message);
      return [];
    }
  }

  async createFeeStructure(data) {
    const res = await apiClient.post('/finance/structures', data);
    return res.data || res;
  }

  async updateFeeStructure(id, data) {
    const res = await apiClient.patch(`/finance/structures/${id}`, data);
    return res.data || res;
  }

  async deleteFeeStructure(id) {
    const res = await apiClient.delete(`/finance/structures/${id}`);
    return res.data || res;
  }

  // --- FEE TYPES ---
  async getFeeTypes() {
    try {
      const res = await apiClient.get('/finance/types');
      return res.data || res;
    } catch (e) {
      console.warn('Backend fee types fetch failed:', e.message);
      return [];
    }
  }

  async createFeeType(data) {
    const res = await apiClient.post('/finance/types', data);
    return res.data || res;
  }

  async updateFeeType(id, data) {
    const res = await apiClient.patch(`/finance/types/${id}`, data);
    return res.data || res;
  }

  async deleteFeeType(id) {
    const res = await apiClient.delete(`/finance/types/${id}`);
    return res.data || res;
  }

  // --- STUDENT INVOICES ---
  async getInvoices(filters = {}) {
    try {
      const res = await apiClient.get('/finance/invoices', { params: filters });
      return res.data || res;
    } catch (e) {
      console.warn('Backend invoices fetch failed:', e.message);
      return [];
    }
  }

  async createInvoice(data) {
    const res = await apiClient.post('/finance/invoices', data);
    return res.data || res;
  }

  async createBulkInvoices(data) {
    const res = await apiClient.post('/finance/invoices/bulk', data);
    return res.data || res;
  }

  // --- PAYMENTS & RECEIPTS ---
  async recordPayment(data) {
    const payload = {
      ...data,
      amountPaid: data.amountPaid !== undefined ? data.amountPaid : data.amount,
      transactionRef: data.transactionRef || data.referenceNo,
    };
    const res = await apiClient.post('/finance/payments', payload);
    return res.data || res;
  }

  async getPaymentReceipt(id) {
    try {
      const res = await apiClient.get(`/finance/payments/${id}/receipt`);
      return res.data || res;
    } catch (e) {
      console.warn('Backend receipt fetch failed:', e.message);
      return null;
    }
  }

  // --- DAYBOOK ---
  async getDaybook(date) {
    try {
      const res = await apiClient.get('/finance/daybook', { params: date ? { date } : {} });
      return res.data || res;
    } catch (e) {
      console.warn('Backend daybook fetch failed:', e.message);
      return { entries: [], openingBalance: 0, totalInflow: 0, totalOutflow: 0, closingBalance: 0 };
    }
  }

  async createDaybookEntry(data) {
    const res = await apiClient.post('/finance/daybook', data);
    return res.data || res;
  }
}

export const financeService = new FinanceService();
export default financeService;
