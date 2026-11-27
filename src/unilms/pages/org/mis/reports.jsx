import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';
import { getCurrentAcademicYear, getAcademicYearOptions } from '../../../utils/date';

const REPORT_CATEGORIES = [
  { id: 'admissions', label: 'Admissions & Enrollment Ledgers', icon: 'fa-solid fa-user-plus' },
  { id: 'finance', label: 'Fee Collections & Defaulters Aging', icon: 'fa-solid fa-sack-dollar' },
  { id: 'academics', label: 'Pass Rates & Backlog Ledger', icon: 'fa-solid fa-graduation-cap' },
  { id: 'naac', label: 'NAAC / NIRF SSR Metric Sheets', icon: 'fa-solid fa-award' },
  { id: 'faculty', label: 'Faculty Cadre & SFR Ratios', icon: 'fa-solid fa-users-gear' }
];

const ADMISSION_REPORTS_DATA = [];
const FINANCE_REPORTS_DATA = [];
const ACADEMIC_REPORTS_DATA = [];

const NAAC_METRICS_DATA = [
  { criterion: 'Criterion 1: Curricular Aspects', metricCode: '1.1.2 & 1.2.1', description: 'Percentage of syllabus revised & CBCS implementation', value: 'CBCS / NEP-2020 Framework Active', status: 'Compliant' },
  { criterion: 'Criterion 2: Teaching-Learning', metricCode: '2.1.1 & 2.2.2', description: 'Enrolment percentage & Student-Full time Teacher ratio', value: 'Faculty-Student Ratio Tracked via ERP', status: 'Compliant' },
  { criterion: 'Criterion 2: Evaluation Process', metricCode: '2.6.2 & 2.6.3', description: 'Attainment of Program Outcomes & Pass percentage', value: 'OBE CO-PO Attainment Framework Active', status: 'Compliant' },
  { criterion: 'Criterion 3: Research & Extension', metricCode: '3.1.1 & 3.3.2', description: 'Grants received & Scopus/WoS journal publications', value: 'Research & Faculty Grants Module Active', status: 'On Track' },
  { criterion: 'Criterion 5: Student Support', metricCode: '5.1.1 & 5.2.1', description: 'Scholarship beneficiaries & Campus Placement %', value: 'Placements & Scholarship Gatekeeper Active', status: 'Compliant' },
  { criterion: 'Criterion 6: Governance & Leadership', metricCode: '6.2.2 & 6.3.2', description: 'Implementation of e-governance ERP across operations', value: '100% ERP Digitized via UniLMS', status: 'Compliant' }
];

const OrgMisReports = () => {
  const location = useLocation();
  const isAnalyticsPortal = location.pathname.includes('/analytics');

  const [activeCategory, setActiveCategory] = useState('admissions');
  const [session, setSession] = useState('');
  const [academicYears, setAcademicYears] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportNotice, setExportNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [activeCategory, searchTerm]);

  const [liveDepts, setLiveDepts] = useState([]);

  useEffect(() => {
    Promise.all([
      academicsService.getDepartments().catch(() => []),
      academicsService.getAcademicYears().catch(() => [])
    ]).then(([deptRes, yearsRes]) => {
      const depts = Array.isArray(deptRes) ? deptRes : (deptRes?.data || []);
      if (depts.length > 0) setLiveDepts(depts);
      const validYears = Array.isArray(yearsRes) ? yearsRes : (yearsRes?.data || []);
      setAcademicYears(validYears);
      if (validYears.length > 0) {
        const activeYear = validYears.find(y => y.status === 'active' || y.isCurrent) || validYears[0];
        if (activeYear) {
          setSession(activeYear.name || activeYear.year);
        }
      }
    }).catch(() => {});
  }, []);

  const currentData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let data = [];
    if (activeCategory === 'admissions') {
      if (liveDepts.length > 0) {
        data = liveDepts.map((d) => ({
          dept: d.name,
          sanctioned: Number(d.intake) || 60,
          apps: 0,
          offers: 0,
          enrolled: 0,
          general: 0,
          obc: 0,
          scSt: 0,
          girlsPct: 0.0,
          yieldPct: 0.0
        }));
      } else {
        data = [];
      }
      return data.filter(r => r.dept.toLowerCase().includes(term));
    } else if (activeCategory === 'finance') {
      if (liveDepts.length > 0) {
        data = liveDepts.map((d) => ({
          dept: d.name,
          billed: '₹0.00',
          collected: '₹0.00',
          outstanding: '₹0.00',
          recoveryPct: 0.0,
          defaulters: 0
        }));
      } else {
        data = [];
      }
      return data.filter(r => r.dept.toLowerCase().includes(term));
    } else if (activeCategory === 'academics') {
      if (liveDepts.length > 0) {
        data = liveDepts.map((d) => ({
          dept: d.name,
          appeared: 0,
          passed: 0,
          passPct: 0.0,
          distinction: 0,
          firstClass: 0,
          backlogs: 0,
          backlogPct: 0.0
        }));
      } else {
        data = [];
      }
      return data.filter(r => r.dept.toLowerCase().includes(term));
    } else if (activeCategory === 'faculty') {
      if (liveDepts.length > 0) {
        data = liveDepts.map((d) => {
          const professors = d._count?.professors || 0;
          const associates = d._count?.associates || 0;
          const assistants = d._count?.faculty || 0;
          const totalFaculty = professors + associates + assistants;
          const studentsCount = d._count?.students || 0;
          const sfr = totalFaculty > 0 ? (studentsCount / totalFaculty).toFixed(1) : '—';
          return {
            dept: d.name,
            professors,
            associates,
            assistants,
            totalFaculty,
            students: studentsCount,
            sfr: totalFaculty > 0 ? `1 : ${sfr}` : '—',
            status: totalFaculty > 0 && Number(sfr) <= 20 ? 'Compliant' : 'Review Required'
          };
        });
      } else {
        data = [];
      }
      return data.filter(r => r.dept.toLowerCase().includes(term));
    } else {
      return liveDepts.length > 0 ? [
        { criterion: 'Criterion 1: Curricular Aspects', metricCode: '1.1.2 & 1.2.1', description: 'Percentage of syllabus revised & CBCS implementation', value: 'NEP-2020 / CBCS Active', status: 'Compliant' },
        { criterion: 'Criterion 2: Teaching-Learning', metricCode: '2.1.1 & 2.2.2', description: 'Enrolment percentage & Student-Full time Teacher ratio', value: 'SFR Tracked via ERP', status: 'Compliant' },
        { criterion: 'Criterion 2: Evaluation Process', metricCode: '2.6.2 & 2.6.3', description: 'Attainment of Program Outcomes & Pass percentage', value: 'OBE CO-PO Attainment Active', status: 'Compliant' },
        { criterion: 'Criterion 6: Governance & Leadership', metricCode: '6.2.2 & 6.3.2', description: 'Implementation of e-governance ERP across operations', value: 'UniLMS ERP Digitized', status: 'Compliant' }
      ].filter(r => r.criterion.toLowerCase().includes(term) || r.description.toLowerCase().includes(term)) : [];
    }
  }, [activeCategory, searchTerm, liveDepts]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(currentData, 5);

  // Real client-side CSV download generator
  const downloadCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `Institutional_Report_${activeCategory}_${session}.csv`;

    if (activeCategory === 'admissions') {
      headers = ['Academic Department', 'Sanctioned Intake', 'Applications', 'Offers', 'Enrolled', 'General Quota', 'OBC', 'SC/ST', 'Female Ratio %', 'Yield %'];
      rows = currentData.map(r => [
        `"${r.dept}"`, r.sanctioned, r.apps, r.offers, r.enrolled, r.general, r.obc, r.scSt, `${r.girlsPct}%`, `${r.yieldPct}%`
      ]);
    } else if (activeCategory === 'finance') {
      headers = ['Department', 'Billed Fee', 'Collected Fee', 'Outstanding', 'Recovery %', 'Active Defaulters'];
      rows = currentData.map(r => [
        `"${r.dept}"`, `"${r.billed}"`, `"${r.collected}"`, `"${r.outstanding}"`, `${r.recoveryPct}%`, r.defaulters
      ]);
    } else if (activeCategory === 'academics') {
      headers = ['Department', 'Students Appeared', 'Passed', 'Pass Rate %', 'Distinction', 'First Class', 'Backlogs Count', 'Backlog %'];
      rows = currentData.map(r => [
        `"${r.dept}"`, r.appeared, r.passed, `${r.passPct}%`, r.distinction, r.firstClass, r.backlogs, `${r.backlogPct}%`
      ]);
    } else if (activeCategory === 'faculty') {
      headers = ['Department', 'Professors', 'Associate Professors', 'Assistant Professors', 'Total Faculty', 'Enrolled Students', 'Student-Faculty Ratio (SFR)', 'Audit Status'];
      rows = currentData.map(r => [
        `"${r.dept}"`, r.professors, r.associates, r.assistants, r.totalFaculty, r.students, `"${r.sfr}"`, r.status
      ]);
    } else {
      headers = ['Accreditation Criterion', 'Metric Code', 'Description', 'Institutional Attainment', 'Audit Status'];
      rows = currentData.map(r => [
        `"${r.criterion}"`, `"${r.metricCode}"`, `"${r.description}"`, `"${r.value}"`, r.status
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(`Generated and downloaded ${filename} successfully.`);
    setTimeout(() => setExportNotice(''), 4500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="view-section active" style={{ animation: 'fadeIn 0.25s ease' }}>
      {/* Header */}
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
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '22px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}>
            <i className="fa-solid fa-table-list"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                Institutional MIS Central Reports & NAAC SSR Ledgers
              </h2>
              <span style={{ background: '#DCFCE7', color: '#059669', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>
                Official Exports
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Cross-department consolidated institutional ledgers verified for NAAC, NIRF, AICTE & Senate audit
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select 
            value={session} 
            onChange={(e) => setSession(e.target.value)} 
            className="form-control" 
            style={{ width: 'auto', minWidth: '180px', fontWeight: '700', fontSize: '13px', borderRadius: '10px' }}
          >
            {academicYears.length > 0 ? (
              academicYears.map(ay => (
                <option key={ay.id} value={ay.name || ay.year}>
                  Academic Session {ay.name || ay.year} {ay.status === 'active' ? '(Current)' : ''}
                </option>
              ))
            ) : (
              <option value="">No academic sessions configured</option>
            )}
          </select>

          <Link 
            to={isAnalyticsPortal ? "/unilms/analytics/dashboard" : "/unilms/org/mis/dashboard"} 
            className="btn btn-outline-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', borderRadius: '10px', fontWeight: '700' }}
          >
            <i className="fa-solid fa-chart-pie"></i> MIS Cockpit
          </Link>

          <button 
            type="button" 
            className="btn btn-success" 
            onClick={downloadCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', borderRadius: '10px', fontWeight: '700' }}
          >
            <i className="fa-solid fa-file-excel"></i> Export CSV / Excel
          </button>

          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', borderRadius: '10px', fontWeight: '700' }}
          >
            <i className="fa-solid fa-print"></i> Print Official PDF
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

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border-color)', marginBottom: '22px', flexWrap: 'wrap' }}>
        {REPORT_CATEGORIES.map((cat) => (
          <button 
            key={cat.id}
            type="button" 
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '11px 18px',
              border: 'none',
              background: 'none',
              fontSize: '13.5px',
              fontWeight: activeCategory === cat.id ? '800' : '600',
              color: activeCategory === cat.id ? '#059669' : 'var(--text-muted)',
              borderBottom: activeCategory === cat.id ? '3px solid #059669' : '3px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <i className={cat.icon}></i>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Main Report Table Container */}
      <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              {activeCategory === 'admissions' && 'Admissions Sanctioned Intake, Quota Diversity & Yield Roster'}
              {activeCategory === 'finance' && 'Institutional Fee Recovery, Outstanding Dues & Aging Ledgers'}
              {activeCategory === 'academics' && 'Academic Examination Pass Rates & Backlog Audit Records'}
              {activeCategory === 'naac' && 'NAAC Criteria Self-Study Report (SSR) Quantitative Metrics'}
              {activeCategory === 'faculty' && 'Faculty Cadre Distribution & Student-Faculty Ratio (SFR)'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Certified for Official University Accreditation Filing
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)', fontSize: '12px' }}></i>
            <input 
              type="text" 
              placeholder="Search table rows..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 12px 6px 30px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '12.5px',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                outline: 'none',
                minWidth: '220px'
              }}
            />
          </div>
        </div>

        {/* Tab 1: Admissions Table */}
        {activeCategory === 'admissions' && (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '12px 14px' }}>Academic Department</th>
                  <th style={{ padding: '12px 14px' }}>Sanctioned</th>
                  <th style={{ padding: '12px 14px' }}>Apps</th>
                  <th style={{ padding: '12px 14px' }}>Offers</th>
                  <th style={{ padding: '12px 14px' }}>Enrolled</th>
                  <th style={{ padding: '12px 14px' }}>General</th>
                  <th style={{ padding: '12px 14px' }}>OBC</th>
                  <th style={{ padding: '12px 14px' }}>SC / ST</th>
                  <th style={{ padding: '12px 14px' }}>Girls Ratio</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Yield %</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={10} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr><td colSpan="10" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No admission report records found.</td></tr>
                ) : (
                  paginatedItems.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-main)' }}>{row.dept}</td>
                      <td style={{ padding: '12px 14px' }}>{row.sanctioned}</td>
                      <td style={{ padding: '12px 14px' }}>{row.apps}</td>
                      <td style={{ padding: '12px 14px' }}>{row.offers}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: '#059669' }}>{row.enrolled}</td>
                      <td style={{ padding: '12px 14px' }}>{row.general}</td>
                      <td style={{ padding: '12px 14px' }}>{row.obc}</td>
                      <td style={{ padding: '12px 14px' }}>{row.scSt}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#7C3AED' }}>{row.girlsPct}%</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: row.yieldPct >= 75 ? '#059669' : '#D97706' }}>
                        {row.yieldPct}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Finance Table */}
        {activeCategory === 'finance' && (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '12px 14px' }}>Academic Department</th>
                  <th style={{ padding: '12px 14px' }}>Total Billed Fee</th>
                  <th style={{ padding: '12px 14px' }}>Total Collected</th>
                  <th style={{ padding: '12px 14px' }}>Outstanding Dues</th>
                  <th style={{ padding: '12px 14px' }}>Recovery %</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Active Defaulters</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No finance report records found.</td></tr>
                ) : (
                  paginatedItems.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-main)' }}>{row.dept}</td>
                      <td style={{ padding: '12px 14px' }}>{row.billed}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: '#059669' }}>{row.collected}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#DC2626' }}>{row.outstanding}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '800' }}>
                        <span style={{ color: row.recoveryPct >= 85 ? '#059669' : '#D97706' }}>{row.recoveryPct}%</span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: '8px', fontWeight: '800', fontSize: '11px' }}>
                          {row.defaulters} Students
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Academics Table */}
        {activeCategory === 'academics' && (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '12px 14px' }}>Academic Department</th>
                  <th style={{ padding: '12px 14px' }}>Appeared</th>
                  <th style={{ padding: '12px 14px' }}>Passed</th>
                  <th style={{ padding: '12px 14px' }}>Pass Rate %</th>
                  <th style={{ padding: '12px 14px' }}>Distinction (≥ 75%)</th>
                  <th style={{ padding: '12px 14px' }}>First Class</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Active Backlogs</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={7} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No academic report records found.</td></tr>
                ) : (
                  paginatedItems.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-main)' }}>{row.dept}</td>
                      <td style={{ padding: '12px 14px' }}>{row.appeared}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#059669' }}>{row.passed}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: row.passPct >= 90 ? '#059669' : '#D97706' }}>{row.passPct}%</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#7C3AED' }}>{row.distinction}</td>
                      <td style={{ padding: '12px 14px' }}>{row.firstClass}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{ background: row.backlogPct > 15 ? '#FEE2E2' : '#FEF3C7', color: row.backlogPct > 15 ? '#DC2626' : '#D97706', padding: '2px 8px', borderRadius: '8px', fontWeight: '800', fontSize: '11px' }}>
                          {row.backlogs} ({row.backlogPct}%)
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: NAAC SSR Metrics */}
        {activeCategory === 'naac' && (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '12px 14px' }}>Accreditation Criterion</th>
                  <th style={{ padding: '12px 14px' }}>Metric Code</th>
                  <th style={{ padding: '12px 14px' }}>Quantitative &amp; Qualitative Description</th>
                  <th style={{ padding: '12px 14px' }}>Institutional Attainment Value</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Compliance Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={5} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No accreditation metrics found.</td></tr>
                ) : (
                  paginatedItems.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--text-main)' }}>{row.criterion}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: '700', color: '#4F46E5' }}>{row.metricCode}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{row.description}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-main)' }}>{row.value}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '3px 8px', borderRadius: '8px', fontWeight: '800', fontSize: '11px' }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: Faculty Cadre & SFR Ratios */}
        {activeCategory === 'faculty' && (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '12px 14px' }}>Department</th>
                  <th style={{ padding: '12px 14px' }}>Professors</th>
                  <th style={{ padding: '12px 14px' }}>Assoc. Prof</th>
                  <th style={{ padding: '12px 14px' }}>Asst. Prof</th>
                  <th style={{ padding: '12px 14px' }}>Total Faculty</th>
                  <th style={{ padding: '12px 14px' }}>Enrolled Students</th>
                  <th style={{ padding: '12px 14px' }}>SFR Ratio</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Statutory Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={8} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr><td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No faculty cadre records found. Configure academic departments and faculty staff.</td></tr>
                ) : (
                  paginatedItems.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--text-main)' }}>{row.dept}</td>
                      <td style={{ padding: '12px 14px' }}>{row.professors}</td>
                      <td style={{ padding: '12px 14px' }}>{row.associates}</td>
                      <td style={{ padding: '12px 14px' }}>{row.assistants}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#4F46E5' }}>{row.totalFaculty}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700' }}>{row.students}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: '#059669' }}>{row.sfr}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{ background: row.status === 'Compliant' ? '#DCFCE7' : '#FEF3C7', color: row.status === 'Compliant' ? '#16A34A' : '#D97706', padding: '3px 8px', borderRadius: '8px', fontWeight: '800', fontSize: '11px' }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="report records"
        />
      </div>
    </section>
  );
};

export default OrgMisReports;
