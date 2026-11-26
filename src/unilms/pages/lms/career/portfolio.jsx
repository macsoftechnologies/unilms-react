import React, { useState } from 'react';

const LmsCareerPortfolio = () => {
  const [selectedTheme, setSelectedTheme] = useState('minimal');
  const [copied, setCopied] = useState(false);
  const [projects, setProjects] = useState([]);

  const qrCells = [
    1, 1, 1, 0, 1, 1, 1,
    1, 0, 1, 0, 1, 0, 1,
    1, 1, 1, 0, 1, 1, 1,
    0, 0, 0, 1, 0, 0, 0,
    1, 0, 1, 1, 1, 0, 1,
    0, 1, 0, 0, 0, 1, 0,
    1, 1, 1, 0, 1, 1, 1
  ];

  const user = (() => { try { return JSON.parse(localStorage.getItem('unilms_user') || '{}'); } catch { return {}; } })();
  const studentSlug = (user.name || user.email || 'student').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const portfolioUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${studentSlug}` : `https://unilms.edu/p/${studentSlug}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(portfolioUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="portfolio-hero">
        <div className="portfolio-hero-left">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
            <div className="portfolio-hero-badge">
              <i className="fa-solid fa-globe"></i> Digital Portfolio
            </div>
            <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#4F46E5', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
              <i className="fa-solid fa-laptop-code me-1"></i> Interactive In-Browser Tool
            </span>
          </div>
          <h1>Your Web Portfolio</h1>
          <p>
            Create a stunning personal portfolio with projects, skills, and achievements. Share it with recruiters via a public link or QR code.
          </p>
        </div>
        <div className="share-controls">
          <div className="qr-placeholder">
            <div className="qr-inner">
              {qrCells.map((cell, idx) => (
                <div key={idx} className={`qr-cell ${cell ? 'dark' : 'light'}`}></div>
              ))}
            </div>
          </div>
          <div className="share-url-box" onClick={handleCopy} title="Click to copy URL">
            <i className="fa-solid fa-link"></i>
            <span>{portfolioUrl.replace(/^https?:\/\//, '')}</span>
            <i className={`fa-solid ${copied ? 'fa-check text-green-400' : 'fa-copy'}`}></i>
          </div>
        </div>
      </div>

      <div className="analytics-row">
        <div className="analytics-card">
          <div className="ac-icon views"><i className="fa-solid fa-eye"></i></div>
          <div>
            <div className="ac-value">0</div>
            <div className="ac-label">Total Views</div>
            <div className="ac-change up" style={{ color: 'var(--text-muted, #64748B)' }}>New Portfolio</div>
          </div>
        </div>
        <div className="analytics-card">
          <div className="ac-icon clicks"><i className="fa-solid fa-mouse-pointer"></i></div>
          <div>
            <div className="ac-value">0</div>
            <div className="ac-label">Project Clicks</div>
            <div className="ac-change up" style={{ color: 'var(--text-muted, #64748B)' }}>No Clicks Yet</div>
          </div>
        </div>
        <div className="analytics-card">
          <div className="ac-icon recruiter"><i className="fa-solid fa-user-tie"></i></div>
          <div>
            <div className="ac-value">0</div>
            <div className="ac-label">Recruiter Visits</div>
            <div className="ac-change up" style={{ color: 'var(--text-muted, #64748B)' }}>Share Link to Track</div>
          </div>
        </div>
        <div className="analytics-card">
          <div className="ac-icon downloads"><i className="fa-solid fa-download"></i></div>
          <div>
            <div className="ac-value">0</div>
            <div className="ac-label">Resume Downloads</div>
            <div className="ac-change down" style={{ color: 'var(--text-muted, #64748B)' }}>0 Downloads</div>
          </div>
        </div>
      </div>

      <div className="section-title">Portfolio Theme</div>
      <p className="section-subtitle">Choose a visual theme for your public portfolio page</p>

      <div className="themes-row">
        <div 
          className={`theme-card ${selectedTheme === 'minimal' ? 'selected' : ''}`} 
          onClick={() => setSelectedTheme('minimal')}
        >
          <div className="theme-selected-check"><i className="fa-solid fa-check"></i></div>
          <div className="theme-preview tp-minimal">
            <div className="tp-mock-layout">
              <div className="tp-mock-nav"></div>
              <div className="tp-mock-hero"></div>
              <div className="tp-mock-grid">
                <div className="tp-mock-card"></div>
                <div className="tp-mock-card"></div>
              </div>
            </div>
          </div>
          <div className="theme-info">
            <div className="theme-name">Minimal Clean</div>
            <div className="theme-tag">Professional & simple</div>
          </div>
        </div>

        <div 
          className={`theme-card ${selectedTheme === 'developer' ? 'selected' : ''}`} 
          onClick={() => setSelectedTheme('developer')}
        >
          <div className="theme-selected-check"><i className="fa-solid fa-check"></i></div>
          <div className="theme-preview tp-developer">
            <div className="tp-mock-layout">
              <div className="tp-mock-nav"></div>
              <div className="tp-mock-hero"></div>
              <div className="tp-mock-grid">
                <div className="tp-mock-card"></div>
                <div className="tp-mock-card"></div>
              </div>
            </div>
          </div>
          <div className="theme-info">
            <div className="theme-name">Developer Dark</div>
            <div className="theme-tag">For engineers & devs</div>
          </div>
        </div>

        <div 
          className={`theme-card ${selectedTheme === 'creative' ? 'selected' : ''}`} 
          onClick={() => setSelectedTheme('creative')}
        >
          <div className="theme-selected-check"><i className="fa-solid fa-check"></i></div>
          <div className="theme-preview tp-creative">
            <div className="tp-mock-layout">
              <div className="tp-mock-nav"></div>
              <div className="tp-mock-hero"></div>
              <div className="tp-mock-grid">
                <div className="tp-mock-card"></div>
                <div className="tp-mock-card"></div>
              </div>
            </div>
          </div>
          <div className="theme-info">
            <div className="theme-name">Creative Blush</div>
            <div className="theme-tag">For designers</div>
          </div>
        </div>

        <div 
          className={`theme-card ${selectedTheme === 'academic' ? 'selected' : ''}`} 
          onClick={() => setSelectedTheme('academic')}
        >
          <div className="theme-selected-check"><i className="fa-solid fa-check"></i></div>
          <div className="theme-preview tp-academic">
            <div className="tp-mock-layout">
              <div className="tp-mock-nav"></div>
              <div className="tp-mock-hero"></div>
              <div className="tp-mock-grid">
                <div className="tp-mock-card"></div>
                <div className="tp-mock-card"></div>
              </div>
            </div>
          </div>
          <div className="theme-info">
            <div className="theme-name">Academic Gold</div>
            <div className="theme-tag">For researchers</div>
          </div>
        </div>
      </div>


<div className="section-title">Portfolio Sections</div>
<p className="section-subtitle">Drag to reorder, click edit to modify content</p>

<div className="portfolio-builder">
    <div className="pb-toolbar">
        <div className="pb-toolbar-title"><i className="fa-solid fa-layer-group"></i> Section Manager</div>
        <div className="pb-toolbar-actions">
            <button className="btn btn-sm btn-outline"><i className="fa-solid fa-plus"></i> Add Section</button>
            <button className="btn btn-sm btn-primary"><i className="fa-solid fa-rocket"></i> Publish</button>
        </div>
    </div>
    <div className="pb-sections-list">
        <div className="pb-section-item">
            <i className="fa-solid fa-grip-vertical pb-drag-handle"></i>
            <div className="pb-section-icon pb-si-about"><i className="fa-solid fa-user"></i></div>
            <div className="pb-section-info">
                <div className="pb-section-name">About Me</div>
                <div className="pb-section-desc">Introduction, bio, profile photo</div>
            </div>
            <span className="pb-section-status draft"><i className="fa-solid fa-clock"></i> Draft</span>
            <div className="pb-section-actions">
                <button className="pb-edit-btn" title="Edit"><i className="fa-solid fa-pen"></i></button>
            </div>
        </div>
        <div className="pb-section-item">
            <i className="fa-solid fa-grip-vertical pb-drag-handle"></i>
            <div className="pb-section-icon pb-si-projects"><i className="fa-solid fa-diagram-project"></i></div>
            <div className="pb-section-info">
                <div className="pb-section-name">Projects</div>
                <div className="pb-section-desc">{projects.length > 0 ? `${projects.length} projects showcased` : 'Add your academic & personal projects'}</div>
            </div>
            <span className={`pb-section-status ${projects.length > 0 ? 'complete' : 'empty'}`}>
                <i className={`fa-solid ${projects.length > 0 ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i> {projects.length > 0 ? 'Complete' : 'Empty'}
            </span>
            <div className="pb-section-actions">
                <button className="pb-edit-btn" title="Edit"><i className="fa-solid fa-pen"></i></button>
            </div>
        </div>
        <div className="pb-section-item">
            <i className="fa-solid fa-grip-vertical pb-drag-handle"></i>
            <div className="pb-section-icon pb-si-skills"><i className="fa-solid fa-chart-bar"></i></div>
            <div className="pb-section-info">
                <div className="pb-section-name">Skills & Expertise</div>
                <div className="pb-section-desc">Add technical skills and proficiency levels</div>
            </div>
            <span className="pb-section-status draft"><i className="fa-solid fa-clock"></i> Draft</span>
            <div className="pb-section-actions">
                <button className="pb-edit-btn" title="Edit"><i className="fa-solid fa-pen"></i></button>
            </div>
        </div>
        <div className="pb-section-item">
            <i className="fa-solid fa-grip-vertical pb-drag-handle"></i>
            <div className="pb-section-icon pb-si-experience"><i className="fa-solid fa-briefcase"></i></div>
            <div className="pb-section-info">
                <div className="pb-section-name">Experience</div>
                <div className="pb-section-desc">Add internships, co-ops or freelance work</div>
            </div>
            <span className="pb-section-status empty"><i className="fa-solid fa-exclamation-circle"></i> Empty</span>
            <div className="pb-section-actions">
                <button className="pb-edit-btn" title="Edit"><i className="fa-solid fa-pen"></i></button>
            </div>
        </div>
        <div className="pb-section-item">
            <i className="fa-solid fa-grip-vertical pb-drag-handle"></i>
            <div className="pb-section-icon pb-si-education"><i className="fa-solid fa-graduation-cap"></i></div>
            <div className="pb-section-info">
                <div className="pb-section-name">Education</div>
                <div className="pb-section-desc">{user.program || 'Degree Program Enrolled'}</div>
            </div>
            <span className="pb-section-status complete"><i className="fa-solid fa-check-circle"></i> Enrolled</span>
            <div className="pb-section-actions">
                <button className="pb-edit-btn" title="View"><i className="fa-solid fa-eye"></i></button>
            </div>
        </div>
        <div className="pb-section-item">
            <i className="fa-solid fa-grip-vertical pb-drag-handle"></i>
            <div className="pb-section-icon pb-si-contact"><i className="fa-solid fa-envelope"></i></div>
            <div className="pb-section-info">
                <div className="pb-section-name">Contact</div>
                <div className="pb-section-desc">{user.email || 'Email and student contact'}</div>
            </div>
            <span className="pb-section-status complete"><i className="fa-solid fa-check-circle"></i> Complete</span>
            <div className="pb-section-actions">
                <button className="pb-edit-btn" title="Edit"><i className="fa-solid fa-pen"></i></button>
            </div>
        </div>
    </div>
</div>


<div className="projects-preview">
    <div className="section-title">Your Projects</div>
    <p className="section-subtitle">These projects are showcased on your public portfolio</p>

    <div className="projects-grid">
        {projects.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '36px', textAlign: 'center', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '16px' }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: '32px', color: '#94a3b8', marginBottom: '8px', display: 'block' }}></i>
                <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main, #0F172A)' }}>No Showcase Projects Added Yet</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748B)', marginTop: '4px' }}>Add your academic assignments, capstone projects, and GitHub repositories to showcase to recruiters.</div>
            </div>
        ) : (
            projects.map((p, idx) => (
                <div key={idx} className="project-card">
                    <div className="project-thumb" style={{"background":"linear-gradient(135deg, #1e1b4b, #4338ca)"}}>
                        <div className="project-thumb-overlay"></div>
                        <i className="fa-solid fa-graduation-cap" style={{"color":"rgba(255,255,255,0.3)"}}></i>
                    </div>
                    <div className="project-body">
                        <div className="project-name">{p.name}</div>
                        <div className="project-desc">{p.desc}</div>
                        <div className="project-tech-tags">
                            {p.tags?.map((t, tidx) => <span key={tidx} className="project-tech-tag">{t}</span>)}
                        </div>
                    </div>
                </div>
            ))
        )}
    </div>
</div>




</>
  );
};

export default LmsCareerPortfolio;