import apiClient from './api';

export const notificationsService = {
  getNotifications: async (params) => {
    return apiClient.get('/notifications', { params });
  },

  markAsRead: async (id) => {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  createNotification: async (data) => {
    return apiClient.post('/notifications', data);
  },
};

export default notificationsService;

