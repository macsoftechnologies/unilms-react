import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';
import staffService from '../../../services/staff.service';
import apiClient from '../../../services/api';

const initialPapers = [];

const OrgExaminationsSetPapers = () => {
  const [papers, setPapers] = useState(initialPapers);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    exam_name: 'End Semester Theory Finals',
    subject_name: '',
    faculty_name: '',
    paper_type: 'Set A & B (Confidential)',
    deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'Pending'
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.allSettled([
      apiClient.get('/tenants/settings/org_examination_papers'),
      academicsService.getSubjects(),
      staffService.getStaff()
    ]).then(([papRes, subRes, stfRes]) => {
      if (!isMounted) return;
      if (papRes.status === 'fulfilled' && papRes.value?.data?.value && Array.isArray(papRes.value.data.value)) {
        setPapers(papRes.value.data.value);
      }
      if (subRes.status === 'fulfilled') {
        const sList = Array.isArray(subRes.value) ? subRes.value : (subRes.value?.data || []);
        const names = sList.map(s => `${s.code ? `${s.code} ` : ''}${s.name || s.title || ''}`.trim()).filter(Boolean);
        setSubjectOptions(names);
        if (names.length > 0) {
          setFormData(prev => ({ ...prev, subject_name: prev.subject_name || names[0] }));
        }
      }
      if (stfRes.status === 'fulfilled') {
        const fList = Array.isArray(stfRes.value) ? stfRes.value : (stfRes.value?.data || []);
        const names = fList.map(f => `${f.firstName || f.first_name || ''} ${f.lastName || f.last_name || ''}`.trim() || f.name).filter(Boolean);
        setFacultyOptions(names);
        if (names.length > 0) {
          setFormData(prev => ({ ...prev, faculty_name: prev.faculty_name || names[0] }));
        }
      }
    }).finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const filtered = papers.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.subject_name.toLowerCase().includes(q) ||
                        p.faculty_name.toLowerCase().includes(q) ||
                        p.exam_name.toLowerCase().includes(q) ||
                        p.paper_type.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' ? true : p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedPapers,
    totalItems
  } = useTablePagination(filtered, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, setCurrentPage]);

  const handleSave = (e) => {
    e.preventDefault();
    const newPaper = {
      id: Date.now(),
      exam_name: formData.exam_name,
      subject_name: formData.subject_name,
      faculty_name: formData.faculty_name,
      paper_type: formData.paper_type,
      deadline: formData.deadline,
      status: formData.status
    };
    const updated = [newPaper, ...papers];
    setPapers(updated);
    apiClient.post('/tenants/settings/org_examination_papers', { value: updated }).catch(() => {});
    setIsModalOpen(false);
  };

  const toggleStatus = (id) => {
    const updated = papers.map(p => {
      if (p.id === id) {
        const next = p.status === 'Pending' ? 'Submitted' : p.status === 'Submitted' ? 'Approved' : 'Pending';
        return { ...p, status: next };
      }
      return p;
    });
    setPapers(updated);
    apiClient.post('/tenants/settings/org_examination_papers', { value: updated }).catch(() => {});
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this paper setting assignment?')) {
      const updated = papers.filter(p => p.id !== id);
      setPapers(updated);
      apiClient.post('/tenants/settings/org_examination_papers', { value: updated }).catch(() => {});
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
              <i className="fa-solid fa-scroll"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Exam Papers Setup &amp; Confidential Moderation
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Assign faculty to set question papers, monitor deadlines, keys &amp; security approvals &bull; AY 2026&ndash;2027
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
              <span>Assign Paper Setting</span>
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

        {/* Filter Toolbar */}
        <div className="card" style={{ padding: '14px 18px', marginBottom: '18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search subject, faculty, exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid var(--border-color)', width: '100%', fontSize: '13px' }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8', fontSize: '12px' }}></i>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#fff' }}
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      
        <div className="table-container card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)', overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Exam Name</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Subject Course</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Faculty Assigned</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Paper Type</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Deadline</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedPapers.length > 0 ? (
                paginatedPapers.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>{p.exam_name}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-primary)' }}>{p.subject_name}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600' }}>{p.faculty_name}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>{p.paper_type}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{p.deadline}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span 
                        onClick={() => toggleStatus(p.id)}
                        title="Click to cycle status"
                        style={{
                          cursor: 'pointer',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: p.status === 'Approved' ? 'rgba(16, 185, 129, 0.12)' : p.status === 'Submitted' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: p.status === 'Approved' ? '#059669' : p.status === 'Submitted' ? '#2563EB' : '#D97706'
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button 
                        type="button" 
                        onClick={() => handleDelete(p.id)} 
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No paper setting assignments found.
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
            itemName="paper tasks"
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
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Assign Question Paper Setter</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Select Exam Instance *</label>
                  <input 
                    type="text" 
                    value={formData.exam_name} 
                    onChange={e => setFormData({ ...formData, exam_name: e.target.value })} 
                    className="form-control" 
                    required 
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }} 
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Subject Course *</label>
                  <select 
                    value={formData.subject_name} 
                    onChange={e => setFormData({ ...formData, subject_name: e.target.value })} 
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                  >
                    {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Assign Faculty *</label>
                  <select 
                    value={formData.faculty_name} 
                    onChange={e => setFormData({ ...formData, faculty_name: e.target.value })} 
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                  >
                    {facultyOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Paper Type</label>
                  <input 
                    type="text" 
                    value={formData.paper_type} 
                    onChange={e => setFormData({ ...formData, paper_type: e.target.value })} 
                    placeholder="e.g. Set A & B (Confidential)"
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }} 
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Submission Deadline *</label>
                  <input 
                    type="date" 
                    value={formData.deadline} 
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })} 
                    required
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }} 
                  />
                </div>
              </div>
              <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700' }}>Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgExaminationsSetPapers;
