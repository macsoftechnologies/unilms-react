import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const defaultMentorshipData = {
  companyName: 'Industry Partner Practicum',
  internName: 'Student Intern',
  rollNumber: 'INT-ONLINE',
  roleTitle: 'Cloud Engineering Practicum',
  progressPct: 75,
  milestones: [
    {
      id: 1,
      number: 1,
      title: 'Environment Provisioning & Microservice Architecture Setup',
      tasks: [
        {
          id: 101,
          title: 'Containerize Backend Services with Multi-Stage Dockerfile',
          estimatedHours: 16,
          trackedHours: 18.5,
          signedOff: true,
          feedback: 'Clean multi-stage build configuration; reduced final image footprint below 85MB.',
          submissionLink: 'https://github.com/campus-internship/cloud-infra'
        },
        {
          id: 102,
          title: 'Configure PostgreSQL Database Connection Pool & Prisma Migration Script',
          estimatedHours: 12,
          trackedHours: 11.0,
          signedOff: true,
          feedback: 'Verified connection pooling parameters and zero unapplied schema migrations.',
          submissionLink: 'https://github.com/campus-internship/db-migrations'
        }
      ]
    },
    {
      id: 2,
      number: 2,
      title: 'Production Integration & Load Testing',
      tasks: [
        {
          id: 201,
          title: 'Implement JWT Token Refresh Invariants and RBAC Protected Routes',
          estimatedHours: 20,
          trackedHours: 19.0,
          signedOff: false,
          feedback: '',
          submissionLink: 'https://github.com/campus-internship/auth-security'
        }
      ]
    }
  ],
  midRating: 9.0,
  midReview: 'Demonstrates outstanding system design discipline and quick grasp of microservices orchestration.',
  finalSignoff: 'Recommended for corporate pre-placement offer (PPO) evaluation.'
};

const SupervisorPortal = () => {
  const [data, setData] = useState(defaultMentorshipData);
  const [feedbackInput, setFeedbackInput] = useState({});
  const [toastMsg, setToastMsg] = useState(null);

  const handleSignoff = (taskId) => {
    const remarks = feedbackInput[taskId]?.trim() || 'Approved by Industry Supervisor.';
    setData(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => ({
        ...m,
        tasks: m.tasks.map(t => t.id === taskId ? { ...t, signedOff: true, feedback: remarks } : t)
      }))
    }));
    setToastMsg(`Task sign-off recorded with feedback: "${remarks}"`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="container" style={{ maxWidth: '1050px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', color: '#fff', padding: '28px 32px', borderRadius: '20px', marginBottom: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,0.15)', color: '#E0E7FF', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block' }}>
                <i className="fas fa-magic me-1"></i> Industry Supervisor Portal
              </span>
              <span style={{ background: 'rgba(99, 102, 241, 0.25)', color: '#C7D2FE', padding: '4px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '700' }}>
                <i className="fa-solid fa-laptop-code me-1"></i> Interactive In-Browser Tool
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px' }}>
              {data.companyName} Mentorship Dossier
            </h1>
            <p style={{ margin: 0, color: '#C7D2FE', fontSize: '14px' }}>
              Mentee: <strong>{data.internName}</strong> ({data.rollNumber}) &bull; {data.roleTitle}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#C7D2FE', marginBottom: '4px' }}>
              Internship Milestone Progress
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '160px', height: '10px', background: 'rgba(255,255,255,0.25)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${data.progressPct}%`, height: '100%', background: '#10B981', borderRadius: '10px' }}></div>
              </div>
              <span style={{ fontSize: '18px', fontWeight: '800' }}>{data.progressPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '12px', marginBottom: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-circle-check"></i>
          {toastMsg}
        </div>
      )}

      {/* Deliverables and Sign-offs */}
      <div className="card" style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-tasks" style={{ color: '#6366F1' }}></i>
          Corporate Milestones & Technical Deliverables
        </h2>

        {data.milestones.map(m => (
          <div key={m.id} style={{ border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', marginBottom: '18px', background: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#4F46E5', margin: 0 }}>
                Milestone {m.number}: {m.title}
              </h3>
            </div>

            {m.tasks.map(t => (
              <div key={t.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>{t.title}</div>
                    <small style={{ color: '#64748B' }}>
                      Estimated: {t.estimatedHours} hrs &bull; Tracked: {t.trackedHours} hrs
                    </small>
                  </div>
                  <div>
                    {t.signedOff ? (
                      <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <i className="fas fa-check me-1"></i> Corporate Signed-Off
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        Pending Sign-Off
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12.5px', marginBottom: '10px' }}>
                  <strong>Code Repository:</strong> <a href={t.submissionLink} target="_blank" rel="noreferrer" style={{ color: '#6366F1' }}>{t.submissionLink}</a>
                </div>

                {!t.signedOff ? (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Add industry mentor remarks..." 
                      value={feedbackInput[t.id] || ''} 
                      onChange={(e) => setFeedbackInput({ ...feedbackInput, [t.id]: e.target.value })}
                      style={{ flexGrow: 1, padding: '7px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => handleSignoff(t.id)} 
                      style={{ padding: '7px 16px', borderRadius: '8px', background: '#10B981', color: '#fff', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      <i className="fas fa-signature me-1"></i> Sign-off Task
                    </button>
                  </div>
                ) : (
                  <div style={{ color: '#059669', fontWeight: '600', fontSize: '12.5px', marginTop: '6px' }}>
                    <i className="fas fa-check-circle me-1"></i> Signed off with feedback: "{t.feedback}"
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Corporate Mid & Final Reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card" style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
            Mid-Term Corporate Evaluation
          </h3>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#4F46E5', marginBottom: '6px' }}>
            Rating: {data.midRating} / 10.0
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
            "{data.midReview}"
          </p>
        </div>

        <div className="card" style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
            Final Corporate Endorsement
          </h3>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#10B981', marginBottom: '6px' }}>
            Status: Endorsed for PPO
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
            "{data.finalSignoff}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupervisorPortal;
