import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import academicsService from '../../../services/academics.service';
import obeService from '../../../services/obe.service';

const DEFAULT_DEGREE_STREAMS = [
  { id: 'UG', code: 'UG', name: 'Undergraduate (UG)', examples: 'B.Pharm, B.Tech', defaultDuration: 4, active: true },
  { id: 'Degree', code: 'Degree', name: 'General Degree', examples: 'B.Sc, B.Com, B.A, BBA', defaultDuration: 3, active: true },
  { id: 'PG', code: 'PG', name: 'Postgraduate (PG)', examples: 'M.Pharm, M.Tech, MBA, MCA, M.Sc', defaultDuration: 2, active: true },
  { id: 'PharmD', code: 'PharmD', name: 'Doctor of Pharmacy (Pharm.D)', examples: 'Clinical Pharmacy', defaultDuration: 6, active: true },
  { id: 'Diploma', code: 'Diploma', name: 'Diploma / Polytechnic', examples: 'D.Pharm, Polytechnic', defaultDuration: 2, active: true }
];

const OrgAcademicsPrograms = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [degreeStreams, setDegreeStreams] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('unilms_masterdata_degree_streams_v1') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_DEGREE_STREAMS;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deptId, setDeptId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('UG');
  const [durationYears, setDurationYears] = useState(4);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progs, depts] = await Promise.all([
        academicsService.getPrograms(),
        academicsService.getDepartments(),
      ]);
      setPrograms(Array.isArray(progs) ? progs.map(p => ({
        ...p,
        dept_name: p.department?.name || '—',
        duration_years: p.durationYears || 4,
        type: p.type || 'UG',
        pos: (p.programOutcomes && p.programOutcomes.length > 0)
          ? p.programOutcomes.map(po => ({
              code: po.code,
              title: po.title || po.statement || po.code,
              desc: po.description || po.desc || po.title || ''
            }))
          : (Array.isArray(p.pos) ? p.pos : [])
      })) : []);

      if (Array.isArray(depts)) {
        setDepartments(depts);
        if (depts.length > 0 && !deptId) setDeptId(depts[0].id);
      }
    } catch (e) {
      console.warn('Backend fetch failed for programs:', e.message);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [selectedProgForPo, setSelectedProgForPo] = useState(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poLoading, setPoLoading] = useState(false);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedPrograms,
    totalItems
  } = useTablePagination(programs, 10);

  const reloadMasterStreams = () => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('unilms_masterdata_degree_streams_v1') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDegreeStreams(parsed);
          return parsed;
        }
      }
    } catch (e) {}
    return degreeStreams;
  };

  const openAddModal = () => {
    const streams = reloadMasterStreams();
    setEditingId(null);
    setDeptId(departments[0]?.id || '');
    setCode('');
    setName('');
    const firstStream = streams.find(s => s.active !== false) || { code: 'UG', defaultDuration: 4 };
    setType(firstStream.code || 'UG');
    setDurationYears(firstStream.defaultDuration || 4);
    setIsModalOpen(true);
  };

  const openEditModal = (prog) => {
    const streams = reloadMasterStreams();
    setEditingId(prog.id);
    setDeptId(prog.departmentId || prog.dept_id || (departments[0]?.id || ''));
    setCode(prog.code);
    setName(prog.name);
    const progType = prog.type || 'UG';
    setType(progType);
    const matched = streams.find(s => s.code === progType || s.id === progType);
    setDurationYears(prog.durationYears || prog.duration_years || matched?.defaultDuration || 4);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setCode('');
    setName('');
    setType('UG');
  };

  const openPoModal = async (prog) => {
    setSelectedProgForPo(prog);
    setIsPoModalOpen(true);
    if (!prog.pos || prog.pos.length === 0) {
      setPoLoading(true);
      try {
        let pos = await obeService.getPos(prog.id);
        if (!pos || pos.length === 0) {
          // If empty, auto-seed standard accreditation outcomes for this program
          await obeService.seedStandardPos(prog.id);
          pos = await obeService.getPos(prog.id);
        }
        if (Array.isArray(pos) && pos.length > 0) {
          const mapped = pos.map(po => ({
            code: po.code,
            title: po.title || po.statement || po.code,
            desc: po.description || po.desc || po.title || ''
          }));
          setSelectedProgForPo(prev => prev ? { ...prev, pos: mapped } : prev);
          setPrograms(prev => prev.map(p => p.id === prog.id ? { ...p, pos: mapped } : p));
        }
      } catch (e) {
        console.warn('Failed to load POs:', e);
      } finally {
        setPoLoading(false);
      }
    }
  };

  const closePoModal = () => {
    setSelectedProgForPo(null);
    setIsPoModalOpen(false);
    setPoLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (!Number(durationYears) || Number(durationYears) < 1) {
      alert('Program duration must be at least 1 year.');
      return;
    }

    const selectedDeptId = deptId || departments[0]?.id;
    if (!selectedDeptId) {
      alert('An Academic Department is required before creating a degree program. Please add a department under Academics > Departments first.');
      return;
    }

    const deptObj = departments.find(d => d.id === selectedDeptId);
    const isEdit = Boolean(editingId);

    const confirmed = await confirm({
      title: isEdit ? 'Confirm Update Degree Program' : 'Confirm Create Degree Program',
      message: `${isEdit ? 'Save modifications for program' : 'Register new academic degree program'} "${code.trim()} - ${name.trim()}"?`,
      details: [
        `Program Code: ${code.trim()}`,
        `Program Title: ${name.trim()}`,
        `Department: ${deptObj?.name || 'Department'} (${deptObj?.code || ''})`,
        `Stream Type: ${type || 'UG'}`,
        `Duration: ${durationYears} Years (${Number(durationYears) * 2} Semesters)`
      ],
      confirmText: isEdit ? 'Yes, Update Program' : 'Yes, Create Program',
      variant: isEdit ? 'primary' : 'success',
      icon: isEdit ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-graduation-cap'
    });
    if (!confirmed) return;

    try {
      if (editingId) {
        await academicsService.updateProgram(editingId, {
          departmentId: selectedDeptId,
          code: code.trim(),
          name: name.trim(),
          type: type || 'UG',
          durationYears: Number(durationYears),
        });
      } else {
        await academicsService.createProgram({
          departmentId: selectedDeptId,
          code: code.trim(),
          name: name.trim(),
          type: type || 'UG',
          durationYears: Number(durationYears),
        });
      }
      await loadData();
      closeModal();
    } catch (err) {
      alert('Failed to save program: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id, progCode) => {
    const prog = programs.find(p => p.id === id);
    const confirmed = await confirm({
      title: 'Confirm Delete Degree Program',
      message: `Permanently delete degree program "${prog?.code || progCode || 'Program'}"?`,
      details: 'This will remove all associated batches, student cohorts, subjects curriculum, and class schedules for this degree.',
      confirmText: 'Yes, Delete Program',
      variant: 'danger',
      icon: 'fa-solid fa-trash-can'
    });
    if (!confirmed) return;

    try {
      await academicsService.deleteProgram(id);
      await loadData();
    } catch (err) {
      alert('Failed to delete program: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes unilmsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes unilmsSlideRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .drawer-overlay:not(.active) {
          display: none !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }
      ` }} />
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
              <i className="fa-solid fa-certificate"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Degree Programs &amp; Majors
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Manage undergraduate &amp; postgraduate degrees, OBE program outcomes (POs) &amp; durations
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
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add Program</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Program Name</th>
                <th>Department</th>
                <th>Duration</th>
                <th>Accredited Outcomes (OBE)</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedPrograms.length > 0 ? (
                paginatedPrograms.map((prog) => (
                  <tr key={prog.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-primary">{prog.code}</span>
                        {prog.type && (
                          <span style={{ fontSize: '10.5px', background: '#EEF2FF', color: '#4F46E5', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                            {prog.type}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{prog.name}</strong>
                    </td>
                    <td>{prog.dept_name}</td>
                    <td>{prog.duration_years} Years</td>
                    <td>
                      <button
                        type="button"
                        className="badge"
                        style={{
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#059669',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          fontWeight: '700',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                        onClick={() => openPoModal(prog)}
                      >
                        <i className="fa-solid fa-award"></i> {prog.pos?.length || (prog.programOutcomes?.length ?? 14)} Outcomes (POs + PSOs)
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons" style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openEditModal(prog)}
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => handleDelete(prog.id)}
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
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        <i className="fa-solid fa-graduation-cap"></i>
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#334155' }}>
                        No Degree Programs Configured Yet
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', maxWidth: '380px', textAlign: 'center' }}>
                        Configure undergraduate, postgraduate or professional degrees (e.g. B.Pharm, B.Tech, Pharm.D).
                      </div>
                      <button
                        type="button"
                        onClick={openAddModal}
                        className="btn btn-sm btn-primary"
                        style={{ marginTop: '4px', fontSize: '12px', padding: '6px 14px', borderRadius: '6px' }}
                      >
                        <i className="fa-solid fa-plus me-1"></i> Add First Program
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
            itemName="degree programs"
          />
        </div>
      </section>

      {/* PO Modal Drawer */}
      {isPoModalOpen && (
        <div
          className="drawer-overlay active"
          id="poModal"
          onClick={(e) => {
            if (e.target.id === 'poModal') closePoModal();
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
              width: 'min(640px, 100vw)',
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
                  <i className="fa-solid fa-bullseye"></i>
                </div>
                <div>
                  <h3 id="po_modal_title" style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
                    Program Outcomes (POs / PSOs)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                    {selectedProgForPo?.name} &bull; NBA Tier-1 Framework
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={closePoModal}
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
            <div
              className="drawer-body"
              id="po_modal_body"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1,
                overflowY: 'auto',
              }}
            >
              {poLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '28px', color: '#0284c7', marginBottom: '12px', display: 'block' }}></i>
                  Loading accredited Program Outcomes (POs / PSOs)...
                </div>
              ) : selectedProgForPo?.pos?.length > 0 ? (
                selectedProgForPo.pos.map((po, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-main, #f8fafc)',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="badge badge-primary">{po.code}</span>
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>{po.title}</strong>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                      {po.desc || po.description}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <i className="fa-solid fa-clipboard-list" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', opacity: 0.5 }}></i>
                  No program outcomes mapped yet for this program.
                </div>
              )}
            </div>
            <div
              className="drawer-footer"
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end',
                flexShrink: 0,
              }}
            >
              <button type="button" className="btn btn-outline" onClick={closePoModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal Drawer (Right-Side Slide-Over) */}
      {isModalOpen && (
        <div
          className="drawer-overlay active"
          id="addModal"
          onClick={(e) => {
            if (e.target.id === 'addModal') closeModal();
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
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
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
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                  <div>
                    <h3 id="modal_title" style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
                      {editingId ? 'Edit Program' : 'Add Degree Program'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      Configure degree curriculum and affiliated department
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
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
                    Department <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {departments.length === 0 ? (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#991B1B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginBottom: '4px' }}>
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <span>No Departments Found</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#7F1D1D' }}>
                        An academic department (e.g. Pharmacy, Computer Science) must exist before creating degree programs.
                      </p>
                      <div style={{ marginTop: '8px' }}>
                        <Link
                          to="/unilms/org/academics/departments"
                          onClick={closeModal}
                          className="btn btn-sm"
                          style={{ background: '#DC2626', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <i className="fa-solid fa-plus"></i> Add First Department
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <select
                      name="dept_id"
                      id="form_dept_id"
                      className="form-control"
                      required
                      value={deptId}
                      onChange={(e) => setDeptId(e.target.value)}
                    >
                      <option value="" disabled>-- Select Department --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Program Code <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    id="form_code"
                    className="form-control"
                    required
                    placeholder="e.g. BPHARM, BTECH-CSE, BSC, MBA"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Degree Stream / Level <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="type"
                    id="form_type"
                    className="form-control"
                    value={type}
                    onChange={(e) => {
                      const val = e.target.value;
                      setType(val);
                      const matched = degreeStreams.find(s => s.code === val || s.id === val);
                      if (matched && matched.defaultDuration) {
                        setDurationYears(matched.defaultDuration);
                      }
                    }}
                  >
                    {degreeStreams.filter(s => s.active !== false).map((stream) => (
                      <option key={stream.id || stream.code} value={stream.code}>
                        {stream.name} {stream.examples ? `— ${stream.examples}` : ''} ({stream.defaultDuration} Years)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Program Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="form_name"
                    className="form-control"
                    required
                    placeholder="e.g. Bachelor of Pharmacy (B.Pharm) or B.Tech in CSE"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Duration (Years) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="duration_years"
                    id="form_duration_years"
                    className="form-control"
                    required
                    min="1"
                    max="10"
                    value={durationYears}
                    onChange={(e) => setDurationYears(e.target.value)}
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
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: '700',
                  }}
                >
                  {editingId ? 'Update Program' : 'Save Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgAcademicsPrograms;