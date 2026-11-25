import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';

const OrgAcademicsSections = () => {
  const [sections, setSections] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [programId, setProgramId] = useState('');
  const [maxStudents, setMaxStudents] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const pagination = useTablePagination(sections, 10);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [secData, chData, prData] = await Promise.all([
        academicsService.getSections(),
        academicsService.getCohorts(),
        academicsService.getPrograms(),
      ]);

      setSections(Array.isArray(secData) ? secData : []);

      if (Array.isArray(chData)) {
        setCohorts(chData);
      }

      if (Array.isArray(prData)) {
        setPrograms(prData);
        if (prData.length > 0 && !programId) {
          setProgramId(prData[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching sections or programs:', err);
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Escape key listener for slide-over drawer (Mandatory Rule 2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    if (programs.length > 0) setProgramId(programs[0].id);
    setMaxStudents(60);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (sec) => {
    setEditingId(sec.id);
    setName(sec.name);
    const pId = sec.cohort?.program?.id || sec.cohort?.programId || (programs[0] ? programs[0].id : '');
    setProgramId(pId);
    setMaxStudents(sec.maxStudents ?? sec.max_students ?? 60);
    setIsActive(sec.status === 'active' || Boolean(sec.is_active));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const targetProgram = programs.find((p) => p.id === programId) || programs[0];
    const targetProgramId = targetProgram ? targetProgram.id : programId;

    // Check duplicate section within this Degree Program
    const isDuplicate = sections.some((s) => {
      const sProgramId = s.cohort?.program?.id || s.cohort?.programId;
      return (
        sProgramId === targetProgramId &&
        s.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        s.id !== editingId
      );
    });

    if (isDuplicate) {
      alert(`Conflict: "${trimmedName}" already exists for ${targetProgram ? targetProgram.name : 'this degree program'}. Please use a unique section name (e.g. Section B, Section C).`);
      return;
    }

    try {
      // Find matching cohort for relational DB integrity
      const matchingCohort = cohorts.find(
        (c) => c.programId === targetProgramId || c.program?.id === targetProgramId
      );

      const payload = {
        programId: targetProgramId,
        cohortId: matchingCohort ? matchingCohort.id : undefined,
        name: trimmedName,
        maxStudents: Number(maxStudents),
        status: isActive ? 'active' : 'inactive',
      };

      if (editingId) {
        await academicsService.updateSection(editingId, payload);
      } else {
        await academicsService.createSection(payload);
      }
      await loadData();
      closeModal();
    } catch (err) {
      alert('Failed to save section: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this class section?')) {
      try {
        await academicsService.deleteSection(id);
        await loadData();
      } catch (err) {
        alert('Failed to delete section: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <>
      <section className="view-section active">
        {/* Top Header Card matching Centralized Architecture */}
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
            gap: '16px',
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
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
              }}
            >
              <i className="fa-solid fa-people-line"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Degree Program Sections &amp; Class Divisions
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Centralized master sections (Sec A, Sec B, Sec C) assigned to Degree Programs &amp; Departments
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={openAddModal}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add Program Section</span>
            </button>
            <Link
              to="/unilms/org/academics/programs"
              className="btn btn-outline"
              style={{
                background: 'var(--card-bg, #fff)',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="fa-solid fa-graduation-cap" style={{ color: '#0284C7' }}></i>
              <span>Degree Programs</span>
            </Link>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Section Name</th>
                <th>Academic Degree Program</th>
                <th>Department</th>
                <th>Max Student Capacity</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonLoader columns={6} rows={5} />
              ) : pagination.paginatedItems.length > 0 ? (
                pagination.paginatedItems.map((sec) => (
                  <tr key={sec.id}>
                    <td>
                      <strong style={{ color: '#0284C7', fontSize: '15px' }}>{sec.name}</strong>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {sec.cohort?.program?.name || sec.program_name || '—'}
                      </strong>
                      {sec.cohort?.program?.code && (
                        <span style={{ display: 'block', fontSize: '11.5px', color: '#64748b' }}>
                          Code: {sec.cohort.program.code}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: '1px solid #DBEAFE',
                        }}
                      >
                        {sec.cohort?.program?.department?.name || '—'}
                      </span>
                    </td>
                    <td>{sec.maxStudents ?? sec.max_students ?? 60} Students</td>
                    <td>
                      <span
                        className={`badge ${sec.status === 'active' || sec.is_active ? 'badge-success' : 'badge-warning'}`}
                        style={{ fontWeight: '600' }}
                      >
                        {sec.status === 'active' || sec.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons" style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openEditModal(sec)}
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => handleDelete(sec.id)}
                          title="Delete"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No program sections created yet. Click "Add Program Section" to define Section A, B, etc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <TablePagination {...pagination} itemName="sections" />
        </div>
      </section>

      {/* Right Slide-over Drawer Standard (Mandatory Rule 2) */}
      {isModalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
            transition: 'opacity 0.25s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              height: '100vh',
              background: 'var(--card-bg, #ffffff)',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Drawer Header */}
              <div
                style={{
                  padding: '20px 24px',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    <i className="fa-solid fa-people-line"></i>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#ffffff' }}>
                      {editingId ? 'Edit Program Section' : 'Add Program Section'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.9 }}>
                      Configure centralized section breakdown and student intake capacity
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close drawer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Drawer Body */}
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                {/* Degree Program Selector */}
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                    Select Academic Degree Program <span className="text-danger">*</span>
                  </label>
                  <select
                    name="program_id"
                    className="form-control"
                    required
                    style={{ fontSize: '13.5px', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code}) {p.department?.name ? `— Dept of ${p.department.name}` : ''}
                      </option>
                    ))}
                    {programs.length === 0 && <option value="">No degree programs available</option>}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                    Section Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    required
                    placeholder="e.g. Section A, Section B, Section C"
                    style={{ fontSize: '13.5px', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                    Maximum Student Intake Capacity
                  </label>
                  <input
                    type="number"
                    name="max_students"
                    className="form-control"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    min="1"
                    max="250"
                    style={{ fontSize: '13.5px', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                  />
                  <small style={{ color: 'var(--text-secondary, #64748b)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Default capacity is 60 students per section.
                  </small>
                </div>

                <div
                  style={{
                    background: 'var(--hover-bg, #f8fafc)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <input
                    type="checkbox"
                    id="section_active_toggle"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#0284C7', cursor: 'pointer' }}
                  />
                  <label htmlFor="section_active_toggle" style={{ fontSize: '13px', fontWeight: '700', cursor: 'pointer', margin: 0 }}>
                    Section Active for Allocations &amp; Timetable
                  </label>
                </div>
              </div>

              {/* Drawer Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--border-color)',
                  background: 'var(--card-bg, #ffffff)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    border: 'none',
                    padding: '10px 22px',
                    fontWeight: '700',
                    fontSize: '13px',
                    color: '#ffffff',
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-check"></i>
                  <span>{editingId ? 'Update Section' : 'Save Section'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgAcademicsSections;
