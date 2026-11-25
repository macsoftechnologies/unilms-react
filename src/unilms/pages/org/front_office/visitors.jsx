import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import frontOfficeService from '../../../services/front-office.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgFrontOfficeVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    visitor_name: '',
    phone: '',
    visitor_type: 'Guest',
    purpose: '',
    person_to_meet: '',
    department_name: 'Computer Science & Engineering',
    id_proof: 'Aadhaar Card'
  });

  const loadVisitors = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const data = await frontOfficeService.getVisitors(statusFilter || undefined);
      setVisitors(Array.isArray(data) ? data : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Failed to load visitors from PostgreSQL:', e);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsSyncing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadVisitors();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadVisitors(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadVisitors]);

  const handleCheckout = (v) => {
    confirmAction({
      title: 'Record Visitor Departure',
      message: `Record departure checkout for visitor "${v.visitorName || v.visitor_name}" (Gate Pass: ${v.passNumber || v.pass_number})? Exit timestamp will be stamped in PostgreSQL.`,
      confirmText: 'Check Out Visitor',
      confirmVariant: 'primary',
      onConfirm: async () => {
        try {
          await frontOfficeService.checkoutVisitor(v.id);
          await loadVisitors();
        } catch (err) {
          alert('Failed to checkout visitor: ' + (err.message || 'Server error'));
        }
      }
    });
  };

  const handleDelete = (v) => {
    confirmAction({
      title: 'Delete Visitor Gatepass Record',
      message: `Are you sure you want to permanently delete gatepass "${v.passNumber || v.pass_number}" for ${v.visitorName || v.visitor_name}? This removes security audit logs from PostgreSQL.`,
      confirmText: 'Delete Pass',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await frontOfficeService.deleteVisitor(v.id);
          await loadVisitors();
        } catch (err) {
          alert('Failed to delete visitor pass: ' + (err.message || 'Server error'));
        }
      }
    });
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!formData.visitor_name.trim() || !formData.phone.trim() || !formData.purpose.trim()) {
      alert('Please fill visitor name, phone, and purpose.');
      return;
    }

    try {
      await frontOfficeService.createVisitor({
        visitorName: formData.visitor_name.trim(),
        phone: formData.phone.trim(),
        visitorType: formData.visitor_type,
        purpose: formData.purpose.trim(),
        personToMeet: formData.person_to_meet.trim() || 'Campus Administration',
        department: formData.department_name,
        idProof: formData.id_proof,
      });

      setIsModalOpen(false);
      setFormData({
        visitor_name: '',
        phone: '',
        visitor_type: 'Guest',
        purpose: '',
        person_to_meet: '',
        department_name: 'Computer Science & Engineering',
        id_proof: 'Aadhaar Card'
      });
      await loadVisitors();
    } catch (err) {
      alert('Failed to issue gate pass: ' + (err.message || 'Server error'));
    }
  };

  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      const q = searchQuery.toLowerCase();
      const name = (v.visitorName || v.visitor_name || '').toLowerCase();
      const phone = (v.phone || '');
      const passNo = (v.passNumber || v.pass_number || '').toLowerCase();
      const purpose = (v.purpose || '').toLowerCase();
      const host = (v.personToMeet || v.person_to_meet || '').toLowerCase();

      return name.includes(q) || phone.includes(q) || passNo.includes(q) || purpose.includes(q) || host.includes(q);
    });
  }, [visitors, searchQuery]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedVisitors,
    totalItems
  } = useTablePagination(filteredVisitors, 10);

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
              <i className="fa-solid fa-id-badge"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Visitor Registry &amp; Gate Passes
                </h2>
                {isSyncing && (
                  <span style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-arrows-rotate fa-spin"></i> Syncing...
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Real-time security check-in, barcode gate passes &amp; host visit notifications &bull; Realtime DB &bull; Synced at {lastSyncTime}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => setIsModalOpen(true)}
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
              <span>Issue Gate Pass</span>
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
            {['', 'inside', 'out'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className="btn btn-outline"
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  background: statusFilter === st ? '#0284C7' : '#fff',
                  color: statusFilter === st ? '#fff' : '#475569',
                  border: '1px solid #cbd5e1'
                }}
              >
                {st === '' ? 'ALL VISITORS' : st === 'inside' ? 'CURRENTLY INSIDE' : 'CHECKED OUT'}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
            <input 
              type="text"
              placeholder="Search visitor, phone, pass no..."
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

        {/* Visitors Table */}
        <div className="card" style={{ padding: 0, borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden' }}>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Pass No</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Visitor Details</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Purpose / Meeting With</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Entry Time</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Status</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                ) : paginatedVisitors.length > 0 ? (
                  paginatedVisitors.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '800', color: '#0284C7', verticalAlign: 'middle' }}>
                        {v.passNumber || v.pass_number}
                        {v.idProof && (
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
                            {v.idProof}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <strong style={{ color: '#1E293B', display: 'block', fontSize: '13.5px' }}>{v.visitorName || v.visitor_name}</strong>
                        <small style={{ color: '#64748B' }}>{v.phone} &bull; <span style={{ fontWeight: '600' }}>{v.visitorType || v.visitor_type}</span></small>
                      </td>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{v.purpose}</div>
                        <small style={{ color: '#64748B' }}>With: <strong>{v.personToMeet || v.person_to_meet}</strong> ({v.department || 'Campus'})</small>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '12.5px', color: '#475569', verticalAlign: 'middle' }}>
                        <div>{v.inTime ? new Date(v.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                        <small style={{ color: '#94a3b8' }}>{v.inTime ? new Date(v.inTime).toLocaleDateString('en-GB') : ''}</small>
                      </td>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <span className="badge" style={{
                          background: v.status === 'inside' ? '#DCFCE7' : '#F1F5F9',
                          color: v.status === 'inside' ? '#16A34A' : '#64748B',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: '700',
                          fontSize: '11.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: v.status === 'inside' ? '#16A34A' : '#94A3B8' }}></span>
                          {v.status === 'inside' ? 'INSIDE CAMPUS' : 'DEPARTED'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <Link
                            to={`/unilms/org/front_office/pass_print?id=${v.id}`}
                            className="btn btn-outline"
                            style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '700', borderRadius: '6px', color: '#0284c7', borderColor: '#bae6fd', textDecoration: 'none' }}
                            title="Print Badge Slip"
                          >
                            <i className="fa-solid fa-print me-1"></i> Print
                          </Link>
                          {v.status === 'inside' && (
                            <button
                              type="button"
                              onClick={() => handleCheckout(v)}
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '700', borderRadius: '6px', color: '#D97706', borderColor: '#FDE68A', cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-door-open me-1"></i> Check Out
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(v)}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', color: '#ef4444', borderColor: '#fca5a5', cursor: 'pointer' }}
                            title="Delete pass"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      No visitor passes found in PostgreSQL. Issue a gate pass above.
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
            itemName="visitors"
          />
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Issue Visitor Gate Pass</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
              </div>

              <form onSubmit={handleCheckin}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Visitor Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Vikram Malhotra"
                      value={formData.visitor_name}
                      onChange={e => setFormData({ ...formData, visitor_name: e.target.value })}
                      className="form-control"
                      required
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Mobile Phone *</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="form-control"
                      required
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Visitor Type</label>
                    <select
                      value={formData.visitor_type}
                      onChange={e => setFormData({ ...formData, visitor_type: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="Guest">Guest</option>
                      <option value="Parent">Parent</option>
                      <option value="Vendor">Vendor / Contractor</option>
                      <option value="Auditor">Auditor / Inspector</option>
                      <option value="Alumni">Alumni</option>
                      <option value="Guest Lecturer">Guest Lecturer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>ID Proof Details</label>
                    <input
                      type="text"
                      placeholder="e.g. Aadhaar: **** 4492"
                      value={formData.id_proof}
                      onChange={e => setFormData({ ...formData, id_proof: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Meeting Host / Person *</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Arvind Sharma"
                      value={formData.person_to_meet}
                      onChange={e => setFormData({ ...formData, person_to_meet: e.target.value })}
                      className="form-control"
                      required
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Department / Facility</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science / Central Library"
                      value={formData.department_name}
                      onChange={e => setFormData({ ...formData, department_name: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Purpose of Visit *</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Admission inquiry, Campus review, Technical delivery..."
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    className="form-control"
                    required
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
                    Generate Pass
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

export default OrgFrontOfficeVisitors;
