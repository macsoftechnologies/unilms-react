import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';
import studentsService from '../../../services/students.service';
import placementsService from '../../../services/placements.service';
import financeService from '../../../services/finance.service';
import admissionsService from '../../../services/admissions.service';

// Dynamic Institutional Department Benchmarking Data
const DEPARTMENT_BENCHMARKS = [];

// Pipeline Stages Template
const PIPELINE_TEMPLATE = [
  { stage: 1, id: 'leads', name: 'Inbound Leads', icon: 'fa-bullhorn', color: '#6366F1', gradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' },
  { stage: 2, id: 'apps', name: 'Applications', icon: 'fa-file-signature', color: '#2563EB', gradient: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)' },
  { stage: 3, id: 'verified', name: 'Statutory Verified', icon: 'fa-user-check', color: '#0284C7', gradient: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)' },
  { stage: 4, id: 'offers', name: 'Provisional Offers', icon: 'fa-envelope-open-text', color: '#059669', gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' },
  { stage: 5, id: 'enrolled', name: 'Joined & Enrolled', icon: 'fa-graduation-cap', color: '#10B981', gradient: 'linear-gradient(135deg, #047857 0%, #10B981 100%)' },
  { stage: 6, id: 'academics', name: 'Academic In-Course', icon: 'fa-book-open-reader', color: '#D97706', gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)' },
  { stage: 7, id: 'placements', name: 'Placed & Alumni', icon: 'fa-briefcase', color: '#7C3AED', gradient: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)' }
];

const OrgMisDashboard = () => {
  const location = useLocation();
  const isAnalyticsPortal = location.pathname.includes('/analytics');

  const [session, setSession] = useState('2026-2027');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('capacityPct');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(false);

  // Chart interactivity states
  const [chartView, setChartView] = useState('capacity'); // 'capacity' | 'performance' | 'finance'
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [selectedDeptDetail, setSelectedDeptDetail] = useState(null);
  const [activeStageDetail, setActiveStageDetail] = useState(null);
  const [exportNotice, setExportNotice] = useState('');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 240);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, sortBy, sortAsc]);

  // Route helper
  const getNavPath = (view) => {
    if (isAnalyticsPortal) {
      if (view === 'funnel') return '/unilms/analytics/joining_analytics';
      if (view === 'students') return '/unilms/analytics/student_analysis';
      if (view === 'reports') return '/unilms/analytics/reports';
      return '/unilms/analytics/dashboard';
    }
    if (view === 'funnel') return '/unilms/org/admissions/joining_analytics';
    if (view === 'students') return '/unilms/org/academics/student_analysis';
    if (view === 'reports') return '/unilms/org/mis/reports';
    return '/unilms/org/mis/dashboard';
  };

  const [benchmarks, setBenchmarks] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState({
    totalBilled: 0,
    totalCollected: 0,
    recoveryPct: 0,
    enrolledCount: 0,
    totalIntake: 0,
    seatsPct: 0,
    passRate: null,
    offersCount: 0,
    placedCount: 0,
    placementRate: 0,
    funnel: null
  });

  useEffect(() => {
    let isMounted = true;
    const fetchLiveTelemetry = async () => {
      try {
        setLoading(true);
        const [deptsRes, studentsRes, offersRes, invoicesRes, funnelRes] = await Promise.all([
          academicsService.getDepartments().catch(() => []),
          studentsService.getStudents({ limit: 1000 }).catch(() => []),
          placementsService.getOffers().catch(() => []),
          financeService.getInvoices().catch(() => []),
          admissionsService.getFunnel().catch(() => null)
        ]);

        if (!isMounted) return;

        const depts = Array.isArray(deptsRes) ? deptsRes : (deptsRes?.data || []);
        const rawStudents = Array.isArray(studentsRes) ? studentsRes : (studentsRes?.data?.students || studentsRes?.data || []);
        const students = Array.isArray(rawStudents) ? rawStudents : [];
        const rawOffers = Array.isArray(offersRes) ? offersRes : (offersRes?.data || []);
        const offers = Array.isArray(rawOffers) ? rawOffers : [];
        const rawInvoices = Array.isArray(invoicesRes) ? invoicesRes : (invoicesRes?.data || []);
        const invoices = Array.isArray(rawInvoices) ? rawInvoices : [];

        // Real financial calculations
        const billed = invoices.reduce((sum, inv) => sum + Number(inv.amount || inv.totalAmount || 0), 0);
        const collected = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || (inv.status === 'PAID' ? inv.amount : 0) || 0), 0);
        const totalIntake = depts.reduce((sum, d) => sum + (Number(d.intake) || 60), 0);
        const enrolledCount = students.length;
        const seatsPct = totalIntake > 0 ? Math.round((enrolledCount / totalIntake) * 100) : 0;
        const recoveryPct = billed > 0 ? Math.round((collected / billed) * 100) : 0;
        const acceptedOffers = offers.filter(o => o.status === 'Accepted').length;
        const placementRate = offers.length > 0 ? Math.round((acceptedOffers / offers.length) * 100) : 0;

        setLiveMetrics({
          totalBilled: billed,
          totalCollected: collected,
          recoveryPct,
          enrolledCount,
          totalIntake,
          seatsPct,
          passRate: null,
          offersCount: offers.length,
          placedCount: acceptedOffers,
          placementRate,
          funnel: funnelRes?.data || funnelRes || null
        });

        if (depts.length > 0) {
          const liveRows = depts.map((d) => {
            const deptStudents = students.filter(s => s.departmentId === d.id || s.department_id === d.id);
            const deptOffers = offers.filter(o => o.department_name === d.name || o.department === d.name);
            const deptAccepted = deptOffers.filter(o => o.status === 'Accepted').length;
            const short = d.code || d.name.split(' ').map(w => w[0]).join('');
            const enrolled = deptStudents.length;
            const intake = Number(d.intake) || 60;
            const cap = intake > 0 ? Math.min(100, Math.round((enrolled / intake) * 100)) : 0;
            const placedPct = deptOffers.length > 0 ? Math.round((deptAccepted / deptOffers.length) * 100) : 0;
            return {
              dept: d.name,
              shortName: short,
              category: d.name.toLowerCase().includes('management') ? 'Management' : 'Engineering',
              intake,
              enrolled,
              capacityPct: cap,
              attendance: 85.0,
              passRate: 90.0,
              feeRecovery: recoveryPct,
              placedPct,
              rating: cap >= 80 ? 'Outstanding' : (cap >= 50 ? 'Good' : 'Needs Focus'),
              hod: d.headOfDepartment || d.hodName || 'Department HOD',
              facultyCount: d._count?.faculty || 0,
              avgCtc: '—',
              maxCtc: '—',
              arrears: 0,
              defaulters: 0,
              feeCollected: '₹0.00 Cr',
              feeBilled: '₹0.00 Cr'
            };
          });
          setBenchmarks(liveRows);
        } else {
          setBenchmarks([]);
        }
      } catch (e) {
        console.warn('Could not load dynamic telemetry for MIS dashboard:', e);
        if (isMounted) setBenchmarks([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLiveTelemetry();
    return () => { isMounted = false; };
  }, []);

  const pipelineStages = useMemo(() => {
    const f = liveMetrics.funnel || {};
    const leads = f.totalLeads ?? f.leads ?? 0;
    const apps = f.totalApplications ?? f.applications ?? 0;
    const verified = f.verifiedApplications ?? f.verified ?? 0;
    const offersExt = f.offersExtended ?? f.offers ?? 0;
    const enrolled = liveMetrics.enrolledCount || (f.enrolledStudents ?? f.enrolled ?? 0);
    const pass = liveMetrics.passRate !== null ? `${liveMetrics.passRate}%` : '—';
    const placed = liveMetrics.offersCount > 0 ? `${liveMetrics.placementRate}%` : '0.0%';

    return PIPELINE_TEMPLATE.map(t => {
      if (t.id === 'leads') {
        return { ...t, metric: leads.toLocaleString('en-IN'), subText: 'Inbound Inquiries', conversion: leads > 0 ? `${Math.round((apps / leads) * 100)}% to App` : '0% to App', detail: `${leads} inquiries captured across marketing and walk-in channels.` };
      }
      if (t.id === 'apps') {
        return { ...t, metric: apps.toLocaleString('en-IN'), subText: 'Submitted Form Dossiers', conversion: apps > 0 ? `${Math.round((verified / apps) * 100)}% Verified` : '0% Verified', detail: `${apps} applicant profiles received in admissions registry.` };
      }
      if (t.id === 'verified') {
        return { ...t, metric: verified.toLocaleString('en-IN'), subText: 'Eligibility Pass', conversion: verified > 0 ? `${Math.round((offersExt / verified) * 100)}% Offered` : '0% Offered', detail: `${verified} candidates authenticated against statutory eligibility thresholds.` };
      }
      if (t.id === 'offers') {
        return { ...t, metric: offersExt.toLocaleString('en-IN'), subText: 'Provisional Offers', conversion: offersExt > 0 ? `${Math.round((enrolled / offersExt) * 100)}% Yield` : '0% Yield', detail: `${offersExt} admission offers extended with course seat allocation.` };
      }
      if (t.id === 'enrolled') {
        return { ...t, metric: enrolled.toLocaleString('en-IN'), subText: `${liveMetrics.seatsPct}% Intake Cap`, conversion: 'Active Cohort', detail: `${enrolled} permanent registrations confirmed in student directory.` };
      }
      if (t.id === 'academics') {
        return { ...t, metric: pass, subText: 'Semester Pass Rate', conversion: 'Course Progress', detail: 'Active cohort evaluations and academic syllabus tracking across departments.' };
      }
      if (t.id === 'placements') {
        return { ...t, metric: placed, subText: `${liveMetrics.placedCount} Offers Accepted`, conversion: `${liveMetrics.offersCount} Total Offers`, detail: `${liveMetrics.placedCount} corporate offers accepted across visiting recruiting companies.` };
      }
      return t;
    });
  }, [liveMetrics]);

  // Filter & sort benchmarks
  const filteredBenchmarks = useMemo(() => {
    return benchmarks
      .filter(item => {
        const matchesCategory = selectedCategory === 'All'
          ? true
          : selectedCategory === 'At-Risk Priorities'
            ? (item.capacityPct < 70 || item.rating === 'Needs Focus' || item.rating === 'Critical Alert')
            : item.category === selectedCategory;
        const matchesSearch = item.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.shortName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [searchTerm, selectedCategory, sortBy, sortAsc]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredBenchmarks, 5);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  // Direct CSV Export capability
  const handleExportCSV = () => {
    try {
      const headers = ['Department', 'Category', 'Intake', 'Enrolled', 'Capacity %', 'Avg Attendance %', 'Pass Rate %', 'Fee Recovery %', 'Placement %', 'Rating', 'HOD'];
      const rows = filteredBenchmarks.map(b => [
        `"${b.dept}"`,
        `"${b.category}"`,
        b.intake,
        b.enrolled,
        `${b.capacityPct}%`,
        `${b.attendance}%`,
        `${b.passRate}%`,
        `${b.feeRecovery}%`,
        `${b.placedPct}%`,
        `"${b.rating}"`,
        `"${b.hod}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `UniLMS_Executive_Benchmarking_${session}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportNotice('Benchmarking matrix exported successfully to CSV.');
      setTimeout(() => setExportNotice(''), 3500);
    } catch {
      setExportNotice('Export complete.');
      setTimeout(() => setExportNotice(''), 3000);
    }
  };

  return (
    <section className="view-section active" style={{ animation: 'fadeIn 0.25s ease' }}>

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HEADER CONTROLS BAR                                         */}
      {/* ========================================================================= */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 50%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '22px',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
            flexShrink: 0
          }}>
            <i className="fa-solid fa-chart-pie"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.3px' }}>
                Institutional MIS &amp; Executive Cockpit
              </h2>
              <span style={{
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
                color: '#7C3AED',
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 10px',
                borderRadius: '12px',
                border: '1px solid rgba(124, 58, 237, 0.3)'
              }}>
                <i className="fa-solid fa-crown me-1" style={{ fontSize: '9px' }}></i> Executive Boardroom Suite
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Consolidated institutional metrics, real-time fiscal telemetry &amp; statutory accreditation intelligence
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="form-control"
              style={{
                width: 'auto',
                minWidth: '180px',
                fontWeight: '700',
                fontSize: '13px',
                borderRadius: '10px',
                cursor: 'pointer',
                background: 'var(--bg-main, #f8fafc)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)'
              }}
            >
              <option value="2026-2027">AY 2026-2027 (Current Active)</option>
              <option value="2025-2026">AY 2025-2026 (Audited Prior)</option>
            </select>
          </div>

          <Link
            to={getNavPath('reports')}
            className="btn btn-outline-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: '700', borderRadius: '10px', padding: '8px 14px' }}
          >
            <i className="fa-solid fa-table-list"></i> Central Reports Hub
          </Link>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontSize: '13px',
              fontWeight: '700',
              borderRadius: '10px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
            }}
          >
            <i className="fa-solid fa-file-pdf"></i> Download Boardroom Dossier
          </button>
        </div>
      </div>

      {exportNotice && (
        <div style={{
          padding: '12px 18px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          color: '#059669',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: '700',
          animation: 'fadeIn 0.2s ease'
        }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: '16px' }}></i>
          <span>{exportNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. AI EXECUTIVE INTELLIGENCE BRIEFING BANNER                             */}
      {/* ========================================================================= */}
      {/* <div style={{
        background: 'linear-gradient(135deg, rgba(67, 56, 202, 0.08) 0%, rgba(124, 58, 237, 0.05) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '18px',
        padding: '22px 24px',
        marginBottom: '24px',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <span style={{
            background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
            color: '#ffffff',
            padding: '5px 14px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)'
          }}>
            <i className="fa-solid fa-wand-magic-sparkles"></i> AI Executive Briefing
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' }}></span>
            Telemetry Last Synced: Today, 11:45 AM • Verified Clean
          </div>
        </div>

        <h3 style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', lineHeight: '1.4' }}>
          Institutional Health Overview: Stellar Technology &amp; Computing Yield; Core Engineering Disciplines Require Rebalancing
        </h3>
        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-main)', lineHeight: '1.65' }}>
          The university maintains an overall <strong>86.4% seat fulfillment rate</strong> (1,080 / 1,250 sanctioned intake). 
          Term 1 tuition recovery reached <strong>79.8% (₹13.40 Cr collected of ₹16.80 Cr billed)</strong>, tracking <strong>+8.4% YoY</strong> above AY 2025-26. 
          Campus-wide semester pass rate stands at a robust <strong>89.2%</strong>, and corporate placements have achieved <strong>80.5% placement rate</strong> with an average package of <strong>₹6.4 LPA</strong> and peak package of <strong>₹28.5 LPA</strong>.
        </p>

        Action Pills
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(99, 102, 241, 0.16)' }}>
          <Link 
            to={getNavPath('funnel')} 
            style={{ 
              fontSize: '12.5px', 
              fontWeight: '700', 
              color: '#4338CA', 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '6px 14px', 
              background: 'rgba(79, 70, 229, 0.12)', 
              borderRadius: '10px',
              border: '1px solid rgba(79, 70, 229, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-filter-circle-dollar"></i> Inspect Admission ➔ Joining Funnel
          </Link>
          <Link 
            to={getNavPath('students')} 
            style={{ 
              fontSize: '12.5px', 
              fontWeight: '700', 
              color: '#059669', 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '6px 14px', 
              background: 'rgba(16, 185, 129, 0.12)', 
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-user-shield"></i> Open Student 360° &amp; Risk Radar
          </Link>
          <Link 
            to={getNavPath('reports')} 
            style={{ 
              fontSize: '12.5px', 
              fontWeight: '700', 
              color: '#D97706', 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '6px 14px', 
              background: 'rgba(217, 119, 6, 0.12)', 
              borderRadius: '10px',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-table-list"></i> Audit Central NAAC SSR Sheets
          </Link>
        </div>
      </div> */}

      {/* ========================================================================= */}
      {/* 3. TOP MASTER INSTITUTIONAL KPIS (Exact Same-to-Same Layout as First Image) */}
      {/* ========================================================================= */}
      <div className="faculty-kpi-grid">
        {/* Card 1: Fee Revenue & Recovery */}
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
            <i className="fa-solid fa-indian-rupee-sign"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Fee Revenue &amp; Recovery</div>
            <div className="faculty-metric-value" style={{ color: '#7C3AED' }}>
              {liveMetrics.totalBilled > 0 ? (
                <>₹{(liveMetrics.totalCollected / 10000000).toFixed(2)} Cr <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>/ ₹{(liveMetrics.totalBilled / 10000000).toFixed(2)} Cr</span></>
              ) : (
                <>₹0.00 <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>/ ₹0.00</span></>
              )}
            </div>
            <div className="faculty-metric-sub" style={{ color: liveMetrics.totalBilled > 0 ? '#059669' : 'var(--text-muted, #64748b)' }}>
              {liveMetrics.totalBilled > 0 ? (
                <><i className="fa-solid fa-arrow-trend-up"></i> <span>{liveMetrics.recoveryPct}% Recovered</span></>
              ) : (
                <span>No Fee Billing Generated</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Sanctioned Seats Filled */}
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Sanctioned Seats Filled</div>
            <div className="faculty-metric-value" style={{ color: '#2563EB' }}>
              {liveMetrics.totalIntake > 0 ? (
                <>{liveMetrics.seatsPct}% <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>({liveMetrics.enrolledCount} / {liveMetrics.totalIntake})</span></>
              ) : (
                <>{liveMetrics.enrolledCount} Students</>
              )}
            </div>
            <div className="faculty-metric-sub" style={{ color: liveMetrics.totalIntake > 0 ? '#059669' : 'var(--text-muted, #64748b)' }}>
              {liveMetrics.totalIntake > 0 ? (
                <><i className="fa-solid fa-circle-check"></i> <span>{Math.max(0, liveMetrics.totalIntake - liveMetrics.enrolledCount)} Vacant Seats</span></>
              ) : (
                <span>Awaiting Program Intake Capacity</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Campus Pass Rate */}
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Campus Pass Rate</div>
            <div className="faculty-metric-value" style={{ color: liveMetrics.passRate !== null ? '#D97706' : '#94A3B8' }}>
              {liveMetrics.passRate !== null ? `${liveMetrics.passRate}% Pass` : '—'}
            </div>
            <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
              <span>{liveMetrics.passRate !== null ? 'Average Semester Results' : 'Awaiting Examination Results'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Placement Offer Rate */}
        <div className="faculty-metric-card">
          <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
            <i className="fa-solid fa-briefcase"></i>
          </div>
          <div className="faculty-metric-info">
            <div className="faculty-metric-label">Placement Offer Rate</div>
            <div className="faculty-metric-value" style={{ color: liveMetrics.offersCount > 0 ? '#059669' : '#94A3B8' }}>
              {liveMetrics.offersCount > 0 ? `${liveMetrics.placementRate}% Placed` : '0.0% Placed'}
            </div>
            <div className="faculty-metric-sub" style={{ color: liveMetrics.offersCount > 0 ? '#059669' : 'var(--text-secondary, #64748b)' }}>
              {liveMetrics.offersCount > 0 ? (
                <><i className="fa-solid fa-arrow-trend-up"></i> <span>{liveMetrics.placedCount} Accepted ({liveMetrics.offersCount} Total)</span></>
              ) : (
                <span>No Placement Offers Issued</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. EXECUTIVE VISUAL ANALYTICS: CHARTS & FISCAL RING GAUGES                */}
      {/* ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>

        {/* CHART 1: Interactive Departmental Comparative Bar Chart */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color)',
          borderRadius: '18px',
          padding: '22px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Chart Header & Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-chart-column" style={{ color: '#4F46E5' }}></i>
                Department Comparative Performance Visualizer
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Hover bars for detailed departmental metrics &amp; capacity utilization
              </p>
            </div>

            {/* View Selector Pills */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-main, #f1f5f9)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              {[
                { id: 'capacity', label: 'Seats & Intake', icon: 'fa-users' },
                { id: 'performance', label: 'Pass & Placements', icon: 'fa-award' },
                { id: 'finance', label: 'Fee Recovery', icon: 'fa-indian-rupee-sign' }
              ].map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setChartView(v.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '7px',
                    border: 'none',
                    background: chartView === v.id ? 'var(--bg-card, #ffffff)' : 'transparent',
                    color: chartView === v.id ? '#4F46E5' : 'var(--text-muted)',
                    fontWeight: chartView === v.id ? '800' : '600',
                    fontSize: '11px',
                    cursor: 'pointer',
                    boxShadow: chartView === v.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <i className={`fa-solid ${v.icon}`} style={{ fontSize: '10px' }}></i>
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SVG Visual Bar Chart */}
          <div style={{ position: 'relative', width: '100%', minHeight: '220px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {benchmarks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-chart-column mb-2" style={{ fontSize: '32px', opacity: 0.35, display: 'block' }}></i>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' }}>No Department Telemetry Available</div>
                <div style={{ fontSize: '12px' }}>Configure academic departments and enroll students to view comparative performance telemetry.</div>
              </div>
            ) : (
            <>
            <svg
              viewBox="0 0 680 230"
              style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
            >
              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((tick) => {
                const y = 190 - (tick / 100) * 160;
                return (
                  <g key={tick}>
                    <line
                      x1="45"
                      y1={y}
                      x2="670"
                      y2={y}
                      stroke="var(--border-color, #E2E8F0)"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x="40"
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="var(--text-muted, #94A3B8)"
                      fontWeight="600"
                    >
                      {chartView === 'capacity' ? Math.round((tick / 100) * 120) : `${tick}%`}
                    </text>
                  </g>
                );
              })}

              {/* 80% Benchmark Line */}
              {chartView !== 'capacity' && (
                <line
                  x1="45"
                  y1={190 - 0.8 * 160}
                  x2="670"
                  y2={190 - 0.8 * 160}
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeDasharray="6 3"
                  opacity="0.8"
                />
              )}

              {/* Bars per department */}
              {benchmarks.map((dept, idx) => {
                const slotWidth = (670 - 55) / benchmarks.length;
                const slotCenterX = 55 + idx * slotWidth + slotWidth / 2;
                const barWidth = chartView === 'capacity' || chartView === 'performance' ? 14 : 20;

                let heightA = 0;
                let heightB = 0;
                let yA = 190;
                let yB = 190;
                let fillA = '#4F46E5';
                let fillB = '#10B981';

                if (chartView === 'capacity') {
                  heightA = (dept.intake / 120) * 160;
                  heightB = (dept.enrolled / 120) * 160;
                  yA = 190 - heightA;
                  yB = 190 - heightB;
                  fillA = 'rgba(99, 102, 241, 0.25)';
                  fillB = dept.capacityPct >= 90 ? '#10B981' : dept.capacityPct >= 70 ? '#3B82F6' : dept.capacityPct >= 50 ? '#F59E0B' : '#EF4444';
                } else if (chartView === 'performance') {
                  heightA = (dept.passRate / 100) * 160;
                  heightB = (dept.placedPct / 100) * 160;
                  yA = 190 - heightA;
                  yB = 190 - heightB;
                  fillA = '#0284C7';
                  fillB = '#7C3AED';
                } else {
                  heightA = (dept.feeRecovery / 100) * 160;
                  yA = 190 - heightA;
                  fillA = dept.feeRecovery >= 85 ? '#10B981' : dept.feeRecovery >= 75 ? '#F59E0B' : '#EF4444';
                }

                const isHovered = hoveredBarIndex === idx;

                return (
                  <g
                    key={dept.shortName}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    onClick={() => setSelectedDeptDetail(dept)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Hover column backdrop */}
                    <rect
                      x={slotCenterX - slotWidth / 2 + 2}
                      y="25"
                      width={slotWidth - 4}
                      height="165"
                      fill={isHovered ? 'rgba(99, 102, 241, 0.08)' : 'transparent'}
                      rx="8"
                    />

                    {chartView === 'capacity' ? (
                      <>
                        {/* Intake Bar (Capacity Ceiling) */}
                        <rect
                          x={slotCenterX - barWidth - 1}
                          y={yA}
                          width={barWidth}
                          height={heightA}
                          fill={fillA}
                          stroke="#6366F1"
                          strokeWidth="1"
                          rx="4"
                        />
                        {/* Enrolled Bar */}
                        <rect
                          x={slotCenterX + 1}
                          y={yB}
                          width={barWidth}
                          height={heightB}
                          fill={fillB}
                          rx="4"
                        />
                        <text
                          x={slotCenterX + 1 + barWidth / 2}
                          y={yB - 4}
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight="800"
                          fill={fillB}
                        >
                          {dept.enrolled}
                        </text>
                      </>
                    ) : chartView === 'performance' ? (
                      <>
                        {/* Pass Rate Bar */}
                        <rect
                          x={slotCenterX - barWidth - 1}
                          y={yA}
                          width={barWidth}
                          height={heightA}
                          fill={fillA}
                          rx="4"
                        />
                        {/* Placement Rate Bar */}
                        <rect
                          x={slotCenterX + 1}
                          y={yB}
                          width={barWidth}
                          height={heightB}
                          fill={fillB}
                          rx="4"
                        />
                        <text
                          x={slotCenterX + 1 + barWidth / 2}
                          y={yB - 4}
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight="800"
                          fill={fillB}
                        >
                          {dept.placedPct}%
                        </text>
                      </>
                    ) : (
                      <>
                        {/* Single Fee Recovery Bar */}
                        <rect
                          x={slotCenterX - barWidth / 2}
                          y={yA}
                          width={barWidth}
                          height={heightA}
                          fill={fillA}
                          rx="4"
                        />
                        <text
                          x={slotCenterX}
                          y={yA - 5}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="800"
                          fill={fillA}
                        >
                          {dept.feeRecovery}%
                        </text>
                      </>
                    )}

                    {/* Department Short Name */}
                    <text
                      x={slotCenterX}
                      y="210"
                      textAnchor="middle"
                      fontSize="10.5"
                      fontWeight={isHovered ? '800' : '700'}
                      fill={isHovered ? '#4F46E5' : 'var(--text-main, #334155)'}
                    >
                      {dept.shortName}
                    </text>
                    <text
                      x={slotCenterX}
                      y="223"
                      textAnchor="middle"
                      fontSize="9"
                      fill="var(--text-muted, #94A3B8)"
                      fontWeight="600"
                    >
                      {chartView === 'capacity' ? `${dept.capacityPct}%` : dept.category.substring(0, 4)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Active Tooltip Overlay when hovering */}
            {hoveredBarIndex !== null && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '12px',
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '8px 12px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                fontSize: '11px',
                color: 'var(--text-main)',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 10
              }}>
                <div style={{ fontWeight: '800', color: '#4F46E5' }}>
                  {benchmarks[hoveredBarIndex]?.dept}
                </div>
                <div>Enrolled: <strong>{benchmarks[hoveredBarIndex]?.enrolled}</strong> / {benchmarks[hoveredBarIndex]?.intake} ({benchmarks[hoveredBarIndex]?.capacityPct}%)</div>
                <div>Pass Rate: <strong>{benchmarks[hoveredBarIndex]?.passRate}%</strong> • Placed: <strong>{benchmarks[hoveredBarIndex]?.placedPct}%</strong></div>
                <div>Fee Recovery: <strong>{benchmarks[hoveredBarIndex]?.feeRecovery}%</strong></div>
              </div>
            )}
            </>
            )}
          </div>

          {/* Chart Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            {chartView === 'capacity' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(99, 102, 241, 0.35)', border: '1px solid #6366F1' }} />
                  <span>Sanctioned Intake Capacity</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10B981' }} />
                  <span>Actual Enrolled Cohort</span>
                </div>
              </>
            ) : chartView === 'performance' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#0284C7' }} />
                  <span>Semester Pass Rate %</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#7C3AED' }} />
                  <span>Placement Offer %</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10B981' }} />
                <span>Term Tuition Realization %</span>
              </div>
            )}
          </div>
        </div>

        {/* CHART 2: Fiscal & Fee Recovery Realization Donut Gauge */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color)',
          borderRadius: '18px',
          padding: '22px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-sack-dollar" style={{ color: '#059669' }}></i>
                Fiscal Realization &amp; Tuition Recovery Donut
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                {liveMetrics.totalBilled > 0 ? `Term collection trajectory vs ₹${(liveMetrics.totalBilled / 10000000).toFixed(2)} Cr billing` : 'Awaiting institutional fee billing schedule'}
              </p>
            </div>
            <span style={{ background: liveMetrics.recoveryPct >= 70 ? '#DCFCE7' : '#FEF3C7', color: liveMetrics.recoveryPct >= 70 ? '#16A34A' : '#D97706', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>
              {liveMetrics.recoveryPct}% {liveMetrics.recoveryPct >= 70 ? 'Healthy' : 'Tracking'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', flex: 1, padding: '10px 0' }}>
            {/* SVG Circular Donut */}
            <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
              <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="transparent"
                  stroke="rgba(245, 158, 11, 0.2)"
                  strokeWidth="18"
                />
                {/* Realized Arc */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="transparent"
                  stroke="url(#feeGradient)"
                  strokeWidth="18"
                  strokeDasharray={`${Math.max(0.1, ((liveMetrics.recoveryPct || 0) / 100) * 389.56)} 389.56`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="feeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4338CA" />
                    <stop offset="50%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1' }}>
                  {liveMetrics.recoveryPct}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
                  Realized
                </span>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800', marginTop: '2px' }}>
                  {liveMetrics.totalBilled > 0 ? `₹${(liveMetrics.totalCollected / 10000000).toFixed(2)} Cr` : '₹0.00'}
                </span>
              </div>
            </div>

            {/* Financial Stream Breakdown */}
            <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {benchmarks.length > 0 ? (
                benchmarks.slice(0, 3).map((dept, bIdx) => (
                  <div key={bIdx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--text-main)' }}>{dept.dept}</span>
                      <span style={{ color: '#059669' }}>{dept.feeRecovery}% Realized</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, dept.feeRecovery))}%`, height: '100%', background: '#10B981', borderRadius: '3px' }} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                  <i className="fa-solid fa-receipt mb-1" style={{ fontSize: '20px', opacity: 0.35, display: 'block' }}></i>
                  No departmental fee streams configured yet.
                </div>
              )}

              <div style={{
                background: 'var(--bg-main, #f8fafc)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11.5px',
                marginTop: '4px'
              }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Outstanding Term Defaulters:</span>
                <span style={{ fontWeight: '800', color: liveMetrics.totalBilled > liveMetrics.totalCollected ? '#DC2626' : '#10B981' }}>
                  {liveMetrics.totalBilled > liveMetrics.totalCollected ? `₹${((liveMetrics.totalBilled - liveMetrics.totalCollected) / 10000000).toFixed(2)} Cr Pending` : '0 Outstanding Dues'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
              Fiscal Target: <strong>₹15.0 Cr by Term End</strong>
            </span>
            <Link to={getNavPath('reports')} style={{ fontWeight: '700', color: '#4F46E5', textDecoration: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Audit Fee Defaulters <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px' }}></i>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. 7-STAGE INSTITUTIONAL LIFECYCLE FLOWCHART                             */}
      {/* ========================================================================= */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color)',
        borderRadius: '18px',
        padding: '22px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                7-Stage Institutional Life-Cycle Flowchart
              </h3>
              <span style={{ background: '#E0F2FE', color: '#0284C7', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>
                End-to-End Pipeline
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Sequential institutional candidate progression from initial inbound enquiry to Day-1 induction and corporate placement
            </p>
          </div>

          <Link
            to={getNavPath('funnel')}
            className="btn btn-sm btn-outline-primary"
            style={{ fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}
          >
            <i className="fa-solid fa-filter me-1"></i> Full Funnel Diagnostics
          </Link>
        </div>

        {/* Horizontal Responsive Flowchart Track */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', minWidth: '820px', gap: '8px' }}>
            {pipelineStages.map((st, sIdx) => {
              const isSelected = activeStageDetail?.id === st.id;
              return (
                <React.Fragment key={st.id}>
                  {/* Stage Flow Card */}
                  <div
                    onClick={() => setActiveStageDetail(isSelected ? null : st)}
                    style={{
                      flex: 1,
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-main, #f8fafc)',
                      border: isSelected ? `2px solid ${st.color}` : '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '14px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      boxShadow: isSelected ? '0 4px 14px rgba(99, 102, 241, 0.15)' : 'none',
                      minWidth: '110px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '7px',
                        background: st.gradient,
                        color: '#fff',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800'
                      }}>
                        0{st.stage}
                      </span>
                      <i className={`fa-solid ${st.icon}`} style={{ color: st.color, fontSize: '13px' }}></i>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {st.name}
                    </div>

                    <div style={{ fontSize: '17px', fontWeight: '800', color: st.color, marginTop: '2px' }}>
                      {st.metric}
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {st.subText}
                    </div>

                    <div style={{
                      marginTop: '8px',
                      fontSize: '9.5px',
                      fontWeight: '800',
                      background: 'var(--bg-card, #ffffff)',
                      color: st.color,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center'
                    }}>
                      {st.conversion}
                    </div>
                  </div>

                  {/* Flow Arrow between stages */}
                  {sIdx < pipelineStages.length - 1 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', opacity: 0.6, flexShrink: 0 }}>
                      <i className="fa-solid fa-chevron-right"></i>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Stage Detail Drawer */}
        {activeStageDetail && (
          <div style={{
            marginTop: '16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)',
            border: `1px solid ${activeStageDetail.color}50`,
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: activeStageDetail.gradient, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                <i className={`fa-solid ${activeStageDetail.icon}`}></i>
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-main)' }}>
                  Stage 0{activeStageDetail.stage}: {activeStageDetail.name} &bull; <span style={{ color: activeStageDetail.color }}>{activeStageDetail.metric}</span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  {activeStageDetail.detail}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                to={getNavPath('funnel')}
                className="btn btn-sm btn-primary"
                style={{ fontSize: '12px', borderRadius: '8px', fontWeight: '700' }}
              >
                Inspect Cohort
              </Link>
              <button
                type="button"
                onClick={() => setActiveStageDetail(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '4px' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. CROSS-DEPARTMENT PERFORMANCE BENCHMARK MATRIX (TABLE)                 */}
      {/* ========================================================================= */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color)',
        borderRadius: '18px',
        padding: '22px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Table Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Cross-Department Performance Benchmarking Matrix
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Holistic departmental comparison across admissions capacity, student attendance, pass rates, and placements
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '11px', top: '10px', color: 'var(--text-muted)', fontSize: '12px' }}></i>
              <input
                type="text"
                placeholder="Search department or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '7px 12px 7px 32px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  fontSize: '12.5px',
                  background: 'var(--bg-main, #f8fafc)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  minWidth: '220px'
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="btn btn-sm btn-outline-secondary"
              style={{ fontSize: '12px', fontWeight: '700', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-download"></i> Export Excel
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {['All', 'Engineering', 'Management', 'At-Risk Priorities'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--primary, #4F46E5)' : 'var(--border-color)',
                background: selectedCategory === cat ? 'var(--primary, #4F46E5)' : 'transparent',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Benchmarking Table */}
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)' }}>
                <th style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => handleSort('dept')}>
                  Academic Department {sortBy === 'dept' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => handleSort('capacityPct')}>
                  Seats Filled % {sortBy === 'capacityPct' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => handleSort('attendance')}>
                  Avg Attendance {sortBy === 'attendance' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => handleSort('passRate')}>
                  Pass Rate % {sortBy === 'passRate' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => handleSort('feeRecovery')}>
                  Fee Recovery % {sortBy === 'feeRecovery' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => handleSort('placedPct')}>
                  Placement % {sortBy === 'placedPct' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Evaluation Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No departments match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((dept, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedDeptDetail(dept)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: selectedDeptDetail?.dept === dept.dept ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: '#4F46E5',
                          fontSize: '11px',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {dept.shortName.substring(0, 3)}
                        </span>
                        <div>
                          <div>{dept.dept}</div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                            {dept.category} &bull; HOD: {dept.hod}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{
                            width: `${dept.capacityPct}%`,
                            height: '100%',
                            background: dept.capacityPct >= 90 ? '#10B981' : dept.capacityPct < 60 ? '#EF4444' : '#F59E0B'
                          }} />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '12.5px', color: dept.capacityPct >= 90 ? '#059669' : dept.capacityPct < 60 ? '#DC2626' : 'var(--text-main)' }}>
                          {dept.enrolled}/{dept.intake} ({dept.capacityPct}%)
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        background: dept.attendance >= 80 ? '#DCFCE7' : '#FEE2E2',
                        color: dept.attendance >= 80 ? '#16A34A' : '#DC2626',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '12px'
                      }}>
                        {dept.attendance}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{dept.passRate}%</span>
                        {dept.arrears > 0 && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({dept.arrears} arr)</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: dept.feeRecovery >= 85 ? '#059669' : '#D97706' }}>
                      <div>{dept.feeRecovery}%</div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500' }}>{dept.feeCollected}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '800', color: '#7C3AED' }}>
                      <div>{dept.placedPct}%</div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500' }}>Avg {dept.avgCtc}</span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <span style={{
                        background: dept.rating === 'Outstanding' ? '#DCFCE7' : dept.rating === 'Critical Alert' ? '#FEE2E2' : dept.rating === 'Needs Focus' ? '#FEF3C7' : '#E0F2FE',
                        color: dept.rating === 'Outstanding' ? '#16A34A' : dept.rating === 'Critical Alert' ? '#DC2626' : dept.rating === 'Needs Focus' ? '#D97706' : '#0284C7',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '11.5px',
                        display: 'inline-block'
                      }}>
                        {dept.rating}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Department Inline Dossier Drawer */}
        {selectedDeptDetail && (
          <div style={{
            marginTop: '16px',
            background: 'var(--bg-main, #f8fafc)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '16px 20px',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#4F46E5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                  {selectedDeptDetail.shortName}
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: 'var(--text-main)' }}>
                    {selectedDeptDetail.dept} &mdash; Executive Dossier
                  </h4>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Head of Department: <strong>{selectedDeptDetail.hod}</strong> &bull; Core Faculty: <strong>{selectedDeptDetail.facultyCount} Members</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDeptDetail(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--bg-card, #ffffff)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Intake Capacity</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>
                  {selectedDeptDetail.enrolled} / {selectedDeptDetail.intake} ({selectedDeptDetail.capacityPct}%)
                </div>
              </div>
              <div style={{ background: 'var(--bg-card, #ffffff)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Fee Billed vs Collected</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#059669' }}>
                  {selectedDeptDetail.feeCollected} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {selectedDeptDetail.feeBilled}</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-card, #ffffff)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Placement Metrics</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#7C3AED' }}>
                  {selectedDeptDetail.placedPct}% <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Avg {selectedDeptDetail.avgCtc})</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-card, #ffffff)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Backlogs &amp; Defaulters</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: selectedDeptDetail.arrears > 15 ? '#DC2626' : '#D97706' }}>
                  {selectedDeptDetail.arrears} Arrears &bull; {selectedDeptDetail.defaulters} Defaulters
                </div>
              </div>
            </div>
          </div>
        )}

        <TablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="academic departments"
        />
      </div>

      {/* ========================================================================= */}
      {/* 7. ACCREDITATION & STATUTORY REGULATORY READINESS GAUGE CARDS            */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '16px' }}>

        {/* Card 1: NAAC */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-award" style={{ color: '#4F46E5', fontSize: '16px' }}></i> NAAC SSR Accreditation
              </h4>
              <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '11px' }}>
                Grade A+ Projected
              </span>
            </div>
            <div style={{ height: '7px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: '84%', height: '100%', background: 'linear-gradient(90deg, #4338CA 0%, #6366F1 100%)', borderRadius: '4px' }} />
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              84% of required SSR qualitative &amp; quantitative metric data points validated across 7 core criteria. Projected CGPA 3.62 / 4.00.
            </p>
          </div>
          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Cycle-2 Assessment</span>
            <Link to={getNavPath('reports')} style={{ fontWeight: '700', color: '#4F46E5', textDecoration: 'none' }}>
              Audit Sheets &rarr;
            </Link>
          </div>
        </div>

        {/* Card 2: NBA */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-book-bookmark" style={{ color: '#10B981', fontSize: '16px' }}></i> NBA Outcome Attainment
              </h4>
              <span style={{ background: '#EDE9FE', color: '#7C3AED', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '11px' }}>
                79.2% Attained
              </span>
            </div>
            <div style={{ height: '7px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: '79.2%', height: '100%', background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)', borderRadius: '4px' }} />
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Direct &amp; indirect attainment mapped across 12 Program Outcomes (POs) and 2 PSOs. All Tier-1 programs surpass 75% NBA benchmark.
            </p>
          </div>
          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>OBE Matrix Active</span>
            <span style={{ fontWeight: '700', color: '#059669' }}>Verified Compliant</span>
          </div>
        </div>

        {/* Card 3: AICTE SFR */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-users" style={{ color: '#F59E0B', fontSize: '16px' }}></i> AICTE Faculty Ratio
              </h4>
              <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '11px' }}>
                1 : 14.2 (Compliant)
              </span>
            </div>
            <div style={{ height: '7px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: '95%', height: '100%', background: 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)', borderRadius: '4px' }} />
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Institutional Student-to-Faculty Ratio is well within the statutory limit of 1:15 required by AICTE/UGC guidelines. 86 full-time faculty.
            </p>
          </div>
          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Cadre Ratio: 1:2:6</span>
            <span style={{ fontWeight: '700', color: '#16A34A' }}>Audit Cleared</span>
          </div>
        </div>

        {/* Card 4: NIRF Target */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-ranking-star" style={{ color: '#06B6D4', fontSize: '16px' }}></i> NIRF Ranking Target
              </h4>
              <span style={{ background: '#CFFAFE', color: '#0891B2', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '11px' }}>
                Top #50 Target
              </span>
            </div>
            <div style={{ height: '7px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: '74%', height: '100%', background: 'linear-gradient(90deg, #0284C7 0%, #06B6D4 100%)', borderRadius: '4px' }} />
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Research citations, graduate outcomes &amp; diversity metrics positioned for Band 26-50. TLR score 74.8, GO score 82.1.
            </p>
          </div>
          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Target Band: 26-50</span>
            <span style={{ fontWeight: '700', color: '#0284C7' }}>Dossier Ready</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default OrgMisDashboard;
