import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';
import facultyService from '../../../services/faculty.service';

const defaultCos = [
  { id: 'CO1', code: 'CO1', desc: 'Recall & understand foundational principles and terminology.' },
  { id: 'CO2', code: 'CO2', desc: 'Apply mathematical & programmatic techniques to solve engineering problems.' },
  { id: 'CO3', code: 'CO3', desc: 'Analyze structural complexity and optimize performance tradeoffs.' },
  { id: 'CO4', code: 'CO4', desc: 'Design and synthesize comprehensive modules adhering to constraints.' },
  { id: 'CO5', code: 'CO5', desc: 'Evaluate real-world implementations, security, and verification metrics.' }
];

const OrgMarksComponents = () => {
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [components, setComponents] = useState([]);
  const [newComponentName, setNewComponentName] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState('25');
  const [selectedCoIds, setSelectedCoIds] = useState(['CO1', 'CO2']);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Load Programs, Semesters, and Subjects from Backend
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [progsRes, semsRes, subsRes] = await Promise.allSettled([
          academicsService.getPrograms(),
          academicsService.getSemesters(),
          academicsService.getSubjects(),
        ]);
        const progList = progsRes.status === 'fulfilled' && Array.isArray(progsRes.value) ? progsRes.value : [];
        const semList = semsRes.status === 'fulfilled' && Array.isArray(semsRes.value) ? semsRes.value : [];
        const subList = subsRes.status === 'fulfilled' && Array.isArray(subsRes.value) ? subsRes.value : [];

        setPrograms(progList);
        setSemesters(semList);
        setSubjects(subList);

        if (progList.length > 0) setSelectedProgram(progList[0].id);
        if (semList.length > 0) setSelectedSemester(semList[0].id);
        if (subList.length > 0) setSelectedSubject(subList[0].id);
      } catch (err) {
        console.error('Failed to load programs/subjects:', err);
      }
    };
    fetchMasterData();
  }, []);

  const getDeletedAssessmentIds = () => {
    try {
      return JSON.parse(sessionStorage.getItem('unilms_deleted_assessments') || '[]');
    } catch {
      return [];
    }
  };

  // Load assessment components from backend when selectedSubject changes
  const loadAssessments = async (subId) => {
    if (!subId) return;
    setLoading(true);
    try {
      const res = await facultyService.getAssessments({ subjectId: subId });
      const list = res?.data || res || [];
      const deletedIds = getDeletedAssessmentIds();
      if (Array.isArray(list) && list.length > 0) {
        setComponents(
          list
            .filter((a) => !deletedIds.includes(a.id))
            .map((a) => ({
              id: a.id,
              subject_id: a.subjectId,
              name: a.name,
              max_marks: Number(a.maxMarks || 25),
              weightage: Number(a.weightage || 20),
              co_ids: ['CO1', 'CO2'],
            }))
        );
      } else {
        setComponents([]);
      }
    } catch (e) {
      console.warn('Failed to load assessments from backend:', e.message);
      setComponents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      loadAssessments(selectedSubject);
    }
  }, [selectedSubject]);

  const availableSubjects = subjects.filter(s => {
    if (!selectedProgram) return true;
    return s.departmentId === programs.find(p => p.id === selectedProgram)?.departmentId;
  });

  // Auto-sync selected subject when program changes
  useEffect(() => {
    if (availableSubjects.length > 0) {
      const exists = availableSubjects.some(s => s.id === selectedSubject);
      if (!exists) {
        setSelectedSubject(availableSubjects[0].id);
      }
    }
  }, [selectedProgram]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleToggleCo = (coId) => {
    setSelectedCoIds(prev => 
      prev.includes(coId) ? prev.filter(c => c !== coId) : [...prev, coId]
    );
  };

  const handleAddComponent = async (e) => {
    e.preventDefault();
    if (!newComponentName.trim() || !newMaxMarks || !selectedSubject) return;

    try {
      await facultyService.createAssessment({
        subjectId: selectedSubject,
        name: newComponentName.trim(),
        maxMarks: parseFloat(newMaxMarks),
        weightage: 20,
        cohortName: programs.find(p => p.id === selectedProgram)?.name || 'Degree Cohort',
      });

      showToast(`Component "${newComponentName.trim()}" saved to PostgreSQL!`);
      setNewComponentName('');
      setNewMaxMarks('25');
      await loadAssessments(selectedSubject);
    } catch (err) {
      alert('Error creating assessment: ' + err.message);
    }
  };

  const handleDeleteComponent = (id, name) => {
    if (window.confirm(`Are you sure you want to delete component "${name}"?`)) {
      try {
        const deletedIds = getDeletedAssessmentIds();
        sessionStorage.setItem('unilms_deleted_assessments', JSON.stringify([...deletedIds, id]));
      } catch {}
      setComponents(prev => prev.filter(c => c.id !== id));
      showToast(`Component "${name}" removed.`);
    }
  };

  // Filter components for current subject
  const currentSubjectComponents = components.filter(c => c.subject_id === selectedSubject);
  const currentSubjectObj = subjects.find(s => s.id === selectedSubject) || subjects[0];

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(currentSubjectComponents, 10);

  return (
    <section className="view-section active">
      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', animation: 'fadeIn 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
            <i className="fa-solid fa-circle-check"></i>
            {toastMsg}
          </div>
          <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* View Header */}
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
            <i className="fa-solid fa-list-check"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Mark Components &amp; Assessment Criteria
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Define internal exams, continuous evaluations, quizzes, and map them to Course Outcomes (COs)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link 
            to="/unilms/org/examinations/marks_entry" 
            className="btn btn-primary" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
              color: '#fff', 
              padding: '10px 18px', 
              borderRadius: '10px', 
              fontWeight: '700', 
              fontSize: '13px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-file-pen"></i>
            <span>Enter Student Marks</span>
          </Link>
          <Link 
            to="/unilms/org/marks/audit_trail" 
            className="btn btn-outline" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 18px', 
              borderRadius: '10px', 
              fontWeight: '700', 
              fontSize: '13px',
              textDecoration: 'none',
              border: '1px solid var(--border-color)',
              background: 'var(--card-bg, #fff)',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-clock-rotate-left" style={{ color: '#059669' }}></i>
            <span>Marks Audit Trail</span>
          </Link>
        </div>
      </div>

      {/* Selection Filter Card */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px', marginBottom: '24px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>
              Academic Program
            </label>
            <select 
              value={selectedProgram} 
              onChange={(e) => setSelectedProgram(e.target.value)} 
              className="form-control"
              style={{ height: '42px', borderRadius: '10px', border: '1px solid var(--border-color)' }}
            >
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
              {programs.length === 0 && <option value="">No programs found</option>}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>
              Academic Semester
            </label>
            <select 
              value={selectedSemester} 
              onChange={(e) => setSelectedSemester(e.target.value)} 
              className="form-control"
              style={{ height: '42px', borderRadius: '10px', border: '1px solid var(--border-color)' }}
            >
              {semesters.length === 0 ? (
                <option value="">No semesters found</option>
              ) : (
                semesters.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))
              )}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>
              Subject Course
            </label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)} 
              className="form-control"
              style={{ height: '42px', borderRadius: '10px', border: '1px solid var(--border-color)', fontWeight: '600' }}
            >
              {availableSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.code} — {sub.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Add Component Form & Defined Components Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Form: Add Component */}
        <div className="widget card" style={{ padding: '24px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '800', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-plus-circle"></i> Add Assessment Component
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: '1.5' }}>
            For: <strong>{currentSubjectObj?.code}</strong> — {currentSubjectObj?.name}
          </p>

          <form onSubmit={handleAddComponent}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                Component Name <span className="text-danger">*</span>
              </label>
              <input 
                type="text" 
                required
                value={newComponentName}
                onChange={(e) => setNewComponentName(e.target.value)}
                placeholder="e.g. Mid-Term 1, Practical Quiz"
                className="form-control"
                style={{ borderRadius: '8px', height: '40px' }}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {['Mid-Term 1', 'Internal 2', 'Lab Exam', 'Finals'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewComponentName(preset)}
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#475569' }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                Maximum Marks <span className="text-danger">*</span>
              </label>
              <input 
                type="number" 
                min="1"
                step="0.5"
                required
                value={newMaxMarks}
                onChange={(e) => setNewMaxMarks(e.target.value)}
                placeholder="25"
                className="form-control"
                style={{ borderRadius: '8px', height: '40px', fontWeight: '700' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Maps to Course Outcomes (COs)</span>
                <span style={{ fontSize: '11.5px', color: '#7c3aed', fontWeight: '600' }}>{selectedCoIds.length} Selected</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px', background: 'var(--bg-main, #f8fafc)', maxHeight: '200px', overflowY: 'auto' }}>
                {defaultCos.map(co => (
                  <label key={co.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12.5px', cursor: 'pointer', userSelect: 'none' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedCoIds.includes(co.id)}
                      onChange={() => handleToggleCo(co.id)}
                      style={{ marginTop: '2px', accentColor: '#7c3aed' }}
                    />
                    <div>
                      <strong style={{ color: '#7c3aed' }}>{co.code}:</strong> <span style={{ color: 'var(--text-secondary)' }}>{co.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                padding: '11px', 
                borderRadius: '10px', 
                fontWeight: '700', 
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', 
                border: 'none', 
                color: '#fff', 
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)', 
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-save"></i> Save Component
            </button>
          </form>
        </div>

        {/* Right Table: Defined Components */}
        <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main, #f8fafc)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
              Active Evaluation Components ({currentSubjectComponents.length})
            </h3>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Total Max Marks: <strong>{currentSubjectComponents.reduce((acc, c) => acc + (c.max_marks || 0), 0)} pts</strong>
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Component Name</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Max Marks</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mapped COs</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={4} rows={pageSize || 5} />
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map(comp => (
                    <tr key={comp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        <div style={{ fontSize: '14px' }}>{comp.name}</div>
                        <small style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>Subject: {currentSubjectObj?.code}</small>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontWeight: '800', color: '#4f46e5', background: 'rgba(79, 70, 229, 0.08)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>
                          {comp.max_marks} Marks
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {comp.co_ids && comp.co_ids.length > 0 ? (
                            comp.co_ids.map(co => (
                              <span 
                                key={co} 
                                className="badge" 
                                style={{ 
                                  background: 'rgba(124, 58, 237, 0.1)', 
                                  color: '#7c3aed', 
                                  fontWeight: '700', 
                                  padding: '3px 8px', 
                                  borderRadius: '5px', 
                                  fontSize: '11px',
                                  border: '1px solid rgba(124, 58, 237, 0.2)' 
                                }}
                              >
                                {co}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <Link 
                            to={`/unilms/org/marks/entry?subject_id=${comp.subject_id}&component_id=${comp.id}`} 
                            className="btn btn-outline" 
                            title="Enter Student Marks for this Component"
                            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', color: '#7c3aed', borderColor: 'rgba(124, 58, 237, 0.3)' }}
                          >
                            <i className="fa-solid fa-file-pen me-1"></i> Marks
                          </Link>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteComponent(comp.id, comp.name)}
                            className="btn btn-outline text-danger" 
                            title="Delete Component"
                            style={{ padding: '5px 9px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#dc2626' }}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-layer-group" style={{ fontSize: '32px', opacity: 0.3, marginBottom: '10px', display: 'block' }}></i>
                      No components defined yet for <strong>{currentSubjectObj?.name}</strong>.
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>Use the form on the left to add internal exams, continuous evaluations, or quizzes.</div>
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
            itemName="assessment components"
          />
        </div>

      </div>
    </section>
  );
};

export default OrgMarksComponents;
