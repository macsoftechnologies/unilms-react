import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import admissionsService from '../../../services/admissions.service';

const OrgAdmissionsOffers = () => {
  const [offers, setOffers] = useState([]);
  const [eligibleApps, setEligibleApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState(null);

  // Form State
  const [selectedAppId, setSelectedAppId] = useState('');
  const [feeAmount, setFeeAmount] = useState('85000');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const apps = await admissionsService.getApplications();
      const list = Array.isArray(apps) ? apps : [];

      // Offers list: applications that have offer issued or offerLetterSent
      const offerList = list
        .filter(a => a.offerLetterSent || a.status === 'Offer Issued' || a.status === 'Accepted' || a.status === 'Enrolled')
        .map(a => ({
          id: a.id,
          adm_number: a.applicationNumber || a.adm_number,
          full_name: a.fullName || a.full_name,
          program_name: a.programName || a.program?.name || 'Undergraduate Degree',
          fee_amount: 85000,
          due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          status: a.status === 'Enrolled' || a.status === 'Accepted' ? 'Accepted' : 'Pending',
          created_at: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB') : '—',
          offer_letter_url: a.offerLetterUrl
        }));
      setOffers(offerList);

      // Eligible for offer: submitted, under_review, approved
      const eligible = list.filter(a => !a.offerLetterSent && a.status !== 'Rejected');
      setEligibleApps(eligible);
      if (eligible.length > 0) {
        setSelectedAppId(eligible[0].id);
      }
    } catch (err) {
      console.error('Failed to load offers/apps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenModal = () => {
    if (eligibleApps.length === 0) {
      alert('No pending applications available to issue offer letter. Create an application first!');
      return;
    }
    setSelectedAppId(eligibleApps[0].id);
    setIsModalOpen(true);
  };

  const handleAppChange = (e) => {
    setSelectedAppId(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppId) {
      alert('Please select an application');
      return;
    }

    try {
      await admissionsService.issueOfferLetter(selectedAppId, {
        feeAmount: parseFloat(feeAmount) || 85000,
        dueDate
      });
      setIsModalOpen(false);
      showToast('Offer letter issued successfully!');
      loadData();
    } catch (err) {
      console.error('Issue offer error:', err);
      alert('Failed to issue offer letter.');
    }
  };

  const handleAcceptOffer = async (id) => {
    try {
      await admissionsService.updateApplicationStatus(id, 'Accepted');
      showToast('Offer status updated to Accepted!');
      loadData();
    } catch (err) {
      console.error('Accept offer error:', err);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (window.confirm('Are you sure you want to revert this offer letter?')) {
      try {
        await admissionsService.updateApplicationStatus(id, 'Approved');
        showToast('Offer reverted.');
        loadData();
      } catch (err) {
        console.error('Revert offer error:', err);
      }
    }
  };

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      offer.full_name.toLowerCase().includes(search.toLowerCase()) ||
      offer.adm_number.toLowerCase().includes(search.toLowerCase()) ||
      offer.program_name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || offer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedOffers,
    totalItems
  } = useTablePagination(filteredOffers, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, setCurrentPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)' };
      case 'Pending':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#D97706', border: '1px solid rgba(245, 158, 11, 0.25)' };
      default:
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#DC2626', border: '1px solid rgba(239, 68, 68, 0.25)' };
    }
  };

  return (
    <div className="offers-page-container">
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
              <i className="fa-solid fa-envelope-open-text"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Manage Admission Offers &amp; Letters
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Generate provisional admission offers, track due dates &amp; monitor acceptance &bull; AY 2026&ndash;2027
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
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
            </select>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenModal}
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
              <span>Generate Offer</span>
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div style={{ marginBottom: '16px', maxWidth: '380px' }}>
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
            <input
              type="text"
              placeholder="Search by app number or candidate name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', borderRadius: '10px', fontSize: '13.5px', width: '100%' }}
            />
          </div>
        </div>

        {/* Offers Table */}
        <div className="table-container" style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #F8FAFC)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>App Number</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicant Name</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Program</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fee Amount</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Date</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedOffers.length > 0 ? (
                paginatedOffers.map((offer) => {
                  const badge = getStatusBadge(offer.status);
                  return (
                    <tr key={offer.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <strong style={{ color: '#7C3AED', fontSize: '13.5px' }}>{offer.adm_number}</strong>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{offer.full_name}</strong>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13.5px' }}>
                        {offer.program_name}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontWeight: '600', color: '#1F2937' }}>
                        ₹{offer.fee_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', color: '#DC2626', fontWeight: '500' }}>
                        {offer.due_date || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ background: badge.bg, color: badge.color, border: badge.border, padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
                          {offer.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <Link
                            to={`/unilms/org/admissions/offer_letter_pdf?id=${offer.id}`}
                            className="btn btn-sm btn-outline"
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              borderRadius: '6px',
                              border: '1px solid #E5E7EB',
                              textDecoration: 'none',
                              color: '#374151',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="View / Print PDF"
                          >
                            <i className="fa-solid fa-file-pdf text-danger" style={{ color: '#EF4444' }}></i>
                            <span>PDF</span>
                          </Link>

                          {offer.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => handleAcceptOffer(offer.id)}
                              className="btn btn-sm btn-success"
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                background: '#10B981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Accept Offer"
                            >
                              <i className="fa-solid fa-check"></i>
                              <span>Accept</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteOffer(offer.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#EF4444',
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Delete Offer"
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
                    <i className="fa-solid fa-envelope-open-text" style={{ fontSize: '32px', opacity: 0.3, marginBottom: '10px', display: 'block' }}></i>
                    No offers generated yet. Click <strong>Generate Offer</strong> to create one.
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
            itemName="admission offers"
          />
        </div>
      </section>

      {/* ================= RIGHT-SIDE OFFCANVAS DRAWER: GENERATE OFFER ================= */}
      <div
        className={`drawer-overlay ${isModalOpen ? 'active' : ''}`}
        id="addModal"
        onClick={(e) => {
          if (e.target.id === 'addModal') setIsModalOpen(false);
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Drawer Header */}
            <div
              className="drawer-header"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                color: '#FFFFFF',
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
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-envelope-open-text"></i> Generate New Offer
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsModalOpen(false)}
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

            {/* Drawer Body */}
            <div className="drawer-body" style={{ flexGrow: 1, padding: '28px', background: '#FFFFFF', overflowY: 'auto' }}>
              
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                  Select Verified Application *
                </label>
                <select
                  value={selectedAppId}
                  onChange={handleAppChange}
                  className="form-control"
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    padding: '0 14px',
                    fontSize: '14px',
                    color: '#1F2937',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">-- Choose Application --</option>
                  {eligibleApps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.applicationNumber || app.adm_number} - {app.fullName || app.full_name} ({app.programName || app.program_name})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Only applications that have passed document verification are listed.
                </small>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                  Admission Fee Amount (₹) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#6B7280' }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="form-control"
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 14px 0 32px',
                      fontSize: '14px',
                      color: '#1F2937',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                  Payment Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="form-control"
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    padding: '0 14px',
                    fontSize: '14px',
                    color: '#1F2937',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <i className="fa-solid fa-circle-info" style={{ color: '#7C3AED', marginTop: '2px' }}></i>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#4B5563', lineHeight: '1.5' }}>
                    Generating this offer produces a provisional admission letter with official institution seals and allocates temporary seat reservation until the due date.
                  </p>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
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
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: '1.5px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
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
                  boxShadow: '0 3px 10px rgba(124, 58, 237, 0.3)'
                }}
              >
                Generate Offer
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default OrgAdmissionsOffers;