import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';

const standardPOs = [
  { po_code: 'PO1', description: 'Engineering Knowledge: Apply mathematics, science, engineering fundamentals to solve complex problems.', direct: 2.65, indirect: 2.50 },
  { po_code: 'PO2', description: 'Problem Analysis: Identify, formulate, and analyze complex engineering problems using first principles.', direct: 2.55, indirect: 2.45 },
  { po_code: 'PO3', description: 'Design/Development of Solutions: Design systems, components, or processes that meet specified needs.', direct: 2.48, indirect: 2.60 },
  { po_code: 'PO4', description: 'Conduct Investigations: Use research-based methods including design of experiments and data analysis.', direct: 2.40, indirect: 2.35 },
  { po_code: 'PO5', description: 'Modern Tool Usage: Create, select, and apply modern engineering and IT tools with an understanding of limitations.', direct: 2.75, indirect: 2.80 },
  { po_code: 'PO6', description: 'The Engineer and Society: Apply reasoning informed by contextual knowledge to assess societal & safety issues.', direct: 2.30, indirect: 2.40 },
  { po_code: 'PO7', description: 'Environment and Sustainability: Understand the impact of professional solutions in societal and environmental contexts.', direct: 2.35, indirect: 2.50 },
  { po_code: 'PO8', description: 'Ethics: Apply ethical principles and commit to professional ethics and responsibilities.', direct: 2.85, indirect: 2.90 },
  { po_code: 'PO9', description: 'Individual and Team Work: Function effectively as an individual, and as a member or leader in diverse teams.', direct: 2.70, indirect: 2.75 },
  { po_code: 'PO10', description: 'Communication: Communicate effectively on complex engineering activities with the community and society.', direct: 2.60, indirect: 2.65 },
  { po_code: 'PO11', description: 'Project Management and Finance: Demonstrate knowledge of management principles and apply to manage projects.', direct: 2.45, indirect: 2.50 },
  { po_code: 'PO12', description: 'Life-long Learning: Recognize the need for and have the preparation to engage in independent learning.', direct: 2.68, indirect: 2.72 }
];

const OrgObePoReport = () => {
  const [selectedProgram, setSelectedProgram] = useState('B.Tech in Computer Science & Engineering');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [selectedProgram]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const calculatedPOs = useMemo(() => {
    return standardPOs.map(po => {
      const total = (po.direct * 0.8 + po.indirect * 0.2).toFixed(2);
      return {
        ...po,
        total_attainment: parseFloat(total)
      };
    });
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(calculatedPOs, 6);

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
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Program Outcome (PO) Attainment Ledger
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              NAAC / NBA Criteria 2.6.2 compliant aggregate PO calculation report &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => showToast('Exporting PO Attainment Compliance report to PDF / Excel...')}
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#fff', border: 'none', padding: '10px 18px', fontWeight: '700', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-file-export"></i>
            <span>Export Report</span>
          </button>
          <Link to="/unilms/org/academics/dashboard" className="btn btn-outline" style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            <i className="fa-solid fa-arrow-left" style={{ color: '#7C3AED' }}></i>
            <span>Academics Hub</span>
          </Link>
        </div>
      </div>

      {/* Program Selector */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '480px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Select Degree Program</label>
          <select 
            value={selectedProgram} 
            onChange={(e) => setSelectedProgram(e.target.value)} 
            className="form-control"
            style={{ width: '100%', height: '40px', borderRadius: '8px' }}
          >
            <option value="B.Tech in Computer Science & Engineering">B.Tech in Computer Science &amp; Engineering</option>
            <option value="B.Tech Electronics & Communication">B.Tech Electronics &amp; Communication</option>
            <option value="Master of Business Administration">Master of Business Administration</option>
            <option value="B.Tech Mechanical Engineering">B.Tech Mechanical Engineering</option>
          </select>
        </div>
      </div>

      {/* PO Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main, #f8fafc)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>PO Attainment Scorecard (Scale of 3.00)</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Formula: Total = (80% Direct Attainment) + (20% Indirect Attainment)</span>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ width: '100px', padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>PO Code</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Outcome Description</th>
                <th style={{ width: '130px', textAlign: 'center', padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Direct (0.8)</th>
                <th style={{ width: '130px', textAlign: 'center', padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Indirect (0.2)</th>
                <th style={{ width: '150px', textAlign: 'right', padding: '14px 22px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Total Attainment</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={5} rows={pageSize || 5} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No Program Outcomes found for this program.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((po) => {
                  const pct = ((po.total_attainment / 3.0) * 100).toFixed(0);
                  const isHigh = po.total_attainment >= 2.5;
                  return (
                    <tr key={po.po_code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontWeight: '800', color: '#7C3AED', background: 'rgba(124, 58, 237, 0.08)', padding: '4px 10px', borderRadius: '6px' }}>
                          {po.po_code}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                        {po.description}
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 18px', fontWeight: '600', color: '#4F46E5' }}>
                        {po.direct.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 18px', fontWeight: '600', color: '#059669' }}>
                        {po.indirect.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '14px 22px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '800', fontSize: '15px', color: isHigh ? '#059669' : '#D97706' }}>
                            {po.total_attainment.toFixed(2)}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 3.0</span>
                        </div>
                        <div style={{ width: '80px', height: '5px', background: 'var(--bg-main, #f1f5f9)', borderRadius: '3px', overflow: 'hidden', marginLeft: 'auto', marginTop: '4px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: isHigh ? '#10B981' : '#F59E0B', borderRadius: '3px' }}></div>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
          itemName="program outcomes"
        />
      </div>
    </>
  );
};

export default OrgObePoReport;
