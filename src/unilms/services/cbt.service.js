import apiClient from './api';

let _cachedQuizzes = null;
try {
  const stored = sessionStorage.getItem('unilms_swr_cbt_quizzes');
  if (stored) _cachedQuizzes = JSON.parse(stored);
} catch (e) {}

export const cbtService = {
  // Synchronous cache getters
  getCachedQuizzes: () => _cachedQuizzes,
  hasCachedQuizzes: () => Boolean(_cachedQuizzes && Array.isArray(_cachedQuizzes) && _cachedQuizzes.length > 0),

  // Session / Exam Player
  startOrResumeSession: async (data) => {
    return apiClient.post('/cbt/start', data);
  },

  getSession: async (id) => {
    return apiClient.get(`/cbt/session/${id}`);
  },

  recordHeartbeat: async (id, data) => {
    return apiClient.post(`/cbt/session/${id}/heartbeat`, data);
  },

  submitSession: async (id, data) => {
    return apiClient.post(`/cbt/session/${id}/submit`, data);
  },

  // Quizzes & Question Bank (Module 05)
  getQuizzes: async () => {
    try {
      const res = await apiClient.get('/cbt/quizzes');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      _cachedQuizzes = list;
      try {
        sessionStorage.setItem('unilms_swr_cbt_quizzes', JSON.stringify(list));
      } catch (e) {}
      return list;
    } catch (e) {
      console.warn('Backend quizzes fetch failed:', e.message);
      return _cachedQuizzes || [];
    }
  },

  getQuiz: async (id) => {
    const res = await apiClient.get(`/cbt/quizzes/${id}`);
    return res.data || res;
  },

  createQuiz: async (data) => {
    const res = await apiClient.post('/cbt/quizzes', data);
    return res.data || res;
  },

  updateQuiz: async (id, data) => {
    const res = await apiClient.patch(`/cbt/quizzes/${id}`, data);
    return res.data || res;
  },

  deleteQuiz: async (id) => {
    const res = await apiClient.delete(`/cbt/quizzes/${id}`);
    return res.data || res;
  },

  syncQuestions: async (quizId, questions) => {
    const res = await apiClient.post(`/cbt/quizzes/${quizId}/questions/sync`, { questions });
    return res.data || res;
  },
};

export default cbtService;
