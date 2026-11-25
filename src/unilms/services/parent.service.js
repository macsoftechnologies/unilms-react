import apiClient from './api';

export const parentService = {
  getChildren: async (params) => {
    return apiClient.get('/parent/children', { params });
  },

  getStudentOverview: async (studentId) => {
    return apiClient.get(`/parent/student/${studentId}/overview`);
  },

  getAttendance: async (studentId) => {
    return apiClient.get(`/parent/student/${studentId}/attendance`);
  },

  getFees: async (studentId) => {
    return apiClient.get(`/parent/student/${studentId}/fees`);
  },

  payFee: async (studentId, invoiceId, data) => {
    return apiClient.post(`/parent/student/${studentId}/fees/${invoiceId}/pay`, data);
  },

  getMarks: async (studentId) => {
    return apiClient.get(`/parent/student/${studentId}/marks`);
  },

  getHomework: async (studentId) => {
    return apiClient.get(`/parent/student/${studentId}/homework`);
  },

  getTimetable: async (studentId) => {
    return apiClient.get(`/parent/student/${studentId}/timetable`);
  },

  getRemarks: async (studentId) => {
    return apiClient.get(`/parent/student/${studentId}/remarks`);
  },

  createRemark: async (studentId, data) => {
    return apiClient.post(`/parent/student/${studentId}/remarks`, data);
  },
};

export default parentService;
