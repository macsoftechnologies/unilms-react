import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import admissionsService from '../../../services/admissions.service';

const STANDARD_DOCUMENTS = [
  '10th Standard Marksheet',
  '12th / Diploma Certificate',
  'Transfer Certificate',
  'Caste / Quota Certificate',
  'Aadhaar / National ID Proof'
];

const OrgAdmissionsDocuments = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Scrutiny & Upload Modal State
  const [selectedScrutinyApp, setSelectedScrutinyApp] = useState(null);
  const [isScrutinyModalOpen, setIsScrutinyModalOpen] = useState(false);
  const fileInputRefs = useRef({});

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await admissionsService.getDocuments({ search, status: statusFilter });
      setItems(Array.isArray(data) ? data : []);
      if (selectedScrutinyApp) {
        const updatedApp = (Array.isArray(data) ? data : []).find(a => a.id === selectedScrutinyApp.id);
        if (updatedApp) setSelectedScrutinyApp(updatedApp);
      }
    } catch (e) {
      console.warn('Failed to load documents:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [search, statusFilter]);

  const handleApprove = async (id) => {
    try {
      await admissionsService.updateDocumentVerification(id, { status: 'Verified' });
      showToast('All documents successfully approved & verified!');
      await loadDocuments();
    } catch (e) {
      alert('Verification update failed: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleRequestResubmit = async (id) => {
    try {
      await admissionsService.updateDocumentVerification(id, {
        status: 'Action Required',
        remarks: 'Please re-upload clear scanned copies of required certificates.'
      });
      showToast('Document resubmission notification sent to applicant.');
      await loadDocuments();
    } catch (e) {
      alert('Notification failed: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleOpenScrutiny = (app) => {
    setSelectedScrutinyApp(app);
    setIsScrutinyModalOpen(true);
  };

  const handleFileSelect = async (applicationId, docType, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await admissionsService.uploadDocument(applicationId, {
        documentType: docType,
        documentName: file.name,
        status: 'Under Review'
      });
      showToast(`Uploaded "${file.name}" for ${docType}`);
      await loadDocuments();
    } catch (err) {
      alert('Failed to upload document: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleVerifySingleDoc = async (applicationId, docType) => {
    try {
      await admissionsService.updateDocumentVerification(applicationId, {
        documentType: docType,
        status: 'Verified'
      });
      showToast(`${docType} verified!`);
      await loadDocuments();
    } catch (err) {
      alert('Verification failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRejectSingleDoc = async (applicationId, docType) => {
    try {
      await admissionsService.updateDocumentVerification(applicationId, {
        documentType: docType,
        status: 'Action Required',
        remarks: 'Please upload a clearer scanned copy.'
      });
      showToast(`${docType} flagged for resubmission.`);
      await loadDocuments();
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.adm_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.program || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredItems, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, setCurrentPage]);

  const verifiedCount = items.filter((i) => i.status === 'Verified').length;
  const underReviewCount = items.filter((i) => i.status === 'Under Review').length;
  const actionRequiredCount = items.filter((i) => i.status === 'Action Required').length;
  const pendingUploadCount = items.filter((i) => i.status === 'Pending Upload' || (i.uploaded_count === 0 && i.status !== 'Verified')).length;

  return (
    <div className="admissions-documents-container">
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
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMsg}</span>
        </div>
      )}

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
              <i className="fa-solid fa-file-circle-check"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Admission Document Scrutiny &amp; Verification
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Upload applicant certificates, inspect uploaded proofs, and authorize eligibility checks.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to="/unilms/org/admissions/applications"
              className="btn btn-primary"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '10px',
                textDecoration: 'none',
                background: '#7C3AED',
                color: '#fff',
                fontWeight: '700'
              }}
            >
              <i className="fa-solid fa-table-list"></i> Applications List
            </Link>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '20px'
          }}
        >
          <div
            className="stat-card"
            style={{
              background: 'var(--card-bg, #fff)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}
            >
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Fully Verified</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>{verifiedCount}</div>
              <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '600', marginTop: '2px' }}>Eligible for offer issue</div>
            </div>
          </div>

          <div
            className="stat-card"
            style={{
              background: 'var(--card-bg, #fff)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}
            >
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Under Review</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>{underReviewCount}</div>
              <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: '600', marginTop: '2px' }}>Scrutiny desk active</div>
            </div>
          </div>

          <div
            className="stat-card"
            style={{
              background: 'var(--card-bg, #fff)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(100, 116, 139, 0.12)',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}
            >
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pending Upload</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>{pendingUploadCount}</div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '2px' }}>Awaiting candidate docs</div>
            </div>
          </div>

          <div
            className="stat-card"
            style={{
              background: 'var(--card-bg, #fff)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}
            >
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Action Required</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>{actionRequiredCount}</div>
              <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: '600', marginTop: '2px' }}>Missing/blurred docs</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '14px 18px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '400px' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            ></i>
            <input
              type="text"
              placeholder="Search applicant name, app number, program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 38px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                background: 'var(--bg-main, #F8FAFC)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'Verified', 'Under Review', 'Pending Upload', 'Action Required'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: '1px solid',
                  borderColor: statusFilter === st ? '#10B981' : 'var(--border-color)',
                  background: statusFilter === st ? '#10B981' : 'var(--card-bg, #fff)',
                  color: statusFilter === st ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {st === 'ALL' ? 'All Applications' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Document Scrutiny Table */}
        <div
          className="table-container"
          style={{
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            overflowX: 'auto',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <table className="data-table" style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #F8FAFC)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '11.5px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>App Number</th>
                <th style={{ padding: '14px 16px', fontSize: '11.5px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicant &amp; Program</th>
                <th style={{ padding: '14px 16px', fontSize: '11.5px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                <th style={{ padding: '14px 16px', fontSize: '11.5px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scrutiny Progress</th>
                <th style={{ padding: '14px 16px', fontSize: '11.5px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '14px 16px', fontSize: '11.5px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Scrutiny Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((app) => {
                  const verifiedCount = Number(app.verified_count || 0);
                  const reqCount = Number(app.required_count || 5);
                  const uploadedCount = Number(app.uploaded_count || (app.documents?.length || 0));
                  const progressPct = reqCount > 0 ? Math.round((verifiedCount / reqCount) * 100) : 0;
                  const isZeroDocs = uploadedCount === 0 && verifiedCount === 0;

                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontWeight: '800', color: '#10B981', fontSize: '13px' }}>{app.adm_number}</span>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{app.submitted_date}</div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>{app.full_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{app.program}</div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ background: 'rgba(99, 102, 241, 0.08)', color: '#4F46E5', padding: '3px 9px', borderRadius: '6px', fontWeight: '700', fontSize: '12px' }}>
                          {app.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', minWidth: '220px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                          <span>{verifiedCount} of {reqCount} Docs</span>
                          <span style={{ color: isZeroDocs ? '#94A3B8' : (verifiedCount === reqCount ? '#059669' : '#D97706') }}>
                            {progressPct}%
                          </span>
                        </div>
                        <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${progressPct}%`,
                              height: '100%',
                              background: verifiedCount === reqCount ? '#10B981' : '#F59E0B',
                              borderRadius: '3px',
                              transition: 'width 0.3s ease'
                            }}
                          ></div>
                        </div>
                        {isZeroDocs ? (
                          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontStyle: 'italic' }}>
                            <i className="fa-solid fa-circle-info me-1"></i> No documents uploaded yet (All 5 Required)
                          </div>
                        ) : (
                          app.pending_docs && app.pending_docs.length > 0 && (
                            <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>
                              Pending: {app.pending_docs.join(', ')}
                            </div>
                          )
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            background:
                              app.status === 'Verified'
                                ? 'rgba(16, 185, 129, 0.12)'
                                : app.status === 'Under Review'
                                ? 'rgba(245, 158, 11, 0.12)'
                                : app.status === 'Pending Upload' || isZeroDocs
                                ? 'rgba(148, 163, 184, 0.15)'
                                : 'rgba(239, 68, 68, 0.12)',
                            color:
                              app.status === 'Verified'
                                ? '#059669'
                                : app.status === 'Under Review'
                                ? '#D97706'
                                : app.status === 'Pending Upload' || isZeroDocs
                                ? '#64748B'
                                : '#DC2626',
                            border:
                              app.status === 'Verified'
                                ? '1px solid rgba(16, 185, 129, 0.25)'
                                : app.status === 'Under Review'
                                ? '1px solid rgba(245, 158, 11, 0.25)'
                                : app.status === 'Pending Upload' || isZeroDocs
                                ? '1px solid rgba(148, 163, 184, 0.3)'
                                : '1px solid rgba(239, 68, 68, 0.25)',
                            padding: '4px 10px',
                            borderRadius: '14px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {app.status === 'Verified' && <i className="fa-solid fa-circle-check me-1"></i>}
                          {app.status === 'Under Review' && <i className="fa-solid fa-clock-rotate-left me-1"></i>}
                          {(app.status === 'Pending Upload' || isZeroDocs) && <i className="fa-solid fa-cloud-arrow-up me-1"></i>}
                          {app.status === 'Action Required' && <i className="fa-solid fa-triangle-exclamation me-1"></i>}
                          {isZeroDocs && app.status !== 'Verified' ? 'Pending Upload' : app.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenScrutiny(app)}
                            className="btn btn-sm"
                            style={{
                              padding: '5px 12px',
                              fontSize: '12px',
                              background: 'rgba(99, 102, 241, 0.1)',
                              color: '#4F46E5',
                              border: '1px solid rgba(99, 102, 241, 0.25)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            title="Inspect Documents & Upload"
                          >
                            <i className="fa-solid fa-folder-open"></i>
                            <span>Inspect &amp; Upload</span>
                          </button>

                          {app.status !== 'Verified' ? (
                            <button
                              type="button"
                              onClick={() => handleApprove(app.id)}
                              className="btn btn-sm btn-success"
                              style={{
                                padding: '5px 12px',
                                fontSize: '12px',
                                background: '#10B981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              title="Approve & Mark All Verified"
                            >
                              <i className="fa-solid fa-check"></i>
                              <span>Approve</span>
                            </button>
                          ) : (
                            <span style={{ color: '#059669', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <i className="fa-solid fa-check-double"></i> Verified
                            </span>
                          )}

                          {app.status !== 'Action Required' && app.status !== 'Verified' && (
                            <button
                              type="button"
                              onClick={() => handleRequestResubmit(app.id)}
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                color: '#DC2626',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                              title="Request Re-upload"
                            >
                              <i className="fa-solid fa-rotate-left"></i> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-folder-open" style={{ fontSize: '32px', opacity: 0.3, marginBottom: '10px', display: 'block' }}></i>
                    No document applications found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

      {/* ================= DOCUMENT SCRUTINY & UPLOAD MODAL ================= */}
      {isScrutinyModalOpen && selectedScrutinyApp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsScrutinyModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '780px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              animation: 'modalFadeIn 0.2s ease-out'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #090E1A 0%, #111A33 35%, #182852 70%, #203A78 100%)',
                color: '#fff',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span
                  style={{
                    background: 'rgba(129, 140, 248, 0.18)',
                    border: '1px solid rgba(129, 140, 248, 0.3)',
                    color: '#C7D2FE',
                    fontSize: '10.5px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    display: 'inline-block',
                    marginBottom: '4px'
                  }}
                >
                  Statutory Scrutiny Desk
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
                  Applicant Document Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScrutinyModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
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
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Applicant Summary Banner */}
            <div
              style={{
                padding: '16px 24px',
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                  {selectedScrutinyApp.full_name}
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                  <strong style={{ color: '#4F46E5' }}>{selectedScrutinyApp.adm_number}</strong> &bull; {selectedScrutinyApp.program} &bull; <span style={{ background: '#EDE9FE', color: '#6D28D9', padding: '1px 6px', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>{selectedScrutinyApp.category}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Scrutiny Standing</span>
                <div style={{ fontSize: '14px', fontWeight: '800', color: selectedScrutinyApp.status === 'Verified' ? '#059669' : '#D97706' }}>
                  {selectedScrutinyApp.status}
                </div>
              </div>
            </div>

            {/* Modal Body - 5 Mandatory Documents Checklist */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                Mandatory Statutory Checklist (5 Documents)
              </div>

              {STANDARD_DOCUMENTS.map((docType) => {
                const uploadedDoc = (selectedScrutinyApp.documents || []).find(
                  (d) => d.documentType === docType
                );
                const isVerified = uploadedDoc?.status === 'Verified' || selectedScrutinyApp.status === 'Verified';
                const isActionRequired = uploadedDoc?.status === 'Action Required';
                const isUnderReview = uploadedDoc && uploadedDoc.status !== 'Verified' && uploadedDoc.status !== 'Action Required';
                const isUploaded = Boolean(uploadedDoc);

                return (
                  <div
                    key={docType}
                    style={{
                      border: '1px solid',
                      borderColor: isVerified ? 'rgba(16, 185, 129, 0.4)' : (isActionRequired ? 'rgba(239, 68, 68, 0.4)' : (isUploaded ? '#CBD5E1' : '#E2E8F0')),
                      background: isVerified ? 'rgba(16, 185, 129, 0.03)' : (isActionRequired ? 'rgba(239, 68, 68, 0.03)' : '#FFFFFF'),
                      borderRadius: '12px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: isVerified ? 'rgba(16, 185, 129, 0.12)' : (isUploaded ? 'rgba(99, 102, 241, 0.12)' : 'rgba(148, 163, 184, 0.15)'),
                          color: isVerified ? '#10B981' : (isUploaded ? '#4F46E5' : '#94A3B8'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px'
                        }}
                      >
                        <i className={`fa-solid ${isVerified ? 'fa-circle-check' : (isUploaded ? 'fa-file-pdf' : 'fa-file-arrow-up')}`}></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1E293B' }}>
                          {docType}
                        </div>
                        <div style={{ fontSize: '11.5px', color: isUploaded ? '#64748B' : '#DC2626', marginTop: '2px' }}>
                          {isUploaded ? (
                            <span><i className="fa-solid fa-paperclip me-1"></i> {uploadedDoc.documentName || `${docType}.pdf`}</span>
                          ) : (
                            <span><i className="fa-solid fa-triangle-exclamation me-1"></i> Not Uploaded Yet</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Status Tag */}
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: isVerified ? 'rgba(16, 185, 129, 0.12)' : (isActionRequired ? 'rgba(239, 68, 68, 0.12)' : (isUploaded ? 'rgba(245, 158, 11, 0.12)' : 'rgba(148, 163, 184, 0.15)')),
                          color: isVerified ? '#059669' : (isActionRequired ? '#DC2626' : (isUploaded ? '#D97706' : '#64748B'))
                        }}
                      >
                        {isVerified ? 'Verified' : (isActionRequired ? 'Action Required' : (isUploaded ? 'Under Review' : 'Missing'))}
                      </span>

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        ref={(el) => (fileInputRefs.current[docType] = el)}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect(selectedScrutinyApp.id, docType, e)}
                      />

                      {/* Upload / Re-upload Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[docType]?.click()}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '7px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#334155',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        title={isUploaded ? 'Re-upload Document' : 'Upload Document'}
                      >
                        <i className="fa-solid fa-cloud-arrow-up" style={{ color: '#4F46E5' }}></i>
                        {isUploaded ? 'Re-upload' : 'Upload'}
                      </button>

                      {/* Verify Single Doc Button */}
                      {isUploaded && !isVerified && (
                        <button
                          type="button"
                          onClick={() => handleVerifySingleDoc(selectedScrutinyApp.id, docType)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '7px',
                            border: 'none',
                            background: '#10B981',
                            color: '#FFFFFF',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Verify Document"
                        >
                          <i className="fa-solid fa-check"></i>
                          Verify
                        </button>
                      )}

                      {/* Flag Re-upload Button */}
                      {isUploaded && !isActionRequired && (
                        <button
                          type="button"
                          onClick={() => handleRejectSingleDoc(selectedScrutinyApp.id, docType)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '7px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#DC2626',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                          title="Flag Issue / Request Re-upload"
                        >
                          <i className="fa-solid fa-flag"></i>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <button
                type="button"
                onClick={() => setIsScrutinyModalOpen(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Close Desk
              </button>

              <button
                type="button"
                onClick={async () => {
                  await handleApprove(selectedScrutinyApp.id);
                  setIsScrutinyModalOpen(false);
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <i className="fa-solid fa-check-double"></i>
                Approve &amp; Verify All Documents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgAdmissionsDocuments;
