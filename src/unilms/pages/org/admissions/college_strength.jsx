import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import admissionsService from '../../../services/admissions.service';

const OrgAdmissionsCollegeStrength = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await admissionsService.getCollegeStrength();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to load college strength:', e);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalIntake = programs.reduce((acc, p) => acc + (p.intake || 0), 0);
  const totalEnrolled = programs.reduce((acc, p) => acc + (p.enrolled || 0), 0);
  const totalMale = programs.reduce((acc, p) => acc + (p.male || 0), 0);
  const totalFemale = programs.reduce((acc, p) => acc + (p.female || 0), 0);
  const overallOccupancy = totalIntake > 0 ? Math.round((totalEnrolled / totalIntake) * 100) : 0;

  const filteredPrograms = programs.filter((p) => {
    return (
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.department || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedPrograms,
    totalItems
  } = useTablePagination(filteredPrograms, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedYear, setCurrentPage]);

  return (
    <div className="college-strength-container">
      <section className="view-section active">
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
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <i className="fa-solid fa-chart-pie"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                College Strength &amp; Enrollment Analytics
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Comprehensive seat sanctioning, program-wise occupancy &amp; student demographics
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-outline"
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg, #fff)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-print" style={{ color: '#059669' }}></i>
              <span>Print Report</span>
            </button>
            <Link
              to="/unilms/org/admissions/dashboard"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-graduation-cap"></i>
              <span>Admissions CRM</span>
            </Link>
          </div>
        </div>

        {/* Statistical Metric Cards - Modern Compact Reference Cards */}
        <div className="faculty-kpi-grid">
          {/* Card 1: Total Enrolled */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
              <i className="fa-solid fa-user-graduate"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Total Enrolled</div>
              <div className="faculty-metric-value" style={{ color: '#7C3AED' }}>{totalEnrolled.toLocaleString()}</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Out of {totalIntake.toLocaleString()} seats</span>
              </div>
            </div>
          </div>

          {/* Card 2: Seat Occupancy */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <i className="fa-solid fa-chart-pie"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Seat Occupancy</div>
              <div className="faculty-metric-value" style={{ color: '#059669' }}>{overallOccupancy}%</div>
              <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>Optimal ratio</span>
              </div>
            </div>
          </div>

          {/* Card 3: Gender Demographics */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' }}>
              <i className="fa-solid fa-venus-mars"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Gender Ratio</div>
              <div className="faculty-metric-value" style={{ color: '#1E293B', fontSize: '14.5px' }}>
                <span style={{ color: '#2563EB' }}>M: {totalMale}</span> &bull; <span style={{ color: '#EC4899' }}>F: {totalFemale}</span>
              </div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>{Math.round((totalMale / totalEnrolled) * 100)}% M &bull; {Math.round((totalFemale / totalEnrolled) * 100)}% F</span>
              </div>
            </div>
          </div>

          {/* Card 4: Active Programs */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Active Programs</div>
              <div className="faculty-metric-value" style={{ color: '#D97706' }}>{(programs || []).length}</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Engg, Mgmt &amp; Sciences</span>
              </div>
            </div>
          </div>
        </div>
        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 'min(100%, 200px)', maxWidth: '340px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
            <input
              type="text"
              placeholder="Search program code, title, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', borderRadius: '10px', fontSize: '13.5px', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
            {['ALL', 'Year 1', 'Year 2', 'Year 3', 'Year 4'].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  border: '1px solid',
                  borderColor: selectedYear === yr ? '#7C3AED' : '#E2E8F0',
                  background: selectedYear === yr ? '#7C3AED' : '#FFFFFF',
                  color: selectedYear === yr ? '#FFFFFF' : '#475569',
                  cursor: 'pointer'
                }}
              >
                {yr === 'ALL' ? 'All Years' : yr}
              </button>
            ))}
          </div>
        </div>

        {/* Strength Table */}
        <div className="table-container" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid var(--border-color)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Program Code</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Program &amp; Faculty</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sanctioned Intake</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enrolled Students</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Occupancy Rate</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gender Split</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedPrograms.length > 0 ? (
                paginatedPrograms.map((prog) => {
                  const occupancyPercent = Math.round((prog.enrolled / prog.intake) * 100);
                  return (
                    <tr key={prog.code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7C3AED', padding: '4px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '12.5px' }}>
                          {prog.code}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{prog.name}</strong>
                        <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>{prog.department}</div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontWeight: '600', color: '#475569' }}>
                        {prog.intake} Seats
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <strong style={{ color: '#1E293B', fontSize: '15px' }}>{prog.enrolled}</strong>
                        <span style={{ color: '#64748B', fontSize: '12px', marginLeft: '4px' }}>Students</span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', minWidth: '160px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, height: '8px', background: '#F1F5F9', borderRadius: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <div
                              style={{
                                width: `${Math.min(occupancyPercent, 100)}%`,
                                height: '100%',
                                background: occupancyPercent >= 90 ? '#10B981' : occupancyPercent >= 75 ? '#3B82F6' : '#F59E0B',
                                borderRadius: '4px'
                              }}
                            ></div>
                          </div>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#1E293B' }}>{occupancyPercent}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px' }}>
                        <span style={{ color: '#2563EB', fontWeight: '600' }}>♂ {prog.male}</span>
                        <span style={{ color: '#94A3B8', margin: '0 6px' }}>/</span>
                        <span style={{ color: '#EC4899', fontWeight: '600' }}>♀ {prog.female}</span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <span
                          style={{
                            background: occupancyPercent >= 90 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                            color: occupancyPercent >= 90 ? '#059669' : '#2563EB',
                            padding: '4px 10px',
                            borderRadius: '14px',
                            fontSize: '11.5px',
                            fontWeight: '700'
                          }}
                        >
                          {occupancyPercent >= 95 ? 'FULL BATCH' : occupancyPercent >= 90 ? 'HEALTHY' : 'ADMITTING'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No degree programs found matching "{search}".
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
            itemName="degree programs"
          />
        </div>
      </section>
    </div>
  );
};

export default OrgAdmissionsCollegeStrength;