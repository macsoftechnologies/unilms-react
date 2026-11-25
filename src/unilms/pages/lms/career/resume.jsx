import React, { useState } from 'react';
import { useTenant } from '../../../context/TenantContext';

const LmsCareerResume = () => {
    const { currentTenant } = useTenant();
    const instName = currentTenant?.name || 'Institution';

    const userStr = localStorage.getItem('unilms_user');
    const user = userStr ? JSON.parse(userStr) : null;

    const [profile, setProfile] = useState({
        fullName: user?.name || user?.fullName || 'Student',
        title: 'Full Stack Software Engineer',
        email: user?.email || 'student@institution.edu',
        phone: user?.phone || '+91 98765 43210',
        linkedIn: user?.rollNumber ? `linkedin.com/in/${user.rollNumber.toLowerCase()}` : 'linkedin.com/in/student',
        degree: 'B.Tech Computer Science & Engineering',
        institution: instName,
        cgpa: '8.8 / 10',
        duration: '2023 – 2027',
        experienceRole: 'Software Engineering Intern',
        company: 'Enterprise Tech Solutions',
        experienceDesc: 'Built scalable RESTful APIs using Node.js and TypeScript. Implemented CI/CD workflows and Docker containerization.',
        projectTitle: 'UniLMS — Next-Gen Campus ERP',
        projectDesc: 'Designed and deployed multi-tenant education management platform supporting role-based access control and high-concurrency exams.',
        skills: ['JavaScript', 'TypeScript', 'React.js', 'Node.js', 'PostgreSQL', 'Docker', 'Git', 'AWS']
    });

    const [newSkill, setNewSkill] = useState('');

    const handleProfileChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
            setProfile(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
    };

    return (
        <>
            <div className="resume-hero">
                <div className="resume-hero-left">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <div className="resume-hero-badge"><i className="fa-solid fa-sparkles"></i> AI-Powered</div>
                        <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#4F46E5', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                            <i className="fa-solid fa-laptop-code me-1"></i> Interactive In-Browser Tool
                        </span>
                    </div>
                    <h1>ATS Resume Builder</h1>
                    <p>Craft an interview-winning resume with AI suggestions, ATS optimization, and professional templates.</p>
                </div>
                <div className="ats-ring-box">
                    <div className="ats-ring">
                        <svg viewBox="0 0 120 120">
                            <defs>
                                <linearGradient id="atsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ "stopColor": "#a78bfa" }} />
                                    <stop offset="100%" style={{ "stopColor": "#10b981" }} />
                                </linearGradient>
                            </defs>
                            <circle cx="60" cy="60" r="55" className="ats-ring-bg" />
                            <circle cx="60" cy="60" r="55" className="ats-ring-progress" />
                        </svg>
                        <div className="ats-ring-label">
                            <div className="ats-ring-value">87</div>
                            <div className="ats-ring-text">ATS Score</div>
                        </div>
                    </div>
                </div>
            </div>


            <div className="ai-suggestions-bar">
                <div className="ai-suggestion-header">
                    <div className="ai-sparkle-icon"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                    <div>
                        <div className="ai-suggestion-title">AI Improvement Suggestions</div>
                        <div style={{ "fontSize": "11.5px", "color": "var(--text-muted)" }}>Based on analysis of 50,000+ successful resumes</div>
                    </div>
                </div>
                <div className="ai-suggestion-items">
                    <div className="ai-suggestion-item">
                        <i className="fa-solid fa-lightbulb"></i>
                        <span>Add 2-3 more <strong>quantifiable achievements</strong> in your experience section to boost ATS score by ~8 points.</span>
                    </div>
                    <div className="ai-suggestion-item">
                        <i className="fa-solid fa-lightbulb"></i>
                        <span>Include keywords like <strong>"REST API", "CI/CD", "Agile"</strong> — they appear in 78% of matching job descriptions.</span>
                    </div>
                    <div className="ai-suggestion-item">
                        <i className="fa-solid fa-lightbulb"></i>
                        <span>Your <strong>skills section</strong> is strong. Consider adding a "Certifications" section for extra credibility.</span>
                    </div>
                </div>
            </div>


            <div className="section-bar">
                <div>
                    <div className="section-title">Choose Template</div>
                    <div className="section-subtitle">Select a professional template for your resume</div>
                </div>
            </div>

            <div className="templates-row">
                <div className="template-card selected" onClick={() => { }}>
                    <div className="selected-check"><i className="fa-solid fa-check"></i></div>
                    <div className="template-preview">
                        <div className="template-mini-resume tmr-clean">
                            <div className="tmr-header"><div className="tmr-avatar"></div><div className="tmr-name">{profile.fullName}</div></div>
                            <div className="tmr-line w80"></div><div className="tmr-line w60"></div><div className="tmr-line w70"></div>
                            <div className="tmr-line w40"></div><div className="tmr-line w80"></div>
                        </div>
                    </div>
                    <div className="template-info">
                        <div className="template-name">Clean Professional</div>
                        <div className="template-tag">Best for freshers</div>
                    </div>
                </div>
                <div className="template-card" onClick={() => { }}>
                    <div className="selected-check"><i className="fa-solid fa-check"></i></div>
                    <div className="template-preview">
                        <div className="template-mini-resume tmr-modern">
                            <div className="tmr-header"><div className="tmr-avatar"></div><div className="tmr-name" style={{ "color": "#e2e8f0" }}>{profile.fullName}</div></div>
                            <div className="tmr-line w80"></div><div className="tmr-line w60"></div><div className="tmr-line w70"></div>
                            <div className="tmr-line w40"></div><div className="tmr-line w80"></div>
                        </div>
                    </div>
                    <div className="template-info">
                        <div className="template-name">Modern Dark</div>
                        <div className="template-tag">Standout design</div>
                    </div>
                </div>
                <div className="template-card" onClick={() => { }}>
                    <div className="selected-check"><i className="fa-solid fa-check"></i></div>
                    <div className="template-preview">
                        <div className="template-mini-resume tmr-executive">
                            <div className="tmr-header"><div className="tmr-avatar" style={{ "background": "linear-gradient(135deg, #f59e0b, #d97706)" }}></div><div className="tmr-name">{profile.fullName}</div></div>
                            <div className="tmr-line w80"></div><div className="tmr-line w60"></div><div className="tmr-line w70"></div>
                            <div className="tmr-line w40"></div><div className="tmr-line w80"></div>
                        </div>
                    </div>
                    <div className="template-info">
                        <div className="template-name">Executive Gold</div>
                        <div className="template-tag">Premium classic</div>
                    </div>
                </div>
                <div className="template-card" onClick={() => { }}>
                    <div className="selected-check"><i className="fa-solid fa-check"></i></div>
                    <div className="template-preview">
                        <div className="template-mini-resume tmr-creative">
                            <div className="tmr-header"><div className="tmr-avatar" style={{ "background": "linear-gradient(135deg, #ec4899, #8b5cf6)" }}></div><div className="tmr-name">{profile.fullName}</div></div>
                            <div className="tmr-line w80"></div><div className="tmr-line w60"></div><div className="tmr-line w70"></div>
                            <div className="tmr-line w40"></div><div className="tmr-line w80"></div>
                        </div>
                    </div>
                    <div className="template-info">
                        <div className="template-name">Creative Blush</div>
                        <div className="template-tag">For designers</div>
                    </div>
                </div>
            </div>


            <div className="resume-builder-pane">

                <div className="builder-form-side">
                    <div className="form-section">
                        <div className="form-section-header">
                            <div className="form-section-title"><i className="fa-solid fa-user"></i> Personal Details</div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" value={profile.fullName} onChange={e => handleProfileChange('fullName', e.target.value)} placeholder="Your full name" />
                            </div>
                            <div className="form-group">
                                <label>Professional Title</label>
                                <input type="text" value={profile.title} onChange={e => handleProfileChange('title', e.target.value)} placeholder="e.g., Software Engineer" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={profile.email} onChange={e => handleProfileChange('email', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="tel" value={profile.phone} onChange={e => handleProfileChange('phone', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>LinkedIn / GitHub</label>
                            <input type="url" value={profile.linkedIn} onChange={e => handleProfileChange('linkedIn', e.target.value)} placeholder="Your profile URL" />
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-header">
                            <div className="form-section-title"><i className="fa-solid fa-graduation-cap"></i> Education</div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Degree</label>
                                <input type="text" value={profile.degree} onChange={e => handleProfileChange('degree', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Institution</label>
                                <input type="text" value={profile.institution} onChange={e => handleProfileChange('institution', e.target.value)} placeholder="Institution Name" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>CGPA / Percentage</label>
                                <input type="text" value={profile.cgpa} onChange={e => handleProfileChange('cgpa', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Duration</label>
                                <input type="text" value={profile.duration} onChange={e => handleProfileChange('duration', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-header">
                            <div className="form-section-title"><i className="fa-solid fa-briefcase"></i> Experience</div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Role</label>
                                <input type="text" value={profile.experienceRole} onChange={e => handleProfileChange('experienceRole', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Company</label>
                                <input type="text" value={profile.company} onChange={e => handleProfileChange('company', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea rows="3" value={profile.experienceDesc} onChange={e => handleProfileChange('experienceDesc', e.target.value)} placeholder="Describe your responsibilities..."></textarea>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-header">
                            <div className="form-section-title"><i className="fa-solid fa-code"></i> Skills</div>
                        </div>
                        <div className="skill-tags-box">
                            {profile.skills.map((skill) => (
                                <span key={skill} className="skill-tag">
                                    {skill} <span className="remove" onClick={() => handleRemoveSkill(skill)}>&times;</span>
                                </span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <input
                                type="text"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                                placeholder="Add a new skill (press Enter)..."
                                style={{ flex: 1, padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                            />
                            <button type="button" onClick={handleAddSkill} className="btn btn-sm btn-outline">Add</button>
                        </div>
                    </div>
                </div>


                <div className="preview-side">
                    <div className="preview-header">
                        <div className="preview-title"><i className="fa-solid fa-eye"></i> Live Preview</div>
                        <div className="preview-actions">
                            <button className="btn btn-sm btn-outline" onClick={() => window.print()}><i className="fa-solid fa-download"></i> PDF</button>
                            <button className="btn btn-sm btn-primary" onClick={() => alert('Profile link copied to clipboard!')}><i className="fa-solid fa-share-nodes"></i> Share</button>
                        </div>
                    </div>
                    <div className="resume-preview-frame">
                        <div className="rp-header">
                            <div className="rp-name">{profile.fullName}</div>
                            <div className="rp-subtitle">{profile.title}</div>
                            <div className="rp-contact">
                                <span><i className="fa-solid fa-envelope"></i> {profile.email}</span>
                                <span><i className="fa-solid fa-phone"></i> {profile.phone}</span>
                                <span><i className="fa-brands fa-linkedin"></i> {profile.linkedIn}</span>
                            </div>
                        </div>

                        <div className="rp-section">
                            <div className="rp-section-title">Education</div>
                            <div className="rp-item">
                                <div className="rp-item-header">
                                    <div className="rp-item-title">{profile.degree}</div>
                                    <div className="rp-item-date">{profile.duration}</div>
                                </div>
                                <div className="rp-item-sub">{profile.institution} • CGPA: {profile.cgpa}</div>
                            </div>
                        </div>

                        <div className="rp-section">
                            <div className="rp-section-title">Experience</div>
                            <div className="rp-item">
                                <div className="rp-item-header">
                                    <div className="rp-item-title">{profile.experienceRole}</div>
                                    <div className="rp-item-date">Recent</div>
                                </div>
                                <div className="rp-item-sub">{profile.company}</div>
                                <div className="rp-item-desc">
                                    {profile.experienceDesc}
                                </div>
                            </div>
                        </div>

                        <div className="rp-section">
                            <div className="rp-section-title">Projects</div>
                            <div className="rp-item">
                                <div className="rp-item-header">
                                    <div className="rp-item-title">{profile.projectTitle}</div>
                                    <div className="rp-item-date">2026</div>
                                </div>
                                <div className="rp-item-desc">
                                    {profile.projectDesc}
                                </div>
                            </div>
                        </div>

                        <div className="rp-section">
                            <div className="rp-section-title">Skills</div>
                            <div className="rp-skills-list">
                                {profile.skills.map((skill) => (
                                    <span key={skill} className="rp-skill-pill">{skill}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>




        </>
    );
};

export default LmsCareerResume;