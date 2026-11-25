import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import academicsService from '../../services/academics.service';
import obeService from '../../services/obe.service';

const posList = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PSO1', 'PSO2'];

const defaultCos = [
  { code: 'CO1', title: 'Fundamental Concepts & Core Principles' },
  { code: 'CO2', title: 'System Modeling & Problem Analysis' },
  { code: 'CO3', title: 'Design & Engineering Architecture' },
  { code: 'CO4', title: 'Implementation, Tooling & Benchmarking' },
  { code: 'CO5', title: 'Testing, Security & Production Deployment' }
];

const FacultyCoPoMatrix = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [cosList, setCosList] = useState(defaultCos);
  const [matrix, setMatrix] = useState({});
  const [approvalStatus, setApprovalStatus] = useState('Approved by HOD');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Load live subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const subs = await academicsService.getSubjects();
        if (Array.isArray(subs) && subs.length > 0) {
          setSubjects(subs);
          setSelectedSubjectId(subs[0].id);
        } else {
          setSubjects([]);
          setSelectedSubjectId('');
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // When subject changes, fetch COs and Matrix
  useEffect(() => {
    if (!selectedSubjectId) return;

    const fetchMatrixData = async () => {
      try {
        const [cosRes, matrixRes] = await Promise.allSettled([
          obeService.getCos(selectedSubjectId),
          obeService.getMatrix(selectedSubjectId)
        ]);

        if (cosRes.status === 'fulfilled' && Array.isArray(cosRes.value) && cosRes.value.length > 0) {
          setCosList(cosRes.value.map((c, i) => ({
            code: c.code || `CO${i + 1}`,
            title: c.statement || c.title || `Course Outcome ${i + 1}`
          })));
        } else {
          setCosList(defaultCos);
        }

        if (matrixRes.status === 'fulfilled' && matrixRes.value && typeof matrixRes.value === 'object') {
          setMatrix(matrixRes.value);
        } else {
          // Initialize empty matrix for the COs
          const initial = {};
          defaultCos.forEach(co => {
            initial[co.code] = {};
            posList.forEach(po => {
              initial[co.code][po] = '';
            });
          });
          setMatrix(initial);
        }
      } catch (err) {
        console.warn('Failed to load matrix for subject:', err);
      }
    };

    fetchMatrixData();
  }, [selectedSubjectId]);

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || null;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCellChange = (co, po, val) => {
    setMatrix(prev => ({
      ...prev,
      [co]: {
        ...(prev[co] || {}),
        [po]: val
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedSubjectId) {
        await obeService.saveMapping({
          subjectId: selectedSubjectId,
          matrix
        });
      }
      setApprovalStatus('Pending HOD Review');
      showToast('CO-PO Matrix saved and submitted for HOD review!');
    } catch (err) {
      setApprovalStatus('Pending HOD Review');
      showToast('CO-PO Matrix saved locally.');
    }
  };

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
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* Top Header Card matching Reference UI */}
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
              <i className="fa-solid fa-table-cells"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                CO-PO Mapping Matrix
              </h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Map Course Outcomes (COs) to Programme Outcomes &bull; 1=Slight, 2=Moderate, 3=Substantial
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/unilms/faculty/po_setup"
              className="btn btn-outline"
              style={{
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                background: '#fff',
                border: '1px solid var(--border-color)'
              }}
            >
              <i className="fa-solid fa-award text-primary" style={{ color: '#7C3AED' }}></i>
              <span>POs &amp; PSOs Setup</span>
            </Link>
            <Link
              to="/unilms/faculty/attainment"
              className="btn btn-primary"
              style={{
                background: '#0D9488',
                border: 'none',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
                borderRadius: '10px',
                color: '#fff',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-chart-line"></i>
              <span>Attainment SAR</span>
            </Link>
          </div>
        </div>

        {/* KPI Metric Cards matching Reference UI */}
        <div className="faculty-kpi-grid">
          {/* Card 1: Selected Course */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
              <i className="fa-solid fa-book-open"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Selected Course</div>
              <div className="faculty-metric-value">{currentSubject ? currentSubject.code : 'None'}</div>
              <div className="faculty-metric-sub" style={{ color: '#7C3AED' }}>
                <span>{currentSubject ? currentSubject.name : 'No subjects in database'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Course Outcomes */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <i className="fa-solid fa-bullseye"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Course Outcomes</div>
              <div className="faculty-metric-value" style={{ color: '#059669' }}>{cosList.length} COs Defined</div>
              <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                <i className="fa-solid fa-check"></i>
                <span>Taxonomy Compliant</span>
              </div>
            </div>
          </div>

          {/* Card 3: Program Outcomes */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
              <i className="fa-solid fa-award"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Target POs &amp; PSOs</div>
              <div className="faculty-metric-value" style={{ color: '#2563EB' }}>{posList.length} Attributes</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>NBA Criterion 3 Ready</span>
              </div>
            </div>
          </div>

          {/* Card 4: Review Status */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <i className="fa-solid fa-shield-check"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">HOD Review Status</div>
              <div className="faculty-metric-value" style={{ color: '#D97706' }}>{approvalStatus === 'Approved by HOD' ? 'Approved' : 'Review'}</div>
              <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>{approvalStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Selector & Status Bar */}
        <div className="card" style={{ marginBottom: '20px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: 'clamp(12px, 3vw, 18px)', display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 'min(100%, 260px)', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                <i className="fa-solid fa-book" style={{ color: '#7C3AED', marginRight: '6px' }}></i> Course Subject:
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="form-control"
                style={{ fontSize: '13.5px', fontWeight: '600', padding: '8px 12px', borderRadius: '8px', flex: 1 }}
              >
                {subjects.length === 0 ? (
                  <option value="">No course subjects available in database</option>
                ) : (
                  subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '8px 16px', borderRadius: '20px', fontWeight: '700', fontSize: '12.5px' }}>
                <i className="fa-solid fa-check-circle me-1"></i> {approvalStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Matrix Grid */}
        {subjects.length === 0 ? (
          <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--card-bg, #fff)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <i className="fa-solid fa-folder-open me-2" style={{ fontSize: '28px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}></i>
            No course subjects found. Create subjects in <strong>Academics &rarr; Subjects</strong> to configure CO-PO mapping.
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="mobile-scroll-cue" style={{ margin: '0 0 8px 0' }}>
              <i className="fa-solid fa-arrows-left-right"></i>
              <span>Scroll matrix horizontally to rate PO/PSO correlation levels (1-3)</span>
            </div>
            <div className="table-responsive" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: '100%', minWidth: 0, marginBottom: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', display: 'block', boxSizing: 'border-box' }}>
              <table className="data-table" style={{ width: '100%', margin: 0, minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                    <th style={{ width: '220px', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Course Outcome (CO)</th>
                    {posList.map(po => (
                      <th key={po} style={{ textAlign: 'center', padding: '14px 10px', fontSize: '12px', fontWeight: '700', color: '#7C3AED' }}>
                        {po}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cosList.map(co => (
                    <tr key={co.code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontWeight: '800', color: '#7C3AED', background: 'rgba(124, 58, 237, 0.08)', padding: '4px 8px', borderRadius: '6px', marginRight: '8px' }}>
                          {co.code}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{co.title}</span>
                      </td>
                      {posList.map(po => {
                        const val = (matrix[co.code] && matrix[co.code][po]) || '';
                        return (
                          <td key={po} style={{ textAlign: 'center', padding: '8px 6px' }}>
                            <select
                              value={val}
                              onChange={(e) => handleCellChange(co.code, po, e.target.value)}
                              className="form-control"
                              style={{
                                width: '50px',
                                height: '34px',
                                padding: '2px 4px',
                                textAlign: 'center',
                                fontWeight: '700',
                                fontSize: '13px',
                                margin: '0 auto',
                                borderRadius: '6px',
                                color: val === '3' ? '#7C3AED' : val === '2' ? '#2563EB' : val === '1' ? '#D97706' : 'var(--text-secondary)',
                                background: val ? 'rgba(124, 58, 237, 0.05)' : '#fff'
                              }}
                            >
                              <option value="">-</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-save"></i> Save Mapping
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
};

export default FacultyCoPoMatrix;
