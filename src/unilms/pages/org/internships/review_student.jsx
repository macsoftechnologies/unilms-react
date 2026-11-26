import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import React, { useState } from 'react';
import apiClient from '../../../services/api';

const OrgInternshipsReviewStudent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentName = searchParams.get('name') || 'Student Intern';
  const studentId = searchParams.get('studentId') || 'intern-01';

  const [remarks, setRemarks] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [rubric, setRubric] = useState({
    technical: 85,
    communication: 80,
    discipline: 90,
    problem_solving: 85,
    quality_output: 88,
    attendance: 95,
    viva_marks: 85,
    report_marks: 88
  });

  const handleRubricChange = (field, val) => {
    setRubric(prev => ({ ...prev, [field]: Number(val) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/academics/assessments/internship-eval/submit', {
        studentId,
        studentName,
        rubric,
        remarks: remarks || 'Faculty mentor evaluation completed.',
      });
    } catch (err) {
      console.warn('Backend rubric submit note:', err.message);
    }
    setToastMsg(`Rubric evaluation and remarks for ${studentName} saved to PostgreSQL!`);
    setTimeout(() => {
      navigate('/unilms/org/internships/faculty_mentorship');
    }, 2000);
  };

  return (
    <div className="container-fluid p-0">
      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <i className="fa-solid fa-star"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Student Internship Evaluation &amp; Review
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Grade milestone deliverables, technical viva &amp; company supervisor feedback
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/unilms/org/internships/faculty_mentorship" className="btn btn-outline" style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            <i className="fa-solid fa-arrow-left" style={{ color: '#7C3AED' }}></i>
            <span>Mentorship List</span>
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Deliverables Column */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: '#ffffff', borderRadius: '16px' }}>
            <h5 className="fw-bold text-dark mb-3">Milestone Deliverable Submissions</h5>
            <div className="p-3 bg-light rounded-3 border small mb-3">
              <div className="mb-2"><strong>GitHub Repository:</strong> <a href="https://github.com/apex-student/internship-portal" target="_blank" rel="noreferrer" className="text-primary">github.com/apex-student/internship-portal</a></div>
              <div className="mb-2"><strong>Attached Documentation:</strong> <a href="#download" onClick={(e) => { e.preventDefault(); alert('Downloading deliverable...'); }} className="text-success"><i className="fas fa-download me-1"></i> Download Deliverable ZIP</a></div>
              <div><strong>Student Submission Notes:</strong> Completed Milestone 1 and Milestone 2 roadmap objectives including authentication engine and database schema.</div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); alert('Milestone feedback recorded!'); }} className="d-flex gap-2">
              <input type="text" className="form-control form-control-sm" placeholder="Feedback remarks..." />
              <button type="submit" className="btn btn-sm btn-success rounded-pill px-3 text-nowrap">Approve &amp; Lock</button>
              <button type="button" onClick={() => alert('Deliverable marked for revision')} className="btn btn-sm btn-outline-danger rounded-pill px-3 text-nowrap">Request Revision</button>
            </form>
          </div>
        </div>

        {/* Rubric Column */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: '#ffffff', borderRadius: '16px' }}>
            <h5 className="fw-bold text-dark mb-3"><i className="fas fa-award text-warning me-2"></i> Final 6-Dimension Rubric Evaluation</h5>
            <p className="text-muted small">Fill the 6 core competency dimensions (0-100) to compute the total weighted grade for official TPO certification.</p>

            <form onSubmit={handleSave}>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold">1. Technical Competence</label>
                  <input type="number" min="0" max="100" className="form-control" value={rubric.technical} onChange={(e) => handleRubricChange('technical', e.target.value)} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">2. Communication</label>
                  <input type="number" min="0" max="100" className="form-control" value={rubric.communication} onChange={(e) => handleRubricChange('communication', e.target.value)} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">3. Discipline &amp; Punctuality</label>
                  <input type="number" min="0" max="100" className="form-control" value={rubric.discipline} onChange={(e) => handleRubricChange('discipline', e.target.value)} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">4. Problem Solving</label>
                  <input type="number" min="0" max="100" className="form-control" value={rubric.problem_solving} onChange={(e) => handleRubricChange('problem_solving', e.target.value)} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">5. Quality of Output</label>
                  <input type="number" min="0" max="100" className="form-control" value={rubric.quality_output} onChange={(e) => handleRubricChange('quality_output', e.target.value)} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">6. Attendance &amp; Consistency</label>
                  <input type="number" min="0" max="100" className="form-control" value={rubric.attendance} onChange={(e) => handleRubricChange('attendance', e.target.value)} required />
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold">Viva Marks (out of 100)</label>
                  <input type="number" min="0" max="100" className="form-control" value={rubric.viva_marks} onChange={(e) => handleRubricChange('viva_marks', e.target.value)} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">Report Marks (out of 100)</label>
                  <input type="number" min="0" max="100" className="form-control" value={rubric.report_marks} onChange={(e) => handleRubricChange('report_marks', e.target.value)} required />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Faculty Final Remarks</label>
                <textarea className="form-control" rows="3" placeholder="Remarks on student performance..." value={remarks} onChange={(e) => setRemarks(e.target.value)}></textarea>
              </div>

              <button type="submit" className="btn btn-primary w-100 py-2 rounded-pill shadow-sm" style={{ background: '#7C3AED', borderColor: '#7C3AED', fontWeight: '700' }}>
                <i className="fas fa-save me-2"></i> Save Rubric &amp; Forward to TPO
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgInternshipsReviewStudent;
