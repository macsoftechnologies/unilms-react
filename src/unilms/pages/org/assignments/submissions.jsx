import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import apiClient from '../../../services/api';

const defaultSubmissions = [];

const OrgAssignmentsSubmissions = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState(defaultSubmissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [gradingItem, setGradingItem] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    apiClient.get('/tenants/settings/org_assignment_submissions')
      .then(res => {
        if (isMounted && res?.data?.value && Array.isArray(res.data.value)) {
          setSubmissions(res.data.value);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [searchQuery, statusFilter]);

  const filtered = submissions.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch = s.student_name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' ? true : s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedSubmissions,
    totalItems
  } = useTablePagination(filtered, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, setCurrentPage]);

  const handleOpenGrade = (s) => {
    setGradingItem(s);
    setGradeMarks(s.marks_obtained !== null ? String(s.marks_obtained) : '');
    setGradeFeedback(s.feedback || '');
  };

  const handleSaveGrade = (e) => {
    e.preventDefault();
    if (!gradingItem) return;
    setSubmissions(submissions.map(s => {
      if (s.id === gradingItem.id) {
        return {
          ...s,
          status: 'Graded',
          marks_obtained: Number(gradeMarks),
          feedback: gradeFeedback
        };
      }
      return s;
    }));
    setGradingItem(null);
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
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
              }}
            >
              <i className="fa-solid fa-list-check"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Assignment Submissions &amp; Grading Review
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                CS401 Cloud Architecture &bull; Assignment 1: Distributed Microservices &bull; Max: 50 Marks
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
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
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-arrow-left" style={{ color: '#7C3AED' }}></i>
              <span>Back to Assignments</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="card" style={{ padding: '14px 18px', marginBottom: '18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search student or roll no..."
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
              <option value="Graded">Graded</option>
              <option value="Submitted">Pending Evaluation</option>
              <option value="Not Submitted">Not Submitted</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)', overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Roll Number</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Student</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Submission Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Attached File</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Awarded Marks</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedSubmissions.length > 0 ? (
                paginatedSubmissions.map(st => (
                  <tr key={st.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#475569', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                        {st.roll_number}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-primary)', fontSize: '13.5px' }}>
                      {st.student_name}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {st.status === 'Graded' && (
                        <div>
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>
                            Graded
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{st.submitted_at}</div>
                        </div>
                      )}
                      {st.status === 'Submitted' && (
                        <div>
                          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>
                            Submitted (Pending)
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{st.submitted_at}</div>
                        </div>
                      )}
                      {st.status === 'Not Submitted' && (
                        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>
                          Not Submitted
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {st.file_name ? (
                        <button 
                          type="button" 
                          onClick={() => alert(`Downloading attachment: ${st.file_name}`)}
                          className="btn btn-outline" 
                          style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <i className="fa-solid fa-file-arrow-down" style={{ color: '#7C3AED' }}></i>
                          <span>{st.file_name}</span>
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {st.marks_obtained !== null ? (
                        <strong style={{ fontSize: '14px', color: '#7C3AED' }}>{st.marks_obtained} <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ 50</span></strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {st.status !== 'Not Submitted' && (
                        <button 
                          type="button" 
                          onClick={() => handleOpenGrade(st)} 
                          className="btn btn-primary" 
                          style={{ padding: '5px 12px', fontSize: '12px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-check me-1"></i> {st.status === 'Graded' ? 'Edit Grade' : 'Grade'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>No submissions found.</td></tr>
              )}
            </tbody>
          </table>

          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="student submissions"
          />
        </div>
      </section>

      {/* Grade Modal */}
      {gradingItem && (
        <div 
          className="drawer-overlay active" 
          onClick={(e) => {
            if (e.target.classList.contains('drawer-overlay')) setGradingItem(null);
          }}
          style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div className="drawer-content" style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <form onSubmit={handleSaveGrade}>
              <div style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Grade Submission</h3>
                <button type="button" onClick={() => setGradingItem(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Student Candidate</span>
                  <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '2px', color: 'var(--text-primary)' }}>
                    {gradingItem.student_name} ({gradingItem.roll_number})
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Awarded Marks (out of 50) *</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="50" 
                    step="0.5" 
                    required 
                    value={gradeMarks} 
                    onChange={e => setGradeMarks(e.target.value)} 
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px', fontSize: '14px', fontWeight: '700' }} 
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Feedback &amp; Comments for Student</label>
                  <textarea 
                    rows="4" 
                    value={gradeFeedback} 
                    onChange={e => setGradeFeedback(e.target.value)} 
                    placeholder="Enter performance remarks, improvement tips..." 
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '10px 12px', fontSize: '13px' }}
                  ></textarea>
                </div>
              </div>
              <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setGradingItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#7C3AED', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '700' }}>Commit Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgAssignmentsSubmissions;
