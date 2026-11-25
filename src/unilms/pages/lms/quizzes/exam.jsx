import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useConfirmDialog } from '../../../components';
import cbtService from '../../../services/cbt.service';
import studentsService from '../../../services/students.service';

const defaultExamQuestions = [
  {
    id: 1,
    marks: 5,
    text: "Which of the following architectural patterns is best suited for decoupling microservices asynchronously in distributed systems?",
    options: [
      "Event-Driven Architecture with Message Broker (Kafka/RabbitMQ)",
      "Monolithic Shared In-Memory State",
      "Direct Synchronous RPC Blocking Calls",
      "Single File-based SQLite Database"
    ],
    correct: 0,
    explanation: "Event-driven architecture with message queues decouples service lifecycles and provides asynchronous backpressure management."
  },
  {
    id: 2,
    marks: 5,
    text: "In Docker containerization, what does a multi-stage Docker build primarily achieve?",
    options: [
      "Minimizes final production image size by separating build tools from the runtime layer",
      "Forces containers to run on multiple physical hypervisors simultaneously",
      "Encrypts network traffic between Docker daemon and registries",
      "Automatically configures Kubernetes Ingress controllers"
    ],
    correct: 0,
    explanation: "Multi-stage builds allow compiling in an SDK image while only copying the compiled binaries to an Alpine/distroless production runtime."
  },
  {
    id: 3,
    marks: 5,
    text: "Which consensus algorithm is implemented by Etcd and Consul to ensure distributed consistency across cluster nodes?",
    options: [
      "Raft Consensus Algorithm",
      "Proof of Work (PoW)",
      "Bubble Sort Round Robin",
      "Greedy Spanning Tree"
    ],
    correct: 0,
    explanation: "Raft is an understandable leader-election consensus algorithm designed to provide strong leader-based replicated log consensus."
  },
  {
    id: 4,
    marks: 5,
    text: "What is the primary objective of a Circuit Breaker pattern (such as Netflix Hystrix or Resilience4j)?",
    options: [
      "Prevent cascading failures across microservices when a downstream dependency is degraded",
      "Block unauthorized IP addresses from reaching API endpoints",
      "Perform lossless payload compression on JSON responses",
      "Store JWT tokens in user browser cookies"
    ],
    correct: 0,
    explanation: "Circuit Breakers trip open after consecutive timeout thresholds, returning immediate fallbacks and shielding failing upstream services."
  },
  {
    id: 5,
    marks: 5,
    text: "In Kubernetes, which object provides load balancing, reverse proxy routing, and SSL/TLS termination for cluster services?",
    options: [
      "Ingress Controller",
      "PersistentVolumeClaim",
      "ConfigMap",
      "DaemonSet"
    ],
    correct: 0,
    explanation: "Ingress manages external HTTP/HTTPS traffic routing, SSL termination, and host/path-based load distribution across pods."
  }
];

const LmsQuizzesExam = () => {
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('unilms_cbt_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((q, idx) => ({
            id: q.id || (idx + 1),
            marks: q.points || 5,
            text: q.question_text || q.text,
            options: q.options || [],
            correct: q.correct_option !== undefined ? q.correct_option : 0,
            explanation: q.explanation || ''
          }));
        }
      }
    } catch { }
    return defaultExamQuestions;
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(2700); // 45 minutes
  const [submitted, setSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [studentInfo, setStudentInfo] = useState(() => {
    try {
      const stored = localStorage.getItem('unilms_user');
      if (stored) {
        const u = JSON.parse(stored);
        return {
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Enrolled Student',
          rollNumber: u.rollNumber || u.roll_number || 'STU-ONLINE',
          program: u.programName || u.program || 'Degree Program'
        };
      }
    } catch {}
    return {
      name: 'Enrolled Student',
      rollNumber: 'STU-ONLINE',
      program: 'Degree Program'
    };
  });
  const [lastHeartbeat, setLastHeartbeat] = useState(null);

  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Initialize CBT Backend Session
  useEffect(() => {
    const initSession = async () => {
      try {
        let loggedUser = null;
        try {
          const stored = localStorage.getItem('unilms_user');
          if (stored) loggedUser = JSON.parse(stored);
        } catch {}

        const [students, quizzes] = await Promise.all([
          studentsService.getStudents().catch(() => []),
          cbtService.getQuizzes().catch(() => [])
        ]);

        let activeStudent = null;
        if (Array.isArray(students) && students.length > 0 && loggedUser) {
          activeStudent = students.find(s => 
            s.id === loggedUser.studentId || 
            s.id === loggedUser.id || 
            s.email === loggedUser.email ||
            s.rollNumber === loggedUser.rollNumber
          );
        }

        if (loggedUser || activeStudent) {
          const name = loggedUser?.name || `${activeStudent?.firstName || ''} ${activeStudent?.lastName || ''}`.trim() || 'Enrolled Student';
          const roll = loggedUser?.rollNumber || activeStudent?.rollNumber || 'STU-ONLINE';
          const prog = activeStudent?.program?.name || 'Academic Degree Program';
          setStudentInfo({
            name,
            rollNumber: roll,
            program: prog
          });
        }

        // Load questions from dynamic database quiz if available
        if (Array.isArray(quizzes) && quizzes.length > 0 && Array.isArray(quizzes[0].questions) && quizzes[0].questions.length > 0) {
          const dbQuestions = quizzes[0].questions.map((q, idx) => ({
            id: q.id || (idx + 1),
            marks: Number(q.points) || 5,
            text: q.questionText,
            options: typeof q.optionsJson === 'string' ? JSON.parse(q.optionsJson) : (q.options || []),
            correct: q.correctOption !== undefined ? q.correctOption : 0,
            explanation: q.explanation || ''
          }));
          setQuestions(dbQuestions);
        }

        const sessionRes = await cbtService.startOrResumeSession({
          studentId: activeStudent.id,
          title: 'Cloud Architecture & Distributed Microservices Online CBT',
          totalDurationMinutes: 45
        });

        const sess = sessionRes?.data || sessionRes;
        if (sess?.id) {
          setSessionId(sess.id);
          if (sess.remainingSeconds > 0) setTimeLeft(sess.remainingSeconds);
          if (sess.answersJson) {
            try {
              setAnswers(JSON.parse(sess.answersJson));
            } catch { }
          }
          if (sess.tabSwitchCount) setTabSwitches(sess.tabSwitchCount);
        }
      } catch (e) {
        console.warn('CBT session start local fallback:', e.message);
      }
    };

    initSession();
  }, []);

  // Proctoring: Detect Tab Switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !submitted) {
        setTabSwitches(prev => {
          const next = prev + 1;
          if (sessionId) {
            cbtService.recordHeartbeat(sessionId, {
              remainingSeconds: timeLeft,
              answers,
              tabSwitched: true
            }).catch(() => { });
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionId, timeLeft, answers, submitted]);

  // Countdown Timer
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  // 30-Second Polling Heartbeat (Autosave & Telemetry)
  useEffect(() => {
    if (submitted || !sessionId) return;
    const interval = setInterval(async () => {
      try {
        await cbtService.recordHeartbeat(sessionId, {
          remainingSeconds: timeLeft,
          answers,
          tabSwitched: false
        });
        setLastHeartbeat(new Date().toLocaleTimeString());
      } catch (e) {
        console.warn('Heartbeat telemetry sync warning:', e.message);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionId, timeLeft, answers, submitted]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSelectOption = (optIdx) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: optIdx }));
  };

  const handleClearResponse = () => {
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentIdx];
      return copy;
    });
  };

  const toggleFlag = () => {
    setFlagged(prev => ({ ...prev, [currentIdx]: !prev[currentIdx] }));
  };

  const handleSubmitTest = async () => {
    if (!submitted) {
      setSubmitted(true);
      if (sessionId) {
        try {
          await cbtService.submitSession(sessionId, { answers });
        } catch (e) {
          console.warn('Backend submission sync warning:', e.message);
        }
      }
    }
  };

  const handlePromptSubmit = async () => {
    const confirmed = await confirm({
      title: 'Confirm Final Exam Submission',
      message: `You have answered ${answeredCount} of ${questions.length} questions. Are you ready to finalize and submit your examination?`,
      details: [
        `Answered Questions: ${answeredCount} / ${questions.length}`,
        `Unanswered: ${questions.length - answeredCount}`,
        `Flagged for Review: ${Object.values(flagged).filter(Boolean).length}`,
        `Time Remaining: ${formatTime(timeLeft)}`,
        `Tab Switches: ${tabSwitches} recorded by proctor`
      ],
      confirmText: 'Yes, Submit Test Now',
      cancelText: 'Continue Answering',
      variant: 'warning',
      icon: 'fa-solid fa-paper-plane'
    });
    if (confirmed) {
      handleSubmitTest();
    }
  };

  const answeredCount = Object.keys(answers).length;
  const currentQ = questions[currentIdx] || questions[0];
  const totalPossibleMarks = questions.reduce((sum, q) => sum + (q.marks || 5), 0);

  const calculateFinalScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        score += (q.marks || 5);
      }
    });
    return score;
  };

  const scorePct = totalPossibleMarks > 0 ? Math.round((calculateFinalScore() / totalPossibleMarks) * 100) : 0;
  const isPassed = scorePct >= 50;

  return (
    <div style={{ minHeight: '100%', background: 'transparent', padding: '0' }}>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 1024px) {
          .cbt-exam-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>

        {/* Exam Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--card-bg, #fff)',
            padding: '16px 20px',
            borderRadius: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ minWidth: '240px', flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                CBT EXAM PLAYER &bull; CS101
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Student: <strong>{studentInfo.name}</strong> ({studentInfo.rollNumber})
              </span>
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 0', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Cloud Architecture &amp; Operating Systems CBT Examination
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', flexShrink: 0 }}>
            {/* Proctoring Warning Badge if Tab Switched */}
            {tabSwitches > 0 && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '6px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Tab Switched: {tabSwitches}x</span>
              </div>
            )}

            {/* Timer Badge */}
            <div
              style={{
                background: timeLeft < 300 ? '#FEF2F2' : 'rgba(99, 102, 241, 0.1)',
                color: timeLeft < 300 ? '#DC2626' : '#4F46E5',
                padding: '7px 14px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-regular fa-clock"></i>
              <span>{formatTime(timeLeft)}</span>
            </div>

            <Link
              to="/unilms/org/quizzes"
              className="btn btn-outline"
              style={{ fontSize: '12px', padding: '7px 14px', borderRadius: '8px', textDecoration: 'none', color: '#64748B', borderColor: '#CBD5E1', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Exit Player
            </Link>
          </div>
        </div>

        {submitted ? (
          /* Submission Results & Scorecard */
          <div
            style={{
              background: 'var(--card-bg, #fff)',
              padding: '40px 30px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              maxWidth: '850px',
              margin: '0 auto'
            }}
          >
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: isPassed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: isPassed ? '#10B981' : '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '34px',
                margin: '0 auto 20px'
              }}
            >
              <i className={`fa-solid ${isPassed ? 'fa-trophy' : 'fa-clipboard-check'}`}></i>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px', color: 'var(--text-primary)' }}>
              {isPassed ? 'Examination Completed Successfully!' : 'CBT Assessment Submitted'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px' }}>
              Your answers have been recorded in the institution grade ledger and evaluated by the auto-grading engine.
            </p>

            {/* Scorecard Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px',
                background: 'var(--bg-main, #f8fafc)',
                padding: '20px',
                borderRadius: '16px',
                marginBottom: '28px',
                border: '1px solid var(--border-color)'
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Score Achieved</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: isPassed ? '#059669' : '#DC2626', marginTop: '4px' }}>
                  {calculateFinalScore()} / {totalPossibleMarks}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Percentage</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#4F46E5', marginTop: '4px' }}>
                  {scorePct}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Answered</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {answeredCount} / {questions.length}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Result Grade</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: isPassed ? '#059669' : '#DC2626', marginTop: '4px' }}>
                  {scorePct >= 90 ? 'O (Outstanding)' : (scorePct >= 80 ? 'A+ (Excellent)' : (scorePct >= 70 ? 'A (Very Good)' : (scorePct >= 60 ? 'B+ (Good)' : (isPassed ? 'B (Pass)' : 'F (Fail)'))))}
                </div>
              </div>
            </div>

            {/* Answers Breakdown */}
            <div style={{ textAlign: 'left', marginTop: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px', color: 'var(--text-primary)' }}>
                Detailed Question Review &amp; Explanations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {questions.map((q, idx) => {
                  const userAns = answers[idx];
                  const isCorrect = userAns === q.correct;
                  return (
                    <div
                      key={q.id}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: isCorrect ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px' }}>
                          Q{idx + 1}. {q.text}
                        </span>
                        <span className="badge" style={{ background: isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isCorrect ? '#059669' : '#DC2626', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                          {isCorrect ? `+${q.marks} pts` : '0 pts'}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Your Choice: <strong>{userAns !== undefined ? q.options[userAns] : 'Not Attempted'}</strong>
                      </div>
                      {!isCorrect && (
                        <div style={{ fontSize: '13px', color: '#059669', marginTop: '2px' }}>
                          Correct Choice: <strong>{q.options[q.correct]}</strong>
                        </div>
                      )}
                      {q.explanation && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                          <i className="fa-solid fa-lightbulb" style={{ color: '#F59E0B', marginRight: '6px' }}></i>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '28px' }}>
              <Link
                to="/unilms/org/quizzes"
                className="btn btn-primary"
                style={{ padding: '10px 24px', borderRadius: '10px', background: '#4F46E5', borderColor: '#4F46E5', color: '#fff', fontWeight: '700', textDecoration: 'none' }}
              >
                Return to Quizzes Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* Live Exam Interaction Split View */
          <div className="cbt-exam-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) 250px', gap: '16px', alignItems: 'start' }}>

            {/* Left: Current Question Card */}
            <div
              style={{
                background: 'var(--card-bg, #fff)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.02)'
              }}
            >
              {/* Question Meta Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#EDE9FE', color: '#7C3AED', fontWeight: '800', fontSize: '13px', padding: '4px 10px', borderRadius: '8px' }}>
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="badge" style={{ background: '#DBEAFE', color: '#1D4ED8', fontWeight: '700', fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }}>
                    {currentQ.marks || 5} Points
                  </span>
                  {flagged[currentIdx] && (
                    <span className="badge" style={{ background: '#FEF3C7', color: '#B45309', fontWeight: '700', fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                      <i className="fa-solid fa-flag me-1"></i> Flagged
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={toggleFlag}
                  style={{ background: 'transparent', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: flagged[currentIdx] ? '#B45309' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className={`fa-${flagged[currentIdx] ? 'solid' : 'regular'} fa-flag`}></i>
                  {flagged[currentIdx] ? 'Marked for Review' : 'Mark for Review'}
                </button>
              </div>

              {/* Question Text */}
              <div style={{ marginBottom: '26px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                  {currentQ.text}
                </h2>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentIdx] === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #4F46E5' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--card-bg, #fff)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: isSelected ? '7px solid #4F46E5' : '2px solid #CBD5E1',
                          background: '#fff',
                          boxSizing: 'border-box'
                        }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: isSelected ? '700' : '500', color: isSelected ? '#1E1B4B' : 'var(--text-primary)' }}>
                        <strong style={{ marginRight: '8px', color: isSelected ? '#4F46E5' : '#64748B' }}>
                          {String.fromCharCode(65 + idx)}.
                        </strong>
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    <i className="fa-solid fa-arrow-left me-1"></i> Previous
                  </button>

                  <button
                    type="button"
                    disabled={answers[currentIdx] === undefined}
                    onClick={handleClearResponse}
                    className="btn btn-outline"
                    style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px', color: '#DC2626', borderColor: '#FECACA', cursor: answers[currentIdx] === undefined ? 'not-allowed' : 'pointer' }}
                  >
                    Clear Choice
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {currentIdx < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                      className="btn btn-primary"
                      style={{ padding: '8px 20px', borderRadius: '8px', background: '#4F46E5', borderColor: '#4F46E5', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                    >
                      Next Question <i className="fa-solid fa-arrow-right ms-1"></i>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePromptSubmit}
                      className="btn btn-primary"
                      style={{ padding: '8px 24px', borderRadius: '8px', background: '#059669', borderColor: '#059669', color: '#fff', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
                    >
                      <i className="fa-solid fa-circle-check me-1"></i> Finalize &amp; Submit Test
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Question Palette & Proctoring Status */}
            <div>
              {/* Question Palette Card */}
              <div
                style={{
                  background: 'var(--card-bg, #fff)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                  marginBottom: '16px'
                }}
              >
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Question Palette
                </h3>

                {/* Legend */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10B981', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap' }}>Answered ({answeredCount})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#F59E0B', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap' }}>Flagged ({Object.values(flagged).filter(Boolean).length})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#E2E8F0', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap' }}>Unanswered ({questions.length - answeredCount})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', border: '2px solid #4F46E5', background: '#fff', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap' }}>Current</span>
                  </div>
                </div>

                {/* Number Grid - Flexible auto-fill grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', gap: '6px', marginBottom: '16px' }}>
                  {questions.map((q, idx) => {
                    const isAnswered = answers[idx] !== undefined;
                    const isFlag = flagged[idx];
                    const isCurrent = currentIdx === idx;

                    let bg = '#F1F5F9';
                    let color = '#475569';
                    let border = '1px solid transparent';

                    if (isAnswered) {
                      bg = '#10B981';
                      color = '#fff';
                    } else if (isFlag) {
                      bg = '#F59E0B';
                      color = '#fff';
                    }

                    if (isCurrent) {
                      border = '2px solid #4F46E5';
                      if (!isAnswered && !isFlag) {
                        bg = '#EDE9FE';
                        color = '#4F46E5';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentIdx(idx)}
                        style={{
                          width: '100%',
                          height: '36px',
                          minWidth: 0,
                          borderRadius: '8px',
                          border,
                          background: bg,
                          color,
                          fontWeight: '800',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          boxShadow: isCurrent ? '0 0 0 2px rgba(79, 70, 229, 0.2)' : 'none'
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Final Submit Button */}
                <button
                  type="button"
                  onClick={handlePromptSubmit}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#059669',
                    borderColor: '#059669',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  <i className="fa-solid fa-paper-plane"></i> Submit Examination
                </button>
              </div>

              {/* Proctoring Telemetry Card */}
              <div
                style={{
                  background: 'var(--card-bg, #fff)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: '#4F46E5', fontSize: '16px' }}></i>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    AI Proctoring &amp; Telemetry
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <div>&bull; <strong>Autosave:</strong> Active</div>
                  <div>&bull; <strong>Tab Switch Counter:</strong> {tabSwitches} violations</div>
                  {lastHeartbeat && <div>&bull; <strong>Last Sync:</strong> {lastHeartbeat}</div>}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default LmsQuizzesExam;
