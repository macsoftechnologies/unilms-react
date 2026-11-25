import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../../components';
import payrollService from '../../../../services/payroll.service';

const OrgHrPayrollComponents = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [components, setComponents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getComponents();
      setComponents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch components error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchComponents();
      }
    }, 30000); // 30s smart background polling
    return () => clearInterval(interval);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Earning',
    calculation_type: 'Fixed',
    default_amount: '',
    percentage_of: 'BASIC',
    is_taxable: true
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openAddModal = () => {
    setEditingComp(null);
    setFormData({
      name: '',
      code: '',
      type: 'Earning',
      calculation_type: 'Fixed',
      default_amount: '',
      percentage_of: 'BASIC',
      is_taxable: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingComp(c);
    setFormData({
      name: c.name,
      code: c.code,
      type: c.type,
      calculation_type: c.calculationType || c.calculation_type,
      default_amount: c.defaultAmount ?? c.default_amount,
      percentage_of: c.percentageOf || c.percentage_of || 'BASIC',
      is_taxable: Boolean(c.isTaxable ?? c.is_taxable)
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    const isEdit = Boolean(editingComp);
    const ok = await confirm({
      title: isEdit ? 'Confirm Update Payroll Component' : 'Confirm New Payroll Component',
      message: isEdit
        ? `Are you sure you want to update component "${formData.name}" (${formData.code}) in the database?`
        : `Are you sure you want to create salary component "${formData.name}" (${formData.code}) in PostgreSQL?`,
      confirmText: isEdit ? 'Update Component' : 'Create Component',
      cancelText: 'Cancel',
      type: 'primary',
    });
    if (!ok) return;

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        calculationType: formData.calculation_type,
        defaultAmount: parseFloat(formData.default_amount) || 0,
        percentageOf: formData.calculation_type === 'Percentage' ? formData.percentage_of : null,
        isTaxable: formData.is_taxable
      };

      if (editingComp) {
        await payrollService.updateComponent(editingComp.id, payload);
        showToast(`Component "${formData.name}" updated successfully.`);
      } else {
        await payrollService.createComponent(payload);
        showToast(`Component "${formData.name}" added successfully.`);
      }

      setIsModalOpen(false);
      setEditingComp(null);
      fetchComponents();
    } catch (err) {
      console.error('Save component error:', err);
      showToast(err.response?.data?.message || 'Failed to save component.');
    }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: 'Confirm Delete Component',
      message: `Are you sure you want to delete component "${name}"? It will be permanently removed from PostgreSQL.`,
      confirmText: 'Delete Component',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await payrollService.deleteComponent(id);
      showToast(`Component "${name}" removed.`);
      fetchComponents();
    } catch (err) {
      console.error('Delete component error:', err);
      showToast('Failed to delete component.');
    }
  };

  const filteredComponents = components.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredComponents, 10);

  const totalEarnings = components.filter(c => c.type === 'Earning').length;
  const totalDeductions = components.filter(c => c.type === 'Deduction').length;
  const taxableCount = components.filter(c => c.is_taxable).length;

  return (
    <>
      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

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
                background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(219, 39, 119, 0.3)'
              }}
            >
              <i className="fa-solid fa-calculator"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Salary Components &amp; Earnings / Deductions
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Configure basic pay, HRA, DA, EPF, professional tax, medical allowances &amp; formula rules &bull; AY 2026&ndash;2027
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              type="button"
              className="btn btn-primary" 
              onClick={openAddModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(219, 39, 119, 0.25)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add Component</span>
            </button>
            <Link 
              to="/unilms/org/hr/payroll/structures" 
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-network-wired" style={{ color: '#DB2777' }}></i>
              <span>Salary Structures</span>
            </Link>
          </div>
        </div>

        {/* Statistical KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Pay Items
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>
                {components.length} Items
              </div>
              <div style={{ fontSize: '12px', color: '#4F46E5', marginTop: '4px', fontWeight: '600' }}>
                Active in Payroll Engine
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-calculator"></i>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Earning Allowances
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                {totalEarnings} Allowances
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                Basic, DA, HRA, TA
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-arrow-trend-up"></i>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Deduction Heads
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>
                {totalDeductions} Heads
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                PF, PT, TDS, Insurance
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-arrow-trend-down"></i>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tax Regulated Heads
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>
                {taxableCount} Taxable
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                Subject to IT assessment
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-scale-balanced"></i>
            </div>
          </div>

        </div>

        {/* Filter and Table Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#1E293B' }}>
                Defined Salary Components
              </h3>
              <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}>
                {filteredComponents.length} Total
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '160px' }}>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="form-control"
                  style={{ height: '38px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="All">All Types</option>
                  <option value="Earning">Earnings Only</option>
                  <option value="Deduction">Deductions Only</option>
                </select>
              </div>

              <div style={{ minWidth: '240px' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control" 
                  placeholder="Search component or code..." 
                  style={{ height: '38px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                />
              </div>
            </div>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: '0' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Component Name</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Code</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Classification</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Calculation Mode</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Default Value</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Taxable</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={7} rows={pageSize || 5} />
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--text-main, #1e293b)' }}>
                        <strong>{c.name}</strong>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontWeight: '700', fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                          {c.code}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge" style={{ 
                          background: c.type === 'Earning' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                          color: c.type === 'Earning' ? '#10B981' : '#EF4444', 
                          fontWeight: '700', 
                          fontSize: '12px', 
                          padding: '4px 10px', 
                          borderRadius: '6px' 
                        }}>
                          {c.type === 'Earning' ? '+ Earning' : '- Deduction'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                        {c.calculation_type}
                        {c.calculation_type === 'Percentage' && c.percentage_of && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginLeft: '6px' }}>
                            (% of {c.percentage_of})
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: '700' }}>
                        {c.calculation_type === 'Percentage' 
                          ? `${c.default_amount}%` 
                          : `₹${Number(c.default_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {c.is_taxable ? (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: '600', fontSize: '11.5px', padding: '3px 8px', borderRadius: '4px' }}>
                            Yes
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12.5px' }}>No</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button 
                            type="button" 
                            className="btn btn-outline" 
                            onClick={() => openEditModal(c)}
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i> Edit
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline text-danger" 
                            onClick={() => handleDelete(c.id, c.name)}
                            style={{ padding: '6px 12px', fontSize: '12px', color: '#DC2626', borderColor: 'rgba(220, 38, 38, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <i className="fa-solid fa-trash"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      No salary components match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="salary components"
          />
        </div>

        {/* Modal / Drawer for Pay Component */}
        <div 
          id="compModal" 
          className="drawer-overlay" 
          style={{ 
            display: isModalOpen ? 'flex' : 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target.id === 'compModal') setIsModalOpen(false);
          }}
        >
          <div 
            className="drawer-content" 
            style={{ 
              maxWidth: '520px', 
              width: '100%', 
              background: '#fff', 
              borderRadius: '16px', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <form onSubmit={handleSave} style={{ margin: 0 }}>
              <div 
                className="drawer-header" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '20px 24px', 
                  background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', 
                  color: '#fff' 
                }}
              >
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fa-solid fa-calculator"></i>
                  {editingComp ? 'Edit Pay Component' : 'Add Pay Component'}
                </h3>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsModalOpen(false)} 
                  style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="drawer-body" style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                    Component Name <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control" 
                    required 
                    placeholder="e.g. Basic Salary, House Rent Allowance (HRA)" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Code <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      name="code" 
                      className="form-control" 
                      required 
                      placeholder="BASIC, HRA, PF" 
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Type <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select 
                      name="type" 
                      className="form-control" 
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="Earning">Earning (+)</option>
                      <option value="Deduction">Deduction (-)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Calculation Mode
                    </label>
                    <select 
                      name="calculation_type" 
                      className="form-control"
                      value={formData.calculation_type}
                      onChange={(e) => setFormData({ ...formData, calculation_type: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="Fixed">Fixed Amount</option>
                      <option value="Percentage">Percentage (%)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Default Value ({formData.calculation_type === 'Percentage' ? '%' : '₹'})
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="default_amount" 
                      className="form-control" 
                      placeholder="Amount or %" 
                      value={formData.default_amount}
                      onChange={(e) => setFormData({ ...formData, default_amount: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                {formData.calculation_type === 'Percentage' && (
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Percentage Calculated On
                    </label>
                    <input 
                      type="text" 
                      name="percentage_of" 
                      className="form-control" 
                      placeholder="BASIC" 
                      value={formData.percentage_of}
                      onChange={(e) => setFormData({ ...formData, percentage_of: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '13.5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#1e293b' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.is_taxable} 
                      onChange={(e) => setFormData({ ...formData, is_taxable: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Subject to Income Tax Calculation (Taxable)
                  </label>
                </div>
              </div>

              <div 
                className="drawer-footer" 
                style={{ 
                  padding: '16px 24px', 
                  borderTop: '1px solid var(--border-color, #e2e8f0)', 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '12px',
                  background: '#f8fafc'
                }}
              >
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 18px', fontWeight: '600', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '10px 22px', fontWeight: '700', borderRadius: '8px', background: '#4F46E5', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
                >
                  <i className="fa-solid fa-check"></i> {editingComp ? 'Update Component' : 'Save Component'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <ConfirmDialog />
      </section>
    </>
  );
};

export default OrgHrPayrollComponents;