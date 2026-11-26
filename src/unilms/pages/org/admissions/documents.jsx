import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import admissionsService from '../../../services/admissions.service';

const OrgAdmissionsDocuments = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await admissionsService.getDocuments({ search, status: statusFilter });
      setItems(Array.isArray(data) ? data : []);
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
      showToast('Documents successfully approved & verified!');
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

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.full_name.toLowerCase().includes(search.toLowerCase()) ||
      item.adm_number.toLowerCase().includes(search.toLowerCase()) ||
      item.program.toLowerCase().includes(search.toLowerCase());
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
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Scrutinize uploaded certificates, identity proofs &amp; eligibility documents
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              to="/unilms/org/admissions/applications"
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '700',
                fontSize: '13px',
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#fff',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-id-card"></i>
              <span>Applications List</span>
            </Link>
            <Link
              to="/unilms/org/admissions/dashboard"
              className="btn btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '700',
                fontSize: '13px',
                padding: '10px 18px',
                borderRadius: '10px',
                textDecoration: 'none',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg, #fff)',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-graduation-cap" style={{ color: '#059669' }}></i>
              <span>Admissions CRM</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="faculty-kpi-grid" style={{ marginBottom: '22px' }}>
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Fully Verified</div>
              <div className="faculty-metric-value" style={{ color: '#059669' }}>{verifiedCount}</div>
              <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                <span>Eligible for offer issue</span>
              </div>
            </div>
          </div>

          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Under Review</div>
              <div className="faculty-metric-value" style={{ color: '#D97706' }}>{underReviewCount}</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary)' }}>
                <span>Scrutiny desk active</span>
              </div>
            </div>
          </div>

          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Action Required</div>
              <div className="faculty-metric-value" style={{ color: '#DC2626' }}>{actionRequiredCount}</div>
              <div className="faculty-metric-sub" style={{ color: '#DC2626' }}>
                <span>Missing/blurred docs</span>
              </div>
            </div>
          </div>

          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5' }}>
              <i className="fa-solid fa-folder-tree"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Total Applicants Audited</div>
              <div className="faculty-metric-value" style={{ color: '#4F46E5' }}>{items.length}</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary)' }}>
                <span>Round 1 admissions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
            <input
              type="text"
              placeholder="Search applicant name, app number, program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', borderRadius: '10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'Verified', 'Under Review', 'Action Required'].map((st) => (
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
          <table className="data-table" style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                paginatedItems.map((app) => (
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
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', minWidth: '180px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                        <span>{app.verified_count} of {app.required_count} Docs</span>
                        <span style={{ color: app.verified_count === app.required_count ? '#059669' : '#D97706' }}>
                          {Math.round((app.verified_count / app.required_count) * 100)}%
                        </span>
                      </div>
                      <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <div
                          style={{
                            width: `${(app.verified_count / app.required_count) * 100}%`,
                            height: '100%',
                            background: app.verified_count === app.required_count ? '#10B981' : '#F59E0B',
                            borderRadius: '3px'
                          }}
                        ></div>
                      </div>
                      {app.pending_docs.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>
                          Pending: {app.pending_docs.join(', ')}
                        </div>
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
                              : 'rgba(239, 68, 68, 0.12)',
                          color:
                            app.status === 'Verified'
                              ? '#059669'
                              : app.status === 'Under Review'
                              ? '#D97706'
                              : '#DC2626',
                          border:
                            app.status === 'Verified'
                              ? '1px solid rgba(16, 185, 129, 0.25)'
                              : app.status === 'Under Review'
                              ? '1px solid rgba(245, 158, 11, 0.25)'
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
                        {app.status === 'Action Required' && <i className="fa-solid fa-triangle-exclamation me-1"></i>}
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
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
                            title="Approve & Mark Verified"
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
                ))
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
    </div>
  );
};

export default OrgAdmissionsDocuments;
