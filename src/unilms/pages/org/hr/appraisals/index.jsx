import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../../components';
import staffService from '../../../../services/staff.service';
import apiClient from '../../../../services/api';

const defaultAppraisals = [];

const OrgHrAppraisalsIndex = () => {
  const [appraisals, setAppraisals] = useState(defaultAppraisals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [liveStaff, setLiveStaff] = useState([]);

  // Fetch appraisals from PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const fetchAppraisals = async () => {
      try {
        const res = await apiClient.get('/tenants/settings/org_hr_appraisals');
        const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
        if (isMounted && list.length >= 0) {
          setAppraisals(list);
        }
      } catch (err) {
        console.warn('Could not load appraisals from database:', err);
      }
    };
    fetchAppraisals();
    return () => { isMounted = false; };
  }, []);

  const persistAppraisals = async (updatedList) => {
    setAppraisals(updatedList);
    try {
      await apiClient.post('/tenants/settings/org_hr_appraisals', updatedList);
    } catch (err) {
      console.error('Failed to persist appraisals to PostgreSQL:', err);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const data = await staffService.getStaff();
      const list = (Array.isArray(data) ? data : []).map(s => ({
        id: s.id,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Staff Member',
        code: s.employeeCode || '—',
        desig: s.designation || 'Faculty',
        dept: s.department?.name || 'Department'
      }));
      setLiveStaff(list);
      if (list.length > 0 && !formData.employee_id) {
        setFormData(prev => ({ ...prev, employee_id: list[0].id }));
      }
    } catch (e) {
      console.warn('Failed to fetch staff for appraisals:', e);
    }
  };

  useEffect(() => {
    fetchStaffMembers();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchStaffMembers();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [formData, setFormData] = useState({
    employee_id: '',
    appraisal_period: 'AY 2025-26 (Annual)',
    recommendation: 'Salary Increment (10%)',
    self_rating: 8.0,
    hod_rating: 8.5,
    final_score: 8.2,
    strengths: '',
    areas_for_improvement: ''
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openAddModal = () => {
    setFormData({
      employee_id: '',
      appraisal_period: 'AY 2025-26 (Annual)',
      recommendation: 'Salary Increment (10%)',
      self_rating: 8.0,
      hod_rating: 8.5,
      final_score: 8.2,
      strengths: '',
      areas_for_improvement: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.employee_id) return;

    const matchedStaff = liveStaff.find(s => String(s.id) === String(formData.employee_id));
    if (!matchedStaff) return;

    const newAppraisal = {
      id: Date.now(),
      employee_name: matchedStaff.name,
      employee_code: matchedStaff.code,
      designation_name: matchedStaff.desig,
      department_name: matchedStaff.dept,
      appraisal_period: formData.appraisal_period,
      self_rating: parseFloat(formData.self_rating) || 8.0,
      hod_rating: parseFloat(formData.hod_rating) || 8.5,
      final_score: parseFloat(formData.final_score) || 8.2,
      recommendation: formData.recommendation,
      reviewer_name: 'Academic Council Committee',
      review_date: new Date().toISOString().split('T')[0],
      status: 'Approved'
    };

    const updated = [newAppraisal, ...appraisals];
    persistAppraisals(updated);
    showToast(`Appraisal for ${newAppraisal.employee_name} recorded successfully.`);
    setIsModalOpen(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete appraisal record for "${name}"?`)) {
      const updated = appraisals.filter(a => a.id !== id);
      persistAppraisals(updated);
      showToast(`Appraisal record deleted.`);
    }
  };

  const filteredAppraisals = appraisals.filter(a =>
    a.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.employee_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredAppraisals, 10);

  const avgFinalScore = appraisals.length 
    ? (appraisals.reduce((acc, curr) => acc + curr.final_score, 0) / appraisals.length).toFixed(1) 
    : '0.0';

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
              <i className="fa-solid fa-chart-line"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Staff Performance Appraisals
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Manage faculty self-assessments, HOD evaluations, ratings &amp; promotion recommendations &bull; AY 2026&ndash;2027
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
              <span>New Appraisal</span>
            </button>
            <Link 
              to="/unilms/org/hr/employees" 
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-users" style={{ color: '#DB2777' }}></i>
              <span>Staff Directory</span>
            </Link>
          </div>
        </div>

        {/* Statistical KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Completed Appraisals
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>
                {appraisals.length} Reviews
              </div>
              <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: '600' }}>
                100% Committee Ratified
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-chart-line"></i>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Average Final Score
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>
                {avgFinalScore} / 10
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                Faculty Performance Benchmark
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-star"></i>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Promotion & Increments
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                {appraisals.length} Recommended
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                Positive Growth Rating
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-arrow-trend-up"></i>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Current Review Cycle
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#7C3AED', marginTop: '4px' }}>
                AY 2025-26
              </div>
              <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px', fontWeight: '600' }}>
                Cycle Finalized
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-calendar-check"></i>
            </div>
          </div>

        </div>

        {/* Filter and Table */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#1E293B' }}>
                Performance Records
              </h3>
              <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}>
                {filteredAppraisals.length} Recorded
              </span>
            </div>

            <div style={{ minWidth: '260px' }}>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control" 
                placeholder="Search staff name or department..." 
                style={{ height: '38px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
              />
            </div>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: '0' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee & Dept</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Period</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Self Score</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HOD Score</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Final Score</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommendation</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reviewed By</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={9} rows={pageSize || 5} />
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <strong style={{ color: '#1E293B' }}>{a.employee_name}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                          {a.designation_name} • {a.department_name}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: '600' }}>
                        {a.appraisal_period}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {a.self_rating} / 10
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {a.hod_rating} / 10
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <strong style={{ color: '#4F46E5', fontSize: '15px' }}>{a.final_score}</strong> / 10
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: '600', fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }}>
                          <i className="fa-solid fa-circle-arrow-up me-1"></i> {a.recommendation}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div>{a.reviewer_name}</div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>{a.review_date}</span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontWeight: '600', fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button 
                          type="button" 
                          className="btn btn-outline text-danger" 
                          onClick={() => handleDelete(a.id, a.employee_name)}
                          style={{ padding: '6px 12px', fontSize: '12px', color: '#DC2626', borderColor: 'rgba(220, 38, 38, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-trash"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      No appraisal records match your search.
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
            itemName="performance appraisals"
          />
        </div>

        {/* Add Appraisal Modal */}
        <div 
          id="appraisalModal" 
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
            if (e.target.id === 'appraisalModal') setIsModalOpen(false);
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
                  <i className="fa-solid fa-chart-line"></i>
                  Record Performance Appraisal
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
                    Select Staff / Faculty Member <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select 
                    name="employee_id" 
                    className="form-control" 
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Choose Employee --</option>
                    {liveStaff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code}) - {s.dept}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Appraisal Period
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.appraisal_period}
                      onChange={(e) => setFormData({ ...formData, appraisal_period: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Recommendation
                    </label>
                    <select 
                      className="form-control"
                      value={formData.recommendation}
                      onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="Promotion to Higher Grade">Promotion to Higher Grade</option>
                      <option value="Salary Increment (10%)">Salary Increment (10%)</option>
                      <option value="Salary Increment (8%)">Salary Increment (8%)</option>
                      <option value="Performance Bonus">Performance Bonus</option>
                      <option value="Retain Current Scale">Retain Current Scale</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Self (0-10)
                    </label>
                    <input 
                      type="number" 
                      step="0.1" 
                      max="10" 
                      min="0" 
                      className="form-control" 
                      value={formData.self_rating}
                      onChange={(e) => setFormData({ ...formData, self_rating: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      HOD (0-10)
                    </label>
                    <input 
                      type="number" 
                      step="0.1" 
                      max="10" 
                      min="0" 
                      className="form-control" 
                      value={formData.hod_rating}
                      onChange={(e) => setFormData({ ...formData, hod_rating: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                      Final (0-10)
                    </label>
                    <input 
                      type="number" 
                      step="0.1" 
                      max="10" 
                      min="0" 
                      className="form-control" 
                      value={formData.final_score}
                      onChange={(e) => setFormData({ ...formData, final_score: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#1e293b' }}>
                    Key Strengths & Research Highlights
                  </label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    placeholder="Research publications, student feedback rating, curriculum innovation..."
                    value={formData.strengths}
                    onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  ></textarea>
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
                  <i className="fa-solid fa-check"></i> Save Appraisal
                </button>
              </div>
            </form>
          </div>
        </div>

      </section>
    </>
  );
};

export default OrgHrAppraisalsIndex;