import apiClient from './api';

export const lmsService = {
  getCourses: async (params) => {
    return apiClient.get('/lms/courses', { params });
  },

  getCourseById: async (id) => {
    return apiClient.get(`/lms/courses/${id}`);
  },

  createCourse: async (data) => {
    return apiClient.post('/lms/courses', data);
  },

  updateCourse: async (id, data) => {
    return apiClient.put(`/lms/courses/${id}`, data);
  },

  addModule: async (courseId, data) => {
    return apiClient.post(`/lms/courses/${courseId}/modules`, data);
  },

  addLesson: async (moduleId, data) => {
    return apiClient.post(`/lms/modules/${moduleId}/lessons`, data);
  },

  enrollCourse: async (courseId, studentId) => {
    return apiClient.post(`/lms/courses/${courseId}/enroll`, { studentId });
  },

  getMyCourses: async (studentId) => {
    return apiClient.get('/lms/my-courses', { params: { studentId } });
  },

  updateProgress: async (courseId, studentId, progressPct) => {
    return apiClient.patch(`/lms/courses/${courseId}/progress`, { studentId, progressPct });
  },
};

export default lmsService;

