import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { facultyService } from '../../services/faculty.service';
import { academicsService } from '../../services/academics.service';
import { studentsService } from '../../services/students.service';

const FacultyMarks = () => {
  const [searchParams] = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject_id') || '');
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(searchParams.get('assessment_id') || '');
  const [students, setStudents] = useState([]);
  const [studentScores, setStudentScores] = useState({});

  const [isLocked, setIsLocked] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAssessForm, setNewAssessForm] = useState({
    name: 'Internal Assessment 1',
    examType: 'Internal Assessment',
    maxMarks: 25,
    weightage: 20,
    cohortName: 'General Cohort',
  });

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [subRes, stRes] = await Promise.allSettled([
        academicsService.getSubjects(),
        studentsService.getStudents(),
      ]);

      if (subRes.status === 'fulfilled' && Array.isArray(subRes.value)) {
        setSubjects(subRes.value);
        if (subRes.value.length > 0 && !selectedSubject) {
          setSelectedSubject(subRes.value[0].id);
        }
      }

      if (stRes.status === 'fulfilled' && Array.isArray(stRes.value)) {
        setStudents(
          stRes.value.map((st) => ({
            id: st.id,
            roll_number: st.rollNumber,
            name: `${st.firstName} ${st.lastName || ''}`.trim(),
          }))
        );
      }
    } catch (err) {
      console.error('Error loading marks metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadAssessments = async (subjId) => {
    if (!subjId) return;
    try {
      const data = await facultyService.getAssessments({ subjectId: subjId });
      if (Array.isArray(data)) {
        setAssessments(data);
        if (data.length > 0) {
          setSelectedAssessmentId(data[0].id);
        } else {
          setSelectedAssessmentId('');
          setStudentScores({});
        }
      }
    } catch (err) {
      console.error('Error loading assessments:', err);
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      loadAssessments(selectedSubject);
    }
  }, [selectedSubject]);

  const loadAssessmentMarks = async (assessId) => {
    if (!assessId) return;
    setLoading(true);
    try {
      const details = await facultyService.getAssessmentMarks(assessId);
      if (details && details.marks) {
        const scoresMap = {};
        details.marks.forEach((m) => {
          scoresMap[m.studentId] = Number(m.score);
        });
        setStudentScores(scoresMap);
      }
    } catch (err) {
      console.error('Error loading marks roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAssessmentId) {
      loadAssessmentMarks(selectedAssessmentId);
    }
  }, [selectedAssessmentId]);

  const activeAssessment = assessments.find((a) => a.id === selectedAssessmentId);
  const maxMarks = activeAssessment ? Number(activeAssessment.maxMarks) : 25;

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedStudents,
    totalItems,
  } = useTablePagination(students, 10);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleScoreChange = (id, val) => {
    if (isLocked) return;
    const num = parseFloat(val);
    if (val !== '' && num > maxMarks) {
      alert(`Score cannot exceed maximum marks (${maxMarks}).`);
      return;
    }
    setStudentScores((prev) => ({
      ...prev,
      [id]: val === '' ? '' : num,
    }));
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!selectedAssessmentId) {
      alert('Please select or create an assessment first.');
      return;
    }

    try {
      const marksPayload = Object.entries(studentScores).map(([stId, score]) => ({
        studentId: stId,
        score: Number(score) || 0,
      }));

      await facultyService.saveAssessmentMarks(selectedAssessmentId, marksPayload);
      showToast('Continuous evaluation marks recorded successfully!');
    } catch (err) {
      alert(err.message || 'Failed to save marks.');
    }
  };

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    if (!selectedSubject) {
      alert('Please select a subject first.');
      return;
    }

    try {
      const created = await facultyService.createAssessment({
        subjectId: selectedSubject,
        name: newAssessForm.name,
        examType: newAssessForm.examType,
        maxMarks: Number(newAssessForm.maxMarks),
        weightage: Number(newAssessForm.weightage),
        cohortName: newAssessForm.cohortName,
      });

      setIsCreateModalOpen(false);
      showToast(`Created assessment "${created.name}" successfully!`);
      loadAssessments(selectedSubject);
    } catch (err) {
      alert(err.message || 'Failed to create assessment.');
    }
  };

  return (
    <section className="view-section active">
      {toastMsg && (
        <div
          style={{
            background: '#10B981',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
            <i className="fa-solid fa-circle-check"></i>
            {toastMsg}
          </div>
          <button
            onClick={() => setToastMsg(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
          >
            <i className="fa-solid fa-xmark"></i>
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
          gap: '16px',
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
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
            }}
          >
            <i className="fa-solid fa-award"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Continuous Evaluation &amp; Marks Entry
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Enter CIE marks, internal assessments, and lab evaluations synchronized with NBA attainment.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
            style={{
              background: '#7C3AED',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="fa-solid fa-circle-plus"></i>
            <span>New Assessment</span>
          </button>
          <Link
            to="/unilms/faculty/dashboard"
            className="btn btn-outline"
            style={{
              background: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Workbench</span>
          </Link>
        </div>
      </div>

      {/* Selection Filter Bar */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', marginBottom: '22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>
              Select Course Subject *
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>
              Continuous Assessment Test *
            </label>
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
            >
              {assessments.length > 0 ? (
                assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Max: {a.maxMarks})
                  </option>
                ))
              ) : (
                <option value="">No assessments created for this course</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Marks Entry Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>
              Student Marks Roster {activeAssessment ? `— ${activeAssessment.name}` : ''}
            </h3>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Maximum Marks: <strong>{maxMarks}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn btn-primary"
              style={{
                background: '#7C3AED',
                color: '#fff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-floppy-disk me-1"></i> Save Marks
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Roll Number</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Student Name</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', width: '160px' }}>Score (Max: {maxMarks})</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={4} rows={pageSize || 5} />
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No students found. Please ensure students are registered in the institution.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st) => {
                  const score = studentScores[st.id] !== undefined ? studentScores[st.id] : '';
                  const pct = score !== '' ? ((Number(score) / maxMarks) * 100).toFixed(0) : null;

                  return (
                    <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1e293b' }}>{st.roll_number}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>{st.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={maxMarks}
                          value={score}
                          onChange={(e) => handleScoreChange(st.id, e.target.value)}
                          placeholder="0.0"
                          style={{
                            width: '100px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            fontWeight: '700',
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {pct !== null ? (
                          <span
                            style={{
                              background: Number(pct) >= 40 ? '#dcfce7' : '#fee2e2',
                              color: Number(pct) >= 40 ? '#166534' : '#dc2626',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontWeight: '700',
                              fontSize: '12px',
                            }}
                          >
                            {pct}% ({Number(pct) >= 40 ? 'Pass' : 'Remedial'})
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="students"
          />
        </div>
      </div>

      {/* Create Assessment Modal */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>Create Continuous Assessment</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateAssessment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>Assessment Name *</label>
                <input
                  type="text"
                  required
                  value={newAssessForm.name}
                  onChange={(e) => setNewAssessForm({ ...newAssessForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>Assessment Type</label>
                <select
                  value={newAssessForm.examType}
                  onChange={(e) => setNewAssessForm({ ...newAssessForm, examType: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="Internal Assessment">Internal Assessment (CIA)</option>
                  <option value="Mid-Term Exam">Mid-Term Exam</option>
                  <option value="Lab Practical">Lab Practical Exam</option>
                  <option value="Assignment / Quiz">Assignment / Quiz</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>Max Marks</label>
                  <input
                    type="number"
                    value={newAssessForm.maxMarks}
                    onChange={(e) => setNewAssessForm({ ...newAssessForm, maxMarks: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>Weightage %</label>
                  <input
                    type="number"
                    value={newAssessForm.weightage}
                    onChange={(e) => setNewAssessForm({ ...newAssessForm, weightage: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-outline" style={{ padding: '8px 14px', borderRadius: '8px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', background: '#7C3AED', color: '#fff', border: 'none', fontWeight: '700' }}>
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default FacultyMarks;
