import { Link } from 'react-router-dom';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import libraryService from '../../../services/library.service';

const OrgLibrarySuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    status: 'Active'
  });

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const data = await libraryService.getSuppliers();
      setSuppliers(Array.isArray(data) ? data : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Failed to load library suppliers:', e);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.toLowerCase();
      const name = (s.name || '').toLowerCase();
      const contact = (s.contactPerson || s.contact_person || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const phone = (s.phone || '');
      const gstin = (s.gstin || '').toLowerCase();
      return (
        name.includes(q) ||
        contact.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        gstin.includes(q)
      );
    });
  }, [suppliers, searchQuery]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedSuppliers,
    totalItems
  } = useTablePagination(filteredSuppliers, 10);

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sup) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name || '',
      contactPerson: sup.contactPerson || sup.contact_person || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      gstin: sup.gstin || '',
      status: sup.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Supplier / Publisher Name is required.');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        gstin: formData.gstin.trim(),
        status: formData.status
      };

      if (editingSupplier) {
        await libraryService.updateSupplier(editingSupplier.id, payload);
      } else {
        await libraryService.createSupplier(payload);
      }
      handleCloseModal();
      await loadData();
    } catch (err) {
      alert('Failed to save supplier. Please check connection and try again.');
      console.error(err);
    }
  };

  const handleDelete = (sup) => {
    confirmAction({
      title: 'Delete Vendor / Supplier',
      message: `Are you sure you want to remove publisher "${sup.name}"? This action permanently removes vendor procurement records from the system.`,
      confirmText: 'Delete Vendor',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await libraryService.deleteSupplier(sup.id);
          await loadData();
        } catch (err) {
          alert('Failed to delete supplier: ' + (err.message || 'Server error'));
        }
      }
    });
  };

  return (
    <div className="library-suppliers-view">
      {/* Top Header Card matching Reference UI */}
      <div
        style={{
          background: 'var(--card-bg, #fff)',
          border: '1px solid var(--border-color, #e2e8f0)',
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
            <i className="fa-solid fa-truck-ramp-box"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Publishers & Book Distributors
              </h2>
              {isSyncing && (
                <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="fa-solid fa-arrows-rotate fa-spin"></i> Syncing...
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Directory of registered book distributors, academic publishing houses, and procurement vendors &bull; Synced at {lastSyncTime}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAddModal}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add Supplier</span>
          </button>
          <Link
            to="/unilms/org/library"
            className="btn btn-outline"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none',
              border: '1px solid var(--border-color, #e2e8f0)',
              background: 'var(--card-bg, #fff)',
              color: 'var(--text-primary, #334155)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-book-open" style={{ color: '#059669' }}></i>
            <span>Library Overview</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        background: 'var(--card-bg, #fff)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
          <input 
            type="text"
            placeholder="Search by vendor name, contact person, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{
              paddingLeft: '36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              width: '100%'
            }}
          />
        </div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          Active vendors: <strong>{suppliers.length}</strong> registered partners
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--card-bg, #fff)',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Publisher / Vendor Name</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Person</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GSTIN / Tax ID</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedSuppliers.length > 0 ? (
                paginatedSuppliers.map((sup) => (
                  <tr key={sup.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <strong style={{ color: '#1E293B', fontSize: '14px' }}>{sup.name}</strong>
                      {sup.address && (
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', maxWidth: '300px' }}>
                          <i className="fa-solid fa-location-dot me-1" style={{ color: '#94a3b8' }}></i>
                          {sup.address}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13.5px', color: '#334155', fontWeight: '600' }}>
                      {sup.contactPerson || sup.contact_person || '—'}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13.5px', color: '#475569' }}>
                      {sup.phone ? (
                        <span><i className="fa-solid fa-phone me-1" style={{ color: '#94a3b8' }}></i>{sup.phone}</span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13.5px', color: '#475569' }}>
                      {sup.email ? (
                        <span style={{ color: '#2563eb' }}>
                          <i className="fa-regular fa-envelope me-1" style={{ color: '#94a3b8' }}></i>
                          {sup.email}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>
                      {sup.gstin || '—'}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(sup)}
                          className="btn btn-outline"
                          style={{
                            padding: '5px 12px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#334155',
                            borderColor: '#cbd5e1'
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sup)}
                          className="btn btn-outline"
                          style={{
                            padding: '5px 10px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#ef4444',
                            borderColor: '#fca5a5'
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
                  <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    <i className="fa-solid fa-building-circle-xmark" style={{ fontSize: '32px', color: '#cbd5e1', display: 'block', marginBottom: '10px' }}></i>
                    No suppliers or publishers found.
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
          onChange={setCurrentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="suppliers"
        />
      </div>

      {/* Modal matching UI */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--card-bg, #fff)',
            borderRadius: '14px',
            width: '520px',
            maxWidth: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                  {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ padding: '24px' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Publisher / Vendor Name *
                  </label>
                  <input 
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Pearson India Education Services"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Contact Person
                  </label>
                  <input 
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Amit Deshmukh"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Phone
                    </label>
                    <input 
                      type="tel"
                      pattern="[0-9]{10}"
                      maxLength="10"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Email
                    </label>
                    <input 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-control"
                      placeholder="e.g. sales@pearson.co.in"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    GSTIN / Tax ID
                  </label>
                  <input 
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="form-control"
                    placeholder="e.g. 27AABCP1234F1Z5"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Office Address
                  </label>
                  <textarea 
                    name="address"
                    rows="2"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="form-control"
                    placeholder="e.g. 7th Floor, Knowledge City, Pune - 411001"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  ></textarea>
                </div>
              </div>

              <div style={{
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  {editingSupplier ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      <ConfirmModal />
    </div>
  );
};

export default OrgLibrarySuppliers;
