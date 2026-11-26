import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import admissionsService from '../../../services/admissions.service';

const OrgAdmissionsCategories = () => {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedCategories,
    totalItems
  } = useTablePagination(categories, 10);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [quota, setQuota] = useState('');
  const [description, setDescription] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await admissionsService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to load categories:', e);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setCode(cat.code);
    setQuota((cat.quota_percentage || 0).toString());
    setDescription(cat.description || '');
  };

  const handleReset = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setQuota('');
    setDescription('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingId) {
        await admissionsService.updateCategory(editingId, {
          name: name.trim(),
          code: code.trim(),
          quota_percentage: parseFloat(quota) || 0,
          description: description.trim()
        });
        showToast(`Category "${name}" updated successfully!`);
      } else {
        await admissionsService.createCategory({
          name: name.trim(),
          code: code.trim() || 'CAT-' + (categories.length + 1),
          quota_percentage: parseFloat(quota) || 0,
          description: description.trim()
        });
        showToast(`Category "${name}" created successfully!`);
      }
      handleReset();
      await loadCategories();
    } catch (err) {
      alert('Failed to save category: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    const target = categories.find((c) => c.id === id);
    if (window.confirm(`Are you sure you want to delete category "${target?.name}"?`)) {
      try {
        await admissionsService.deleteCategory(id);
        showToast('Category deleted successfully.');
        if (editingId === id) handleReset();
        await loadCategories();
      } catch (err) {
        alert('Failed to delete category: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const totalSeatsRepresented = categories.reduce((acc, c) => acc + (Number(c.enrolled_count) || 0), 0);
  const totalReservedQuota = categories
    .filter(c => !['GEN', 'GENERAL', 'OPEN'].includes((c.code || '').toUpperCase()))
    .reduce((acc, c) => acc + (Number(c.quota_percentage) || 0), 0);

  return (
    <div className="categories-page-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 10000,
            background: '#10B981',
            color: '#fff',
            padding: '12px 22px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '600',
            animation: 'modalFadeIn 0.2s ease'
          }}
        >
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      <section className="view-section active">
        {/* View Header */}
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
                background: 'linear-gradient(135deg, #059669, #0D9488)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
              }}
            >
              <i className="fa-solid fa-tags"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Categories &amp; Reservation Quotas
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Configure social reservation brackets, statutory percentage allocations &amp; certificate requirements
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
            to="/unilms/org/admissions/college_strength"
            className="btn btn-outline"
            style={{
              background: 'var(--card-bg, #fff)',
              color: 'var(--text-primary)',
              fontWeight: '700',
              border: '1px solid var(--border-color)',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              textDecoration: 'none'
            }}
          >
            <i className="fa-solid fa-chart-column" style={{ color: '#0D9488' }}></i>
            <span>College Strength</span>
          </Link>
          </div>
        </div>

        {/* Statistical KPI Cards - Modern Compact Reference Cards */}
        <div className="faculty-kpi-grid">
          {/* Card 1: Total Categories */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
              <i className="fa-solid fa-tags"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Total Categories</div>
              <div className="faculty-metric-value" style={{ color: '#7C3AED' }}>{categories.length} Brackets</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Statutory quotas configured</span>
              </div>
            </div>
          </div>

          {/* Card 2: Candidates Enrolled */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <i className="fa-solid fa-users-viewfinder"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Candidates Enrolled</div>
              <div className="faculty-metric-value" style={{ color: '#059669' }}>{totalSeatsRepresented}</div>
              <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>Verified admission intakes</span>
              </div>
            </div>
          </div>

          {/* Card 3: Constitutional Quota */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' }}>
              <i className="fa-solid fa-scale-balanced"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Reserved Quota</div>
              <div className="faculty-metric-value" style={{ color: '#2563EB' }}>{totalReservedQuota > 0 ? `${totalReservedQuota.toFixed(1)}%` : '0.0%'}</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Central &amp; state mandates</span>
              </div>
            </div>
          </div>

          {/* Card 4: Scholarship Verification */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <i className="fa-solid fa-stamp"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Verification</div>
              <div className="faculty-metric-value" style={{ color: '#D97706' }}>100% Digital</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>National Portal linked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Split Grid: Add/Edit Form + Categories Table */}
        <div className="admissions-split-grid">
          
          {/* Form Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={editingId ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-plus'}></i>
                {editingId ? 'Edit Category' : 'Add New Category'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>
                  Category Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control"
                  required
                  placeholder="e.g. OBC (Non-Creamy Layer)"
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1.5px solid #E5E7EB', padding: '0 12px', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>
                    Code / Abbr
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="form-control"
                    placeholder="e.g. OBC"
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1.5px solid #E5E7EB', padding: '0 12px', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>
                    Quota %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={quota}
                    onChange={(e) => setQuota(e.target.value)}
                    className="form-control"
                    placeholder="e.g. 27"
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1.5px solid #E5E7EB', padding: '0 12px', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>
                  Verification Rules / Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-control"
                  rows="3"
                  placeholder="Certificate guidelines or authority requirements..."
                  style={{ width: '100%', borderRadius: '8px', border: '1.5px solid #E5E7EB', padding: '10px 12px', fontSize: '13px', boxSizing: 'border-box' }}
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#7C3AED',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(124, 58, 237, 0.3)'
                }}
              >
                <i className="fa-solid fa-floppy-disk me-1"></i>
                {editingId ? 'Update Category' : 'Save Category'}
              </button>
            </form>
          </div>

          {/* Table Card */}
          <div className="table-container" style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-color)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category Name</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quota %</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enrolled Count</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Guidelines</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={5} rows={pageSize || 5} />
                ) : paginatedCategories.length > 0 ? (
                  paginatedCategories.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <strong style={{ color: '#1E293B', fontSize: '14px' }}>{c.name}</strong>
                        <div style={{ color: '#7C3AED', fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>Code: {c.code}</div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12.5px' }}>
                          {c.quota_percentage}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontWeight: '600', color: '#10B981' }}>
                        {c.enrolled_count} Students
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '12.5px', color: '#64748B', maxWidth: '280px' }}>
                        {c.description}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleEdit(c)}
                            className="btn btn-sm btn-outline"
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              background: '#FFFFFF',
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fa-solid fa-pen"></i> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            style={{
                              padding: '5px 8px',
                              fontSize: '12px',
                              borderRadius: '6px',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              background: 'rgba(239, 68, 68, 0.08)',
                              color: '#EF4444',
                              cursor: 'pointer'
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
                    <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No categories found.
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
              itemName="admission categories"
            />
          </div>

        </div>
      </section>
    </div>
  );
};

export default OrgAdmissionsCategories;