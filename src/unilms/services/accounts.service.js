import apiClient from './api';

class AccountsService {
  // --- 1. Dashboard Overview Telemetry ---
  async getStats() {
    try {
      const res = await apiClient.get('/accounts/stats');
      return res?.data?.data || res?.data || res;
    } catch (e) {
      console.warn('Backend accounts stats fetch failed:', e.message);
      return null;
    }
  }

  // --- 2. Chart of Accounts (Account Heads) ---
  async getHeads(type, search) {
    try {
      const params = {};
      if (type && type !== 'All') params.type = type;
      if (search) params.search = search;
      const res = await apiClient.get('/accounts/heads', { params });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend account heads fetch failed:', e.message);
      return [];
    }
  }

  async createHead(data) {
    const res = await apiClient.post('/accounts/heads', data);
    return res?.data?.data || res?.data || res;
  }

  async updateHead(id, data) {
    const res = await apiClient.put(`/accounts/heads/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteHead(id) {
    const res = await apiClient.delete(`/accounts/heads/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- 3. Bank & Cash Accounts ---
  async getBanks(type, search) {
    try {
      const params = {};
      if (type && type !== 'All') params.type = type;
      if (search) params.search = search;
      const res = await apiClient.get('/accounts/banks', { params });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend bank accounts fetch failed:', e.message);
      return [];
    }
  }

  async createBank(data) {
    const res = await apiClient.post('/accounts/banks', data);
    return res?.data?.data || res?.data || res;
  }

  async updateBank(id, data) {
    const res = await apiClient.put(`/accounts/banks/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteBank(id) {
    const res = await apiClient.delete(`/accounts/banks/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- 4. Double-Entry Voucher Transactions ---
  async getTransactions(filters = {}) {
    try {
      const res = await apiClient.get('/accounts/transactions', { params: filters });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend transactions fetch failed:', e.message);
      return [];
    }
  }

  async createTransaction(data) {
    const res = await apiClient.post('/accounts/transactions', data);
    return res?.data?.data || res?.data || res;
  }

  async updateTransaction(id, data) {
    const res = await apiClient.put(`/accounts/transactions/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteTransaction(id) {
    const res = await apiClient.delete(`/accounts/transactions/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- 5. Daily Daybook Journal ---
  async getDaybook(date) {
    try {
      const res = await apiClient.get('/accounts/daybook', { params: date ? { date } : {} });
      return res?.data?.data || res?.data || res;
    } catch (e) {
      console.warn('Backend daybook fetch failed:', e.message);
      return { entries: [], openingBalance: 0, totalInflow: 0, totalOutflow: 0, closingBalance: 0 };
    }
  }

  // --- 6. Profit & Loss / Income & Expenditure Statement ---
  async getPlStatement(startDate, endDate) {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await apiClient.get('/accounts/pl-statement', { params });
      return res?.data?.data || res?.data || res;
    } catch (e) {
      console.warn('Backend PL statement fetch failed:', e.message);
      return { totalIncome: 0, totalExpense: 0, netSurplus: 0, incomeBreakdown: [], expenseBreakdown: [] };
    }
  }
}

export const accountsService = new AccountsService();
export default accountsService;
