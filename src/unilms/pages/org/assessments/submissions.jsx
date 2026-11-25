import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import apiClient from '../../../services/api';

const defaultSubmissions = [];

const OrgAssessmentsSubmissions = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState(defaultSubmissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [gradingItem, setGradingItem] = useState(null);
  const [awardMarks, setAwardMarks] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    apiClient.get('/tenants/settings/org_assessment_submissions')
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
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchSearch = fullName.includes(q) || s.roll_number.toLowerCase().includes(q);
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
    setAwardMarks(s.final_marks !== null ? String(s.final_marks) : String(s.auto_score || ''));
  };

  const handleSaveGrade = (e) => {
    e.preventDefault();
    if (!gradingItem) return;
    setSubmissions(submissions.map(s => {
      if (s.id === gradingItem.id) {
        return {
          ...s,
          status: 'graded',
          final_marks: Number(awardMarks)
        };
      }
      return s;
    }));
    setGradingItem(null);
  };

  return (
    <>
      <section className="view-section active">
        {/* Header */}
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
                background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
              }}
            >
              <i className="fa-solid fa-list-check"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Assessment Submissions &amp; Evaluation
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Online Assessment: Comprehensive Objective &amp; Descriptive &bull; Max: 50 Marks
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
              <i className="fa-solid fa-arrow-left" style={{ color: '#0284C7' }}></i>
              <span>Back to Assessments</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="card" style={{ padding: '14px 18px', marginBottom: '18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search candidate name or roll..."
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
              <option value="graded">Graded</option>
              <option value="pending">Pending Evaluation</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)', overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Student Candidate</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Submitted At</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Evaluation Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Auto Score</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Final Marks</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedSubmissions.length > 0 ? (
                paginatedSubmissions.map(sub => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{sub.first_name} {sub.last_name}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{sub.roll_number}</span> &bull; {sub.email}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '13px' }}>{sub.submitted_at}</div>
                      {sub.is_late ? (
                        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                          Late Submission
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                          On Time
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span 
                        className="badge" 
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: sub.status === 'graded' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: sub.status === 'graded' ? '#059669' : '#d97706'
                        }}
                      >
                        {sub.status === 'graded' ? 'Graded' : 'Pending Evaluation'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600' }}>
                      {sub.auto_score !== null ? `${sub.auto_score} / 50` : '-'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {sub.final_marks !== null ? (
                        <strong style={{ fontSize: '14px', color: '#0284C7' }}>{sub.final_marks} <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ 50</span></strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button 
                        type="button" 
                        onClick={() => handleOpenGrade(sub)} 
                        className="btn btn-primary" 
                        style={{ padding: '5px 12px', fontSize: '12px', background: '#0284C7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-marker me-1"></i> {sub.status === 'graded' ? 'Review Grade' : 'Grade'}
                      </button>
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
            itemName="submissions"
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
              <div style={{ background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', color: '#fff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Evaluate Assessment Submission</h3>
                <button type="button" onClick={() => setGradingItem(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Student Candidate</span>
                  <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '2px', color: 'var(--text-primary)' }}>
                    {gradingItem.first_name} {gradingItem.last_name} ({gradingItem.roll_number})
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Auto-Evaluated Score</span>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '2px' }}>
                    {gradingItem.auto_score !== null ? `${gradingItem.auto_score} / 50` : 'N/A'}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Final Awarded Marks (out of 50) *</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="50" 
                    step="0.5" 
                    required 
                    value={awardMarks} 
                    onChange={e => setAwardMarks(e.target.value)} 
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px', fontSize: '14px', fontWeight: '700' }} 
                  />
                </div>
              </div>
              <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setGradingItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0284C7', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '700' }}>Confirm Marks</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgAssessmentsSubmissions;
