import apiClient from './api';

class LibraryService {
  // --- Dashboard Telemetry ---
  async getStats() {
    try {
      const res = await apiClient.get('/library/stats');
      return res?.data?.data || res?.data || res;
    } catch (e) {
      console.warn('Backend library stats fetch failed:', e.message);
      return null;
    }
  }

  // --- Categories ---
  async getCategories() {
    try {
      const res = await apiClient.get('/library/categories');
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend library categories fetch failed:', e.message);
      return [];
    }
  }

  async createCategory(data) {
    const res = await apiClient.post('/library/categories', data);
    return res?.data?.data || res?.data || res;
  }

  async updateCategory(id, data) {
    const res = await apiClient.put(`/library/categories/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteCategory(id) {
    const res = await apiClient.delete(`/library/categories/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- Books / OPAC ---
  async getBooks(query = {}) {
    try {
      const res = await apiClient.get('/library/books', { params: query });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend library books fetch failed:', e.message);
      return [];
    }
  }

  async createBook(data) {
    const res = await apiClient.post('/library/books', data);
    return res?.data?.data || res?.data || res;
  }

  async updateBook(id, data) {
    const res = await apiClient.put(`/library/books/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteBook(id) {
    const res = await apiClient.delete(`/library/books/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- Circulation Desk (Issues & Returns) ---
  async getIssues(query = {}) {
    try {
      const res = await apiClient.get('/library/issues', { params: query });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend library issues fetch failed:', e.message);
      return [];
    }
  }

  async issueBook(data) {
    const res = await apiClient.post('/library/issues', data);
    return res?.data?.data || res?.data || res;
  }

  async returnBook(id, fineAmount = 0) {
    const res = await apiClient.put(`/library/issues/${id}/return`, { fineAmount });
    return res?.data?.data || res?.data || res;
  }

  async renewBook(id, extensionDays = 14) {
    const res = await apiClient.put(`/library/issues/${id}/renew`, { extensionDays });
    return res?.data?.data || res?.data || res;
  }

  async deleteIssue(id) {
    const res = await apiClient.delete(`/library/issues/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- Library Members ---
  async getMembers(query = {}) {
    try {
      const res = await apiClient.get('/library/members', { params: query });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend library members fetch failed:', e.message);
      return [];
    }
  }

  async createMember(data) {
    const res = await apiClient.post('/library/members', data);
    return res?.data?.data || res?.data || res;
  }

  async updateMember(id, data) {
    const res = await apiClient.put(`/library/members/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteMember(id) {
    const res = await apiClient.delete(`/library/members/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- Periodicals & Journals ---
  async getPeriodicals() {
    try {
      const res = await apiClient.get('/library/periodicals');
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend library periodicals fetch failed:', e.message);
      return [];
    }
  }

  async createPeriodical(data) {
    const res = await apiClient.post('/library/periodicals', data);
    return res?.data?.data || res?.data || res;
  }

  async updatePeriodical(id, data) {
    const res = await apiClient.put(`/library/periodicals/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deletePeriodical(id) {
    const res = await apiClient.delete(`/library/periodicals/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- Suppliers & Vendors ---
  async getSuppliers() {
    try {
      const res = await apiClient.get('/library/suppliers');
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend library suppliers fetch failed:', e.message);
      return [];
    }
  }

  async createSupplier(data) {
    const res = await apiClient.post('/library/suppliers', data);
    return res?.data?.data || res?.data || res;
  }

  async updateSupplier(id, data) {
    const res = await apiClient.put(`/library/suppliers/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteSupplier(id) {
    const res = await apiClient.delete(`/library/suppliers/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- Stock Verification & Audits ---
  async getStockAudits() {
    try {
      const res = await apiClient.get('/library/stock');
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend library stock audits fetch failed:', e.message);
      return [];
    }
  }

  async createStockAudit(data) {
    const res = await apiClient.post('/library/stock', data);
    return res?.data?.data || res?.data || res;
  }

  async updateStockAudit(id, data) {
    const res = await apiClient.put(`/library/stock/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteStockAudit(id) {
    const res = await apiClient.delete(`/library/stock/${id}`);
    return res?.data?.data || res?.data || res;
  }
}

export const libraryService = new LibraryService();
export default libraryService;
