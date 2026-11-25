import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import libraryService from '../../../services/library.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgLibraryCategories = () => {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const loadCategories = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const data = await libraryService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Failed to load library categories:', e);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadCategories(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [categories, searchQuery]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredCategories, 10);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingCategory) {
        await libraryService.updateCategory(editingCategory.id, formData);
      } else {
        await libraryService.createCategory(formData);
      }
      handleCloseModal();
      await loadCategories();
    } catch (err) {
      alert('Error saving category: ' + err.message);
    }
  };

  const handleDelete = (cat) => {
    confirmAction({
      title: 'Delete Classification Section',
      message: `Are you sure you want to delete category "${cat.name}"? Books mapped to this category may lose their section binding.`,
      confirmText: 'Delete Category',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await libraryService.deleteCategory(cat.id);
          await loadCategories();
        } catch (err) {
          alert('Failed to delete category: ' + err.message);
        }
      }
    });
  };

  return (
    <>
      <ConfirmModal />
      <section className="view-section active">
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
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Library Classification Sections
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: isSyncing ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: isSyncing ? '#6366F1' : '#10B981',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <i className={`fa-solid ${isSyncing ? 'fa-arrows-rotate fa-spin' : 'fa-circle-check'}`} style={{ fontSize: '9px' }}></i>
                  {isSyncing ? 'Syncing...' : 'Live Sync'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Manage DDC / Subject Classification categories for library shelf racks &bull; Last Synced: {lastSyncTime}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/unilms/org/library/books" className="btn btn-outline" style={{ textDecoration: 'none', padding: '10px 16px', borderRadius: '10px' }}>
              <i className="fa-solid fa-arrow-left me-1"></i> Back to Books
            </Link>
            <button
              onClick={handleOpenAddModal}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-plus"></i> Add Category
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
            <input
              type="text"
              placeholder="Search category name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '42px', borderRadius: '10px' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Section / Category Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Description</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>Cataloged Titles</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={4} rows={pageSize || 5} />
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map((cat) => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1E293B' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                          {cat.name}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>
                        {cat.description || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ background: '#F1F5F9', padding: '3px 10px', borderRadius: '12px', fontWeight: '700', color: '#334155' }}>
                          {cat._count?.books ?? 0} Titles
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEditModal(cat)}
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px' }}
                            title="Edit Category"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', color: '#DC2626', borderColor: '#FEE2E2' }}
                            title="Delete Category"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      No categories found. Click 'Add Category' to create classification sections.
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
            itemName="categories"
          />
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                  {editingCategory ? 'Edit Category' : 'New Classification Category'}
                </h3>
                <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Category / Subject Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Artificial Intelligence & Robotics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Scope &amp; Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of subjects and literature encompassed..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={handleCloseModal} className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#10B981', color: '#fff', padding: '8px 18px', borderRadius: '8px', border: 'none', fontWeight: '700' }}>
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgLibraryCategories;
