import apiClient from './api';
import parentService from './parent.service';
import studentsService from './students.service';
import academicsService from './academics.service';

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

  /**
   * Get student dashboard overview (Profile, Attendance, Fees, Today's Classes)
   */
  async getDashboardData() {
    const studentId = await this.getActiveStudentId();
    if (!studentId) return null;

    try {
      const overview = await parentService.getStudentOverview(studentId);
      return overview;
    } catch (err) {
      console.warn('Failed to fetch student dashboard data:', err);
      return null;
    }
  }

  /**
   * Get student timetable from database
   */
  async getTimetable() {
    const studentId = await this.getActiveStudentId();
    if (!studentId) return { periods: [], slots: [] };

    try {
      const res = await parentService.getTimetable(studentId);
      const data = (res && res.data) ? res.data : res;
      if (data && data.periods) {
        return {
          periods: Array.isArray(data.periods) ? data.periods : [],
          slots: Array.isArray(data.slots) ? data.slots : [],
          ward: data.ward || null
        };
      }
      return { periods: [], slots: [] };
    } catch (err) {
      console.warn('Failed to fetch timetable:', err);
      return { periods: [], slots: [] };
    }
  }

  /**
   * Get student attendance records from database
   */
  async getAttendance() {
    const studentId = await this.getActiveStudentId();
    if (!studentId) return null;

    try {
      return await parentService.getAttendance(studentId);
    } catch (err) {
      console.warn('Failed to fetch attendance:', err);
      return null;
    }
  }

  /**
   * Get student fee invoices and payment receipts from database
   */
  async getFees() {
    const studentId = await this.getActiveStudentId();
    if (!studentId) return null;

    try {
      return await parentService.getFees(studentId);
    } catch (err) {
      console.warn('Failed to fetch fees:', err);
      return null;
    }
  }

  /**
   * Get student grade card & examination marks from database
   */
  async getMarks(semester) {
    const studentId = await this.getActiveStudentId();
    if (!studentId) return null;

    try {
      const res = await parentService.getMarks(studentId, semester);
      return (res && res.data) ? res.data : res;
    } catch (err) {
      console.warn('Failed to fetch marks:', err);
      return null;
    }
  }

  /**
   * Get student homework, assignments and learning materials from database
   */
  async getAssignments() {
    const studentId = await this.getActiveStudentId();
    if (!studentId) return { assignments: [], materials: [] };

    try {
      const res = await parentService.getHomework(studentId);
      const data = (res && res.data) ? res.data : res;
      return {
        assignments: Array.isArray(data?.assignments) ? data.assignments : [],
        materials: Array.isArray(data?.materials) ? data.materials : []
      };
    } catch (err) {
      console.warn('Failed to fetch assignments:', err);
      return { assignments: [], materials: [] };
    }
  }
}

export const lmsStudentService = new LmsStudentService();
export default lmsStudentService;
