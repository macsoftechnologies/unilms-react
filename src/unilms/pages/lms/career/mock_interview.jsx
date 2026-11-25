import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import placementsService from '../../../services/placements.service';

const LmsCareerMockInterview = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

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

      <div className="interview-sim-container">
        <div className="sim-main-area">
          <div className="sim-question-bar">
            <div className="sim-q-badge"><i className="fa-solid fa-circle-question"></i> Question 3 of 10</div>
            <div className="sim-timer"><i className="fa-solid fa-clock"></i> 02:34</div>
          </div>

          <div className="sim-question-text">
            Explain the difference between an abstract class and an interface in Java. When would you use one over the other? Provide a real-world example.
          </div>

          <div className="answer-options-bar">
            <div className="answer-opt-btn active"><i className="fa-solid fa-keyboard"></i> Text Answer</div>
            <div className="answer-opt-btn"><i className="fa-solid fa-video"></i> Video Answer</div>
            <div className="answer-opt-btn"><i className="fa-solid fa-microphone"></i> Voice Answer</div>
          </div>

          <div className="sim-answer-area">
            <textarea defaultValue={`An abstract class can have both abstract and concrete methods, along with instance variables and constructors. It supports single inheritance through the 'extends' keyword.

An interface, on the other hand, defines a contract with only abstract methods (prior to Java 8), and a class can implement multiple interfaces.

Real-world example: Consider a Vehicle abstract class with common properties like speed and fuel, and an interface Chargeable for electric vehicles. A Tesla class would extend Vehicle and implement Chargeable.`} placeholder="Type your answer here... Be detailed and use examples to demonstrate your understanding." />
          </div>

          <div className="sim-nav-buttons">
            <button className="btn btn-outline"><i className="fa-solid fa-arrow-left"></i> Previous</button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline"><i className="fa-solid fa-forward"></i> Skip</button>
              <button className="btn btn-primary"><i className="fa-solid fa-paper-plane"></i> Submit Answer</button>
            </div>
          </div>
        </div>

        <div className="feedback-sidebar">
          <div className="feedback-title"><i className="fa-solid fa-star"></i> AI Feedback</div>

          <div className="feedback-score-ring">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" className="fsr-bg"/>
              <circle cx="50" cy="50" r="40" className="fsr-fill"/>
            </svg>
            <div className="fsr-label">
              <div className="fsr-value">75</div>
              <div className="fsr-text">Score</div>
            </div>
          </div>

          <div className="feedback-metrics">
            <div className="fb-metric">
              <span className="fb-metric-label">Accuracy</span>
              <div className="fb-metric-bar-wrap">
                <div className="fb-metric-bar"><div className="fb-metric-bar-fill" style={{ width: '85%', background: '#10b981' }}></div></div>
                <span className="fb-metric-val">85</span>
              </div>
            </div>
            <div className="fb-metric">
              <span className="fb-metric-label">Communication</span>
              <div className="fb-metric-bar-wrap">
                <div className="fb-metric-bar"><div className="fb-metric-bar-fill" style={{ width: '72%', background: '#f59e0b' }}></div></div>
                <span className="fb-metric-val">72</span>
              </div>
            </div>
            <div className="fb-metric">
              <span className="fb-metric-label">Depth</span>
              <div className="fb-metric-bar-wrap">
                <div className="fb-metric-bar"><div className="fb-metric-bar-fill" style={{ width: '68%', background: '#f59e0b' }}></div></div>
                <span className="fb-metric-val">68</span>
              </div>
            </div>
            <div className="fb-metric">
              <span className="fb-metric-label">Examples</span>
              <div className="fb-metric-bar-wrap">
                <div className="fb-metric-bar"><div className="fb-metric-bar-fill" style={{ width: '90%', background: '#10b981' }}></div></div>
                <span className="fb-metric-val">90</span>
              </div>
            </div>
          </div>

          <div className="fb-tips-box">
            <div className="fb-tips-title"><i className="fa-solid fa-lightbulb"></i> Improvement Tips</div>
            <div className="fb-tip-item">Mention Java 8+ default methods in interfaces for depth.</div>
            <div className="fb-tip-item">Add a comparison table for better structure.</div>
            <div className="fb-tip-item">Great real-world example with Tesla — keep this pattern!</div>
          </div>
        </div>
      </div>

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
