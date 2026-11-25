import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import frontOfficeService from '../../../services/front-office.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgFrontOfficeEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [followupModalData, setFollowupModalData] = useState(null);
  const [followupText, setFollowupText] = useState('');
  const { confirmAction, ConfirmModal } = useConfirmDialog();
  
  const [formData, setFormData] = useState({
    student_name: '',
    parent_name: '',
    mobile: '',
    email: '',
    program_id: 'B.Tech Computer Science & Engineering',
    enquiry_source: 'Walk-In',
    assigned_counsellor: 'Dr. Priya Desai',
    remarks: '',
    status: 'New'
  });

  const loadEnquiries = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const data = await frontOfficeService.getEnquiries({ status: selectedStatus || undefined });
      setEnquiries(Array.isArray(data) ? data : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Failed to load enquiries from PostgreSQL:', e);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsSyncing(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadEnquiries();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadEnquiries(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadEnquiries]);

  const handleOpenAddModal = () => {
    setEditingEnquiry(null);
    setFormData({
      student_name: '',
      parent_name: '',
      mobile: '',
      email: '',
      program_id: 'B.Tech Computer Science & Engineering',
      enquiry_source: 'Walk-In',
      assigned_counsellor: 'Dr. Priya Desai',
      remarks: '',
      status: 'New'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (enq) => {
    setEditingEnquiry(enq);
    setFormData({
      student_name: enq.studentName || enq.student_name || '',
      parent_name: enq.parentName || enq.parent_name || '',
      mobile: enq.mobile || '',
      email: enq.email || '',
      program_id: enq.program || enq.program_id || 'B.Tech Computer Science & Engineering',
      enquiry_source: enq.enquirySource || enq.enquiry_source || 'Walk-In',
      assigned_counsellor: enq.assignedCounsellor || enq.assigned_counsellor || 'Dr. Priya Desai',
      remarks: enq.remarks || '',
      status: enq.status || 'New'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.student_name.trim() || !formData.mobile.trim()) {
      alert('Student name and mobile number are required.');
      return;
    }

    try {
      const payload = {
        studentName: formData.student_name.trim(),
        parentName: formData.parent_name.trim() || null,
        mobile: formData.mobile.trim(),
        email: formData.email.trim() || null,
        program: formData.program_id,
        enquirySource: formData.enquiry_source,
        assignedCounsellor: formData.assigned_counsellor,
        remarks: formData.remarks?.trim() || null,
        status: formData.status
      };

      if (editingEnquiry) {
        await frontOfficeService.updateEnquiry(editingEnquiry.id, payload);
      } else {
        await frontOfficeService.createEnquiry(payload);
      }

      setIsModalOpen(false);
      setEditingEnquiry(null);
      await loadEnquiries();
    } catch (err) {
      alert('Failed to save enquiry: ' + (err.message || 'Server error'));
    }
  };

  const handleConvertLead = (enq) => {
    confirmAction({
      title: 'Convert Prospect to Admissions Lead',
      message: `Forward prospect "${enq.studentName || enq.student_name}" as an active Lead into Module 02 Admissions CRM pipeline?`,
      confirmText: 'Convert to Admissions Lead',
      confirmVariant: 'primary',
      onConfirm: async () => {
        try {
          await frontOfficeService.convertToLead(enq.id);
          await loadEnquiries();
        } catch (err) {
          alert('Failed to convert to Admissions lead: ' + (err.message || 'Server error'));
        }
      }
    });
  };

  const handleSaveFollowup = async (e) => {
    e.preventDefault();
    if (!followupModalData || !followupText.trim()) return;

    try {
      await frontOfficeService.addFollowup(followupModalData.id, {
        notes: followupText.trim(),
        counsellor: 'Dr. Priya Desai'
      });
      setFollowupModalData(null);
      setFollowupText('');
      await loadEnquiries();
    } catch (err) {
      alert('Failed to add followup log: ' + (err.message || 'Server error'));
    }
  };

  const handleDelete = (enq) => {
    confirmAction({
      title: 'Delete Admission Enquiry',
      message: `Permanently delete enquiry "${enq.enquiryNumber || enq.enquiry_number}" for ${enq.studentName || enq.student_name}? This action cannot be undone.`,
      confirmText: 'Delete Enquiry',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await frontOfficeService.deleteEnquiry(enq.id);
          await loadEnquiries();
        } catch (err) {
          alert('Failed to delete enquiry: ' + (err.message || 'Server error'));
        }
      }
    });
  };

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(e => {
      const q = searchQuery.toLowerCase();
      const sName = (e.studentName || e.student_name || '').toLowerCase();
      const pName = (e.parentName || e.parent_name || '').toLowerCase();
      const mobile = (e.mobile || '');
      const enqNo = (e.enquiryNumber || e.enquiry_number || '').toLowerCase();
      const program = (e.program || e.program_id || '').toLowerCase();

      return sName.includes(q) || pName.includes(q) || mobile.includes(q) || enqNo.includes(q) || program.includes(q);
    });
  }, [enquiries, searchQuery]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedEnquiries,
    totalItems
  } = useTablePagination(filteredEnquiries, 10);

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
              <i className="fa-solid fa-user-plus"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Admission &amp; Academic Enquiries
                </h2>
                {isSyncing && (
                  <span style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-arrows-rotate fa-spin"></i> Syncing...
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Reception walk-in prospects, online inquiries, and direct conversion to Module 02 Admissions CRM &bull; Realtime DB &bull; Synced at {lastSyncTime}
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
              <span>New Enquiry</span>
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['', 'New', 'Contacted', 'Campus Visit Scheduled', 'Converted'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className="btn btn-outline"
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  background: selectedStatus === st ? '#0284C7' : '#fff',
                  color: selectedStatus === st ? '#fff' : '#475569',
                  border: '1px solid #cbd5e1'
                }}
              >
                {st === '' ? 'ALL ENQUIRIES' : st.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
            <input 
              type="text"
              placeholder="Search candidate, mobile, enq no..."
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

        {/* Enquiries Table */}
        <div className="card" style={{ padding: 0, borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden' }}>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Enquiry No</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Candidate Details</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Target Program</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Source / Counsellor</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Pipeline Status</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                ) : paginatedEnquiries.length > 0 ? (
                  paginatedEnquiries.map(enq => {
                    const isConverted = enq.status === 'Converted' || enq.status === 'Applied';
                    return (
                      <tr key={enq.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px', fontWeight: '800', color: '#0284C7', verticalAlign: 'middle' }}>
                          {enq.enquiryNumber || enq.enquiry_number}
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <strong style={{ color: '#1E293B', fontSize: '13.5px', display: 'block' }}>{enq.studentName || enq.student_name}</strong>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>
                            <i className="fa-solid fa-phone me-1" style={{ color: '#94a3b8' }}></i>
                            {enq.mobile} {enq.parentName && `• Parent: ${enq.parentName}`}
                          </div>
                          {enq.remarks && (
                            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>{enq.remarks}</div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                          {enq.program || enq.program_id}
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '12.5px', color: '#475569' }}>
                          <div><span style={{ fontWeight: '600' }}>Source:</span> {enq.enquirySource || enq.enquiry_source}</div>
                          <small style={{ color: '#0284c7' }}>Counsellor: {enq.assignedCounsellor || enq.assigned_counsellor || 'Dr. Priya Desai'}</small>
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span className="badge" style={{
                            background: isConverted ? 'rgba(16, 185, 129, 0.12)' : enq.status === 'Campus Visit Scheduled' ? 'rgba(2, 132, 199, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isConverted ? '#059669' : enq.status === 'Campus Visit Scheduled' ? '#0284c7' : '#d97706',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConverted ? '#059669' : enq.status === 'Campus Visit Scheduled' ? '#0284c7' : '#d97706' }}></span>
                            {enq.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                            {!isConverted && (
                              <button
                                type="button"
                                onClick={() => handleConvertLead(enq)}
                                className="btn btn-outline"
                                style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '700', borderRadius: '6px', color: '#059669', borderColor: '#a7f3d0', cursor: 'pointer', background: '#f0fdf4' }}
                                title="Forward to Module 02 Admissions CRM"
                              >
                                <i className="fa-solid fa-arrow-right-to-bracket me-1"></i> Convert to Lead
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setFollowupModalData(enq); setFollowupText(''); }}
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', color: '#0284c7', borderColor: '#bae6fd', cursor: 'pointer' }}
                              title="Add counselling followup"
                            >
                              <i className="fa-regular fa-comment-dots me-1"></i> Follow-up
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(enq)}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', color: '#334155', borderColor: '#cbd5e1', cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(enq)}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', color: '#ef4444', borderColor: '#fca5a5', cursor: 'pointer' }}
                              title="Delete enquiry"
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
                      No admission inquiries found in PostgreSQL.
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
            itemName="enquiries"
          />
        </div>

        {/* Follow-up Note Modal */}
        {followupModalData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                  Log Counselling Follow-Up
                </h3>
                <button onClick={() => setFollowupModalData(null)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
              </div>

              <div style={{ marginBottom: '14px', fontSize: '13px', color: '#475569' }}>
                Prospect: <strong>{followupModalData.studentName || followupModalData.student_name}</strong> ({followupModalData.enquiryNumber || followupModalData.enquiry_number})
              </div>

              <form onSubmit={handleSaveFollowup}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Follow-Up Discussion Notes *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Telephoned candidate. Candidate scheduled campus laboratory tour on Saturday..."
                    value={followupText}
                    onChange={e => setFollowupText(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setFollowupModalData(null)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 18px', borderRadius: '8px', background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Save Follow-up
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* New / Edit Enquiry Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  {editingEnquiry ? 'Edit Admission Enquiry' : 'Log New Prospect Enquiry'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
              </div>

              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Candidate Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sameer Joshi"
                      value={formData.student_name}
                      onChange={e => setFormData({ ...formData, student_name: e.target.value })}
                      className="form-control"
                      required
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Parent / Guardian Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Anand Joshi"
                      value={formData.parent_name}
                      onChange={e => setFormData({ ...formData, parent_name: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Mobile Number *</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9822011223"
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      className="form-control"
                      required
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. sameer.joshi@gmail.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Enquiry Source</label>
                    <select
                      value={formData.enquiry_source}
                      onChange={e => setFormData({ ...formData, enquiry_source: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="Walk-In">Walk-In (Campus)</option>
                      <option value="Website">Website Form</option>
                      <option value="Education Fair">Education Fair / Expo</option>
                      <option value="Telephone">Direct Call</option>
                      <option value="Referral">Student Referral</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Target Academic Program</label>
                    <select
                      value={formData.program_id}
                      onChange={e => setFormData({ ...formData, program_id: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="B.Tech Computer Science & Engineering">B.Tech Computer Science &amp; Engineering</option>
                      <option value="B.Tech Electronics & Communication">B.Tech Electronics &amp; Communication</option>
                      <option value="M.Tech Data Science & AI">M.Tech Data Science &amp; AI</option>
                      <option value="B.Tech Mechanical & Robotics">B.Tech Mechanical &amp; Robotics</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Assigned Counsellor</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Priya Desai"
                      value={formData.assigned_counsellor}
                      onChange={e => setFormData({ ...formData, assigned_counsellor: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Enquiry Pipeline Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Campus Visit Scheduled">Campus Visit Scheduled</option>
                      <option value="Converted">Converted</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Discussion Notes &amp; Prospect Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Inquired about merit scholarships, hostel accommodation, and placement statistics..."
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
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
                    {editingEnquiry ? 'Update Enquiry' : 'Save Enquiry'}
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

export default OrgFrontOfficeEnquiries;
