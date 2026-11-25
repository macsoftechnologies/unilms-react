import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import accountsService from '../../../services/accounts.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgAccountsHeads = () => {
  const [heads, setHeads] = useState([]);
  const [editingHead, setEditingHead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [toastMsg, setToastMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    head_name: '',
    head_type: 'Expense',
    gl_code: ''
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadHeads = useCallback(async (isBackground = false) => {
    if (isBackground) setIsSyncing(true);
    else setLoading(true);

    try {
      const data = await accountsService.getHeads();
      setHeads(data || []);
      setLastSyncTime(new Date());
    } catch (e) {
      console.error('Failed to load chart of accounts heads:', e);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadHeads();

    const interval = setInterval(() => {
      loadHeads(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadHeads]);

  const handleSaveHead = async (e) => {
    e.preventDefault();
    if (!formData.head_name.trim()) return;

    try {
      if (editingHead) {
        await accountsService.updateHead(editingHead.id, {
          name: formData.head_name.trim(),
          type: formData.head_type,
          code: formData.gl_code.trim(),
        });
        showToast(`Account head "${formData.head_name}" updated successfully.`);
      } else {
        await accountsService.createHead({
          name: formData.head_name.trim(),
          type: formData.head_type,
          code: formData.gl_code.trim(),
        });
        showToast(`Account head "${formData.head_name}" created successfully.`);
      }
      handleClear();
      await loadHeads();
    } catch (err) {
      showToast(err.message || 'Operation failed');
    }
  };

  const handleEdit = (head) => {
    setEditingHead(head);
    setFormData({
      head_name: head.head_name || head.name,
      head_type: head.head_type || head.type,
      gl_code: head.gl_code || head.code || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (head) => {
    const ok = await confirmAction({
      title: 'Delete Account Head',
      message: `Are you sure you want to permanently delete account head "${head.head_name || head.name}" (${head.gl_code || head.code})? Any historical transactions tagged to this head will be preserved with a null reference.`,
      confirmText: 'Delete Head',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await accountsService.deleteHead(head.id);
      showToast(`Account head "${head.head_name || head.name}" deleted.`);
      await loadHeads();
    } catch (err) {
      showToast(err.message || 'Deletion failed');
    }
  };

  const handleClear = () => {
    setEditingHead(null);
    setFormData({
      head_name: '',
      head_type: 'Expense',
      gl_code: ''
    });
  };

  // Filter & Search
  const filteredHeads = useMemo(() => {
    return heads.filter(h => {
      const name = (h.head_name || h.name || '').toLowerCase();
      const code = (h.gl_code || h.code || '').toLowerCase();
      const type = (h.head_type || h.type || '');
      const q = searchQuery.toLowerCase();

      const matchesSearch = name.includes(q) || code.includes(q);
      const matchesType = typeFilter === 'All' || type.toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [heads, searchQuery, typeFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    paginatedItems: paginatedHeads,
    totalItems
  } = useTablePagination(filteredHeads, 10);

  const incomeCount = heads.filter(h => (h.head_type || h.type) === 'Income').length;
  const expenseCount = heads.filter(h => (h.head_type || h.type) === 'Expense').length;
  const assetCount = heads.filter(h => (h.head_type || h.type) === 'Asset').length;
  const liabilityCount = heads.filter(h => (h.head_type || h.type) === 'Liability').length;

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
            <i className="fa-solid fa-tags"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.3px' }}>
                Chart of Accounts &amp; Ledger Heads
              </h2>
              {isSyncing && (
                <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>
                  <i className="fa-solid fa-rotate fa-spin me-1"></i> Syncing...
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              PostgreSQL Chart of Accounts &bull; Income, Expense, Asset, and Liability ledger codes &bull; Academic Year 2026&ndash;2027
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
            onClick={() => loadHeads(false)}
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
          <Link 
            to="/unilms/org/accounts/banks" 
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-building-columns"></i>
            <span>Bank &amp; Cash A/c</span>
          </Link>
        </div>
      </div>

      {/* Statistical KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Heads</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>{heads.length} Defined</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-tags"></i>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Income Heads</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>{incomeCount} Heads</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-arrow-down-left"></i>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expense Heads</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>{expenseCount} Heads</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-arrow-up-right"></i>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assets &amp; Liabilities</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>{assetCount + liabilityCount} Heads</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-landmark"></i>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left + Table on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(min(100%, 300px), 340px) 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Form Card */}
        <div className="card" style={{ background: '#fff', padding: '22px 24px', borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#1E293B' }}>
            {editingHead ? 'Edit Account Head' : 'Add Account Head'}
          </h2>
          <form onSubmit={handleSaveHead}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Head Name *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Lab Equipment AMC"
                value={formData.head_name}
                onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                className="form-control" 
                style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Classification Type *</label>
              <select 
                value={formData.head_type}
                onChange={(e) => setFormData({ ...formData, head_type: e.target.value })}
                className="form-control" 
                required
                style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="Income">Income (+ Receipts)</option>
                <option value="Expense">Expense (- Payments)</option>
                <option value="Asset">Asset (Capital / Cash / Receivables)</option>
                <option value="Liability">Liability (Obligations / Payables)</option>
                <option value="Equity">Equity (Corpus / Reserves)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1E293B' }}>GL Code / Ledger Tag</label>
              <input 
                type="text" 
                placeholder="e.g. 5007-LAB-AMC"
                value={formData.gl_code}
                onChange={(e) => setFormData({ ...formData, gl_code: e.target.value })}
                className="form-control" 
                style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '10px', fontWeight: '700', borderRadius: '8px', background: '#4F46E5', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
              >
                {editingHead ? 'Update Head' : 'Save Head'}
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
              Account Heads List
            </h2>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-control"
                style={{ height: '38px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="All">All Classifications</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
              </select>

              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control" 
                placeholder="Search head name or GL..." 
                style={{ height: '38px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '200px' }} 
              />
            </div>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GL Code</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Head Name</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Classification</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={4} rows={pageSize || 8} />
                ) : paginatedHeads.length > 0 ? (
                  paginatedHeads.map(h => {
                    const type = h.head_type || h.type;
                    const badgeBg = type === 'Income' ? 'rgba(16, 185, 129, 0.12)' : type === 'Expense' ? 'rgba(239, 68, 68, 0.12)' : type === 'Asset' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(217, 119, 6, 0.12)';
                    const badgeColor = type === 'Income' ? '#059669' : type === 'Expense' ? '#DC2626' : type === 'Asset' ? '#2563EB' : '#D97706';

                    return (
                      <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', fontWeight: '800', color: '#4F46E5', fontSize: '13px' }}>
                          {h.gl_code || h.code}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: '600', color: '#1E293B' }}>
                          {h.head_name || h.name}
                          {h.description && (
                            <small style={{ display: 'block', color: '#94a3b8', fontWeight: 'normal', fontSize: '11.5px' }}>{h.description}</small>
                          )}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ background: badgeBg, color: badgeColor, padding: '4px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badgeColor }}></span>
                            {type}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              type="button" 
                              onClick={() => handleEdit(h)} 
                              className="btn btn-outline" 
                              style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', color: '#4F46E5', borderColor: '#c7d2fe', cursor: 'pointer' }}
                              title="Edit head"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDelete(h)} 
                              className="btn btn-outline" 
                              style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', color: '#DC2626', borderColor: '#fecaca', cursor: 'pointer' }}
                              title="Delete head"
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
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      No account heads found matching filter criteria.
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

export default OrgAccountsHeads;
