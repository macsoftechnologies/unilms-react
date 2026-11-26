import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import studentsService from '../../../services/students.service';
import apiClient from '../../../services/api';

const initialRegistrations = [];

const OrgExaminationsExternalRegistrations = () => {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [feeFilter, setFeeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    exam_name: '',
    registration_no: '',
    registration_date: new Date().toISOString().split('T')[0],
    fee_paid: true
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.allSettled([
      apiClient.get('/tenants/settings/org_external_registrations'),
      studentsService.getStudents()
    ]).then(([regRes, stuRes]) => {
      if (!isMounted) return;
      if (regRes.status === 'fulfilled' && regRes.value?.data?.value && Array.isArray(regRes.value.data.value)) {
        setRegistrations(regRes.value.data.value);
      }
      if (stuRes.status === 'fulfilled') {
        const sList = Array.isArray(stuRes.value) ? stuRes.value : (stuRes.value?.data || []);
        setStudents(sList.map(s => ({
          id: s.id,
          name: `${s.firstName || s.first_name || ''} ${s.lastName || s.last_name || ''}`.trim() || 'Student',
          roll: s.rollNumber || s.roll_number || 'N/A'
        })));
      }
    }).finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const filtered = registrations.filter(r => {
    const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
    const roll = r.roll_number.toLowerCase();
    const regNo = (r.registration_no || '').toLowerCase();
    const exName = r.exam_name.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(q) || roll.includes(q) || regNo.includes(q) || exName.includes(q);
    const matchesFee = feeFilter === 'All' ? true : feeFilter === 'Paid' ? r.fee_paid : !r.fee_paid;
    return matchesSearch && matchesFee;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedRegistrations,
    totalItems
  } = useTablePagination(filtered, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, feeFilter, setCurrentPage]);

  const handleSave = (e) => {
    e.preventDefault();
    const st = students.find(s => String(s.id) === String(formData.student_id)) || (students[0] || { name: 'Student', roll: 'N/A' });
    const [firstName, ...rest] = (st.name || 'Student').split(' ');
    const lastName = rest.join(' ');

    const newReg = {
      id: Date.now(),
      first_name: firstName,
      last_name: lastName,
      roll_number: st.roll,
      exam_name: formData.exam_name,
      registration_no: formData.registration_no || `REG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      registration_date: formData.registration_date,
      fee_paid: formData.fee_paid
    };

    const updated = [newReg, ...registrations];
    setRegistrations(updated);
    apiClient.post('/tenants/settings/org_external_registrations', { value: updated }).catch(() => {});
    setIsModalOpen(false);
    setFormData({
      student_id: students[0]?.id || '',
      exam_name: '',
      registration_no: '',
      registration_date: new Date().toISOString().split('T')[0],
      fee_paid: true
    });
  };

  const toggleFee = (id) => {
    const updated = registrations.map(r => r.id === id ? { ...r, fee_paid: !r.fee_paid } : r);
    setRegistrations(updated);
    apiClient.post('/tenants/settings/org_external_registrations', { value: updated }).catch(() => {});
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this external registration record?')) {
      const updated = registrations.filter(r => r.id !== id);
      setRegistrations(updated);
      apiClient.post('/tenants/settings/org_external_registrations', { value: updated }).catch(() => {});
    }
  };

  return (
    <>
      <section className="view-section active">
        {/* Top Header Card */}
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
                background: 'linear-gradient(135deg, #059669, #0D9488)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
              }}
            >
              <i className="fa-solid fa-id-card-clip"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                External Exam Registrations (University / Board)
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Supplementary enrollments, external board exams, hall ticket dispatch &amp; fee statuses
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setIsModalOpen(true)} 
              style={{ background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)', color: '#fff', border: 'none', padding: '10px 18px', fontWeight: '700', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)', whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>New Registration</span>
            </button>
            <Link 
              to="/unilms/org/examinations" 
              className="btn btn-outline" 
              style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-arrow-left" style={{ color: '#059669' }}></i>
              <span>Exams Hub</span>
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="card" style={{ padding: '14px 18px', marginBottom: '18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search candidate, roll, reg #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid var(--border-color)', width: '100%', fontSize: '13px' }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8', fontSize: '12px' }}></i>
            </div>
            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#fff' }}
            >
              <option value="All">All Fee Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      
        <div className="table-container card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)', overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Student Candidate</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Exam Name / University</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Registration Number</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Fee Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedRegistrations.length > 0 ? (
                paginatedRegistrations.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{r.first_name} {r.last_name}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.roll_number}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-primary)' }}>{r.exam_name}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge" style={{ background: '#F1F5F9', color: '#334155', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {r.registration_no}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{r.registration_date}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span 
                        onClick={() => toggleFee(r.id)}
                        title="Click to toggle fee status"
                        style={{
                          cursor: 'pointer',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: r.fee_paid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: r.fee_paid ? '#059669' : '#dc2626'
                        }}
                      >
                        {r.fee_paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button 
                        type="button" 
                        onClick={() => handleDelete(r.id)} 
                        className="btn btn-outline" 
                        style={{ padding: '4px 8px', fontSize: '12px', color: '#DC2626', borderColor: '#FECACA' }}
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No external registrations found.
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
            itemName="registrations"
          />
        </div>
      </section>

      {/* Drawer */}
      {isModalOpen && (
        <div 
          className="drawer-overlay active" 
          onClick={(e) => {
            if (e.target.classList.contains('drawer-overlay')) setIsModalOpen(false);
          }}
          style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div className="drawer-content" style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <form onSubmit={handleSave}>
              <div style={{ background: 'linear-gradient(135deg, #059669, #0D9488)', color: '#fff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>New External Exam Registration</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Select Candidate *</label>
                  <select 
                    value={formData.student_id} 
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} 
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                    required
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.roll})</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Exam Name / University / Board *</label>
                  <input 
                    type="text" 
                    value={formData.exam_name} 
                    onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })} 
                    required 
                    placeholder="e.g. State University Regular 2026"
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Registration No (optional)</label>
                  <input 
                    type="text" 
                    value={formData.registration_no} 
                    onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })} 
                    placeholder="Leave blank to auto-generate"
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Registration Date *</label>
                  <input 
                    type="date" 
                    value={formData.registration_date} 
                    onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })} 
                    required
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.fee_paid} 
                      onChange={(e) => setFormData({ ...formData, fee_paid: e.target.checked })} 
                    />
                    <span>Exam Fee Paid by Candidate</span>
                  </label>
                </div>
              </div>
              <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700' }}>Save Registration</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgExaminationsExternalRegistrations;
