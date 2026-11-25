import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import lmsStudentService from '../../../services/lmsStudent.service';

const LmsFeesIndex = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary] = useState({
    totalBilled: 0,
    totalPaid: 0,
    totalBalance: 0,
    status: 'NO_DUES'
  });

  useEffect(() => {
    const fetchFees = async () => {
      setLoading(true);
      try {
        const res = await lmsStudentService.getFees();
        const data = (res && res.data) ? res.data : res;
        if (data) {
          if (data.summary) {
            setSummary(data.summary);
          }
          if (Array.isArray(data.invoices)) {
            const formattedInvoices = data.invoices.map((inv) => {
              const billed = Number(inv.totalAmount || inv.amount || 0);
              const paid = Number(inv.paidAmount || 0);
              const bal = Number(inv.balanceAmount ?? (billed - paid));
              const isPaid = inv.status === 'PAID' || bal <= 0;
              const isPartial = inv.status === 'PARTIAL' || (paid > 0 && bal > 0);

              return {
                id: inv.id,
                invoiceNumber: inv.invoiceNumber || 'INV-DUE',
                name: inv.title || 'Term Academic Tuition & Package',
                academicYear: inv.academicYear || '2026-2027',
                semester: inv.semester || 'Semester 1',
                dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
                due: billed.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                paid: paid.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                balance: bal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                status: isPaid ? 'Paid' : isPartial ? 'Partial' : 'Pending',
                statusColor: isPaid ? '#10B981' : isPartial ? '#F59E0B' : '#EF4444',
                statusBg: isPaid ? 'rgba(16, 185, 129, 0.12)' : isPartial ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                icon: isPaid ? 'fa-circle-check' : isPartial ? 'fa-clock' : 'fa-triangle-exclamation'
              };
            });
            setInvoices(formattedInvoices);

            // Extract all verified receipts from nested payments
            const extractedReceipts = [];
            data.invoices.forEach((inv) => {
              if (Array.isArray(inv.payments)) {
                inv.payments.forEach((p) => {
                  extractedReceipts.push({
                    id: p.id,
                    receiptNo: p.receiptNumber || 'RCP-ONLINE',
                    date: p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
                    method: `${p.paymentMode || 'Digital'} Gateway`,
                    transactionRef: p.transactionRef || 'TXN-SETTLED',
                    amount: Number(p.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    status: 'Verified'
                  });
                });
              }
            });
            setReceipts(extractedReceipts);
          }
        }
      } catch (e) {
        console.warn('Failed to load live student fees:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, []);

  const {
    currentPage: feePage,
    setCurrentPage: setFeePage,
    pageSize: feeSize,
    setPageSize: setFeeSize,
    paginatedItems: paginatedInvoices,
    totalItems: totalInvoices
  } = useTablePagination(invoices, 5);

  const {
    currentPage: rPage,
    setCurrentPage: setRPage,
    pageSize: rSize,
    setPageSize: setRSize,
    paginatedItems: paginatedReceipts,
    totalItems: totalReceipts
  } = useTablePagination(receipts, 5);

  return (
    <>
      <div className="lms-page-header">
        <h1>
          <i className="fa-solid fa-indian-rupee-sign me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i>{' '}
          Fee Obligations &amp; Ledger
        </h1>
        <p>Review your academic term dues, itemized structure breakdown, and verified payment receipts.</p>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '16px'
        }}
      >
        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--primary, #4F46E5)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Total Billed Fees
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '2px', lineHeight: '1.2' }}>
            ₹{Number(summary.totalBilled || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            Assigned Semester Invoices
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--success, #10B981)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Total Amount Paid
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
            ₹{Number(summary.totalPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> Verified Official Receipts
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid #06B6D4',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Outstanding Dues
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: Number(summary.totalBalance || 0) > 0 ? '#E11D48' : '#059669', marginTop: '2px', lineHeight: '1.2' }}>
            ₹{Number(summary.totalBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10px', color: Number(summary.totalBalance || 0) > 0 ? '#E11D48' : 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            {Number(summary.totalBalance || 0) > 0 ? (
              <span><i className="fa-solid fa-triangle-exclamation me-1"></i> Payment Due</span>
            ) : (
              <span><i className="fa-solid fa-shield-halved me-1"></i> 0 Arrears / Cleared</span>
            )}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--warning, #F59E0B)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Fee Clearance
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            {summary.totalBilled > 0
              ? `${((summary.totalPaid / summary.totalBilled) * 100).toFixed(1)}% Settled`
              : '100% Settled'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            {Number(summary.totalBalance || 0) === 0 ? 'No Dues Certificate Active' : 'Fee Clearance Pending'}
          </div>
        </div>
      </div>

      {/* Fee Invoices Breakdown */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '17px', fontWeight: '800', margin: '0', color: 'var(--text-main, #0F172A)' }}>
            <i className="fa-solid fa-file-invoice me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i> Academic Fee Invoices &amp; Ledger
          </h2>
          <span className="badge" style={{
            background: Number(summary.totalBalance || 0) === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: Number(summary.totalBalance || 0) === 0 ? '#10B981' : '#EF4444',
            fontWeight: '700',
            fontSize: '11.5px',
            padding: '4px 10px',
            borderRadius: '12px'
          }}>
            {Number(summary.totalBalance || 0) === 0 ? 'Fully Settled' : 'Payment Action Required'}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-canvas, #F8FAFC)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Invoice Number &amp; Title</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Due Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Billed Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Paid Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Balance Due</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={feeSize || 3} />
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No institutional fee invoices found for this academic term.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border, #E2E8F0)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--primary, #4F46E5)', fontSize: '13px' }}>{inv.invoiceNumber}</div>
                      <div style={{ color: 'var(--text-main, #0F172A)', fontSize: '12px', marginTop: '2px' }}>{inv.name}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12.5px', color: 'var(--text-muted, #64748B)' }}>{inv.dueDate}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-main, #0F172A)' }}>₹{inv.due}</td>
                    <td style={{ padding: '14px 16px', color: '#10B981', fontWeight: '700' }}>₹{inv.paid}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: Number(inv.balance.replace(/,/g, '')) > 0 ? '#E11D48' : '#059669' }}>
                      ₹{inv.balance}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span
                        className="badge"
                        style={{
                          background: inv.statusBg,
                          color: inv.statusColor,
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className={`fa-solid ${inv.icon}`}></i> {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <TablePagination
            currentPage={feePage}
            totalItems={totalInvoices}
            pageSize={feeSize}
            onPageChange={setFeePage}
            onPageSizeChange={setFeeSize}
            itemName="invoices"
          />
        </div>
      </div>

      {/* Verified Payment Receipts */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '17px', fontWeight: '800', margin: '0', color: 'var(--text-main, #0F172A)' }}>
            <i className="fa-solid fa-receipt me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i> Verified Payment Receipts
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-canvas, #F8FAFC)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Receipt No</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Payment Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Payment Method</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Reference ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Amount Paid</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Receipt Slip</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={rSize || 2} />
              ) : paginatedReceipts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No payment receipts recorded yet.
                  </td>
                </tr>
              ) : (
                paginatedReceipts.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border, #E2E8F0)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--primary, #4F46E5)' }}>
                      {r.receiptNo}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted, #64748B)' }}>
                      {r.date}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-main, #0F172A)' }}>
                      {r.method}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted, #64748B)' }}>
                      {r.transactionRef}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '800', color: '#10B981' }}>
                      ₹{r.amount}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '11.5px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}
                      >
                        <i className="fa-solid fa-download me-1"></i> PDF Slip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <TablePagination
            currentPage={rPage}
            totalItems={totalReceipts}
            pageSize={rSize}
            onPageChange={setRPage}
            onPageSizeChange={setRSize}
            itemName="receipts"
          />
        </div>
      </div>
    </>
  );
};

export default LmsFeesIndex;
