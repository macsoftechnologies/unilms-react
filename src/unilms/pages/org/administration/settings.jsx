import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import academicsService from '../../../services/academics.service';
import apiClient from '../../../services/api';

const OrgAdministrationSettings = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    default_academic_year: '2026-2027',
    timezone: 'Asia/Kolkata',
    sms_api_key: '',
    pg_api_key: '',
    attendance_grace_period_mins: '15',
    hall_ticket_auto_release: true
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const [yearsRes, settingsRes] = await Promise.all([
          academicsService.getAcademicYears().catch(() => ({ data: [] })),
          apiClient.get('/tenants/settings/org_general_settings').catch(() => null)
        ]);

        const years = Array.isArray(yearsRes?.data) ? yearsRes.data : (Array.isArray(yearsRes) ? yearsRes : []);
        setAcademicYears(years);

        if (settingsRes?.data?.value) {
          setFormData((prev) => ({ ...prev, ...settingsRes.data.value }));
        } else if (years.length > 0) {
          const activeYear = years.find((y) => y.status === 'Active' || y.isCurrent) || years[0];
          setFormData((prev) => ({ ...prev, default_academic_year: activeYear.name || activeYear.year || '2026-2027' }));
        }
      } catch (err) {
        console.error('Failed to load administration settings', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/tenants/settings/org_general_settings', { value: formData });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to persist settings', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
            }}
          >
            <i className="fa-solid fa-gears"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Campus Administration &amp; General Settings
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Institution configuration, timezone, default academic year &amp; system parameters &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/unilms/org/administration/college_details"
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-building"></i>
            <span>College Profile</span>
          </Link>
          <Link
            to="/unilms/org/administration"
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
            <i className="fa-solid fa-arrow-left" style={{ color: '#4F46E5' }}></i>
            <span>Admin Hub</span>
          </Link>
        </div>
      </div>

      <div className="content-body" style={{ padding: '10px 0' }}>
        <div
          className="card"
          style={{
            background: 'var(--bg-surface, #fff)',
            padding: '28px',
            borderRadius: '16px',
            maxWidth: '820px',
            margin: '0 auto',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
          }}
        >
          {saveSuccess && (
            <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-circle-check"></i>
              Institutional administrative settings saved to PostgreSQL successfully!
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x mb-3" style={{ color: '#4F46E5' }}></i>
              <p>Loading administrative configuration...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Default Academic Year *</label>
                  <select
                    className="form-control"
                    value={formData.default_academic_year}
                    onChange={(e) => setFormData({ ...formData, default_academic_year: e.target.value })}
                    required
                  >
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.name || ay.year}>
                        {ay.name || ay.year} {ay.status ? `(${ay.status})` : ''}
                      </option>
                    ))}
                    {academicYears.length === 0 && (
                      <>
                        <option value="2026-2027">AY 2026-2027 (Active)</option>
                        <option value="2025-2026">AY 2025-2026</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Campus Timezone *</label>
                  <select
                    className="form-control"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    required
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Attendance Grace Period (Minutes)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    className="form-control"
                    value={formData.attendance_grace_period_mins}
                    onChange={(e) => setFormData({ ...formData, attendance_grace_period_mins: e.target.value })}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Permissible student late entry window before marked absent.</div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.hall_ticket_auto_release}
                      onChange={(e) => setFormData({ ...formData, hall_ticket_auto_release: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>Auto-Release Hall Tickets on Fee Clearance</span>
                  </label>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Institutional SMS Gateway API Key (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. key_sms_live_9928340182"
                    value={formData.sms_api_key}
                    onChange={(e) => setFormData({ ...formData, sms_api_key: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Campus Payment Gateway Key (Razorpay / Stripe)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. rzp_live_9843912085"
                    value={formData.pg_api_key}
                    onChange={(e) => setFormData({ ...formData, pg_api_key: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '28px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Link to="/unilms/org/administration" className="btn btn-outline">Cancel</Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Saving to DB...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-save"></i>
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default OrgAdministrationSettings;
