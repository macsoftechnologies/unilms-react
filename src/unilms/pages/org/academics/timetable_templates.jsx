import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../../services/api';

const OrgAcademicsTimetableTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState(null);

  const [newTemplate, setNewTemplate] = useState({ name: '', description: '' });
  const [newPeriod, setNewPeriod] = useState({
    period_name: '',
    start_time: '09:00',
    end_time: '09:50',
    is_break: false
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/tenants/settings/timetable_templates');
      if (res?.data?.value && Array.isArray(res.data.value)) {
        setTemplates(res.data.value);
      } else {
        setTemplates([]);
      }
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const syncTemplates = async (updated) => {
    setTemplates(updated);
    setSaving(true);
    try {
      await apiClient.post('/tenants/settings/timetable_templates', { value: updated });
    } catch (err) {
      console.error('Failed to sync timetable templates', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!newTemplate.name.trim()) return;
    const created = {
      id: `tpl-${Date.now()}`,
      name: newTemplate.name.trim(),
      description: newTemplate.description.trim(),
      periods: []
    };
    const updated = [created, ...templates];
    syncTemplates(updated);
    setNewTemplate({ name: '', description: '' });
    setShowTemplateModal(false);
  };

  const handleDeleteTemplate = (id) => {
    if (!window.confirm('Delete this template and ALL its periods?')) return;
    const updated = templates.filter((t) => t.id !== id);
    syncTemplates(updated);
  };

  const handleOpenAddPeriod = (templateId) => {
    setActiveTemplateId(templateId);
    setNewPeriod({
      period_name: '',
      start_time: '09:00',
      end_time: '09:50',
      is_break: false
    });
    setShowPeriodModal(true);
  };

  const handleAddPeriod = (e) => {
    e.preventDefault();
    if (!newPeriod.period_name.trim() || !activeTemplateId) return;

    const updated = templates.map((tpl) => {
      if (tpl.id === activeTemplateId) {
        const periodObj = {
          id: `p-${Date.now()}`,
          period_name: newPeriod.period_name.trim(),
          start_time: newPeriod.start_time,
          end_time: newPeriod.end_time,
          is_break: Boolean(newPeriod.is_break)
        };
        return {
          ...tpl,
          periods: [...(tpl.periods || []), periodObj]
        };
      }
      return tpl;
    });

    syncTemplates(updated);
    setShowPeriodModal(false);
  };

  const handleDeletePeriod = (templateId, periodId) => {
    const updated = templates.map((tpl) => {
      if (tpl.id === templateId) {
        return {
          ...tpl,
          periods: (tpl.periods || []).filter((p) => p.id !== periodId)
        };
      }
      return tpl;
    });
    syncTemplates(updated);
  };

  return (
    <section className="view-section active">
      {/* Top Header Card */}
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
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            <i className="fa-solid fa-sliders"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Timetable Templates &amp; Period Matrices
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Master scheduling templates, slot definitions &amp; department lecture matrices
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {saving && <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: '600' }}><i className="fa-solid fa-spinner fa-spin me-1"></i> Saving changes...</span>}
          <button
            className="btn btn-primary"
            onClick={() => setShowTemplateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              fontWeight: '700',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>New Template</span>
          </button>
          <Link
            to="/unilms/org/academics/dashboard"
            className="btn btn-outline"
            style={{
              background: 'var(--card-bg, #fff)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-arrow-left" style={{ color: '#2563EB' }}></i>
            <span>Academics Hub</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x mb-3" style={{ color: '#2563EB' }}></i>
          <p>Loading institutional timetable templates...</p>
        </div>
      ) : (
        <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '24px' }}>
          {templates.map((t) => (
            <div key={t.id} className="stat-card" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{t.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{t.description || 'No description provided'}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleDeleteTemplate(t.id)}
                  style={{ border: 'none', color: 'var(--danger, #DC2626)', padding: '4px 8px', cursor: 'pointer', background: 'transparent' }}
                  title="Delete Template"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                  Time Periods ({t.periods?.length || 0})
                </strong>
                <ul style={{ listStyle: 'none', padding: '0', margin: '8px 0' }}>
                  {t.periods && t.periods.length > 0 ? (
                    t.periods.map((p) => (
                      <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--border-color)', fontSize: '13px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {p.is_break ? (
                            <i className="fa-solid fa-mug-hot" style={{ color: '#D97706' }}></i>
                          ) : (
                            <i className="fa-regular fa-clock" style={{ color: '#2563EB' }}></i>
                          )}
                          <span style={{ fontWeight: p.is_break ? '500' : '600' }}>{p.period_name}</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{p.start_time?.slice(0, 5)} - {p.end_time?.slice(0, 5)}</span>
                          <button
                            type="button"
                            onClick={() => handleDeletePeriod(t.id, p.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger, #DC2626)', padding: '2px' }}
                            title="Remove Period"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0' }}>No periods added yet.</li>
                  )}
                </ul>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '100%', fontSize: '13px', borderStyle: 'dashed', borderColor: '#2563EB', color: '#2563EB', fontWeight: '600', padding: '8px 0' }}
                onClick={() => handleOpenAddPeriod(t.id)}
              >
                <i className="fa-solid fa-plus me-1"></i> Add Time Period
              </button>
            </div>
          ))}

          {templates.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-calendar-xmark fa-3x mb-3" style={{ opacity: 0.3 }}></i>
              <p>No timetable templates configured yet. Create a generic template (e.g. "B.Tech 1st Year") to define master daily schedules.</p>
            </div>
          )}
        </div>
      )}

      {/* New Template Modal */}
      {showTemplateModal && (
        <div className="drawer-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999 }}>
          <div className="drawer-content" style={{ background: '#fff', borderRadius: '16px', maxWidth: '480px', width: '90%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <form onSubmit={handleCreateTemplate}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>New Timetable Template</h3>
                <button type="button" className="btn-close" onClick={() => setShowTemplateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Template Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Standard M-F Schedule"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Brief description of when this timetable applies..."
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#2563EB', color: '#fff', border: 'none' }}>Create Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Period Modal */}
      {showPeriodModal && (
        <div className="drawer-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999 }}>
          <div className="drawer-content" style={{ background: '#fff', borderRadius: '16px', maxWidth: '480px', width: '90%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <form onSubmit={handleAddPeriod}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Add Time Period</h3>
                <button type="button" className="btn-close" onClick={() => setShowPeriodModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Period Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Period 1, Lunch Break"
                    value={newPeriod.period_name}
                    onChange={(e) => setNewPeriod({ ...newPeriod, period_name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Start Time *</label>
                    <input
                      type="time"
                      className="form-control"
                      value={newPeriod.start_time}
                      onChange={(e) => setNewPeriod({ ...newPeriod, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>End Time *</label>
                    <input
                      type="time"
                      className="form-control"
                      value={newPeriod.end_time}
                      onChange={(e) => setNewPeriod({ ...newPeriod, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    id="is_break"
                    checked={newPeriod.is_break}
                    onChange={(e) => setNewPeriod({ ...newPeriod, is_break: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label htmlFor="is_break" style={{ margin: 0, cursor: 'pointer', fontSize: '13px' }}>
                    Mark as Break / Lunch (No subjects can be allocated)
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPeriodModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#2563EB', color: '#fff', border: 'none' }}>Add Period</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default OrgAcademicsTimetableTemplates;
