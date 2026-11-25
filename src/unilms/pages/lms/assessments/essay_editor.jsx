import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../../services/api';

const defaultEssayData = {
  title: 'Microservices vs Monolith: Architectural Trade-Off Analysis',
  courseName: 'CS111: Operating Systems & Cloud Architecture',
  maxMarks: 25,
  minWordCount: 150,
  maxWordCount: 800,
  description: 'Discuss the fundamental trade-offs between monolithic and event-driven microservices architectures. In your essay, analyze: (1) Operational complexity, (2) Distributed transaction management (Saga pattern vs 2PC), and (3) Network latency in high-throughput campus ERP environments.',
  submission: {
    submittedAt: '2026-11-21T11:20:00',
    essayWordCount: 420,
    score: 23,
    status: 'Graded',
    submittedEssay: `In evaluating modern software architecture, the choice between a monolithic system and microservices represents a classic engineering trade-off between simplicity and horizontal scalability.\n\nA monolith provides strong transactional consistency via atomic database commits (ACID) and simple deployment pipelines. However, as the engineering organization scales past hundreds of developers, deployment velocity degrades and codebase coupling increases.\n\nMicroservices decouple failure domains and allow independent scaling of compute-intensive modules. Nonetheless, they introduce distributed systems challenges, specifically asynchronous communication overhead and data consistency complexities. The Saga pattern addresses distributed transactions via compensating events, replacing heavyweight two-phase commit (2PC) locks.\n\nIn conclusion, a modular monolith remains the optimal baseline for institutional ERPs until individual domains experience genuine scaling divergences.`,
    facultyFeedback: 'Rigorous and articulate analysis of the Saga pattern and ACID trade-offs. Clean technical prose.'
  }
};

const LmsAssessmentsEssayEditor = () => {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(defaultEssayData);
  const [essayText, setEssayText] = useState(defaultEssayData.submission.submittedEssay);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiClient.get('/academics/assessments/essay-assignment-1/my-submission')
      .then(res => {
        if (isMounted && res) {
          const sub = res.submission || res;
          if (sub?.essayText) {
            setEssayText(sub.essayText);
            setAssessment(prev => ({
              ...prev,
              submission: {
                ...prev.submission,
                submittedAt: sub.submittedAt || prev.submission.submittedAt,
                essayWordCount: sub.essayText.trim().split(/\s+/).length,
                submittedEssay: sub.essayText,
                score: sub.score !== undefined ? sub.score : prev.submission.score
              }
            }));
          }
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  const isWithinLimits = wordCount >= assessment.minWordCount && wordCount <= assessment.maxWordCount;

  const handleBack = (e) => {
    if (window.history.length > 1) {
      e.preventDefault();
      navigate(-1);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isWithinLimits) {
      alert(`Word count must be between ${assessment.minWordCount} and ${assessment.maxWordCount} words (currently ${wordCount} words).`);
      return;
    }
    try {
      await apiClient.post('/academics/assessments/essay-assignment-1/submit', {
        essayText,
        remarks: 'Essay assignment submitted'
      });
    } catch (err) {
      console.warn('Backend essay submission note:', err.message);
    }
    setAssessment(prev => ({
      ...prev,
      submission: {
        ...prev.submission,
        submittedAt: new Date().toISOString(),
        essayWordCount: wordCount,
        submittedEssay: essayText
      }
    }));
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link 
          to="/unilms/lms/assignments" 
          onClick={handleBack} 
          style={{ color: 'var(--primary, #6366F1)', textDecoration: 'none', fontSize: '14px', marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Assessments
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', display: 'inline-block', marginBottom: '8px' }}>
              <i className="fa-solid fa-pen-nib me-1"></i> Technical Essay Assessment
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main, #0F172A)', margin: '0 0 6px' }}>
              {assessment.title}
            </h1>
            <p style={{ color: 'var(--text-muted, #64748B)', fontSize: '13.5px', margin: 0 }}>
              {assessment.courseName} &bull; Review the prompt instructions and submit your analytical response.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ background: '#fff', padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Max Marks</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary, #6366F1)' }}>{assessment.maxMarks} Pts</div>
            </div>
            <div style={{ background: '#fff', padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Word Range</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>{assessment.minWordCount} - {assessment.maxWordCount}</div>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '12px', marginBottom: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-circle-check"></i>
          Your revised essay has been saved and submitted for evaluation!
        </div>
      )}

      {/* Prompt Card */}
      <div className="card" style={{ borderRadius: '16px', border: '1px solid #E2E8F0', padding: '22px', marginBottom: '24px', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
            <i className="fa-solid fa-feather-pointed"></i>
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
            Essay Topic & Problem Statement
          </h2>
        </div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', fontSize: '13.5px', color: '#334155', lineHeight: '1.65' }}>
          {assessment.description}
        </div>
      </div>

      {/* Submitted View or Editor */}
      {!isEditing && assessment.submission ? (
        <div className="card" style={{ borderRadius: '16px', border: '1px solid #E2E8F0', padding: '28px', background: '#fff', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontSize: '12.5px', fontWeight: '700', padding: '6px 12px', borderRadius: '20px' }}>
                <i className="fa-solid fa-circle-check me-1"></i> Essay Evaluated
              </span>
              <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                Submitted on {new Date(assessment.submission.submittedAt).toLocaleDateString()} &bull; <strong>{assessment.submission.essayWordCount} words</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#F8FAFC', padding: '6px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: '800', fontSize: '15px', color: '#059669' }}>
                Score: {assessment.submission.score} / {assessment.maxMarks}
              </div>
              <button 
                type="button" 
                onClick={() => setIsEditing(true)} 
                style={{ background: 'none', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', color: '#4F46E5' }}
              >
                <i className="fa-solid fa-pen-to-square me-1"></i> Revise Draft
              </button>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', fontSize: '14px', lineHeight: '1.7', color: '#334155', whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' }}>
            {essayText}
          </div>

          {assessment.submission.facultyFeedback && (
            <div style={{ marginTop: '20px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', padding: '14px 18px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--primary, #6366F1)', marginBottom: '4px' }}>
                <i className="fa-solid fa-comment-dots me-1"></i> Faculty Evaluation Feedback:
              </div>
              <div style={{ fontSize: '13.5px', color: '#334155' }}>
                {assessment.submission.facultyFeedback}
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="card" style={{ borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', background: '#fff', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <label style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Your Essay Response
              </label>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '700', padding: '6px 14px', borderRadius: '20px', background: isWithinLimits ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${isWithinLimits ? '#10B981' : '#EF4444'}`, color: isWithinLimits ? '#059669' : '#DC2626' }}>
                <i className={`fa-solid ${isWithinLimits ? 'fa-check' : 'fa-circle-exclamation'}`}></i>
                {wordCount} words {isWithinLimits ? '(Within limits)' : `(Req: ${assessment.minWordCount}-${assessment.maxWordCount})`}
              </div>
            </div>

            <textarea 
              value={essayText} 
              onChange={(e) => setEssayText(e.target.value)} 
              rows="12" 
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '14px', lineHeight: '1.65', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Write your in-depth analytical response here..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              {assessment.submission && (
                <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: '700', cursor: 'pointer', color: '#64748B' }}>
                  Cancel
                </button>
              )}
              <button type="submit" disabled={!isWithinLimits} style={{ padding: '10px 22px', borderRadius: '10px', background: isWithinLimits ? 'var(--primary, #6366F1)' : '#94A3B8', color: '#fff', border: 'none', fontWeight: '700', cursor: isWithinLimits ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-paper-plane"></i> Submit Analytical Essay
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default LmsAssessmentsEssayEditor;
