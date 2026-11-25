import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import financeService from '../../../services/finance.service';

const numberToWords = (num) => {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'Overflow';
    const nArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArr) return '';
    let str = '';
    str += Number(nArr[1]) !== 0 ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'Crore ' : '';
    str += Number(nArr[2]) !== 0 ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'Lakh ' : '';
    str += Number(nArr[3]) !== 0 ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'Thousand ' : '';
    str += Number(nArr[4]) !== 0 ? (a[Number(nArr[4])] || b[nArr[4][0]] + ' ' + a[nArr[4][1]]) + 'Hundred ' : '';
    str += Number(nArr[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) : '';
    return str.trim();
  };
  return inWords(Math.round(num)) + ' Rupees Only';
};

const OrgFeesCollections = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  const [toastMsg, setToastMsg] = useState(null);

  // Collect Payment Modal State
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [collecting, setCollecting] = useState(false);

  // Receipt Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await financeService.getInvoices();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setInvoices(list);
    } catch (e) {
      console.error('Failed to load collections invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // KPI Calculations
  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
  const pendingDues = invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount || 0), 0);
  const now = new Date();
  const overdueInvoices = invoices.filter(inv => Number(inv.balanceAmount) > 0 && new Date(inv.dueDate) < now);
  const overdueCount = overdueInvoices.length;

  // Filter & Search Logic
  const filteredInvoices = invoices.filter((inv) => {
    const sName = `${inv.student?.firstName || ''} ${inv.student?.lastName || ''}`.toLowerCase();
    const roll = (inv.student?.rollNumber || '').toLowerCase();
    const invNum = (inv.invoiceNumber || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = !term || sName.includes(term) || roll.includes(term) || invNum.includes(term);
    if (!matchesSearch) return false;

    if (filterTab === 'ALL') return true;
    if (filterTab === 'PENDING') return inv.status === 'PENDING';
    if (filterTab === 'PARTIAL') return inv.status === 'PARTIAL';
    if (filterTab === 'PAID') return inv.status === 'PAID';
    if (filterTab === 'OVERDUE') return Number(inv.balanceAmount) > 0 && new Date(inv.dueDate) < now;
    return true;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredInvoices, 10);

  // Open Collect Payment Modal
  const openCollectModal = (inv) => {
    setSelectedInvoice(inv);
    setCollectAmount(String(inv.balanceAmount || inv.totalAmount));
    setPaymentMode('UPI');
    setTransactionRef(`UTR-${Date.now().toString().slice(-6)}`);
    setIsCollectModalOpen(true);
  };

  // Submit Payment & Pop Receipt
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amt = Number(collectAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    if (amt > Number(selectedInvoice.balanceAmount)) {
      alert(`Amount (₹${amt.toLocaleString()}) cannot exceed balance due (₹${Number(selectedInvoice.balanceAmount).toLocaleString()}).`);
      return;
    }

    const confirmed = await confirm({
      title: 'Confirm Fee Payment Collection',
      message: `Collect ₹${amt.toLocaleString()} from ${selectedInvoice.student?.firstName || 'Student'} ${selectedInvoice.student?.lastName || ''}?`,
      details: [
        `Invoice: ${selectedInvoice.invoiceNumber || selectedInvoice.id}`,
        `Payment Mode: ${paymentMode}`,
        `Reference / UTR: ${transactionRef || 'N/A'}`,
        `Remaining Balance: ₹${Math.max(0, Number(selectedInvoice.balanceAmount) - amt).toLocaleString()}`
      ],
      confirmText: 'Yes, Record Payment',
      variant: 'success',
      icon: 'fa-solid fa-receipt'
    });
    if (!confirmed) return;

    setCollecting(true);
    try {
      const res = await financeService.recordPayment({
        invoiceId: selectedInvoice.id,
        amountPaid: amt,
        paymentMode: paymentMode,
        transactionRef: transactionRef || undefined,
      });

      const paymentRecord = res?.data || res;
      setIsCollectModalOpen(false);
      showToast(`Payment of ₹${amt.toLocaleString()} recorded successfully!`);

      // Immediately fetch and display official receipt
      if (paymentRecord?.id || paymentRecord?.receiptNumber) {
        await openReceiptModal(paymentRecord.receiptNumber || paymentRecord.id);
      }
      await loadData();
    } catch (err) {
      alert('Payment collection failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setCollecting(false);
    }
  };

  // Open Receipt Modal
  const openReceiptModal = async (receiptIdOrPaymentId) => {
    setLoadingReceipt(true);
    setIsReceiptModalOpen(true);
    try {
      const res = await financeService.getPaymentReceipt(receiptIdOrPaymentId);
      const data = res?.data || res;
      setReceiptData(data);
    } catch (err) {
      console.error('Failed to load receipt:', err);
      alert('Could not fetch receipt: ' + (err.response?.data?.message || err.message));
      setIsReceiptModalOpen(false);
    } finally {
      setLoadingReceipt(false);
    }
  };

  // Open latest receipt for an invoice row
  const viewInvoiceReceipt = (inv) => {
    if (inv.payments && inv.payments.length > 0) {
      openReceiptModal(inv.payments[0].receiptNumber || inv.payments[0].id);
    } else {
      alert('No payments recorded for this invoice yet.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)', animation: 'fadeIn 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
          </div>
        )}

        {/* Top Header Card */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '20px 24px',
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
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
              }}
            >
              <i className="fa-solid fa-cash-register"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Fee Collections &amp; Cashier Counter
                </h2>
                <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                  ERP DESK 3
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Collect student installments, issue instant university fee receipt vouchers, and monitor overdue accounts
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/unilms/org/fees/matrix" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '9px 14px', borderRadius: '8px', textDecoration: 'none' }}>
              <i className="fa-solid fa-layer-group"></i> Fee Matrix
            </Link>
            <Link to="/unilms/org/fees/invoicing" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '9px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700' }}>
              <i className="fa-solid fa-plus"></i> Issue New Invoices
            </Link>
          </div>
        </div>

        {/* 4 Financial KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '22px' }}>
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Demands Billed</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                ₹{totalBilled.toLocaleString()}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{invoices.length} Invoices Issued</div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fa-solid fa-file-invoice-dollar"></i>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Collected (Bank/Cash)</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                ₹{totalCollected.toLocaleString()}
              </div>
              <div style={{ fontSize: '11.5px', color: '#059669', marginTop: '2px', fontWeight: '600' }}>
                {totalBilled > 0 ? `${Math.round((totalCollected / totalBilled) * 100)}% Collected` : '0%'}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Outstanding Net Dues</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>
                ₹{pendingDues.toLocaleString()}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Awaiting settlement</div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fa-solid fa-clock"></i>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Overdue Defaulters</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>
                {overdueCount} Accounts
              </div>
              <div style={{ fontSize: '11.5px', color: '#DC2626', marginTop: '2px', fontWeight: '600' }}>Past Due Date</div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterTab('ALL')}
              style={{
                border: 'none',
                background: filterTab === 'ALL' ? '#2563EB' : 'transparent',
                color: filterTab === 'ALL' ? '#fff' : 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '12.5px',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              All Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setFilterTab('PENDING')}
              style={{
                border: 'none',
                background: filterTab === 'PENDING' ? '#DC2626' : 'transparent',
                color: filterTab === 'PENDING' ? '#fff' : 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '12.5px',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Pending ({invoices.filter(i => i.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilterTab('PARTIAL')}
              style={{
                border: 'none',
                background: filterTab === 'PARTIAL' ? '#D97706' : 'transparent',
                color: filterTab === 'PARTIAL' ? '#fff' : 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '12.5px',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Partial Installments ({invoices.filter(i => i.status === 'PARTIAL').length})
            </button>
            <button
              onClick={() => setFilterTab('PAID')}
              style={{
                border: 'none',
                background: filterTab === 'PAID' ? '#059669' : 'transparent',
                color: filterTab === 'PAID' ? '#fff' : 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '12.5px',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Settled / Paid ({invoices.filter(i => i.status === 'PAID').length})
            </button>
            <button
              onClick={() => setFilterTab('OVERDUE')}
              style={{
                border: 'none',
                background: filterTab === 'OVERDUE' ? '#7F1D1D' : 'transparent',
                color: filterTab === 'OVERDUE' ? '#fff' : '#DC2626',
                fontWeight: '700',
                fontSize: '12.5px',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-bell me-1"></i> Overdue Defaulters ({overdueCount})
            </button>
          </div>

          <div style={{ position: 'relative', minWidth: '260px' }}>
            <i className="fa-solid fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}></i>
            <input
              type="text"
              placeholder="Search by student, roll, or inv #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '34px', fontSize: '13px', borderRadius: '8px' }}
            />
          </div>
        </div>

        {/* Invoices Table */}
        <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--border-color)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Student Information</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Program &amp; Term</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Invoice Number</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Paid (₹)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>Balance Due (₹)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Due Date</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Counter Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && !loading && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No invoices found matching criteria. Go to Billing Desk to issue demands.
                    </td>
                  </tr>
                )}
                {paginatedItems.map((inv) => {
                  const isOverdue = Number(inv.balanceAmount) > 0 && new Date(inv.dueDate) < now;
                  const hasPayments = inv.payments && inv.payments.length > 0;

                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                          {inv.student?.firstName} {inv.student?.lastName || ''}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', fontSize: '10.5px' }}>
                            {inv.student?.rollNumber || 'No Roll'}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                          {inv.student?.program?.code || 'DEGREE'} &bull; {inv.semester || 'Sem 1'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={inv.title}>
                          {inv.title || 'Term Tuition Package'}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#2563EB' }}>
                        {inv.invoiceNumber}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700' }}>
                        ₹{Number(inv.totalAmount).toLocaleString()}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                        ₹{Number(inv.paidAmount).toLocaleString()}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: Number(inv.balanceAmount) > 0 ? '#DC2626' : '#059669', fontSize: '14px' }}>
                        ₹{Number(inv.balanceAmount).toLocaleString()}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px' }}>
                        <div style={{ fontWeight: isOverdue ? '800' : '600', color: isOverdue ? '#DC2626' : 'var(--text-secondary)' }}>
                          {new Date(inv.dueDate).toLocaleDateString('en-GB')}
                        </div>
                        {isOverdue && (
                          <span className="badge" style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '10px', fontWeight: '700' }}>
                            OVERDUE
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          className="badge"
                          style={{
                            background: inv.status === 'PAID' ? '#D1FAE5' : inv.status === 'PARTIAL' ? '#FEF3C7' : '#FEE2E2',
                            color: inv.status === 'PAID' ? '#059669' : inv.status === 'PARTIAL' ? '#D97706' : '#DC2626',
                            fontWeight: '700',
                            fontSize: '11px'
                          }}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {Number(inv.balanceAmount) > 0 && (
                            <button
                              onClick={() => openCollectModal(inv)}
                              className="btn btn-primary"
                              style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '6px', fontWeight: '700', background: '#059669', borderColor: '#059669' }}
                            >
                              <i className="fa-solid fa-indian-rupee-sign me-1"></i> Collect
                            </button>
                          )}

                          {hasPayments && (
                            <button
                              onClick={() => viewInvoiceReceipt(inv)}
                              className="btn btn-outline"
                              style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '6px', fontWeight: '600', color: '#2563EB', borderColor: '#2563EB' }}
                              title="View & Print Official Receipt"
                            >
                              <i className="fa-solid fa-receipt me-1"></i> Receipt
                            </button>
                          )}

                          {isOverdue && (
                            <button
                              onClick={() => showToast(`Reminder dispatched to ${inv.student?.firstName} for overdue dues of ₹${Number(inv.balanceAmount).toLocaleString()}`)}
                              className="btn btn-outline"
                              style={{ padding: '5px 8px', fontSize: '11px', borderRadius: '6px', color: '#DC2626', borderColor: '#DC2626' }}
                              title="Send Reminder"
                            >
                              <i className="fa-solid fa-bell"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / pageSize)}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={totalItems}
          />
        </div>

        {/* MODAL 1: Collect Payment Counter */}
        {isCollectModalOpen && selectedInvoice && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1050,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              style={{
                background: 'var(--card-bg, #fff)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>
                    Record Fee Collection / Installment
                  </h3>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Invoice {selectedInvoice.invoiceNumber} &bull; {selectedInvoice.student?.firstName} {selectedInvoice.student?.lastName || ''} ({selectedInvoice.student?.rollNumber || 'No Roll'})
                  </div>
                </div>
                <button
                  onClick={() => setIsCollectModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  &times;
                </button>
              </div>

              {/* Outstanding Due Snapshot */}
              <div style={{ background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.15)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Total Invoiced</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>₹{Number(selectedInvoice.totalAmount).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Already Paid</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#059669' }}>₹{Number(selectedInvoice.paidAmount).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#DC2626', textTransform: 'uppercase', fontWeight: '800' }}>Current Due</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#DC2626' }}>₹{Number(selectedInvoice.balanceAmount).toLocaleString()}</div>
                </div>
              </div>

              <form onSubmit={handleRecordPayment}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '5px' }}>
                    Amount Collected Now (₹)
                  </label>
                  <input
                    type="number"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '16px', color: '#059669' }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Supports partial installment payment (e.g. paying ₹30,000 today)
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px' }}>
                      Payment Channel
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontWeight: '600' }}
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="CASH">Cash Counter</option>
                      <option value="NETBANKING">Netbanking / NEFT</option>
                      <option value="CHEQUE">Bank Cheque</option>
                      <option value="DD">Demand Draft (DD)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px' }}>
                      Transaction Ref / UTR
                    </label>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="form-control"
                      placeholder="e.g. UTR-987654"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCollectModalOpen(false)}
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={collecting}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: '700', background: '#059669', borderColor: '#059669' }}
                  >
                    {collecting ? 'Recording...' : 'Collect & Issue Receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Official Printable Student Fee Receipt */}
        {isReceiptModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 1060,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '92vh',
                overflowY: 'auto',
                padding: '30px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                position: 'relative'
              }}
            >
              {/* Close and Print Bar (Hidden on window.print) */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #E5E7EB' }}>
                <span className="badge" style={{ background: '#D1FAE5', color: '#059669', fontWeight: '700', fontSize: '12px', padding: '5px 10px', borderRadius: '6px' }}>
                  <i className="fa-solid fa-circle-check me-1"></i> Transaction Settled &bull; Official Voucher
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handlePrint}
                    className="btn btn-primary"
                    style={{ padding: '7px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', background: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <i className="fa-solid fa-print"></i> Print Official Slip
                  </button>
                  <button
                    onClick={() => setIsReceiptModalOpen(false)}
                    style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    &times;
                  </button>
                </div>
              </div>

              {loadingReceipt && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                  <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
                  <div style={{ marginTop: '10px', fontWeight: '600' }}>Fetching official voucher from registry...</div>
                </div>
              )}

              {receiptData && !loadingReceipt && (
                <div id="receipt-print-area" style={{ border: '2px solid #E5E7EB', borderRadius: '12px', padding: '24px', background: '#fff' }}>
                  {/* Institutional Header */}
                  <div style={{ textAlign: 'center', borderBottom: '2px dashed #D1D5DB', paddingBottom: '16px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                        <i className="fa-solid fa-building-columns"></i>
                      </div>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
                        {receiptData.college_name || 'UniLMS University Campus'}
                      </h2>
                    </div>
                    <div style={{ fontSize: '12px', color: '#4B5563' }}>
                      {receiptData.address || 'University Knowledge Park, Academic Block A'}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB', marginTop: '6px', letterSpacing: '0.5px' }}>
                      OFFICIAL STUDENT FEE PAYMENT RECEIPT
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px', fontSize: '12.5px', background: '#F9FAFB', padding: '14px', borderRadius: '8px' }}>
                    <div>
                      <div><strong style={{ color: '#4B5563' }}>Receipt Voucher #:</strong> <span style={{ color: '#111827', fontWeight: '700' }}>{receiptData.receipt_no}</span></div>
                      <div><strong style={{ color: '#4B5563' }}>Invoice Reference:</strong> <span style={{ color: '#111827' }}>{receiptData.invoice_number}</span></div>
                      <div><strong style={{ color: '#4B5563' }}>Transaction Date:</strong> <span style={{ color: '#111827' }}>{receiptData.date}</span></div>
                    </div>
                    <div>
                      <div><strong style={{ color: '#4B5563' }}>Student Name:</strong> <span style={{ color: '#111827', fontWeight: '800' }}>{receiptData.student_name}</span></div>
                      <div><strong style={{ color: '#4B5563' }}>Roll / Enrollment:</strong> <span style={{ color: '#2563EB', fontWeight: '800' }}>{receiptData.roll_number}</span></div>
                      <div><strong style={{ color: '#4B5563' }}>Program / Term:</strong> <span style={{ color: '#111827' }}>{receiptData.program_name} ({receiptData.semester})</span></div>
                    </div>
                  </div>

                  {/* Transaction Details Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#F3F4F6', borderBottom: '1px solid #D1D5DB' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700' }}>Description</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700' }}>Payment Mode</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700' }}>Bank / UTR Reference</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700' }}>Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: '700', color: '#111827' }}>Term Fee Clearance &amp; Academic Invoicing</div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>Electronic Treasury Credit</div>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span className="badge" style={{ background: '#EFF6FF', color: '#2563EB', fontWeight: '700' }}>
                            {receiptData.mode}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'monospace' }}>
                          {receiptData.bank_ref}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: '900', color: '#059669', fontSize: '15px' }}>
                          ₹{receiptData.amount.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Amount in words */}
                  <div style={{ background: '#F9FAFB', padding: '10px 14px', borderRadius: '8px', marginBottom: '22px', fontSize: '12.5px' }}>
                    <strong style={{ color: '#4B5563' }}>Amount in Words: </strong>
                    <span style={{ color: '#111827', fontWeight: '700', fontStyle: 'italic' }}>
                      {numberToWords(receiptData.amount)}
                    </span>
                  </div>

                  {/* Signatures & Seal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', borderTop: '1px dashed #D1D5DB' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #2563EB', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', fontSize: '10px', fontWeight: '900', transform: 'rotate(-10deg)' }}>
                        SEAL
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>University Cashier</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'cursive', fontSize: '16px', color: '#1E40AF', marginBottom: '4px' }}>
                        K. R. Narayanan
                      </div>
                      <div style={{ borderTop: '1px solid #9CA3AF', width: '150px', paddingTop: '4px', fontSize: '11.5px', fontWeight: '700', color: '#374151' }}>
                        Registrar (Finance &amp; Accounts)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgFeesCollections;
