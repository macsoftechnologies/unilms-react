import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import admissionsService from '../../../services/admissions.service';

const OrgAdmissionsPayments = () => {
  const [payments, setPayments] = useState([]);
  const [candidatesWithOffers, setCandidatesWithOffers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptModalData, setReceiptModalData] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [toastMsg, setToastMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [amount, setAmount] = useState('85000');
  const [paymentMode, setPaymentMode] = useState('UPI / QR');
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [payData, appsData] = await Promise.all([
        admissionsService.getPayments(),
        admissionsService.getApplications()
      ]);

      setPayments(Array.isArray(payData) ? payData : []);

      const eligible = (Array.isArray(appsData) ? appsData : []).map(a => ({
        id: a.id,
        adm_number: a.applicationNumber || a.adm_number,
        full_name: a.fullName || a.full_name,
        program: a.programName || a.program?.name || 'Undergraduate Degree',
        fee_due: 85000
      }));
      setCandidatesWithOffers(eligible);
    } catch (e) {
      console.warn('Failed to load payments/candidates:', e);
      setPayments([]);
      setCandidatesWithOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setReceiptModalData(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenModal = () => {
    if (candidatesWithOffers.length > 0) {
      const defaultCand = candidatesWithOffers[0];
      setSelectedOfferId(defaultCand.id.toString());
      setAmount((defaultCand.fee_due || 85000).toString());
    } else {
      setSelectedOfferId('');
      setAmount('85000');
    }
    setPaymentMode('UPI / QR');
    setReference('TXN-' + Math.floor(100000 + Math.random() * 900000));
    setRemarks('');
    setIsModalOpen(true);
  };

  const handleCandidateChange = (e) => {
    const id = e.target.value;
    setSelectedOfferId(id);
    const found = candidatesWithOffers.find((c) => c.id.toString() === id);
    if (found) {
      setAmount((found.fee_due || 85000).toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const candidate = candidatesWithOffers.find((c) => c.id.toString() === selectedOfferId);
    if (!candidate) {
      alert('Please select a candidate');
      return;
    }

    try {
      await admissionsService.createPayment({
        application_id: candidate.id,
        full_name: candidate.full_name,
        amount: parseFloat(amount) || 85000,
        payment_mode: paymentMode,
        gateway_reference: reference || 'N/A',
        remarks: remarks || null
      });

      setIsModalOpen(false);
      showToast(`Payment of ₹${Number(amount).toLocaleString('en-IN')} recorded for ${candidate.full_name}!`);
      await loadData();
    } catch (err) {
      alert('Failed to record payment: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.adm_number.toLowerCase().includes(search.toLowerCase()) ||
      p.receipt_number.toLowerCase().includes(search.toLowerCase());

    const matchesMode = filterMode === 'ALL' || p.payment_mode === filterMode;
    return matchesSearch && matchesMode;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedPayments,
    totalItems
  } = useTablePagination(filteredPayments, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterMode, setCurrentPage]);

  const totalCollected = payments.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="payments-ledger-container">
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
            padding: '12px 22px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '600',
            animation: 'modalFadeIn 0.2s ease'
          }}
        >
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      <section className="view-section active">
        {/* View Header with matching button */}
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
              <i className="fa-solid fa-indian-rupee-sign"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Candidate Fee Collection &amp; Payments Ledger
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Track application fees, seat confirmation deposits &amp; manual transaction receipts
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
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
              <span>Record Manual Payment</span>
            </button>
            <Link
              to="/unilms/org/admissions/enrollment"
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
              <i className="fa-solid fa-user-plus" style={{ color: '#0D9488' }}></i>
              <span>Enrollment</span>
            </Link>
          </div>
        </div>

        {/* Statistical KPI Cards - Modern Compact Reference Cards */}
        <div className="faculty-kpi-grid">
          {/* Card 1: Total Collected */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <i className="fa-solid fa-indian-rupee-sign"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Total Collected</div>
              <div className="faculty-metric-value" style={{ color: '#059669' }}>
                ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>Across {payments.length} verified receipts</span>
              </div>
            </div>
          </div>

          {/* Card 2: Transactions Completed */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
              <i className="fa-solid fa-receipt"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Transactions Completed</div>
              <div className="faculty-metric-value" style={{ color: '#7C3AED' }}>{payments.length}</div>
              <div className="faculty-metric-sub" style={{ color: '#7C3AED' }}>
                <i className="fa-solid fa-bolt"></i>
                <span>100% verified receipts</span>
              </div>
            </div>
          </div>

          {/* Card 3: Average Ticket Size */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' }}>
              <i className="fa-solid fa-scale-balanced"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Average Ticket Size</div>
              <div className="faculty-metric-value" style={{ color: '#2563EB' }}>
                ₹{payments.length > 0 ? (totalCollected / payments.length).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}
              </div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Per candidate intake</span>
              </div>
            </div>
          </div>

          {/* Card 4: Payment Gateways */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <i className="fa-solid fa-credit-card"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Payment Gateways</div>
              <div className="faculty-metric-value" style={{ color: '#D97706' }}>Online + Manual</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>UPI, NEFT, Cheque & Cash</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div style={{ marginBottom: '16px', maxWidth: '380px', width: '100%' }}>
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
            <input
              type="text"
              placeholder="Search by receipt, app number, or candidate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', borderRadius: '10px', fontSize: '13.5px', width: '100%' }}
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="table-container" style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '14px', border: '1px solid var(--border-color)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #F8FAFC)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receipt No.</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>App Number</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicant Name</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount Paid</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mode</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={8} rows={pageSize || 5} />
              ) : paginatedPayments.length > 0 ? (
                paginatedPayments.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <strong style={{ color: '#7C3AED', fontSize: '13.5px' }}>{payment.receipt_number}</strong>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', color: '#4B5563' }}>
                      {payment.adm_number}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{payment.full_name}</strong>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontWeight: '700', color: '#10B981', fontSize: '14px' }}>
                      ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span style={{ background: '#F3F4F6', color: '#374151', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                        {payment.payment_mode}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
                        <i className="fa-solid fa-circle-check me-1" style={{ fontSize: '10px' }}></i> {payment.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', color: '#6B7280' }}>
                      {payment.created_at}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setReceiptModalData(payment)}
                        className="btn btn-sm btn-outline"
                        style={{
                          padding: '5px 12px',
                          fontSize: '12.5px',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB',
                          color: '#374151',
                          background: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="fa-solid fa-receipt text-primary" style={{ color: '#7C3AED' }}></i>
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-receipt" style={{ fontSize: '32px', opacity: 0.3, marginBottom: '10px', display: 'block' }}></i>
                    No payment records found. Click <strong>Record Manual Payment</strong> above to add one.
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
            itemName="payment transactions"
          />
        </div>
      </section>

      {/* ================= RIGHT-SIDE OFFCANVAS DRAWER: RECORD MANUAL PAYMENT ================= */}
      <div
        className={`drawer-overlay ${isModalOpen ? 'active' : ''}`}
        id="payModal"
        onClick={(e) => {
          if (e.target.id === 'payModal') setIsModalOpen(false);
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
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-receipt"></i> Record Manual Payment
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
            <div className="drawer-body" style={{ flexGrow: 1, padding: '26px 28px', background: '#FFFFFF', overflowY: 'auto' }}>
              
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                  Select Admission Offer / Student <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={selectedOfferId}
                  onChange={handleCandidateChange}
                  className="form-control"
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    padding: '0 14px',
                    fontSize: '13.5px',
                    color: '#1F2937',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">-- Choose Candidate --</option>
                  {candidatesWithOffers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.adm_number} — {c.full_name} (Due: ₹{c.fee_due.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Select the student who has accepted an offer letter.
                </small>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                  Amount Paid (₹) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#6B7280' }}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="form-control"
                    required
                    placeholder="e.g. 85000"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    Payment Mode <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="form-control"
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 12px',
                      fontSize: '13.5px',
                      color: '#1F2937',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque / DD">Cheque / Demand Draft</option>
                    <option value="Cash">Cash</option>
                    <option value="Debit/Credit Card">Debit / Credit Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    Reference / Txn ID
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="form-control"
                    placeholder="e.g. UTR123456"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 14px',
                      fontSize: '13.5px',
                      color: '#1F2937',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                  Internal Notes / Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="form-control"
                  rows="2"
                  placeholder="Optional verification note or counter cash memo number..."
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    padding: '10px 14px',
                    fontSize: '13.5px',
                    color: '#1F2937',
                    boxSizing: 'border-box'
                  }}
                ></textarea>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <i className="fa-solid fa-circle-info" style={{ color: '#7C3AED', marginTop: '2px' }}></i>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#4B5563', lineHeight: '1.5' }}>
                    Recording this manual payment marks the candidate&apos;s offer dues as settled and permits advancement to <strong>Final Enrollment</strong>.
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
                <i className="fa-solid fa-check me-1"></i> Save Payment & Issue Receipt
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* ================= RECEIPT VIEW MODAL ================= */}
      {receiptModalData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px'
          }}
          onClick={() => setReceiptModalData(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '500px',
              width: '100%',
              padding: 'clamp(18px, 4vw, 32px)',
              boxSizing: 'border-box',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #E2E8F0', paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '22px' }}>
                <i className="fa-solid fa-receipt"></i>
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#1E1B4B' }}>Official Payment Receipt</h3>
              <div style={{ fontSize: '13px', color: '#64748B' }}>Receipt: <strong>{receiptModalData.receipt_number}</strong></div>
            </div>

            <div style={{ fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Applicant Name:</span>
                <strong style={{ color: '#1E293B' }}>{receiptModalData.full_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Application Number:</span>
                <strong style={{ color: '#7C3AED' }}>{receiptModalData.adm_number}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Payment Mode:</span>
                <strong style={{ color: '#1E293B' }}>{receiptModalData.payment_mode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Transaction Reference:</span>
                <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{receiptModalData.gateway_reference}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Date & Time:</span>
                <strong style={{ color: '#1E293B' }}>{receiptModalData.created_at}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1E1B4B' }}>Total Amount Paid:</span>
                <strong style={{ fontSize: '18px', fontWeight: '800', color: '#10B981' }}>
                  ₹{receiptModalData.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  background: '#7C3AED',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-print me-1"></i> Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setReceiptModalData(null)}
                className="btn btn-outline"
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  color: '#475569',
                  background: '#FFFFFF',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgAdmissionsPayments;