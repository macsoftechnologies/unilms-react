import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

import admissionsService from '../../../services/admissions.service';
import academicsService from '../../../services/academics.service';

const OrgAdmissionsApplications = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [applications, setApplications] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await admissionsService.getApplications();
      const normalized = (Array.isArray(data) ? data : []).map(a => ({
        id: a.id,
        adm_number: a.applicationNumber || a.adm_number,
        full_name: a.fullName || a.full_name,
        phone: a.phone,
        email: a.email,
        program_id: a.programId || a.program_id,
        program_name: a.programName || a.program?.name || a.program_name || 'B.Tech CSE',
        admission_category: a.admissionCategory || a.admission_category || 'General',
        status: a.status || 'Submitted',
        created_at: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB') : (a.created_at || '—'),
        qualification: a.qualification || 'Higher Secondary (10+2)',
        board: a.board || 'CBSE',
        passing_year: a.passingYear || a.passing_year || 2026,
        marks: a.marks ? `${a.marks}%` : (a.marks || '—'),
        offer_letter_sent: a.offerLetterSent || a.offer_letter_sent || false
      }));
      setApplications(normalized);
    } catch (err) {
      console.error('Fetch applications error:', err);
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

  useEffect(() => {
    fetchApplications();
    fetchPrograms();
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedApp(null);
        setIsManualModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    program_name: '',
    admission_category: 'General'
  });

  const handleOpenManual = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      program_name: programsList.length > 0 ? programsList[0].name : 'B.Tech Computer Science & Engineering',
      admission_category: 'General'
    });
    setIsManualModalOpen(true);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    const confirmed = await confirm({
      title: 'Confirm Register New Admission Candidate',
      message: `Submit direct admission application for "${formData.full_name}"?`,
      details: [
        `Candidate Name: ${formData.full_name}`,
        `Program: ${formData.program_name}`,
        `Contact Phone: ${formData.phone}`,
        `Email: ${formData.email}`,
        `Category: ${formData.admission_category}`
      ],
      confirmText: 'Yes, Submit Application',
      variant: 'primary',
      icon: 'fa-solid fa-user-plus'
    });
    if (!confirmed) return;

    try {
      await admissionsService.createApplication({
        fullName: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        programName: formData.program_name,
        admissionCategory: formData.admission_category === 'General' ? 'General Merit' : formData.admission_category,
        status: 'Submitted'
      });
      setIsManualModalOpen(false);
      fetchApplications();
    } catch (err) {
      console.error('Submit application error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to submit application');
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    const app = applications.find(a => a.id === appId) || selectedApp;
    const isApprove = newStatus === 'Approved';
    const isReject = newStatus === 'Rejected';

    const confirmed = await confirm({
      title: `Confirm Admission Status: ${newStatus}`,
      message: `Change application status of "${app?.full_name || 'Candidate'}" to ${newStatus}?`,
      details: isApprove 
        ? 'Approving the candidate generates official provisional admission credentials and opens enrollment onboarding.'
        : `Applicant status will transition to ${newStatus}.`,
      confirmText: `Yes, ${newStatus === 'Approved' ? 'Approve Admission' : `Mark as ${newStatus}`}`,
      variant: isApprove ? 'success' : isReject ? 'danger' : 'warning',
      icon: isApprove ? 'fa-solid fa-circle-check' : 'fa-solid fa-user-pen'
    });
    if (!confirmed) return;

    try {
      await admissionsService.updateApplicationStatus(appId, newStatus);
      fetchApplications();
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update status');
    }
  };

  const filteredApps = applications.filter((app) =>
    app.full_name.toLowerCase().includes(search.toLowerCase()) ||
    app.adm_number.toLowerCase().includes(search.toLowerCase()) ||
    app.program_name.toLowerCase().includes(search.toLowerCase())
  );

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedApps,
    totalItems
  } = useTablePagination(filteredApps, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, setCurrentPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Submitted':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563EB', border: '1px solid rgba(59, 130, 246, 0.25)' };
      case 'Under Review':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#D97706', border: '1px solid rgba(245, 158, 11, 0.25)' };
      case 'Approved':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)' };
      case 'Documents Pending':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#DC2626', border: '1px solid rgba(239, 68, 68, 0.25)' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.12)', color: '#4B5563', border: '1px solid rgba(107, 114, 128, 0.25)' };
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
                background: 'linear-gradient(135deg, #059669, #0D9488)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
              }}
            >
              <i className="fa-solid fa-file-lines"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Manage Applications &amp; Candidate Screening
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Review, verify &amp; process prospective candidate admission applications
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenManual}
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
            <span>Manual Application</span>
          </button>
          <Link
            to="/unilms/org/admissions/leads"
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
            <i className="fa-solid fa-users" style={{ color: '#0D9488' }}></i>
            <span>Leads CRM</span>
          </Link>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '16px', maxWidth: '380px' }}>
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
            <input
              type="text"
              placeholder="Search by app number or applicant name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', borderRadius: '10px', fontSize: '13.5px', width: '100%' }}
            />
          </div>
        </div>

        <div className="table-container" style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '14px', border: '1px solid var(--border-color)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #F8FAFC)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>App Number</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Applicant Name</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Program (Snapshot)</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date Applied</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedApps.length > 0 ? (
                paginatedApps.map((app) => {
                  const badge = getStatusBadge(app.status);
                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <strong style={{ color: '#7C3AED', fontSize: '13.5px' }}>{app.adm_number}</strong>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '14px', display: 'block' }}>{app.full_name}</strong>
                        <small style={{ color: 'var(--text-muted)' }}>{app.phone}</small>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13.5px' }}>
                        {app.program_name}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ background: '#EDE9FE', color: '#6D28D9', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' }}>
                          {app.admission_category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ background: badge.bg, color: badge.color, border: badge.border, padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px' }}>
                        {app.created_at}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div className="action-buttons" style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn-icon text-primary"
                            title="View Application"
                            onClick={() => setSelectedApp(app)}
                            style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.25)', color: '#7C3AED', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <Link
                            to="/unilms/org/admissions/documents"
                            className="btn-icon text-success"
                            title="Verify Documents"
                            style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#059669', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                          >
                            <i className="fa-solid fa-folder-open"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-folder-open" style={{ fontSize: '26px', marginBottom: '8px', display: 'block', opacity: 0.4 }}></i>
                    No applications found. Click <strong>Manual Application</strong> to create one.
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
            itemName="applications"
          />
        </div>
      </section>

      {/* ================= MANUAL APPLICATION RIGHT-SIDE DRAWER ================= */}
      <div
        className={`drawer-overlay ${isManualModalOpen ? 'active' : ''}`}
        id="manualAppModal"
        onClick={(e) => {
          if (e.target.id === 'manualAppModal') setIsManualModalOpen(false);
        }}
        style={{ zIndex: 9999 }}
      >
        <div
          className="drawer-content"
          style={{
            maxWidth: '540px',
            borderTopLeftRadius: '24px',
            borderBottomLeftRadius: '24px',
            background: '#FFFFFF'
          }}
        >
          <div
            className="drawer-header"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              color: '#fff',
              padding: '22px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTopLeftRadius: '24px',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: '700' }}>
              <i className="fa-solid fa-user-plus me-2" style={{ marginRight: '8px' }}></i> New Manual Application
            </h3>
            <button
              type="button"
              className="btn-close"
              onClick={() => setIsManualModalOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.22)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}
              title="Close"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 76px)' }}>
            <div className="drawer-body" style={{ flexGrow: 1, padding: '24px 28px', overflowY: 'auto', background: '#FFFFFF' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px', display: 'block', color: '#374151' }}>Applicant Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="form-control"
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '10px', border: '1.5px solid #E5E7EB', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px', display: 'block', color: '#374151' }}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength="10"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="form-control"
                    style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '10px', border: '1.5px solid #E5E7EB', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px', display: 'block', color: '#374151' }}>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="form-control"
                    style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '10px', border: '1.5px solid #E5E7EB', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px', display: 'block', color: '#374151' }}>Applied Degree Program *</label>
                <select
                  value={formData.program_name}
                  onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '10px', border: '1.5px solid #E5E7EB', boxSizing: 'border-box' }}
                >
                  {programsList.length > 0 ? (
                    programsList.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({p.code})</option>
                    ))
                  ) : (
                    <option value="General Degree Program">General Degree Program</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px', display: 'block', color: '#374151' }}>Admission Category</label>
                <select
                  value={formData.admission_category}
                  onChange={(e) => setFormData({ ...formData, admission_category: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '10px', border: '1.5px solid #E5E7EB', boxSizing: 'border-box' }}
                >
                  <option value="General">General Merit</option>
                  <option value="Management Quota">Management Quota</option>
                  <option value="Sports / NCC">Sports / NCC Quota</option>
                  <option value="Scholarship">Merit Scholarship</option>
                </select>
              </div>
            </div>

            <div className="drawer-footer" style={{ padding: '16px 28px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: '#F9FAFB' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsManualModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '600' }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#7C3AED', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
                Submit Application
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ================= VIEW APPLICATION RIGHT-SIDE DRAWER (WITH UNCLIPPED CLOSE BUTTON) ================= */}
      <div
        className={`drawer-overlay ${selectedApp ? 'active' : ''}`}
        id="viewAppModal"
        onClick={(e) => {
          if (e.target.id === 'viewAppModal') setSelectedApp(null);
        }}
        style={{ zIndex: 9999 }}
      >
        <div
          className="drawer-content"
          style={{
            maxWidth: '560px',
            borderTopLeftRadius: '24px',
            borderBottomLeftRadius: '24px',
            background: '#FFFFFF'
          }}
        >
          {selectedApp && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Sticky Unclipped Header with Visible Crossing Button */}
              <div
                className="drawer-header"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  color: '#fff',
                  padding: '20px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTopLeftRadius: '24px',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}
              >
                <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-id-card"></i> Application Profile
                </h3>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedApp(null)}
                  style={{
                    background: 'rgba(255,255,255,0.22)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  title="Close"
                  aria-label="Close"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Scrollable Drawer Body */}
              <div className="drawer-body" style={{ flexGrow: 1, padding: '24px 28px', overflowY: 'auto', background: '#FFFFFF' }}>
                <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EDE9FE', color: '#7C3AED', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '10px' }}>
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1F2937' }}>{selectedApp.full_name}</h3>
                  <span style={{ marginTop: '6px', display: 'inline-block', background: '#EDE9FE', color: '#6D28D9', padding: '4px 14px', borderRadius: '14px', fontSize: '12px', fontWeight: '700' }}>
                    {selectedApp.status}
                  </span>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', marginBottom: '18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Application No:</span>
                      <strong style={{ color: '#7C3AED', fontSize: '14px' }}>{selectedApp.adm_number}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Category:</span>
                      <strong style={{ color: '#1F2937', fontSize: '14px' }}>{selectedApp.admission_category}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Email:</span>
                      <span style={{ fontWeight: '600', color: '#1F2937' }}>{selectedApp.email}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Phone:</span>
                      <span style={{ fontWeight: '600', color: '#1F2937' }}>{selectedApp.phone}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Program:</span>
                      <strong style={{ color: '#1F2937' }}>{selectedApp.program_name}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Submission Date:</span>
                      <span style={{ color: '#1F2937' }}>{selectedApp.created_at}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>
                    Academic Background
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Prior Qualification:</span>
                      <span style={{ fontWeight: '600', color: '#1F2937' }}>{selectedApp.qualification}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Board / University:</span>
                      <span style={{ fontWeight: '600', color: '#1F2937' }}>{selectedApp.board}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Passing Year:</span>
                      <span style={{ fontWeight: '600', color: '#1F2937' }}>{selectedApp.passing_year}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Marks %:</span>
                      <span style={{ fontWeight: '600', color: '#059669' }}>{selectedApp.marks}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="drawer-footer"
                style={{
                  padding: '16px 28px',
                  borderTop: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#F9FAFB'
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedApp.status !== 'Approved' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(selectedApp.id, 'Approved');
                        setSelectedApp(prev => ({ ...prev, status: 'Approved' }));
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#10B981',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '13px'
                      }}
                    >
                      ✓ Approve
                    </button>
                  )}
                  {selectedApp.status !== 'Under Review' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(selectedApp.id, 'Under Review');
                        setSelectedApp(prev => ({ ...prev, status: 'Under Review' }));
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: '#fff',
                        color: '#475569',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}
                    >
                      Mark Review
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedApp(null)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: '1.5px solid #E5E7EB',
                    background: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                >
                  Close
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrgAdmissionsApplications;