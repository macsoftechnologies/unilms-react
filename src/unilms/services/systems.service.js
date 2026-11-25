import apiClient from './api';

export const systemsService = {
  getUsers: async () => {
    const res = await apiClient.get('/auth/users');
    return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
  },

  createUser: async (data) => {
    const res = await apiClient.post('/auth/users', data);
    return res?.data?.data || res?.data || res;
  },

  updateUser: async (id, data) => {
    const res = await apiClient.put(`/auth/users/${id}`, data);
    return res?.data?.data || res?.data || res;
  },

  deleteUser: async (id) => {
    const res = await apiClient.delete(`/auth/users/${id}`);
    return res?.data?.data || res?.data || res;
  },

  getAccessGroups: async () => {
    const res = await apiClient.get('/auth/access-groups');
    return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
  }
};
