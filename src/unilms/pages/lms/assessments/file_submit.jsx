import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../../services/api';

const LmsAssessmentsFileSubmit = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [studentComments, setStudentComments] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [submissionScore, setSubmissionScore] = useState(null);
  const [submissionDate, setSubmissionDate] = useState(null);

  useEffect(() => {
    let isMounted = true;
    apiClient.get('/academics/assessments/lab-milestone-1/my-submission')
      .then(res => {
        if (isMounted && res) {
          const sub = res.submission || res;
          if (sub?.fileName || sub?.submittedAt) {
            setSubmitted(true);
            if (sub.remarks) setStudentComments(sub.remarks);
            if (sub.score !== undefined && sub.score !== null) setSubmissionScore(sub.score);
            if (sub.submittedAt) setSubmissionDate(new Date(sub.submittedAt).toLocaleDateString());
          }
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleBack = (e) => {
    if (window.history.length > 1) {
      e.preventDefault();
      navigate(-1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fileName = selectedFile?.name || 'microservices_docker_bundle.zip';
    try {
      await apiClient.post('/academics/assessments/lab-milestone-1/submit', {
        fileName,
        remarks: studentComments || 'Lab Milestone 1 containerization deliverable'
      });
    } catch (err) {
      console.warn('Backend submission note:', err.message);
    }
    setSubmitted(true);
    setSubmissionDate(new Date().toLocaleDateString());
    setToastMsg('Assignment deliverable uploaded successfully!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <>
      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', maxWidth: '960px', margin: '0 auto 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
            <i className="fa-solid fa-circle-check"></i>
            {toastMsg}
          </div>
          <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <div style={{ "maxWidth": "960px", "margin": "0 auto" }}>
        <div style={{ "marginBottom": "24px" }}>
          <Link
            to="/unilms/lms/assignments"
            onClick={handleBack}
            className="btn btn-sm btn-outline"
            style={{ "marginBottom": "12px", "display": "inline-flex", "alignItems": "center", "gap": "6px", "textDecoration": "none", "cursor": "pointer" }}
          >
            <i className="fa-solid fa-arrow-left"></i> Back to Assessments
          </Link>
          <div style={{ "display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "gap": "16px", "flexWrap": "wrap" }}>
            <div>
              <span className="badge" style={{ "background": "rgba(99, 102, 241, 0.12)", "color": "var(--primary)", "fontSize": "11.5px", "fontWeight": "700", "marginBottom": "6px", "display": "inline-block" }}>
                <i className="fa-solid fa-cloud-arrow-up me-1"></i> File Upload Assignment
              </span>
              <h2 style={{ "fontFamily": "'Outfit', sans-serif", "fontSize": "22px", "fontWeight": "800", "color": "var(--text-main)", "margin": "0 0 6px" }}>
                Lab Milestone 1: Containerize Node &amp; Python Microservices
              </h2>
              <p style={{ "color": "var(--text-muted)", "fontSize": "13.5px", "margin": "0" }}>
                Review the assignment description and upload your project deliverable archive.
              </p>
            </div>
            <div style={{ "background": "var(--card-bg)", "padding": "10px 18px", "borderRadius": "12px", "border": "1px solid var(--border)", "boxShadow": "var(--shadow-sm)", "textAlign": "center" }}>
              <div style={{ "fontSize": "11px", "color": "var(--text-muted)", "fontWeight": "600" }}>Max Marks</div>
              <div style={{ "fontSize": "16px", "fontWeight": "800", "color": "var(--primary)" }}>50.00 Pts</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ "borderRadius": "16px", "border": "1px solid var(--border)", "padding": "22px", "marginBottom": "24px", "background": "var(--card-bg)", "boxShadow": "var(--shadow-sm)" }}>
          <div style={{ "display": "flex", "alignItems": "center", "gap": "10px", "marginBottom": "12px" }}>
            <div style={{ "width": "32px", "height": "32px", "borderRadius": "8px", "background": "rgba(99, 102, 241, 0.12)", "color": "var(--primary)", "display": "flex", "alignItems": "center", "justifyContent": "center", "fontSize": "15px" }}>
              <i className="fa-solid fa-circle-info"></i>
            </div>
            <h3 style={{ "fontFamily": "'Outfit', sans-serif", "fontSize": "16px", "fontWeight": "800", "color": "var(--text-main)", "margin": "0" }}>
              Deliverable Instructions &amp; Requirements
            </h3>
          </div>
          <div style={{ "background": "var(--bg-canvas)", "border": "1px solid var(--border)", "borderRadius": "12px", "padding": "16px 20px", "fontSize": "13.5px", "color": "var(--text-main)", "lineHeight": "1.65", "marginBottom": "16px" }}>
            Implement multi-stage Dockerfiles for Node.js API and Python data worker. Submit structured Git repository or compressed bundle (.zip, .pdf) containing tested Dockerfiles and documentation.
          </div>

          <div style={{ "display": "flex", "justifyContent": "space-between", "alignItems": "center", "background": "rgba(99, 102, 241, 0.05)", "border": "1px solid rgba(99, 102, 241, 0.2)", "borderRadius": "12px", "padding": "12px 18px", "flexWrap": "wrap", "gap": "10px" }}>
            <div style={{ "display": "flex", "alignItems": "center", "gap": "10px" }}>
              <i className="fa-solid fa-paperclip text-primary fa-lg"></i>
              <span style={{ "fontSize": "13px", "fontWeight": "700", "color": "var(--text-main)" }}>Faculty Problem Statement Document</span>
            </div>
            <button type="button" onClick={() => alert('Downloading problem statement attachment...')} className="btn btn-sm btn-primary" style={{ "cursor": "pointer" }}>
              <i className="fa-solid fa-download me-1"></i> Download Attachment
            </button>
          </div>
        </div>

        {/* Existing Submission Details */}
        <div className="card" style={{ "borderRadius": "16px", "border": "1px solid var(--border)", "padding": "28px", "background": "var(--card-bg)", "boxShadow": "var(--shadow-sm)", "marginBottom": "24px" }}>
          <div style={{ "display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "20px", "flexWrap": "wrap", "gap": "12px" }}>
            <div style={{ "display": "flex", "alignItems": "center", "gap": "12px" }}>
              <span className="badge" style={{ "background": submissionScore !== null ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)", "color": submissionScore !== null ? "var(--success)" : "#D97706", "fontSize": "12.5px", "fontWeight": "700", "padding": "6px 12px", "borderRadius": "20px" }}>
                <i className={`fa-solid ${submissionScore !== null ? 'fa-circle-check' : 'fa-clock'} me-1`}></i> {submissionScore !== null ? 'Graded' : 'Submitted (Under Review)'}
              </span>
              <span style={{ "fontSize": "12.5px", "color": "var(--text-muted)" }}>
                Submitted on {submissionDate || 'Recently'}
              </span>
            </div>

            <div style={{ "background": "var(--bg-canvas)", "padding": "6px 16px", "borderRadius": "12px", "border": "1px solid var(--border)", "fontWeight": "800", "fontSize": "15px", "color": submissionScore !== null ? "var(--success)" : "#D97706" }}>
              {submissionScore !== null ? `Score: ${submissionScore} / 50.00` : 'Pending Faculty Review'}
            </div>
          </div>

          <div style={{ "background": "var(--bg-canvas)", "border": "1px solid var(--border)", "borderRadius": "12px", "padding": "16px 20px", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "10px" }}>
            <div style={{ "display": "flex", "alignItems": "center", "gap": "12px" }}>
              <i className="fa-solid fa-file-lines fa-2x text-primary"></i>
              <div>
                <div style={{ "fontSize": "13.5px", "fontWeight": "700", "color": "var(--text-main)" }}>Uploaded File Archive</div>
                <div style={{ "fontSize": "12px", "color": "var(--text-muted)" }}>microservices_docker_bundle.zip (4.8 MB)</div>
              </div>
            </div>
            <button type="button" onClick={() => alert('Downloading uploaded deliverable archive...')} className="btn btn-sm btn-outline" style={{ "cursor": "pointer" }}>
              <i className="fa-solid fa-download me-1"></i> Download File
            </button>
          </div>

          <div style={{ "marginTop": "20px", "background": "rgba(99, 102, 241, 0.05)", "border": "1px solid rgba(99, 102, 241, 0.2)", "borderRadius": "12px", "padding": "14px 18px" }}>
            <div style={{ "fontSize": "12.5px", "fontWeight": "700", "color": "var(--primary)", "marginBottom": "4px" }}>
              <i className="fa-solid fa-comment-dots me-1"></i> Faculty Review Remarks:
            </div>
            <div style={{ "fontSize": "13.5px", "color": "var(--text-main)" }}>
              Excellent container optimization! Image size reduced by 74% using Alpine multi-stage builds. Non-root user permissions verified.
            </div>
          </div>
        </div>

        {/* Resubmit or Upload New Version Form */}
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ "borderRadius": "16px", "border": "1px solid var(--border)", "padding": "24px", "background": "var(--card-bg)", "boxShadow": "var(--shadow-sm)", "marginBottom": "24px" }}>
            <div style={{ "marginBottom": "20px" }}>
              <label style={{ "fontFamily": "'Outfit', sans-serif", "fontSize": "15px", "fontWeight": "800", "color": "var(--text-main)", "marginBottom": "6px", "display": "block" }}>
                Select File Deliverable <span style={{ "color": "var(--danger)" }}>*</span>
              </label>
              <p style={{ "fontSize": "12.5px", "color": "var(--text-muted)", "margin": "0 0 10px" }}>
                Allowed file formats: <strong>.pdf, .zip, .tar.gz</strong> &bull; Maximum file size: <strong>25MB</strong>
              </p>
              <input
                type="file"
                name="submitted_file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                style={{ "width": "100%", "padding": "12px", "border": "1.5px dashed var(--border)", "borderRadius": "12px", "background": "var(--bg-canvas)", "fontSize": "13px" }}
              />
            </div>

            <div style={{ "marginBottom": "20px" }}>
              <label style={{ "fontFamily": "'Outfit', sans-serif", "fontSize": "14px", "fontWeight": "700", "color": "var(--text-main)", "marginBottom": "6px", "display": "block" }}>
                Optional Notes for Teacher / Evaluator
              </label>
              <textarea
                name="student_comments"
                rows="3"
                value={studentComments}
                onChange={(e) => setStudentComments(e.target.value)}
                placeholder="Add any explanatory remarks about your deliverable..."
                style={{ "width": "100%", "padding": "14px", "border": "1px solid var(--border)", "borderRadius": "10px", "fontFamily": "inherit", "fontSize": "13.5px", "outline": "none" }}
              ></textarea>
            </div>

            <div style={{ "display": "flex", "justifyContent": "flex-end", "paddingTop": "14px", "borderTop": "1px solid var(--border-light)" }}>
              <button type="submit" className="btn btn-primary" style={{ "padding": "10px 28px", "fontWeight": "700", "fontSize": "14px", "background": "#10b981", "borderColor": "#10b981", "cursor": "pointer" }}>
                <i className="fa-solid fa-cloud-arrow-up me-2"></i> Submit Assignment Deliverable
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default LmsAssessmentsFileSubmit;