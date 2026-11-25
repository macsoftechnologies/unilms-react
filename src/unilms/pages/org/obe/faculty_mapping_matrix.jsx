import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import obeService from '../../../services/obe.service';
import academicsService from '../../../services/academics.service';

const OrgObeFacultyMappingMatrix = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [matrixData, setMatrixData] = useState({ subject: null, cos: [], pos: [], mappings: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const loadMatrix = async (subId) => {
    if (!subId) return;
    setLoading(true);
    try {
      const data = await obeService.getMatrix(subId);
      setMatrixData(data || { subject: null, cos: [], pos: [], mappings: {} });
    } catch (e) {
      console.error('Failed to load matrix:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      loadMatrix(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCellChange = (coId, poId, val) => {
    const key = `${coId}_${poId}`;
    setMatrixData(prev => ({
      ...prev,
      mappings: {
        ...prev.mappings,
        [key]: val === '' ? 0 : Number(val)
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    setSaving(true);
    try {
      const mappingsArray = [];
      const { cos, pos, mappings } = matrixData;
      (cos || []).forEach(co => {
        (pos || []).forEach(po => {
          const val = mappings[`${co.id}_${po.id}`];
          if (val && val > 0) {
            mappingsArray.push({
              coId: co.id,
              poId: po.id,
              correlation: Number(val),
            });
          }
        });
      });

      await obeService.saveMapping({
        subjectId: selectedSubjectId,
        mappings: mappingsArray,
      });

      showToast('NBA CO-PO Articulation Matrix saved successfully!');
      loadMatrix(selectedSubjectId);
    } catch (err) {
      alert('Failed to save CO-PO matrix: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const { cos = [], pos = [], mappings = {} } = matrixData;

  return (
    <>
      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
            <i className="fa-solid fa-circle-check"></i>
            {toastMsg}
          </div>
          <button onClick={() => setToastMsg(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
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
              background: 'linear-gradient(135deg, #EC4899, #DB2777)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(219, 39, 119, 0.3)'
            }}
          >
            <i className="fa-solid fa-table-cells"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              CO-PO Articulation Matrix
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Correlation mapping between Course Outcomes &amp; Program Outcomes (1=Slight, 2=Moderate, 3=Substantial) &bull; NBA Tier 1/2
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/unilms/org/obe/faculty_co_setup"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)' }}
          >
            <i className="fa-solid fa-graduation-cap" style={{ color: '#DB2777' }}></i>
            <span>Course Outcomes (CO)</span>
          </Link>
        </div>
      </div>

      {/* Subject Filter Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Select Subject Course</label>
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="form-control"
          style={{ maxWidth: '600px', height: '42px', fontSize: '14px' }}
        >
          <option value="">-- Choose Subject Course --</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
          ))}
        </select>
      </div>

      {/* Matrix Card */}
      <div className="card" style={{ padding: 0, borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', background: '#fff', overflow: 'hidden' }}>
        <form onSubmit={handleSave}>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0, textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', textAlign: 'left', minWidth: '220px' }}>Course Outcome (CO)</th>
                  {pos.map(po => (
                    <th key={po.id} style={{ padding: '14px 10px', fontSize: '12px', width: '70px' }} title={po.description}>
                      {po.code}
                    </th>
                  ))}
                  <th style={{ padding: '14px 18px', fontSize: '12px', width: '90px' }}>Avg</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={pos.length + 2} style={{ padding: '40px', color: '#64748B' }}>Loading matrix...</td></tr>
                ) : cos.length > 0 && pos.length > 0 ? (
                  cos.map(co => {
                    let sum = 0;
                    let count = 0;
                    pos.forEach(po => {
                      const val = mappings[`${co.id}_${po.id}`] || 0;
                      if (val > 0) {
                        sum += Number(val);
                        count++;
                      }
                    });
                    const avg = count > 0 ? (sum / count).toFixed(2) : '—';

                    return (
                      <tr key={co.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px', textAlign: 'left' }}>
                          <strong style={{ color: '#7C3AED', display: 'block' }}>{co.code}</strong>
                          <small style={{ color: '#64748B' }}>{co.description}</small>
                        </td>
                        {pos.map(po => {
                          const cellVal = mappings[`${co.id}_${po.id}`] || '';
                          return (
                            <td key={po.id} style={{ padding: '8px' }}>
                              <select
                                value={cellVal}
                                onChange={(e) => handleCellChange(co.id, po.id, e.target.value)}
                                className="form-control"
                                style={{ width: '56px', height: '34px', padding: '2px', textAlign: 'center', fontWeight: '700' }}
                              >
                                <option value="">—</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                              </select>
                            </td>
                          );
                        })}
                        <td style={{ padding: '14px 18px', fontWeight: '800', color: '#059669' }}>{avg}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={Math.max(pos.length + 2, 3)} style={{ padding: '40px', color: '#64748B' }}>
                      {cos.length === 0 ? 'No Course Outcomes defined for this subject. Create COs first.' : 'No Program Outcomes defined. Configure POs in Admin Settings.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            {cos.length > 0 && pos.length > 0 && (
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '10px 24px', background: '#DB2777', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                {saving ? 'Saving...' : 'Save CO-PO Matrix'}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default OrgObeFacultyMappingMatrix;
