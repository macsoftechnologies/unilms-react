import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import accountsService from '../../../services/accounts.service';
import { TableSkeletonLoader } from '../../../components';

const OrgAccountsPlStatement = () => {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const fetchStatement = useCallback(async (isBackground = false) => {
    if (isBackground) setIsSyncing(true);
    else setLoading(true);

    try {
      const data = await accountsService.getPlStatement(startDate, endDate);
      setStatement(data || { totalIncome: 0, totalExpense: 0, netSurplus: 0, isProfit: true, incomeBreakdown: [], expenseBreakdown: [] });
      setLastSyncTime(new Date());
    } catch (e) {
      console.error('Failed to load P&L statement:', e);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchStatement();

    const interval = setInterval(() => {
      fetchStatement(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStatement]);

  const totalIncome = statement?.totalIncome || 0;
  const totalExpense = statement?.totalExpense || 0;
  const netSurplus = statement?.netSurplus || (totalIncome - totalExpense);
  const isProfit = netSurplus >= 0;

  const incomeItems = statement?.incomeBreakdown || [];
  const expenseItems = statement?.expenseBreakdown || [];

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
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.3px' }}>
                Profit &amp; Loss / Income &amp; Expenditure
              </h2>
              {isSyncing && (
                <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>
                  <i className="fa-solid fa-rotate fa-spin me-1"></i> Syncing...
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Financial performance, operational revenues, and institutional expenditures &bull; Academic Year 2026&ndash;2027
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
            onClick={() => fetchStatement(false)}
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
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-money-bill-transfer" style={{ color: '#4F46E5' }}></i>
            <span>Transactions</span>
          </Link>
          <button 
            type="button" 
            onClick={() => window.print()} 
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-print"></i>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Filter Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px 24px', borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', display: 'block', marginBottom: '6px' }}>Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-control" 
              style={{ height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', minWidth: '180px' }} 
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', display: 'block', marginBottom: '6px' }}>End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-control" 
              style={{ height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', minWidth: '180px' }} 
            />
          </div>

          <button 
            type="button" 
            onClick={() => { setStartDate('2026-01-01'); setEndDate(new Date().toISOString().split('T')[0]); }}
            className="btn btn-outline"
            style={{ height: '40px', padding: '0 16px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#fff' }}
          >
            Reset to FY 2026-27
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Incomes (Cr.)</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
              ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Tuition, Transport &amp; Hostel</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-arrow-down-left"></i>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Expenditures (Dr.)</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>
              ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>Payroll, Utilities, Fuel</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-arrow-up-right"></i>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Institutional Surplus</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: isProfit ? '#4F46E5' : '#EF4444', marginTop: '4px' }}>
              {isProfit ? '+' : ''}₹{netSurplus.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: isProfit ? '#4F46E5' : '#EF4444', marginTop: '4px' }}>
              {isProfit ? 'Operating Net Surplus' : 'Operating Deficit'}
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-scale-balanced"></i>
          </div>
        </div>
      </div>

      {/* Main Breakdown Grids: Revenue on Left, Expenses on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Income Breakdown Card */}
        <div className="card" style={{ background: '#fff', padding: 0, borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#059669' }}>
              <i className="fa-solid fa-arrow-down-left me-2"></i> Operational Incomes
            </h3>
            <span style={{ fontWeight: '800', color: '#059669', fontSize: '16px' }}>
              ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '20px' }}>
              <TableSkeletonLoader columns={2} rows={4} />
            </div>
          ) : incomeItems.length > 0 ? (
            <div style={{ padding: '8px 0' }}>
              {incomeItems.map((item, idx) => {
                const percent = totalIncome > 0 ? Math.round((item.amount / totalIncome) * 100) : 0;
                return (
                  <div key={idx} style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: '#1E293B', display: 'block' }}>{item.name}</strong>
                      <small style={{ color: '#64748B' }}>{percent}% of operating revenue</small>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#059669' }}>
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: '30px', color: '#64748B', margin: 0 }}>No revenue logged in this period.</p>
          )}
        </div>

        {/* Expense Breakdown Card */}
        <div className="card" style={{ background: '#fff', padding: 0, borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#DC2626' }}>
              <i className="fa-solid fa-arrow-up-right me-2"></i> Operational Expenditures
            </h3>
            <span style={{ fontWeight: '800', color: '#DC2626', fontSize: '16px' }}>
              ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '20px' }}>
              <TableSkeletonLoader columns={2} rows={4} />
            </div>
          ) : expenseItems.length > 0 ? (
            <div style={{ padding: '8px 0' }}>
              {expenseItems.map((item, idx) => {
                const percent = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
                return (
                  <div key={idx} style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: '#1E293B', display: 'block' }}>{item.name}</strong>
                      <small style={{ color: '#64748B' }}>{percent}% of total expenditures</small>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#DC2626' }}>
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: '30px', color: '#64748B', margin: 0 }}>No expenditures logged in this period.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default OrgAccountsPlStatement;
