import apiClient from './api';

class AcademicsService {
  // --- DEPARTMENTS ---
  async getDepartments() {
    try {
      const res = await apiClient.get('/academics/departments');
      return res.data || res;
    } catch (e) {
      console.warn('Backend departments fetch failed:', e.message);
      return [];
    }
  }

  async createDepartment(data) {
    const res = await apiClient.post('/academics/departments', data);
    return res.data || res;
  }

  async updateDepartment(id, data) {
    const res = await apiClient.put(`/academics/departments/${id}`, data);
    return res.data || res;
  }

  async deleteDepartment(id) {
    const res = await apiClient.delete(`/academics/departments/${id}`);
    return res.data || res;
  }

  // --- PROGRAMS ---
  async getPrograms() {
    try {
      const res = await apiClient.get('/academics/programs');
      return res.data || res;
    } catch (e) {
      console.warn('Backend programs fetch failed:', e.message);
      return [];
    }
  }

  async createProgram(data) {
    const res = await apiClient.post('/academics/programs', data);
    return res.data || res;
  }

  async updateProgram(id, data) {
    const res = await apiClient.put(`/academics/programs/${id}`, data);
    return res.data || res;
  }

  async deleteProgram(id) {
    const res = await apiClient.delete(`/academics/programs/${id}`);
    return res.data || res;
  }

  // --- ACADEMIC YEARS ---
  async getAcademicYears() {
    try {
      const res = await apiClient.get('/academics/academic-years');
      return res.data || res;
    } catch (e) {
      console.warn('Backend academic years fetch failed:', e.message);
      return [];
    }
  }

  async createAcademicYear(data) {
    const res = await apiClient.post('/academics/academic-years', data);
    return res.data || res;
  }

  async updateAcademicYear(id, data) {
    const res = await apiClient.put(`/academics/academic-years/${id}`, data);
    return res.data || res;
  }

  async deleteAcademicYear(id) {
    const res = await apiClient.delete(`/academics/academic-years/${id}`);
    return res.data || res;
  }

  // --- SEMESTERS ---
  async getSemesters() {
    try {
      const res = await apiClient.get('/academics/semesters');
      return res.data || res;
    } catch (e) {
      console.warn('Backend semesters fetch failed:', e.message);
      return [];
    }
  }

  async createSemester(data) {
    const res = await apiClient.post('/academics/semesters', data);
    return res.data || res;
  }

  async updateSemester(id, data) {
    const res = await apiClient.put(`/academics/semesters/${id}`, data);
    return res.data || res;
  }

  async deleteSemester(id) {
    const res = await apiClient.delete(`/academics/semesters/${id}`);
    return res.data || res;
  }

  // --- COHORTS & SECTIONS ---
  async getCohorts() {
    try {
      const res = await apiClient.get('/academics/cohorts');
      return res.data || res;
    } catch (e) {
      console.warn('Backend cohorts fetch failed:', e.message);
      return [];
    }
  }

  async createCohort(data) {
    const res = await apiClient.post('/academics/cohorts', data);
    return res.data || res;
  }

  async updateCohort(id, data) {
    const res = await apiClient.put(`/academics/cohorts/${id}`, data);
    return res.data || res;
  }

  async deleteCohort(id) {
    const res = await apiClient.delete(`/academics/cohorts/${id}`);
    return res.data || res;
  }

  // --- SECTIONS ---
  async getSections() {
    try {
      const res = await apiClient.get('/academics/sections');
      return res.data || res;
    } catch (e) {
      console.warn('Backend sections fetch failed:', e.message);
      return [];
    }
  }

  async createSection(data) {
    const res = await apiClient.post('/academics/sections', data);
    return res.data || res;
  }

  async updateSection(id, data) {
    const res = await apiClient.put(`/academics/sections/${id}`, data);
    return res.data || res;
  }

  async deleteSection(id) {
    const res = await apiClient.delete(`/academics/sections/${id}`);
    return res.data || res;
  }

  // --- SUBJECTS ---
  async getSubjects() {
    try {
      const res = await apiClient.get('/academics/subjects');
      return res.data || res;
    } catch (e) {
      console.warn('Backend subjects fetch failed:', e.message);
      return [];
    }
  }

  async createSubject(data) {
    const res = await apiClient.post('/academics/subjects', data);
    return res.data || res;
  }

  async updateSubject(id, data) {
    const res = await apiClient.put(`/academics/subjects/${id}`, data);
    return res.data || res;
  }

  async deleteSubject(id) {
    const res = await apiClient.delete(`/academics/subjects/${id}`);
    return res.data || res;
  }

  // --- ACCESS GROUPS (RBAC) ---
  async getAccessGroups() {
    try {
      const res = await apiClient.get('/academics/access-groups');
      return res.data || res;
    } catch (e) {
      console.warn('Backend access groups fetch failed:', e.message);
      return [];
    }
  }

  async createAccessGroup(data) {
    const res = await apiClient.post('/academics/access-groups', data);
    return res.data || res;
  }

  async updateAccessGroup(id, data) {
    const res = await apiClient.put(`/academics/access-groups/${id}`, data);
    return res.data || res;
  }

  async deleteAccessGroup(id) {
    const res = await apiClient.delete(`/academics/access-groups/${id}`);
    return res.data || res;
  }

  // --- REGULATIONS ---
  async getRegulations() {
    try {
      const res = await apiClient.get('/academics/regulations');
      return res.data || res;
    } catch (e) {
      console.warn('Backend regulations fetch failed:', e.message);
      return [];
    }
  }

  async createRegulation(data) {
    const res = await apiClient.post('/academics/regulations', data);
    return res.data || res;
  }

  async updateRegulation(id, data) {
    const res = await apiClient.put(`/academics/regulations/${id}`, data);
    return res.data || res;
  }

  async deleteRegulation(id) {
    const res = await apiClient.delete(`/academics/regulations/${id}`);
    return res.data || res;
  }

  // --- TIMETABLE & PERIODS ---
  async getTimetablePeriods() {
    try {
      const res = await apiClient.get('/academics/timetable/periods');
      return res.data || res;
    } catch (e) {
      console.warn('Backend timetable periods fetch failed:', e.message);
      return [];
    }
  }

  async createTimetablePeriod(data) {
    const res = await apiClient.post('/academics/timetable/periods', data);
    return res.data || res;
  }

  async deleteTimetablePeriod(id) {
    const res = await apiClient.delete(`/academics/timetable/periods/${id}`);
    return res.data || res;
  }

  async getTimetableSlots(params) {
    try {
      const res = await apiClient.get('/academics/timetable/slots', { params });
      return res.data || res;
    } catch (e) {
      console.warn('Backend timetable slots fetch failed:', e.message);
      return [];
    }
  }

  async saveTimetableSlot(data) {
    const res = await apiClient.post('/academics/timetable/slots', data);
    return res.data || res;
  }

  async deleteTimetableSlot(id) {
    const res = await apiClient.delete(`/academics/timetable/slots/${id}`);
    return res.data || res;
  }

  // --- STUDY MATERIALS ---
  async getStudyMaterials(params) {
    try {
      const res = await apiClient.get('/academics/materials', { params });
      return res.data || res;
    } catch (e) {
      console.warn('Backend materials fetch failed:', e.message);
      return [];
    }
  }

  async createStudyMaterial(data) {
    const res = await apiClient.post('/academics/materials', data);
    return res.data || res;
  }

  async deleteStudyMaterial(id) {
    const res = await apiClient.delete(`/academics/materials/${id}`);
    return res.data || res;
  }

  async updateStudyMaterial(id, data) {
    const res = await apiClient.patch(`/academics/materials/${id}`, data);
    return res.data || res;
  }

  // --- CONTINUOUS ASSESSMENTS & ASSIGNMENTS ---
  async getAssessments(params) {
    try {
      const res = await apiClient.get('/academics/assessments', { params });
      return res.data || res;
    } catch (e) {
      console.warn('Backend assessments fetch failed:', e.message);
      return [];
    }
  }

  async createAssessment(data) {
    const res = await apiClient.post('/academics/assessments', data);
    return res.data || res;
  }

  async updateAssessment(id, data) {
    const res = await apiClient.patch(`/academics/assessments/${id}`, data);
    return res.data || res;
  }

  async deleteAssessment(id) {
    const res = await apiClient.delete(`/academics/assessments/${id}`);
    return res.data || res;
  }

  async getAssessmentMarks(assessmentId) {
    try {
      const res = await apiClient.get(`/academics/assessments/${assessmentId}/marks`);
      return res.data || res;
    } catch (e) {
      console.warn('Backend assessment marks fetch failed:', e.message);
      return [];
    }
  }

  async saveAssessmentMarks(assessmentId, marks) {
    const res = await apiClient.post(`/academics/assessments/${assessmentId}/marks`, { marks });
    return res.data || res;
  }
}

export const academicsService = new AcademicsService();
export default academicsService;
