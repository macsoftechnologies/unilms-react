import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import accountsService from '../../../services/accounts.service';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';

const OrgAccountsIndex = () => {
  const [stats, setStats] = useState(null);
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const fetchAccountsData = useCallback(async (isBackground = false) => {
    if (isBackground) setIsSyncing(true);
    else setLoading(true);

    try {
      const data = await accountsService.getStats();
      if (data) {
        setStats(data);
        setBanks(data.banks || []);
        setTransactions(data.recentTransactions || []);
      }
      setLastSyncTime(new Date());
    } catch (e) {
      console.error('Failed to load accounts telemetry:', e);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountsData();

    // 30s background sync polling
    const interval = setInterval(() => {
      fetchAccountsData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAccountsData]);

  const {
    currentPage: bankPage,
    setCurrentPage: setBankPage,
    pageSize: bankPageSize,
    paginatedItems: paginatedBanks,
    totalItems: totalBanks
  } = useTablePagination(banks, 5);

  const {
    currentPage: txPage,
    setCurrentPage: setTxPage,
    pageSize: txPageSize,
    paginatedItems: paginatedTransactions,
    totalItems: totalTransactions
  } = useTablePagination(transactions, 5);

  const totalBankBalance = stats?.totalBankBalance ?? 0;
  const totalCashBalance = stats?.totalCashBalance ?? 0;
  const totalInflow = stats?.totalInflow ?? 0;
  const totalOutflow = stats?.totalOutflow ?? 0;
  const netSurplus = stats?.netSurplus ?? (totalInflow - totalOutflow);

  return (
    <>
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
            <i className="fa-solid fa-credit-card"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.3px' }}>
                Accounts &amp; Financial Management
              </h2>
              {isSyncing && (
                <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>
                  <i className="fa-solid fa-rotate fa-spin me-1"></i> Syncing...
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Financial balances, bank ledgers &amp; cashbook transactions
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
            onClick={() => fetchAccountsData(false)}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '13px', cursor: 'pointer' }}
            title="Refresh financial data"
          >
            <i className={`fa-solid fa-rotate ${loading ? 'fa-spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
          <Link 
            to="/unilms/org/accounts/transactions" 
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>New Transaction</span>
          </Link>
          <Link 
            to="/unilms/org/accounts/daybook" 
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-book" style={{ color: '#4F46E5' }}></i>
            <span>View Day Book</span>
          </Link>
          <Link 
            to="/unilms/org/accounts/pl-statement" 
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-chart-line" style={{ color: '#4F46E5' }}></i>
            <span>P&amp;L Statement</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Balance Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        {/* Total Bank Balance Card */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #E11D48',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Total Bank Balance
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#E11D48', marginTop: '4px', lineHeight: '1.2' }}>
            ₹{totalBankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '4px' }}>
            {banks.filter(b => (b.type || b.accountType) === 'Bank').length} Institutional Accounts
          </div>
        </div>

        {/* Total Cash in Hand Card */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #10B981',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Total Cash in Hand
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '4px', lineHeight: '1.2' }}>
            ₹{totalCashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> Central Cash Counter
          </div>
        </div>

        {/* Total Inflow Card */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #06B6D4',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Total Collections (Inflow)
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0891B2', marginTop: '4px', lineHeight: '1.2' }}>
            ₹{totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11.5px', color: '#0891B2', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-arrow-down-left me-1"></i> Receipts &amp; Fees
          </div>
        </div>

        {/* Total Outflow Card */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #F59E0B',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Total Disbursements (Outflow)
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#D97706', marginTop: '4px', lineHeight: '1.2' }}>
            ₹{totalOutflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11.5px', color: '#D97706', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-arrow-up-right me-1"></i> Payments &amp; Bills
          </div>
        </div>

        {/* Net Operating Surplus Card */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: `4px solid ${netSurplus >= 0 ? '#4F46E5' : '#EF4444'}`,
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Net Operating Surplus
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: netSurplus >= 0 ? '#4F46E5' : '#EF4444', marginTop: '4px', lineHeight: '1.2' }}>
            {netSurplus >= 0 ? '+' : ''}₹{netSurplus.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11.5px', color: netSurplus >= 0 ? '#4F46E5' : '#EF4444', fontWeight: '700', marginTop: '4px' }}>
            {netSurplus >= 0 ? 'Surplus Reserve' : 'Deficit Watch'}
          </div>
        </div>
      </div>

      {/* Main Grid: Bank Accounts & Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>
        {/* Bank & Cash Registers List */}
        <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: '#1e293b' }}>
              <i className="fa-solid fa-building-columns me-2" style={{ color: '#4f46e5' }}></i>
              Bank &amp; Cash Accounts
            </h3>
            <Link to="/unilms/org/accounts/banks" style={{ fontSize: '12.5px', fontWeight: '700', color: '#4f46e5', textDecoration: 'none' }}>
              Manage &rarr;
            </Link>
          </div>

          {loading ? (
            <TableSkeletonLoader columns={2} rows={3} />
          ) : paginatedBanks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paginatedBanks.map(b => (
                <div key={b.id} style={{ padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: '#1e293b', display: 'block' }}>{b.account_name || b.accountName}</strong>
                      <small style={{ color: '#64748b', fontSize: '11.5px' }}>
                        {b.type || b.accountType} &bull; {b.account_no || b.accountNumber}
                      </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '14.5px', fontWeight: '800', color: (b.current_balance || b.currentBalance) >= 0 ? '#10b981' : '#ef4444' }}>
                        ₹{Number(b.current_balance || b.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No bank accounts found.</p>
          )}

          <div style={{ marginTop: '12px' }}>
            <TablePagination
              currentPage={bankPage}
              totalItems={totalBanks}
              pageSize={bankPageSize}
              onChange={setBankPage}
            />
          </div>
        </div>

        {/* Recent Financial Transactions Table */}
        <div className="card" style={{ padding: 0, borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: '#1e293b' }}>
                <i className="fa-solid fa-receipt me-2" style={{ color: '#4f46e5' }}></i>
                Recent Financial Vouchers
              </h3>
              <small style={{ color: '#64748b' }}>Real-Time Double-Entry Audit Trail</small>
            </div>
            <Link to="/unilms/org/accounts/transactions" style={{ fontSize: '12.5px', fontWeight: '700', color: '#4f46e5', textDecoration: 'none' }}>
              View All ({transactions.length}) &rarr;
            </Link>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Voucher No</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Date / Type</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Account Head / Party</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={5} rows={5} />
                ) : paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map(t => {
                    const isCredit = (t.transaction_type || t.transactionType) === 'Credit';
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '800', color: '#4f46e5', fontSize: '12.5px' }}>
                          {t.voucher_number || t.voucherNumber}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12.5px', color: '#334155' }}>
                          <div>{t.transaction_date || t.transactionDate}</div>
                          <small style={{ color: '#64748b' }}>{t.voucher_type || t.voucherType}</small>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12.5px', color: '#334155' }}>
                          <strong style={{ display: 'block' }}>{t.head_name || t.headName}</strong>
                          <small style={{ color: '#64748b' }}>{t.party_name || t.partyName || '—'}</small>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800', fontSize: '13px', color: isCredit ? '#10b981' : '#e11d48' }}>
                          {isCredit ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span className="badge" style={{ background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                            {t.status || 'POSTED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e8f0' }}>
            <TablePagination
              currentPage={txPage}
              totalItems={totalTransactions}
              pageSize={txPageSize}
              onChange={setTxPage}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default OrgAccountsIndex;
