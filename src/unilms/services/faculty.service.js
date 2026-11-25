import apiClient from './api';

export const facultyService = {
  // 0. Workspace Telemetry & Privileges
  getStats: async (params) => {
    return apiClient.get('/faculty/stats', { params });
  },

  getPrivileges: async (params) => {
    return apiClient.get('/faculty/me/privileges', { params });
  },

  // 1. Subject Allocations
  getAllocations: async (params) => {
    return apiClient.get('/faculty/allocations', { params });
  },

  createAllocation: async (data) => {
    return apiClient.post('/faculty/allocations', data);
  },

  deleteAllocation: async (id) => {
    return apiClient.delete(`/faculty/allocations/${id}`);
  },

  // 2. Class Sessions & Period Attendance
  getSessions: async (params) => {
    return apiClient.get('/faculty/sessions', { params });
  },

  getSessionById: async (id) => {
    return apiClient.get(`/faculty/sessions/${id}`);
  },

  createSession: async (data) => {
    return apiClient.post('/faculty/sessions', data);
  },

  // 3. Continuous Assessments & Marks
  getAssessments: async (params) => {
    return apiClient.get('/faculty/assessments', { params });
  },

  createAssessment: async (data) => {
    return apiClient.post('/faculty/assessments', data);
  },

  deleteAssessment: async (id) => {
    return apiClient.delete(`/faculty/assessments/${id}`);
  },

  getAssessmentMarks: async (assessmentId) => {
    return apiClient.get(`/faculty/assessments/${assessmentId}/marks`);
  },

  saveAssessmentMarks: async (assessmentId, marks) => {
    return apiClient.post(`/faculty/assessments/${assessmentId}/marks`, { marks });
  },

  // 4. Lesson Plans & Syllabus Delivery
  getLessonPlans: async (params) => {
    return apiClient.get('/faculty/lesson-plans', { params });
  },

  createLessonPlan: async (data) => {
    return apiClient.post('/faculty/lesson-plans', data);
  },

  updateLessonPlan: async (id, data) => {
    return apiClient.patch(`/faculty/lesson-plans/${id}`, data);
  },

  deleteLessonPlan: async (id) => {
    return apiClient.delete(`/faculty/lesson-plans/${id}`);
  },

  // 5. Class Monitor & Defaulters
  getCohortDefaulters: async (cohortName) => {
    return apiClient.get('/faculty/monitor/defaulters', { params: { cohortName } });
  },

  // 6. Faculty Timetable
  getTimetable: async (params) => {
    return apiClient.get('/faculty/timetable', { params });
  },

  // 7. Faculty Leaves
  getLeaves: async (params) => {
    return apiClient.get('/faculty/leaves', { params });
  },

  applyLeave: async (data) => {
    return apiClient.post('/faculty/leaves', data);
  },

  updateLeaveStatus: async (id, status, approvedBy) => {
    return apiClient.patch(`/faculty/leaves/${id}/status`, { status, approvedBy });
  },

  deleteLeave: async (id) => {
    return apiClient.delete(`/faculty/leaves/${id}`);
  },

  // 8. Faculty Directory Profiles
  getProfiles: async (params) => {
    return apiClient.get('/faculty/profiles', { params });
  },

  createProfile: async (data) => {
    return apiClient.post('/faculty/profiles', data);
  },

  updateProfile: async (id, data) => {
    return apiClient.put(`/faculty/profiles/${id}`, data);
  },

  deleteProfile: async (id) => {
    return apiClient.delete(`/faculty/profiles/${id}`);
  },
};

export default facultyService;
