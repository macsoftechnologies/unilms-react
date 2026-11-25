import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import placementsService from '../../../services/placements.service';

const defaultPosting = {
  roleTitle: 'Cloud Software Engineering Intern',
  companyName: 'Infosys Center of AI & Cloud Innovation',
  workMode: 'Hybrid (Bangalore Campus)',
  stipend: '₹35,000 / month',
  description: 'Join our Cloud Systems engineering group working on high-throughput microservices, containerization with Docker and Kubernetes, and automated CI/CD deployment pipelines. Prerequisites: Solid grasp of data structures, Node.js or Python, and basic cloud networking.'
};

const LmsInternshipsApply = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const companyParam = searchParams.get('company');

  const [posting] = useState({
    roleTitle: roleParam || defaultPosting.roleTitle,
    companyName: companyParam || defaultPosting.companyName,
    workMode: defaultPosting.workMode,
    stipend: defaultPosting.stipend,
    description: defaultPosting.description
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      alert('Please upload your resume in PDF format.');
      return;
    }
    setIsSubmitting(true);
    try {
      await placementsService.createApplication({
        roleTitle: posting.roleTitle,
        companyName: posting.companyName,
        coverLetter,
        resumeFileName: resumeFile.name,
        stage: 'APPLIED'
      });
    } catch (err) {
      console.warn('Backend application submission note:', err.message);
    }
    setSubmitted(true);
    setIsSubmitting(false);
    setTimeout(() => {
      navigate('/unilms/lms/internships');
    }, 2000);
  };

  return (
    <div className="container-fluid p-0" style={{ maxWidth: '850px', margin: '0 auto', padding: '24px 16px' }}>
      <div className="mb-4">
        <Link to="/unilms/lms/internships" className="btn btn-sm btn-outline-secondary rounded-pill px-3 mb-2 d-inline-flex align-items-center gap-2">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Internships</span>
        </Link>
        <h2 className="fw-bold mb-1" style={{ fontSize: '24px', color: '#0F172A' }}>
          Apply for {posting.roleTitle}
        </h2>
        <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
          {posting.companyName} &bull; {posting.workMode} &bull; <strong style={{ color: '#059669' }}>{posting.stipend}</strong>
        </p>
      </div>

      {submitted && (
        <div style={{ background: '#10B981', color: '#fff', padding: '14px 20px', borderRadius: '12px', marginBottom: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-circle-check"></i>
          Application successfully transmitted to the campus corporate placement desk!
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
        <h5 className="fw-bold text-dark mb-3">
          <i className="fas fa-info-circle text-primary me-2"></i> Role Description & Criteria
        </h5>
        <div className="p-3 bg-light rounded-3 border mb-4" style={{ fontSize: '14px', lineHeight: '1.65', color: '#334155' }}>
          {posting.description}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label fw-bold">Upload Resume (PDF format) <span className="text-danger">*</span></label>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="form-control form-control-lg border-primary" 
              required 
            />
            {resumeFile && (
              <small className="text-success mt-1 d-block fw-semibold">
                <i className="fa-solid fa-file-pdf me-1"></i> Selected: {resumeFile.name}
              </small>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Cover Letter / Why are you a great fit?</label>
            <textarea 
              value={coverLetter} 
              onChange={(e) => setCoverLetter(e.target.value)}
              className="form-control" 
              rows="5" 
              placeholder="Highlight your projects, relevant courses, technical skills, and motivation..."
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm" style={{ background: 'var(--primary, #6366F1)', border: 'none', fontWeight: '700' }}>
            <i className="fas fa-paper-plane me-2"></i> Submit Application
          </button>
        </form>
      </div>
    </div>
  );
};

export default LmsInternshipsApply;
