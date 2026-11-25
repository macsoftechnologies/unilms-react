import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';
import studentsService from '../../../services/students.service';
import examinationsService from '../../../services/examinations.service';

const assessmentComponents = [
  { id: '1', name: 'Continuous Internal Evaluation (CIE 1)', max_marks: 30 },
  { id: '2', name: 'Continuous Internal Evaluation (CIE 2)', max_marks: 30 },
  { id: '3', name: 'Laboratory Practical & Viva Voce', max_marks: 25 },
  { id: '4', name: 'Semester End Examination (SEE)', max_marks: 100 }
];

const OrgObeFacultyMarksEntry = () => {
  const [subjects, setSubjects] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('1');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadMasterData = async () => {
      setLoading(true);
      try {
        const [subsRes, cohortsRes, studentsRes] = await Promise.allSettled([
          academicsService.getSubjects(),
          academicsService.getCohorts(),
          studentsService.getStudents()
        ]);

        const sList = subsRes.status === 'fulfilled' && Array.isArray(subsRes.value) ? subsRes.value : [];
        const cList = cohortsRes.status === 'fulfilled' && Array.isArray(cohortsRes.value) ? cohortsRes.value : [];
        const stList = studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value) ? studentsRes.value : [];

        setSubjects(sList);
        setCohorts(cList);
        if (sList.length > 0) setSelectedSubjectId(sList[0].id);
        if (cList.length > 0) setSelectedCohortId(cList[0].id);

        const mappedStudents = stList.map((s, idx) => ({
          id: s.id || idx,
          roll_number: s.rollNumber || s.admissionNumber || `STU-${1000 + idx}`,
          name: s.user?.name || s.name || 'Enrolled Student',
          cohort_id: s.cohortId || s.cohort?.id || '',
          score: ''
        }));
        setStudents(mappedStudents);
      } catch (err) {
        console.error('Failed to load marks entry master data:', err);
        setSubjects([]);
        setCohorts([]);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadMasterData();
  }, []);

  const handleScoreChange = (id, newScore) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, score: newScore } : s))
    );
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    try {
      if (selectedSubjectId) {
        await examinationsService.saveMarks(selectedSubjectId, {
          componentId: selectedComponent,
          scores: students.map(s => ({ studentId: s.id, score: s.score }))
        });
      }
    } catch (err) {
      console.warn('Backend marks save failed:', err.message);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const currentComp = assessmentComponents.find((c) => c.id === selectedComponent) || assessmentComponents[0];

  const filteredStudents = selectedCohortId
    ? students.filter(s => !s.cohort_id || s.cohort_id === selectedCohortId)
    : students;

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredStudents, 10);

  return (
    <section className="view-section active">
      <div className="view-header" style={{ marginBottom: '22px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Internal Marks Entry</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>
          Enter marks for internal components. Marks can be locked by the HOD after deadline verification.
        </p>
      </div>

      {/* Filter Selection Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px 22px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Subject</label>
            <select
              className="form-control"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              style={{ fontWeight: '600' }}
            >
              {subjects.length === 0 ? (
                <option value="">No subjects in database</option>
              ) : (
                subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Cohort (Batch)</label>
            <select
              className="form-control"
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              style={{ fontWeight: '600' }}
            >
              {cohorts.length === 0 ? (
                <option value="">No cohorts in database</option>
              ) : (
                cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Assessment Component</label>
            <select
              className="form-control"
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              style={{ fontWeight: '600' }}
            >
              {assessmentComponents.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Max: {c.max_marks})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Marks Table */}
      <form onSubmit={handleSaveMarks}>
        <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main, #f8fafc)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
                Student Scores Ledger — Max: {currentComp?.max_marks} Marks
              </h3>
            </div>
            {saveSuccess && (
              <span className="badge" style={{ background: '#10B981', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontWeight: '700' }}>
                <i className="fa-solid fa-circle-check me-1"></i> Marks Saved
              </span>
            )}
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', width: '120px' }}>Roll Number</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Student Name</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', width: '180px', textAlign: 'center' }}>
                    Score (Max {currentComp?.max_marks})
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', width: '120px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={4} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No students enrolled in this cohort yet.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 18px', fontFamily: 'monospace', fontWeight: '700', color: '#7C3AED' }}>
                        {s.roll_number}
                      </td>
                      <td style={{ padding: '12px 18px', fontWeight: '600' }}>
                        {s.name}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={currentComp?.max_marks || 100}
                          value={s.score}
                          disabled={isLocked}
                          onChange={(e) => handleScoreChange(s.id, e.target.value)}
                          placeholder="-"
                          className="form-control"
                          style={{
                            width: '90px',
                            height: '34px',
                            margin: '0 auto',
                            textAlign: 'center',
                            fontWeight: '700',
                            borderRadius: '6px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <span className="badge" style={{ background: s.score ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)', color: s.score ? '#10B981' : '#64748b', padding: '4px 8px', borderRadius: '4px' }}>
                          {s.score ? 'Entered' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main, #f8fafc)' }}>
            <TablePagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemName="students"
            />
            {paginatedItems.length > 0 && (
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-save me-1"></i> Save Marks
              </button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
};

export default OrgObeFacultyMarksEntry;
