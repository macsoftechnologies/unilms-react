import { Link } from 'react-router-dom';
import React, { useState, useMemo, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import { 
  getStoredFestivals, 
  getStoredTemplates, 
  saveFestivalCampaign 
} from './correspondenceData';

const OrgCorrespondenceFestivals = () => {
  const [festivals, setFestivals] = useState(getStoredFestivals());
  const [templates] = useState(getStoredTemplates());
  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    id: '',
    festival_name: '',
    template_id: '',
    audience: 'All',
    send_date: todayStr
  });

  // KPI Metrics
  const totalCampaigns = festivals.length;
  const dispatchedCount = festivals.filter(f => f.status === 'Sent').length;
  const scheduledCount = festivals.filter(f => f.status !== 'Sent').length;
  const festivalTemplates = templates.filter(t => t.type === 'Festival');

  const [loading, setLoading] = useState(true);

  // Initial simulated load - renders skeleton loader in table body only
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Filtered Festivals
  const filteredFestivals = useMemo(() => {
    return festivals.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item.festival_name.toLowerCase().includes(q) || 
        (item.template_name && item.template_name.toLowerCase().includes(q));

      const matchAudience = audienceFilter === 'All' || item.audience === audienceFilter;

      return matchSearch && matchAudience;
    });
  }, [festivals, searchQuery, audienceFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedFestivals,
    totalItems
  } = useTablePagination(filteredFestivals, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, audienceFilter, setCurrentPage]);

  const openAddModal = () => {
    const defaultTemplateId = festivalTemplates.length > 0 ? festivalTemplates[0].id : (templates[0]?.id || '');
    setFormData({
      id: '',
      festival_name: '',
      template_id: defaultTemplateId,
      audience: 'All',
      send_date: todayStr
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.festival_name.trim() || !formData.template_id) {
      alert('Please provide Festival Name and select a Message Template.');
      return;
    }

    const updated = saveFestivalCampaign(formData);
    setFestivals(updated);
    closeModal();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Selected template details for live preview in drawer
  const activeTemplate = templates.find(t => t.id === Number(formData.template_id));

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
            <i className="fa-solid fa-gift"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Festival Greetings &amp; Broadcast Campaigns
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Schedule automated wishes, celebratory messages &amp; festival circulars
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
            <i className="fa-solid fa-paper-plane"></i>
            <span>Schedule Campaign</span>
          </button>
          <Link
            to="/unilms/org/correspondence/templates"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-file-lines" style={{ color: '#E11D48' }}></i>
            <span>Message Templates</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Campaigns
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#7C3AED', marginTop: '2px' }}>
              {totalCampaigns}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Festival initiatives
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Dispatched
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
              {dispatchedCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Delivered to inboxes
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-clock"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Upcoming Scheduled
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>
              {scheduledCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Future festival dates
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Audience Reach
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>
              100%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Campus-wide coverage
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
        
        {/* Table Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Campaign Records
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing {filteredFestivals.length} of {totalCampaigns} festival campaigns
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px' }}></i>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search festival..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '13px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
              />
            </div>

            {/* Audience Filter */}
            <div style={{ display: 'flex', background: 'var(--bg-main, #F1F5F9)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {['All', 'Students', 'Staff'].map(aud => (
                <button
                  key={aud}
                  type="button"
                  onClick={() => setAudienceFilter(aud)}
                  style={{
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: audienceFilter === aud ? '700' : '500',
                    background: audienceFilter === aud ? '#ffffff' : 'transparent',
                    color: audienceFilter === aud ? '#7C3AED' : 'var(--text-secondary)',
                    boxShadow: audienceFilter === aud ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {aud}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table (Matches PHP fields) */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Festival Name</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Audience</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Template Used</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Send Date</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedFestivals.length > 0 ? (
                paginatedFestivals.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--primary, #7C3AED)', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: '#F5F3FF', color: '#7C3AED' }}>
                          <i className="fa-solid fa-gift"></i>
                        </span>
                        <span>{f.festival_name}</span>
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
                          background: f.audience === 'All' ? 'rgba(79, 70, 229, 0.1)' : f.audience === 'Students' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                          color: f.audience === 'All' ? '#4F46E5' : f.audience === 'Students' ? '#0284C7' : '#7C3AED'
                        }}
                      >
                        {f.audience === 'All' ? 'All (Staff & Students)' : f.audience}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {f.template_name}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {formatDate(f.send_date)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {f.status === 'Sent' ? (
                        <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success, #059669)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
                          DISPATCHED
                        </span>
                      ) : (
                        <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning, #D97706)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
                          {String(f.status || 'SCHEDULED').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => setSelectedCampaign(f)}
                        title="View Campaign Details"
                      >
                        <i className="fa-solid fa-eye"></i> Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px', color: '#94A3B8' }}>
                      <i className="fa-solid fa-calendar-xmark"></i>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>No festival campaigns scheduled yet.</div>
                    <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Click "Schedule Campaign" to dispatch festive greetings.</p>
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
          itemName="festival campaigns"
        />
      </div>

      {/* Drawer Overlay for Schedule Campaign (Matches PHP form fields "same to same") */}
      <div 
        className={`drawer-overlay ${isModalOpen ? 'active' : ''}`}
        id="addModal"
        onClick={(e) => {
          if (e.target.classList.contains('drawer-overlay')) closeModal();
        }}
      >
        <div className="drawer-content" style={{ maxWidth: '600px' }}>
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="id" id="form_id" value={formData.id} />
            
            <div className="drawer-header" style={{ background: '#7C3AED', color: '#ffffff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 id="modal_title" style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                  Schedule Campaign
                </h3>
                <small style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
                  Dispatch celebratory greetings to campus community
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
                  Festival Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  name="festival_name" 
                  id="form_name" 
                  className="form-control" 
                  required 
                  placeholder="e.g. Diwali 2026"
                  value={formData.festival_name}
                  onChange={(e) => setFormData({ ...formData, festival_name: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Message Template <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select 
                  name="template_id" 
                  id="form_template" 
                  className="form-control" 
                  required
                  value={formData.template_id}
                  onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                >
                  <option value="">-- Select Template --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Target Audience <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select 
                  name="audience" 
                  id="form_audience" 
                  className="form-control" 
                  required
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                >
                  <option value="All">All Users (Staff & Students)</option>
                  <option value="Students">Students Only</option>
                  <option value="Staff">Staff Only</option>
                </select>
              </div>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Dispatch Date <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="date" 
                  name="send_date" 
                  id="form_date" 
                  className="form-control" 
                  required 
                  value={formData.send_date}
                  onChange={(e) => setFormData({ ...formData, send_date: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '8px', fontSize: '12px' }}>
                  <i className="fa-solid fa-bolt" style={{ color: '#7C3AED', marginRight: '4px' }}></i> Note: For this initial release, all campaigns dispatch notifications immediately upon save.
                </small>
              </div>

              {/* Template Body Preview */}
              {activeTemplate && (
                <div style={{ background: 'var(--bg-main, #F8FAFC)', padding: '14px', borderRadius: '8px', border: '1px dashed var(--border-color)', marginTop: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Template Content Preview
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: '1.5' }}>
                    "{activeTemplate.body_text}"
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
                Dispatch Campaign
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div 
          className="drawer-overlay active"
          onClick={(e) => {
            if (e.target.classList.contains('drawer-overlay')) setSelectedCampaign(null);
          }}
        >
          <div className="drawer-content" style={{ maxWidth: '540px' }}>
            <div className="drawer-header" style={{ background: '#7C3AED', color: '#ffffff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Campaign Details</h3>
                <small style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>{selectedCampaign.festival_name}</small>
              </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setSelectedCampaign(null)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="drawer-body" style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--bg-main, #F8FAFC)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Audience</span>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '2px', color: 'var(--text-primary)' }}>
                    {selectedCampaign.audience === 'All' ? 'All (Staff & Students)' : selectedCampaign.audience}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Send Date</span>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '2px', color: 'var(--text-primary)' }}>
                    {formatDate(selectedCampaign.send_date)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                      {selectedCampaign.status === 'Sent' ? 'DISPATCHED' : selectedCampaign.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Template Used</span>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '2px', color: '#7C3AED' }}>
                    {selectedCampaign.template_name}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sample Campaign Announcement</span>
                <div style={{ marginTop: '8px', padding: '16px', background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', borderRadius: '12px', border: '1px solid #DDD6FE' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#7C3AED', marginBottom: '6px' }}>
                    🎉 Happy {selectedCampaign.festival_name}!
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#1E1B4B' }}>
                    Best festive wishes to all members of our university family on this auspicious occasion!
                  </div>
                </div>
              </div>
            </div>

            <div className="drawer-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setSelectedCampaign(null)}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#7C3AED', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgCorrespondenceFestivals;