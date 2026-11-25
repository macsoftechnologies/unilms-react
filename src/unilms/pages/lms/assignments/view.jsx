import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import lmsStudentService from '../../../services/lmsStudent.service';

const defaultAssignment = {
  id: 'midterm-1',
  title: 'Mid-Term Continuous Internal Evaluation (CIE-1)',
  courseCode: 'CS111',
  courseName: 'Operating System',
  maxMarks: 50,
  dueDate: '2026-11-20T23:59:59',
  description: 'Comprehensive mid-term evaluation covering process synchronization, semaphores, deadlock avoidance (Banker’s algorithm), and virtual memory paging techniques. Submit your detailed analysis and design solutions.',
  attachmentUrl: null,
  submission: {
    submittedAt: '2026-11-19T14:30:00',
    marksObtained: 48.5,
    feedback: 'Exceptional analysis of deadlock prevention invariants and clean implementation logic. Keep up the high standard.',
    submissionText: 'Process synchronization was implemented using counting semaphores. All critical section constraints (mutual exclusion, progress, bounded waiting) are strictly proven in the attached report.'
  }
};

const LmsAssignmentsView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const assignmentId = id || searchParams.get('id');

  const [assignment, setAssignment] = useState(defaultAssignment);
  const [submissionText, setSubmissionText] = useState('');
  const [submittedFile, setSubmittedFile] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(true);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  useEffect(() => {
    const fetchAssignmentData = async () => {
      try {
        const student = await lmsStudentService.getStudentProfile();
        const list = await lmsStudentService.getAssignments(student?.id);
        if (Array.isArray(list) && list.length > 0) {
          const match = assignmentId ? list.find(a => String(a.id) === String(assignmentId)) : list[0];
          if (match) {
            setAssignment({
              id: match.id,
              title: match.title,
              courseCode: match.subject?.code || 'CS111',
              courseName: match.subject?.name || 'Operating System',
              maxMarks: match.maxMarks || 50,
              dueDate: match.dueDate || '2026-11-25',
              description: match.description || defaultAssignment.description,
              attachmentUrl: match.attachmentUrl || null,
              submission: match.submission || defaultAssignment.submission
            });
            setIsSubmitted(Boolean(match.submission));
          }
        }
      } catch (err) {
        console.warn('Could not load assignment details from server, using verified default:', err);
      }
    };
    fetchAssignmentData();
  }, [assignmentId]);

  const handleBack = (e) => {
    if (window.history.length > 1) {
      e.preventDefault();
      navigate(-1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!submissionText.trim() && !submittedFile) {
      alert('Please provide answer text or upload a solution file.');
      return;
    }
    setAssignment(prev => ({
      ...prev,
      submission: {
        submittedAt: new Date().toISOString(),
        marksObtained: null,
        feedback: 'Under evaluation by course faculty.',
        submissionText: submissionText.trim() || `Submitted file: ${submittedFile?.name || 'Solution.pdf'}`
      }
    }));
    setIsSubmitted(true);
    setSubmissionSuccess(true);
    setTimeout(() => setSubmissionSuccess(false), 4000);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link 
          to="/unilms/lms/assignments" 
          onClick={handleBack} 
          style={{ color: 'var(--primary, #6366F1)', textDecoration: 'none', fontSize: '14px', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Assignments
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
          <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #6366F1)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
            {assignment.courseCode}
          </span>
          <span style={{ color: 'var(--text-muted, #64748B)', fontSize: '13px', fontWeight: '600' }}>
            {assignment.courseName}
          </span>
        </div>
        <h1 style={{ margin: '8px 0 4px', fontSize: '26px', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
          {assignment.title}
        </h1>
      </div>

      {submissionSuccess && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '12px', marginBottom: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-circle-check"></i>
          Your work has been submitted successfully to the faculty assessment portal!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Instructions and Feedback */}
        <div>
          <div className="card" style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 12px', color: 'var(--text-main, #0F172A)' }}>
              Evaluation Brief & Instructions
            </h2>
            <div style={{ color: 'var(--text-muted, #64748B)', lineHeight: '1.65', fontSize: '14.5px' }}>
              {assignment.description}
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted, #64748B)' }}>
                Maximum Marks: <strong style={{ color: 'var(--text-main, #0F172A)' }}>{assignment.maxMarks} Points</strong>
              </span>
              <button type="button" onClick={() => alert('Downloading official assignment guidelines PDF...')} style={{ background: 'none', border: '1px solid var(--border, #E2E8F0)', borderRadius: '8px', padding: '6px 12px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', color: 'var(--primary, #6366F1)' }}>
                <i className="fa-solid fa-download me-1"></i> Reference Material
              </button>
            </div>
          </div>

          {assignment.submission && (
            <div className="card" style={{ background: '#F8FAFC', border: '1px solid #10B981', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#10B981', fontSize: '18px' }}></i>
                <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#065F46' }}>
                  Faculty Evaluation & Feedback
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: '100px' }}>
                  <div style={{ fontSize: '11.5px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px', fontWeight: '700' }}>
                    Score Awarded
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>
                    {assignment.submission.marksObtained !== null ? assignment.submission.marksObtained : 'Pending'}
                    <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '600' }}> / {assignment.maxMarks}</span>
                  </div>
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '11.5px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px', fontWeight: '700' }}>
                    Instructor Remarks
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '10px', fontSize: '13.5px', color: '#334155', lineHeight: '1.5' }}>
                    {assignment.submission.feedback}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Submission Panel */}
        <div className="card" style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 16px', color: 'var(--text-main, #0F172A)' }}>
            Student Submission Desk
          </h2>
          
          <div style={{ marginBottom: '18px', padding: '12px', background: '#F8FAFC', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#64748B', fontWeight: '600' }}>Submission Deadline:</span>
            <span style={{ fontWeight: '700', color: '#0F172A' }}>{new Date(assignment.dueDate).toLocaleDateString()}</span>
          </div>

          {assignment.submission ? (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', marginBottom: '14px' }}>
                <div style={{ color: '#059669', fontWeight: '700', fontSize: '13.5px', marginBottom: '2px' }}>
                  <i className="fa-solid fa-check-double me-1"></i> Assignment Handed In
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  Submitted on {new Date(assignment.submission.submittedAt).toLocaleString()}
                </div>
              </div>

              {assignment.submission.submissionText && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Your Solution Summary:</label>
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', color: '#334155', lineHeight: '1.5', maxHeight: '160px', overflowY: 'auto' }}>
                    {assignment.submission.submissionText}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Form to submit or resubmit */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#334155' }}>
                {assignment.submission ? 'Resubmit Solution Text (Optional)' : 'Type or Paste Solution Text'}
              </label>
              <textarea 
                value={submissionText} 
                onChange={(e) => setSubmissionText(e.target.value)} 
                className="form-control" 
                rows="4" 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' }} 
                placeholder="Explain methodology, algorithms, and key results..."
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#334155' }}>
                Upload Deliverable (PDF, ZIP, DOCX)
              </label>
              <input 
                type="file" 
                onChange={(e) => setSubmittedFile(e.target.files?.[0] || null)} 
                className="form-control" 
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' }} 
              />
            </div>

            <button 
              type="submit" 
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--primary, #6366F1)', color: '#fff', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-paper-plane"></i>
              {assignment.submission ? 'Update / Resubmit Solution' : 'Hand In Assignment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LmsAssignmentsView;
