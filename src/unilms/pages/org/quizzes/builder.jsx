import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useConfirmDialog } from '../../../components';
import cbtService from '../../../services/cbt.service';

const OrgQuizzesBuilder = () => {
  const [searchParams] = useSearchParams();
  const quizTitle = searchParams.get('title') || 'Cloud Architecture & Distributed Microservices Assessment';
  const quizSubject = searchParams.get('subject') || 'CS101: Operating Systems & Cloud Systems';

  const [activeQuizId, setActiveQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const loadQuizFromBackend = async () => {
      try {
        const quizzes = await cbtService.getQuizzes();
        if (Array.isArray(quizzes) && quizzes.length > 0) {
          const quiz = quizzes[0];
          setActiveQuizId(quiz.id);
          if (Array.isArray(quiz.questions) && quiz.questions.length > 0) {
            const mapped = quiz.questions.map((q, idx) => ({
              id: q.id || (idx + 1),
              question_text: q.questionText,
              points: Number(q.points) || 5,
              options: typeof q.optionsJson === 'string' ? JSON.parse(q.optionsJson) : (q.options || []),
              correct_option: q.correctOption ?? 0,
              explanation: q.explanation || ''
            }));
            setQuestions(mapped);
          }
        }
      } catch (e) {
        console.warn('Backend quiz load fallback:', e);
      }
    };
    loadQuizFromBackend();
  }, []);

  const [newQuestionText, setNewQuestionText] = useState('');
  const [newPoints, setNewPoints] = useState(5);
  const [newExplanation, setNewExplanation] = useState('');
  const [newOptions, setNewOptions] = useState([
    'Option A text',
    'Option B text',
    'Option C text',
    'Option D text'
  ]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);
  const [isPublished, setIsPublished] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) {
      alert('Please enter question text.');
      return;
    }

    const confirmed = await confirm({
      title: 'Confirm Add Question',
      message: 'Add this question to the active question bank?',
      details: [
        `Question: "${newQuestionText.slice(0, 70)}..."`,
        `Score: ${newPoints} points`,
        `Correct Option: Option ${String.fromCharCode(65 + correctOptionIdx)} (${newOptions[correctOptionIdx] || 'Option'})`
      ],
      confirmText: 'Yes, Add Question',
      variant: 'primary'
    });
    if (!confirmed) return;

    const questionObj = {
      id: Date.now(),
      question_text: newQuestionText.trim(),
      points: Number(newPoints) || 5,
      options: newOptions.map(o => o.trim() || 'Option'),
      correct_option: correctOptionIdx,
      explanation: newExplanation.trim() || 'Reference lecture syllabus notes.'
    };

    const updated = [...questions, questionObj];
    setQuestions(updated);
    if (activeQuizId) {
      try {
        await cbtService.syncQuestions(activeQuizId, updated);
      } catch (err) {
        console.warn('Could not sync question addition to backend:', err);
      }
    }
    setNewQuestionText('');
    setNewPoints(5);
    setNewExplanation('');
    setNewOptions(['', '', '', '']);
    setCorrectOptionIdx(0);
    showToast(`Question ${questions.length + 1} added to the quiz!`);
  };

  const handleRemoveQuestion = async (id) => {
    const confirmed = await confirm({
      title: 'Confirm Remove Question',
      message: 'Are you sure you want to remove this question from the quiz bank?',
      details: 'Total score and question count will be recalculated immediately.',
      confirmText: 'Yes, Remove Question',
      cancelText: 'Keep Question',
      variant: 'danger',
      icon: 'fa-solid fa-trash-can'
    });
    if (!confirmed) return;

    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    if (activeQuizId) {
      try {
        await cbtService.syncQuestions(activeQuizId, updated);
      } catch (err) {
        console.warn('Could not sync question removal to backend:', err);
      }
    }
    showToast('Question removed.');
  };

  const handleOptionChange = (idx, val) => {
    const updated = [...newOptions];
    updated[idx] = val;
    setNewOptions(updated);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1080px) {
          .quiz-builder-split-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .quiz-composer-sticky {
            position: static !important;
            top: auto !important;
          }
        }
      `}} />

      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)', animation: 'fadeIn 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
            <i className="fa-solid fa-circle-check"></i>
            {toastMsg}
          </div>
          <button onClick={() => setToastMsg(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/unilms/org/quizzes" style={{ color: '#7C3AED', textDecoration: 'none', fontSize: '14px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-arrow-left"></i> Back to Quizzes Registry
        </Link>
        <Link to="/unilms/lms/quizzes/exam" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', color: '#2563EB', borderColor: '#BFDBFE', fontWeight: '700', textDecoration: 'none' }}>
          <i className="fa-solid fa-play"></i> Test Student CBT Player
        </Link>
      </div>

      {/* Header Banner */}
      <div
        style={{
          background: 'var(--card-bg, #fff)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '18px 20px',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(17px, 2.2vw, 21px)', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px', wordBreak: 'break-word' }}>
              CBT Question Builder: {quizTitle}
            </h1>
            <span className="badge" style={{ background: isPublished ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: isPublished ? '#059669' : '#64748b', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}>
              {isPublished ? 'Status: Published' : 'Status: Draft'}
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Course: <strong>{quizSubject}</strong> &bull; Total Questions: <strong>{questions.length}</strong> &bull; Total Marks: <strong>{totalMarks} pts</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => {
              setIsPublished(!isPublished);
              showToast(isPublished ? 'Quiz set to Draft.' : 'Quiz Published to Students!');
            }}
            className="btn btn-outline"
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className={`fa-solid ${isPublished ? 'fa-eye-slash' : 'fa-globe'} me-2`}></i>
            {isPublished ? 'Unpublish' : 'Publish Quiz'}
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns (Question List on Left, Add Question Form on Right) */}
      <div className="quiz-builder-split-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        {/* Left: Questions Feed */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
              Configured Questions ({questions.length})
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Weightage: <strong>{totalMarks} Marks Total</strong>
            </span>
          </div>

          {questions.length === 0 ? (
            <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-clipboard-question" style={{ fontSize: '42px', opacity: '0.4', marginBottom: '12px', display: 'block' }}></i>
              <p style={{ margin: 0, fontWeight: '600' }}>No questions added yet.</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Use the question composer on the right to build your question bank.</p>
            </div>
          ) : (
            questions.map((q, idx) => (
              <div
                key={q.id}
                style={{
                  background: 'var(--card-bg, #fff)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '20px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontWeight: '800', fontSize: '12px', padding: '4px 8px', borderRadius: '6px', minWidth: '32px', textAlign: 'center' }}>
                      Q{idx + 1}
                    </span>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {q.question_text}
                    </h4>
                  </div>
                  <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', fontWeight: '700', fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }}>
                    {q.points} pts
                  </span>
                </div>

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '42px', marginBottom: '14px' }}>
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = q.correct_option === optIdx;
                    return (
                      <div
                        key={optIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '13.5px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-main, #f8fafc)',
                          border: isCorrect ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                          color: isCorrect ? '#065F46' : 'var(--text-primary)'
                        }}
                      >
                        {isCorrect ? (
                          <i className="fa-solid fa-circle-check" style={{ color: '#059669', fontSize: '16px' }}></i>
                        ) : (
                          <i className="fa-regular fa-circle" style={{ color: '#94A3B8', fontSize: '16px' }}></i>
                        )}
                        <span style={{ fontWeight: isCorrect ? '700' : '500' }}>
                          <strong style={{ marginRight: '6px' }}>{String.fromCharCode(65 + optIdx)}.</strong>
                          {opt}
                        </span>
                        {isCorrect && (
                          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '800', color: '#059669', textTransform: 'uppercase' }}>
                            Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Question Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px', paddingLeft: '42px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-lightbulb" style={{ color: '#F59E0B', marginRight: '6px' }}></i>
                    {q.explanation || 'No explanation provided.'}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(q.id)}
                    style={{ background: 'transparent', border: 'none', color: '#DC2626', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <i className="fa-solid fa-trash-can"></i> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Add New Question Composer */}
        <div className="quiz-composer-sticky" style={{ position: 'sticky', top: '24px' }}>
          <div
            style={{
              background: 'var(--card-bg, #fff)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                <i className="fa-solid fa-plus"></i>
              </div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Compose Question
              </h3>
            </div>

            <form onSubmit={handleAddQuestion}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  Question Text
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. In Linux, which command sets CPU affinity for a running process?"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: '13.5px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  Points / Score
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13.5px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                  Options &amp; Correct Answer Selection
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {newOptions.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name="correct_choice"
                        checked={correctOptionIdx === idx}
                        onChange={() => setCorrectOptionIdx(idx)}
                        style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                        title="Mark as correct answer"
                      />
                      <span style={{ fontSize: '13px', fontWeight: '800', width: '22px', color: correctOptionIdx === idx ? '#10B981' : '#64748B' }}>
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="form-control"
                        style={{ flex: 1, height: '36px', borderRadius: '6px', border: correctOptionIdx === idx ? '1.5px solid #10B981' : '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                        required
                      />
                    </div>
                  ))}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-circle-info me-1"></i> Click radio button to mark correct choice.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  Explanation &amp; Rationale (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why the selected answer is correct..."
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '8px 12px', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px 18px', borderRadius: '8px', background: '#7C3AED', border: 'none', color: '#fff', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <i className="fa-solid fa-plus"></i> Add Question to Bank
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgQuizzesBuilder;
