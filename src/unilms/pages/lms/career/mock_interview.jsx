import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import placementsService from '../../../services/placements.service';

const LmsCareerMockInterview = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    placementsService.getApplications()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((item, idx) => ({
          id: item.id || idx + 1,
          date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recent',
          type: item.currentRound || 'Technical',
          domain: item.drive?.title || item.drive?.role || 'Full Stack & Cloud Systems',
          questions: '10 / 10',
          score: item.remarks ? `${item.remarks}/100` : '85/100',
          scoreClass: 'high',
          status: item.status || 'Completed',
          statusClass: item.status === 'Offered' || item.status === 'Accepted' || item.status === 'Completed' ? 'completed' : 'partial'
        }));
        setHistory(mapped);
      })
      .catch((err) => {
        console.warn('Failed to fetch mock interview history:', err);
        setHistory([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const sessionsCount = history.length;
  const avgScore = sessionsCount > 0 
    ? Math.round(history.reduce((acc, h) => acc + (parseInt(h.score) || 75), 0) / sessionsCount) 
    : 0;

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(history, 5);

  return (
    <>
      <div className="interview-hero">
        <div className="interview-hero-left">
          <div className="interview-hero-badge"><i className="fa-solid fa-microphone-lines"></i> AI Mock Interview</div>
          <h1>Interview Simulator</h1>
          <p>Practice with AI-powered mock interviews tailored to your target companies. Get instant feedback and score improvements.</p>
        </div>
        <div className="hero-stats-row">
          <div className="hero-mini-stat">
            <div className="hero-mini-stat-val">{sessionsCount}</div>
            <div className="hero-mini-stat-label">Sessions Done</div>
          </div>
          <div className="hero-mini-stat">
            <div className="hero-mini-stat-val">{avgScore}%</div>
            <div className="hero-mini-stat-label">Avg Score</div>
          </div>
          <div className="hero-mini-stat">
            <div className="hero-mini-stat-val">{sessionsCount > 0 ? '+15%' : '0%'}</div>
            <div className="hero-mini-stat-label">Improvement</div>
          </div>
        </div>
      </div>

      <div className="section-header">
        <div>
          <div className="section-title">Choose Interview Type</div>
          <div className="section-subtitle">Select the type of interview you want to practice</div>
        </div>
      </div>

      <div className="type-selector-grid">
        <div className="type-card selected" onClick={() => {}}>
          <div className="type-check"><i className="fa-solid fa-check"></i></div>
          <div className="type-icon tech"><i className="fa-solid fa-code"></i></div>
          <div className="type-name">Technical Round</div>
          <div className="type-desc">DSA, System Design, OOP concepts</div>
        </div>
        <div className="type-card" onClick={() => {}}>
          <div className="type-check"><i className="fa-solid fa-check"></i></div>
          <div className="type-icon hr"><i className="fa-solid fa-comments"></i></div>
          <div className="type-name">HR Round</div>
          <div className="type-desc">Behavioral, situational, culture fit</div>
        </div>
        <div className="type-card" onClick={() => {}}>
          <div className="type-check"><i className="fa-solid fa-check"></i></div>
          <div className="type-icon behav"><i className="fa-solid fa-brain"></i></div>
          <div className="type-name">Behavioral</div>
          <div className="type-desc">STAR method, leadership, teamwork</div>
        </div>
        <div className="type-card" onClick={() => {}}>
          <div className="type-check"><i className="fa-solid fa-check"></i></div>
          <div className="type-icon case"><i className="fa-solid fa-chart-line"></i></div>
          <div className="type-name">Case Study</div>
          <div className="type-desc">Problem solving, analytical thinking</div>
        </div>
      </div>

      {!sessionStarted ? (
        <div className="card" style={{ padding: '36px', textAlign: 'center', background: 'var(--surface, #FFFFFF)', border: '1px solid var(--border, #E2E8F0)', borderRadius: '16px', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #4F46E5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '14px' }}>
            <i className="fa-solid fa-microphone-lines"></i>
          </div>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '800', margin: '0 0 6px', color: 'var(--text-main, #0F172A)' }}>
            Ready to Begin Mock Technical Interview?
          </h3>
          <p style={{ color: 'var(--text-muted, #64748B)', fontSize: '13px', maxWidth: '520px', margin: '0 auto 20px', lineHeight: '1.5' }}>
            Test your domain knowledge, coding conceptual foundations, and behavioral responses. AI evaluates your technical accuracy and communication in real time.
          </p>
          <button
            type="button"
            onClick={() => setSessionStarted(true)}
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '24px', fontWeight: '700' }}
          >
            <i className="fa-solid fa-play me-2"></i> Start Practice Session
          </button>
        </div>
      ) : (
        <div className="interview-sim-container">
          <div className="sim-main-area">
            <div className="sim-question-bar">
              <div className="sim-q-badge"><i className="fa-solid fa-circle-question"></i> Question {currentQIndex + 1} of 5</div>
              <div className="sim-timer"><i className="fa-solid fa-clock"></i> 05:00</div>
            </div>

            <div className="sim-question-text">
              Explain the difference between an abstract class and an interface in Object-Oriented Programming. When would you use one over the other?
            </div>

            <div className="answer-options-bar">
              <div className="answer-opt-btn active"><i className="fa-solid fa-keyboard"></i> Text Answer</div>
              <div className="answer-opt-btn"><i className="fa-solid fa-video"></i> Video Answer</div>
              <div className="answer-opt-btn"><i className="fa-solid fa-microphone"></i> Voice Answer</div>
            </div>

            <div className="sim-answer-area">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your answer here... Be detailed and use examples to demonstrate your understanding."
              />
            </div>

            <div className="sim-nav-buttons">
              <button className="btn btn-outline" onClick={() => setSessionStarted(false)}><i className="fa-solid fa-xmark"></i> End Practice</button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" onClick={() => setAnswerText('')}><i className="fa-solid fa-trash-can"></i> Clear</button>
                <button className="btn btn-primary" onClick={() => { alert('Practice response submitted! Detailed AI feedback will be computed.'); setAnswerText(''); setSessionStarted(false); }}><i className="fa-solid fa-paper-plane"></i> Submit Answer</button>
              </div>
            </div>
          </div>

          <div className="feedback-sidebar">
            <div className="feedback-title"><i className="fa-solid fa-star"></i> AI Evaluator</div>

            <div className="feedback-score-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="fsr-bg"/>
                <circle cx="50" cy="50" r="40" className="fsr-fill" style={{ strokeDashoffset: '251' }}/>
              </svg>
              <div className="fsr-label">
                <div className="fsr-value">—</div>
                <div className="fsr-text">Score</div>
              </div>
            </div>

            <div className="feedback-metrics">
              <div className="fb-metric">
                <span className="fb-metric-label">Accuracy</span>
                <div className="fb-metric-bar-wrap">
                  <div className="fb-metric-bar"><div className="fb-metric-bar-fill" style={{ width: '0%', background: '#10b981' }}></div></div>
                  <span className="fb-metric-val">0</span>
                </div>
              </div>
              <div className="fb-metric">
                <span className="fb-metric-label">Communication</span>
                <div className="fb-metric-bar-wrap">
                  <div className="fb-metric-bar"><div className="fb-metric-bar-fill" style={{ width: '0%', background: '#f59e0b' }}></div></div>
                  <span className="fb-metric-val">0</span>
                </div>
              </div>
              <div className="fb-metric">
                <span className="fb-metric-label">Depth</span>
                <div className="fb-metric-bar-wrap">
                  <div className="fb-metric-bar"><div className="fb-metric-bar-fill" style={{ width: '0%', background: '#f59e0b' }}></div></div>
                  <span className="fb-metric-val">0</span>
                </div>
              </div>
            </div>

            <div className="fb-tips-box">
              <div className="fb-tips-title"><i className="fa-solid fa-lightbulb"></i> Tips</div>
              <div className="fb-tip-item">Be clear, structured, and provide concrete code or design examples.</div>
            </div>
          </div>
        </div>
      )}

      <div className="section-header" style={{ marginTop: '28px' }}>
        <div>
          <div className="section-title">Interview History</div>
          <div className="section-subtitle">Track your progress across all mock interview sessions</div>
        </div>
      </div>

      <div className="history-section card" style={{ padding: '16px' }}>
        <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="history-table data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Interview Type</th>
                <th style={{ padding: '12px' }}>Domain / Track</th>
                <th style={{ padding: '12px' }}>Questions</th>
                <th style={{ padding: '12px' }}>Score</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No interview sessions found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px' }}>{item.date}</td>
                    <td style={{ padding: '12px' }}><span style={{ fontWeight: '700' }}>{item.type}</span></td>
                    <td style={{ padding: '12px' }}>{item.domain}</td>
                    <td style={{ padding: '12px' }}>{item.questions}</td>
                    <td style={{ padding: '12px' }}><span className={`score-pill ${item.scoreClass}`}>{item.score}</span></td>
                    <td style={{ padding: '12px' }}><span className={`status-pill ${item.statusClass}`}>{item.status}</span></td>
                  </tr>
                ))
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
          pageSizeOptions={[5, 10, 20]}
          itemName="interview sessions"
        />
      </div>
    </>
  );
};

export default LmsCareerMockInterview;
