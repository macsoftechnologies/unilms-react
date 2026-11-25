import React from 'react';
import { Link } from 'react-router-dom';

const LmsCareerIndex = () => {
  return (
    <>
      {/* Career Suite Hero Banner */}
      <div className="career-hero">
        <div className="career-hero-inner">
          <div className="career-hero-badge">
            <i className="fa-solid fa-sparkles"></i>
            <span>Career & Employability Suite</span>
          </div>
          <h1>Your Launchpad to <span className="gradient-text">Dream Career</span></h1>
          <p className="career-hero-desc">
            From crafting ATS-optimized resumes to acing mock interviews and landing placement offers — 
            everything you need to be industry-ready, all in one platform.
          </p>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '24px'
        }}
      >
        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid #E11D48',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Resume ATS Score
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#E11D48', marginTop: '2px', lineHeight: '1.2' }}>
            87 <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-check-circle me-1"></i> AI Optimized & Ready
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--success, #10B981)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Mock Interviews Done
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
            12 <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Sessions</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-check-circle me-1"></i> Practice Complete
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid #06B6D4',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Drives Applied
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
            5 <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Active</span>
          </div>
          <div style={{ fontSize: '10px', color: '#06B6D4', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-paper-plane me-1"></i> Active Submissions
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--warning, #F59E0B)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Portfolio Views
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            234 <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Views</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--warning, #F59E0B)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-chart-line me-1"></i> Recruiter Analytics
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="career-section-title">Explore Your Career Toolkit</div>
      <p className="career-section-desc">Choose a module to get started on your career journey. Each tool is designed to give you an edge.</p>

      <div className="career-modules-grid">
        {/* Module 1: Resume Builder */}
        <Link to="/unilms/lms/career/resume" className="career-module-card">
          <div className="module-icon-circle m1"><i className="fa-solid fa-file-lines"></i></div>
          <div className="module-title">AI-Powered ATS Resume Builder</div>
          <div className="module-desc">Build a recruiter-ready resume with AI suggestions, ATS score optimization, and professional templates.</div>
          <div className="module-tags">
            <span className="module-tag">AI Powered</span>
            <span className="module-tag">ATS Score</span>
            <span className="module-tag">PDF Export</span>
          </div>
          <div className="module-cta">Launch Builder <i className="fa-solid fa-arrow-right"></i></div>
        </Link>

        {/* Module 2: Mock Interview */}
        <Link to="/unilms/lms/career/mock_interview" className="career-module-card">
          <div className="module-icon-circle m2"><i className="fa-solid fa-microphone-lines"></i></div>
          <div className="module-title">AI Mock Interview Simulator</div>
          <div className="module-desc">Practice technical & HR interviews with AI-powered feedback, scoring, and company-specific question banks.</div>
          <div className="module-tags">
            <span className="module-tag">Technical</span>
            <span className="module-tag">HR Round</span>
            <span className="module-tag">AI Feedback</span>
          </div>
          <div className="module-cta">Start Practice <i className="fa-solid fa-arrow-right"></i></div>
        </Link>

        {/* Module 3: Portfolio */}
        <Link to="/unilms/lms/career/portfolio" className="career-module-card">
          <div className="module-icon-circle m5"><i className="fa-solid fa-globe"></i></div>
          <div className="module-title">Digital Web Portfolio</div>
          <div className="module-desc">Create a stunning personal portfolio website with projects, skills, and achievements — shareable via link & QR.</div>
          <div className="module-tags">
            <span className="module-tag">Public Link</span>
            <span className="module-tag">QR Code</span>
            <span className="module-tag">Analytics</span>
          </div>
          <div className="module-cta">Build Portfolio <i className="fa-solid fa-arrow-right"></i></div>
        </Link>
      </div>

      {/* Getting Started Section */}
      <div className="career-section-title">🚀 Getting Started</div>
      <p className="career-section-desc">Follow these 3 steps to maximize your placement readiness.</p>

      <div className="getting-started-box">
        <div className="gs-steps">
          <div className="gs-step">
            <div className="gs-step-num">1</div>
            <div>
              <div className="gs-step-title">Build Your Resume</div>
              <div className="gs-step-desc">Start with the AI Resume Builder to create an ATS-optimized resume that gets noticed.</div>
            </div>
          </div>
          <div className="gs-step">
            <div className="gs-step-num">2</div>
            <div>
              <div className="gs-step-title">Practice Interviews</div>
              <div className="gs-step-desc">Run mock interview sessions and use AI feedback to improve your responses.</div>
            </div>
          </div>
          <div className="gs-step">
            <div className="gs-step-num">3</div>
            <div>
              <div className="gs-step-title">Apply & Get Placed</div>
              <div className="gs-step-desc">Apply to placement drives with 1-click and track your shortlisting status live.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LmsCareerIndex;