import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import admissionsService from '../../../services/admissions.service';

const OrgAdmissionsDashboard = () => {
  const [filterPeriod, setFilterPeriod] = useState('ay_2026_27');
  const [loading, setLoading] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalApplications: 0,
    totalEnrolled: 0,
    offersIssued: 0,
    verifiedCount: 0,
    tuitionRealized: 0,
    seatOccupancy: 0,
    programIntake: []
  });
  const shortcutsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shortcutsRef.current && !shortcutsRef.current.contains(e.target)) {
        setShowShortcuts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await admissionsService.getDashboardStats();
      if (data) {
        setStats(data);
      }
    } catch (e) {
      console.warn('Failed to load admissions dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [filterPeriod]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedPrograms,
    totalItems
  } = useTablePagination(stats.programIntake || [], 10);

  return (
    <section className="view-section active">
      {/* Sleek High-Density Header Toolbar */}
      <div
        style={{
          background: 'var(--card-bg, #fff)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '8px 14px',
          marginBottom: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #059669, #0D9488)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
            }}
          >
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
              Admissions Overview &amp; Candidate CRM
            </h2>
            <p style={{ margin: '2px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '11px' }}>
              Real-time enrollment cycle monitoring, prospect tracking &amp; admission funnel metrics &bull; Academic Year 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Direct View Shortcuts Dropdown */}
          <div style={{ position: 'relative' }} ref={shortcutsRef}>
            <button
              type="button"
              onClick={() => setShowShortcuts(prev => !prev)}
              style={{
                background: '#F5F3FF',
                color: '#7C3AED',
                border: '1px solid #DDD6FE',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '11.5px',
                height: '30px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-compass"></i>
              <span>Direct View Shortcuts</span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '9px', transition: 'transform 0.2s', transform: showShortcuts ? 'rotate(180deg)' : 'none' }}></i>
            </button>

            {showShortcuts && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '320px',
                  maxWidth: 'calc(100vw - 32px)',
                  background: 'var(--card-bg, #ffffff)',
                  border: '1px solid var(--border-color, rgba(0,0,0,0.1))',
                  borderRadius: '14px',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.16)',
                  padding: '12px',
                  zIndex: 1050,
                  animation: 'fadeIn 0.18s ease-out'
                }}
              >
                <div style={{ padding: '4px 6px 6px', fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-secondary, #64748b)' }}>
                  Direct View Shortcuts (New Tab)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <a
                    href="/unilms/analytics/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShortcuts(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      color: 'var(--text-primary, #1e293b)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                      <i className="fa-solid fa-chart-pie"></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>MIS Executive Cockpit</span>
                        <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px', color: '#94a3b8' }}></i>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Boardroom KPIs, financials & health</div>
                    </div>
                  </a>

                  <a
                    href="/unilms/analytics/joining_analytics"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShortcuts(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      color: 'var(--text-primary, #1e293b)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                      <i className="fa-solid fa-filter-circle-dollar"></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Admissions & Yield Funnel</span>
                        <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px', color: '#94a3b8' }}></i>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>7-stage funnel & AI narrative</div>
                    </div>
                  </a>

                  <a
                    href="/unilms/analytics/student_analysis"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShortcuts(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      color: 'var(--text-primary, #1e293b)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                      <i className="fa-solid fa-user-shield"></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Student 360° & Risk Radar</span>
                        <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px', color: '#94a3b8' }}></i>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Attendance detention & backlogs</div>
                    </div>
                  </a>

                  <a
                    href="/unilms/analytics/reports"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShortcuts(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      color: 'var(--text-primary, #1e293b)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                      <i className="fa-solid fa-table-list"></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Central Reports & NAAC</span>
                        <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px', color: '#94a3b8' }}></i>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Compliance SSR & Excel exports</div>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/unilms/org/admissions/joining_analytics"
            className="btn btn-primary"
            style={{
              background: '#0D9488',
              color: '#fff',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '11.5px',
              height: '30px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(13, 148, 136, 0.2)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-filter-circle-dollar"></i>
            <span>Joining Funnel Analytics</span>
          </Link>
          <Link
            to="/unilms/org/admissions/applications"
            className="btn btn-outline"
            style={{
              background: '#fff',
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '11.5px',
              height: '30px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-file-circle-plus text-primary"></i>
            <span>New Applications</span>
          </Link>
        </div>
      </div>

      {/* Sleek High-Density Executive Yield Intelligence Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.07) 0%, rgba(79, 70, 229, 0.04) 100%)',
          border: '1px solid rgba(13, 148, 136, 0.2)',
          borderRadius: '8px',
          padding: '6px 14px',
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #0D9488 0%, #059669 100%)', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
            <i className="fa-solid fa-sparkles"></i> Executive Yield
          </span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Admission ➔ Joining Analytics &amp; Conversion Velocity
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            • Candidate drop-offs, lead source ROI &amp; automated seat projections
          </span>
        </div>

        <Link
          to="/unilms/org/admissions/joining_analytics"
          className="btn btn-outline"
          style={{
            background: '#fff',
            color: '#0D9488',
            borderColor: '#0D9488',
            fontWeight: '600',
            fontSize: '11px',
            padding: '3px 10px',
            height: '26px',
            borderRadius: '6px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap'
          }}
        >
          <span>Open Joining Analytics</span>
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '9px' }}></i>
        </Link>
      </div>

      {/* Primary KPI Cards matching Image 1 Reference */}
      <div className="faculty-kpi-grid">
        {/* Card 1: Total Leads (CRM) */}
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Total Leads (CRM)</div>
            <div className="faculty-metric-value">{stats.totalLeads} Leads</div>
            <div className="faculty-metric-sub" style={{ color: '#059669' }}>
              <i className="fa-solid fa-arrow-trend-up"></i>
              <span>Active Prospects</span>
            </div>
          </div>
        </div>

        {/* Card 2: Enrolled & Joined */}
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
            <i className="fa-solid fa-user-check"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Enrolled &amp; Joined</div>
            <div className="faculty-metric-value" style={{ color: '#059669' }}>{stats.totalEnrolled} Students</div>
            <div className="faculty-metric-sub" style={{ color: '#059669' }}>
              <i className="fa-solid fa-circle-check"></i>
              <span>Yield: {stats.totalApplications > 0 ? Math.round((stats.totalEnrolled / stats.totalApplications) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Applications */}
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#0891B2' }}>
            <i className="fa-solid fa-file-lines"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Active Applications</div>
            <div className="faculty-metric-value" style={{ color: '#0891B2' }}>{stats.totalApplications} Forms</div>
            <div className="faculty-metric-sub" style={{ color: '#0891B2' }}>
              <i className="fa-solid fa-chart-line"></i>
              <span>Conversion: {stats.totalLeads > 0 ? Math.round((stats.totalApplications / stats.totalLeads) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Offer Letters Sent */}
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
            <i className="fa-solid fa-envelope-open-text"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Offer Letters Sent</div>
            <div className="faculty-metric-value" style={{ color: '#D97706' }}>{stats.offersIssued} Sent</div>
            <div className="faculty-metric-sub" style={{ color: '#D97706' }}>
              <i className="fa-solid fa-paper-plane"></i>
              <span>Offer Rate: {stats.totalApplications > 0 ? Math.round((stats.offersIssued / stats.totalApplications) * 100) : 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Admissions Cycle Row */}
      <div className="faculty-kpi-grid" style={{ marginBottom: '10px' }}>
        {/* Card 5: Document Verification */}
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(13, 148, 136, 0.1)', color: '#0D9488' }}>
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Document Verification</div>
            <div className="faculty-metric-value" style={{ color: '#0D9488' }}>{stats.verifiedCount} Verified</div>
            <div className="faculty-metric-sub" style={{ color: '#059669' }}>
              <i className="fa-solid fa-circle-check"></i>
              <span>Active Intake Progress</span>
            </div>
          </div>
        </div>

        {/* Card 6: Fee Collections */}
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#16A34A' }}>
            <i className="fa-solid fa-indian-rupee-sign"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Tuition Fee Realized</div>
            <div className="faculty-metric-value" style={{ color: '#16A34A' }}>₹{(stats.tuitionRealized / 100000).toFixed(1)} L</div>
            <div className="faculty-metric-sub" style={{ color: '#16A34A' }}>
              <i className="fa-solid fa-check-double"></i>
              <span>Realized Tuition</span>
            </div>
          </div>
        </div>

        {/* Card 7: Campus Capacity */}
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5' }}>
            <i className="fa-solid fa-building-columns"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Campus Seat Occupancy</div>
            <div className="faculty-metric-value" style={{ color: '#4F46E5' }}>{stats.seatOccupancy}% Filled</div>
            <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary)' }}>
              <span>Live Campus Ratio</span>
            </div>
          </div>
        </div>

        {/* Card 8: Merit Scholarships */}
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(225, 29, 72, 0.1)', color: '#E11D48' }}>
            <i className="fa-solid fa-award"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Active Degree Cohorts</div>
            <div className="faculty-metric-value" style={{ color: '#E11D48' }}>{stats.programIntake?.length || 0} Programs</div>
            <div className="faculty-metric-sub" style={{ color: '#059669' }}>
              <i className="fa-solid fa-check"></i>
              <span>Accredited Streams</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sleek Admissions Modules Quick Launch Toolbar */}
      <div style={{ marginBottom: '10px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-compass" style={{ color: '#0D9488' }}></i>
            <span>Admissions Modules &amp; Direct Workflow Engines</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>10 Direct Shortcuts</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <Link to="/unilms/org/admissions/joining_analytics" className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-filter-circle-dollar" style={{ color: '#0D9488' }}></i>
            <span>Joining Analytics</span>
          </Link>
          <Link to="/unilms/org/admissions/leads" className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-users" style={{ color: '#7C3AED' }}></i>
            <span>Leads (CRM)</span>
          </Link>
          <Link to="/unilms/org/admissions/applications" className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-file-lines" style={{ color: '#0284C7' }}></i>
            <span>Applications</span>
          </Link>
          <Link to="/unilms/org/admissions/documents" className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#059669' }}></i>
            <span>Verification</span>
          </Link>
          <Link to="/unilms/org/admissions/offers" className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-envelope-open-text" style={{ color: '#D97706' }}></i>
            <span>Offers</span>
          </Link>
          <Link to="/unilms/org/admissions/payments" className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-indian-rupee-sign" style={{ color: '#10B981' }}></i>
            <span>Payments</span>
          </Link>
          <Link to="/unilms/org/admissions/enrollment" className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-user-plus" style={{ color: '#4F46E5' }}></i>
            <span>Enrollment</span>
          </Link>
          <Link to="/unilms/org/admissions/college_strength" className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-chart-column" style={{ color: '#B45309' }}></i>
            <span>College Strength</span>
          </Link>
          <Link to="/unilms/org/admissions/scholarships" className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-award" style={{ color: '#BE123C' }}></i>
            <span>Scholarships</span>
          </Link>
          <Link to="/unilms/org/admissions/categories" className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-tags" style={{ color: '#475569' }}></i>
            <span>Categories</span>
          </Link>
        </div>
      </div>

      {/* Program-wise Intake Fulfillment Table Card */}
      <div
        style={{
          background: 'var(--card-bg, #fff)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          marginBottom: '12px'
        }}
      >
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: 'var(--bg-main, #fafafa)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-chart-pie" style={{ color: '#0D9488' }}></i>
              <span>Degree Program Intake &amp; Seat Fulfillment Status</span>
            </h3>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Active cycle velocity across undergraduate and postgraduate schools
            </div>
          </div>
          <Link
            to="/unilms/org/admissions/college_strength"
            className="btn btn-outline"
            style={{
              background: '#fff',
              fontSize: '11px',
              fontWeight: '600',
              padding: '3px 10px',
              height: '26px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>Detailed Capacity View</span>
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '9px' }}></i>
          </Link>
        </div>

        <div className="mobile-scroll-cue" style={{ margin: '8px 14px 4px' }}>
          <i className="fa-solid fa-arrows-left-right"></i>
          <span>Scroll table horizontally to view program metrics and conversion rates</span>
        </div>
        <div className="table-responsive" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch', display: 'block', boxSizing: 'border-box' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '680px', margin: 0 }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 18px', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Program / Degree</th>
                <th style={{ textAlign: 'center', padding: '14px 14px', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Intake Cap</th>
                <th style={{ textAlign: 'center', padding: '14px 14px', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Total Applied</th>
                <th style={{ textAlign: 'center', padding: '14px 14px', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Offered</th>
                <th style={{ textAlign: 'center', padding: '14px 14px', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Enrolled &amp; Paid</th>
                <th style={{ textAlign: 'center', padding: '14px 14px', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Fulfillment %</th>
                <th style={{ textAlign: 'center', padding: '14px 14px', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Admission Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 6} />
              ) : paginatedPrograms.length > 0 ? (
                paginatedPrograms.map((prog) => (
                  <tr key={prog.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>{prog.program}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'monospace' }}>Code: {prog.code}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px 14px', fontWeight: '700', fontSize: '13.5px' }}>
                      {prog.intake}
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px 14px', fontWeight: '700', fontSize: '13.5px', color: '#2563EB' }}>
                      {prog.applied.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px 14px', fontWeight: '700', fontSize: '13.5px', color: '#D97706' }}>
                      {prog.offered}
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px 14px', fontWeight: '800', fontSize: '14px', color: '#059669' }}>
                      {prog.enrolled}
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px 14px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '13px', color: prog.fillRate >= 95 ? '#059669' : '#D97706' }}>
                          {prog.fillRate}%
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px 14px' }}>
                      <span
                        className="badge"
                        style={{
                          background: prog.fillRate >= 95 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: prog.fillRate >= 95 ? '#059669' : '#D97706',
                          fontWeight: '700',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <i className={`fa-solid ${prog.fillRate >= 95 ? 'fa-circle-check' : 'fa-clock'} me-1`}></i>
                        {prog.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No degree program intake records found.
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
            itemName="academic programs"
          />
        </div>
      </div>
    </section>
  );
};

export default OrgAdmissionsDashboard;
