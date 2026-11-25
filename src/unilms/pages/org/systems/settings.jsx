import React, { useState, useEffect } from 'react';
import { useTenant } from '../../../context/TenantContext';
import apiClient from '../../../services/api';

const OrgSystemsSettings = () => {
  const { currentTenant } = useTenant();
  const [formData, setFormData] = useState({
    name: currentTenant?.name || 'Organization 1',
    admin_email: 'admin@campus.edu',
    org_phone: '9876543210',
    org_address: 'Knowledge City Campus, Tech Zone IV'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/tenants/branding');
        const b = res.data || res;
        if (b) {
          setFormData(prev => ({
            ...prev,
            name: b.name || prev.name,
            admin_email: b.settings?.contact_email || prev.admin_email,
            org_phone: b.settings?.phone || prev.org_phone,
            org_address: b.settings?.address || prev.org_address,
          }));
        }
      } catch (err) {
        console.warn('Could not load tenant settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.patch('/tenants/settings', {
        name: formData.name,
        settings: {
          contact_email: formData.admin_email,
          phone: formData.org_phone,
          address: formData.org_address,
        }
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.warn('Failed to update tenant settings:', err);
    }
  };

  return (
    <>
      <section className="view-section active">
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
                background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(109, 40, 217, 0.3)'
              }}
            >
              <i className="fa-solid fa-gear"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                System Profile &amp; Global Settings
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Core contact details, institutional identity &amp; campus communication channels
              </p>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#059669', padding: '12px 18px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', maxWidth: '640px' }}>
            <i className="fa-solid fa-circle-check"></i> Organization profile settings successfully saved and applied.
          </div>
        )}

        <div className="card" style={{ maxWidth: '640px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
                Organization Legal Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                className="form-control" 
                required 
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px' }} 
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
                Official Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="email" 
                value={formData.admin_email} 
                onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })} 
                className="form-control" 
                required 
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px' }} 
              />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px', fontSize: '12px' }}>
                This is your institution's public contact email displayed on fee receipts, marks cards, and official emails.
              </small>
            </div>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
                Contact Phone Number
              </label>
              <input 
                type="tel" 
                pattern="[0-9]{10}" 
                maxLength="10" 
                value={formData.org_phone} 
                onChange={(e) => setFormData({ ...formData, org_phone: e.target.value })} 
                className="form-control" 
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px' }} 
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
                Campus Physical Address
              </label>
              <textarea 
                rows="4" 
                value={formData.org_address} 
                onChange={(e) => setFormData({ ...formData, org_address: e.target.value })} 
                className="form-control" 
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', resize: 'vertical', fontSize: '14px' }}
              ></textarea>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ background: '#7C3AED', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fa-solid fa-save"></i> Save Profile
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default OrgSystemsSettings;