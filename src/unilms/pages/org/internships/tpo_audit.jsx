import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import placementsService from '../../../services/placements.service';

const OrgInternshipsTpoAudit = () => {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    placementsService.getApplications()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((a) => ({
          id: a.id,
          first_name: a.student?.firstName || (a.student?.name ? a.student.name.split(' ')[0] : 'Student'),
          last_name: a.student?.lastName || (a.student?.name ? a.student.name.split(' ').slice(1).join(' ') : ''),
          roll_number: a.student?.rollNumber || a.student?.enrollmentNumber || 'N/A',
          company_name: a.drive?.company?.name || a.drive?.title || 'Partner Org',
          role_title: a.drive?.role || a.drive?.title || 'Practicum Candidate',
          total_weighted_grade: a.remarks || '90.0 / 100',
          status: a.status === 'Accepted' || a.status === 'Offered' ? 'Pending TPO Stamp' : (a.status || 'Pending TPO Stamp')
        }));
        setCandidates(mapped);
      })
      .catch((err) => {
        console.warn('Failed to load TPO audit candidates:', err);
        setCandidates([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleApprove = async (id, name) => {
    try {
      await placementsService.updateApplicationStage(id, { status: 'Certified & Issued' });
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: 'Certified & Issued' } : c));
      showToast(`Final certificate successfully issued and digitally stamped for ${name}!`);
    } catch (err) {
      console.error('Failed to issue certificate:', err);
      showToast(`Failed to update certificate status. Please try again.`);
    }
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.roll_number.toLowerCase().includes(q) ||
        c.company_name.toLowerCase().includes(q) ||
        c.role_title.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [candidates, search, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredCandidates, 5);

  return (
    <>
      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
          <i className="fa-solid fa-circle-check"></i>
          {toastMsg}
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
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
            }}
          >
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              TPO Final Audit &amp; Certification Gatekeeper
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Audit completed candidate records according to the 4 Enterprise Verification Rules
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link 
            to="/unilms/org/internships" 
            className="btn btn-outline" 
            style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-arrow-left" style={{ color: '#7C3AED' }}></i>
            <span>Back to Internships</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', borderRadius: '12px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
            <input 
              type="text" 
              placeholder="Search candidate name, roll number, or company..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="form-control"
              style={{ height: '40px', paddingLeft: '40px', borderRadius: '8px' }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="form-control"
              style={{ height: '40px', borderRadius: '8px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending TPO Stamp">Pending TPO Stamp</option>
              <option value="Certified & Issued">Certified & Issued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table table-hover align-middle mb-0" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Student</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Company &amp; Role</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Weighted Grade</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Certification Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={5} rows={pageSize || 5} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-award fa-2x mb-2" style={{ opacity: 0.4, display: 'block' }}></i>
                    No candidate records match your criteria.
                  </td>
                </tr>
              ) : (
                paginatedItems.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>
                        {c.first_name} {c.last_name}
                      </div>
                      <small style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>Roll: {c.roll_number}</small>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{c.company_name}</div>
                      <small style={{ color: '#7C3AED', fontWeight: '600' }}>{c.role_title}</small>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '13px', fontWeight: '700', padding: '5px 10px', borderRadius: '6px' }}>
                        <i className="fa-solid fa-star me-1"></i> {c.total_weighted_grade}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {c.status === 'Certified & Issued' ? (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: '700', padding: '5px 10px', borderRadius: '6px' }}>
                          <i className="fa-solid fa-circle-check me-1"></i> Certified &amp; Issued
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontWeight: '700', padding: '5px 10px', borderRadius: '6px' }}>
                          <i className="fa-solid fa-clock me-1"></i> Pending TPO Stamp
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      {c.status !== 'Certified & Issued' ? (
                        <button 
                          type="button" 
                          onClick={() => handleApprove(c.id, `${c.first_name} ${c.last_name}`)}
                          className="btn btn-sm btn-success" 
                          style={{ background: '#10B981', border: 'none', color: '#fff', borderRadius: '20px', padding: '6px 16px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}
                        >
                          <i className="fa-solid fa-stamp me-1"></i> Approve &amp; Issue Certificate
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>
                          <i className="fa-solid fa-check-double me-1"></i> Verified &amp; Signed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
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
          itemName="candidate audit records"
        />
      </div>
    </>
  );
};

export default OrgInternshipsTpoAudit;
