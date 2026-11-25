import { Link } from 'react-router-dom';
import React, { useState, useMemo, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import { 
  getStoredTemplates, 
  saveTemplate, 
  deleteTemplate 
} from './correspondenceData';

const OrgCorrespondenceTemplates = () => {
  const [templates, setTemplates] = useState(getStoredTemplates());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'Festival' | 'Birthday' | 'General'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'Festival',
    body_text: ''
  });

  // Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // KPI Metrics
  const totalCount = templates.length;
  const festivalCount = templates.filter(t => t.type === 'Festival').length;
  const birthdayCount = templates.filter(t => t.type === 'Birthday').length;
  const generalCount = templates.filter(t => t.type === 'General').length;

  const [loading, setLoading] = useState(true);

  // Initial simulated load - renders skeleton loader in table body only
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        item.body_text.toLowerCase().includes(q);

      const matchType = typeFilter === 'All' || item.type === typeFilter;

      return matchSearch && matchType;
    });
  }, [templates, searchQuery, typeFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedTemplates,
    totalItems
  } = useTablePagination(filteredTemplates, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter, setCurrentPage]);

  const openAddModal = () => {
    setEditingTemplate(null);
    setFormData({
      id: '',
      name: '',
      type: 'Festival',
      body_text: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditingTemplate(t);
    setFormData({
      id: t.id,
      name: t.name,
      type: t.type,
      body_text: t.body_text
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.body_text.trim()) {
      alert('Please fill out Template Name and Message Body.');
      return;
    }

    const updated = saveTemplate(formData);
    setTemplates(updated);
    closeModal();
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete template "${name}"?`)) {
      const updated = deleteTemplate(id);
      setTemplates(updated);
    }
  };

  return (
    <>
      {/* Header Banner */}
      {/* Top Header Card matching Reference UI (Image 1 & 2) */}
      <div
        style={{
          background: 'var(--card-bg, #fff)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: 'clamp(16px, 3vw, 22px) clamp(18px, 3vw, 26px)',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              minWidth: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #F43F5E, #E11D48)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)'
            }}
          >
            <i className="fa-solid fa-file-lines"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Communication &amp; Circular Templates
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Standardized SMS, email, and notice board templates for institutional correspondence &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={openAddModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)', color: '#ffffff', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(225, 29, 72, 0.25)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>New Template</span>
          </button>
          <Link
            to="/unilms/org/correspondence"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-bullhorn" style={{ color: '#E11D48' }}></i>
            <span>Correspondence Hub</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-layer-group"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              All Templates
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#7C3AED', marginTop: '2px' }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Available in system
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Festival Greetings
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
              {festivalCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Campaign ready
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FFF1F2', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-cake-candles"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Birthday Wishes
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#E11D48', marginTop: '2px' }}>
              {birthdayCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Automated greetings
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-bell"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              General Alerts
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>
              {generalCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Operational notices
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
        
        {/* Filter / Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Templates Catalog
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing {filteredTemplates.length} of {totalCount} templates
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px' }}></i>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search templates..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '13px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
              />
            </div>

            {/* Type Filter */}
            <div style={{ display: 'flex', background: 'var(--bg-main, #F1F5F9)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {['All', 'Festival', 'Birthday', 'General'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  style={{
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: typeFilter === t ? '700' : '500',
                    background: typeFilter === t ? '#ffffff' : 'transparent',
                    color: typeFilter === t ? '#7C3AED' : 'var(--text-secondary)',
                    boxShadow: typeFilter === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Template Name</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Type</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Preview</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={4} rows={pageSize || 5} />
              ) : paginatedTemplates.length > 0 ? (
                paginatedTemplates.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--primary, #7C3AED)', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className={`fa-solid ${t.type === 'Festival' ? 'fa-gift' : t.type === 'Birthday' ? 'fa-cake-candles' : 'fa-bullhorn'}`} style={{ color: '#7C3AED', fontSize: '14px' }}></i>
                        <span>{t.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span 
                        className="badge badge-secondary"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: t.type === 'Festival' ? 'rgba(5, 150, 105, 0.12)' : t.type === 'Birthday' ? 'rgba(225, 29, 72, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                          color: t.type === 'Festival' ? '#059669' : t.type === 'Birthday' ? '#E11D48' : '#2563EB'
                        }}
                      >
                        {t.type} Greeting
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.body_text}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => setPreviewTemplate(t)}
                        title="Preview Template"
                      >
                        <i className="fa-solid fa-eye"></i> Preview
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => openEditModal(t)}
                        title="Edit Template"
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ padding: '4px 8px', fontSize: '12px', color: '#EF4444', borderColor: '#FECACA', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => handleDelete(t.id, t.name)}
                        title="Delete Template"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px', color: '#94A3B8' }}>
                      <i className="fa-solid fa-layer-group"></i>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>No templates found.</div>
                    <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Click "New Template" to add one.</p>
                  </td>
                </tr>
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
          itemName="correspondence templates"
        />
      </div>

      {/* Drawer Overlay for Add / Edit Template (Matches PHP form fields "same to same") */}
      <div 
        className={`drawer-overlay ${isModalOpen ? 'active' : ''}`}
        id="addModal"
        onClick={(e) => {
          if (e.target.classList.contains('drawer-overlay')) closeModal();
        }}
      >
        <div className="drawer-content" style={{ maxWidth: '600px' }}>
          <form onSubmit={handleSubmit}>
            <div className="drawer-header" style={{ background: '#7C3AED', color: '#ffffff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 id="modal_title" style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                  {editingTemplate ? 'Edit Template' : 'Add Template'}
                </h3>
                <small style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
                  {editingTemplate ? `Editing template #${editingTemplate.id}` : 'Configure reusable message text & variables'}
                </small>
              </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={closeModal}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="drawer-body" style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Template Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  name="name" 
                  id="form_name" 
                  className="form-control" 
                  required 
                  placeholder="e.g. Diwali Greeting"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Type <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select 
                  name="type" 
                  id="form_type" 
                  className="form-control" 
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                >
                  <option value="Festival">Festival Greeting</option>
                  <option value="Birthday">Birthday Greeting</option>
                  <option value="General">General Alert</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>
                    Message Body <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, body_text: formData.body_text + ' {name} ' })}
                    style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#7C3AED', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + Insert &#123;name&#125;
                  </button>
                </div>
                <textarea 
                  name="body_text" 
                  id="form_body" 
                  className="form-control" 
                  rows={8} 
                  required 
                  placeholder="Use {name} as a placeholder..."
                  value={formData.body_text}
                  onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '12px' }}
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '8px', fontSize: '12px' }}>
                  <i className="fa-solid fa-circle-info" style={{ color: '#7C3AED', marginRight: '4px' }}></i> You can use placeholders like <strong>{'{name}'}</strong> to automatically insert the recipient's name.
                </small>
              </div>

              {/* Dynamic Live Preview */}
              {formData.body_text && (
                <div style={{ background: 'var(--bg-main, #F8FAFC)', padding: '14px', borderRadius: '8px', border: '1px dashed var(--border-color)', marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Live Preview (with sample recipient)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: '1.5' }}>
                    {formData.body_text.replace(/{name}/g, 'Dr. Rajesh Sharma')}
                  </div>
                </div>
              )}
            </div>

            <div className="drawer-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={closeModal}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#F1F5F9', color: '#475569', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#7C3AED', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
              >
                Save Template
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div 
          className="drawer-overlay active"
          onClick={(e) => {
            if (e.target.classList.contains('drawer-overlay')) setPreviewTemplate(null);
          }}
        >
          <div className="drawer-content" style={{ maxWidth: '520px' }}>
            <div className="drawer-header" style={{ background: '#7C3AED', color: '#ffffff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Template Preview</h3>
                <small style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>{previewTemplate.name}</small>
              </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setPreviewTemplate(null)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="drawer-body" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Template Type</span>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                    {previewTemplate.type} Greeting
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Raw Template Text</span>
                <div style={{ marginTop: '6px', padding: '14px', background: 'var(--bg-main, #F8FAFC)', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  {previewTemplate.body_text}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sample Rendered Message</span>
                <div style={{ marginTop: '6px', padding: '16px', background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', borderRadius: '12px', fontSize: '14px', lineHeight: '1.6', border: '1px solid #DDD6FE', color: '#1E1B4B' }}>
                  <div style={{ fontWeight: '700', color: '#7C3AED', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-envelope"></i> Message Preview
                  </div>
                  {previewTemplate.body_text.replace(/{name}/g, 'Prof. Sharma')}
                </div>
              </div>
            </div>

            <div className="drawer-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setPreviewTemplate(null)}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#7C3AED', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgCorrespondenceTemplates;