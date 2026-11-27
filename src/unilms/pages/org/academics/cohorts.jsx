import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import academicsService from '../../../services/academics.service';
import { getCurrentAcademicYear } from '../../../utils/date';

const OrgAcademicsCohorts = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [cohorts, setCohorts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingCohortId, setEditingCohortId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const pagination = useTablePagination(cohorts, 10);

  // Form states
  const [programId, setProgramId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [cohortName, setCohortName] = useState('');
  const [semesterName, setSemesterName] = useState('Semester 1');

  // Dynamic program duration & semesters computation linked to Semesters Master Setup
  const selectedProgramObj = programs.find(p => p.id === programId);
  const selectedAyObj = academicYears.find(y => y.id === academicYearId);
  const progDurationYears = Number(selectedProgramObj?.durationYears || selectedProgramObj?.duration_years || 4);
  const totalSemesters = Math.max(1, progDurationYears * 2);

  // Read authentic customized terms from /org/academics/semesters setup, filtered by sequence up to program duration!
  const dynamicSemesters = (Array.isArray(semesters) && semesters.length > 0)
    ? semesters
        .filter(s => Number(s.sequence || 1) <= totalSemesters)
        .map(s => s.name)
    : Array.from({ length: totalSemesters }, (_, i) => `Semester ${i + 1}`);

  const startYearNum = selectedAyObj?.startYear || parseInt(selectedAyObj?.name?.slice(0, 4), 10) || new Date().getFullYear();
  const endYearNum = startYearNum + progDurationYears;
  const suggestedCohortName = `${selectedProgramObj?.code || 'BATCH'} (${startYearNum} - ${endYearNum} Batch)`;

  // Prevent duplicate cohorts for the same Program and Academic Year
  const duplicateCohort = cohorts.find(
    (c) => c.programId === programId && c.academicYearId === academicYearId && c.id !== editingCohortId
  );

  // Reset semester if program changed and current selected semester exceeds program's max
  useEffect(() => {
    if (selectedProgramObj) {
      const semNum = parseInt(semesterName.replace(/\D/g, ''), 10) || 1;
      if (semNum > totalSemesters) {
        setSemesterName(dynamicSemesters[0] || 'Semester 1');
      }
    }
  }, [programId, totalSemesters, dynamicSemesters]);

  // Section Modal state
  const [targetCohortId, setTargetCohortId] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [maxStudents, setMaxStudents] = useState(60);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cohortsData, progsData, aysData, semsData] = await Promise.all([
        academicsService.getCohorts(),
        academicsService.getPrograms(),
        academicsService.getAcademicYears(),
        academicsService.getSemesters(),
      ]);

      setCohorts(Array.isArray(cohortsData) ? cohortsData : []);

      if (Array.isArray(progsData)) {
        setPrograms(progsData);
        if (progsData.length > 0 && !programId) setProgramId(progsData[0].id);
      }
      if (Array.isArray(aysData)) {
        setAcademicYears(aysData);
        if (aysData.length > 0 && !academicYearId) setAcademicYearId(aysData[0].id);
      }
      if (Array.isArray(semsData)) {
        setSemesters(semsData);
      }
    } catch (err) {
      console.error('Error fetching cohorts:', err);
      setCohorts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingCohortId(null);
    setCohortName('');
    if (programs.length > 0) setProgramId(programs[0].id);
    if (academicYears.length > 0) setAcademicYearId(academicYears[0].id);
    setIsAddModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCohortId(c.id);
    setCohortName(c.name);
    setProgramId(c.programId || c.program?.id || '');
    setAcademicYearId(c.academicYearId || c.academicYear?.id || '');
    setSemesterName(c.semesterName || 'Semester 1');
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setEditingCohortId(null);
    setCohortName('');
  };

  const openSectionModal = (cohortId) => {
    setTargetCohortId(cohortId);
    setSectionName('Section B');
    setMaxStudents(60);
    setIsSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    setIsSectionModalOpen(false);
    setSectionName('');
  };

  const handleCohortSubmit = async (e) => {
    e.preventDefault();
    if (!cohortName.trim()) return;
    if (duplicateCohort && !editingCohortId) {
      alert(`Conflict: A cohort for this Degree Program in academic year ${selectedAyObj?.name} already exists ("${duplicateCohort.name}"). To create more class divisions, please add sections (e.g. Section B) to the existing batch.`);
      return;
    }

    const isEdit = Boolean(editingCohortId);
    const prog = programs.find(p => p.id === programId);

    const confirmed = await confirm({
      title: isEdit ? 'Confirm Update Batch Cohort' : 'Confirm Create Academic Batch',
      message: `${isEdit ? 'Save modifications for batch' : 'Register new student cohort'} "${cohortName.trim()}"?`,
      details: [
        `Batch Name: ${cohortName.trim()}`,
        `Degree Program: ${prog?.name || 'Selected Program'} (${prog?.code || ''})`,
        `Academic Year: ${academicYears.find(y => y.id === academicYearId)?.name || getCurrentAcademicYear()}`,
        `Current Term: ${semesterName || 'Semester 1'}`
      ],
      confirmText: isEdit ? 'Yes, Update Batch' : 'Yes, Create Batch',
      variant: isEdit ? 'primary' : 'success',
      icon: isEdit ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-users'
    });
    if (!confirmed) return;

    try {
      if (editingCohortId) {
        await academicsService.updateCohort(editingCohortId, {
          name: cohortName.trim(),
          programId,
          academicYearId,
          semesterName,
        });
      } else {
        await academicsService.createCohort({
          name: cohortName.trim(),
          programId: programId || (programs[0] ? programs[0].id : undefined),
          academicYearId: academicYearId || (academicYears[0] ? academicYears[0].id : undefined),
          semesterName,
        });
      }
      await loadData();
      closeAddModal();
    } catch (err) {
      alert('Error saving cohort: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    if (!sectionName.trim()) return;

    const parentCohort = cohorts.find(c => c.id === targetCohortId);

    const confirmed = await confirm({
      title: 'Confirm Add Class Section',
      message: `Create new section "${sectionName.trim()}" under batch "${parentCohort?.name || 'Cohort'}"?`,
      details: [
        `Section Name: ${sectionName.trim()}`,
        `Capacity: ${Number(maxStudents) || 60} Students`,
        `Target Batch: ${parentCohort?.name || 'Academic Batch'}`
      ],
      confirmText: 'Yes, Add Section',
      variant: 'success',
      icon: 'fa-solid fa-chalkboard'
    });
    if (!confirmed) return;

    try {
      await academicsService.createSection({
        cohortId: targetCohortId,
        name: sectionName.trim(),
        maxStudents: Number(maxStudents),
      });
      await loadData();
      closeSectionModal();
    } catch (err) {
      alert('Error creating section: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCohort = async (id, name) => {
    const coh = cohorts.find(c => c.id === id);
    const confirmed = await confirm({
      title: 'Confirm Delete Batch Cohort',
      message: `Permanently delete batch "${coh?.name || name || 'Cohort'}"?`,
      details: 'This will remove all associated class sections, enrolled students, timetable slots, and fee structures linked to this cohort.',
      confirmText: 'Yes, Delete Cohort',
      variant: 'danger',
      icon: 'fa-solid fa-trash-can'
    });
    if (!confirmed) return;

    try {
      await academicsService.deleteCohort(id);
      await loadData();
    } catch (err) {
      alert('Error deleting cohort: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      <section className="view-section active">
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
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
              }}
            >
              <i className="fa-solid fa-users"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Cohorts &amp; Class Sections
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Define student batch intake years and manage classroom section divisions (Sec A, Sec B, Sec C)
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={openAddModal}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                fontWeight: '700',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Batch (Cohort)
            </button>
          </div>
        </div>

        {/* Table of Cohorts */}
        <div
          className="table-container"
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          <table className="data-table">
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                  Batch Name & Class Sections
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                  Degree Program
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                  Academic Year
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                  Current Semester
                </th>
                <th
                  style={{
                    padding: '14px 18px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    textAlign: 'right',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonLoader columns={5} rows={5} />
              ) : pagination.paginatedItems.length > 0 ? (
                pagination.paginatedItems.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: '14px 18px' }}>
                      <strong
                        style={{
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          display: 'block',
                          marginBottom: '6px',
                        }}
                      >
                        {c.name}
                      </strong>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                          Classes:
                        </span>
                        {c.sections && c.sections.length > 0 ? (
                          c.sections.map((sec) => (
                            <span
                              key={sec.id}
                              style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                fontWeight: '700',
                                fontSize: '11.5px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <i className="fa-solid fa-door-open" style={{ fontSize: '10px' }}></i> {sec.name} (
                              {sec.maxStudents ?? sec.max_students ?? 60} cap)
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No classes created yet
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {c.program?.name || c.program_name || '—'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          background: 'var(--bg-main, #f1f5f9)',
                          color: 'var(--text-primary)',
                          fontWeight: '700',
                          fontSize: '12.5px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        {c.academicYear?.name || c.ay_name || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        className="badge badge-primary"
                        style={{
                          background: 'rgba(124, 58, 237, 0.1)',
                          color: '#7C3AED',
                          border: '1px solid rgba(124, 58, 237, 0.2)',
                          fontWeight: '700',
                          fontSize: '12px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                        }}
                      >
                        {c.semesterName || c.semester_name || 'Not Set'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div
                        className="action-buttons"
                        style={{
                          display: 'inline-flex',
                          gap: '6px',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                        }}
                      >
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openSectionModal(c.id)}
                          title="Add Class Section (Sec A, Sec B)"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                            background: 'rgba(124, 58, 237, 0.08)',
                            color: '#7C3AED',
                            cursor: 'pointer',
                          }}
                        >
                          <i className="fa-solid fa-plus-circle"></i>
                        </button>

                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openEditModal(c)}
                          title="Edit Batch"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>

                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => handleDeleteCohort(c.id)}
                          title="Delete Batch"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'none',
                            color: '#DC2626',
                            cursor: 'pointer',
                          }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}
                  >
                    No cohorts found. Click "Add Batch (Cohort)" to create your first batch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <TablePagination {...pagination} itemName="cohorts" />
        </div>
      </section>

      {/* Cohort Modal (Right-Side Slide-Over Drawer) */}
      {isAddModalOpen && (
        <div
          className="drawer-overlay active"
          id="addModal"
          onClick={(e) => {
            if (e.target.id === 'addModal') closeAddModal();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'stretch',
            animation: 'unilmsFadeIn 0.2s ease',
          }}
        >
          <div
            className="drawer-content"
            style={{
              width: 'min(540px, 100vw)',
              height: '100vh',
              background: '#ffffff',
              boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.25)',
              borderLeft: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              animation: 'unilmsSlideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleCohortSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
              <div
                className="drawer-header"
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ffffff',
                  color: '#1e293b',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className="fa-solid fa-users"></i>
                  </div>
                  <div>
                    <h3 id="modal_title" style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
                      {editingCohortId ? 'Edit Cohort (Batch)' : 'Add Cohort (Batch)'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      Link degree program with admission year and term
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeAddModal}
                  style={{
                    background: 'rgba(0, 0, 0, 0.05)',
                    border: 'none',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="drawer-body" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Degree Program <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="program_id"
                    id="form_program_id"
                    className="form-control"
                    required
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                  >
                    <option value="" disabled>-- Select Degree Program --</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                    {programs.length === 0 && (
                      <option value="">No programs available</option>
                    )}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Academic Year <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="academic_year_id"
                    id="form_academic_year_id"
                    className="form-control"
                    required
                    value={academicYearId}
                    onChange={(e) => setAcademicYearId(e.target.value)}
                  >
                    <option value="" disabled>-- Select Academic Year --</option>
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name}
                      </option>
                    ))}
                    {academicYears.length === 0 && (
                      <option value="">No academic years available</option>
                    )}
                  </select>
                </div>

                {duplicateCohort && !editingCohortId && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ef4444', marginTop: '2px', fontSize: '15px' }}></i>
                    <div style={{ fontSize: '12px', color: '#991b1b', lineHeight: '1.5' }}>
                      <strong style={{ display: 'block', marginBottom: '2px' }}>Batch Already Exists:</strong>
                      A cohort for <strong>{selectedProgramObj?.name}</strong> in <strong>{selectedAyObj?.name}</strong> is already registered as <em>"{duplicateCohort.name}"</em>.
                      <div style={{ marginTop: '4px', color: '#7f1d1d' }}>
                        Creating a duplicate batch creates duplicate "Section A"s. To add more classes (e.g. <strong>Section B</strong>, <strong>Section C</strong>), close this drawer and click <strong>Add Section</strong> on the existing batch.
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Cohort Batch Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="form_name"
                    className="form-control"
                    required
                    placeholder={`e.g. ${suggestedCohortName}`}
                    value={cohortName}
                    onChange={(e) => setCohortName(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Suggested: <strong>{suggestedCohortName}</strong>
                    </span>
                    {!cohortName && (
                      <button
                        type="button"
                        onClick={() => setCohortName(suggestedCohortName)}
                        style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                      >
                        Auto-fill
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0, fontWeight: '600', fontSize: '13px' }}>
                      Current Semester
                    </label>
                    <span style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: '700' }}>
                      {progDurationYears} Years ({totalSemesters} Semesters)
                    </span>
                  </div>
                  <select
                    name="current_semester_id"
                    id="form_current_semester_id"
                    className="form-control"
                    value={semesterName}
                    onChange={(e) => setSemesterName(e.target.value)}
                  >
                    {dynamicSemesters.map((sem) => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                className="drawer-footer"
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  flexShrink: 0,
                }}
              >
                <button type="button" className="btn btn-outline" onClick={closeAddModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={Boolean(duplicateCohort && !editingCohortId)}
                  style={{
                    background: duplicateCohort && !editingCohortId
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: duplicateCohort && !editingCohortId ? 'not-allowed' : 'pointer',
                  }}
                >
                  {editingCohortId ? 'Update Cohort' : duplicateCohort ? 'Batch Already Exists' : 'Save Cohort'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section Modal (Right-Side Slide-Over Drawer) */}
      {isSectionModalOpen && (
        <div
          className="drawer-overlay active"
          id="sectionModal"
          onClick={(e) => {
            if (e.target.id === 'sectionModal') closeSectionModal();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'stretch',
            animation: 'unilmsFadeIn 0.2s ease',
          }}
        >
          <div
            className="drawer-content"
            style={{
              width: 'min(500px, 100vw)',
              height: '100vh',
              background: '#ffffff',
              boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.25)',
              borderLeft: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              animation: 'unilmsSlideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSectionSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
              <div
                className="drawer-header"
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ffffff',
                  color: '#1e293b',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className="fa-solid fa-door-open"></i>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
                      Add Class Section
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      Create student group section under this batch
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeSectionModal}
                  style={{
                    background: 'rgba(0, 0, 0, 0.05)',
                    border: 'none',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="drawer-body" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Section Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="sec_name"
                    className="form-control"
                    required
                    placeholder="e.g. Section A, Section B"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Maximum Intake Capacity
                  </label>
                  <input
                    type="number"
                    name="max_students"
                    id="sec_max_students"
                    className="form-control"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    min="1"
                    max="250"
                  />
                </div>
              </div>

              <div
                className="drawer-footer"
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  flexShrink: 0,
                }}
              >
                <button type="button" className="btn btn-outline" onClick={closeSectionModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: '700',
                  }}
                >
                  Save Class Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgAcademicsCohorts;