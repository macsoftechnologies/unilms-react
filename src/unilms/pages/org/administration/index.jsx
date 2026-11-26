import React from 'react';
import { Link } from 'react-router-dom';

const OrgAdministrationIndex = () => {
  const adminSections = [
    {
      title: 'College Details',
      desc: 'Institutional identity, accreditation, principal & governance profile.',
      icon: 'fa-building',
      color: '#7C3AED',
      bg: '#F5F3FF',
      link: '/unilms/org/administration/college_details'
    },
    {
      title: 'Lecture Halls',
      desc: 'Classrooms, amphitheaters, smart projectors and seating capacity.',
      icon: 'fa-chalkboard',
      color: '#2563EB',
      bg: '#EFF6FF',
      link: '/unilms/org/administration/lecture_halls'
    },
    {
      title: 'Locations',
      desc: 'Campuses, administrative blocks, wings, and facility locations.',
      icon: 'fa-map-location-dot',
      color: '#059669',
      bg: '#ECFDF5',
      link: '/unilms/org/administration/locations'
    },
    {
      title: 'Agents / Counselors',
      desc: 'Manage admission agents, outreach partners, and referral incentives.',
      icon: 'fa-users-viewfinder',
      color: '#D97706',
      bg: '#FEF3C7',
      link: '/unilms/org/administration/agents'
    },
    {
      title: 'Holidays',
      desc: 'Official institutional calendars, public holidays, and festival breaks.',
      icon: 'fa-umbrella-beach',
      color: '#E11D48',
      bg: '#FFF1F2',
      link: '/unilms/org/administration/holidays'
    },
    {
      title: 'Bank Details',
      desc: 'Manage institutional fee collection accounts, IFSC and payment gateways.',
      icon: 'fa-building-columns',
      color: '#4F46E5',
      bg: '#EEF2FF',
      link: '/unilms/org/administration/bank_details'
    }
  ];

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
            <i className="fa-solid fa-sitemap"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Administration &amp; Campus Setup
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Manage organization-level settings, campus infrastructure, academic calendar, and governance
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/unilms/org/administration/college_details"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-building" style={{ color: '#475569' }}></i>
            <span>College Profile</span>
          </Link>
          <Link
            to="/unilms/org/administration/lecture_halls"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #475569 0%, #334155 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(51, 65, 85, 0.25)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-chalkboard"></i>
            <span>Campus Infrastructure</span>
          </Link>
        </div>
      </div>

      {/* Grid of Administration Sections (matches user image 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {adminSections.map((sec, idx) => (
          <Link
            key={idx}
            to={sec.link}
            style={{ textDecoration: 'none' }}
          >
            <div 
              className="card" 
              style={{
                padding: '28px 24px',
                borderRadius: '14px',
                textAlign: 'center',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg, #ffffff)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div 
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: sec.bg,
                  color: sec.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  marginBottom: '16px'
                }}
              >
                <i className={`fa-solid ${sec.icon}`}></i>
              </div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {sec.title}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                {sec.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
};

export default OrgAdministrationIndex;