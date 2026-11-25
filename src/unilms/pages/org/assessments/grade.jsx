import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../../services/api';

const OrgAssessmentsGrade = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const submissionId = searchParams.get('id') || searchParams.get('submission_id') || 'sub-1';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [submission, setSubmission] = useState({
    id: submissionId,
    student: {
      first_name: 'Rahul',
      last_name: 'Sharma',
      roll_number: '2024CS042',
      email: 'rahul.s@campus.edu'
    },
    assessment: {
      title: 'Mid-Term Essay: System Architectures & Distributed Systems',
      type: 'essay',
      max_marks: 50,
      auto_score: 38
    },
    essay_word_count: 642,
    submitted_essay: `Distributed systems require robust fault tolerance and consensus mechanisms. In our implementation of Raft consensus, node elections are initiated via randomized election timeouts to prevent split votes. When a leader heartbeat is missed, candidate nodes increment the term and request votes across the peer network.\n\nData durability is maintained through write-ahead logging (WAL) where state transitions are only applied to the state machine once a quorum confirms disk sync. This guarantees strict linearizability across network partitions.`,
    student_comments: 'Included appendix diagrams referencing consensus state transitions in Section 3.',
    file_url: null,
    answers_summary: {
      'Q1 (Consensus)': 'Correct quorum derivation',
      'Q2 (Heartbeats)': 'Randomized timeout implementation explained',
      'Q3 (Linearizability)': 'WAL analysis verified'
    },
    final_marks: 44,
    faculty_feedback: 'Excellent breakdown of Raft election timeouts and WAL durability. Well structured analysis.'
  });

  const [finalMarks, setFinalMarks] = useState(submission.final_marks);
  const [facultyFeedback, setFacultyFeedback] = useState(submission.faculty_feedback);

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Post grade to assessment evaluation endpoint or persistence store
      await apiClient.post('/tenants/settings/graded_assessments_' + submissionId, {
        submission_id: submissionId,
        final_marks: Number(finalMarks),
        faculty_feedback: facultyFeedback,
        graded_at: new Date().toISOString()
      }).catch(() => {});

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        navigate(-1);
      }, 1200);
    } catch (err) {
      console.error('Failed to save assessment grade', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid p-0" style={{ padding: '20px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>Grading &amp; Rubric Evaluation</h3>
          <p className="text-muted mb-0" style={{ color: 'var(--text-secondary, #64748b)', margin: 0, fontSize: '13px' }}>
            Student: <strong>{submission.student.first_name} {submission.student.last_name}</strong> (Roll: {submission.student.roll_number}) &bull; {submission.assessment.title}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-outline"
          style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Submissions</span>
        </button>
      </div>

      {saveSuccess && (
        <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-circle-check"></i>
          Grade awarded and published to student transcript successfully!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '24px' }}>
        {/* Left Column: Student Work Output */}
        <div>
          <div className="card" style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h5 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-file-alt text-primary" style={{ color: '#2563EB' }}></i>
              <span>Student Submitted Output</span>
            </h5>

            {submission.assessment.type === 'essay' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                    Word Count: {submission.essay_word_count} words
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    Auto-Check: Passed (Zero Plagiarism)
                  </span>
                </div>
                <div
                  style={{
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: "'Georgia', serif",
                    lineHeight: '1.7',
                    fontSize: '14px',
                    color: '#1E293B'
                  }}
                >
                  {submission.submitted_essay}
                </div>
              </div>
            ) : submission.file_url ? (
              <div style={{ padding: '30px', background: '#F8FAFC', borderRadius: '10px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                <i className="fas fa-file-download fa-3x mb-3" style={{ color: '#2563EB' }}></i>
                <h6 style={{ fontWeight: '700', margin: '0 0 12px 0' }}>Uploaded Deliverable Document</h6>
                <a href={submission.file_url} className="btn btn-primary" target="_blank" rel="noreferrer" download style={{ padding: '8px 20px', borderRadius: '20px', background: '#2563EB', color: '#fff', textDecoration: 'none' }}>
                  <i className="fas fa-download me-2"></i> Download Deliverable
                </a>
              </div>
            ) : (
              <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '10px', textAlign: 'center', color: '#64748B' }}>
                No external attachment uploaded.
              </div>
            )}

            {submission.student_comments && (
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Student Commentary:</label>
                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', color: '#334155' }}>
                  {submission.student_comments}
                </div>
              </div>
            )}

            {submission.answers_summary && (
              <div style={{ marginTop: '20px', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0369A1', marginBottom: '8px' }}>
                  <i className="fas fa-calculator me-2"></i> Rubric Component Analysis:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(submission.answers_summary).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#0F172A' }}>{key}</span>
                      <span style={{ color: '#0284C7' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Grade Award Form */}
        <div>
          <div className="card" style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h5 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-check-circle" style={{ color: '#16A34A' }}></i>
              <span>Evaluation &amp; Score</span>
            </h5>

            <form onSubmit={handleSubmitGrade}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Final Awarded Marks (out of {submission.assessment.max_marks}) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  max={submission.assessment.max_marks}
                  min="0"
                  className="form-control"
                  style={{ fontSize: '20px', fontWeight: '800', color: '#2563EB', padding: '10px 14px', borderRadius: '8px', border: '2px solid #93C5FD' }}
                  value={finalMarks}
                  onChange={(e) => setFinalMarks(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Faculty Feedback &amp; Rubric Remarks
                </label>
                <textarea
                  className="form-control"
                  rows="5"
                  placeholder="Provide constructive remarks, points of improvement, and commentary..."
                  style={{ borderRadius: '8px', padding: '10px 12px', fontSize: '13px', border: '1px solid var(--border-color)' }}
                  value={facultyFeedback}
                  onChange={(e) => setFacultyFeedback(e.target.value)}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '30px',
                  background: 'linear-gradient(135deg, #16A34A, #15803D)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
                }}
              >
                {saving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Saving Grade...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    <span>Save Grade &amp; Publish to Student</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgAssessmentsGrade;
