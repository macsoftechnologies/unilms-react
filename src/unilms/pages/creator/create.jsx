import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const CreatorCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Computer Science',
    description: '',
    thumbnailUrl: null
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a course title.');
      return;
    }
    setLoading(true);
    try {
      const courseId = `crs-${Date.now()}`;
      const payload = {
        id: courseId,
        ...formData,
        createdAt: new Date().toISOString()
      };
      // Persist created course in PostgreSQL platform settings
      const existingRes = await apiClient.get('/tenants/settings/creator_courses').catch(() => null);
      const list = Array.isArray(existingRes?.data) ? existingRes.data : [];
      await apiClient.post('/tenants/settings/creator_courses', [payload, ...list]);
      navigate(`/unilms/creator/builder?courseId=${courseId}`);
    } catch (err) {
      console.error('Course creation error:', err);
      navigate('/unilms/creator/builder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0" style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px' }}>
      <div className="mb-4">
        <Link to="/unilms/creator/courses" className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 mb-2 d-inline-flex align-items-center gap-2">
          <i className="fa-solid fa-arrow-left"></i>
          <span>Back to Courses</span>
        </Link>
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge rounded-pill px-3 py-1" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary, #6366F1)', fontSize: '12px', fontWeight: '700' }}>
            🚀 NEW COURSE
          </span>
        </div>
        <h2 className="fw-bold text-dark mb-1 brand-font">Create New Video Course</h2>
        <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>Configure course title, domain category, learning objectives, and curriculum parameters.</p>
      </div>

      <div className="modern-card p-3 p-md-5" style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label fw-bold text-dark mb-1">
              Course Title <span className="text-danger">*</span>
            </label>
            <input 
              type="text" 
              name="title" 
              className="form-control form-control-lg rounded-3 border" 
              placeholder="e.g. Full Stack Web Development with React & Node.js" 
              value={formData.title} 
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required 
              style={{ fontSize: '1.05rem', padding: '12px 16px' }} 
            />
            <div className="form-text text-muted small mt-1">Make your course title clear, descriptive, and student-friendly.</div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <label className="form-label fw-bold text-dark mb-1">
                Domain Category <span className="text-danger">*</span>
              </label>
              <input 
                type="text" 
                id="categoryInput" 
                name="category" 
                className="form-control rounded-3" 
                placeholder="e.g. Computer Science" 
                value={formData.category} 
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                required 
              />
              <div className="d-flex flex-wrap gap-1 mt-2">
                {['Computer Science', 'Data Science', 'AI & ML', 'Cloud Systems'].map(cat => (
                  <span 
                    key={cat}
                    className="badge bg-light text-secondary border cursor-pointer cat-pill" 
                    onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                    style={{ cursor: 'pointer', padding: '6px 10px' }}
                  >
                    + {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold text-dark mb-1">Course Thumbnail</label>
              <div className="p-3 border rounded-3 bg-light text-center" style={{ borderStyle: 'dashed', borderWidth: '2px', minHeight: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-cloud-arrow-up fa-2x text-secondary mb-1 opacity-50"></i>
                <div className="small fw-semibold text-dark">Course Cover Banner</div>
                <small className="text-muted d-block mb-2" style={{ fontSize: '11px' }}>Recommended: 16:9 ratio (JPEG, PNG, WebP)</small>
                <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={() => alert('Banner file selector triggered.')}>
                  <i className="fa-solid fa-image me-1"></i> Choose Image
                </button>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold text-dark mb-1">Course Summary & Syllabus Overview</label>
            <textarea 
              name="description" 
              className="form-control rounded-3" 
              rows="4" 
              placeholder="Briefly describe what students will learn in this curriculum, key competencies, and prerequisites..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <hr className="my-4" style={{ opacity: 0.1 }} />

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <Link to="/unilms/creator/courses" className="btn btn-light rounded-pill px-4 py-2 fw-semibold">
              <i className="fa-solid fa-xmark me-1"></i> Cancel
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary rounded-pill px-5 py-2 fw-semibold d-inline-flex align-items-center gap-2" 
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none', color: '#fff' }}
            >
              {loading ? 'Creating...' : 'Continue to Studio Builder'} <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatorCreate;
