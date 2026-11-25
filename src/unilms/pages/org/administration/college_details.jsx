import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../../../context/TenantContext';
import apiClient from '../../../services/api';

const OrgAdministrationCollegeDetails = () => {
  const { currentTenant } = useTenant();
  const initialDetails = {
    name: currentTenant?.name || 'Organization 1',
    affiliation: 'Autonomous University System',
    naac_grade: 'A++',
    contact_email: 'admin@org1.unilms.edu',
    contact_phone: '+91 98765 43210',
    logo_url: '',
    address: 'Campus Main Boulevard, Institutional District',
  };
  const [details, setDetails] = useState(initialDetails);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(details);

  useEffect(() => {
    const fetchTenantDetails = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/tenants/branding');
        const data = (res && res.data) ? res.data : res;
        if (data) {
          const live = {
            name: data.name || initialDetails.name,
            affiliation: data.affiliation || initialDetails.affiliation,
            naac_grade: data.naacGrade || initialDetails.naac_grade,
            contact_email: data.contactEmail || data.email || initialDetails.contact_email,
            contact_phone: data.contactPhone || data.phone || initialDetails.contact_phone,
            logo_url: data.logoUrl || initialDetails.logo_url,
            address: data.address || initialDetails.address
          };
          setDetails(live);
          setFormData(live);
        }
      } catch (e) {
        console.warn('Could not load tenant details from server:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTenantDetails();
  }, []);

  const handleEditClick = () => {
    setFormData(details);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, logo_url: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.patch('/tenants/settings', {
        name: formData.name,
        address: formData.address,
        contactEmail: formData.contact_email,
        contactPhone: formData.contact_phone
      });
      setDetails(formData);
      setIsEditing(false);
    } catch (err) {
      console.warn('Error saving college details to database:', err);
      setDetails(formData);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
              background: 'linear-gradient(135deg, #475569, #334155)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(51, 65, 85, 0.3)'
            }}
          >
            <i className="fa-solid fa-building"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Institutional Profile &amp; Accreditation Details
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Manage official institutional information, AICTE/UGC codes, logo, and contact channels &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/unilms/org/administration"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-sitemap" style={{ color: '#475569' }}></i>
            <span>Admin Setup</span>
          </Link>
          <Link
            to="/unilms/org/administration/lecture_halls"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #475569 0%, #334155 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(51, 65, 85, 0.25)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-chalkboard"></i>
            <span>Infrastructure</span>
          </Link>
        </div>
      </div>

      {/* 1. READ-ONLY VIEW MODE */}
      {!isEditing && (
        <div id="profileViewCard" className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', maxWidth: '900px', margin: '0 auto', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          {/* Top Header Banner inside card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {details.logo_url ? (
                <img 
                  src={details.logo_url} 
                  alt="College Logo" 
                  style={{ maxHeight: '56px', maxWidth: '80px', objectFit: 'contain', borderRadius: '10px', border: '1px solid var(--border-color)', padding: '4px', background: '#fff' }} 
                />
              ) : (
                <div style={{ width: '52px', height: '52px', border_radius: '12px', background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', borderRadius: '12px' }}>
                  <i className="fa-solid fa-building-columns"></i>
                </div>
              )}
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {details.name}
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED', fontWeight: '700', fontSize: '12px', padding: '3px 8px', borderRadius: '6px' }}>
                    {details.affiliation}
                  </span>
                  {details.naac_grade && (
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: '700', fontSize: '12px', padding: '3px 8px', borderRadius: '6px' }}>
                      {details.naac_grade}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleEditClick} 
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', color: '#ffffff', border: 'none', padding: '10px 18px', fontWeight: '700', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-pen-to-square"></i> Edit Profile
            </button>
          </div>

          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--bg-main, #f8fafc)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <i className="fa-solid fa-envelope" style={{ color: '#7C3AED', marginRight: '6px' }}></i> Official Contact Email
              </div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {details.contact_email}
              </strong>
            </div>

            <div style={{ background: 'var(--bg-main, #f8fafc)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <i className="fa-solid fa-phone" style={{ color: '#7C3AED', marginRight: '6px' }}></i> Official Contact Phone
              </div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {details.contact_phone}
              </strong>
            </div>

            <div style={{ background: 'var(--bg-main, #f8fafc)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <i className="fa-solid fa-award" style={{ color: '#7C3AED', marginRight: '6px' }}></i> Approval Code / NAAC
              </div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {details.naac_grade}
              </strong>
            </div>

            <div style={{ background: 'var(--bg-main, #f8fafc)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <i className="fa-solid fa-certificate" style={{ color: '#7C3AED', marginRight: '6px' }}></i> Affiliated University
              </div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {details.affiliation}
              </strong>
            </div>

            <div style={{ gridColumn: '1 / -1', background: 'var(--bg-main, #f8fafc)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <i className="fa-solid fa-location-dot" style={{ color: '#7C3AED', marginRight: '6px' }}></i> Campus Physical Address
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: '600', lineHeight: '1.5' }}>
                {details.address}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT FORM MODE - Matching Image 1 Exactly */}
      {isEditing && (
        <div id="profileEditCard" className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', maxWidth: '900px', margin: '0 auto', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-pen-to-square" style={{ color: '#7C3AED' }}></i> Edit College Details
            </h3>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleCancel} 
              style={{ padding: '6px 14px', fontSize: '13px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Row 1, Col 1: College Name */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                  College / Institution Legal Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  className="form-control" 
                  required 
                  placeholder="e.g. National Institute of Technology"
                  style={{ width: '100%', fontSize: '14px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>

              {/* Row 1, Col 2: Affiliated University */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                  Affiliated University / Board
                </label>
                <input 
                  type="text" 
                  value={formData.affiliation} 
                  onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })} 
                  className="form-control" 
                  placeholder="e.g. State Autonomous Technical University"
                  style={{ width: '100%', fontSize: '14px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>

              {/* Row 2, Col 1: NAAC Grade */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                  NAAC Grade / AICTE Approval Code
                </label>
                <input 
                  type="text" 
                  value={formData.naac_grade} 
                  onChange={(e) => setFormData({ ...formData, naac_grade: e.target.value })} 
                  className="form-control" 
                  placeholder="e.g. A+ / 1-3512891"
                  style={{ width: '100%', fontSize: '14px', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #7C3AED', outline: 'none' }}
                />
              </div>

              {/* Row 2, Col 2: Official Contact Email */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                  Official Contact Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="email" 
                  value={formData.contact_email} 
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} 
                  className="form-control" 
                  required 
                  placeholder="e.g. principal@vapex.edu.in"
                  style={{ width: '100%', fontSize: '14px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>

              {/* Row 3, Col 1: Official Contact Phone */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                  Official Contact Phone / Landline
                </label>
                <input 
                  type="tel" 
                  value={formData.contact_phone} 
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} 
                  className="form-control" 
                  placeholder="e.g. 040-23456789 / 9876543210"
                  style={{ width: '100%', fontSize: '14px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>

              {/* Row 3, Col 2: College Logo / Crest (Choose File) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                  College Logo / Crest
                </label>
                <input 
                  type="file" 
                  id="college_logo" 
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="form-control" 
                  style={{ 
                    width: '100%', 
                    fontSize: '13px', 
                    padding: '7px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff'
                  }} 
                />
                {formData.logo_url && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                      src={formData.logo_url} 
                      alt="Logo Preview" 
                      style={{ maxHeight: '38px', maxWidth: '60px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '2px', background: '#fff' }} 
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current Logo Uploaded</span>
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, logo_url: '' })}
                      style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Row 4: Campus Physical Address (Span full width) */}
              <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                  Campus Physical Address
                </label>
                <textarea 
                  rows="3" 
                  value={formData.address} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                  className="form-control" 
                  placeholder="Street Address, Campus City, State - PIN Code"
                  style={{ width: '100%', fontSize: '14px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                ></textarea>
              </div>
            </div>

            {/* Bottom: Save Button matching Image 1 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button 
                type="button" 
                onClick={handleCancel} 
                className="btn btn-outline" 
                style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  background: '#7C3AED', 
                  color: '#ffffff', 
                  border: 'none', 
                  padding: '11px 26px', 
                  fontSize: '14px', 
                  fontWeight: '700', 
                  borderRadius: '10px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-circle-check"></i> Save College Details
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default OrgAdministrationCollegeDetails;