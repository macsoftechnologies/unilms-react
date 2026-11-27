import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import accountsService from '../../../services/accounts.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgAccountsBanks = () => {
  const [banks, setBanks] = useState([]);
  const [editingBank, setEditingBank] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    account_name: '',
    type: 'Bank',
    account_no: '',
    ifsc_code: '',
    opening_balance: '0.00'
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadBanks = useCallback(async (isBackground = false) => {
    if (isBackground) setIsSyncing(true);
    else setLoading(true);

    try {
      const data = await accountsService.getBanks();
      setBanks(data || []);
      setLastSyncTime(new Date());
    } catch (e) {
      console.error('Failed to load bank accounts:', e);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadBanks();

    const interval = setInterval(() => {
      loadBanks(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadBanks]);

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!formData.account_name.trim()) return;

    try {
      if (editingBank) {
        await accountsService.updateBank(editingBank.id, {
          accountName: formData.account_name.trim(),
          accountType: formData.type,
          accountNumber: formData.account_no.trim() || '—',
          ifscCode: formData.ifsc_code.trim() || '—'
        });
        showToast(`Account "${formData.account_name}" updated successfully.`);
      } else {
        await accountsService.createBank({
          accountName: formData.account_name.trim(),
          accountType: formData.type,
          accountNumber: formData.account_no.trim() || `ACC-${Date.now().toString().slice(-6)}`,
          ifscCode: formData.ifsc_code.trim() || '—',
          openingBalance: parseFloat(formData.opening_balance) || 0
        });
        showToast(`Account "${formData.account_name}" added successfully.`);
      }
      handleClear();
      await loadBanks();
    } catch (err) {
      showToast(err.message || 'Operation failed');
    }
  };

  const handleEdit = (bank) => {
    setEditingBank(bank);
    setFormData({
      account_name: bank.account_name || bank.accountName,
      type: bank.type || bank.accountType,
      account_no: bank.account_no || bank.accountNumber || '',
      ifsc_code: bank.ifsc_code || bank.ifscCode || '',
      opening_balance: String(bank.opening_balance || bank.openingBalance || '0.00')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (bank) => {
    const ok = await confirmAction({
      title: 'Delete Bank / Cash Account',
      message: `Are you sure you want to permanently delete account "${bank.account_name || bank.accountName}" (${bank.account_no || bank.accountNumber})? This will detach any historical voucher associations.`,
      confirmText: 'Delete Account',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await accountsService.deleteBank(bank.id);
      showToast(`Account "${bank.account_name || bank.accountName}" deleted.`);
      await loadBanks();
    } catch (err) {
      showToast(err.message || 'Deletion failed');
    }
  };

  const handleClear = () => {
    setEditingBank(null);
    setFormData({
      account_name: '',
      type: 'Bank',
      account_no: '',
      ifsc_code: '',
      opening_balance: '0.00'
    });
  };

  const filteredBanks = useMemo(() => {
    return banks.filter(b => {
      const name = (b.account_name || b.accountName || '').toLowerCase();
      const num = (b.account_no || b.accountNumber || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      return name.includes(q) || num.includes(q);
    });
  }, [banks, searchQuery]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    paginatedItems: paginatedBanks,
    totalItems
  } = useTablePagination(filteredBanks, 10);

  const totalBankBal = banks
    .filter(b => (b.type || b.accountType) === 'Bank')
    .reduce((sum, b) => sum + Number(b.current_balance || b.currentBalance || 0), 0);

  const totalCashBal = banks
    .filter(b => (b.type || b.accountType) === 'Cash')
    .reduce((sum, b) => sum + Number(b.current_balance || b.currentBalance || 0), 0);

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
            <i className="fa-solid fa-building-columns"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.3px' }}>
                Bank &amp; Cash Accounts
              </h2>
              {isSyncing && (
                <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>
                  <i className="fa-solid fa-rotate fa-spin me-1"></i> Syncing...
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Manage institutional bank accounts and cash-in-hand ledgers
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
            onClick={() => loadBanks(false)}
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
            to="/unilms/org/accounts/transactions"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-money-bill-transfer"></i>
            <span>Record Transaction</span>
          </Link>
        </div>
      </div>

      {/* Statistical KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Bank Balance</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>
              ₹{totalBankBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: '#2563EB', marginTop: '4px' }}>{banks.filter(b => (b.type || b.accountType) === 'Bank').length} Bank Accounts</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-building-columns"></i>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Cash in Hand</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
              ₹{totalCashBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>{banks.filter(b => (b.type || b.accountType) === 'Cash').length} Cash Registers</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-wallet"></i>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Combined Liquidity</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#4F46E5', marginTop: '4px' }}>
              ₹{(totalBankBal + totalCashBal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: '#4F46E5', marginTop: '4px' }}>Total Liquid Assets</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-vault"></i>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left + Table on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(min(100%, 300px), 340px) 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Form Card */}
        <div className="card" style={{ background: '#fff', padding: '22px 24px', borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#1E293B' }}>
            {editingBank ? 'Edit Account' : 'Add Account'}
          </h2>
          <form onSubmit={handleSaveBank}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Account Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Petty Cash, Main HDFC"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="form-control"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-control"
                required
                style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="Bank">Bank Account</option>
                <option value="Cash">Cash in Hand</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Account Number</label>
              <input
                type="text"
                placeholder="Bank A/C number or register code"
                value={formData.account_no}
                onChange={(e) => setFormData({ ...formData, account_no: e.target.value })}
                className="form-control"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            {formData.type === 'Bank' && (
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. SBIN0001423"
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            )}

            {!editingBank && (
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Opening Balance (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                  className="form-control"
                  required
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <small style={{ color: '#64748B', fontSize: '12px', display: 'block', marginTop: '4px' }}>Initial baseline balance upon account creation.</small>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px', fontWeight: '700', borderRadius: '8px', background: '#4F46E5', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
              >
                {editingBank ? 'Update Account' : 'Save Account'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-outline"
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#fff' }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Table Card */}
        <div className="card" style={{ background: '#fff', padding: 0, borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
              Accounts List
            </h2>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              placeholder="Search account name or number..."
              style={{ height: '38px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '220px' }}
            />
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Details</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account / IFSC</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Current Balance</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={5} rows={pageSize || 4} />
                ) : paginatedBanks.length > 0 ? (
                  paginatedBanks.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <strong style={{ fontSize: '14px', color: '#1E293B', display: 'block' }}>{b.account_name || b.accountName}</strong>
                        <small style={{ color: '#64748B' }}>Branch: {b.branch || 'Main Campus'}</small>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          background: (b.type || b.accountType) === 'Bank' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: (b.type || b.accountType) === 'Bank' ? '#2563EB' : '#059669',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: '700'
                        }}>
                          {b.type || b.accountType}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>
                        <div>{b.account_no || b.accountNumber}</div>
                        {(b.type || b.accountType) === 'Bank' && <small style={{ color: '#64748B' }}>IFSC: {b.ifsc_code || b.ifscCode}</small>}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '800', fontSize: '14.5px', color: (b.current_balance || b.currentBalance) >= 0 ? '#10B981' : '#EF4444' }}>
                        ₹{Number(b.current_balance || b.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleEdit(b)}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', color: '#4F46E5', borderColor: '#c7d2fe', cursor: 'pointer' }}
                            title="Edit account"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b)}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', color: '#DC2626', borderColor: '#fecaca', cursor: 'pointer' }}
                            title="Delete account"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      No bank accounts found matching filter criteria.
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

export default OrgAccountsBanks;
