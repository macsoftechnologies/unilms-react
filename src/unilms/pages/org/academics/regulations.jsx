import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';

const OrgAcademicsRegulations = () => {
  const location = useLocation();

  // URL Hash synchronization (#active | #archived)
  const getTabFromHash = () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    return hash === 'archived' ? 'archived' : 'active';
  };

  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [totalCredits, setTotalCredits] = useState(160);
  const [passPercentage, setPassPercentage] = useState(40.0);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Sync state if user clicks browser back/forward or hash changes
  useEffect(() => {
    const currentHashTab = getTabFromHash();
    if (currentHashTab !== activeTab) {
      setActiveTab(currentHashTab);
    }
  }, [location.hash]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const loadRegulations = async () => {
    setLoading(true);
    try {
      const data = await academicsService.getRegulations();
      if (Array.isArray(data)) {
        setRegulations(data.map(r => ({
          ...r,
          is_active: r.status === 'active' ? 1 : 0,
          start_year: r.startYear,
          total_credits: r.totalCredits,
          pass_percentage: Number(r.passPercentage || 40),
        })));
      } else {
        setRegulations([]);
      }
    } catch (err) {
      console.error('Failed to load regulations:', err);
      setRegulations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegulations();
  }, []);

  const activeCount = useMemo(() => regulations.filter((r) => Boolean(r.is_active)).length, [regulations]);
  const archivedCount = useMemo(() => regulations.filter((r) => !r.is_active).length, [regulations]);

  const filteredRegulations = useMemo(() => {
    if (activeTab === 'archived') return regulations.filter((r) => !r.is_active);
    return regulations.filter((r) => Boolean(r.is_active));
  }, [regulations, activeTab]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredRegulations, 10);

  useEffect(() => {
    // Reset to page 1 on tab switch
    setCurrentPage(1);
  }, [activeTab]);

  const openAddModal = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setStartYear(new Date().getFullYear());
    setTotalCredits(160);
    setPassPercentage(40.0);
    setDescription('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (reg) => {
    setEditingId(reg.id);
    setCode(reg.code || '');
    setName(reg.name);
    setStartYear(reg.start_year ?? reg.startYear);
    setTotalCredits(reg.total_credits ?? reg.totalCredits);
    setPassPercentage(reg.pass_percentage ?? reg.passPercentage);
    setDescription(reg.description || '');
    setIsActive(Boolean(reg.is_active));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const toggleActiveStatus = async (id) => {
    const reg = regulations.find(r => r.id === id);
    if (!reg) return;
    const newStatus = reg.is_active ? 'archived' : 'active';
    try {
      await academicsService.updateRegulation(id, { status: newStatus });
      await loadRegulations();
    } catch (e) {
      alert('Failed to update status: ' + e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (Number(passPercentage) < 0 || Number(passPercentage) > 100) {
      alert('Pass percentage must be between 0% and 100%.');
      return;
    }
    if (Number(totalCredits) < 1) {
      alert('Total credits must be at least 1.');
      return;
    }

    setSubmitting(true);
    try {
      const derivedCode = code.trim().toUpperCase() || name.trim().split(' ')[0].toUpperCase();
      const payload = {
        code: derivedCode,
        name: name.trim(),
        startYear: Number(startYear),
        totalCredits: Number(totalCredits),
        passPercentage: Number(passPercentage),
        description: description.trim() || 'Standard statutory curriculum policy.',
        status: isActive ? 'active' : 'archived',
      };

      if (editingId) {
        await academicsService.updateRegulation(editingId, payload);
      } else {
        await academicsService.createRegulation(payload);
      }

      await loadRegulations();
      closeModal();
    } catch (err) {
      alert(err.message || 'Error saving regulation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this academic regulation? Note: Deleting is only recommended if no batches or students are linked.')) {
      try {
        await academicsService.deleteRegulation(id);
        await loadRegulations();
      } catch (err) {
        alert(err.message || 'Error deleting regulation');
      }
    }
  };

  return (
    <>
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
              <i className="fa-solid fa-scroll"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Academic Regulations &amp; Policies
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Curriculum regulations (e.g. R20, R23), minimum graduation credits &amp; grading standards
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={openAddModal} 
              style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)', whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add Regulation</span>
            </button>
            <Link 
              to="/unilms/org/academics/dashboard" 
              className="btn btn-outline"
              style={{ background: 'var(--card-bg, #fff)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Academics Home</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation Ribbon for Active vs Archived Regulations */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            paddingBottom: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => handleTabChange('active')}
            style={{
              border: 'none',
              background: activeTab === 'active' ? '#0284C7' : 'transparent',
              color: activeTab === 'active' ? '#ffffff' : '#64748b',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <i className="fa-solid fa-circle-check" style={{ fontSize: '12px' }}></i>
            <span>Active Regulations</span>
            <span
              style={{
                background: activeTab === 'active' ? 'rgba(255, 255, 255, 0.25)' : '#e2e8f0',
                color: activeTab === 'active' ? '#ffffff' : '#475569',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '800',
              }}
            >
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('archived')}
            style={{
              border: 'none',
              background: activeTab === 'archived' ? '#64748b' : 'transparent',
              color: activeTab === 'archived' ? '#ffffff' : '#64748b',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <i className="fa-solid fa-box-archive" style={{ fontSize: '12px' }}></i>
            <span>Archived (Closed Batches)</span>
            <span
              style={{
                background: activeTab === 'archived' ? 'rgba(255, 255, 255, 0.25)' : '#e2e8f0',
                color: activeTab === 'archived' ? '#ffffff' : '#475569',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '800',
              }}
            >
              {archivedCount}
            </span>
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Regulation Title / Code</th>
                <th>Effective Year</th>
                <th>Graduation Credits</th>
                <th>Minimum Pass %</th>
                <th>Policy Summary</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 4} />
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.name}</strong>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(79, 70, 229, 0.1)',
                          color: '#4f46e5',
                          fontWeight: '700',
                        }}
                      >
                        {r.start_year}
                      </span>
                    </td>
                    <td>
                      <strong>{r.total_credits} Credits</strong>
                    </td>
                    <td>{r.pass_percentage}%</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '300px' }}>
                      {r.description}
                    </td>
                    <td>
                      <span
                        className={`badge ${r.is_active ? 'badge-success' : 'badge-warning'}`}
                        style={{ fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => toggleActiveStatus(r.id)}
                        title="Click to toggle Active / Archived status"
                      >
                        <i className={`fa-solid ${r.is_active ? 'fa-circle-check' : 'fa-box-archive'} me-1`}></i>
                        {r.is_active ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn-icon text-primary"
                          onClick={() => openEditModal(r)}
                          title="Edit Regulation"
                          style={{
                            border: 'none',
                            background: 'rgba(2, 132, 199, 0.08)',
                            color: '#0284C7',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => handleDelete(r.id)}
                          title="Delete Regulation"
                          style={{
                            border: 'none',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <i
                        className={`fa-solid ${
                          activeTab === 'archived'
                            ? 'fa-box-archive'
                            : activeTab === 'active'
                            ? 'fa-circle-check'
                            : 'fa-scroll'
                        }`}
                        style={{ fontSize: '28px', opacity: 0.4, marginBottom: '4px' }}
                      ></i>
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                        {activeTab === 'archived'
                          ? 'No Archived Regulations'
                          : activeTab === 'active'
                          ? 'No Active Regulations Found'
                          : 'No Academic Regulations Defined'}
                      </strong>
                      <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                        {activeTab === 'archived'
                          ? 'When older batch curriculums are closed or retired, they appear safely archived here.'
                          : activeTab === 'active'
                          ? 'Click "+ Add Regulation" to configure an active curriculum policy for current students.'
                          : 'Click "+ Add Regulation" to begin defining autonomous institutional policies.'}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="regulations"
        />
      </section>

      {/* Modal Drawer (Right-Side Slide-Over) */}
      {isModalOpen && (
        <div
          className="drawer-overlay active"
          id="regModal"
          onClick={(e) => {
            if (e.target.id === 'regModal') closeModal();
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
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className="fa-solid fa-scroll"></i>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
                      {editingId ? 'Edit Academic Regulation' : 'Add Academic Regulation'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      {editingId ? 'Modify curriculum parameters & active status' : 'Configure curriculum structure, grading criteria & credit caps'}
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
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                      Code <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      className="form-control"
                      required
                      placeholder="e.g. R24, R26, CBCS"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                      Regulation Title <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      required
                      placeholder="e.g. Curriculum & Evaluation Regulation 2026"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                      Effective Start Year <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      name="start_year"
                      className="form-control"
                      required
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                      Graduation Credits <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      name="total_credits"
                      className="form-control"
                      required
                      value={totalCredits}
                      onChange={(e) => setTotalCredits(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Passing Threshold (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="pass_percentage"
                    className="form-control"
                    value={passPercentage}
                    onChange={(e) => setPassPercentage(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Regulation Summary &amp; Details
                  </label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="3"
                    placeholder="Overview of grading scales, promotion rules, detention criteria..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    Set as Active Curriculum Policy
                  </label>
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
                    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: '700',
                  }}
                >
                  {editingId ? 'Update Regulation' : 'Save Regulation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgAcademicsRegulations;