import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import frontOfficeService from '../../../services/front-office.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgFrontOfficePostal = () => {
  const [records, setRecords] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    type: 'INWARD',
    trackingNumber: '',
    sender: '',
    recipient: '',
    department: 'Central Administration',
    date: new Date().toISOString().split('T')[0],
    status: 'RECEIVED',
    notes: ''
  });

  const loadPostal = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const data = await frontOfficeService.getPostal(selectedType || undefined);
      setRecords(Array.isArray(data) ? data : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Failed to load postal dispatches from PostgreSQL:', e);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsSyncing(false);
    }
  }, [selectedType]);

  useEffect(() => {
    loadPostal();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadPostal(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadPostal]);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormData({
      type: 'INWARD',
      trackingNumber: `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      sender: '',
      recipient: '',
      department: 'Central Administration',
      date: new Date().toISOString().split('T')[0],
      status: 'RECEIVED',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r) => {
    setEditingRecord(r);
    setFormData({
      type: r.type || 'INWARD',
      trackingNumber: r.trackingNumber || r.tracking_number || '',
      sender: r.sender || '',
      recipient: r.recipient || '',
      department: r.department || 'Central Administration',
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: r.status || 'RECEIVED',
      notes: r.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.sender.trim() || !formData.recipient.trim()) {
      alert('Sender and Recipient names are required.');
      return;
    }

    try {
      const payload = {
        type: formData.type,
        trackingNumber: formData.trackingNumber.trim() || null,
        sender: formData.sender.trim(),
        recipient: formData.recipient.trim(),
        department: formData.department.trim(),
        date: formData.date,
        status: formData.status,
        notes: formData.notes?.trim() || null
      };

      if (editingRecord) {
        await frontOfficeService.updatePostal(editingRecord.id, payload);
      } else {
        await frontOfficeService.createPostal(payload);
      }

      setIsModalOpen(false);
      setEditingRecord(null);
      await loadPostal();
    } catch (err) {
      alert('Failed to save postal dispatch: ' + (err.message || 'Server error'));
    }
  };

  const handleDelete = (r) => {
    confirmAction({
      title: 'Delete Postal Dispatch Record',
      message: `Delete consignment record "${r.trackingNumber || 'Postal item'}" (${r.sender} -> ${r.recipient})? This removes dispatch audit logs from PostgreSQL.`,
      confirmText: 'Delete Record',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await frontOfficeService.deletePostal(r.id);
          await loadPostal();
        } catch (err) {
          alert('Failed to delete postal record: ' + (err.message || 'Server error'));
        }
      }
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = searchQuery.toLowerCase();
      const sender = (r.sender || '').toLowerCase();
      const recipient = (r.recipient || '').toLowerCase();
      const tracking = (r.trackingNumber || r.tracking_number || '').toLowerCase();
      const dept = (r.department || '').toLowerCase();
      const notes = (r.notes || '').toLowerCase();

      return sender.includes(q) || recipient.includes(q) || tracking.includes(q) || dept.includes(q) || notes.includes(q);
    });
  }, [records, searchQuery]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedRecords,
    totalItems
  } = useTablePagination(filteredRecords, 10);

  return (
    <>
      <section className="view-section active">
        {/* Top Header Card */}
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
                background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
              }}
            >
              <i className="fa-solid fa-envelopes-bulk"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Postal &amp; Courier Dispatch Registry
                </h2>
                {isSyncing && (
                  <span style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-arrows-rotate fa-spin"></i> Syncing...
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Inward consignments, official correspondence dispatches, and tracking registry &bull; Realtime DB &bull; Synced at {lastSyncTime}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleOpenAddModal}
              style={{ 
                background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)', 
                color: '#fff', 
                border: 'none', 
                padding: '10px 18px', 
                borderRadius: '10px', 
                fontSize: '13px', 
                fontWeight: '700', 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)', 
                whiteSpace: 'nowrap' 
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Log Dispatch / Inward</span>
            </button>
            <Link 
              to="/unilms/org/front_office" 
              className="btn btn-outline"
              style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary, #334155)', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--card-bg, #fff)', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-desktop" style={{ color: '#0284C7' }}></i>
              <span>Reception Desk</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="card" style={{ padding: '16px 20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['', 'INWARD', 'OUTWARD'].map(tp => (
              <button
                key={tp}
                type="button"
                onClick={() => setSelectedType(tp)}
                className="btn btn-outline"
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  background: selectedType === tp ? '#0284C7' : '#fff',
                  color: selectedType === tp ? '#fff' : '#475569',
                  border: '1px solid #cbd5e1'
                }}
              >
                {tp === '' ? 'ALL SHIPMENTS' : tp === 'INWARD' ? 'INWARD (RECEIVED)' : 'OUTWARD (DISPATCHED)'}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
            <input 
              type="text"
              placeholder="Search sender, recipient, tracking..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{
                paddingLeft: '36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Postal Table */}
        <div className="card" style={{ padding: 0, borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden' }}>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Tracking Number</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Type</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Sender &amp; Recipient</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Department</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Date &amp; Status</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                ) : paginatedRecords.length > 0 ? (
                  paginatedRecords.map(r => {
                    const isInward = (r.type || '').toUpperCase() === 'INWARD' || r.type === 'Receive';
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span className="badge" style={{
                            background: 'rgba(2, 132, 199, 0.1)',
                            color: '#0284c7',
                            fontWeight: '700',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}>
                            {r.trackingNumber || r.tracking_number || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span className="badge" style={{
                            background: isInward ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isInward ? '#10b981' : '#f59e0b',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <i className={`fa-solid ${isInward ? 'fa-inbox' : 'fa-paper-plane'}`}></i>
                            {isInward ? 'INWARD' : 'OUTWARD'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <div style={{ fontSize: '13px', color: '#1e293b' }}>
                            <strong>From:</strong> {r.sender || r.sender_receiver_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            <strong>To:</strong> {r.recipient}
                          </div>
                          {r.notes && (
                            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '3px' }}>
                              {r.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                          {r.department || 'Central Office'}
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '12.5px', color: '#475569' }}>
                          <div>{r.date ? new Date(r.date).toLocaleDateString('en-GB') : '—'}</div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: r.status === 'RECEIVED' || r.status === 'DISPATCHED' ? '#16a34a' : '#d97706'
                          }}>
                            {r.status || 'RECEIVED'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(r)}
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', color: '#334155', borderColor: '#cbd5e1', cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(r)}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', color: '#ef4444', borderColor: '#fca5a5', cursor: 'pointer' }}
                              title="Delete record"
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
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      No postal / courier dispatches registered in PostgreSQL.
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
            itemName="postal dispatches"
          />
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  {editingRecord ? 'Edit Postal Record' : 'Log Postal / Courier Shipment'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
              </div>

              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Shipment Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="INWARD">Inward (Received)</option>
                      <option value="OUTWARD">Outward (Dispatched)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Tracking / Consignment No</label>
                    <input
                      type="text"
                      placeholder="e.g. TRK-IN-9842"
                      value={formData.trackingNumber}
                      onChange={e => setFormData({ ...formData, trackingNumber: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Sender Agency / Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. AICTE Delhi / Registrar"
                      value={formData.sender}
                      onChange={e => setFormData({ ...formData, sender: e.target.value })}
                      className="form-control"
                      required
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Recipient Name / Office *</label>
                    <input
                      type="text"
                      placeholder="e.g. Director Office / Controller Exam"
                      value={formData.recipient}
                      onChange={e => setFormData({ ...formData, recipient: e.target.value })}
                      className="form-control"
                      required
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Department / Facility</label>
                    <input
                      type="text"
                      placeholder="e.g. Central Library / Examinations"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Date of Receipt / Dispatch</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Description &amp; Consignment Contents</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Annual Extension of Approval documents / Answer sheet bundles..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)' }}
                  >
                    {editingRecord ? 'Update Record' : 'Save Shipment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmModal />
      </section>
    </>
  );
};

export default OrgFrontOfficePostal;
