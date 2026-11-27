import { Link } from 'react-router-dom';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import libraryService from '../../../services/library.service';

const OrgLibraryStock = () => {
  const [stockList, setStockList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    auditorName: 'Dr. Ramesh Iyer (Head Librarian)',
    totalPhysical: 60,
    verifiedCount: 58,
    missingCount: 2,
    damagedCount: 0,
    status: 'Completed',
    remarks: 'Rack CS-01 Annual Audit'
  });

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const data = await libraryService.getStockAudits();
      setStockList(Array.isArray(data) ? data : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Failed to load library stock audits from PostgreSQL:', e);
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

  const filteredStock = useMemo(() => {
    return stockList.filter((s) => {
      const q = searchQuery.toLowerCase();
      const auditor = (s.auditorName || '').toLowerCase();
      const remarks = (s.remarks || '').toLowerCase();
      const status = (s.status || '').toLowerCase();
      return auditor.includes(q) || remarks.includes(q) || status.includes(q);
    });
  }, [stockList, searchQuery]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedStock,
    totalItems
  } = useTablePagination(filteredStock, 10);

  const handleOpenAddModal = () => {
    setEditingStock(null);
    setFormData({
      auditorName: 'Dr. Ramesh Iyer (Head Librarian)',
      totalPhysical: 50,
      verifiedCount: 50,
      missingCount: 0,
      damagedCount: 0,
      status: 'Completed',
      remarks: 'Rack CS-02 Annual Physical Audit'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (stk) => {
    setEditingStock(stk);
    setFormData({
      auditorName: stk.auditorName || '',
      totalPhysical: Number(stk.totalPhysical) || 0,
      verifiedCount: Number(stk.verifiedCount) || 0,
      missingCount: Number(stk.missingCount) || 0,
      damagedCount: Number(stk.damagedCount) || 0,
      status: stk.status || 'Completed',
      remarks: stk.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStock(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.auditorName.trim()) {
      alert('Auditor Name is required.');
      return;
    }

    try {
      const payload = {
        auditorName: formData.auditorName.trim(),
        totalPhysical: Number(formData.totalPhysical) || 0,
        verifiedCount: Number(formData.verifiedCount) || 0,
        missingCount: Number(formData.missingCount) || 0,
        damagedCount: Number(formData.damagedCount) || 0,
        status: formData.status,
        remarks: formData.remarks?.trim() || ''
      };

      if (editingStock) {
        await libraryService.updateStockAudit(editingStock.id, payload);
      } else {
        await libraryService.createStockAudit(payload);
      }
      handleCloseModal();
      await loadData();
    } catch (err) {
      alert('Failed to save stock audit log: ' + (err.message || 'Server error'));
    }
  };

  const handleDelete = (stk) => {
    confirmAction({
      title: 'Delete Stock Audit Log',
      message: `Are you sure you want to delete this stock audit record by "${stk.auditorName}" (${stk.remarks || 'Stock Audit'})? This action cannot be undone.`,
      confirmText: 'Delete Audit',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await libraryService.deleteStockAudit(stk.id);
          await loadData();
        } catch (err) {
          alert('Failed to delete stock audit: ' + (err.message || 'Server error'));
        }
      }
    });
  };

  return (
    <div className="library-stock-view">
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
            <i className="fa-solid fa-clipboard-check"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Physical Stock Verification & Audit
              </h2>
              {isSyncing && (
                <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="fa-solid fa-arrows-rotate fa-spin"></i> Syncing...
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Shelf-by-shelf audit of physical books, loss detection, and annual reconciliation records &bull; Realtime DB &bull; Synced at {lastSyncTime}
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
            <span>New Verification</span>
          </button>
          <Link
            to="/unilms/org/library/books"
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
            <i className="fa-solid fa-book" style={{ color: '#059669' }}></i>
            <span>Books Catalog</span>
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
            placeholder="Search by rack/scope, auditor, remarks..."
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
          Total audits: <strong>{stockList.length}</strong> physical inspections recorded
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
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Audit Target / Scope</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Auditor</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Physical</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified Count</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Discrepancies</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedStock.length > 0 ? (
                paginatedStock.map((v) => {
                  const hasDiscrepancy = Number(v.missingCount || 0) > 0 || Number(v.damagedCount || 0) > 0;
                  return (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: '#F1F5F9',
                          color: '#1E293B',
                          fontSize: '13px',
                          fontWeight: '700'
                        }}>
                          {v.remarks || 'General Stock Audit'}
                        </span>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                          Date: {v.auditDate ? new Date(v.auditDate).toLocaleDateString('en-GB') : '—'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13.5px', color: '#334155', fontWeight: '600' }}>
                        <i className="fa-solid fa-user-check me-1" style={{ color: '#059669' }}></i>
                        {v.auditorName}
                      </td>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13.5px', color: '#334155', fontWeight: '600' }}>
                        {v.totalPhysical} vols
                      </td>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <span style={{
                          fontSize: '13.5px',
                          fontWeight: '700',
                          color: hasDiscrepancy ? '#ea580c' : '#16a34a'
                        }}>
                          {v.verifiedCount} verified
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13px' }}>
                        {Number(v.missingCount || 0) > 0 ? (
                          <span style={{ color: '#dc2626', fontWeight: '700' }}>
                            <i className="fa-solid fa-triangle-exclamation me-1"></i>
                            {v.missingCount} Missing
                          </span>
                        ) : (
                          <span style={{ color: '#16a34a' }}>0 missing</span>
                        )}
                        {Number(v.damagedCount || 0) > 0 && (
                          <div style={{ fontSize: '11px', color: '#ea580c' }}>
                            {v.damagedCount} damaged
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: v.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                          color: v.status === 'Completed' ? '#166534' : '#92400e'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: v.status === 'Completed' ? '#16a34a' : '#d97706' }}></span>
                          {v.status || 'Completed'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(v)}
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
                            onClick={() => handleDelete(v)}
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    <i className="fa-solid fa-boxes-stacked" style={{ fontSize: '32px', color: '#cbd5e1', display: 'block', marginBottom: '10px' }}></i>
                    No stock verification records found.
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
          itemName="stock records"
        />
      </div>

      {/* Audit Modal */}
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
                  {editingStock ? 'Edit Stock Audit' : 'New Stock Verification Log'}
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
                    Audit Target / Rack / Scope *
                  </label>
                  <input 
                    type="text"
                    required
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="form-control"
                    placeholder="e.g. CS-RACK-01 Annual Audit"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Auditor / Staff In-Charge *
                  </label>
                  <input 
                    type="text"
                    required
                    value={formData.auditorName}
                    onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Dr. Ramesh Iyer (Head Librarian)"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Total Physical Count *
                    </label>
                    <input 
                      type="number"
                      min="0"
                      required
                      value={formData.totalPhysical}
                      onChange={(e) => {
                        const tot = Number(e.target.value);
                        setFormData({ 
                          ...formData, 
                          totalPhysical: tot,
                          missingCount: Math.max(0, tot - formData.verifiedCount)
                        });
                      }}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Verified Physical *
                    </label>
                    <input 
                      type="number"
                      min="0"
                      required
                      value={formData.verifiedCount}
                      onChange={(e) => {
                        const ver = Number(e.target.value);
                        setFormData({ 
                          ...formData, 
                          verifiedCount: ver,
                          missingCount: Math.max(0, formData.totalPhysical - ver)
                        });
                      }}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Missing Books Count
                    </label>
                    <input 
                      type="number"
                      min="0"
                      value={formData.missingCount}
                      onChange={(e) => setFormData({ ...formData, missingCount: Number(e.target.value) })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Damaged Books Count
                    </label>
                    <input 
                      type="number"
                      min="0"
                      value={formData.damagedCount}
                      onChange={(e) => setFormData({ ...formData, damagedCount: Number(e.target.value) })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Audit Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Discrepancy Found">Discrepancy Found</option>
                  </select>
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
                  {editingStock ? 'Update Audit' : 'Save Audit'}
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

export default OrgLibraryStock;
