import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import obeService from '../../../services/obe.service';
import academicsService from '../../../services/academics.service';

const OrgObeFacultyCoSetup = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [cos, setCos] = useState([]);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [bloomLevel, setBloomLevel] = useState('APPLY');
  const [targetPercent, setTargetPercent] = useState(70);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const subList = await academicsService.getSubjects();
        setSubjects(subList || []);
        if (subList && subList.length > 0) {
          setSelectedSubject(subList[0].id);
        }
      } catch (e) {
        console.error('Failed to load subjects:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const loadCos = async (subId) => {
    if (!subId) return;
    setLoading(true);
    try {
      const coList = await obeService.getCos(subId);
      setCos(coList || []);
    } catch (e) {
      console.error('Failed to load COs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      loadCos(selectedSubject);
    }
  }, [selectedSubject]);

  const handleAddCo = async (e) => {
    e.preventDefault();
    if (!code.trim() || !description.trim() || !selectedSubject) return;

    try {
      await obeService.createCo({
        subjectId: selectedSubject,
        code: code.trim().toUpperCase(),
        description: description.trim(),
        bloomLevel,
        targetPercent: Number(targetPercent),
      });

      setCode('');
      setDescription('');
      loadCos(selectedSubject);
    } catch (err) {
      alert('Failed to create Course Outcome: ' + err.message);
    }
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedCos,
    totalItems
  } = useTablePagination(cos, 10);

  return (
    <>
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
              background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(109, 40, 217, 0.3)'
            }}
          >
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Course Outcomes (CO) Setup
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Define measurable Bloom's Taxonomy learning outcomes for NBA/NAAC accreditation
            </p>
          </div>
        </div>
      </div>

      {/* Subject Filter Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Select Subject Course</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="form-control"
          style={{ maxWidth: '600px', height: '42px', fontSize: '14px' }}
        >
          <option value="">-- Choose Subject Course --</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
          ))}
        </select>
      </div>

      {/* Create CO Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px', background: '#fff', borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '800' }}>Add New Course Outcome (CO)</h3>
        <form onSubmit={handleAddCo} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>CO Code (e.g. CO1)</label>
            <input
              type="text"
              placeholder="CO1"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Bloom's Taxonomy Level</label>
            <select
              value={bloomLevel}
              onChange={(e) => setBloomLevel(e.target.value)}
              className="form-control"
            >
              <option value="REMEMBER">Remember (Level 1)</option>
              <option value="UNDERSTAND">Understand (Level 2)</option>
              <option value="APPLY">Apply (Level 3)</option>
              <option value="ANALYZE">Analyze (Level 4)</option>
              <option value="EVALUATE">Evaluate (Level 5)</option>
              <option value="CREATE">Create (Level 6)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Target Attainment (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={targetPercent}
              onChange={(e) => setTargetPercent(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Outcome Statement / Description</label>
            <textarea
              rows={2}
              placeholder="Describe student learning competency upon completing course module..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ gridColumn: '1 / -1', padding: '10px 18px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
          >
            Create Course Outcome
          </button>
        </form>
      </div>

      {/* CO Table Card */}
      <div className="card" style={{ padding: 0, borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', background: '#fff', overflow: 'hidden' }}>
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', margin: 0 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '14px 18px', fontSize: '12px', width: '120px' }}>CO Code</th>
                <th style={{ padding: '14px 18px', fontSize: '12px' }}>Outcome Statement</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', width: '160px' }}>Bloom's Level</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', width: '120px', textAlign: 'right' }}>Target</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={4} rows={5} />
              ) : paginatedCos.length > 0 ? (
                paginatedCos.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: '800', color: '#7C3AED' }}>{c.code}</td>
                    <td style={{ padding: '14px 18px', fontSize: '13.5px' }}>{c.description}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className="badge" style={{ background: '#EDE9FE', color: '#6D28D9', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                        {c.bloomLevel}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                      {c.targetPercent}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    No Course Outcomes defined for this subject yet. Add one above.
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
          itemName="course outcomes"
        />
      </div>
    </>
  );
};

export default OrgObeFacultyCoSetup;
