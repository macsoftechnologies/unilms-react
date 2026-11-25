import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../../services/api';

const DEFAULT_TEMPLATES = [
  {
    id: 'tc-bonafide',
    name: 'Bonafide Student Certificate',
    category: 'Student',
    page_size: 'A4',
    orientation: 'Portrait',
    html_content: '<p>This is to certify that <strong>{{student_name}}</strong> (Roll No: <strong>{{roll_number}}</strong>) is a bona fide student of our institution enrolled in <strong>{{program_name}}</strong> for the academic year <strong>{{academic_year}}</strong>.</p>'
  },
  {
    id: 'tc-transfer',
    name: 'Institutional Transfer Certificate (TC)',
    category: 'Student',
    page_size: 'A4',
    orientation: 'Portrait',
    html_content: '<p>Transfer Certificate certifying that <strong>{{student_name}}</strong> has completed all institutional dues and is relieved from <strong>{{organization_name}}</strong> with satisfactory conduct.</p>'
  },
  {
    id: 'tc-character',
    name: 'Character & Conduct Certificate',
    category: 'Student',
    page_size: 'Letter',
    orientation: 'Portrait',
    html_content: '<p>This document attests to the exemplary personal conduct, moral character, and disciplinary record of <strong>{{student_name}}</strong> during their academic tenure.</p>'
  }
];

const OrgCertificatesTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Student',
    page_size: 'A4',
    orientation: 'Portrait',
    html_content: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/tenants/settings/certificate_templates');
      if (res?.data?.value && Array.isArray(res.data.value)) {
        setTemplates(res.data.value);
      } else {
        setTemplates(DEFAULT_TEMPLATES);
        apiClient.post('/tenants/settings/certificate_templates', { value: DEFAULT_TEMPLATES }).catch(() => {});
      }
    } catch {
      setTemplates(DEFAULT_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const syncTemplates = async (updated) => {
    setTemplates(updated);
    setSaving(true);
    try {
      await apiClient.post('/tenants/settings/certificate_templates', { value: updated });
    } catch (err) {
      console.error('Failed to sync certificate templates', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const created = {
      id: `tc-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category,
      page_size: formData.page_size,
      orientation: formData.orientation,
      html_content: formData.html_content.trim() || `<p>Official certificate for {{student_name}} ({{roll_number}}).</p>`
    };

    const updated = [created, ...templates];
    syncTemplates(updated);
    setFormData({ name: '', category: 'Student', page_size: 'A4', orientation: 'Portrait', html_content: '' });
    setShowModal(false);
  };

  const handleDeleteTemplate = (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate template?')) return;
    const updated = templates.filter((t) => t.id !== id);
    syncTemplates(updated);
  };

  const handleInsertTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      html_content: prev.html_content + ` {{${tag}}} `
    }));
  };

  return (
    <section className="view-section active" style={{ padding: '20px' }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-stamp" style={{ color: '#4F46E5' }}></i>
            <span>Certificate &amp; Document Templates</span>
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted, #64748b)', fontSize: '13px' }}>
            Design and customize Transfer Certificates (TC), Bonafide Certificates, Character Certificates, and Transcripts with dynamic shortcodes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {saving && <span style={{ fontSize: '12px', color: '#4F46E5', fontWeight: '600' }}><i className="fa-solid fa-spinner fa-spin me-1"></i> Saving...</span>}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{ background: '#4F46E5', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>New Template</span>
          </button>
          <Link
            to="/unilms/org/certificates/generate"
            className="btn btn-outline"
            style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '9px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fa-solid fa-print"></i>
            <span>Issue Certificate</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x mb-3" style={{ color: '#4F46E5' }}></i>
          <p>Loading certificate templates...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
          {templates.map((t) => (
            <div
              key={t.id}
              className="card"
              style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{t.name}</h3>
                    <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', marginTop: '6px', display: 'inline-block', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                      {t.category} &bull; {t.page_size} ({t.orientation})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(t.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger, #DC2626)', padding: '4px' }}
                    title="Delete Template"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>

                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    maxHeight: '120px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    lineHeight: '1.5'
                  }}
                  dangerouslySetInnerHTML={{ __html: t.html_content }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <Link
                  to={`/unilms/org/certificates/generate?template=${t.id}`}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px', background: '#4F46E5', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="fa-solid fa-file-signature"></i>
                  <span>Issue for Student</span>
                </Link>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              No certificate templates found. Click "New Template" above to create one.
            </div>
          )}
        </div>
      )}

      {/* Template Modal */}
      {showModal && (
        <div className="drawer-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999 }}>
          <div className="drawer-content" style={{ background: '#fff', borderRadius: '16px', maxWidth: '640px', width: '92%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <form onSubmit={handleCreateTemplate}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-stamp" style={{ color: '#4F46E5' }}></i>
                  <span>Document Template Builder</span>
                </h3>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Template Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Migration Certificate"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Category</label>
                  <select
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Student">Student Academic</option>
                    <option value="Staff">Staff / Faculty</option>
                    <option value="General">General Campus</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Page Size &amp; Orientation</label>
                  <select
                    className="form-control"
                    value={formData.page_size}
                    onChange={(e) => setFormData({ ...formData, page_size: e.target.value })}
                  >
                    <option value="A4">A4 Portrait</option>
                    <option value="Letter">Letter Portrait</option>
                    <option value="A4-Landscape">A4 Landscape</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Available Shortcodes (Click to insert):
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['student_name', 'roll_number', 'program_name', 'academic_year', 'issue_date', 'organization_name'].map((tag) => (
                    <span
                      key={tag}
                      className="badge"
                      style={{ cursor: 'pointer', background: '#EEF2FF', color: '#4F46E5', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}
                      onClick={() => handleInsertTag(tag)}
                    >
                      {`{{${tag}}}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Certificate HTML Body</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Enter certificate prose or layout with {{shortcode}} variables..."
                  value={formData.html_content}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#4F46E5', color: '#fff', border: 'none' }}>Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default OrgCertificatesTemplates;
