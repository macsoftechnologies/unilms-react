import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import admissionsService from '../../../services/admissions.service';
import academicsService from '../../../services/academics.service';
import staffService from '../../../services/staff.service';

const OrgAdmissionsLeads = () => {
  const [leads, setLeads] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [staffList, setStaffList] = useState(['-- Unassigned --']);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Right-side Drawer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Toast notification state
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    city: '',
    program_name: '-- Undecided --',
    source: 'Walk-in',
    status: 'New',
    assigned_name: '-- Unassigned --',
    follow_up_date: ''
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await admissionsService.getLeads();
      const normalized = (Array.isArray(data) ? data : []).map(l => ({
        id: l.id,
        full_name: l.fullName || l.full_name,
        phone: l.phone,
        email: l.email,
        city: l.city,
        program_id: l.programId || l.program_id,
        program_name: l.programName || l.program?.name || l.program_name || '-- Undecided --',
        source: l.source || 'Website',
        status: l.status || 'New',
        assigned_name: l.assignedTo || l.assigned_name || '-- Unassigned --',
        follow_up_date: l.followUpDate ? l.followUpDate.split('T')[0] : (l.follow_up_date || '')
      }));
      setLeads(normalized);
    } catch (e) {
      console.error('Failed to load leads:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const progs = await academicsService.getPrograms();
      setProgramsList(Array.isArray(progs) ? progs : []);
    } catch (e) {
      console.warn('Programs load error:', e);
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await staffService.getStaff();
      if (Array.isArray(data) && data.length > 0) {
        setStaffList([
          '-- Unassigned --',
          ...data.map((s) => `${s.firstName} ${s.lastName || ''} (${s.designation || 'Staff'})`.trim())
        ]);
      }
    } catch (e) {
      console.warn('Staff load error:', e);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchPrograms();
    fetchStaff();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      city: '',
      program_name: '-- Undecided --',
      source: 'Walk-in',
      status: 'New',
      assigned_name: '-- Unassigned --',
      follow_up_date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lead) => {
    setModalMode('edit');
    setEditingId(lead.id);
    setFormData({
      full_name: lead.full_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      city: lead.city || '',
      program_name: lead.program_name || '-- Undecided --',
      source: lead.source || 'Walk-in',
      status: lead.status || 'New',
      assigned_name: lead.assigned_name || '-- Unassigned --',
      follow_up_date: lead.follow_up_date || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim() || !formData.phone.trim()) {
      alert('Please fill in Full Name and Phone Number');
      return;
    }

    try {
      if (modalMode === 'add') {
        await admissionsService.createLead(formData);
        showToast(`Lead "${formData.full_name}" created successfully!`);
      } else {
        await admissionsService.updateLead(editingId, formData);
        showToast(`Lead "${formData.full_name}" updated successfully!`);
      }
      setIsModalOpen(false);
      fetchLeads();
    } catch (err) {
      console.error('Lead submit error:', err);
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await admissionsService.deleteLead(id);
      setDeleteConfirmId(null);
      showToast('Lead deleted successfully.');
      fetchLeads();
    } catch (err) {
      console.error('Delete lead error:', err);
      alert('Failed to delete lead.');
    }
  };

  const handleConvertToApplication = async (id) => {
    try {
      const target = leads.find(l => l.id === id);
      if (target) {
        await admissionsService.createApplication({
          fullName: target.full_name,
          email: target.email || `${target.full_name.toLowerCase().replace(/\s+/g, '')}@student.edu`,
          phone: target.phone,
          programName: target.program_name !== '-- Undecided --' ? target.program_name : null,
          status: 'Submitted'
        });
      }
      await admissionsService.updateLead(id, { status: 'Converted' });
      showToast('Lead converted to formal application successfully!');
      fetchLeads();
    } catch (err) {
      console.error('Convert lead error:', err);
      alert('Failed to convert lead.');
    }
  };

  // Filtered leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      (lead.full_name || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (lead.phone || '').includes(searchFilter) ||
      (lead.email || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (lead.program_name || '').toLowerCase().includes(searchFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedLeads,
    totalItems
  } = useTablePagination(filteredLeads, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, statusFilter, setCurrentPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563EB', border: '1px solid rgba(59, 130, 246, 0.25)' };
      case 'Contacted':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#D97706', border: '1px solid rgba(245, 158, 11, 0.25)' };
      case 'Interested':
        return { bg: 'rgba(139, 92, 246, 0.12)', color: '#7C3AED', border: '1px solid rgba(139, 92, 246, 0.25)' };
      case 'Converted':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)' };
      case 'Not Interested':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#DC2626', border: '1px solid rgba(239, 68, 68, 0.25)' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.12)', color: '#4B5563', border: '1px solid rgba(107, 114, 128, 0.25)' };
    }
  };

  return (
    <div className="leads-page-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 10000, background: '#10B981', color: '#fff', padding: '12px 20px', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600', animation: 'modalFadeIn 0.2s ease' }}>
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
              <i className="fa-solid fa-users"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Manage Leads CRM &amp; Inquiries
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Capture inquiries, track lead stages &amp; nurture candidate conversions &bull; AY 2026&ndash;2027
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ height: '42px', width: 'auto', minWidth: '130px', fontSize: '13px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Converted">Converted</option>
              <option value="Not Interested">Not Interested</option>
            </select>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAdd}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
                color: '#ffffff',
                fontWeight: '700',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add New Lead</span>
            </button>
          </div>
        </div>

        {/* Quick Search Bar */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
            <input
              type="text"
              placeholder="Search leads by name, phone, email, program..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', borderRadius: '10px', fontSize: '13.5px' }}
            />
          </div>
        </div>

        {/* Leads Data Table */}
        <div className="table-container" style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #F8FAFC)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lead Name</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Info</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Program Interest</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned To</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Follow-up Date</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="leads_table_body">
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedLeads.length > 0 ? (
                paginatedLeads.map((lead) => {
                  const badge = getStatusBadge(lead.status);
                  return (
                    <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '14px', display: 'block' }}>{lead.full_name}</strong>
                        {lead.city && <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>📍 {lead.city}</small>}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: '500' }}>{lead.phone}</span>
                        <br />
                        <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{lead.email || 'No email'}</small>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', color: 'var(--text-primary)' }}>
                        {lead.program_name && lead.program_name !== '-- Undecided --' ? (
                          lead.program_name
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Undecided</span>
                        )}
                        <br />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Source: {lead.source}</span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            border: badge.border,
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', color: 'var(--text-primary)' }}>
                        {lead.assigned_name && lead.assigned_name !== '-- Unassigned --' ? (
                          lead.assigned_name
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', color: 'var(--text-primary)' }}>
                        {lead.follow_up_date || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div className="action-buttons" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {lead.status !== 'Converted' && (
                            <button
                              type="button"
                              className="btn-icon text-success"
                              title="Convert to Application"
                              onClick={() => handleConvertToApplication(lead.id)}
                              style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#059669', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <i className="fa-solid fa-file-signature"></i>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-icon text-primary"
                            onClick={() => handleOpenEdit(lead)}
                            title="Edit Lead"
                            style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.25)', color: '#7C3AED', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            type="button"
                            className="btn-icon text-danger"
                            title="Delete Lead"
                            onClick={() => setDeleteConfirmId(lead.id)}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#EF4444', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-users" style={{ fontSize: '32px', opacity: 0.3, marginBottom: '10px', display: 'block' }}></i>
                    No leads found matching your filters. Click <strong>Add New Lead</strong> to create one.
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
            itemName="leads"
          />
        </div>
      </section>

      {/* ================= RIGHT-SIDE OFFCANVAS DRAWER MODAL (MATCHING IMAGE 1 & 2) ================= */}
      <div
        className={`drawer-overlay ${isModalOpen ? 'active' : ''}`}
        id="addModal"
        onClick={(e) => {
          if (e.target.id === 'addModal') handleCloseModal();
        }}
        style={{
          zIndex: 9999
        }}
      >
        <div
          className="drawer-content"
          style={{
            maxWidth: '650px',
            borderTopLeftRadius: '24px',
            borderBottomLeftRadius: '24px',
            background: '#FFFFFF'
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Header Matching Image 1 */}
            <div
              className="drawer-header"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                color: '#FFFFFF',
                padding: '22px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTopLeftRadius: '24px'
              }}
            >
              <h3 id="modal_title" style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                {modalMode === 'add' ? 'Add New Lead' : 'Edit Lead'}
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={handleCloseModal}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.22)',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background 0.2s'
                }}
                title="Close"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Body Matching Image 1 Form Layout */}
            <div className="drawer-body" style={{ flexGrow: 1, padding: '28px', background: '#FFFFFF', overflowY: 'auto' }}>
              
              {/* Row 1: Full Name | Phone Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="form-control"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 14px',
                      fontSize: '14px',
                      color: '#1F2937',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 9876543210"
                    required
                    className="form-control"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 14px',
                      fontSize: '14px',
                      color: '#1F2937',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Email Address | City / Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. rahul@example.com"
                    className="form-control"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 14px',
                      fontSize: '14px',
                      color: '#1F2937',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    City / Location
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="form-control"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 14px',
                      fontSize: '14px',
                      color: '#1F2937',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Program Interested In | Source */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    Program Interested In
                  </label>
                  <select
                    name="program_name"
                    value={formData.program_name}
                    onChange={handleInputChange}
                    className="form-control"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #A78BFA',
                      padding: '0 36px 0 14px',
                      fontSize: '14px',
                      color: '#1F2937',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="-- Undecided --">-- Undecided --</option>
                    {programsList.map((prog) => (
                      <option key={prog.id} value={prog.name}>
                        {prog.name} ({prog.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    Source
                  </label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    className="form-control"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 36px 0 14px',
                      fontSize: '14px',
                      color: '#1F2937',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Walk-in">Walk-in</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Agent">Agent</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Education Fair">Education Fair</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Status | Assign To Officer | Next Follow-up Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '10px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 32px 0 12px',
                      fontSize: '13.5px',
                      color: '#1F2937',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Converted">Converted</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    Assign To Officer
                  </label>
                  <select
                    name="assigned_name"
                    value={formData.assigned_name}
                    onChange={handleInputChange}
                    className="form-control"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 32px 0 12px',
                      fontSize: '13.5px',
                      color: '#1F2937',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    {staffList.map((staff, idx) => (
                      <option key={idx} value={staff}>
                        {staff}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    name="follow_up_date"
                    value={formData.follow_up_date}
                    onChange={handleInputChange}
                    className="form-control"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 10px',
                      fontSize: '13.5px',
                      color: '#1F2937',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

            </div>

            {/* Footer Matching Image 1 */}
            <div
              className="drawer-footer"
              style={{
                padding: '18px 28px',
                background: '#F9FAFB',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCloseModal}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: '1.5px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#7C3AED',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(124, 58, 237, 0.3)',
                  transition: 'all 0.15s'
                }}
              >
                Save Lead
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '400px',
              width: '100%',
              padding: '28px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              animation: 'modalFadeIn 0.2s ease-out'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                fontSize: '22px'
              }}
            >
              <i className="fa-solid fa-trash"></i>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#1F2937' }}>Delete Lead</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#6B7280', lineHeight: '1.5' }}>
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  flex: 1,
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  flex: 1,
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgAdmissionsLeads;