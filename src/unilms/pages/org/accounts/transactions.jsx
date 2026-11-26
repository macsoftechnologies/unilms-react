import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import accountsService from '../../../services/accounts.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgAccountsTransactions = () => {
  const [heads, setHeads] = useState([]);
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [toastMsg, setToastMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const { confirmAction, ConfirmModal } = useConfirmDialog();

  // New Transaction Form State
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    type: 'Expense',
    head_id: '',
    bank_account_id: '',
    amount: '',
    party_name: '',
    reference_no: '',
    description: ''
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = useCallback(async (isBackground = false) => {
    if (isBackground) setIsSyncing(true);
    else setLoading(true);

    try {
      const [txsData, headsData, banksData] = await Promise.all([
        accountsService.getTransactions(),
        accountsService.getHeads(),
        accountsService.getBanks()
      ]);

      setTransactions(txsData || []);
      setHeads(headsData || []);
      setBanks(banksData || []);

      if (headsData?.length > 0 && !formData.head_id) {
        setFormData(prev => ({
          ...prev,
          head_id: prev.head_id || String(headsData[0].id),
          bank_account_id: prev.bank_account_id || (banksData?.length > 0 ? String(banksData[0].id) : '')
        }));
      }

      setLastSyncTime(new Date());
    } catch (e) {
      console.error('Failed to load transaction data:', e);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [formData.head_id]);

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadData]);

  const handleRecordTransaction = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!formData.bank_account_id) {
      alert('Please select a Paying / Receiving Bank or Cash Account.');
      return;
    }

    try {
      const isCredit = ['Income', 'Deposit', 'Refund'].includes(formData.type);
      const voucherType = isCredit ? 'Receipt' : (formData.type === 'Contra' ? 'Contra' : 'Payment');

      await accountsService.createTransaction({
        transactionDate: formData.transaction_date,
        type: formData.type,
        voucherType,
        headId: formData.head_id || null,
        bankAccountId: formData.bank_account_id || null,
        amount: amt,
        partyName: formData.party_name.trim() || 'Direct Account Entry',
        referenceNo: formData.reference_no.trim() || `REF-${Date.now().toString().slice(-6)}`,
        description: formData.description.trim() || `${formData.type} entry logged in ledger`
      });

      showToast(`Transaction of ₹${amt.toLocaleString('en-IN')} posted to PostgreSQL.`);

      setFormData(prev => ({
        ...prev,
        amount: '',
        party_name: '',
        reference_no: '',
        description: ''
      }));

      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to record transaction');
    }
  };

  const handleDeleteTransaction = async (id, ref) => {
    const ok = await confirmAction({
      title: 'Void / Delete Voucher',
      message: `Are you sure you want to delete voucher #${ref || id}? The bank account balance will automatically be reverted in the database.`,
      confirmText: 'Delete Voucher',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await accountsService.deleteTransaction(id);
      showToast('Voucher deleted and bank ledger balance reverted.');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Deletion failed');
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = searchQuery.toLowerCase();
      const headName = (t.head_name || t.headName || '').toLowerCase();
      const party = (t.party_name || t.partyName || '').toLowerCase();
      const ref = (t.reference_no || t.referenceNo || t.voucher_number || t.voucherNumber || '').toLowerCase();
      const bank = (t.bank_name || t.bankName || '').toLowerCase();

      const matchesSearch = headName.includes(q) || party.includes(q) || ref.includes(q) || bank.includes(q);
      const isCredit = (t.transaction_type || t.transactionType) === 'Credit';
      const actualType = isCredit ? 'Income' : 'Expense';
      const matchesType = typeFilter === 'All' || actualType === typeFilter || (t.voucher_type || t.voucherType) === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, typeFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    paginatedItems: paginatedTransactions,
    totalItems
  } = useTablePagination(filteredTransactions, 10);

  const totalReceipts = transactions
    .filter(t => (t.transaction_type || t.transactionType) === 'Credit')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalPayments = transactions
    .filter(t => (t.transaction_type || t.transactionType) === 'Debit')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return (
    <>
      {/* Toast Alert */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#1e293b',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i>
          {toastMsg}
        </div>
      )}

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
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
            }}
          >
            <i className="fa-solid fa-money-bill-transfer"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.3px' }}>
                Double-Entry Voucher Transactions
              </h2>
              {isSyncing && (
                <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>
                  <i className="fa-solid fa-rotate fa-spin me-1"></i> Syncing...
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              PostgreSQL Journal, Payment, Receipt and Contra Vouchers
              {lastSyncTime && (
                <span style={{ marginLeft: '10px', fontSize: '11.5px', color: '#94a3b8' }}>
                  &bull; Last synced: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => loadData(false)}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '13px', cursor: 'pointer' }}
          >
            <i className={`fa-solid fa-rotate ${loading ? 'fa-spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
          <Link 
            to="/unilms/org/accounts" 
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-chart-pie" style={{ color: '#4F46E5' }}></i>
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/unilms/org/accounts/heads" 
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-tags" style={{ color: '#4F46E5' }}></i>
            <span>Chart of Accounts</span>
          </Link>
          <Link 
            to="/unilms/org/accounts/banks" 
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-building-columns" style={{ color: '#4F46E5' }}></i>
            <span>Bank &amp; Cash</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Receipts</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
              ₹{totalReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Credit Inflow Vouchers</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-arrow-down-left"></i>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Disbursements</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>
              ₹{totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>Debit Payment Vouchers</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-arrow-up-right"></i>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Movement</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: (totalReceipts - totalPayments) >= 0 ? '#4F46E5' : '#EF4444', marginTop: '4px' }}>
              ₹{(totalReceipts - totalPayments).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: '#4F46E5', marginTop: '4px' }}>{transactions.length} Total Vouchers</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-scale-balanced"></i>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left + Table on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(min(100%, 320px), 360px) 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Record Transaction Form */}
        <div className="card" style={{ background: '#fff', padding: '22px 24px', borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#1E293B' }}>
            Post New Voucher
          </h2>
          <form onSubmit={handleRecordTransaction}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Voucher Date *</label>
              <input 
                type="date" 
                required 
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="form-control" 
                style={{ width: '100%', padding: '9px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Nature of Entry *</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-control" 
                required
                style={{ width: '100%', padding: '9px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="Expense">Expense / Payment (Debit)</option>
                <option value="Income">Income / Receipt (Credit)</option>
                <option value="Deposit">Bank Deposit (Contra)</option>
                <option value="Withdrawal">Bank Withdrawal (Contra)</option>
                <option value="Refund">Fee Refund / Reversal</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Account Head *</label>
              <select 
                value={formData.head_id}
                onChange={(e) => setFormData({ ...formData, head_id: e.target.value })}
                className="form-control" 
                required
                style={{ width: '100%', padding: '9px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Select Ledger Head...</option>
                {heads.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.gl_code || h.code} - {h.head_name || h.name} ({h.head_type || h.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Paying / Receiving Account *</label>
              <select 
                value={formData.bank_account_id}
                onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
                className="form-control" 
                required
                style={{ width: '100%', padding: '9px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Select Bank / Cash Drawer...</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.account_name || b.accountName} ({b.type || b.accountType}) - Bal: ₹{Number(b.current_balance || b.currentBalance || 0).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Amount (₹) *</label>
              <input 
                type="number" 
                required 
                min="0.01" 
                step="0.01" 
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="form-control" 
                style={{ width: '100%', padding: '9px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Party / Payee / Student</label>
              <input 
                type="text" 
                placeholder="e.g. Aditya Sharma, Tata Power"
                value={formData.party_name}
                onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                className="form-control" 
                style={{ width: '100%', padding: '9px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Reference / Cheque / UTR No.</label>
              <input 
                type="text" 
                placeholder="e.g. UTR-9821884, CHQ-1044"
                value={formData.reference_no}
                onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                className="form-control" 
                style={{ width: '100%', padding: '9px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Narration / Description</label>
              <textarea 
                rows="2" 
                placeholder="Notes on the financial transaction..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-control" 
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '11px', fontWeight: '700', borderRadius: '8px', background: '#4F46E5', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
            >
              Post Voucher
            </button>
          </form>
        </div>

        {/* Transactions Table Card */}
        <div className="card" style={{ background: '#fff', padding: 0, borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
              Voucher Audit Trail ({filteredTransactions.length})
            </h2>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-control"
                style={{ height: '38px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="All">All Vouchers</option>
                <option value="Income">Receipts (Credit)</option>
                <option value="Expense">Payments (Debit)</option>
                <option value="Contra">Contra Vouchers</option>
              </select>

              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control" 
                placeholder="Search reference, party, head..." 
                style={{ height: '38px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '220px' }} 
              />
            </div>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Voucher / Date</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Head &amp; Narration</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={5} rows={pageSize || 6} />
                ) : paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map(t => {
                    const isCredit = (t.transaction_type || t.transactionType) === 'Credit';
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <strong style={{ fontSize: '13.5px', color: '#4F46E5', display: 'block' }}>{t.voucher_number || t.voucherNumber}</strong>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>{t.transaction_date || t.transactionDate} &bull; <span style={{ fontWeight: '600' }}>{t.voucher_type || t.voucherType}</span></div>
                          {t.reference_no && <div style={{ fontSize: '11px', color: '#94a3b8' }}>Ref: {t.reference_no}</div>}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1E293B' }}>{t.head_name || t.headName}</div>
                          <div style={{ fontSize: '12px', color: '#475569' }}>Party: <strong>{t.party_name || t.partyName || '—'}</strong></div>
                          {t.description && <div style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>{t.description}</div>}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>
                          <span style={{ fontWeight: '600', color: '#1E293B' }}>{t.bank_name || t.bankName || 'Cash / Bank'}</span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '800', fontSize: '14.5px', color: isCredit ? '#059669' : '#DC2626' }}>
                          {isCredit ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteTransaction(t.id, t.voucher_number || t.voucherNumber)} 
                            className="btn btn-outline" 
                            style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '6px', color: '#DC2626', borderColor: '#fecaca', cursor: 'pointer' }}
                            title="Delete voucher & revert bank balance"
                          >
                            <i className="fa-solid fa-trash me-1"></i> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      No voucher transactions found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
            <TablePagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      <ConfirmModal />
    </>
  );
};

export default OrgAccountsTransactions;
