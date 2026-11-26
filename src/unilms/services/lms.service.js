import apiClient from './api';

let _cachedCourses = null;
try {
  const stored = sessionStorage.getItem('unilms_swr_courses');
  if (stored) _cachedCourses = JSON.parse(stored);
} catch (e) {}

export const lmsService = {
  getCachedCourses: () => _cachedCourses,

  getCourses: async (params) => {
    try {
      const res = await apiClient.get('/lms/courses', { params });
      const data = (res && res.data) ? res.data : res;
      _cachedCourses = data;
      try {
        sessionStorage.setItem('unilms_swr_courses', JSON.stringify(data));
      } catch (e) {}
      return res;
    } catch (e) {
      if (_cachedCourses) return { data: _cachedCourses };
      throw e;
    }
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
