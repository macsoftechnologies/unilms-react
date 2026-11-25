import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../../components';
import payrollService from '../../../../services/payroll.service';

const designationsList = [
  { id: '1', name: 'Professor' },
  { id: '2', name: 'Associate Professor' },
  { id: '3', name: 'Assistant Professor' },
  { id: '4', name: 'Lecturer' },
  { id: '5', name: 'Lab Superintendent' },
  { id: '6', name: 'Administrative Staff' }
];

const OrgHrPayrollStructures = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [structures, setStructures] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('All');
  const [toastMsg, setToastMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStructures = async () => {
    try {
      setIsLoading(true);
      const data = await payrollService.getStructures();
      setStructures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch structures error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchStructures();
      }
    }, 30000); // 30s smart background polling
    return () => clearInterval(interval);
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    designation_id: '',
    basic_salary: 50000,
    total_earnings: 65000,
    total_deductions: 6000,
    net_salary: 59000,
    status: 'Active'
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleEarningsDeductionsChange = (field, val) => {
    const num = parseFloat(val) || 0;
    const updated = { ...formData, [field]: num };
    const earnings = field === 'total_earnings' ? num : (parseFloat(updated.total_earnings) || 0);
    const deductions = field === 'total_deductions' ? num : (parseFloat(updated.total_deductions) || 0);
    updated.net_salary = Math.max(0, earnings - deductions);
    setFormData(updated);
  };

  const openAddModal = () => {
    setEditingStructure(null);
    setFormData({
      name: '',
      designation_id: '',
      basic_salary: 50000,
      total_earnings: 65000,
      total_deductions: 6000,
      net_salary: 59000,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditingStructure(s);
    setFormData({
      name: s.name,
      designation_id: s.designationId || s.designation_id || '',
      basic_salary: s.basicSalary ?? s.basic_salary,
      total_earnings: s.totalEarnings ?? s.total_earnings,
      total_deductions: s.totalDeductions ?? s.total_deductions,
      net_salary: s.netSalary ?? s.net_salary,
      status: s.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const matchedDesig = designationsList.find(d => d.id === formData.designation_id);
    const designation_name = matchedDesig ? matchedDesig.name : 'All Designations';

    const isEdit = Boolean(editingStructure);
    const ok = await confirm({
      title: isEdit ? 'Confirm Update Salary Structure' : 'Confirm New Salary Structure',
      message: isEdit
        ? `Are you sure you want to update structure "${formData.name}" in the database?`
        : `Are you sure you want to create salary structure "${formData.name}" for ${designation_name}?`,
      confirmText: isEdit ? 'Update Structure' : 'Create Structure',
      cancelText: 'Cancel',
      type: 'primary',
    });
    if (!ok) return;

    try {
      const payload = {
        name: formData.name.trim(),
        designationId: formData.designation_id,
        designationName: designation_name,
        basicSalary: parseFloat(formData.basic_salary) || 0,
        totalEarnings: parseFloat(formData.total_earnings) || 0,
        totalDeductions: parseFloat(formData.total_deductions) || 0,
        netSalary: parseFloat(formData.net_salary) || 0,
        status: formData.status
      };

      if (editingStructure) {
        await payrollService.updateStructure(editingStructure.id, payload);
        showToast(`Salary structure "${formData.name}" updated successfully.`);
      } else {
        await payrollService.createStructure(payload);
        showToast(`Salary structure "${formData.name}" created successfully.`);
      }

      setIsModalOpen(false);
      setEditingStructure(null);
      fetchStructures();
    } catch (err) {
      console.error('Save structure error:', err);
      showToast(err.response?.data?.message || 'Failed to save salary structure.');
    }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: 'Confirm Delete Salary Structure',
      message: `Are you sure you want to delete structure "${name}"? It will be permanently removed from PostgreSQL.`,
      confirmText: 'Delete Structure',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await payrollService.deleteStructure(id);
      showToast(`Salary structure "${name}" deleted.`);
      fetchStructures();
    } catch (err) {
      console.error('Delete structure error:', err);
      showToast('Failed to delete salary structure.');
    }
  };

  // Filtered Structures
  const filteredStructures = structures.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.designation_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDesig = selectedDesignation === 'All' || s.designation_name === selectedDesignation;
    return matchesSearch && matchesDesig;
  });

  const pagination = useTablePagination(filteredStructures, 10);

  // Calculate Statistical Cards Data
  const totalBands = structures.length;
  const avgBasic = totalBands ? Math.round(structures.reduce((acc, curr) => acc + curr.basic_salary, 0) / totalBands) : 0;
  const avgNet = totalBands ? Math.round(structures.reduce((acc, curr) => acc + curr.net_salary, 0) / totalBands) : 0;
  const activeCount = structures.filter(s => s.status === 'Active').length;

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

        {/* View Header */}
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
              <i className="fa-solid fa-network-wired"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Salary Structures &amp; Pay Bands
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Manage salary packages, pay grades mapped to designations &amp; allowance formulas &bull; AY 2026&ndash;2027
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
              <span>Create Structure</span>
            </button>
            <Link 
              to="/unilms/org/hr/payroll/components" 
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-calculator" style={{ color: '#DB2777' }}></i>
              <span>Pay Components</span>
            </Link>
          </div>
        </div>

        {/* Statistical KPI Cards (stacal data) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Defined Structures
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>
                {totalBands} Bands
              </div>
              <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px', fontWeight: '600' }}>
                {activeCount} Active / 100% Operational
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-network-wired"></i>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Average Basic Pay
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>
                ₹{avgBasic.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                Across all academic ranks
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-indian-rupee-sign"></i>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Avg Net Monthly CTC
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                ₹{avgNet.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                Net after standard deductions
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-wallet"></i>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Highest Grade Band
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#7C3AED', marginTop: '4px' }}>
                ₹{structures.length ? Math.max(...structures.map(s => s.net_salary)).toLocaleString('en-IN') : 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                Prof Level 14 Senior CTC
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-arrow-trend-up"></i>
            </div>
          </div>

        </div>

        {/* Filter and Table Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#1E293B' }}>
                Configured Salary Structures
              </h3>
              <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}>
                {filteredStructures.length} Listed
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '180px' }}>
                <select
                  value={selectedDesignation}
                  onChange={(e) => setSelectedDesignation(e.target.value)}
                  className="form-control"
                  style={{ height: '38px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="All">All Designations</option>
                  {designationsList.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: '240px' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control" 
                  placeholder="Search structure or rank..." 
                  style={{ height: '38px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                />
              </div>
            </div>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: '0' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Structure Name</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Designation</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Basic Pay</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Earnings</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Deductions</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Monthly CTC</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeletonLoader columns={8} rows={5} />
                ) : pagination.paginatedItems.length > 0 ? (
                  pagination.paginatedItems.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--text-main, #1e293b)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontSize: '13px' }}>
                            <i className="fa-solid fa-network-wired"></i>
                          </span>
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontWeight: '600', fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }}>
                          {s.designation_name || 'All Designations'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: '600' }}>
                        ₹{Number(s.basic_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#10B981', fontWeight: '700' }}>
                        ₹{Number(s.total_earnings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#EF4444', fontWeight: '700' }}>
                        ₹{Number(s.total_deductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <strong style={{ color: '#4F46E5', fontSize: '15px' }}>
                          ₹{Number(s.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: '700', fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button 
                            type="button" 
                            className="btn btn-outline" 
                            onClick={() => openEditModal(s)}
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                            title="Edit Structure"
                          >
                            <i className="fa-solid fa-pen-to-square"></i> Edit
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline text-danger" 
                            onClick={() => handleDelete(s.id, s.name)}
                            style={{ padding: '6px 12px', fontSize: '12px', color: '#DC2626', borderColor: 'rgba(220, 38, 38, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '6px', cursor: 'pointer' }}
                            title="Delete Structure"
                          >
                            <i className="fa-solid fa-trash"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                      <div style={{ maxWidth: '340px', margin: '0 auto' }}>
                        <div style={{ width: '56px', height: '56px', background: 'rgba(79, 70, 229, 0.08)', color: '#4F46E5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>
                          <i className="fa-solid fa-network-wired"></i>
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>No Salary Structures Found</h4>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                          No matching salary packages or pay grades found for the selected criteria.
                        </p>
                        <button type="button" className="btn btn-primary" onClick={openAddModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: '600' }}>
                          <i className="fa-solid fa-plus"></i> New Salary Structure
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination {...pagination} itemName="salary structures" />
        </div>

        {/* Structure Modal / Drawer */}
        <div 
          id="structModal" 
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
            if (e.target.id === 'structModal') setIsModalOpen(false);
          }}
        >
          <div 
            className="drawer-content" 
            style={{ 
              maxWidth: '560px', 
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
                  <i className="fa-solid fa-network-wired"></i>
                  {editingStructure ? 'Edit Salary Structure' : 'Add Salary Structure'}
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
                    Structure Title / Grade <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control" 
                    required 
                    placeholder="e.g. Associate Professor Level-12 Band" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                    Applicable Designation
                  </label>
                  <select 
                    name="designation_id" 
                    className="form-control"
                    value={formData.designation_id}
                    onChange={(e) => setFormData({ ...formData, designation_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">Any / General Designation</option>
                    {designationsList.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Base / Basic Pay (₹) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input 
                      type="number" 
                      step="100" 
                      name="basic_salary" 
                      className="form-control" 
                      required 
                      value={formData.basic_salary}
                      onChange={(e) => setFormData({ ...formData, basic_salary: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Total Earnings (Gross ₹)
                    </label>
                    <input 
                      type="number" 
                      step="100" 
                      name="total_earnings" 
                      className="form-control" 
                      value={formData.total_earnings}
                      onChange={(e) => handleEarningsDeductionsChange('total_earnings', e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Total Deductions (PF/Tax ₹)
                    </label>
                    <input 
                      type="number" 
                      step="100" 
                      name="total_deductions" 
                      className="form-control" 
                      value={formData.total_deductions}
                      onChange={(e) => handleEarningsDeductionsChange('total_deductions', e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Net Monthly Salary (₹)
                    </label>
                    <input 
                      type="number" 
                      step="100" 
                      name="net_salary" 
                      className="form-control" 
                      readOnly 
                      value={formData.net_salary}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#F1F5F9', fontWeight: '700', color: '#4F46E5' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                    Status
                  </label>
                  <select 
                    name="status" 
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Under Revision">Under Revision</option>
                  </select>
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
                  <i className="fa-solid fa-check"></i> {editingStructure ? 'Update Structure' : 'Save Structure'}
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

export default OrgHrPayrollStructures;