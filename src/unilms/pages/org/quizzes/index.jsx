import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import academicsService from '../../../services/academics.service';
import apiClient from '../../../services/api';

const initialQuizzesFallback = [];

const OrgQuizzesIndex = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Master Data
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // 4-Tier Cascading Filter Bar State
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState('ALL');
  const [selectedCohortId, setSelectedCohortId] = useState('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Quiz Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDeptId, setModalDeptId] = useState('');
  const [modalProgramId, setModalProgramId] = useState('');
  const [modalCohortId, setModalCohortId] = useState('');
  const [modalSubjectId, setModalSubjectId] = useState('');
  const [modalDuration, setModalDuration] = useState(30);

  const persistQuizzes = (updated) => {
    setQuizzes(updated);
    apiClient.post('/tenants/settings/unilms_quizzes_registry', { value: updated }).catch((err) => {
      console.error('Failed to sync quizzes to PostgreSQL', err);
    });
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, cohortRes, subRes, remoteQuizzes] = await Promise.allSettled([
        academicsService.getDepartments(),
        academicsService.getPrograms(),
        academicsService.getCohorts(),
        academicsService.getSubjects(),
        apiClient.get('/tenants/settings/unilms_quizzes_registry')
      ]);

      const dList = deptRes.status === 'fulfilled' && Array.isArray(deptRes.value) ? deptRes.value : [];
      const pList = progRes.status === 'fulfilled' && Array.isArray(progRes.value) ? progRes.value : [];
      const cList = cohortRes.status === 'fulfilled' && Array.isArray(cohortRes.value) ? cohortRes.value : [];
      const sList = subRes.status === 'fulfilled' && Array.isArray(subRes.value) ? subRes.value : [];

      setDepartments(dList);
      setPrograms(pList);
      setCohorts(cList);
      setSubjects(sList);

      if (remoteQuizzes.status === 'fulfilled' && remoteQuizzes.value?.data?.value && Array.isArray(remoteQuizzes.value.data.value)) {
        setQuizzes(remoteQuizzes.value.data.value);
      } else {
        setQuizzes(initialQuizzesFallback);
        apiClient.post('/tenants/settings/unilms_quizzes_registry', { value: initialQuizzesFallback }).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to load master data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Cascading Filter Logic
  const filteredPrograms = programs.filter(p => {
    if (selectedDeptId === 'ALL') return true;
    return p.departmentId === selectedDeptId || p.department?.id === selectedDeptId;
  });

  const filteredCohorts = cohorts.filter(c => {
    if (selectedProgramId === 'ALL') return true;
    return c.programId === selectedProgramId;
  });

  const filteredSubjects = subjects.filter(s => {
    if (selectedDeptId !== 'ALL' && s.departmentId && s.departmentId !== selectedDeptId) return false;
    return true;
  });

  const handleDeptFilterChange = (deptId) => {
    setSelectedDeptId(deptId);
    setSelectedProgramId('ALL');
    setSelectedCohortId('ALL');
    setSelectedSubjectId('ALL');
  };

  const handleProgramFilterChange = (progId) => {
    setSelectedProgramId(progId);
    setSelectedCohortId('ALL');
    setSelectedSubjectId('ALL');
  };

  // Final Filtered List
  const filteredQuizzes = quizzes.filter(q => {
    if (selectedDeptId !== 'ALL' && q.department_id && q.department_id !== selectedDeptId) return false;
    if (selectedProgramId !== 'ALL' && q.program_id && q.program_id !== selectedProgramId) return false;
    if (selectedCohortId !== 'ALL' && q.cohort_id && q.cohort_id !== selectedCohortId) return false;
    if (selectedSubjectId !== 'ALL' && q.subject_id !== selectedSubjectId && q.subject_code !== selectedSubjectId) return false;
    if (selectedStatus !== 'ALL' && q.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      const matchTitle = q.title?.toLowerCase().includes(s);
      const matchSub = q.subject_name?.toLowerCase().includes(s) || q.subject_code?.toLowerCase().includes(s);
      const matchFac = q.faculty_name?.toLowerCase().includes(s);
      if (!matchTitle && !matchSub && !matchFac) return false;
    }
    return true;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedQuizzes,
    totalItems
  } = useTablePagination(filteredQuizzes, 10);

  const handleDelete = async (id) => {
    const quiz = quizzes.find(q => q.id === id);
    const confirmed = await confirm({
      title: 'Confirm Delete Quiz',
      message: `Are you sure you want to delete "${quiz?.title || 'this quiz'}"?`,
      details: 'This will erase the question pool, attempts, and grade records for this assessment.',
      confirmText: 'Yes, Delete Quiz',
      cancelText: 'Keep Quiz',
      variant: 'danger',
      icon: 'fa-solid fa-trash-can'
    });
    if (!confirmed) return;

    const updated = quizzes.filter(q => q.id !== id);
    persistQuizzes(updated);
    showToast('Quiz deleted.');
  };

  const toggleStatus = async (id) => {
    const quiz = quizzes.find(q => q.id === id);
    const nextStatus = quiz?.status === 'Published' ? 'Draft' : 'Published';

    const confirmed = await confirm({
      title: `Confirm Status: ${nextStatus}`,
      message: `Set "${quiz?.title}" status to ${nextStatus}?`,
      details: nextStatus === 'Published'
        ? 'Students enrolled in this cohort will immediately be permitted to launch CBT sessions.'
        : 'The test will be hidden from students while under editing / review.',
      confirmText: `Yes, Set to ${nextStatus}`,
      variant: nextStatus === 'Published' ? 'success' : 'warning',
      icon: nextStatus === 'Published' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-pause'
    });
    if (!confirmed) return;

    const updated = quizzes.map(q => q.id === id ? { ...q, status: nextStatus } : q);
    persistQuizzes(updated);
    showToast(`Quiz status changed to ${nextStatus}.`);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      alert('Please enter a quiz title.');
      return;
    }

    const sub = subjects.find(s => s.id === modalSubjectId) || subjects[0] || { id: 's-os', code: 'CS101', name: 'Operating Systems' };
    const coh = cohorts.find(c => c.id === modalCohortId) || cohorts[0] || { id: 'c-2026', name: 'Batch 2026' };
    const dept = departments.find(d => d.id === modalDeptId) || departments[0] || { id: 'd-cse', name: 'Computer Science' };
    const prog = programs.find(p => p.id === modalProgramId) || programs[0] || { id: 'p-cse', name: 'B.Tech CSE' };

    const confirmed = await confirm({
      title: 'Confirm Create Quiz',
      message: `Create new CBT Quiz "${modalTitle.trim()}"?`,
      details: [
        `Course Subject: ${sub.code} - ${sub.name}`,
        `Target Cohort: ${coh.name}`,
        `Time Limit: ${modalDuration} Minutes`
      ],
      confirmText: 'Yes, Create Quiz',
      variant: 'primary'
    });
    if (!confirmed) return;

    const newQuiz = {
      id: `quiz-${Date.now()}`,
      title: modalTitle.trim(),
      subject_code: sub.code,
      subject_name: sub.name,
      subject_id: sub.id,
      department_id: dept.id,
      department_name: dept.name,
      program_id: prog.id,
      program_name: prog.name,
      cohort_id: coh.id,
      cohort_name: coh.name,
      faculty_name: 'Academic Faculty User',
      duration: Number(modalDuration) || 30,
      total_questions: 10,
      status: 'Published'
    };

    persistQuizzes([newQuiz, ...quizzes]);
    setIsModalOpen(false);
    setModalTitle('');
    showToast(`Quiz "${newQuiz.title}" created! Ready for question building.`);
  };

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)', animation: 'fadeIn 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
            <i className="fa-solid fa-circle-check"></i>
            {toastMsg}
          </div>
          <button onClick={() => setToastMsg(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
        </div>
      )}

      {/* Top Header Card */}
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
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
            }}
          >
            <i className="fa-solid fa-clipboard-question"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Online CBT Quizzes &amp; Question Banks
              </h2>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                CBT ENGINE
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Configure timed online assessments, manage objective question pools, and deploy student CBT sessions.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link
            to="/unilms/lms/quizzes/exam"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', color: '#2563EB', borderColor: '#BFDBFE', textDecoration: 'none' }}
          >
            <i className="fa-solid fa-play"></i> Test Student CBT Player
          </Link>
          <button
            type="button"
            onClick={() => {
              setModalDeptId(departments[0]?.id || '');
              setModalProgramId(programs[0]?.id || '');
              setModalCohortId(cohorts[0]?.id || '');
              setModalSubjectId(subjects[0]?.id || '');
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
            style={{
              background: '#4F46E5',
              borderColor: '#4F46E5',
              color: '#fff',
              padding: '9px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)'
            }}
          >
            <i className="fa-solid fa-plus"></i> Create Quiz
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Quizzes</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{quizzes.length}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-list-check"></i>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Live Published</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
              {quizzes.filter(q => q.status === 'Published').length}
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Draft Stage</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#F59E0B', marginTop: '4px' }}>
              {quizzes.filter(q => q.status === 'Draft').length}
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-pen-ruler"></i>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>CBT Proctoring</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#7C3AED', marginTop: '4px' }}>Active Sync</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-shield-halved"></i>
          </div>
        </div>
      </div>

      {/* 🌟 4-TIER CASCADING ACADEMIC FILTER BAR 🌟 */}
      <div
        style={{
          background: 'var(--card-bg, #fff)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-filter" style={{ color: '#4F46E5' }}></i>
          <span>4-Tier Cascading Filter Bar</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {/* Tier 1: Department */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
              1. DEPARTMENT
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => handleDeptFilterChange(e.target.value)}
              className="form-control"
              style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* Tier 2: Degree Program */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
              2. DEGREE PROGRAM
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => handleProgramFilterChange(e.target.value)}
              className="form-control"
              style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="ALL">All Programs</option>
              {filteredPrograms.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          {/* Tier 3: Cohort / Batch */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
              3. ADMITTED BATCH / COHORT
            </label>
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="form-control"
              style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="ALL">All Cohorts / Batches</option>
              {filteredCohorts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tier 4: Course Subject */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
              4. COURSE SUBJECT
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="form-control"
              style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="ALL">All Subjects</option>
              {filteredSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
              QUIZ STATUS
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-control"
              style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Published">Published &amp; Live</option>
              <option value="Draft">Draft Stage</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
              SEARCH TITLE / FACULTY
            </label>
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8', fontSize: '13px' }}></i>
              <input
                type="text"
                placeholder="Search quiz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ width: '100%', height: '38px', borderRadius: '8px', paddingLeft: '34px', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {(selectedDeptId !== 'ALL' || selectedProgramId !== 'ALL' || selectedCohortId !== 'ALL' || selectedSubjectId !== 'ALL' || selectedStatus !== 'ALL' || searchQuery.trim()) && (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Active Filters:</span>
              {selectedDeptId !== 'ALL' && (
                <span className="badge" style={{ background: '#EDE9FE', color: '#6D28D9', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' }}>
                  Dept: {departments.find(d => d.id === selectedDeptId)?.name}
                </span>
              )}
              {selectedProgramId !== 'ALL' && (
                <span className="badge" style={{ background: '#DBEAFE', color: '#1D4ED8', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' }}>
                  Program: {programs.find(p => p.id === selectedProgramId)?.name}
                </span>
              )}
              {selectedCohortId !== 'ALL' && (
                <span className="badge" style={{ background: '#DCFCE7', color: '#15803D', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' }}>
                  Cohort: {cohorts.find(c => c.id === selectedCohortId)?.name}
                </span>
              )}
              {selectedSubjectId !== 'ALL' && (
                <span className="badge" style={{ background: '#FEF3C7', color: '#B45309', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' }}>
                  Subject: {subjects.find(s => s.id === selectedSubjectId || s.code === selectedSubjectId)?.name}
                </span>
              )}
              {selectedStatus !== 'ALL' && (
                <span className="badge" style={{ background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' }}>
                  Status: {selectedStatus}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedDeptId('ALL');
                setSelectedProgramId('ALL');
                setSelectedCohortId('ALL');
                setSelectedSubjectId('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              style={{ background: 'transparent', border: 'none', color: '#DC2626', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <i className="fa-solid fa-rotate-left"></i> Reset All
            </button>
          </div>
        )}
      </div>

      {/* Quizzes Table */}
      <div className="table-responsive" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
        <table className="data-table" style={{ width: '100%', minWidth: '820px', margin: 0 }}>
          <thead>
            <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>QUIZ TITLE</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>COURSE &amp; COHORT</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>DURATION</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>FACULTY</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>STATUS</th>
              <th style={{ textAlign: 'right', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader columns={6} rows={pageSize || 5} />
            ) : paginatedQuizzes.length > 0 ? (
              paginatedQuizzes.map((q) => (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 20px', maxWidth: '300px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>
                      {q.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Pool: <strong>{q.total_questions || 15} Questions</strong>
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '700', color: '#4F46E5', fontSize: '13px' }}>
                      {q.subject_code} - {q.subject_name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <i className="fa-solid fa-users" style={{ marginRight: '4px', opacity: 0.6 }}></i>
                      {q.cohort_name}
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600' }}>
                    <i className="fa-solid fa-clock" style={{ color: '#6366F1', marginRight: '6px' }}></i>
                    {q.duration} Mins
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <i className="fa-solid fa-user-tie" style={{ color: '#94a3b8', marginRight: '6px' }}></i>
                    {q.faculty_name}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <button
                      type="button"
                      onClick={() => toggleStatus(q.id)}
                      style={{
                        background: q.status === 'Published' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        color: q.status === 'Published' ? '#059669' : '#64748b',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Click to toggle status"
                    >
                      <i className={`fa-solid ${q.status === 'Published' ? 'fa-circle-check' : 'fa-circle-pause'}`}></i>
                      {q.status}
                    </button>
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Link
                        to={`/unilms/org/quizzes/builder?title=${encodeURIComponent(q.title)}&subject=${encodeURIComponent(q.subject_code + ' - ' + q.subject_name)}`}
                        className="btn btn-outline"
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', color: '#4F46E5', borderColor: '#C7D2FE', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '700' }}
                        title="Open Question Builder"
                      >
                        <i className="fa-solid fa-pen-ruler"></i> Builder
                      </Link>
                      <Link
                        to="/unilms/lms/quizzes/exam"
                        className="btn btn-outline"
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', color: '#2563EB', borderColor: '#BFDBFE', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Test CBT Exam Player"
                      >
                        <i className="fa-solid fa-play"></i> Player
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        className="btn btn-outline"
                        style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: '#DC2626', borderColor: '#FECACA' }}
                        title="Delete Quiz"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-circle-question" style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.5, display: 'block' }}></i>
                  No quizzes found matching the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '16px' }}>
        <TablePagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          totalItems={totalItems}
        />
      </div>

      {/* Create Quiz Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '640px', background: 'var(--card-bg, #fff)', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                <i className="fa-solid fa-clipboard-question me-2" style={{ color: '#4F46E5' }}></i> Create New CBT Quiz
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateQuiz}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Quiz Title</label>
                <input
                  type="text"
                  placeholder="e.g. Unit 2: OS Virtual Memory & Paging MCQ Test"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', height: '40px', borderRadius: '8px', fontSize: '13.5px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>1. Department</label>
                  <select
                    value={modalDeptId}
                    onChange={(e) => setModalDeptId(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', height: '40px', borderRadius: '8px', fontSize: '13px' }}
                  >
                    <option value="">-- Select Dept --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>2. Degree Program</label>
                  <select
                    value={modalProgramId}
                    onChange={(e) => setModalProgramId(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', height: '40px', borderRadius: '8px', fontSize: '13px' }}
                  >
                    <option value="">-- Select Program --</option>
                    {programs
                      .filter(p => !modalDeptId || p.departmentId === modalDeptId || p.department?.id === modalDeptId)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>3. Target Cohort</label>
                  <select
                    value={modalCohortId}
                    onChange={(e) => setModalCohortId(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', height: '40px', borderRadius: '8px', fontSize: '13px' }}
                    required
                  >
                    <option value="">-- Select Cohort --</option>
                    {cohorts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>4. Subject</label>
                  <select
                    value={modalSubjectId}
                    onChange={(e) => setModalSubjectId(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', height: '40px', borderRadius: '8px', fontSize: '13px' }}
                    required
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Test Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={modalDuration}
                  onChange={(e) => setModalDuration(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', height: '40px', borderRadius: '8px', fontSize: '13.5px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '8px 20px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#4F46E5', borderColor: '#4F46E5', color: '#fff', padding: '8px 22px', borderRadius: '8px', fontWeight: '700' }}
                >
                  <i className="fa-solid fa-plus me-1"></i> Create &amp; Add Questions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgQuizzesIndex;
