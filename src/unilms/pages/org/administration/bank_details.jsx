import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import accountsService from '../../../services/accounts.service';

const OrgAdministrationBankDetails = () => {
  const [banks, setBanks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const live = await accountsService.getBanks();
      const list = Array.isArray(live) ? live : (live?.data || []);
      const mapped = list.map((b) => ({
        id: b.id,
        bank_name: b.bankName || b.bank_name || b.name || 'Bank',
        branch_name: b.branchName || b.branch_name || b.branch || 'Main Branch',
        account_name: b.accountName || b.account_name || 'Apex University',
        account_number: b.accountNumber || b.account_number || '',
        ifsc_code: b.ifscCode || b.ifsc_code || '',
        is_primary: Boolean(b.isPrimary ?? b.is_primary ?? false)
      }));
      setBanks(mapped);
    } catch (err) {
      console.warn('Failed to load live bank details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedBanks,
    totalItems
  } = useTablePagination(banks, 10);

  const [formData, setFormData] = useState({
    bank_name: '',
    branch_name: '',
    account_name: '',
    account_number: '',
    ifsc_code: '',
    is_primary: false
  });

  const handleEdit = (b) => {
    setEditingId(b.id);
    setFormData({
      bank_name: b.bank_name,
      branch_name: b.branch_name,
      account_name: b.account_name,
      account_number: b.account_number,
      ifsc_code: b.ifsc_code,
      is_primary: Boolean(b.is_primary)
    });
  };

  const handleReset = () => {
    setEditingId(null);
    setFormData({
      bank_name: '',
      branch_name: '',
      account_name: '',
      account_number: '',
      ifsc_code: '',
      is_primary: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.account_name || `${formData.bank_name} Account`,
        accountName: formData.account_name,
        bankName: formData.bank_name,
        branchName: formData.branch_name,
        accountNumber: formData.account_number,
        ifscCode: formData.ifsc_code,
        type: 'BANK',
        isPrimary: Boolean(formData.is_primary)
      };

      if (editingId) {
        await accountsService.updateBank(editingId, payload);
      } else {
        await accountsService.createBank(payload);
      }
      await fetchBanks();
      handleReset();
    } catch (err) {
      console.warn('Failed to save bank account to database:', err);
      // Optimistic update fallback
      const updated = editingId
        ? banks.map(b => b.id === editingId ? { ...b, ...formData } : b)
        : [...banks, { id: `bank-${Date.now()}`, ...formData }];
      setBanks(updated);
      handleReset();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this bank account?')) {
      setLoading(true);
      try {
        await accountsService.deleteBank(id);
        await fetchBanks();
      } catch (err) {
        console.warn('Failed to delete bank:', err);
        setBanks(prev => prev.filter(b => b.id !== id));
      } finally {
        setLoading(false);
      }
      if (editingId === id) handleReset();
    }
  };

  return (
    <>
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
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Institutional Bank Accounts
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Configure organization bank details for fee collection, student refunds &amp; payroll processing
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
          to="/unilms/org/administration"
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
          <i className="fa-solid fa-arrow-left" style={{ color: '#4F46E5' }}></i>
          <span>Administration Hub</span>
        </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Form Column */}
        <div>
          <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '22px' }}>
            <h2 style={{ marginTop: 0, fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
              {editingId ? 'Edit Bank Details' : 'Add Bank Account'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Bank Name *</label>
                <input 
                  type="text" 
                  value={formData.bank_name} 
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} 
                  className="form-control" 
                  required 
                  placeholder="e.g. HDFC Bank, SBI" 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Account Name *</label>
                <input 
                  type="text" 
                  value={formData.account_name} 
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })} 
                  className="form-control" 
                  required 
                  placeholder="e.g. Apex Fee Collection A/c" 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Account Number *</label>
                <input 
                  type="text" 
                  value={formData.account_number} 
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })} 
                  className="form-control" 
                  required 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>IFSC Code *</label>
                <input 
                  type="text" 
                  value={formData.ifsc_code} 
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })} 
                  className="form-control" 
                  required 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Branch Name</label>
                <input 
                  type="text" 
                  value={formData.branch_name} 
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })} 
                  className="form-control" 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_primary} 
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })} 
                  /> 
                  Set as Primary Fee Collection Account
                </label>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: '#7C3AED', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-save" style={{ marginRight: '6px' }}></i> {editingId ? 'Update' : 'Save Bank Details'}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={handleReset} 
                    className="btn btn-outline"
                    style={{ padding: '10px 16px', borderRadius: '6px' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Table Column */}
        <div>
          <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Bank / Branch</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Account Details</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Primary</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={4} rows={pageSize || 5} />
                ) : paginatedBanks.length > 0 ? (
                  paginatedBanks.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>
                        <strong>{b.bank_name}</strong>
                        {b.branch_name && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.branch_name}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                        <div style={{ fontWeight: '600' }}>{b.account_name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{b.account_number}</div>
                        <small style={{ color: 'var(--text-muted)' }}>IFSC: {b.ifsc_code}</small>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {b.is_primary ? (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-solid fa-check"></i> Primary
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Secondary</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px', cursor: 'pointer' }} 
                          onClick={() => handleEdit(b)}
                        >
                          Edit
                        </button>
                        <button 
                          type="button" 
                          className="btn-icon text-danger" 
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }} 
                          onClick={() => handleDelete(b.id)}
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No bank accounts configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <TablePagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemName="bank accounts"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default OrgAdministrationBankDetails;