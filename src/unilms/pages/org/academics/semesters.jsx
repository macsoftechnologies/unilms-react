import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';

const OrgAcademicsSemesters = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sequence, setSequence] = useState(1);
  const [name, setName] = useState('');

  const loadSemesters = async () => {
    setLoading(true);
    try {
      const data = await academicsService.getSemesters();
      setSemesters(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Backend fetch failed for semesters:', e.message);
      setSemesters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSemesters();
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(semesters, 10);

  const openAddModal = () => {
    setEditingId(null);
    setSequence(semesters.length + 1);
    setName(`Semester ${semesters.length + 1}`);
    setIsModalOpen(true);
  };

  const openEditModal = (sem) => {
    setEditingId(sem.id);
    setSequence(sem.sequence);
    setName(sem.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingId) {
        await academicsService.updateSemester(editingId, {
          sequence: Number(sequence),
          name: name.trim(),
        });
      } else {
        await academicsService.createSemester({
          sequence: Number(sequence),
          name: name.trim(),
        });
      }
      await loadSemesters();
      closeModal();
    } catch (err) {
      alert('Failed to save semester: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this semester?')) {
      try {
        await academicsService.deleteSemester(id);
        await loadSemesters();
      } catch (err) {
        alert('Failed to delete semester: ' + (err.response?.data?.message || err.message));
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
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Academic Semesters
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Define academic term numbers, chronological progression orders &amp; curriculum structures
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
              <span>Add Semester</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Sequence</th>
                <th>Semester Term</th>
                <th style={{ textAlign: 'center', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={3} rows={pageSize || 6} />
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((sem) => (
                  <tr key={sem.id}>
                    <td>
                      <span className="badge badge-primary">Term {sem.sequence}</span>
                    </td>
                    <td>
                      <strong>{sem.name}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons" style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openEditModal(sem)}
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => handleDelete(sem.id)}
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
                  <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No semesters found.
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
          itemName="semesters"
        />
      </section>

      {/* Modal Drawer (Right-Side Slide-Over) */}
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
                    <i className="fa-solid fa-layer-group"></i>
                  </div>
                  <div>
                    <h3 id="modal_title" style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
                      {editingId ? 'Edit Semester' : 'Add Semester'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      Define academic progression terms and ordering sequence
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
                    Sequence Number (For Sorting) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="sequence"
                    id="form_sequence"
                    className="form-control"
                    required
                    min="1"
                    max="20"
                    placeholder="e.g. 1"
                    value={sequence}
                    onChange={(e) => setSequence(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Semester Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="form_name"
                    className="form-control"
                    required
                    placeholder="e.g. Semester 1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                  {editingId ? 'Update Semester' : 'Save Semester'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgAcademicsSemesters;