import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import placementsService from '../../../services/placements.service';

const OrgPlacementsIndex = () => {
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);
  const [offers, setOffers] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [cRes, dRes, oRes, iRes] = await Promise.all([
          placementsService.getCompanies().catch(() => []),
          placementsService.getDrives().catch(() => []),
          placementsService.getOffers().catch(() => []),
          placementsService.getInternships().catch(() => [])
        ]);
        setCompanies(Array.isArray(cRes) ? cRes : []);
        setDrives(Array.isArray(dRes) ? dRes : []);
        setOffers(Array.isArray(oRes) ? oRes : []);
        setInternships(Array.isArray(iRes) ? iRes : []);
      } catch (err) {
        console.error('Failed to load placement dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  // Statistical calculations from live DB
  const totalCompaniesCount = companies.length;
  const mouCount = companies.filter(c => c.mouSigned || c.mou_signed === 1 || c.mou_signed === true).length;
  const activeDrivesCount = drives.filter(d => d.status === 'Active' || d.status === 'Upcoming').length;
  const totalOffersCount = offers.length;
  const acceptedOffersCount = offers.filter(o => o.status === 'Accepted').length;
  const placementRate = totalOffersCount > 0 ? ((acceptedOffersCount / totalOffersCount) * 100).toFixed(1) : '0.0';
  
  const highestCtc = offers.length > 0 ? offers.reduce((max, o) => (Number(o.ctc) > max ? Number(o.ctc) : max), 0) : 0;
  const avgCtc = offers.length > 0 
    ? (offers.reduce((sum, o) => sum + Number(o.ctc || 0), 0) / offers.length).toFixed(0) 
    : 0;

  // Filter recent offers
  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const matchesSearch = 
        `${o.first_name} ${o.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.job_role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [offers, searchQuery, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedOffers,
    totalItems
  } = useTablePagination(filteredOffers, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, setCurrentPage]);

  return (
    <div className="placements-dashboard">
      {/* Header Banner */}
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
              background: 'linear-gradient(135deg, #EA580C, #C2410C)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)'
            }}
          >
            <i className="fa-solid fa-briefcase"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Placement &amp; Career Services Hub
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Comprehensive overview of corporate hiring partners, recruitment drives, job offers &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/unilms/org/placements/drives"
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
              color: '#ffffff',
              fontWeight: '700',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.25)',
              whiteSpace: 'nowrap',
              textDecoration: 'none'
            }}
          >
            <i className="fa-solid fa-bullhorn"></i>
            <span>Schedule Drive</span>
          </Link>
          <Link
            to="/unilms/org/placements/companies"
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
            <i className="fa-solid fa-building" style={{ color: '#EA580C' }}></i>
            <span>Add Partner</span>
          </Link>
          <Link
            to="/unilms/org/placements/offers"
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
            <i className="fa-solid fa-file-signature" style={{ color: '#EA580C' }}></i>
            <span>Record Offer</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Statistical Cards - Border-left Accent Model (Image 1) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px', marginBottom: '22px' }}>
        
        {/* Card 1: Partners */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #E11D48',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--card-bg, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Corporate Partners
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#E11D48', marginTop: '3px', lineHeight: '1.2' }}>
            {totalCompaniesCount} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Partners</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> {mouCount} MOUs Active
          </div>
        </div>

        {/* Card 2: Recruitment Drives */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid var(--success, #10B981)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--card-bg, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Recruitment Drives
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '3px', lineHeight: '1.2' }}>
            {drives.length} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Drives</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-bolt me-1"></i> {activeDrivesCount} Active / Scheduled
          </div>
        </div>

        {/* Card 3: Job Offers */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #06B6D4',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--card-bg, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Total Offers Issued
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#06B6D4', marginTop: '3px', lineHeight: '1.2' }}>
            {totalOffersCount} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Offers</span>
          </div>
          <div style={{ fontSize: '11px', color: '#06B6D4', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> {acceptedOffersCount} Accepted ({placementRate}%)
          </div>
        </div>

        {/* Card 4: Highest & Avg CTC */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid var(--warning, #F59E0B)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--card-bg, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Highest / Avg CTC
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '3px', lineHeight: '1.2' }}>
            ₹{(highestCtc / 100000).toFixed(1)} LPA
          </div>
          <div style={{ fontSize: '11px', color: 'var(--warning, #F59E0B)', fontWeight: '700', marginTop: '4px' }}>
            Avg: ₹{(avgCtc / 100000).toFixed(2)} LPA
          </div>
        </div>
      </div>

      {/* Secondary Analytics Row: Department Placement Breakdown & Quick Hub Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Branch Placement Progress */}
        <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>
              <i className="fa-solid fa-chart-column me-2" style={{ color: '#4F46E5' }}></i> Department Placement Rate
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Target: 95%</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                <span>Computer Science & Engineering</span>
                <span style={{ color: '#10B981' }}>94.2% (112 Placed)</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '94.2%', height: '100%', background: 'linear-gradient(90deg, #4F46E5, #06B6D4)', borderRadius: '4px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                <span>Information Technology</span>
                <span style={{ color: '#10B981' }}>91.5% (68 Placed)</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '91.5%', height: '100%', background: 'linear-gradient(90deg, #4F46E5, #10B981)', borderRadius: '4px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                <span>Electronics & Communication</span>
                <span style={{ color: '#3B82F6' }}>84.0% (52 Placed)</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '84.0%', height: '100%', background: 'linear-gradient(90deg, #3B82F6, #6366F1)', borderRadius: '4px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                <span>Mechanical Engineering</span>
                <span style={{ color: '#F59E0B' }}>76.8% (42 Placed)</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '76.8%', height: '100%', background: 'linear-gradient(90deg, #F59E0B, #EAB308)', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Internship Roadmaps & TPO Quick Actions */}
        <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>
              <i className="fa-solid fa-map-location-dot me-2" style={{ color: '#0D9488' }}></i> Corporate Internships & Roadmaps
            </h3>
            <Link to="/unilms/org/internships" style={{ fontSize: '12px', color: '#4F46E5', fontWeight: '600', textDecoration: 'none' }}>
              View All Roadmaps &rarr;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Active Postings</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{internships.length} Postings</div>
              <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px' }}>Verified TPO Gatekeeper</div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Highest Stipend</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>₹80,000 / mo</div>
              <div style={{ fontSize: '11px', color: '#6366F1', marginTop: '2px' }}>Amazon SDE Internship</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {internships.slice(0, 2).map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F1F5F9', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#1E293B' }}>{item.company_name}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{item.role_title} • <span style={{ color: '#059669', fontWeight: '600' }}>₹{item.stipend_amount.toLocaleString()}/mo</span></div>
                </div>
                <Link to="/unilms/org/internships" className="btn btn-outline" style={{ fontSize: '11px', padding: '4px 10px', textDecoration: 'none' }}>
                  Roadmap
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Offers Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
              <i className="fa-solid fa-list-check me-2" style={{ color: '#4F46E5' }}></i> Recent Placement Offers
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
              Real-time records of campus offers issued by recruiting partners.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search student, company, role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '7px 12px 7px 32px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  width: '240px'
                }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8', fontSize: '12px' }}></i>
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                background: '#ffffff'
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Accepted">Accepted</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>

            <Link to="/unilms/org/placements/offers" className="btn btn-primary" style={{ fontSize: '13px', padding: '7px 14px', textDecoration: 'none' }}>
              View All Offers
            </Link>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Date</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Student Candidate</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Company</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Job Role</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>CTC Package</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedOffers.length > 0 ? (
                paginatedOffers.map(offer => (
                  <tr key={offer.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontSize: '13px', color: '#64748B' }}>
                      {offer.offer_date}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '13px' }}>
                        {offer.first_name} {offer.last_name}
                      </div>
                      <small style={{ color: '#64748B', fontSize: '11px' }}>
                        {offer.roll_number} • {offer.department}
                      </small>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#4F46E5', fontSize: '13px' }}>
                      {offer.company_name}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155' }}>
                      {offer.job_role}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#059669', fontSize: '13px' }}>
                      ₹{(offer.ctc / 100000).toFixed(2)} LPA
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {offer.status === 'Accepted' && (
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                          <i className="fa-solid fa-check me-1"></i> Accepted
                        </span>
                      )}
                      {offer.status === 'Pending' && (
                        <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                          <i className="fa-solid fa-clock me-1"></i> Pending
                        </span>
                      )}
                      {offer.status === 'Rejected' && (
                        <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                          <i className="fa-solid fa-xmark me-1"></i> Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    No job offers matching criteria found.
                  </td>
                </tr>
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
          itemName="placement offers"
        />
      </div>
    </div>
  );
};

export default OrgPlacementsIndex;