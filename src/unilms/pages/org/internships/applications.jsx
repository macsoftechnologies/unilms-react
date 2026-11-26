import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import placementsService from '../../../services/placements.service';

const OrgInternshipsApplications = () => {
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    placementsService.getApplications()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((a) => ({
          id: a.id,
          student_name: `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.trim() || a.student?.name || 'Student',
          roll_no: a.student?.rollNumber || a.student?.enrollmentNumber || 'N/A',
          program: a.student?.program?.name || 'Academic Program',
          company: a.drive?.company?.name || a.drive?.title || 'Partner Org',
          role: a.drive?.role || a.drive?.title || 'Intern',
          stipend: a.drive?.salaryPackage || a.drive?.stipend || 'Unpaid / Academic Credit',
          applied_date: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '2026-11-20',
          status: a.status || 'Under Review',
          status_color: a.status === 'Offered' ? '#10B981' : (a.status === 'Accepted' ? '#3B82F6' : (a.status === 'Rejected' ? '#EF4444' : '#F59E0B')),
          status_bg: a.status === 'Offered' ? 'rgba(16, 185, 129, 0.12)' : (a.status === 'Accepted' ? 'rgba(59, 130, 246, 0.12)' : (a.status === 'Rejected' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)'))
        }));
        setApplications(mapped);
      })
      .catch((err) => {
        console.warn('Failed to load applications:', err);
        setApplications([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredApps, 10);

  const handleStatusChange = async (id, newStatus, color, bg) => {
    try {
      await placementsService.updateApplicationStage(id, { status: newStatus });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus, status_color: color, status_bg: bg } : a));
    } catch (err) {
      console.error('Failed to update application status:', err);
    }
  };

  return (
    <>
      <div className="container-fluid p-0">
        {/* Top Header Card */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color, #E2E8F0)',
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
              <i className="fa-solid fa-file-lines"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary, #0F172A)', letterSpacing: '-0.3px' }}>
                Internship Applications &amp; Offers Queue
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748B)', fontSize: '13px' }}>
                Review student resumes, extend time-limited offers, assign academic mentors
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              to="/unilms/org/internships"
              className="btn btn-outline"
              style={{
                background: 'var(--card-bg, #fff)',
                color: 'var(--text-primary, #0F172A)',
                border: '1px solid var(--border-color, #E2E8F0)',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-arrow-left" style={{ color: '#7C3AED' }}></i>
              <span>Back to Internships</span>
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #E2E8F0)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search by student, roll no, company, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #CBD5E1)',
                  fontSize: '13px',
                  width: '100%',
                  maxWidth: '360px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #CBD5E1)',
                  fontSize: '13px'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Under Review">Under Review</option>
                <option value="Offered">Offered</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Data Table */}
        <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color, #E2E8F0)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Student</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Program</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Company &amp; Role</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Stipend</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted, #64748B)' }}>
                      No internship applications found.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((app) => (
                    <tr key={app.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13.5px' }}>{app.student_name}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>Roll: {app.roll_no}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12.5px', color: '#475569' }}>
                        {app.program}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#4F46E5', fontSize: '13px' }}>{app.company}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{app.role}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#10B981', fontSize: '13px' }}>
                        {app.stipend}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          className="badge"
                          style={{
                            background: app.status_bg,
                            color: app.status_color,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '11px'
                          }}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => handleStatusChange(app.id, 'Offered', '#10B981', 'rgba(16, 185, 129, 0.12)')}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11.5px',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10B981',
                              border: 'none',
                              fontWeight: '600'
                            }}
                          >
                            Offer
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => handleStatusChange(app.id, 'Rejected', '#EF4444', 'rgba(239, 68, 68, 0.12)')}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11.5px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#EF4444',
                              border: 'none',
                              fontWeight: '600'
                            }}
                          >
                            Reject
                          </button>
                        </div>
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
            itemName="applications"
          />
        </div>
      </div>
    </>
  );
};

export default OrgInternshipsApplications;
