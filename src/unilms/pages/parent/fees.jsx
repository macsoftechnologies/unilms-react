import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../components';
import { parentService } from '../../services/parent.service';

const ParentFees = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState('');
  const [feesData, setFeesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const pollTimerRef = useRef(null);

  // Load Parent's Registered Wards
  useEffect(() => {
    let isMounted = true;
    const loadChildren = async () => {
      try {
        const res = await parentService.getChildren();
        const wardList = Array.isArray(res) ? res : (res?.data || []);
        if (isMounted && wardList.length > 0) {
          setChildren(wardList);
          const firstId = wardList[0].student?.id || wardList[0].studentId;
          setActiveChildId(firstId);
        }
      } catch (err) {
        console.error('Failed to load parent wards:', err);
      }
    };
    loadChildren();
    return () => { isMounted = false; };
  }, []);

  // Fetch Fee Ledger for Active Ward
  const fetchFees = useCallback(async (silent = false) => {
    if (!activeChildId) return;
    if (!silent) setLoading(true);
    else setIsPolling(true);

    try {
      const data = await parentService.getFees(activeChildId);
      setFeesData(data);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to load fees:', err);
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, [activeChildId]);

  useEffect(() => {
    fetchFees(false);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      fetchFees(true);
    }, 30000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchFees]);

  const summary = feesData?.summary || {};
  const invoices = feesData?.invoices || [];

  // Extract all payments from invoices
  const allPayments = invoices.flatMap((inv) =>
    (inv.payments || []).map((p) => ({
      ...p,
      invoiceNumber: inv.invoiceNumber,
      invoiceTitle: inv.title,
    }))
  );

  const {
    currentPage: invPage,
    setCurrentPage: setInvPage,
    pageSize: invSize,
    setPageSize: setInvSize,
    paginatedItems: paginatedInvoices,
    totalItems: totalInvoices
  } = useTablePagination(invoices, 5);

  const {
    currentPage: payPage,
    setCurrentPage: setPayPage,
    pageSize: paySize,
    setPageSize: setPaySize,
    paginatedItems: paginatedPayments,
    totalItems: totalPayments
  } = useTablePagination(allPayments, 5);

  // Open Online Payment Flow
  const handleOpenPay = (inv) => {
    setPayingInvoice(inv);
    setPaymentAmount(inv.balanceAmount || inv.totalAmount);
    setPaymentMode('UPI');
    setIsPayModalOpen(true);
  };

  // Submit Online Payment with Confirmation Dialog
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!payingInvoice || !paymentAmount) return;

    const confirmed = await confirm({
      title: 'Confirm Institutional Online Fee Payment',
      message: `Authorize payment of ₹${Number(paymentAmount).toLocaleString('en-IN')} for invoice ${payingInvoice.invoiceNumber}?`,
      details: [
        `Invoice: ${payingInvoice.invoiceNumber} (${payingInvoice.title})`,
        `Payment Mode: ${paymentMode}`,
        `Amount to Pay: ₹${Number(paymentAmount).toLocaleString('en-IN')}`,
        `Pending Balance Remaining: ₹${Math.max(0, payingInvoice.balanceAmount - Number(paymentAmount)).toLocaleString('en-IN')}`,
      ],
      confirmText: 'Authorize & Pay Now',
      type: 'primary',
    });

    if (!confirmed) return;

    try {
      setPaymentProcessing(true);
      await parentService.payFee(activeChildId, payingInvoice.id, {
        amount: Number(paymentAmount),
        paymentMode,
        transactionRef: `UPI-APP-${Date.now()}`
      });

      setIsPayModalOpen(false);
      setPayingInvoice(null);
      await fetchFees(false);
    } catch (err) {
      console.error('Payment failure:', err);
      alert(err.message || 'Payment processing failed. Please verify funds.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div style={{ padding: '0 0 32px 0' }}>
      <ConfirmDialog />

      {/* Top Header & Ward Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Registered Ward:
          </span>
          {children.length > 0 ? (
            children.map((c) => {
              const st = c.student;
              const sId = st?.id || c.studentId;
              const isActive = sId === activeChildId;
              return (
                <button
                  key={sId}
                  type="button"
                  onClick={() => setActiveChildId(sId)}
                  style={{
                    border: 'none',
                    background: isActive ? '#4F46E5' : '#EEF2FF',
                    color: isActive ? '#fff' : '#4F46E5',
                    padding: '8px 18px',
                    borderRadius: '20px',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <i className="fa-solid fa-graduation-cap"></i>
                  {st ? `${st.firstName} ${st.lastName || ''}`.trim() : c.fatherName}
                  {isActive && <i className="fa-solid fa-circle-check ms-1" style={{ fontSize: '11px' }}></i>}
                </button>
              );
            })
          ) : (
            <span style={{ fontSize: '13px', color: '#64748B' }}>Connecting to institutional registry...</span>
          )}
        </div>

        {/* Manual Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => fetchFees(false)}
            title="Refresh Data"
            style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#4F46E5',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className={`fa-solid fa-rotate-right ${isPolling ? 'fa-spin' : ''}`}></i> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Total Billed */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #4F46E5' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Total Tuition &amp; Fees Billed</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '6px' }}>
            ₹{(summary.totalBilled || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>
            Academic Year 2026-2027
          </div>
        </div>

        {/* Total Paid */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Total Amount Paid</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '6px' }}>
            ₹{(summary.totalPaid || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#059669', marginTop: '3px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> Receipts Generated
          </div>
        </div>

        {/* Outstanding Balance */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Outstanding Balance</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: (summary.totalBalance || 0) > 0 ? '#D97706' : '#059669', marginTop: '6px' }}>
            ₹{(summary.totalBalance || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: (summary.totalBalance || 0) > 0 ? '#B45309' : '#059669', marginTop: '3px' }}>
            {(summary.totalBalance || 0) > 0 ? 'Pending Institutional Dues' : '✓ Zero Balance Dues'}
          </div>
        </div>

        {/* Standing Status */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #06B6D4' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Financial Standing</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: (summary.totalBalance || 0) > 0 ? '#D97706' : '#059669', marginTop: '8px' }}>
            {(summary.totalBalance || 0) > 0 ? 'PAYMENT REQUIRED' : 'FEE CLEARED'}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>
            No exam gate blocks applied
          </div>
        </div>
      </div>

      {/* Fee Invoices Table Card */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#4F46E5' }}></i> Academic Fee Invoices &amp; Demand Notes ({totalInvoices})
        </h3>

        {loading ? (
          <TableSkeletonLoader rows={4} columns={7} />
        ) : paginatedInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
            <i className="fa-solid fa-receipt" style={{ fontSize: '36px', color: '#CBD5E1', marginBottom: '12px' }}></i>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>No institutional fee invoices found for this student.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Invoice No</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Fee Description</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Term</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Billed</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Paid</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Balance</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((inv) => {
                    const isPaid = inv.status === 'PAID' || inv.balanceAmount <= 0;
                    const isPartial = inv.status === 'PARTIAL';

                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#4F46E5' }}>
                          {inv.invoiceNumber}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>
                          {inv.title}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>
                          {inv.semester || 'Semester 1'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>
                          ₹{inv.totalAmount?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#059669' }}>
                          ₹{inv.paidAmount?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '800', color: isPaid ? '#059669' : '#D97706' }}>
                          ₹{inv.balanceAmount?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: '800',
                            background: isPaid ? '#DCFCE7' : isPartial ? '#FEF3C7' : '#FEE2E2',
                            color: isPaid ? '#15803D' : isPartial ? '#B45309' : '#B91C1C'
                          }}>
                            {inv.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {isPaid ? (
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669' }}>
                              <i className="fa-solid fa-check me-1"></i> Cleared
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPay(inv)}
                              style={{
                                background: '#4F46E5',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                fontSize: '12.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
                              }}
                            >
                              <i className="fa-solid fa-credit-card"></i> Pay Online
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={invPage}
              setCurrentPage={setInvPage}
              pageSize={invSize}
              setPageSize={setInvSize}
              totalItems={totalInvoices}
            />
          </>
        )}
      </div>

      {/* Payment History & Receipts Table Card */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-receipt" style={{ color: '#10B981' }}></i> Institutional Receipts &amp; Payment Transactions ({totalPayments})
        </h3>

        {paginatedPayments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748B' }}>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '13.5px' }}>No previous transaction receipts logged for this account.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Receipt No</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Mode</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Txn Reference</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#059669' }}>
                        {p.receiptNumber}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>
                        {p.paymentMode || 'UPI'}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748B' }}>
                        {p.transactionRef || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: '#1E293B' }}>
                        ₹{Number(p.amountPaid)?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', background: '#DCFCE7', color: '#15803D' }}>
                          SUCCESSFUL
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={payPage}
              setCurrentPage={setPayPage}
              pageSize={paySize}
              setPageSize={setPaySize}
              totalItems={totalPayments}
            />
          </>
        )}
      </div>

      {/* Online Pay Modal */}
      {isPayModalOpen && payingInvoice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>
                <i className="fa-solid fa-credit-card text-primary me-2"></i> Institutional Online Fee Pay
              </h3>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmPayment}>
              <div style={{ marginBottom: '14px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Invoice: <strong>{payingInvoice.invoiceNumber}</strong></div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginTop: '2px' }}>{payingInvoice.title}</div>
                <div style={{ fontSize: '13px', color: '#D97706', fontWeight: '800', marginTop: '4px' }}>
                  Current Outstanding Due: ₹{payingInvoice.balanceAmount?.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Amount to Pay (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max={payingInvoice.balanceAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '16px', fontWeight: '800' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {['UPI', 'NetBanking', 'Card'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: paymentMode === mode ? '2px solid #4F46E5' : '1px solid #CBD5E1',
                        background: paymentMode === mode ? '#EEF2FF' : '#fff',
                        color: paymentMode === mode ? '#4F46E5' : '#475569',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {mode === 'UPI' && <i className="fa-solid fa-mobile-screen-button me-1"></i>}
                      {mode === 'NetBanking' && <i className="fa-solid fa-building-columns me-1"></i>}
                      {mode === 'Card' && <i className="fa-solid fa-credit-card me-1"></i>}
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentProcessing}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#4F46E5', color: '#fff', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)' }}
                >
                  {paymentProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-lock"></i>}
                  Proceed to Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentFees;
