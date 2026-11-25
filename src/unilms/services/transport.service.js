import apiClient from './api';

class TransportService {
  // --- Vehicles ---
  async getVehicles() {
    try {
      const res = await apiClient.get('/transport/vehicles');
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend transport vehicles fetch failed:', e.message);
      return [];
    }
  }

  async createVehicle(data) {
    const res = await apiClient.post('/transport/vehicles', data);
    return res?.data?.data || res?.data || res;
  }

  async updateVehicle(id, data) {
    const res = await apiClient.put(`/transport/vehicles/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteVehicle(id) {
    const res = await apiClient.delete(`/transport/vehicles/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- Routes ---
  async getRoutes() {
    try {
      const res = await apiClient.get('/transport/routes');
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend transport routes fetch failed:', e.message);
      return [];
    }
  }

  async createRoute(data) {
    const res = await apiClient.post('/transport/routes', data);
    return res?.data?.data || res?.data || res;
  }

  async updateRoute(id, data) {
    const res = await apiClient.put(`/transport/routes/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteRoute(id) {
    const res = await apiClient.delete(`/transport/routes/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- Stops / Halts ---
  async getStops(routeId) {
    try {
      const res = await apiClient.get('/transport/stops', { params: routeId ? { routeId } : {} });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend transport stops fetch failed:', e.message);
      return [];
    }
  }

  async createStop(data) {
    const res = await apiClient.post('/transport/stops', data);
    return res?.data?.data || res?.data || res;
  }

  async updateStop(id, data) {
    const res = await apiClient.put(`/transport/stops/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteStop(id) {
    const res = await apiClient.delete(`/transport/stops/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- Subscriptions / Passes ---
  async getSubscriptions(routeId) {
    try {
      const res = await apiClient.get('/transport/subscriptions', { params: routeId ? { routeId } : {} });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend transport subscriptions fetch failed:', e.message);
      return [];
    }
  }

  async createSubscription(data) {
    const res = await apiClient.post('/transport/subscriptions', data);
    return res?.data?.data || res?.data || res;
  }

  async updateSubscription(id, data) {
    const res = await apiClient.put(`/transport/subscriptions/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteSubscription(id) {
    const res = await apiClient.delete(`/transport/subscriptions/${id}`);
    return res?.data?.data || res?.data || res;
  }

  // --- Fleet Maintenance & Fuel Logbook ---
  async getLogs(vehicleId) {
    try {
      const res = await apiClient.get('/transport/logs', { params: vehicleId ? { vehicleId } : {} });
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
    } catch (e) {
      console.warn('Backend transport logs fetch failed:', e.message);
      return [];
    }
  }

  async createLog(data) {
    const res = await apiClient.post('/transport/logs', data);
    return res?.data?.data || res?.data || res;
  }

  async updateLog(id, data) {
    const res = await apiClient.put(`/transport/logs/${id}`, data);
    return res?.data?.data || res?.data || res;
  }

  async deleteLog(id) {
    const res = await apiClient.delete(`/transport/logs/${id}`);
    return res?.data?.data || res?.data || res;
  }
}

export const transportService = new TransportService();
export default transportService;
