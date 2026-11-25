import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import admissionsService from '../../../services/admissions.service';
import studentsService from '../../../services/students.service';

const OrgAdmissionsScholarships = () => {
  const [scholarships, setScholarships] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [scholarshipName, setScholarshipName] = useState('');
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('applied');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [schData, stuData, appsData] = await Promise.all([
        admissionsService.getScholarships(),
        studentsService.getStudents(),
        admissionsService.getApplications()
      ]);

      setScholarships(Array.isArray(schData) ? schData : []);

      // Combine enrolled students and applicants for selection
      const combined = [
        ...(Array.isArray(stuData) ? stuData : []).map(s => ({
          id: s.id,
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
          roll: s.rollNumber || 'Enrolled',
          program: s.program?.name || s.program || 'Degree'
        })),
        ...(Array.isArray(appsData) ? appsData : []).map(a => ({
          id: a.id,
          name: a.fullName || a.full_name,
          roll: a.applicationNumber || a.adm_number,
          program: a.programName || a.program?.name || 'Applicant'
        }))
      ];
      setStudentsList(combined);
    } catch (e) {
      console.warn('Failed to load scholarships data:', e);
      setScholarships([]);
      setStudentsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReset = () => {
    setEditingId(null);
    setStudentId('');
    setScholarshipName('');
    setDonorName('');
    setAmount('');
    setStatus('applied');
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setStudentId(item.student_id ? item.student_id.toString() : '');
    setScholarshipName(item.scholarship_name);
    setDonorName(item.donor_name);
    setAmount(item.amount.toString());
    setStatus(item.status);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const st = studentsList.find((s) => s.id.toString() === studentId);
    if (!st && !editingId) {
      alert('Please select a student');
      return;
    }

    try {
      if (editingId) {
        await admissionsService.updateScholarship(editingId, {
          scholarship_name: scholarshipName,
          donor_name: donorName,
          amount: parseFloat(amount) || 0,
          status: status
        });
        showToast('Scholarship entry updated successfully!');
      } else {
        await admissionsService.createScholarship({
          student_id: st.id,
          student_name: st.name,
          roll_number: st.roll,
          scholarship_name: scholarshipName,
          donor_name: donorName || 'Institutional Grant',
          amount: parseFloat(amount) || 0,
          status: status
        });
        showToast(`Scholarship recorded for ${st.name}!`);
      }
      handleReset();
      await loadData();
    } catch (err) {
      alert('Failed to save scholarship: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDisburse = async (id) => {
    try {
      await admissionsService.updateScholarship(id, { status: 'disbursed' });
      showToast('Scholarship marked as Disbursed!');
      await loadData();
    } catch (e) {
      alert('Failed to update status: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this scholarship record?')) {
      try {
        await admissionsService.deleteScholarship(id);
        showToast('Record deleted.');
        if (editingId === id) handleReset();
        await loadData();
      } catch (e) {
        alert('Failed to delete scholarship: ' + (e.response?.data?.message || e.message));
      }
    }
  };

  const totalDisbursed = scholarships
    .filter((s) => s.status === 'disbursed')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalAwarded = scholarships
    .filter((s) => s.status !== 'rejected')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredList = scholarships.filter((s) => {
    const matchesSearch =
      s.student_name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(search.toLowerCase()) ||
      s.scholarship_name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pagination = useTablePagination(filteredList, 10);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'disbursed':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)', label: 'DISBURSED' };
      case 'approved':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563EB', border: '1px solid rgba(59, 130, 246, 0.25)', label: 'APPROVED' };
      case 'rejected':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#DC2626', border: '1px solid rgba(239, 68, 68, 0.25)', label: 'REJECTED' };
      default:
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#D97706', border: '1px solid rgba(245, 158, 11, 0.25)', label: 'APPLIED' };
    }
  };

  return (
    <div className="scholarships-page-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 10000,
            background: '#10B981',
            color: '#fff',
            padding: '12px 22px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '600',
            animation: 'modalFadeIn 0.2s ease'
          }}
        >
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      <section className="view-section active">
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
                background: 'linear-gradient(135deg, #059669, #0D9488)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
              }}
            >
              <i className="fa-solid fa-award"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Scholarships &amp; Financial Aid Tracking
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Manage institutional grants, government merit disbursements &amp; financial welfare programs &bull; AY 2026&ndash;2027
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
            to="/unilms/org/admissions/applications"
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
            <i className="fa-solid fa-file-lines" style={{ color: '#0D9488' }}></i>
            <span>Applications</span>
          </Link>
          </div>
        </div>

        {/* Statistical KPI Cards - Modern Compact Reference Cards */}
        <div className="faculty-kpi-grid">
          {/* Card 1: Total Sanctioned Aid */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
              <i className="fa-solid fa-hand-holding-dollar"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Total Sanctioned Aid</div>
              <div className="faculty-metric-value" style={{ color: '#7C3AED' }}>
                ₹{totalAwarded.toLocaleString('en-IN')}
              </div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Across {scholarships.length} applications</span>
              </div>
            </div>
          </div>

          {/* Card 2: Disbursed Funds */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <i className="fa-solid fa-money-bill-transfer"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Disbursed Funds</div>
              <div className="faculty-metric-value" style={{ color: '#059669' }}>
                ₹{totalDisbursed.toLocaleString('en-IN')}
              </div>
              <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>Direct bank transfers done</span>
              </div>
            </div>
          </div>

          {/* Card 3: Beneficiary Scholars */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' }}>
              <i className="fa-solid fa-user-graduate"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Beneficiary Scholars</div>
              <div className="faculty-metric-value" style={{ color: '#2563EB' }}>{scholarships.length} Students</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Merit &amp; needs-based scholars</span>
              </div>
            </div>
          </div>

          {/* Card 4: Pending Approvals */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <i className="fa-solid fa-hourglass-half"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Pending Approvals</div>
              <div className="faculty-metric-value" style={{ color: '#D97706' }}>
                {scholarships.filter((s) => s.status === 'applied').length}
              </div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Under committee review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add / Edit Form Card */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className={editingId ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-hand-holding-dollar'}></i>
              {editingId ? 'Edit Scholarship Record' : 'Record New Scholarship Grant'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleReset}
                style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>
                Select Student <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="form-control"
                required
                disabled={!!editingId}
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1.5px solid #E5E7EB', padding: '0 12px', fontSize: '13.5px' }}
              >
                <option value="">-- Choose Student / Applicant --</option>
                {studentsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.roll}) - {s.program}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>
                Scholarship Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={scholarshipName}
                onChange={(e) => setScholarshipName(e.target.value)}
                className="form-control"
                required
                placeholder="e.g. Merit Fellowship"
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1.5px solid #E5E7EB', padding: '0 12px', fontSize: '13.5px' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>
                Funding Agency / Source
              </label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="form-control"
                placeholder="e.g. AICTE / State Trust"
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1.5px solid #E5E7EB', padding: '0 12px', fontSize: '13.5px' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>
                Grant Amount (₹) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-control"
                required
                placeholder="e.g. 50000"
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1.5px solid #E5E7EB', padding: '0 12px', fontSize: '13.5px' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '6px' }}>
                Status <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-control"
                required
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1.5px solid #E5E7EB', padding: '0 12px', fontSize: '13.5px' }}
              >
                <option value="applied">Applied</option>
                <option value="approved">Approved</option>
                <option value="disbursed">Disbursed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                height: '40px',
                borderRadius: '8px',
                border: 'none',
                background: '#7C3AED',
                color: '#FFFFFF',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(124, 58, 237, 0.3)'
              }}
            >
              <i className="fa-solid fa-floppy-disk me-1"></i>
              {editingId ? 'Update Entry' : 'Save Scholarship'}
            </button>
          </form>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 'min(100%, 200px)', maxWidth: '340px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
            <input
              type="text"
              placeholder="Search student, roll number, or grant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', borderRadius: '10px', fontSize: '13.5px', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
            {['ALL', 'applied', 'approved', 'disbursed', 'rejected'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  border: '1px solid',
                  borderColor: statusFilter === st ? '#7C3AED' : '#E2E8F0',
                  background: statusFilter === st ? '#7C3AED' : '#FFFFFF',
                  color: statusFilter === st ? '#FFFFFF' : '#475569',
                  cursor: 'pointer'
                }}
              >
                {st === 'ALL' ? 'All Statuses' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Table Card */}
        <div className="table-container" style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-color)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Roll Number</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scholarship Scheme</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Funding Source</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonLoader columns={7} rows={5} />
              ) : pagination.paginatedItems.length > 0 ? (
                pagination.paginatedItems.map((sc) => {
                  const badge = getStatusBadge(sc.status);
                  return (
                    <tr key={sc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <strong style={{ color: '#1E293B', fontSize: '14px' }}>{sc.student_name}</strong>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <strong style={{ color: '#7C3AED', fontSize: '13px' }}>{sc.roll_number}</strong>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13.5px', color: '#1E293B' }}>
                        {sc.scholarship_name}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', color: '#64748B' }}>
                        {sc.donor_name}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontWeight: '700', color: '#10B981', fontSize: '14px' }}>
                        ₹{sc.amount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ background: badge.bg, color: badge.color, border: badge.border, padding: '4px 10px', borderRadius: '16px', fontSize: '11.5px', fontWeight: '700' }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {sc.status !== 'disbursed' && (
                            <button
                              type="button"
                              onClick={() => handleDisburse(sc.id)}
                              className="btn btn-sm btn-success"
                              style={{
                                padding: '4px 9px',
                                fontSize: '11.5px',
                                background: '#10B981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                              title="Mark Disbursed"
                            >
                              <i className="fa-solid fa-check"></i> Disburse
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEdit(sc)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11.5px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              background: '#FFFFFF',
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                            title="Edit"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(sc.id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11.5px',
                              borderRadius: '6px',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              background: 'rgba(239, 68, 68, 0.08)',
                              color: '#EF4444',
                              cursor: 'pointer'
                            }}
                            title="Delete"
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    <i className="fa-solid fa-hand-holding-dollar" style={{ fontSize: '30px', opacity: 0.3, marginBottom: '8px', display: 'block' }}></i>
                    No scholarship records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <TablePagination {...pagination} itemName="scholarships" />
        </div>
      </section>
    </div>
  );
};

export default OrgAdmissionsScholarships;