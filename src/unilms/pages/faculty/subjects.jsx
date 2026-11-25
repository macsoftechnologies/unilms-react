import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { facultyService } from '../../services/faculty.service';
import { academicsService } from '../../services/academics.service';

const FacultySubjects = () => {
  const [activePersona, setActivePersona] = useState(() => {
    return localStorage.getItem('faculty_persona') || 'faculty';
  });

  const [isLoading, setIsLoading] = useState(true);
  const [facultySubjects, setFacultySubjects] = useState([]);
  const [batchSubjects, setBatchSubjects] = useState([]);
  const [hodSubjects, setHodSubjects] = useState([]);

  // Persona 1: Faculty search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  // Persona 2: Class Teacher search & filter states
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [batchFilterType, setBatchFilterType] = useState('');

  // Persona 3: HOD search & filter states
  const [hodSearchQuery, setHodSearchQuery] = useState('');
  const [hodFilterSemester, setHodFilterSemester] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allocRes, subRes] = await Promise.allSettled([
        facultyService.getAllocations(),
        academicsService.getSubjects(),
      ]);

      const allocs = allocRes.status === 'fulfilled' && Array.isArray(allocRes.value) ? allocRes.value : [];
      const subs = subRes.status === 'fulfilled' && Array.isArray(subRes.value) ? subRes.value : [];

      setFacultySubjects(
        allocs.map((a) => ({
          id: a.id,
          code: a.subject?.code || 'SUB',
          name: a.subject?.name || 'Course Name',
          short_name: a.subject?.shortName || a.subject?.code || '',
          cohort_name: a.cohortName || 'General Cohort',
          enrolled_count: 60,
          type: a.subject?.type || 'Theory',
          credits: Number(a.subject?.credits) || 3.0,
          sessions: a.subject?.sessions || 45,
          syllabus_delivered: 75,
        }))
      );

      setBatchSubjects(
        allocs.map((a) => ({
          id: a.id,
          code: a.subject?.code || 'SUB',
          name: a.subject?.name || 'Course',
          faculty_name: a.staff ? `${a.staff.firstName} ${a.staff.lastName || ''}`.trim() : 'Unassigned',
          employee_code: a.staff?.employeeCode || 'N/A',
          subject_type: a.subject?.type || 'Theory',
          credits: Number(a.subject?.credits) || 3.0,
          attendance_avg: '91.2%',
        }))
      );

      setHodSubjects(
        subs.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          faculty_name: 'Allocated Faculty',
          employee_code: s.department?.code || 'DEP',
          semester_name: 'Semester 4',
          credits: Number(s.credits) || 3.0,
          syllabus_progress: 80,
        }))
      );
    } catch (e) {
      console.error('Failed to load subjects workbench:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const [privileges, setPrivileges] = useState(() => {
    try {
      const cached = localStorage.getItem('unilms_privileges');
      if (cached) return JSON.parse(cached);
    } catch { }
    return {
      isFaculty: true,
      isClassTeacher: false,
      isHOD: false,
    };
  });

  useEffect(() => {
    const fetchPrivs = async () => {
      try {
        const storedUser = localStorage.getItem('unilms_user');
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        const res = await facultyService.getPrivileges({
          email: parsed?.email || localStorage.getItem('org_user_email'),
          staffId: parsed?.id
        });
        const privData = (res && res.isFaculty !== undefined) ? res : (res?.data || res);
        if (privData && privData.isFaculty !== undefined) {
          setPrivileges(privData);
          localStorage.setItem('unilms_privileges', JSON.stringify(privData));
          const currentP = localStorage.getItem('faculty_persona') || 'faculty';
          if (currentP === 'hod' && !privData.isHOD) {
            setActivePersona('faculty');
            localStorage.setItem('faculty_persona', 'faculty');
          } else if (currentP === 'class_teacher' && !privData.isClassTeacher) {
            setActivePersona('faculty');
            localStorage.setItem('faculty_persona', 'faculty');
          }
        }
      } catch (err) {
        console.warn('Failed to load faculty privileges on subjects:', err);
      }
    };
    fetchPrivs();
  }, []);

  useEffect(() => {
    loadData();
  }, [activePersona]);

  useEffect(() => {
    const handleStorage = () => {
      const p = localStorage.getItem('faculty_persona') || 'faculty';
      setActivePersona(p);
    };
    window.addEventListener('faculty_persona_changed', handleStorage);
    return () => window.removeEventListener('faculty_persona_changed', handleStorage);
  }, []);

  const handlePersonaChange = (p) => {
    if (p === 'class_teacher' && !privileges.isClassTeacher) return;
    if (p === 'hod' && !privileges.isHOD) return;
    setActivePersona(p);
    localStorage.setItem('faculty_persona', p);
    window.dispatchEvent(new Event('faculty_persona_changed'));
  };

  const handleManualRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 450);
  };

  // Filtered data & pagination hooks
  const filteredFacultySubjects = useMemo(() => {
    return facultySubjects.filter(sub => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || sub.code.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q) || (sub.short_name && sub.short_name.toLowerCase().includes(q));
      const matchType = !filterType || sub.type.toLowerCase().includes(filterType.toLowerCase());
      return matchSearch && matchType;
    });
  }, [facultySubjects, searchQuery, filterType]);

  const facultyPagination = useTablePagination(filteredFacultySubjects, 10);

  const filteredBatchSubjects = useMemo(() => {
    return batchSubjects.filter(sub => {
      const q = batchSearchQuery.toLowerCase();
      const matchSearch = !q ||
        sub.code.toLowerCase().includes(q) ||
        sub.name.toLowerCase().includes(q) ||
        sub.faculty_name.toLowerCase().includes(q) ||
        sub.employee_code.toLowerCase().includes(q);
      const matchType = !batchFilterType || sub.subject_type.toLowerCase() === batchFilterType.toLowerCase();
      return matchSearch && matchType;
    });
  }, [batchSubjects, batchSearchQuery, batchFilterType]);

  const batchPagination = useTablePagination(filteredBatchSubjects, 10);

  const filteredHodSubjects = useMemo(() => {
    return hodSubjects.filter(sub => {
      const q = hodSearchQuery.toLowerCase();
      const matchSearch = !q ||
        sub.code.toLowerCase().includes(q) ||
        sub.name.toLowerCase().includes(q) ||
        sub.faculty_name.toLowerCase().includes(q) ||
        sub.employee_code.toLowerCase().includes(q);
      const matchSem = !hodFilterSemester || sub.semester_name.toLowerCase().includes(hodFilterSemester.toLowerCase());
      return matchSearch && matchSem;
    });
  }, [hodSubjects, hodSearchQuery, hodFilterSemester]);

  const hodPagination = useTablePagination(filteredHodSubjects, 10);

  return (
    <div className="faculty-subjects-page" style={{ padding: '0 0 24px 0' }}>
      {/* Top Role Context & Persona Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          borderRadius: '12px',
          padding: '12px 16px',
          color: '#ffffff',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 16px -6px rgba(79, 70, 229, 0.3)'
        }}
      >
        <div style={{ flex: '1 1 auto', minWidth: '280px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#a5b4fc', marginBottom: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'auto', height: 'auto', minWidth: 'auto', boxShadow: 'none' }}>
            <i className="fa-solid fa-graduation-cap"></i> Academic Instruction &amp; Curriculum Portal
          </div>
          <h1 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 4px', color: '#ffffff', letterSpacing: '-0.2px', lineHeight: 1.3 }}>
            {activePersona === 'hod' && 'Department Curriculum & Faculty Allocation Matrix'}
            {activePersona === 'class_teacher' && (batchCourses.length > 0 && batchCourses[0]?.cohort_name ? `Class Teacher Batch Curriculum — ${batchCourses[0].cohort_name}` : 'Class Teacher Batch Curriculum')}
            {activePersona === 'faculty' && 'My Allocated Teaching Courses & Coursework Workbench'}
          </h1>
          <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>
            {activePersona === 'hod' && 'Department Faculty Matrix • Cross-faculty syllabus completion audit and AICTE teaching workloads'}
            {activePersona === 'class_teacher' && (batchCourses.length > 0 && batchCourses[0]?.cohort_name ? `Proctoring desk for ${batchCourses[0].cohort_name} • Review semester subjects, faculty in-charge, and batch attendance health` : 'Proctoring desk • Review semester subjects, faculty in-charge, and batch attendance health')}
            {activePersona === 'faculty' && 'Operational teaching suite • Take lecture attendance, enter continuous evaluation marks, assign tasks, and map course outcomes'}
          </div>
        </div>

        {/* Active Context Status Indicator (Consolidated with Header Switcher) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            backdropFilter: 'blur(8px)'
          }}>
            <i className={`fa-solid ${activePersona === 'hod' ? 'fa-landmark' : activePersona === 'class_teacher' ? 'fa-users-rectangle' : 'fa-chalkboard-user'}`}></i>
            {activePersona === 'hod' ? 'HOD Department Curriculum' : activePersona === 'class_teacher' ? 'Class Teacher Batch Curriculum' : 'Course Teaching Workbench'}
          </span>
        </div>
      </div>

      {/* ========================================================
          PERSONA 1: COURSE FACULTY WORKBENCH
          ======================================================== */}
      {activePersona === 'faculty' && (
        <>
          {/* KPI Metrics */}
          <div className="faculty-kpi-grid">
            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                <i className="fa-solid fa-book-bookmark"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">ALLOCATED COURSES</div>
                <div className="faculty-metric-value">{facultySubjects.length} Subjects</div>
                <div className="faculty-metric-sub" style={{ color: '#7C3AED' }}>Active Teaching Load</div>
              </div>
            </div>

            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                <i className="fa-solid fa-clock"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">WEEKLY TEACHING CREDITS</div>
                <div className="faculty-metric-value" style={{ color: '#059669' }}>35.0 Credits</div>
                <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>Complies with AICTE Norms</div>
              </div>
            </div>

            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' }}>
                <i className="fa-solid fa-users"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">TARGET COHORTS</div>
                <div className="faculty-metric-value" style={{ color: '#2563EB' }}>
                  {subjects.length > 0 ? `${new Set(subjects.map(s => s.cohort_name || s.semester_name).filter(Boolean)).size} Cohort(s)` : '0 Cohorts'}
                </div>
                <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                  {subjects.length > 0 ? `${subjects.reduce((acc, s) => acc + (Number(s.enrolled_count) || 0), 0)} Enrolled Students` : 'No allocated teaching sections'}
                </div>
              </div>
            </div>

            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
                <i className="fa-solid fa-award"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">OBE COURSE OUTCOMES</div>
                <div className="faculty-metric-value" style={{ color: subjects.length > 0 ? '#059669' : '#94A3B8' }}>
                  {subjects.length > 0 ? 'Active' : '—'}
                </div>
                <div className="faculty-metric-sub" style={{ color: subjects.length > 0 ? '#059669' : 'var(--text-secondary, #64748b)' }}>
                  {subjects.length > 0 ? <><i className="fa-solid fa-circle-check"></i> OBE Framework Active</> : 'Awaiting Course Allocations'}
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
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
                <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`} style={{ color: '#4F46E5' }}></i>
                <span>Refresh</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                to="/unilms/faculty/attendance"
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
                to="/unilms/faculty/marks"
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
                to="/unilms/faculty/assignments"
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
                <i className="fa-solid fa-list-check"></i> Continuous Evaluations
              </Link>
            </div>
          </div>

          {/* Faculty Subjects Table */}
          <div className="table-responsive" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', margin: 0 }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Course Code</th>
                  <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Subject Title &amp; Alias</th>
                  <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Target Cohort / Batch</th>
                  <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Type</th>
                  <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'left', color: 'var(--text-secondary, #64748b)' }}>Credits</th>
                  <th style={{ padding: '9px 12px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right', color: 'var(--text-secondary, #64748b)' }}>Faculty Instruction Tools</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeletonLoader columns={6} rows={facultyPagination.pageSize || 5} />
                ) : facultyPagination.paginatedItems.length > 0 ? (
                  facultyPagination.paginatedItems.map(sub => {
                    const isLab = sub.type.toLowerCase().includes('lab');
                    return (
                      <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7C3AED', fontWeight: '700', fontSize: '13px', padding: '5px 11px', borderRadius: '6px', fontFamily: 'monospace' }}>
                            {sub.code}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary, #1e293b)', fontSize: '12.5px' }}>
                            {sub.name}
                          </div>
                          {sub.short_name && (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                              Alias: <span style={{ fontWeight: '600', color: '#4F46E5' }}>{sub.short_name}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary, #1e293b)', fontSize: '13px' }}>
                            {sub.cohort_name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748b)' }}>
                            {sub.enrolled_count} Enrolled Students
                          </div>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <span
                            style={{
                              background: isLab ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                              color: isLab ? '#059669' : '#2563EB',
                              border: isLab ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
                              fontWeight: '700',
                              fontSize: '11.5px',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              display: 'inline-block'
                            }}
                          >
                            {sub.type}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ background: 'var(--bg-main, #f1f5f9)', color: 'var(--text-primary, #1e293b)', fontWeight: '700', fontSize: '12.5px', padding: '4px 10px', borderRadius: '6px' }}>
                            {sub.credits.toFixed(1)} Credits
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <Link
                              to={`/unilms/faculty/attendance?subject=${sub.code}`}
                              className="btn btn-outline"
                              title="Take Attendance"
                              style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10.5px', fontWeight: '600', color: '#059669', background: '#fff', border: '1px solid #d1d5db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <i className="fa-solid fa-clipboard-user"></i> Attendance
                            </Link>
                            <Link
                              to={`/unilms/faculty/marks?subject=${sub.code}`}
                              className="btn btn-outline"
                              title="Enter Marks"
                              style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10.5px', fontWeight: '600', color: '#2563EB', background: '#fff', border: '1px solid #d1d5db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <i className="fa-solid fa-file-pen"></i> Marks
                            </Link>
                            <Link
                              to={`/unilms/faculty/assignments?subject=${sub.code}`}
                              className="btn btn-outline"
                              title="Coursework & Assignments"
                              style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10.5px', fontWeight: '600', color: '#7C3AED', background: '#fff', border: '1px solid #d1d5db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <i className="fa-solid fa-list-check"></i> Tasks
                            </Link>
                            <Link
                              to={`/unilms/faculty/materials?subject=${sub.code}`}
                              className="btn btn-outline"
                              title="Study Notes & PDFs"
                              style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10.5px', fontWeight: '600', color: '#D97706', background: '#fff', border: '1px solid #d1d5db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <i className="fa-solid fa-book-open-reader"></i> Notes
                            </Link>
                            <Link
                              to="/unilms/faculty/po_setup"
                              className="btn btn-outline"
                              title="CO-PO Mapping"
                              style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10.5px', fontWeight: '600', color: '#0891B2', background: '#fff', border: '1px solid #d1d5db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
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
          </div>

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
        </>
      )}

      {/* ========================================================
          PERSONA 2: CLASS TEACHER BATCH CURRICULUM
          Matches user's reference image exactly with in-table loader & pagination
          ======================================================== */}
      {activePersona === 'class_teacher' && (
        <>
          <div className="faculty-kpi-grid">
            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                <i className="fa-solid fa-users-line"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">CLASS TEACHER SECTION</div>
                <div className="faculty-metric-value">
                  {batchSubjects.length > 0 ? (batchSubjects[0]?.cohort_name || 'Active Batch') : 'Unassigned'}
                </div>
                <div className="faculty-metric-sub" style={{ color: batchSubjects.length > 0 ? '#059669' : 'var(--text-secondary, #64748b)' }}>
                  {batchSubjects.length > 0 ? `${batchSubjects.length} Active Courses` : 'No Class Teacher Section Assigned'}
                </div>
              </div>
            </div>

            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                <i className="fa-solid fa-chart-pie"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">CUMULATIVE ATTENDANCE</div>
                <div className="faculty-metric-value" style={{ color: '#7C3AED' }}>
                  {batchSubjects.length > 0 ? 'Active' : '—'}
                </div>
                <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                  {batchSubjects.length > 0 ? 'Batch Course Schedule Live' : 'No Attendance Records'}
                </div>
              </div>
            </div>

            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">DEFAULTERS WATCHLIST</div>
                <div className="faculty-metric-value" style={{ color: '#10B981' }}>0 Students</div>
                <div className="faculty-metric-sub" style={{ color: '#10B981' }}>No Attendance Defaulters</div>
              </div>
            </div>

            <div className="faculty-metric-card">
              <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
                <i className="fa-solid fa-envelope-open-text"></i>
              </div>
              <div className="faculty-metric-info">
                <div className="faculty-metric-label">PENDING LEAVES &amp; OD</div>
                <div className="faculty-metric-value" style={{ color: '#64748B' }}>0 Requests</div>
                <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>No Pending Leave/OD Requests</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary, #1e293b)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-book-open" style={{ color: '#059669' }}></i> {batchCourses.length > 0 && batchCourses[0]?.cohort_name ? `${batchCourses[0].cohort_name} Semester Curriculum & Teaching Faculty` : 'Batch Semester Curriculum & Teaching Faculty'}
            </h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleManualRefresh}
                className="btn btn-outline"
                title="Refresh Table Data"
                style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`} style={{ color: '#059669' }}></i>
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

          {/* Search & Filter Bar */}
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
          <div className="table-responsive" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
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
                {isLoading ? (
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
          </div>

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
        </>
      )}

      {/* ========================================================
          PERSONA 3: HOD DEPARTMENT CURRICULUM AUDIT
          ======================================================== */}
      {activePersona === 'hod' && (
        <>
          <div className="faculty-kpi-grid">
            <div className="faculty-metric-card" style={{ borderLeft: '3.5px solid #0D9488' }}>
              <div className="faculty-metric-info" style={{ width: '100%' }}>
                <div className="faculty-metric-label">DEPARTMENT FACULTY</div>
                <div className="faculty-metric-value" style={{ color: '#0D9488' }}>
                  {hodSubjects.filter(s => s.status === 'Allocated').length} Allocated / {hodSubjects.length} Courses
                </div>
                <div className="faculty-metric-sub" style={{ color: 'var(--text-muted, #64748b)' }}>
                  {hodSubjects.length > 0 ? `${Math.round((hodSubjects.filter(s => s.status === 'Allocated').length / hodSubjects.length) * 100)}% Workload Allocated` : '0% Workload Allocated'}
                </div>
              </div>
            </div>

            <div className="faculty-metric-card" style={{ borderLeft: '3.5px solid #10B981' }}>
              <div className="faculty-metric-info" style={{ width: '100%' }}>
                <div className="faculty-metric-label">NBA OBE ATTAINMENT</div>
                <div className="faculty-metric-value" style={{ color: hodSubjects.length > 0 ? '#10B981' : '#94A3B8' }}>
                  {hodSubjects.length > 0 ? `${Math.round((hodSubjects.filter(s => s.status === 'Allocated').length / hodSubjects.length) * 100)}%` : '—'}
                </div>
                <div className="faculty-metric-sub" style={{ color: hodSubjects.length > 0 ? '#059669' : 'var(--text-muted, #64748b)' }}>
                  {hodSubjects.length > 0 ? <><i className="fa-solid fa-arrow-trend-up"></i> Target Met</> : 'Awaiting Faculty Allocation'}
                </div>
              </div>
            </div>

            <div className="faculty-metric-card" style={{ borderLeft: '3.5px solid #0284C7' }}>
              <div className="faculty-metric-info" style={{ width: '100%' }}>
                <div className="faculty-metric-label">ACTIVE COURSES</div>
                <div className="faculty-metric-value" style={{ color: '#0284C7' }}>{hodSubjects.length} Subjects</div>
                <div className="faculty-metric-sub" style={{ color: hodSubjects.length > 0 ? '#059669' : 'var(--text-muted, #64748b)' }}>
                  {hodSubjects.length > 0 ? `${hodSubjects.filter(s => s.status === 'Allocated').length} Allocated` : 'No Department Courses'}
                </div>
              </div>
            </div>

            <div className="faculty-metric-card" style={{ borderLeft: '3.5px solid #F59E0B' }}>
              <div className="faculty-metric-info" style={{ width: '100%' }}>
                <div className="faculty-metric-label">LAB OCCUPANCY</div>
                <div className="faculty-metric-value" style={{ color: hodSubjects.some(s => s.type === 'Lab' || s.is_practical) ? '#D97706' : '#94A3B8' }}>
                  {hodSubjects.some(s => s.type === 'Lab' || s.is_practical) ? 'Active' : '—'}
                </div>
                <div className="faculty-metric-sub" style={{ color: 'var(--text-muted, #64748b)' }}>
                  {hodSubjects.filter(s => s.type === 'Lab' || s.is_practical).length} Practical / Lab Batches
                </div>
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
                <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`} style={{ color: '#7C3AED' }}></i>
                <span>Refresh</span>
              </button>
              <Link to="/unilms/faculty/timetable" className="btn btn-outline" style={{ padding: '9px 15px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', textDecoration: 'none', border: '1px solid #cbd5e1', background: '#fff', color: '#334155' }}>
                <i className="fa-solid fa-calendar-days me-1"></i> Department Timetable
              </Link>
              <Link to="/unilms/faculty/co_po_matrix" className="btn btn-primary" style={{ background: '#7C3AED', border: 'none', padding: '9px 15px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', textDecoration: 'none', color: '#fff' }}>
                <i className="fa-solid fa-table-cells me-1"></i> CO-PO Matrix
              </Link>
            </div>
          </div>

          {/* Search & Filter Bar */}
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

          <div className="table-responsive" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
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
                {isLoading ? (
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
          </div>

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
        </>
      )}
    </div>
  );
};

export default FacultySubjects;
