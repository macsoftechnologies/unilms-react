import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { cbtService } from '../../../services/cbt.service';

const LmsAssessmentsCbtPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('student_id') || localStorage.getItem('unilms_student_id') || '00000000-0000-0000-0000-000000000001';

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(3600);
  const [loading, setLoading] = useState(true);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const secondsRef = useRef(remainingSeconds);
  secondsRef.current = remainingSeconds;

  // Initialize CBT session
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      try {
        const [res, quizzes] = await Promise.allSettled([
          cbtService.startOrResumeSession({
            studentId,
            title: 'CS401 - Cloud Architecture & DevOps Microservices CBT Mid-Term',
            totalDurationMinutes: 60,
          }),
          cbtService.getQuizzes()
        ]);

        if (res.status === 'fulfilled' && res.value) {
          const s = res.value;
          setSession(s);
          setRemainingSeconds(s.remainingSeconds || 3600);
          setTabSwitches(s.tabSwitchCount || 0);

          if (s.answersJson) {
            try {
              setAnswers(JSON.parse(s.answersJson));
            } catch (e) {}
          }

          if (s.status === 'SUBMITTED' || s.status === 'TIMED_OUT') {
            setIsSubmitted(true);
            setFinalScore(s.score || 0);
          }
        }

        if (quizzes.status === 'fulfilled' && Array.isArray(quizzes.value) && quizzes.value.length > 0) {
          const activeQuiz = quizzes.value[0];
          if (Array.isArray(activeQuiz.questions) && activeQuiz.questions.length > 0) {
            const mapped = activeQuiz.questions.map((q, idx) => {
              let parsedOpts = [];
              try {
                const raw = typeof q.optionsJson === 'string' ? JSON.parse(q.optionsJson) : (q.options || []);
                if (Array.isArray(raw)) {
                  parsedOpts = raw.map((item, i) => {
                    const letter = ['a', 'b', 'c', 'd'][i] || String(i);
                    if (typeof item === 'object' && item !== null) {
                      return { id: item.id || letter, text: item.text || item.label || String(item) };
                    }
                    return { id: letter, text: String(item) };
                  });
                }
              } catch (e) {
                parsedOpts = [];
              }
              return {
                id: q.id || `q${idx + 1}`,
                text: q.questionText || `Question ${idx + 1}`,
                points: Number(q.points) || 5,
                options: parsedOpts
              };
            });
            setQuestions(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to init CBT session:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [studentId]);

  // 1-sec countdown ticker
  useEffect(() => {
    if (isSubmitted || loading) return;

    const ticker = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(ticker);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [isSubmitted, loading]);

  // 30-sec Polling Heartbeat (Autosave answers & proctor telemetry)
  useEffect(() => {
    if (isSubmitted || !session) return;

    const heartbeat = setInterval(async () => {
      try {
        await cbtService.recordHeartbeat(session.id, {
          remainingSeconds: secondsRef.current,
          answers: answersRef.current,
        });
      } catch (e) {
        console.warn('Heartbeat autosave error:', e.message);
      }
    }, 30000);

    return () => clearInterval(heartbeat);
  }, [session, isSubmitted]);

  // Anti-cheat tab switch detection
  useEffect(() => {
    if (isSubmitted || !session) return;

    const handleVisibility = async () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
        setToastMsg('Warning: Window tab switch detected and logged by CBT proctoring telemetry.');
        setTimeout(() => setToastMsg(null), 4000);

        try {
          await cbtService.recordHeartbeat(session.id, {
            remainingSeconds: secondsRef.current,
            answers: answersRef.current,
            tabSwitched: true,
          });
        } catch (e) {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [session, isSubmitted]);

  const handleSelectOption = (qId, optionId) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionId,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!session) return;

    if (!window.confirm('Are you sure you want to finalize and submit your CBT Exam? Answers will be scored immediately.')) {
      return;
    }

    try {
      const res = await cbtService.submitSession(session.id, { answers });
      setIsSubmitted(true);
      setFinalScore(res.score || 85);
    } catch (err) {
      alert(err.message || 'Failed to submit CBT exam.');
    }
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px', color: '#7C3AED' }}></i>
        <p style={{ marginTop: '16px', color: '#64748b', fontWeight: '600' }}>Initializing CBT Exam Secure Environment...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '20px' }}>
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            fontWeight: '700',
            fontSize: '13px',
          }}
        >
          <i className="fa-solid fa-triangle-exclamation me-2"></i>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          to="/unilms/lms/assignments"
          className="btn btn-sm btn-outline"
          style={{ marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Assessments
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span
              className="badge"
              style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#0891B2', fontSize: '11.5px', fontWeight: '700', marginBottom: '6px', display: 'inline-block', padding: '4px 10px', borderRadius: '6px' }}
            >
              <i className="fa-solid fa-list-check me-1"></i> CBT Online Examination
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px' }}>
              {session?.title || 'Computer Based Assessment'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '13.5px', margin: '0' }}>
              Real-time answer synchronization every 30 seconds. Tab switches are logged: <strong>{tabSwitches} flagged</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ background: '#fff', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Total Questions</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#7C3AED' }}>{questions.length}</div>
            </div>
            <div style={{ background: '#fee2e2', padding: '10px 16px', borderRadius: '12px', border: '1px solid #fca5a5', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700' }}>Time Remaining</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#dc2626' }}>
                {formatTimer(remainingSeconds)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSubmitted ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', borderRadius: '20px', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
            CBT Online Exam Completed!
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            Your responses were successfully evaluated and recorded in the database.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Your Score:</span>
            <span style={{ fontSize: '22px', fontWeight: '800', color: '#7C3AED' }}>
              {finalScore}%
            </span>
          </div>
          <div>
            <Link to="/unilms/lms/assignments" className="btn btn-primary" style={{ padding: '10px 24px', background: '#7C3AED', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '700' }}>
              Return to LMS Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <i className="fa-solid fa-clipboard-question" style={{ fontSize: '42px', color: '#94a3b8', marginBottom: '16px' }}></i>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>No Questions Found</h3>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                  This CBT exam session does not currently contain active questions. Please verify with your instructor.
                </p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id} style={{ borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px' }}>
                      Question {idx + 1} of {questions.length}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                      {q.points} Marks
                    </span>
                  </div>

                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '18px', lineHeight: '1.5' }}>
                    {q.text}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {q.options.map((opt) => {
                      const isSelected = answers[q.id] === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectOption(q.id, opt.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #7C3AED' : '1px solid #e2e8f0',
                            background: isSelected ? '#F5F3FF' : '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: isSelected ? '6px solid #7C3AED' : '2px solid #cbd5e1',
                              background: '#fff',
                            }}
                          />
                          <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: isSelected ? '700' : '500' }}>
                            {opt.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {questions.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '12px 28px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)' }}
                >
                  <i className="fa-solid fa-paper-plane me-2"></i> Submit CBT Assessment
                </button>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default LmsAssessmentsCbtPlayer;
