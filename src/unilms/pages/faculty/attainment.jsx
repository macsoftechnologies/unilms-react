import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import obeService from '../../services/obe.service';
import academicsService from '../../services/academics.service';

const FacultyAttainment = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [reportData, setReportData] = useState({ attainments: [], poAttainments: {} });
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const subList = await academicsService.getSubjects();
        setSubjects(subList || []);
        if (subList && subList.length > 0) {
          setSelectedSubjectId(subList[0].id);
        }
      } catch (e) {
        console.error('Failed to load subjects:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const loadReport = async (subId, year) => {
    if (!subId) return;
    setLoading(true);
    try {
      const data = await obeService.getAttainmentReport(subId, year);
      setReportData(data || { attainments: [], poAttainments: {} });
    } catch (e) {
      console.error('Failed to load attainment report:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      loadReport(selectedSubjectId, academicYear);
    }
  }, [selectedSubjectId, academicYear]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleExport = () => {
    showToast('Exporting official NAAC / NBA Self Assessment Report (SAR)...');
    window.print();
  };

  const coAttainments = reportData.attainments || [];
  const poAttainmentsList = Object.entries(reportData.poAttainments || {}).map(([code, score]) => ({
    po_code: code,
    score: Number(score).toFixed(2),
    status: Number(score) >= 2.0 ? 'Target Met' : 'Need Improvement',
  }));

  const {
    currentPage: coPage,
    setCurrentPage: setCoPage,
    pageSize: coSize,
    setPageSize: setCoSize,
    paginatedItems: paginatedCos,
    totalItems: totalCos
  } = useTablePagination(coAttainments, 10);

  const {
    currentPage: poPage,
    setCurrentPage: setPoPage,
    pageSize: poSize,
    setPageSize: setPoSize,
    paginatedItems: paginatedPos,
    totalItems: totalPos
  } = useTablePagination(poAttainmentsList, 10);

  return (
    <>
      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
              &times;
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '22px 26px',
            marginBottom: '22px',
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
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
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
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                CO-PO Attainment Analysis Report
              </h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Course Outcome attainment levels based on examination results &bull; NBA Criteria 3 SAR Compliance
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExport}
              className="btn btn-primary"
              style={{ padding: '10px 18px', fontSize: '13px', fontWeight: '700', borderRadius: '10px', background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-file-export me-1"></i> Export SAR PDF
            </button>
          </div>
        </div>

        {/* Filter Controls Card */}
        <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Select Subject Course</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="form-control"
              style={{ height: '40px' }}
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="form-control"
              style={{ height: '40px' }}
            />
          </div>
        </div>

        {/* CO Attainment Table */}
        <div className="card" style={{ padding: 0, borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', background: '#fff', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Direct Course Outcome (CO) Attainment</h3>
          </div>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', width: '100px' }}>CO Code</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px' }}>Outcome Statement</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', width: '120px', textAlign: 'right' }}>Target (%)</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', width: '120px', textAlign: 'right' }}>Attained (%)</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', width: '120px', textAlign: 'center' }}>NBA Level</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={5} rows={5} />
                ) : paginatedCos.length > 0 ? (
                  paginatedCos.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '800', color: '#7C3AED' }}>{c.coCode}</td>
                      <td style={{ padding: '14px 18px' }}>{c.description}</td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: '700' }}>{c.targetPercent}%</td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: '800', color: Number(c.attainedPercent) >= Number(c.targetPercent) ? '#059669' : '#DC2626' }}>
                        {Number(c.attainedPercent).toFixed(1)}%
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span className="badge" style={{ background: '#EDE9FE', color: '#6D28D9', padding: '4px 10px', borderRadius: '4px', fontWeight: '800' }}>
                          Level {c.level}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No CO attainment records computed yet for this course. Define COs and enter marks first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={coPage}
            totalItems={totalCos}
            pageSize={coSize}
            onPageChange={setCoPage}
            onPageSizeChange={setCoSize}
            itemName="course outcomes"
          />
        </div>

        {/* PO Attainment Table */}
        <div className="card" style={{ padding: 0, borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', background: '#fff', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Weighted Program Outcome (PO) Attainment Matrix</h3>
          </div>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', width: '140px' }}>PO Code</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', width: '160px', textAlign: 'right' }}>Attained Score (Max 3.0)</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', width: '160px', textAlign: 'center' }}>SAR Target Compliance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={3} rows={5} />
                ) : paginatedPos.length > 0 ? (
                  paginatedPos.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '800', color: '#2563EB' }}>{p.po_code}</td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: '800', color: '#059669', fontSize: '15px' }}>{p.score}</td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span className="badge" style={{
                          background: p.status === 'Target Met' ? '#D1FAE5' : '#FEF3C7',
                          color: p.status === 'Target Met' ? '#065F46' : '#92400E',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No PO attainment data available. Complete CO-PO matrix mapping first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={poPage}
            totalItems={totalPos}
            pageSize={poSize}
            onPageChange={setPoPage}
            onPageSizeChange={setPoSize}
            itemName="program outcomes"
          />
        </div>
      </section>
    </>
  );
};

export default FacultyAttainment;
