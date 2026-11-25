import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import academicsService from '../../../services/academics.service';

const OrgAcademicsDepartments = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [departments, setDepartments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await academicsService.getDepartments();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Backend fetch failed for departments:', e.message);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedDepartments,
    totalItems
  } = useTablePagination(departments, 10);

  const openAddModal = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingId(dept.id);
    setCode(dept.code);
    setName(dept.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setCode('');
    setName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const isEdit = Boolean(editingId);
    const confirmed = await confirm({
      title: isEdit ? 'Confirm Update Department' : 'Confirm Create Academic Department',
      message: `${isEdit ? 'Save modifications for department' : 'Register new academic department'} "${code.trim().toUpperCase()} - ${name.trim()}"?`,
      details: [
        `Department Code: ${code.trim().toUpperCase()}`,
        `Department Name: ${name.trim()}`
      ],
      confirmText: isEdit ? 'Yes, Update Department' : 'Yes, Create Department',
      variant: isEdit ? 'primary' : 'success',
      icon: isEdit ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-building-columns'
    });
    if (!confirmed) return;

    try {
      if (editingId) {
        await academicsService.updateDepartment(editingId, { code: code.trim().toUpperCase(), name: name.trim() });
      } else {
        await academicsService.createDepartment({ code: code.trim().toUpperCase(), name: name.trim() });
      }
      await loadDepartments();
      closeModal();
    } catch (err) {
      alert('Operation failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id, deptCode, deptName) => {
    const dept = departments.find(d => d.id === id);
    const confirmed = await confirm({
      title: 'Confirm Delete Academic Department',
      message: `Permanently delete department "${dept?.code || deptCode || 'Department'}"?`,
      details: 'Deleting this department removes its degree programs, cohorts, sections, faculty allocations, and timetable grids.',
      confirmText: 'Yes, Delete Department',
      variant: 'danger',
      icon: 'fa-solid fa-trash-can'
    });
    if (!confirmed) return;

    try {
      await academicsService.deleteDepartment(id);
      await loadDepartments();
    } catch (err) {
      alert('Failed to delete department: ' + (err.response?.data?.message || err.message));
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
              <i className="fa-solid fa-building"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Academic Departments
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Manage college schools, academic divisions, HOD chairs &amp; faculty clusters
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
              <span>Add Department</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Code</th>
                <th>Department Name</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={3} rows={pageSize || 5} />
              ) : paginatedDepartments.length > 0 ? (
                paginatedDepartments.map((dept) => (
                  <tr key={dept.id}>
                    <td>
                      <span className="badge badge-primary">{dept.code}</span>
                    </td>
                    <td>
                      <strong>{dept.name}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons" style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openEditModal(dept)}
                          title="Edit Department"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => handleDelete(dept.id)}
                          title="Delete Department"
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
                  <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No departments found.
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
            itemName="departments"
          />
        </div>
      </section>

      {/* Modal Drawer */}
      <div
        className={`drawer-overlay ${isModalOpen ? 'active' : ''}`}
        id="addModal"
        style={{ display: isModalOpen ? 'flex' : 'none' }}
      >
        <div className="drawer-content">
          <form onSubmit={handleSubmit}>
            <div className="drawer-header">
              <h3 id="modal_title">{editingId ? 'Edit Department' : 'Add Department'}</h3>
              <button type="button" className="btn-close" onClick={closeModal}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="drawer-body">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>Department Code</label>
                <input
                  type="text"
                  name="code"
                  id="form_code"
                  className="form-control"
                  required
                  placeholder="e.g. CS"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>Department Name</label>
                <input
                  type="text"
                  name="name"
                  id="form_name"
                  className="form-control"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div className="drawer-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-outline" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Department' : 'Save Department'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default OrgAcademicsDepartments;