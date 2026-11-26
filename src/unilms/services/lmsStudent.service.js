import apiClient from './api';
import parentService from './parent.service';
import studentsService from './students.service';
import academicsService from './academics.service';

// In-memory + sessionStorage SWR Cache to eliminate tab-switching layout jumps and flickering
const _swrCache = new Map();

function getCachedItem(key) {
  const mem = _swrCache.get(key);
  if (mem) return mem.data;
  try {
    const raw = sessionStorage.getItem(`unilms_swr_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      _swrCache.set(key, { data: parsed, time: Date.now() });
      return parsed;
    }
  } catch (e) {}
  return null;
}

function setCachedItem(key, data) {
  if (data !== undefined && data !== null) {
    _swrCache.set(key, { data, time: Date.now() });
    try {
      sessionStorage.setItem(`unilms_swr_${key}`, JSON.stringify(data));
    } catch (e) {}
  }
}

class LmsStudentService {
  /**
   * Resolve active student ID from session token context.
   */
  async getActiveStudentId() {
    try {
      const stored = localStorage.getItem('unilms_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.studentId) return parsed.studentId;
        if (parsed.role === 'student' && parsed.id) return parsed.id;
      }
    } catch {}
    return null;
  }

  // --- SYNCHRONOUS SWR GETTERS FOR INSTANT ZERO-FLICKER RENDERING ---
  getCachedDashboardData() {
    return getCachedItem('dashboard');
  }

  getCachedTimetable() {
    return getCachedItem('timetable');
  }

  getCachedAttendance() {
    return getCachedItem('attendance');
  }

  getCachedFees() {
    return getCachedItem('fees');
  }

  getCachedMarks(semester) {
    return getCachedItem(`marks_${semester || 'all'}`);
  }

  getCachedAssignments() {
    return getCachedItem('assignments');
  }

  /**
   * Get student dashboard overview (Profile, Attendance, Fees, Today's Classes)
   */
  async getDashboardData() {
    const studentId = await this.getActiveStudentId();
    if (!studentId) return getCachedItem('dashboard');

    try {
      const overview = await parentService.getStudentOverview(studentId);
      if (overview) {
        setCachedItem('dashboard', overview);
      }
      return overview || getCachedItem('dashboard');
    } catch (err) {
      console.warn('Failed to fetch student dashboard data:', err);
      return getCachedItem('dashboard');
    }
  }

  /**
   * Get student timetable from database
   */
  async getTimetable() {
    const studentId = await this.getActiveStudentId();
    if (!studentId) return getCachedItem('timetable') || { periods: [], slots: [] };

    try {
      const res = await parentService.getTimetable(studentId);
      const data = (res && res.data) ? res.data : res;
      if (data && data.periods) {
        const payload = {
          periods: Array.isArray(data.periods) ? data.periods : [],
          slots: Array.isArray(data.slots) ? data.slots : [],
          ward: data.ward || null
        };
        setCachedItem('timetable', payload);
        return payload;
      }
      return getCachedItem('timetable') || { periods: [], slots: [] };
    } catch (err) {
      console.warn('Failed to fetch timetable:', err);
      return getCachedItem('timetable') || { periods: [], slots: [] };
    }
  }

  /**
   * Get student attendance records from database
   */
  async getAttendance() {
    const studentId = await this.getActiveStudentId();
    if (!studentId) return getCachedItem('attendance');

    try {
      const res = await parentService.getAttendance(studentId);
      if (res) {
        setCachedItem('attendance', res);
      }
      return res || getCachedItem('attendance');
    } catch (err) {
      console.warn('Failed to fetch attendance:', err);
      return getCachedItem('attendance');
    }
  }

  /**
   * Get student fee invoices and payment receipts from database
   */
  async getFees() {
    const studentId = await this.getActiveStudentId();
    if (!studentId) return getCachedItem('fees');

    try {
      const res = await parentService.getFees(studentId);
      const data = (res && res.data) ? res.data : res;
      if (data) {
        setCachedItem('fees', data);
      }
      return data || getCachedItem('fees');
    } catch (err) {
      console.warn('Failed to fetch fees:', err);
      return getCachedItem('fees');
    }
  }

  /**
   * Get student grade card & examination marks from database
   */
  async getMarks(semester) {
    const studentId = await this.getActiveStudentId();
    const cacheKey = `marks_${semester || 'all'}`;
    if (!studentId) return getCachedItem(cacheKey);

    try {
      const res = await parentService.getMarks(studentId, semester);
      const data = (res && res.data) ? res.data : res;
      if (data) {
        setCachedItem(cacheKey, data);
      }
      return data || getCachedItem(cacheKey);
    } catch (err) {
      console.warn('Failed to fetch marks:', err);
      return getCachedItem(cacheKey);
    }
  }

  /**
   * Get student homework, assignments and learning materials from database
   */
  async getAssignments() {
    const studentId = await this.getActiveStudentId();
    if (!studentId) return getCachedItem('assignments') || { assignments: [], materials: [] };

    try {
      const res = await parentService.getHomework(studentId);
      const data = (res && res.data) ? res.data : res;
      const payload = {
        assignments: Array.isArray(data?.assignments) ? data.assignments : [],
        materials: Array.isArray(data?.materials) ? data.materials : []
      };
      setCachedItem('assignments', payload);
      return payload;
    } catch (err) {
      console.warn('Failed to fetch assignments:', err);
      return getCachedItem('assignments') || { assignments: [], materials: [] };
    }
  }
}

export const lmsStudentService = new LmsStudentService();
export default lmsStudentService;
