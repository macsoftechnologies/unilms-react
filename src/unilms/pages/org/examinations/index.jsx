import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import examinationsService from '../../../services/examinations.service';

const OrgExaminationsIndex = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    type: 'REGULAR',
    term: 'Semester 1',
    academicYear: '2026-2027',
    startDate: '2026-12-01',
    endDate: '2026-12-20',
    description: ''
  });

  const showToast = (msg, type = 'success') => {
    setToastMsg({ text: msg, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadExams = async () => {
    setLoading(true);
    try {
      const data = await examinationsService.getExams();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setExams(list);
    } catch (err) {
      console.error('Failed to load exams:', err);
      showToast('Could not load examination cycles from server.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const filteredExams = exams.filter(ex => {
    const examName = (ex.title || ex.name || '').toLowerCase();
    const matchesSearch = !searchQuery || examName.includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || (ex.type || '').toUpperCase() === filterType.toUpperCase();
    return matchesSearch && matchesType;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedExams,
    totalItems
  } = useTablePagination(filteredExams, 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const confirmed = await confirm({
      title: editingId ? 'Confirm Update Exam Cycle' : 'Confirm Create Exam Cycle',
      message: `Are you sure you want to ${editingId ? 'update' : 'create'} "${formData.title}"?`,
      details: [
        `Examination Type: ${formData.type}`,
        `Academic Term: ${formData.term} (${formData.academicYear})`,
        `Schedule Window: ${formData.startDate} to ${formData.endDate}`
      ],
      confirmText: editingId ? 'Yes, Update Cycle' : 'Yes, Create Cycle',
      variant: editingId ? 'primary' : 'success'
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await examinationsService.updateExam(editingId, {
          title: formData.title,
          name: formData.title,
          type: formData.type,
          term: formData.term,
          academicYear: formData.academicYear,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
          description: formData.description
        });
        showToast('Exam cycle updated successfully!');
        setEditingId(null);
      } else {
        await examinationsService.createExam({
          title: formData.title,
          name: formData.title,
          type: formData.type,
          term: formData.term,
          academicYear: formData.academicYear,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
          description: formData.description
        });
        showToast('New exam cycle created successfully!');
      }

      setFormData({
        title: '',
        type: 'REGULAR',
        term: 'Semester 1',
        academicYear: '2026-2027',
        startDate: '2026-12-01',
        endDate: '2026-12-20',
        description: ''
      });
      await loadExams();
    } catch (err) {
      console.error('Error saving exam:', err);
      showToast(err?.response?.data?.message || 'Failed to save examination cycle', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (exam) => {
    setEditingId(exam.id);
    setFormData({
      title: exam.title || exam.name || '',
      type: (exam.type || 'REGULAR').toUpperCase(),
      term: exam.term || 'Semester 1',
      academicYear: exam.academicYear || '2026-2027',
      startDate: exam.startDate ? exam.startDate.substring(0, 10) : '2026-12-01',
      endDate: exam.endDate ? exam.endDate.substring(0, 10) : '2026-12-20',
      description: exam.description || ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      title: '',
      type: 'REGULAR',
      term: 'Semester 1',
      academicYear: '2026-2027',
      startDate: '2026-12-01',
      endDate: '2026-12-20',
      description: ''
    });
  };

  const handleDelete = async (id, title) => {
    const confirmed = await confirm({
      title: 'Confirm Delete Examination Cycle',
      message: `Are you sure you want to delete exam cycle "${title}"?`,
      details: 'Warning: Deleting this exam cycle will erase all linked schedule slots, marks, and hall ticket records.',
      confirmText: 'Yes, Delete Exam Cycle',
      cancelText: 'Keep Exam Cycle',
      variant: 'danger',
      icon: 'fa-solid fa-trash-can'
    });
    if (!confirmed) return;

    try {
      await examinationsService.deleteExam(id);
      showToast('Exam cycle removed successfully.');
      await loadExams();
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Cannot delete exam cycle if schedules or marks exist.', 'danger');
    }
  };

  // KPIs
  const totalCycles = exams.length;
  const regularCount = exams.filter(e => (e.type || '').toUpperCase() === 'REGULAR').length;
  const suppCount = exams.filter(e => (e.type || '').toUpperCase() === 'SUPPLEMENTARY').length;
  const midtermCount = exams.filter(e => (e.type || '').toUpperCase().includes('MID')).length;

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          background: toastMsg.type === 'danger' ? '#EF4444' : '#10B981',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          fontWeight: '600',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className={toastMsg.type === 'danger' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'}></i>
          {toastMsg.text}
        </div>
      )}

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
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
            }}
          >
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Exam Setup &amp; Governance
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Define institutional exam cycles, eligibility regulations, and active evaluation sessions &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        {/* Quick Nav Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to="/unilms/org/examinations/schedules"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}
          >
            <i className="fa-regular fa-calendar-days"></i> Timetables
          </Link>
          <Link
            to="/unilms/org/examinations/hall_tickets"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}
          >
            <i className="fa-solid fa-ticket"></i> Hall Tickets &amp; Fee Gate
          </Link>
          <Link
            to="/unilms/org/examinations/marks_entry"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}
          >
            <i className="fa-solid fa-pen"></i> Marks Entry
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Exam Cycles</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{totalCycles}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-layer-group"></i>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase' }}>Regular Terminals</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#16A34A', marginTop: '4px' }}>{regularCount}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-calendar-check"></i>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#DC2626', textTransform: 'uppercase' }}>Supplementary Rounds</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>{suppCount}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#D97706', textTransform: 'uppercase' }}>Midterm / Internal</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>{midtermCount}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-list-check"></i>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 360px) 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Form Column */}
        <div>
          <div className="card" style={{ padding: '22px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <h2 style={{ marginTop: '0', fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className={editingId ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-plus-circle'} style={{ color: '#16A34A' }}></i>
              {editingId ? 'Edit Exam Cycle' : 'Create Exam Cycle'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>Exam Cycle Title *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. End Semester Theory Examination - Winter 2026" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>Cycle Type *</label>
                  <select 
                    className="form-control" 
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 10px', fontSize: '13px' }}
                  >
                    <option value="REGULAR">Regular Terminal</option>
                    <option value="SUPPLEMENTARY">Supplementary</option>
                    <option value="MIDTERM">Midterm / Internal</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>Academic Year</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="2026-2027"
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 10px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>Target Term / Semester</label>
                <input 
                  type="text"
                  className="form-control"
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  placeholder="e.g. Semester 1, 3, 5 or All Semesters"
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>Window Start</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 8px', fontSize: '13px' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>Window End</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 8px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>Description / Regulations</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Official notification reference, student eligibility notes..."
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '8px 12px', fontSize: '13px' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '10px 16px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Saving...' : (editingId ? 'Update Exam Cycle' : 'Create Exam Cycle')}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={handleCancel}
                    className="btn btn-outline"
                    style={{ padding: '10px 14px', borderRadius: '8px' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Right Table Column */}
        <div>
          <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            
            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px' }}></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search exam cycle name..."
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#fff'
                  }}
                >
                  <option value="ALL">All Types</option>
                  <option value="REGULAR">Regular</option>
                  <option value="SUPPLEMENTARY">Supplementary</option>
                  <option value="MIDTERM">Midterm</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Exam Cycle Title</th>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Type</th>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Term / AY</th>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Window</th>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={5} rows={5} />
                  ) : paginatedExams.length > 0 ? (
                    paginatedExams.map(e => {
                      const examType = (e.type || 'REGULAR').toUpperCase();
                      const isReg = examType === 'REGULAR';
                      const isSupp = examType === 'SUPPLEMENTARY';
                      const title = e.title || e.name || 'Unnamed Exam';

                      return (
                        <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                              {title}
                            </div>
                            {e.description && (
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                {e.description}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span 
                              className="badge" 
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: isReg ? 'rgba(34, 197, 94, 0.12)' : isSupp ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color: isReg ? '#16A34A' : isSupp ? '#DC2626' : '#D97706'
                              }}
                            >
                              {examType}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '12px', color: '#334155' }}>
                            <div>{e.term || 'All Sems'}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>{e.academicYear || '2026-2027'}</div>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748B' }}>
                            {e.startDate ? new Date(e.startDate).toLocaleDateString() : 'TBD'}
                            {' - '}
                            {e.endDate ? new Date(e.endDate).toLocaleDateString() : 'TBD'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <Link
                                to={`/unilms/org/examinations/schedules?examId=${e.id}`}
                                className="btn btn-outline"
                                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', textDecoration: 'none' }}
                                title="Manage Schedules"
                              >
                                <i className="fa-regular fa-calendar-days"></i> Timetable
                              </Link>
                              <button 
                                type="button" 
                                className="btn btn-outline" 
                                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }} 
                                onClick={() => handleEdit(e)}
                              >
                                Edit
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-outline" 
                                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', color: '#DC2626', borderColor: '#FECACA' }} 
                                onClick={() => handleDelete(e.id, title)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        <i className="fa-solid fa-folder-open" style={{ fontSize: '28px', color: '#CBD5E1', display: 'block', marginBottom: '8px' }}></i>
                        No examination cycles match current filter.
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
                itemName="exam cycles"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrgExaminationsIndex;
