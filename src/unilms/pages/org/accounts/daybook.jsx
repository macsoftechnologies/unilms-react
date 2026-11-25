import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import accountsService from '../../../services/accounts.service';

const OrgAccountsDaybook = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [daybookData, setDaybookData] = useState({
    entries: [],
    openingBalance: 0,
    totalInflow: 0,
    totalOutflow: 0,
    closingBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const fetchDaybook = useCallback(async (date, isBackground = false) => {
    if (isBackground) setIsSyncing(true);
    else setLoading(true);

    try {
      const data = await accountsService.getDaybook(date);
      setDaybookData(data || { entries: [], openingBalance: 0, totalInflow: 0, totalOutflow: 0, closingBalance: 0 });
      setLastSyncTime(new Date());
    } catch (e) {
      console.error('Failed to fetch daybook:', e);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchDaybook(selectedDate);

    const interval = setInterval(() => {
      fetchDaybook(selectedDate, true);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedDate, fetchDaybook]);

  const transactions = daybookData.entries || [];

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    paginatedItems: paginatedDayTransactions,
    totalItems
  } = useTablePagination(transactions, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, setCurrentPage]);

  const totalReceipts = Number(daybookData.totalInflow || 0);
  const totalPayments = Number(daybookData.totalOutflow || 0);

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
            <i className="fa-solid fa-book"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.3px' }}>
                Institutional Day Book
              </h2>
              {isSyncing && (
                <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>
                  <i className="fa-solid fa-rotate fa-spin me-1"></i> Syncing...
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Daily transaction chronological ledger for all bank &amp; cash accounts &bull; Academic Year 2026&ndash;2027
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
            onClick={() => fetchDaybook(selectedDate, false)}
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
            <i className="fa-solid fa-plus"></i>
            <span>New Transaction</span>
          </Link>
        </div>
      </div>

      {/* Date Filter Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px 24px', borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', display: 'block', marginBottom: '6px' }}>Select Ledger Date</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-control" 
              style={{ height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', minWidth: '220px' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} 
              className="btn btn-outline"
              style={{ height: '40px', padding: '0 16px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', background: selectedDate === new Date().toISOString().split('T')[0] ? '#EEF2FF' : '#fff' }}
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Statistical KPI Cards for Selected Date */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Entries on Date</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>{transactions.length} Vouchers</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-list-check"></i>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Day's Inflow (Receipts)</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
              ₹{totalReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-arrow-down-left"></i>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Day's Outflow (Payments)</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>
              ₹{totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-arrow-up-right"></i>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Day's Net Movement</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: (totalReceipts - totalPayments) >= 0 ? '#4F46E5' : '#EF4444', marginTop: '4px' }}>
              {(totalReceipts - totalPayments) >= 0 ? '+' : ''}₹{(totalReceipts - totalPayments).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-scale-balanced"></i>
          </div>
        </div>
      </div>

      {/* Day Book Table Card */}
      <div className="card" style={{ background: '#fff', padding: 0, borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
            Day Book Entries for {selectedDate} ({transactions.length})
          </h2>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', margin: 0 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Voucher No / Time</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Head / Category</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mode / Account</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Narration</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Inflow (Credit)</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Outflow (Debit)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedDayTransactions.length > 0 ? (
                paginatedDayTransactions.map(t => {
                  const isInflow = t.entryType === 'INFLOW' || t.transaction_type === 'Credit';
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <strong style={{ fontSize: '13px', color: '#4F46E5', display: 'block' }}>{t.voucher_number || t.voucherNumber}</strong>
                        <small style={{ color: '#64748B' }}>{t.time || '10:00 AM'}</small>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: '600', color: '#1E293B' }}>
                        {t.category}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>
                        {t.paymentMode || 'Cash'}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '12.5px', color: '#64748B' }}>
                        <div>{t.description || '—'}</div>
                        {t.partyName && <small style={{ color: '#94a3b8' }}>Party: {t.partyName}</small>}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '800', fontSize: '14px', color: '#059669' }}>
                        {isInflow ? `₹${Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '800', fontSize: '14px', color: '#DC2626' }}>
                        {!isInflow ? `₹${Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    No transactions recorded on {selectedDate}.
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
    </>
  );
};

export default OrgAccountsDaybook;
