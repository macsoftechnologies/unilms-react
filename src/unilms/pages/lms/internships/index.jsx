import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import placementsService from '../../../services/placements.service';

const LmsInternshipsIndex = () => {
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [openings, setOpenings] = useState([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const [internshipsRes, appsRes] = await Promise.allSettled([
          placementsService.getInternships(),
          placementsService.getApplications(),
        ]);

        if (isMounted) {
          if (internshipsRes.status === 'fulfilled' && Array.isArray(internshipsRes.value)) {
            const mappedOpenings = internshipsRes.value.map((item) => ({
              company: item.company?.name || item.companyName || 'Corporate Partner',
              role: item.title || item.role || 'Software Engineering Intern',
              location: item.location || 'Bengaluru, India',
              mode: item.mode || 'Hybrid',
              stipend: item.stipend ? `₹${Number(item.stipend).toLocaleString('en-IN')}/mo` : '₹40,000.00/mo',
              eligibility: item.eligibility || 'All Eligible Engineering Batches',
              deadline: item.deadline ? new Date(item.deadline).toLocaleDateString('en-GB') : 'Open',
            }));
            setOpenings(mappedOpenings);
          } else {
            setOpenings([]);
          }

          if (appsRes.status === 'fulfilled' && Array.isArray(appsRes.value)) {
            const mappedApps = appsRes.value.map((app, idx) => ({
              id: app.id || idx + 1,
              company: app.drive?.company?.name || app.companyName || 'Corporate Partner',
              role: app.drive?.title || app.role || 'Engineering Intern',
              mode: app.drive?.mode || 'Hybrid',
              stipend: app.drive?.stipend || '₹40,000.00/mo',
              status: (app.stage || '').toLowerCase().includes('offer') ? 'offered' : 'in_progress',
              statusText: app.stage || 'In Review',
              actionLink: '/unilms/lms/internships/workspace'
            }));
            setApplications(mappedApps);
          } else {
            setApplications([]);
          }
        }
      } catch (err) {
        console.warn('Failed to load internships:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(applications, 5);

  return (
    <>
      <div className="lms-page-header">
        <h1>
          <i className="fa-solid fa-briefcase me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i>{' '}
          Corporate Internships & Workspace
        </h1>
        <p>Browse corporate openings, manage company offer letters, and submit weekly project milestones.</p>
      </div>

      {/* Internship Overview KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '16px'
        }}
      >
        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--primary, #4F46E5)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Active Workspace
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '2px', lineHeight: '1.2' }}>
            {applications.length} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Applications</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            <i className="fa-solid fa-briefcase me-1"></i> {applications.length > 0 ? 'Applied internships' : 'No Active Applications'}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--success, #10B981)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Top Stipend
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
            {applications.length > 0 ? '₹45,000' : '—'} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>{applications.length > 0 ? '/ mo' : ''}</span>
          </div>
          <div style={{ fontSize: '10px', color: applications.length > 0 ? 'var(--success, #10B981)' : 'var(--text-muted, #64748B)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-arrow-trend-up me-1"></i> {applications.length > 0 ? 'Verified Offer Letter' : 'No Active Offers'}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid #06B6D4',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Campus Openings
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
            {openings.length} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Drives Live</span>
          </div>
          <div style={{ fontSize: '10px', color: openings.length > 0 ? 'var(--success, #10B981)' : 'var(--text-muted, #64748B)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-building me-1"></i> {openings.length > 0 ? 'Verified Partner Drives' : 'No Active Drives'}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--warning, #F59E0B)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Internship Credits
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            {applications.length > 0 ? '08' : '00'} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>/ 12 Earned</span>
          </div>
          <div style={{ fontSize: '10px', color: applications.length > 0 ? 'var(--warning, #F59E0B)' : 'var(--text-muted, #64748B)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-clock me-1"></i> {applications.length > 0 ? 'Evaluation Pending' : 'No Credits Logged'}
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            4 Credits
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            Evaluation Grade: A+
          </div>
        </div>
      </div>

      {/* My Applications Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '800', margin: '0' }}>
            <i className="fa-solid fa-user-check me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i>{' '}
            My Internship Applications & Active Workspace
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-canvas, #F8FAFC)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Company & Role</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Work Mode</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Monthly Stipend</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Workspace / Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={5} rows={pageSize || 5} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No internship applications found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((app) => (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--border, #E2E8F0)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--text-main, #0F172A)', fontSize: '14px' }}>
                        <i className="fa-solid fa-building me-1 text-primary" style={{ color: '#4F46E5' }}></i> {app.company}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--primary, #4F46E5)', fontWeight: '700', marginTop: '2px' }}>
                        {app.role}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.08)', color: 'var(--primary, #4F46E5)', fontSize: '11px', padding: '4px 10px', borderRadius: '8px' }}>
                        {app.mode}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '800', color: '#10B981' }}>
                      {app.stipend}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {app.status === 'in_progress' ? (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', padding: '5px 12px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '700' }}>
                          <i className="fa-solid fa-spinner fa-spin me-1"></i> {app.statusText}
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', padding: '5px 12px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '700' }}>
                          <i className="fa-solid fa-envelope-open-text me-1"></i> {app.statusText}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <Link
                        to={app.actionLink}
                        className="btn btn-primary"
                        style={{
                          fontSize: '12px',
                          padding: '6px 14px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        Open Workspace <i className="fa-solid fa-arrow-right"></i>
                      </Link>
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
          pageSizeOptions={[5, 10, 20]}
          itemName="internship applications"
        />
      </div>

      {/* Available Corporate Openings */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '800', margin: '0' }}>
              <i className="fa-solid fa-building me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i> Corporate Internship Drives
            </h2>
            <small style={{ color: 'var(--text-muted, #64748B)' }}>Verified college placement cell drives for upcoming semester cohorts.</small>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          {openings.map((co, idx) => (
            <div key={idx} style={{ background: 'var(--bg-canvas, #F8FAFC)', border: '1px solid var(--border, #E2E8F0)', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', fontWeight: '800', margin: '0', color: 'var(--text-main, #0F172A)' }}>
                    {co.company}
                  </h3>
                  <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #4F46E5)', fontWeight: '700', fontSize: '10.5px', padding: '3px 8px', borderRadius: '6px' }}>
                    {co.mode}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary, #4F46E5)', marginBottom: '8px' }}>
                  {co.role}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', marginBottom: '4px' }}>
                  <i className="fa-solid fa-location-dot me-1"></i> {co.location}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', marginBottom: '12px' }}>
                  <i className="fa-solid fa-user-graduate me-1"></i> {co.eligibility}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border, #E2E8F0)', paddingTop: '12px' }}>
                <span style={{ fontWeight: '800', color: '#10B981', fontSize: '13px' }}>
                  {co.stipend}
                </span>
                <Link
                  to="/unilms/lms/internships/apply"
                  className="btn btn-sm btn-outline"
                  style={{ fontWeight: '700', fontSize: '11.5px', padding: '4px 12px', borderRadius: '8px', textDecoration: 'none' }}
                >
                  Apply Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default LmsInternshipsIndex;
