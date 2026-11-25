import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import admissionsService from '../../../services/admissions.service';
import studentsService from '../../../services/students.service';

const OrgAdmissionsDetained = () => {
  const [detainedList, setDetainedList] = useState([]);
  const [studentsPool, setStudentsPool] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [dateDetained, setDateDetained] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Attendance Shortfall');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [detData, stuData] = await Promise.all([
        admissionsService.getDetainedStudents(),
        studentsService.getStudents()
      ]);

      setDetainedList(Array.isArray(detData) ? detData : []);
      const pool = (Array.isArray(stuData) ? stuData : []).map(s => ({
        id: s.id,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
        roll: s.rollNumber || 'Enrolled',
        program: `${s.program?.name || s.program || 'Degree'} (${s.currentSemester || 1}st Sem)`
      }));
      setStudentsPool(pool);
    } catch (e) {
      console.warn('Failed to load detained students:', e);
      setDetainedList([]);
      setStudentsPool([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReset = () => {
    setEditingId(null);
    setStudentId('');
    setDateDetained(new Date().toISOString().split('T')[0]);
    setCategory('Attendance Shortfall');
    setReason('');
    setStatus('active');
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setStudentId(item.student_id ? item.student_id.toString() : '');
    setDateDetained(item.date_detained);
    setCategory(item.category || 'Attendance Shortfall');
    setReason(item.reason);
    setStatus(item.status);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const st = studentsPool.find((s) => s.id.toString() === studentId);
    if (!st && !editingId) {
      alert('Please select a student');
      return;
    }

    try {
      if (editingId) {
        setDetainedList(
          detainedList.map((d) =>
            d.id === editingId
              ? {
                  ...d,
                  date_detained: dateDetained,
                  category: category,
                  reason: reason.trim(),
                  status: status
                }
              : d
          )
        );
        showToast('Detention record updated successfully!');
      } else {
        const newRecord = {
          id: Date.now(),
          student_id: st.id,
          student_name: st.name,
          roll_number: st.roll,
          program: st.program,
          date_detained: dateDetained,
          category: category,
          reason: reason.trim(),
          status: status
        };
        setDetainedList([newRecord, ...detainedList]);
        showToast(`Detention recorded for ${st.name}!`);
      }
      handleReset();
    } catch (err) {
      alert('Failed to save detention: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleResolve = async (id) => {
    try {
      const item = detainedList.find(d => d.id === id);
      if (item && item.student_id) {
        await admissionsService.readmitStudent(item.student_id);
      }
      setDetainedList(
        detainedList.map((d) => (d.id === id ? { ...d, status: 'resolved' } : d))
      );
      showToast('Student detention resolved & re-instated!');
      await loadData();
    } catch (e) {
      alert('Failed to readmit student: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this detention record?')) {
      setDetainedList(detainedList.filter((d) => d.id !== id));
      showToast('Record deleted.');
      if (editingId === id) handleReset();
    }
  };

  const activeCount = detainedList.filter((d) => d.status === 'active').length;
  const attendanceShortfallCount = detainedList.filter((d) => d.status === 'active' && d.category.includes('Attendance')).length;
  const resolvedCount = detainedList.filter((d) => d.status === 'resolved').length;

  const filteredList = detainedList.filter((d) => {
    const matchesSearch =
      d.student_name.toLowerCase().includes(search.toLowerCase()) ||
      d.roll_number.toLowerCase().includes(search.toLowerCase()) ||
      d.reason.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedList,
    totalItems
  } = useTablePagination(filteredList, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, setCurrentPage]);

  return (
    <div className="detained-page-container">
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
        {/* Modern Header Card matching Reference UI */}
        <div
          style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: 'clamp(14px, 2.5vw, 20px) clamp(16px, 2.5vw, 24px)',
            marginBottom: '18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                minWidth: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
              }}
            >
              <i className="fa-solid fa-user-slash"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary, #1e293b)' }}>
                Detained Students &amp; Attendance Deficit
              </h2>
              <p style={{ margin: '3px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '12.5px' }}>
                Track students barred from examinations due to statutory attendance deficit or disciplinary actions
              </p>
            </div>
          </div>
        </div>

        {/* Statistical KPI Cards - Clean Modern Reference Cards */}
        <div className="faculty-kpi-grid">
          {/* Card 1: Currently Detained */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' }}>
              <i className="fa-solid fa-user-slash"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Currently Detained</div>
              <div className="faculty-metric-value" style={{ color: '#DC2626' }}>{activeCount} Students</div>
              <div className="faculty-metric-sub" style={{ color: '#DC2626' }}>
                <i className="fa-solid fa-ban"></i>
                <span>Barred from hall tickets</span>
              </div>
            </div>
          </div>

          {/* Card 2: Attendance Deficit */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Attendance Deficit (&lt;75%)</div>
              <div className="faculty-metric-value" style={{ color: '#D97706' }}>{attendanceShortfallCount}</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Condonation review hearings</span>
              </div>
            </div>
          </div>

          {/* Card 3: Academic / Year Back */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' }}>
              <i className="fa-solid fa-book-skull"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Academic / Year Back</div>
              <div className="faculty-metric-value" style={{ color: '#2563EB' }}>{activeCount - attendanceShortfallCount}</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Remediation tracking</span>
              </div>
            </div>
          </div>

          {/* Card 4: Resolved / Re-instated */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <i className="fa-solid fa-user-check"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Resolved / Re-instated</div>
              <div className="faculty-metric-value" style={{ color: '#059669' }}>{resolvedCount} Cases</div>
              <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>Re-joined active classes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Split Grid: Add/Edit Form + Detained Students Table */}
        <div className="admissions-split-grid">
          
          {/* Form Card */}
          <div style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: 'clamp(16px, 2.5vw, 22px)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary, #1e293b)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={editingId ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-user-slash'} style={{ color: '#EF4444' }}></i>
                <span>{editingId ? 'Edit Detention Record' : 'Record Student Detention'}</span>
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary, #334155)', marginBottom: '5px' }}>
                  Select Student <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="form-control"
                  required
                  disabled={!!editingId}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', padding: '0 10px', fontSize: '13px', boxSizing: 'border-box', background: 'var(--card-bg, #ffffff)' }}
                >
                  <option value="">-- Choose Student --</option>
                  {studentsPool.length === 0 ? (
                    <option value="" disabled>No active students found</option>
                  ) : (
                    studentsPool.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roll}) - {s.program}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary, #334155)', marginBottom: '5px' }}>
                    Date Detained <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={dateDetained}
                    onChange={(e) => setDateDetained(e.target.value)}
                    className="form-control"
                    required
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', padding: '0 10px', fontSize: '12.5px', boxSizing: 'border-box', background: 'var(--card-bg, #ffffff)' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary, #334155)', marginBottom: '5px' }}>
                    Detention Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', padding: '0 10px', fontSize: '12.5px', boxSizing: 'border-box', background: 'var(--card-bg, #ffffff)' }}
                  >
                    <option value="Attendance Shortfall">Attendance &lt;75%</option>
                    <option value="Academic Prerequisite Backlogs">Academic Backlogs</option>
                    <option value="Disciplinary Detention">Disciplinary Action</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary, #334155)', marginBottom: '5px' }}>
                  Detailed Reason / Condonation Notes <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="form-control"
                  rows="3"
                  required
                  placeholder="e.g. Attendance 58.4%. Medical certificate pending submission."
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', padding: '8px 10px', fontSize: '12.5px', boxSizing: 'border-box', background: 'var(--card-bg, #ffffff)', resize: 'vertical' }}
                ></textarea>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary, #334155)', marginBottom: '5px' }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', padding: '0 10px', fontSize: '12.5px', boxSizing: 'border-box', background: 'var(--card-bg, #ffffff)' }}
                >
                  <option value="active">Active (Currently Detained)</option>
                  <option value="resolved">Resolved (Re-instated / Condoned)</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'transform 0.15s ease'
                }}
              >
                <i className={editingId ? 'fa-solid fa-floppy-disk' : 'fa-solid fa-user-slash'}></i>
                <span>{editingId ? 'Update Record' : 'Save Detention Record'}</span>
              </button>
            </form>
          </div>

          {/* Table Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
            
            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: 'min(100%, 220px)', maxWidth: '340px' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px' }}></i>
                <input
                  type="text"
                  placeholder="Search student, roll number, or reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '34px', height: '36px', borderRadius: '8px', fontSize: '12.5px', width: '100%', border: '1px solid var(--border-color, #e2e8f0)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {[
                  { id: 'ALL', label: 'All Cases' },
                  { id: 'active', label: 'Active Detained' },
                  { id: 'resolved', label: 'Resolved' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatusFilter(item.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      border: '1px solid',
                      borderColor: statusFilter === item.id ? '#EF4444' : 'var(--border-color, #E2E8F0)',
                      background: statusFilter === item.id ? '#EF4444' : 'var(--card-bg, #FFFFFF)',
                      color: statusFilter === item.id ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive Table Container */}
            <div
              className="table-container"
              style={{
                background: 'var(--card-bg, #FFFFFF)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                overflowX: 'auto',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <table className="data-table" style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #F8FAFC)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 14px', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Student</th>
                    <th style={{ padding: '12px 14px', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Roll Number</th>
                    <th style={{ padding: '12px 14px', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date</th>
                    <th style={{ padding: '12px 14px', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Reason &amp; Category</th>
                    <th style={{ padding: '12px 14px', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</th>
                    <th style={{ padding: '12px 14px', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                  ) : paginatedList.length > 0 ? (
                    paginatedList.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <strong style={{ color: 'var(--text-primary, #1E293B)', fontSize: '13.5px' }}>{d.student_name}</strong>
                          <div style={{ color: 'var(--text-secondary, #64748B)', fontSize: '11.5px', marginTop: '2px' }}>{d.program}</div>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <span style={{ color: '#7C3AED', fontSize: '12.5px', fontWeight: '700' }}>{d.roll_number}</span>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: '12px', color: 'var(--text-secondary, #64748B)', whiteSpace: 'nowrap' }}>
                          {d.date_detained}
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: '12px', color: 'var(--text-secondary, #334155)', maxWidth: '280px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary, #1E1B4B)', marginBottom: '2px' }}>{d.category}</div>
                          <div style={{ color: 'var(--text-secondary, #64748B)', lineHeight: '1.4' }}>{d.reason}</div>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          {d.status === 'active' ? (
                            <span style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#DC2626', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '3px 9px', borderRadius: '14px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                              DETAINED
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '3px 9px', borderRadius: '14px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                              RESOLVED
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '5px' }}>
                            {d.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleResolve(d.id)}
                                className="btn btn-sm btn-success"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  background: '#10B981',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: '700'
                                }}
                                title="Resolve & Re-instate"
                              >
                                <i className="fa-solid fa-check"></i> Resolve
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleEdit(d)}
                              style={{
                                padding: '4px 7px',
                                fontSize: '11px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color, #E2E8F0)',
                                background: 'var(--card-bg, #FFFFFF)',
                                color: 'var(--text-primary, #334155)',
                                cursor: 'pointer'
                              }}
                              title="Edit"
                            >
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(d.id)}
                              style={{
                                padding: '4px 7px',
                                fontSize: '11px',
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                        <i className="fa-solid fa-user-slash" style={{ fontSize: '28px', opacity: 0.3, marginBottom: '8px', display: 'block' }}></i>
                        No detained records found matching the active filter.
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
                itemName="detention cases"
              />
            </div>

          </div>

        </div>
      </section>
    </div>
  );
};

export default OrgAdmissionsDetained;
