import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import frontOfficeService from '../../../services/front-office.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgFrontOfficeCallLogs = () => {
  const [calls, setCalls] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCall, setEditingCall] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    caller_name: '',
    phone_number: '',
    call_type: 'INCOMING',
    purpose: '',
    call_duration: '03:30',
    notes: ''
  });

  const loadCalls = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const data = await frontOfficeService.getCalls();
      setCalls(Array.isArray(data) ? data : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Failed to load call logs from PostgreSQL:', e);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadCalls();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadCalls(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadCalls]);

  const handleOpenAddModal = () => {
    setEditingCall(null);
    setFormData({
      caller_name: '',
      phone_number: '',
      call_type: 'INCOMING',
      purpose: '',
      call_duration: '03:30',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (call) => {
    setEditingCall(call);
    setFormData({
      caller_name: call.callerName || call.caller_name || '',
      phone_number: call.phone || call.phone_number || '',
      call_type: call.callType || call.call_type || 'INCOMING',
      purpose: call.purpose || '',
      call_duration: call.duration || call.call_duration || '',
      notes: call.notes || call.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.caller_name.trim() || !formData.phone_number.trim() || !formData.purpose.trim()) {
      alert('Please fill caller name, phone number, and call purpose.');
      return;
    }

    try {
      const payload = {
        callerName: formData.caller_name.trim(),
        phone: formData.phone_number.trim(),
        callType: formData.call_type,
        purpose: formData.purpose.trim(),
        duration: formData.call_duration || '02:00',
        notes: formData.notes?.trim() || null
      };

      if (editingCall) {
        await frontOfficeService.updateCall(editingCall.id, payload);
      } else {
        await frontOfficeService.createCall(payload);
      }

      setIsModalOpen(false);
      setEditingCall(null);
      await loadCalls();
    } catch (err) {
      alert('Failed to save call log: ' + (err.message || 'Server error'));
    }
  };

  const handleDelete = (call) => {
    confirmAction({
      title: 'Delete Telephonic Call Log',
      message: `Delete call record with "${call.callerName || call.caller_name}" (${call.phone || call.phone_number})? This action removes reception telephony records from PostgreSQL.`,
      confirmText: 'Delete Record',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await frontOfficeService.deleteCall(call.id);
          await loadCalls();
        } catch (err) {
          alert('Failed to delete call log: ' + (err.message || 'Server error'));
        }
      }
    });
  };

  const filteredCalls = useMemo(() => {
    return calls.filter(c => {
      const type = c.callType || c.call_type || '';
      const matchesType = !selectedType || type.toUpperCase() === selectedType.toUpperCase();

      const q = searchQuery.toLowerCase();
      const name = (c.callerName || c.caller_name || '').toLowerCase();
      const phone = (c.phone || c.phone_number || '');
      const purpose = (c.purpose || '').toLowerCase();
      const notes = (c.notes || '').toLowerCase();

      const matchesSearch = name.includes(q) || phone.includes(q) || purpose.includes(q) || notes.includes(q);

      return matchesType && matchesSearch;
    });
  }, [calls, selectedType, searchQuery]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedCalls,
    totalItems
  } = useTablePagination(filteredCalls, 10);

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
              <i className="fa-solid fa-phone-volume"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Reception Telephony &amp; Call Logs
                </h2>
                {isSyncing && (
                  <span style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-arrows-rotate fa-spin"></i> Syncing...
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Inbound &amp; outbound telephony logbook, admissions inquiries, and callback tracking &bull; Realtime DB &bull; Synced at {lastSyncTime}
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
              <span>Log Phone Call</span>
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
            {['', 'INCOMING', 'OUTGOING'].map(tp => (
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
                {tp === '' ? 'ALL CALLS' : tp === 'INCOMING' ? 'INCOMING CALLS' : 'OUTGOING CALLS'}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
            <input 
              type="text"
              placeholder="Search caller name, phone, purpose..."
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

        {/* Calls Table */}
        <div className="card" style={{ padding: 0, borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden' }}>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Caller Contact</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Direction</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Purpose &amp; Discussion</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Duration</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Call Timestamp</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                ) : paginatedCalls.length > 0 ? (
                  paginatedCalls.map(c => {
                    const isIncoming = (c.callType || c.call_type || '').toUpperCase() === 'INCOMING';
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <strong style={{ color: '#1E293B', fontSize: '13.5px', display: 'block' }}>{c.callerName || c.caller_name}</strong>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>
                            <i className="fa-solid fa-phone me-1" style={{ color: '#94a3b8' }}></i>
                            {c.phone || c.phone_number}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span className="badge" style={{
                            background: isIncoming ? 'rgba(14, 165, 233, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isIncoming ? '#0284c7' : '#d97706',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className={`fa-solid ${isIncoming ? 'fa-arrow-down-left' : 'fa-arrow-up-right'}`}></i>
                            {isIncoming ? 'INCOMING' : 'OUTGOING'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', maxWidth: '300px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{c.purpose}</div>
                          {c.notes && (
                            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>{c.notes}</div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                          <i className="fa-regular fa-clock me-1" style={{ color: '#94a3b8' }}></i>
                          {c.duration || c.call_duration || '—'}
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '12.5px', color: '#475569' }}>
                          <div>{c.callDate ? new Date(c.callDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                          <small style={{ color: '#94a3b8' }}>{c.callDate ? new Date(c.callDate).toLocaleDateString('en-GB') : ''}</small>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(c)}
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', color: '#334155', borderColor: '#cbd5e1', cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(c)}
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
                      No telephonic call logs found in PostgreSQL.
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
            itemName="call records"
          />
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  {editingCall ? 'Edit Call Record' : 'Log Telephone Communication'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
              </div>

              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Caller / Contact Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ananya Deshmukh"
                      value={formData.caller_name}
                      onChange={e => setFormData({ ...formData, caller_name: e.target.value })}
                      className="form-control"
                      required
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98220 11223"
                      value={formData.phone_number}
                      onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                      className="form-control"
                      required
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Call Direction</label>
                    <select
                      value={formData.call_type}
                      onChange={e => setFormData({ ...formData, call_type: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="INCOMING">Incoming</option>
                      <option value="OUTGOING">Outgoing</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Call Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 04m 15s"
                      value={formData.call_duration}
                      onChange={e => setFormData({ ...formData, call_duration: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Call Purpose / Subject *</label>
                  <input
                    type="text"
                    placeholder="e.g. Admissions Cutoff & Fee Structure Enquiry"
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    className="form-control"
                    required
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Discussion Notes &amp; Follow-up</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Transferred to Admissions Counsellor. Prospect requested fee brochure."
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
                    {editingCall ? 'Update Call' : 'Save Call Log'}
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

export default OrgFrontOfficeCallLogs;
