import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import { facultyService } from '../../../services/faculty.service';
import { staffService } from '../../../services/staff.service';
import { academicsService } from '../../../services/academics.service';

const OrgFacultyAllocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [availableFaculty, setAvailableFaculty] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableCohorts, setAvailableCohorts] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCohort, setFilterCohort] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [toastMsg, setToastMsg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form State
  const [formData, setFormData] = useState({
    staff_id: '',
    subject_id: '',
    cohort_id: '',
    cohort_name: '',
    section_id: '',
    section_name: '',
    semester_name: 'Semester 1',
    isClassTeacher: false,
  });

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allocRes, staffRes, subRes, cohortRes, semRes] = await Promise.allSettled([
        facultyService.getAllocations(),
        staffService.getStaff(),
        academicsService.getSubjects(),
        academicsService.getCohorts(),
        academicsService.getSemesters(),
      ]);

      if (allocRes.status === 'fulfilled' && Array.isArray(allocRes.value)) {
        setAllocations(
          allocRes.value.map((a) => ({
            id: a.id,
            faculty_name: a.staff ? `${a.staff.firstName} ${a.staff.lastName || ''}`.trim() : 'Unknown Faculty',
            employee_code: a.staff?.employeeCode || '',
            subject_code: a.subject?.code || '',
            subject_name: a.subject?.name || '',
            cohort_name: a.cohortName || 'General',
            semester_name: a.semesterName || 'Semester 1',
            isClassTeacher: a.isClassTeacher,
          }))
        );
      }

      let facultyList = [];
      if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value) && staffRes.value.length > 0) {
        facultyList = staffRes.value.map((s) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName || ''}`.trim(),
          code: s.employeeCode,
          dept: s.department?.code || 'ACAD',
          departmentId: s.departmentId,
        }));
        setAvailableFaculty(facultyList);
      } else {
        setAvailableFaculty([]);
      }

      let subjectList = [];
      if (subRes.status === 'fulfilled' && Array.isArray(subRes.value)) {
        subjectList = subRes.value.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          departmentId: s.departmentId,
          departmentName: s.department?.name || '',
          departmentCode: s.department?.code || '',
        }));
        setAvailableSubjects(subjectList);
      }

      let cohortList = [];
      if (cohortRes.status === 'fulfilled' && Array.isArray(cohortRes.value)) {
        cohortList = cohortRes.value;
        setAvailableCohorts(cohortList);
      }

      if (semRes.status === 'fulfilled' && Array.isArray(semRes.value)) {
        setAvailableSemesters(semRes.value.map((s) => s.name));
      }
    } catch (err) {
      console.error('Error loading allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData();
      }
    }, 30000); // 30s smart background polling
    return () => clearInterval(interval);
  }, []);

  const openAddModal = () => {
    const firstSubj = availableSubjects[0] || null;
    let initialCohort = null;

    if (firstSubj?.departmentId) {
      initialCohort = availableCohorts.find(
        (c) => c.program?.departmentId === firstSubj.departmentId || c.program?.department?.id === firstSubj.departmentId
      );
    }
    if (!initialCohort && availableCohorts.length > 0) {
      initialCohort = availableCohorts[0];
    }

    const initialSections = initialCohort?.sections || [];

    setFormData({
      staff_id: availableFaculty[0]?.id || '',
      subject_id: firstSubj?.id || '',
      cohort_id: initialCohort?.id || '',
      cohort_name: initialCohort?.name || '',
      section_id: initialSections[0]?.id || '',
      section_name: initialSections[0]?.name || '',
      semester_name: initialCohort?.semesterName || 'Semester 1',
      isClassTeacher: false,
    });
    setIsModalOpen(true);
  };

  const handleSubjectChange = (subjectId) => {
    const selectedSubj = availableSubjects.find((s) => s.id === subjectId);
    let matchedCohort = null;

    // Smart cascade: align cohort to subject's department
    if (selectedSubj?.departmentId) {
      matchedCohort = availableCohorts.find(
        (c) =>
          c.program?.departmentId === selectedSubj.departmentId ||
          c.program?.department?.id === selectedSubj.departmentId
      );
    }
    if (!matchedCohort && availableCohorts.length > 0) {
      matchedCohort = availableCohorts.find((c) => c.id === formData.cohort_id) || availableCohorts[0];
    }

    const matchedSections = matchedCohort?.sections || [];

    setFormData((prev) => ({
      ...prev,
      subject_id: subjectId,
      cohort_id: matchedCohort ? matchedCohort.id : prev.cohort_id,
      cohort_name: matchedCohort ? matchedCohort.name : prev.cohort_name,
      section_id: matchedSections.length > 0 ? matchedSections[0].id : '',
      section_name: matchedSections.length > 0 ? matchedSections[0].name : '',
      semester_name: matchedCohort?.semesterName || prev.semester_name || 'Semester 1',
    }));
  };

  const handleCohortChange = (cohortId) => {
    const selectedCohort = availableCohorts.find((c) => c.id === cohortId);
    const cohortSections = selectedCohort?.sections || [];

    setFormData((prev) => ({
      ...prev,
      cohort_id: cohortId,
      cohort_name: selectedCohort ? selectedCohort.name : '',
      section_id: cohortSections.length > 0 ? cohortSections[0].id : '',
      section_name: cohortSections.length > 0 ? cohortSections[0].name : '',
      semester_name: selectedCohort?.semesterName || prev.semester_name || 'Semester 1',
    }));
  };

  const handleSectionChange = (sectionId) => {
    const currentCohort = availableCohorts.find((c) => c.id === formData.cohort_id) || availableCohorts[0];
    const secObj = currentCohort?.sections?.find((s) => s.id === sectionId);

    setFormData((prev) => ({
      ...prev,
      section_id: sectionId,
      section_name: secObj ? secObj.name : '',
    }));
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRemove = async (id) => {
    const item = allocations.find((a) => a.id === id);
    if (window.confirm(`Are you sure you want to remove allocation for ${item?.faculty_name} (${item?.subject_code})?`)) {
      try {
        await facultyService.deleteAllocation(id);
        setAllocations((prev) => prev.filter((a) => a.id !== id));
        triggerToast(`Removed allocation for ${item?.faculty_name} (${item?.subject_code}).`);
      } catch (err) {
        alert(err.message || 'Failed to remove allocation.');
      }
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.staff_id || !formData.subject_id) {
      alert('Please select both a faculty member and a subject course.');
      return;
    }

    const selectedCohort = availableCohorts.find((c) => c.id === formData.cohort_id) || availableCohorts[0];
    const sectionName = formData.section_name || (selectedCohort?.sections?.[0]?.name) || 'Section A';

    try {
      const fullCohortDisplay = `${selectedCohort ? selectedCohort.name : (formData.cohort_name || 'General')} • ${sectionName}`;

      const payload = {
        staffId: formData.staff_id,
        subjectId: formData.subject_id,
        cohortId: formData.cohort_id || selectedCohort?.id || null,
        sectionId: formData.section_id || (selectedCohort?.sections?.[0]?.id) || null,
        cohortName: fullCohortDisplay,
        semesterName: formData.semester_name || 'Semester 1',
        isClassTeacher: Boolean(formData.isClassTeacher),
      };

      const created = await facultyService.createAllocation(payload);
      const newRecord = {
        id: created.id,
        faculty_name: created.staff ? `${created.staff.firstName} ${created.staff.lastName || ''}`.trim() : 'Faculty',
        employee_code: created.staff?.employeeCode || '',
        subject_code: created.subject?.code || '',
        subject_name: created.subject?.name || '',
        cohort_name: created.cohortName || payload.cohortName,
        semester_name: created.semesterName || payload.semesterName,
        isClassTeacher: created.isClassTeacher,
      };

      setAllocations((prev) => [newRecord, ...prev]);
      setIsModalOpen(false);
      triggerToast(`Successfully allocated ${newRecord.subject_code} to ${newRecord.faculty_name}!`);
    } catch (err) {
      alert(err.message || 'Failed to create allocation.');
    }
  };

  // Filtered allocations
  const filteredAllocations = useMemo(() => {
    return allocations.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (item.faculty_name && item.faculty_name.toLowerCase().includes(q)) ||
        (item.subject_name && item.subject_name.toLowerCase().includes(q)) ||
        (item.subject_code && item.subject_code.toLowerCase().includes(q)) ||
        (item.cohort_name && item.cohort_name.toLowerCase().includes(q));

      const matchCohort = filterCohort === 'all' || item.cohort_name === filterCohort;
      const matchSemester = filterSemester === 'all' || item.semester_name === filterSemester;

      return matchQuery && matchCohort && matchSemester;
    });
  }, [allocations, searchQuery, filterCohort, filterSemester]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems,
  } = useTablePagination(filteredAllocations, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCohort, filterSemester, setCurrentPage]);

  return (
    <div className="page-container" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '13.5px',
            fontWeight: '600',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-circle-check" style={{ color: '#10B981' }}></i>
            <span>{toastMsg}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            style={{ background: 'none', border: 'none', color: '#065F46', cursor: 'pointer', fontSize: '13px' }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '800',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              letterSpacing: '-0.3px',
            }}
          >
            <i className="fa-solid fa-user-tie" style={{ color: '#7C3AED' }}></i>
            <span>Subject &amp; Faculty Allocations</span>
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
            Assign teaching professors and lab instructors to subject courses and student batches.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/unilms/org/timetable"
            className="btn btn-outline"
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#1e293b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
          >
            <i className="fa-solid fa-calendar-days" style={{ color: '#7C3AED' }}></i>
            <span>Timetable &amp; Periods</span>
          </Link>

          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-primary"
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              background: '#7C3AED',
              border: 'none',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
            }}
          >
            <i className="fa-solid fa-circle-plus"></i>
            <span>Allocate Subject</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search faculty, subject, or degree program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              minWidth: '260px',
            }}
          />
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                  FACULTY
                </th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                  SUBJECT
                </th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                  PROGRAM &amp; SECTION
                </th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                  SEMESTER
                </th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader rows={4} columns={5} />
              ) : paginatedItems && paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px', fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>
                      {item.faculty_name}
                      {item.employee_code && (
                        <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                          {item.employee_code}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13.5px', color: '#334155', fontWeight: '500' }}>
                      {item.subject_code ? `${item.subject_code} - ` : ''}{item.subject_name}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          background: '#F5F3FF',
                          color: '#7C3AED',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: '1px solid #EDE9FE',
                        }}
                      >
                        {item.cohort_name}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569' }}>
                      {item.semester_name}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleRemove(item.id)}
                        style={{
                          background: '#FEE2E2',
                          color: '#DC2626',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        <i className="fa-solid fa-trash-can" style={{ marginRight: '6px' }}></i>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
                    <i className="fa-solid fa-folder-open" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '12px', display: 'block' }}></i>
                    <p style={{ margin: 0, fontWeight: '600' }}>No subject allocations configured yet.</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Click "Allocate Subject" to assign a faculty member to a course.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
          <TablePagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalItems={totalItems}
          />
        </div>
      </div>

      {/* Allocation Slide-Over Drawer */}
      <div
        className={`drawer-overlay ${isModalOpen ? 'active' : ''}`}
        style={{
          display: isModalOpen ? 'flex' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          justifyContent: 'flex-end',
          alignItems: 'stretch',
          zIndex: 99999,
          opacity: isModalOpen ? 1 : 0,
          pointerEvents: isModalOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
        onClick={(e) => {
          if (e.target.classList.contains('drawer-overlay')) setIsModalOpen(false);
        }}
      >
        <div
          className="drawer-content"
          style={{
            maxWidth: '520px',
            width: '100%',
            height: '100vh',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            transform: isModalOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '-20px 0 50px rgba(0, 0, 0, 0.25)',
            borderTopLeftRadius: '20px',
            borderBottomLeftRadius: '20px',
            overflow: 'hidden',
          }}
        >
          <form onSubmit={handleAllocateSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Drawer Header */}
            <div
              className="drawer-header"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                color: '#fff',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <i className="fa-solid fa-user-tie"></i>
                  Allocate Course to Faculty
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'rgba(255,255,255,0.85)' }}>
                  Assign faculty member, course subject, degree program, and class section
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  color: '#fff',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="drawer-body" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Faculty Member *
                </label>
                <select
                  value={formData.staff_id}
                  onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontWeight: '600' }}
                >
                  <option value="">-- Select Faculty --</option>
                  {availableFaculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code}) — Dept of {f.dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Subject Course *
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontWeight: '600' }}
                >
                  <option value="">-- Select Course Subject --</option>
                  {availableSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} {s.departmentCode ? `[Dept: ${s.departmentCode}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Width Academic Degree Program */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Academic Degree Program <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.cohort_id}
                  onChange={(e) => handleCohortChange(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontWeight: '600' }}
                >
                  <option value="">-- Select Degree Program --</option>
                  {availableCohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.program?.name || c.name} ({c.program?.code || 'PROG'}) {c.program?.department?.name ? `— Dept of ${c.program.department.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dependent Class Section & Semester Term */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Class Section *
                  </label>
                  <select
                    value={formData.section_id}
                    onChange={(e) => handleSectionChange(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                  >
                    {(() => {
                      const activeCohort = availableCohorts.find((c) => c.id === formData.cohort_id) || availableCohorts[0];
                      const secList = activeCohort?.sections || [];
                      if (secList.length === 0) {
                        return <option value="">No sections configured</option>;
                      }
                      return secList.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name} {sec.maxStudents ? `(Intake: ${sec.maxStudents})` : ''}
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Semester Term *
                  </label>
                  <select
                    value={formData.semester_name}
                    onChange={(e) => setFormData({ ...formData, semester_name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    {(availableSemesters.length > 0 ? availableSemesters : ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']).map((s, i) => {
                      const semLabel = typeof s === 'object' ? (s?.name || s?.semesterName || `Semester ${i + 1}`) : s;
                      return <option key={i} value={semLabel}>{semLabel}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--hover-bg, #f8fafc)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <input
                  type="checkbox"
                  id="isClassTeacherCheck"
                  checked={formData.isClassTeacher}
                  onChange={(e) => setFormData({ ...formData, isClassTeacher: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#7C3AED', marginTop: '2px' }}
                />
                <div>
                  <label htmlFor="isClassTeacherCheck" style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', cursor: 'pointer', margin: 0, display: 'block' }}>
                    Designate as Class Teacher / Cohort Proctor for this Section
                  </label>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    Grants attendance monitoring, student leave approval, and academic performance tracking for this section.
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div
              className="drawer-footer"
              style={{
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-outline"
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <i className="fa-solid fa-check"></i>
                <span>Confirm Allocation</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrgFacultyAllocations;
