import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import academicsService from '../../../services/academics.service';
import { facultyService } from '../../../services/faculty.service';
import staffService from '../../../services/staff.service';

const OrgAcademicsSubjects = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const location = useLocation();
  const userRole = (localStorage.getItem('org_user_role') || 'admin').toLowerCase();
  const isFacultyUser = userRole === 'faculty' || location.pathname.includes('/faculty');

  // Dynamic Verified Faculty Privileges (isClassTeacher, isHOD)
  const [privileges, setPrivileges] = useState(() => {
    try {
      const cached = localStorage.getItem('unilms_privileges');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      isFaculty: isFacultyUser,
      isClassTeacher: false,
      isHOD: false,
      designation: '',
      department: ''
    };
  });

  const [activeRole, setActiveRole] = useState(() => isFacultyUser ? 'faculty' : 'branches'); // 'branches' | 'faculty' | 'class_teacher' | 'hod'
  const [selectedProgramId, setSelectedProgramId] = useState(null); // null = branch cards list; '1'/'2' = branch detail
  
  useEffect(() => {
    if (isFacultyUser) {
      const fetchPrivs = async () => {
        try {
          const storedUser = localStorage.getItem('unilms_user');
          const parsed = storedUser ? JSON.parse(storedUser) : null;
          const res = await facultyService.getPrivileges({
            email: parsed?.email || localStorage.getItem('org_user_email'),
            staffId: parsed?.id
          });
          const privData = (res && res.isFaculty !== undefined) ? res : (res?.data || res);
          if (privData) {
            setPrivileges(privData);
            localStorage.setItem('unilms_privileges', JSON.stringify(privData));
          }
        } catch (e) {
          console.warn('Failed to fetch faculty privileges in subjects:', e);
        }
      };
      fetchPrivs();
    }
  }, [isFacultyUser]);
  
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [facultySubjects, setFacultySubjects] = useState([]);
  const [batchSubjectsList, setBatchSubjectsList] = useState([]);
  const [hodSubjectsList, setHodSubjectsList] = useState([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal Form State
  const [formProgramId, setFormProgramId] = useState('1');
  const [formSemesterId, setFormSemesterId] = useState('1');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formCredits, setFormCredits] = useState('4.0');
  const [formType, setFormType] = useState('Theory');
  const [formSessions, setFormSessions] = useState('45');
  const [formUnits, setFormUnits] = useState('5');
  const [formOutcomes, setFormOutcomes] = useState('6');
  const [formInternalMax, setFormInternalMax] = useState('40');
  const [formInternalPass, setFormInternalPass] = useState('16');
  const [formExternalMax, setFormExternalMax] = useState('60');
  const [formExternalPass, setFormExternalPass] = useState('24');

  // Filters inside Branch detail view
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterType, setFilterType] = useState('');

  const loadSubjectsData = async () => {
    try {
      const [subsRes, progsRes, allocsRes] = await Promise.allSettled([
        academicsService.getSubjects(),
        academicsService.getPrograms(),
        facultyService.getAllocations(),
      ]);

      const subs = subsRes.status === 'fulfilled' && Array.isArray(subsRes.value) ? subsRes.value : [];
      const progs = progsRes.status === 'fulfilled' && Array.isArray(progsRes.value) ? progsRes.value : [];
      const allocs = allocsRes.status === 'fulfilled' && Array.isArray(allocsRes.value) ? allocsRes.value : [];

      const formattedProgs = progs.map((p) => ({
        id: p.id,
        department_id: p.departmentId || p.department?.id,
        departmentId: p.departmentId || p.department?.id,
        code: p.code,
        name: p.name,
        department_name: p.department?.name || '—',
        department_code: p.department?.code || '—',
        total_semesters: (p.durationYears || 4) * 2,
      }));
      setPrograms(formattedProgs);

      const formattedSubs = subs.map((s) => {
        const matchedProg = formattedProgs.find((p) => p.department_id === s.departmentId);
        return {
          ...s,
          program_id: matchedProg ? matchedProg.id : (formattedProgs[0]?.id || '1'),
          short_name: s.shortName || s.code,
          credits: Number(s.credits || 3.0),
          semester_id: '1',
          semester_name: 'Semester 1',
          sessions: s.sessions || 45,
          units: 5,
          outcomes: 6,
          internal_max: 40,
          internal_pass: 16,
          external_max: 60,
          external_pass: 24,
        };
      });
      setSubjects(formattedSubs);

      // --- 1. DYNAMIC COURSE FACULTY DATA (Tab 2) ---
      let dynamicFaculty = allocs.map((a) => ({
        id: a.id,
        code: a.subject?.code || 'N/A',
        name: a.subject?.name || 'Untitled Course',
        short_name: a.subject?.shortName || a.subject?.code || 'N/A',
        type: a.subject?.type || 'Theory',
        credits: Number(a.subject?.credits || 3.0),
        cohort_name: a.cohortName || '—',
        enrolled_count: a.enrolledCount || 0,
        faculty_name: a.staff ? `${a.staff.firstName} ${a.staff.lastName || ''}`.trim() : 'Unassigned',
        employee_code: a.staff?.employeeCode || '—',
        semester_name: a.semesterName || 'Semester 1',
        sessions: a.subject?.sessions || 45,
      }));

      // If no allocations yet, surface database subjects as ready-for-instruction
      if (dynamicFaculty.length === 0 && formattedSubs.length > 0) {
        dynamicFaculty = formattedSubs.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          short_name: s.short_name,
          type: s.type || 'Theory',
          credits: s.credits,
          cohort_name: '—',
          enrolled_count: 0,
          faculty_name: 'Unassigned',
          employee_code: '—',
          semester_name: 'Semester 1',
          sessions: s.sessions,
        }));
      }
      setFacultySubjects(dynamicFaculty);

      // --- 2. DYNAMIC CLASS TEACHER BATCH DATA (Tab 3) ---
      const dynamicBatch = formattedSubs.map((s) => {
        const matchingAlloc = allocs.find((a) => a.subjectId === s.id);
        return {
          id: s.id,
          code: s.code,
          name: s.name,
          subject_type: s.type || 'Theory',
          type: s.type || 'Theory',
          credits: s.credits,
          faculty_name: matchingAlloc?.staff
            ? `${matchingAlloc.staff.firstName} ${matchingAlloc.staff.lastName || ''}`.trim()
            : 'Unassigned',
          employee_code: matchingAlloc?.staff?.employeeCode || '—',
          attendance_avg: '—',
        };
      });
      setBatchSubjectsList(dynamicBatch);

      // --- 3. DYNAMIC HOD DESK DATA (Tab 4) ---
      const dynamicHod = formattedSubs.map((s) => {
        const matchingAlloc = allocs.find((a) => a.subjectId === s.id);
        const assignedProf = matchingAlloc?.staff
          ? `${matchingAlloc.staff.firstName} ${matchingAlloc.staff.lastName || ''}`.trim()
          : 'Pending Allocation';
        const empCode = matchingAlloc?.staff?.employeeCode || 'UNASSIGNED';

        return {
          id: s.id,
          code: s.code,
          name: s.name,
          semester_name: 'Semester 1',
          faculty_name: assignedProf,
          employee_code: empCode,
          allocated_faculty: assignedProf,
          department: s.department?.name || '—',
          workload_hours: 4,
          credits: s.credits,
          type: s.type || 'Theory',
          status: matchingAlloc ? 'Allocated' : 'Pending',
        };
      });
      setHodSubjectsList(dynamicHod);
    } catch (e) {
      console.warn('Failed to fetch subjects or programs:', e);
      setSubjects([]);
      setPrograms([]);
    }
  };

  useEffect(() => {
    loadSubjectsData();
  }, []);

  // Sync role and program with window.location.hash (#curriculum, #faculty, #class-teacher, #hod, #BTECH-CSE)
  useEffect(() => {
    const rawHash = (window.location.hash || '').replace('#', '').trim();
    if (!rawHash) {
      setActiveRole('branches');
      setSelectedProgramId(null);
      return;
    }

    const lower = rawHash.toLowerCase();
    if (lower === 'faculty') {
      setActiveRole('faculty');
      setSelectedProgramId(null);
      return;
    }
    if (lower === 'class-teacher' || lower === 'class_teacher') {
      setActiveRole('class_teacher');
      setSelectedProgramId(null);
      return;
    }
    if (lower === 'hod') {
      setActiveRole('hod');
      setSelectedProgramId(null);
      return;
    }

    // Role is branches / curriculum
    setActiveRole('branches');
    let branchCode = rawHash;
    if (lower.startsWith('curriculum/')) {
      branchCode = rawHash.substring(11);
    } else if (lower === 'curriculum') {
      setSelectedProgramId(null);
      return;
    }

    if (programs.length > 0 && branchCode) {
      const match = programs.find(
        (p) => p.code?.toUpperCase() === branchCode.toUpperCase() || p.id === branchCode
      );
      if (match) setSelectedProgramId(match.id);
    }
  }, [location.hash, programs]);

  const handleRoleChange = (role) => {
    if (isFacultyUser) {
      if (role === 'class_teacher' && !privileges.isClassTeacher) return;
      if (role === 'hod' && !privileges.isHOD) return;
      if (role === 'branches' && !privileges.isHOD) return;
    }
    setActiveRole(role);
    if (role === 'branches') {
      const match = programs.find((p) => p.id === selectedProgramId);
      window.location.hash = match ? `curriculum/${match.code}` : 'curriculum';
    } else if (role === 'faculty') {
      window.location.hash = 'faculty';
    } else if (role === 'class_teacher') {
      window.location.hash = 'class-teacher';
    } else if (role === 'hod') {
      window.location.hash = 'hod';
    }
    setLoading(true);
    setTimeout(() => setLoading(false), 300);
  };

  const selectProgram = (prog) => {
    setSelectedProgramId(prog.id);
    window.location.hash = `curriculum/${prog.code}`;
  };

  const backToBranches = () => {
    setSelectedProgramId(null);
    window.location.hash = 'curriculum';
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openAddModal = (progId) => {
    setEditingSubjectId(null);
    const targetProgId = selectedProgramId || progId || (programs[0]?.id || '1');
    setFormProgramId(targetProgId);
    setFormSemesterId('1');
    setFormCode('');
    setFormName('');
    setFormShortName('');
    setFormCredits('4.0');
    setFormType('Theory');
    setShowAdvanced(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (sub) => {
    setEditingSubjectId(sub.id);
    setFormProgramId(sub.program_id);
    setFormSemesterId(sub.semester_id || '3');
    setFormCode(sub.code);
    setFormName(sub.name);
    setFormShortName(sub.short_name || '');
    setFormCredits(String(sub.credits));
    setFormType(sub.type || 'Theory');
    setFormSessions(String(sub.sessions || 45));
    setFormUnits(String(sub.units || 5));
    setFormOutcomes(String(sub.outcomes || 6));
    setFormInternalMax(String(sub.internal_max || 40));
    setFormInternalPass(String(sub.internal_pass || 16));
    setFormExternalMax(String(sub.external_max || 60));
    setFormExternalPass(String(sub.external_pass || 24));
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) return;

    const isEdit = Boolean(editingSubjectId);
    const confirmed = await confirm({
      title: isEdit ? 'Confirm Update Subject' : 'Confirm Create Academic Subject',
      message: `${isEdit ? 'Save modifications for subject' : 'Add new subject'} "${formCode.trim().toUpperCase()} - ${formName.trim()}"?`,
      details: [
        `Code: ${formCode.trim().toUpperCase()}`,
        `Title: ${formName.trim()}`,
        `Credits: ${parseFloat(formCredits) || 3.0} Credits`,
        `Type: ${formType}`,
        `Lecture Sessions: ${parseInt(formSessions) || 45} Hours`
      ],
      confirmText: isEdit ? 'Yes, Update Subject' : 'Yes, Add Subject',
      variant: isEdit ? 'primary' : 'success',
      icon: isEdit ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-book-medical'
    });
    if (!confirmed) return;

    try {
      const targetProg = programs.find(p => p.id === formProgramId);
      const deptId = targetProg?.department_id || targetProg?.departmentId;

      if (editingSubjectId) {
        await academicsService.updateSubject(editingSubjectId, {
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          departmentId: deptId,
          credits: parseFloat(formCredits) || 3.0,
          type: formType,
          sessions: parseInt(formSessions) || 45,
        });
        showToast(`Subject ${formCode.trim().toUpperCase()} updated successfully!`);
      } else {
        await academicsService.createSubject({
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          departmentId: deptId,
          credits: parseFloat(formCredits) || 4.0,
          type: formType,
          sessions: parseInt(formSessions) || 45,
        });
        showToast(`Subject ${formCode.trim().toUpperCase()} added successfully!`);
      }
      await loadSubjectsData();
      setIsAddModalOpen(false);
    } catch (err) {
      alert('Failed to save subject: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteSubject = async (id, code) => {
    const confirmed = await confirm({
      title: 'Confirm Delete Academic Subject',
      message: `Permanently delete course subject "${code}"?`,
      details: 'This will remove the course curriculum, syllabus mapping, faculty allocations, and timetable slots associated with this subject.',
      confirmText: 'Yes, Delete Subject',
      variant: 'danger',
      icon: 'fa-solid fa-trash-can'
    });
    if (!confirmed) return;

    try {
      await academicsService.deleteSubject(id);
      showToast(`Subject ${code} removed.`);
      await loadSubjectsData();
    } catch (err) {
      alert('Failed to delete subject: ' + (err.response?.data?.message || err.message));
    }
  };

  // Program metrics calculation
  const getProgramMetrics = (progId) => {
    const progSubs = subjects.filter(s => s.program_id === progId);
    const totalCredits = progSubs.reduce((acc, curr) => acc + (parseFloat(curr.credits) || 0), 0);
    return {
      count: progSubs.length,
      credits: totalCredits
    };
  };

  const currentProgram = programs.find(p => p.id === selectedProgramId);
  const currentProgramSubjects = selectedProgramId
    ? subjects.filter(s => s.program_id === selectedProgramId).filter(s => {
        const q = searchQuery.toLowerCase();
        const matchesQuery = !q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.short_name && s.short_name.toLowerCase().includes(q));
        const matchesSem = !filterSemester || s.semester_id === filterSemester;
        const matchesType = !filterType || s.type === filterType;
        return matchesQuery && matchesSem && matchesType;
      })
    : [];

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedSubjects,
    totalItems
  } = useTablePagination(currentProgramSubjects, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProgramId, searchQuery, filterSemester, filterType, setCurrentPage]);

  // Persona 1: Faculty search, filter & pagination
  const [facultySearchQuery, setFacultySearchQuery] = useState('');
  const [facultyFilterType, setFacultyFilterType] = useState('');

  const filteredFacultySubjects = useMemo(() => {
    return facultySubjects.filter((sub) => {
      const q = facultySearchQuery.toLowerCase();
      const matchSearch =
        !q ||
        sub.code.toLowerCase().includes(q) ||
        sub.name.toLowerCase().includes(q) ||
        (sub.short_name && sub.short_name.toLowerCase().includes(q));
      const matchType = !facultyFilterType || sub.type.toLowerCase().includes(facultyFilterType.toLowerCase());
      return matchSearch && matchType;
    });
  }, [facultySubjects, facultySearchQuery, facultyFilterType]);

  const facultyPagination = useTablePagination(filteredFacultySubjects, 10);

  // Persona 2: Class Teacher search, filter & pagination
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [batchFilterType, setBatchFilterType] = useState('');

  const filteredBatchSubjects = useMemo(() => {
    return batchSubjectsList.filter((sub) => {
      const q = batchSearchQuery.toLowerCase();
      const matchSearch =
        !q ||
        sub.code.toLowerCase().includes(q) ||
        sub.name.toLowerCase().includes(q) ||
        sub.faculty_name.toLowerCase().includes(q) ||
        sub.employee_code.toLowerCase().includes(q);
      const matchType = !batchFilterType || (sub.subject_type || sub.type).toLowerCase() === batchFilterType.toLowerCase();
      return matchSearch && matchType;
    });
  }, [batchSubjectsList, batchSearchQuery, batchFilterType]);

  const batchPagination = useTablePagination(filteredBatchSubjects, 10);

  // Persona 3: HOD search, filter & pagination
  const [hodSearchQuery, setHodSearchQuery] = useState('');
  const [hodFilterSemester, setHodFilterSemester] = useState('');

  const filteredHodSubjects = useMemo(() => {
    return hodSubjectsList.filter((sub) => {
      const q = hodSearchQuery.toLowerCase();
      const matchSearch =
        !q ||
        sub.code.toLowerCase().includes(q) ||
        sub.name.toLowerCase().includes(q) ||
        sub.faculty_name.toLowerCase().includes(q) ||
        sub.employee_code.toLowerCase().includes(q);
      const matchSem = !hodFilterSemester || sub.semester_name.toLowerCase().includes(hodFilterSemester.toLowerCase());
      return matchSearch && matchSem;
    });
  }, [hodSubjectsList, hodSearchQuery, hodFilterSemester]);

  const hodPagination = useTablePagination(filteredHodSubjects, 10);

  const handleManualRefresh = () => {
    setLoading(true);
    loadSubjectsData().then(() => setLoading(false));
  };

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* Global Academic Instruction Header Banner */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)', borderRadius: '16px', padding: '20px 24px', color: '#fff', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 10px 25px -8px rgba(79, 70, 229, 0.35)' }}>
          <div style={{ flex: '1 1 auto', minWidth: '280px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#a5b4fc', marginBottom: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'auto', height: 'auto', minWidth: 'auto', boxShadow: 'none' }}>
              <i className="fa-solid fa-graduation-cap"></i> Academic Instruction &amp; Curriculum Portal
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px', color: '#ffffff', lineHeight: 1.3 }}>
              {activeRole === 'branches' && 'Department Curriculum & Academic Course Subjects'}
              {activeRole === 'faculty' && 'My Allocated Teaching Courses & Coursework Workbench'}
              {activeRole === 'class_teacher' && 'Class Teacher Batch Curriculum — B.Tech CSE (Section A)'}
              {activeRole === 'hod' && 'Department Curriculum & Faculty Allocation Matrix'}
            </h1>
            <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.4 }}>
              {activeRole === 'branches' && 'Manage semester-wise subjects, credits, syllabus units, and degree requirements'}
              {activeRole === 'faculty' && 'Operational teaching suite • Take lecture attendance, enter continuous evaluations, and map outcomes'}
              {activeRole === 'class_teacher' && 'Proctoring desk for Section A • Review all semester subjects, faculty in-charge, and attendance health'}
              {activeRole === 'hod' && 'Cross-faculty syllabus completion audit and AICTE teaching workloads'}
            </div>
          </div>

          {/* Persona Switcher: Only render if user has multiple authorized contexts */}
          {(!isFacultyUser || privileges.isClassTeacher || privileges.isHOD) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
              <div style={{ fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', color: '#e0e7ff', letterSpacing: '0.5px' }}>Switch Role Context:</div>
              <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '3px', borderRadius: '12px', backdropFilter: 'blur(8px)', gap: '4px' }}>
                {(!isFacultyUser || privileges.isHOD) && (
                  <button
                    type="button"
                    onClick={() => { handleRoleChange('branches'); setSelectedProgramId(null); }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: activeRole === 'branches' ? '#fff' : 'transparent',
                      color: activeRole === 'branches' ? '#1e1b4b' : '#fff'
                    }}
                  >
                    <i className="fa-solid fa-graduation-cap"></i> Branch Curriculum
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRoleChange('faculty')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: activeRole === 'faculty' ? '#fff' : 'transparent',
                    color: activeRole === 'faculty' ? '#1e1b4b' : '#fff'
                  }}
                >
                  <i className="fa-solid fa-chalkboard-user"></i> Course Faculty
                </button>
                {(!isFacultyUser || privileges.isClassTeacher) && (
                  <button
                    type="button"
                    onClick={() => handleRoleChange('class_teacher')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: activeRole === 'class_teacher' ? '#fff' : 'transparent',
                      color: activeRole === 'class_teacher' ? '#1e1b4b' : '#fff'
                    }}
                  >
                    <i className="fa-solid fa-users-rectangle"></i> Class Teacher
                  </button>
                )}
                {(!isFacultyUser || privileges.isHOD) && (
                  <button
                    type="button"
                    onClick={() => handleRoleChange('hod')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: activeRole === 'hod' ? '#fff' : 'transparent',
                      color: activeRole === 'hod' ? '#1e1b4b' : '#fff'
                    }}
                  >
                    <i className="fa-solid fa-landmark"></i> HOD Desk
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            VIEW 1: BRANCH CURRICULUM (Default & Matches Screenshot!)
            ======================================================== */}
        {activeRole === 'branches' && (
          <>
            {/* If NO branch is selected -> Show the 2 Program Cards View from Screenshot */}
            {selectedProgramId === null ? (
              <div>
                {/* Top Header Card matching Reference UI (Image 1 & 2) */}
                <div
                  style={{
                    background: 'var(--card-bg, #fff)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: 'clamp(16px, 3vw, 22px) clamp(18px, 3vw, 26px)',
                    marginBottom: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        minWidth: '46px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
                      }}
                    >
                      <i className="fa-solid fa-book-open"></i>
                    </div>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                        Curriculum Subjects &amp; Syllabus Repository
                      </h2>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                        Configure branch courses, elective options, semester schemes &amp; lecture credits &bull; AY 2026&ndash;2027
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top 3 Stat Cards from Screenshot */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      <i className="fa-solid fa-diagram-project"></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Programs</div>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{programs.length}</div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      <i className="fa-solid fa-book-bookmark"></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Subjects</div>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{subjects.length}</div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      <i className="fa-solid fa-layer-group"></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Active Semesters</div>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>8</div>
                    </div>
                  </div>
                </div>

                {/* Program Cards Grid matching user's screenshot exactly! */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))', gap: '20px' }}>
                  {programs.map(prog => {
                    const metrics = getProgramMetrics(prog.id);
                    return (
                      <div
                        key={prog.id}
                        style={{
                          background: 'var(--card-bg, #fff)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '16px',
                          padding: '22px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontWeight: '800', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.5px' }}>
                              {prog.code}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', background: 'var(--bg-main, #f1f5f9)', padding: '4px 10px', borderRadius: '6px' }}>
                              Dept: {prog.department_code}
                            </span>
                          </div>

                          <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                            {prog.name}
                          </h3>

                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                            {prog.department_name}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '12px', background: 'var(--bg-main, #f8fafc)', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: '800', color: '#7C3AED' }}>{metrics.count}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>Subjects</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: '800', color: '#059669' }}>{metrics.credits}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>Credits</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: '800', color: '#2563EB' }}>{prog.total_semesters}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>Semesters</div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => selectProgram(prog)}
                            className="btn btn-primary"
                            style={{
                              width: '100%',
                              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                              border: 'none',
                              padding: '11px 16px',
                              fontWeight: '700',
                              fontSize: '13px',
                              borderRadius: '10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              color: '#fff',
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                            }}
                          >
                            <i className="fa-solid fa-eye"></i> View &amp; Manage Subjects
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* If A Program IS Selected -> Show Branch Subjects Detail Table View */
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => backToBranches()}
                    style={{
                      background: 'none',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#7C3AED',
                      cursor: 'pointer',
                      padding: 0,
                      marginBottom: '12px'
                    }}
                  >
                    <i className="fa-solid fa-arrow-left"></i> Back to All Academic Branches
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {currentProgram?.name}
                        </h2>
                        <span style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontWeight: '800', fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }}>
                          {currentProgram?.code}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {currentProgram?.department_name} &bull; {currentProgramSubjects.length} Course Subjects &bull; {currentProgramSubjects.reduce((acc, s) => acc + (parseFloat(s.credits) || 0), 0)} Total Credits
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => openAddModal(selectedProgramId)}
                        style={{
                          background: '#7C3AED',
                          border: 'none',
                          padding: '10px 18px',
                          fontWeight: '700',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#fff',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)'
                        }}
                      >
                        <i className="fa-solid fa-plus-circle"></i> Add Subject to this Branch
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', flex: 1, maxWidth: '750px' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                      <i className="fa-solid fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '13px' }}></i>
                      <input
                        type="text"
                        placeholder="Search code, title, alias in this branch..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="form-control"
                        style={{ paddingLeft: '36px', height: '38px', fontSize: '13px', borderRadius: '8px' }}
                      />
                    </div>

                    <select
                      value={filterSemester}
                      onChange={(e) => setFilterSemester(e.target.value)}
                      className="form-control"
                      style={{ width: 'auto', minWidth: '150px', height: '38px', fontSize: '13px', borderRadius: '8px' }}
                    >
                      <option value="">All Semesters</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Semester 3</option>
                      <option value="4">Semester 4</option>
                      <option value="5">Semester 5</option>
                      <option value="6">Semester 6</option>
                      <option value="7">Semester 7</option>
                      <option value="8">Semester 8</option>
                    </select>

                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="form-control"
                      style={{ width: 'auto', minWidth: '140px', height: '38px', fontSize: '13px', borderRadius: '8px' }}
                    >
                      <option value="">All Types</option>
                      <option value="Theory">Theory</option>
                      <option value="Lab">Lab</option>
                      <option value="Specialization">Specialization</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      Total in Branch: <strong>{currentProgramSubjects.length}</strong>
                    </span>
                  </div>
                </div>

                {/* Subjects Table */}
                <div className="table-container" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                        <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Code</th>
                        <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Subject Title</th>
                        <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Type</th>
                        <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Semester</th>
                        <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Credits</th>
                        <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                      ) : paginatedSubjects.length > 0 ? (
                        paginatedSubjects.map(sub => (
                          <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7C3AED', fontWeight: '700', fontSize: '12.5px', padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                                {sub.code}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13.5px' }}>
                                {sub.name}
                              </div>
                              {sub.short_name && (
                                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  Alias: <span style={{ fontWeight: '600' }}>{sub.short_name}</span>
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{
                                fontWeight: '700',
                                fontSize: '11.5px',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                background: sub.type === 'Lab' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                color: sub.type === 'Lab' ? '#059669' : '#2563EB',
                                display: 'inline-block'
                              }}>
                                {sub.type}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>
                              {sub.semester_name}
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{ background: 'var(--bg-main, #f1f5f9)', color: 'var(--text-primary)', fontWeight: '700', fontSize: '12.5px', padding: '3px 10px', borderRadius: '6px' }}>
                                {sub.credits} Credits
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                              <div className="action-buttons" style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(sub)}
                                  className="btn-icon"
                                  title="Edit Subject"
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                                >
                                  <i className="fa-solid fa-pen"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubject(sub.id, sub.code)}
                                  className="btn-icon text-danger"
                                  title="Delete Subject"
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'none', color: '#DC2626', cursor: 'pointer' }}
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            <i className="fa-solid fa-book-open" style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.4, display: 'block' }}></i>
                            No subjects found for this branch matching current filters.
                            <div style={{ marginTop: '12px' }}>
                              <button
                                type="button"
                                onClick={() => openAddModal(selectedProgramId)}
                                className="btn btn-primary"
                                style={{ background: '#7C3AED', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12.5px', color: '#fff', cursor: 'pointer' }}
                              >
                                <i className="fa-solid fa-plus-circle me-1"></i> Add Subject Now
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Standardized Table Pagination */}
                  <TablePagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    itemName="subjects"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================
            VIEW 2: COURSE FACULTY WORKBENCH
            ======================================================== */}
        {activeRole === 'faculty' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
              <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="fa-solid fa-book-bookmark"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Allocated Courses</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{facultySubjects.length} Subjects</div>
                  <div style={{ fontSize: '11.5px', color: '#7C3AED', fontWeight: '600' }}>Active Teaching Load</div>
                </div>
              </div>

              <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="fa-solid fa-clock"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Weekly Teaching Credits</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669' }}>
                    {facultySubjects.reduce((acc, s) => acc + (Number(s.credits) || 0), 0).toFixed(1)} Credits
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Complies with AICTE Norms</div>
                </div>
              </div>

              <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="fa-solid fa-users"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Target Cohorts</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#2563EB' }}>B.Tech CSE - Sem 4</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Sections A &amp; B (118 Students)</div>
                </div>
              </div>

              <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="fa-solid fa-award"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>OBE Course Outcomes</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#D97706' }}>91.2% Met</div>
                  <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '600'}}><i className="fa-solid fa-circle-check me-1"></i> NBA Target Exceeded</div>
                </div>
              </div>
            </div>

            {/* Faculty Filter & Search Toolbar */}
            <div
              style={{
                background: 'var(--card-bg, #fff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', flex: 1, maxWidth: '750px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 200px)' }}>
                  <i className="fa-solid fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}></i>
                  <input
                    type="text"
                    placeholder="Filter by course code, title, or alias..."
                    value={facultySearchQuery}
                    onChange={(e) => setFacultySearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '36px',
                      paddingRight: '12px',
                      height: '32px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      background: 'var(--bg-main, #ffffff)',
                      color: 'var(--text-main, #1e293b)',
                      outline: 'none'
                    }}
                  />
                </div>

                <select
                  value={facultyFilterType}
                  onChange={(e) => setFacultyFilterType(e.target.value)}
                  style={{
                    width: 'auto',
                    minWidth: '140px',
                    height: '32px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-main, #ffffff)',
                    color: 'var(--text-main, #1e293b)',
                    padding: '0 10px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Course Types</option>
                  <option value="Theory">Theory</option>
                  <option value="Lab">Lab</option>
                  <option value="Theory + Lab">Theory + Lab</option>
                </select>

                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="btn btn-outline"
                  title="Refresh Table Data"
                  style={{ height: '32px', padding: '0 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} style={{ color: '#4F46E5' }}></i>
                  <span>Refresh</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link
                  to="/unilms/org/attendance"
                  className="btn btn-outline"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '7px',
                    fontWeight: '700',
                    fontSize: '11.5px',
                    textDecoration: 'none',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-clipboard-user" style={{ color: '#059669' }}></i> Take Attendance
                </Link>
                <Link
                  to="/unilms/org/assessments"
                  className="btn btn-outline"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '7px',
                    fontWeight: '700',
                    fontSize: '11.5px',
                    textDecoration: 'none',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-file-pen" style={{ color: '#2563EB' }}></i> Enter Marks
                </Link>
                <Link
                  to="/unilms/org/obe/matrix"
                  className="btn btn-primary"
                  style={{
                    background: '#7C3AED',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    fontWeight: '700',
                    fontSize: '11.5px',
                    textDecoration: 'none',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                  }}
                >
                  <i className="fa-solid fa-award"></i> CO-PO Matrix
                </Link>
              </div>
            </div>

            <div className="table-container" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
              <table className="data-table" style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', margin: 0 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Course Code</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Subject Title &amp; Alias</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Target Cohort</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Type</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Credits</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right', color: 'var(--text-secondary, #64748b)' }}>Faculty Quick Tools</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={6} rows={facultyPagination.pageSize || 5} />
                  ) : facultyPagination.paginatedItems.length > 0 ? (
                    facultyPagination.paginatedItems.map(sub => {
                      const isLab = sub.type.toLowerCase().includes('lab');
                      return (
                        <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7C3AED', fontWeight: '700', fontSize: '13px', padding: '5px 11px', borderRadius: '6px', fontFamily: 'monospace' }}>
                              {sub.code}
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '12.5px' }}>{sub.name}</div>
                            {sub.short_name && (
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Alias: <span style={{ fontWeight: '600', color: '#4F46E5' }}>{sub.short_name}</span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>{sub.cohort_name}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{sub.enrolled_count} Enrolled Students</div>
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{
                              fontWeight: '700',
                              fontSize: '11.5px',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: isLab ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                              color: isLab ? '#059669' : '#2563EB',
                              border: isLab ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
                              display: 'inline-block'
                            }}>
                              {sub.type}
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{ background: 'var(--bg-main, #f1f5f9)', color: 'var(--text-primary)', fontWeight: '700', fontSize: '12.5px', padding: '4px 10px', borderRadius: '6px' }}>
                              {sub.credits.toFixed(1)} Credits
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <Link to="/unilms/org/attendance" className="btn btn-outline" style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10.5px', fontWeight: '600', color: '#059669', background: '#fff', border: '1px solid #d1d5db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <i className="fa-solid fa-clipboard-user"></i> Attendance
                              </Link>
                              <Link to="/unilms/org/assessments" className="btn btn-outline" style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10.5px', fontWeight: '600', color: '#2563EB', background: '#fff', border: '1px solid #d1d5db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <i className="fa-solid fa-file-pen"></i> Marks
                              </Link>
                              <Link to="/unilms/org/obe/matrix" className="btn btn-outline" style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10.5px', fontWeight: '600', color: '#0891B2', background: '#fff', border: '1px solid #d1d5db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <i className="fa-solid fa-award"></i> CO-PO
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary, #64748b)' }}>
                        No allocated subjects found matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Standardized Table Pagination */}
              <TablePagination
                currentPage={facultyPagination.currentPage}
                totalItems={facultyPagination.totalItems}
                pageSize={facultyPagination.pageSize}
                pageSizeOptions={[10, 25, 50, 100]}
                onPageChange={facultyPagination.setCurrentPage}
                onPageSizeChange={facultyPagination.setPageSize}
                itemName="allocated courses"
              />
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 3: CLASS TEACHER PROCTORING VIEW
            Matches reference screenshot with in-table loader & pagination
            ======================================================== */}
        {activeRole === 'class_teacher' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
              <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="fa-solid fa-users-line"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Class Teacher Section</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>BTECH-CSE (Sec A)</div>
                  <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '600' }}>{batchSubjectsList.length} Courses • 60 Students</div>
                </div>
              </div>

              <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="fa-solid fa-chart-pie"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Cumulative Attendance</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#7C3AED' }}>89.4% Avg</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Across All Batch Subjects</div>
                </div>
              </div>

              <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Defaulters Watchlist</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#EF4444' }}>2 Students</div>
                  <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: '600' }}>Below 75% Exam Eligibility</div>
                </div>
              </div>

              <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="fa-solid fa-envelope-open-text"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Pending Leaves &amp; OD</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#D97706' }}>2 Requests</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Awaiting Proctor Approval</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary, #1e293b)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-book-open" style={{ color: '#059669' }}></i> Section A Semester Curriculum &amp; Teaching Faculty
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="btn btn-outline"
                  title="Refresh Table Data"
                  style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} style={{ color: '#059669' }}></i>
                  <span>Refresh</span>
                </button>
                <Link
                  to="/unilms/faculty/class_teacher_monitor"
                  className="btn btn-primary"
                  style={{ background: '#059669', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', textDecoration: 'none', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="fa-solid fa-clipboard-check"></i> Open Proctor &amp; Defaulter Desk
                </Link>
              </div>
            </div>

            {/* Class Teacher Search & Filter Bar */}
            <div
              style={{
                background: 'var(--card-bg, #fff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', flex: 1, maxWidth: '750px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 200px)' }}>
                  <i className="fa-solid fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}></i>
                  <input
                    type="text"
                    placeholder="Filter by course code, title, or faculty member..."
                    value={batchSearchQuery}
                    onChange={(e) => setBatchSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '36px',
                      paddingRight: '12px',
                      height: '32px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      background: 'var(--bg-main, #ffffff)',
                      color: 'var(--text-main, #1e293b)',
                      outline: 'none'
                    }}
                  />
                </div>

                <select
                  value={batchFilterType}
                  onChange={(e) => setBatchFilterType(e.target.value)}
                  style={{
                    width: 'auto',
                    minWidth: '140px',
                    height: '32px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-main, #ffffff)',
                    color: 'var(--text-main, #1e293b)',
                    padding: '0 10px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Course Types</option>
                  <option value="Theory">Theory</option>
                  <option value="Lab">Lab</option>
                </select>
              </div>
            </div>

            {/* Batch Curriculum Data Table matching Screenshot */}
            <div className="table-container" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <table className="data-table" style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', margin: 0 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Code</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Course Title</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Assigned Faculty Member</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Type</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Credits</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right', color: 'var(--text-secondary, #64748b)' }}>Batch Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={6} rows={batchPagination.pageSize || 5} />
                  ) : batchPagination.paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary, #64748b)' }}>
                        No batch courses found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    batchPagination.paginatedItems.map(bSub => (
                      <tr key={bSub.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ background: 'rgba(5, 150, 105, 0.08)', color: '#059669', fontWeight: '700', fontSize: '13px', padding: '5px 11px', borderRadius: '6px', fontFamily: 'monospace' }}>
                            {bSub.code}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-primary, #1e293b)', fontSize: '12.5px' }}>
                          {bSub.name}
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '13.5px' }}>
                            {bSub.faculty_name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748b)' }}>{bSub.employee_code}</div>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ background: bSub.subject_type.toLowerCase() === 'lab' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(124, 58, 237, 0.1)', color: bSub.subject_type.toLowerCase() === 'lab' ? '#059669' : '#7C3AED', fontWeight: '700', fontSize: '11.5px', padding: '4px 10px', borderRadius: '12px' }}>
                            {bSub.subject_type}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-primary, #1e293b)' }}>
                          {bSub.credits} cr
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: '700', fontSize: '12px', padding: '4px 10px', borderRadius: '12px' }}>
                            {bSub.attendance_avg} Batch Att.
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Standardized Table Pagination */}
              <TablePagination
                currentPage={batchPagination.currentPage}
                totalItems={batchPagination.totalItems}
                pageSize={batchPagination.pageSize}
                pageSizeOptions={[10, 25, 50, 100]}
                onPageChange={batchPagination.setCurrentPage}
                onPageSizeChange={batchPagination.setPageSize}
                itemName="batch courses"
              />
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 4: HOD DESK
            ======================================================== */}
        {activeRole === 'hod' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
              <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="fa-solid fa-network-wired"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Department Faculty</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {hodSubjectsList.filter((s) => s.status === 'Allocated').length} Allocated / {hodSubjectsList.length} Courses
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '600' }}>
                    {hodSubjectsList.length > 0 ? Math.round((hodSubjectsList.filter((s) => s.status === 'Allocated').length / hodSubjectsList.length) * 100) : 100}% Workload Allocated
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="fa-solid fa-award"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>NBA Tier-1 Attainment</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#D97706' }}>94.2% Overall</div>
                  <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '600' }}><i className="fa-solid fa-check-double me-1"></i> Target Exceeded</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary, #1e293b)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-network-wired" style={{ color: '#7C3AED' }}></i> Department Courses &amp; Faculty Workload Matrix
              </h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="btn btn-outline"
                  title="Refresh Table Data"
                  style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} style={{ color: '#7C3AED' }}></i>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* HOD Search & Filter Bar */}
            <div
              style={{
                background: 'var(--card-bg, #fff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', flex: 1, maxWidth: '750px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 200px)' }}>
                  <i className="fa-solid fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}></i>
                  <input
                    type="text"
                    placeholder="Filter by course code, title, or allocated faculty..."
                    value={hodSearchQuery}
                    onChange={(e) => setHodSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '36px',
                      paddingRight: '12px',
                      height: '32px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      background: 'var(--bg-main, #ffffff)',
                      color: 'var(--text-main, #1e293b)',
                      outline: 'none'
                    }}
                  />
                </div>

                <select
                  value={hodFilterSemester}
                  onChange={(e) => setHodFilterSemester(e.target.value)}
                  style={{
                    width: 'auto',
                    minWidth: '150px',
                    height: '32px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-main, #ffffff)',
                    color: 'var(--text-main, #1e293b)',
                    padding: '0 10px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Semesters</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </div>
            </div>

            <div className="table-container" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
              <table className="data-table" style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', margin: 0 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Code</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Course Title</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Allocated Faculty</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Semester / Batch</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Credits</th>
                    <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right', color: 'var(--text-secondary, #64748b)' }}>Syllabus Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={6} rows={hodPagination.pageSize || 5} />
                  ) : hodPagination.paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary, #64748b)' }}>
                        No department courses found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    hodPagination.paginatedItems.map(hSub => (
                      <tr key={hSub.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7C3AED', fontWeight: '700', fontSize: '13px', padding: '5px 11px', borderRadius: '6px', fontFamily: 'monospace' }}>
                            {hSub.code}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-primary, #1e293b)', fontSize: '12.5px' }}>
                          {hSub.name}
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '13.5px' }}>
                            {hSub.faculty_name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748b)' }}>{hSub.employee_code}</div>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-primary, #1e293b)', fontWeight: '600' }}>
                          {hSub.semester_name}
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-primary, #1e293b)' }}>
                          {hSub.credits} cr
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${hSub.syllabus_progress}%`, height: '100%', background: '#10b981' }}></div>
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '12px', color: '#059669' }}>{hSub.syllabus_progress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Standardized Table Pagination */}
              <TablePagination
                currentPage={hodPagination.currentPage}
                totalItems={hodPagination.totalItems}
                pageSize={hodPagination.pageSize}
                pageSizeOptions={[10, 25, 50, 100]}
                onPageChange={hodPagination.setCurrentPage}
                onPageSizeChange={hodPagination.setPageSize}
                itemName="department courses"
              />
            </div>
          </div>
        )}
      </section>

      {/* ========================================================
          ADD / EDIT SUBJECT DRAWER MODAL
          Configured with full visibility, slide-in animation & backdrop
          ======================================================== */}
      <div
        className={`drawer-overlay ${isAddModalOpen ? 'active' : ''}`}
        id="addModal"
        style={{
          display: isAddModalOpen ? 'flex' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          justifyContent: 'flex-end',
          alignItems: 'stretch',
          zIndex: 99999,
          opacity: isAddModalOpen ? 1 : 0,
          pointerEvents: isAddModalOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
        onClick={(e) => {
          if (e.target.id === 'addModal') setIsAddModalOpen(false);
        }}
      >
        <div
          className="drawer-content"
          style={{
            maxWidth: '600px',
            width: '100%',
            height: '100vh',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-15px 0 40px rgba(0,0,0,0.2)',
            transform: isAddModalOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="drawer-header" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                  <i className="fa-solid fa-book-bookmark me-2"></i>
                  {editingSubjectId ? 'Edit Subject Details' : 'Add New Subject'}
                </h3>
                <div style={{ fontSize: '12px', color: '#e9d5ff', marginTop: '2px' }}>
                  Configure course code, credits, semester, and examination syllabus
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="drawer-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Program & Semester */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                    Program <span className="text-danger" style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    required
                    value={formProgramId}
                    onChange={(e) => setFormProgramId(e.target.value)}
                    disabled={selectedProgramId !== null}
                    style={{
                      fontSize: '13.5px',
                      fontWeight: '600',
                      background: selectedProgramId !== null ? '#f8fafc' : '#fff',
                      cursor: selectedProgramId !== null ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                  {selectedProgramId !== null && (
                    <small style={{ color: '#64748b', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fa-solid fa-lock" style={{ color: '#0284C7' }}></i>
                      <span>Fixed to branch: <strong>{currentProgram?.code}</strong></span>
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                    Semester <span className="text-danger" style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    required
                    value={formSemesterId}
                    onChange={(e) => setFormSemesterId(e.target.value)}
                    style={{ fontSize: '13.5px', fontWeight: '600' }}
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>
              </div>

              {/* Subject Code & Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                    Subject Code <span className="text-danger" style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS204"
                    className="form-control"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    style={{ fontWeight: '700', fontSize: '13.5px' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                    Subject Name <span className="text-danger" style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems & Linux Kernel"
                    className="form-control"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ fontSize: '13.5px' }}
                  />
                </div>
              </div>

              {/* Short Name, Credits & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Short Name</label>
                  <input
                    type="text"
                    placeholder="e.g. OS"
                    className="form-control"
                    value={formShortName}
                    onChange={(e) => setFormShortName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                    Credits <span className="text-danger" style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    required
                    className="form-control"
                    value={formCredits}
                    onChange={(e) => setFormCredits(e.target.value)}
                    style={{ fontWeight: '700' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Subject Type</label>
                  <select
                    className="form-control"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                  >
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                    <option value="Specialization">Specialization</option>
                    <option value="Mini-Project">Mini-Project</option>
                    <option value="Project">Project</option>
                  </select>
                </div>
              </div>

              {/* Advanced Settings Accordion */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-main, #f8fafc)' }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-sliders" style={{ color: '#7C3AED' }}></i> Advanced Syllabus & Marks Settings
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.06)', padding: '2px 8px', borderRadius: '12px' }}>Optional</span>
                  </span>
                  <i className={`fa-solid ${showAdvanced ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}></i>
                </button>

                <div style={{ display: showAdvanced ? 'block' : 'none', padding: '18px', borderTop: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Sessions</label>
                      <input type="number" min="0" className="form-control" value={formSessions} onChange={(e) => setFormSessions(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Units</label>
                      <input type="number" min="0" className="form-control" value={formUnits} onChange={(e) => setFormUnits(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Outcomes (COs)</label>
                      <input type="number" min="0" className="form-control" value={formOutcomes} onChange={(e) => setFormOutcomes(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Internal Max / Pass</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" min="0" className="form-control" placeholder="Max" value={formInternalMax} onChange={(e) => setFormInternalMax(e.target.value)} />
                        <input type="number" min="0" className="form-control" placeholder="Pass" value={formInternalPass} onChange={(e) => setFormInternalPass(e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>External Max / Pass</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" min="0" className="form-control" placeholder="Max" value={formExternalMax} onChange={(e) => setFormExternalMax(e.target.value)} />
                        <input type="number" min="0" className="form-control" placeholder="Pass" value={formExternalPass} onChange={(e) => setFormExternalPass(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="drawer-footer" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main, #f8fafc)' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsAddModalOpen(false)}
                style={{ borderRadius: '8px', fontWeight: '600', padding: '10px 20px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  background: '#7C3AED',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                }}
              >
                {editingSubjectId ? 'Update Subject' : 'Save Subject'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default OrgAcademicsSubjects;