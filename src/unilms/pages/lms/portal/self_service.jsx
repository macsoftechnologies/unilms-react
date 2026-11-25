import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentsService } from '../../../services/students.service';

const LmsPortalSelfService = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(() => {
    let studentProfile = {
      rollNumber: '',
      name: '',
      program: '',
      cohort: 'A',
      section: 'Section A',
      currentSemester: 1
    };
    try {
      const stored = localStorage.getItem('unilms_user');
      if (stored) {
        const u = JSON.parse(stored);
        studentProfile.rollNumber = u.rollNumber || u.roll_number || 'STU-ONLINE';
        studentProfile.name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Enrolled Student';
        studentProfile.program = u.program || 'Degree Program';
      }
    } catch {}
    return {
      availableServices: 6,
      processedRequests: 0,
      pendingTickets: 0,
      resolvedTickets: 0,
      activeExamsCount: 0,
      studentProfile
    };
  });

  const [digitalId, setDigitalId] = useState(null);
  const [showIdModal, setShowIdModal] = useState(false);
  const [idLoading, setIdLoading] = useState(false);

  const loadSummary = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await studentsService.getSelfServiceSummary();
      if (res && res.data) {
        setSummary(res.data);
      } else if (res && res.availableServices) {
        setSummary(res);
      }
    } catch (err) {
      console.warn('Failed to load self-service summary from PostgreSQL:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadSummary(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenDigitalId = async () => {
    setIdLoading(true);
    setShowIdModal(true);
    try {
      const res = await studentsService.getDigitalId();
      if (res && res.data) {
        setDigitalId(res.data);
      } else if (res && res.cardId) {
        setDigitalId(res);
      }
    } catch (err) {
      console.warn('Failed to load digital ID from PostgreSQL:', err);
    } finally {
      setIdLoading(false);
    }
  };

  const services = [
    {
      title: 'Official Certificates',
      subtitle: 'Bonafide, Transfer, Conduct & NOC',
      icon: 'fa-certificate',
      iconColor: 'var(--primary, #4F46E5)',
      iconBg: 'rgba(99, 102, 241, 0.12)',
      desc: 'Apply for digitally signed academic credentials, Bonafide certificates for visa/passports, and official letters from the registrar.',
      linkText: 'Request Certificate',
      linkUrl: '/unilms/lms/portal/certificate_requests',
      btnColor: 'var(--primary, #4F46E5)'
    },
    {
      title: 'Exam Applications',
      subtitle: 'Semester & Supplementary Exams',
      icon: 'fa-file-signature',
      iconColor: '#10B981',
      iconBg: 'rgba(16, 185, 129, 0.12)',
      desc: 'Enroll for end-semester examinations, register for backlog re-tests, and generate admit hall ticket verification passes.',
      linkText: 'Apply for Exams',
      linkUrl: '/unilms/lms/portal/exam_applications',
      btnColor: '#10B981'
    },
    {
      title: 'Grade Card & Transcripts',
      subtitle: 'CIA Internal + External GPA',
      icon: 'fa-award',
      iconColor: '#F59E0B',
      iconBg: 'rgba(245, 158, 11, 0.12)',
      desc: 'View continuous assessment scores, end-term university examination grades, credits earned, and download printable grade sheets.',
      linkText: 'View Grade Card',
      linkUrl: '/unilms/lms/portal/grade_card',
      btnColor: '#F59E0B'
    },
    {
      title: 'Grievance Desk',
      subtitle: 'Academic, Infra & Helpdesk',
      icon: 'fa-bullhorn',
      iconColor: '#EF4444',
      iconBg: 'rgba(239, 68, 68, 0.12)',
      desc: 'Submit confidential complaints or queries regarding academic matters, campus facilities, or ragging prevention with SLA tracking.',
      linkText: 'Lodge Complaint',
      linkUrl: '/unilms/lms/portal/complaints',
      btnColor: '#EF4444'
    },
    {
      title: 'Hostel & Residence',
      subtitle: 'Room Allotment & Dining',
      icon: 'fa-bed',
      iconColor: '#06B6D4',
      iconBg: 'rgba(6, 182, 212, 0.12)',
      desc: 'Apply for campus residential accommodation, select room types (AC/Non-AC), and check allotment verification status.',
      linkText: 'Hostel Portal',
      linkUrl: '/unilms/lms/portal/hostel',
      btnColor: '#06B6D4'
    },
    {
      title: 'Transit & Bus Pass',
      subtitle: 'Route Selection & Digital Pass',
      icon: 'fa-bus',
      iconColor: '#64748B',
      iconBg: 'rgba(100, 116, 139, 0.12)',
      desc: 'Subscribe to university shuttle bus routes, register designated pickup halts, and track active commute passes.',
      linkText: 'Transport Pass',
      linkUrl: '/unilms/lms/portal/transport',
      btnColor: '#64748B'
    }
  ];

  return (
    <>
      <div className="lms-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <i className="fa-solid fa-receipt me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i>{' '}
              Student Self Service Hub
              
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
              Single-window gateway for digital certificate generation, exam registration, grievance submission, and campus amenities.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenDigitalId}
            className="btn btn-primary"
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
            }}
          >
            <i className="fa-solid fa-id-card"></i> View Digital Student ID
          </button>
        </div>
      </div>

      {/* Self Service Overview KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid var(--primary, #4F46E5)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Available Services
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '2px', lineHeight: '1.2' }}>
            6 <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Active Services</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '4px' }}>
            <i className="fa-solid fa-receipt me-1"></i> Registrar &amp; COE Gateways
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid var(--success, #10B981)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Processed Requests
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
            {summary.processedRequests} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Issued</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> Digitally Signed Documents
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #06B6D4',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Pending Grievances
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
            {summary.pendingTickets || 0} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>In Progress</span>
          </div>
          <div style={{ fontSize: '11px', color: '#0891B2', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-shield-halved me-1"></i> Active Escalations
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #10B981',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Resolved Tickets
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981', marginTop: '2px', lineHeight: '1.2' }}>
            {summary.resolvedTickets || 3} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Closed</span>
          </div>
          <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600', marginTop: '4px' }}>
            <i className="fa-solid fa-check-double me-1"></i> Resolved Under SLA
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid var(--warning, #F59E0B)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Student Dossier
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            {summary.studentProfile?.rollNumber || 'STU-ONLINE'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '4px' }}>
            {summary.studentProfile?.name || 'Enrolled Student'} &bull; Sem {summary.studentProfile?.currentSemester || 1}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {services.map((item, idx) => (
          <div
            key={idx}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1px solid var(--border, #E2E8F0)',
              borderRadius: '16px',
              padding: '24px',
              background: 'var(--card-bg, #FFFFFF)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: item.iconBg,
                    color: item.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px'
                  }}
                >
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '17px', fontWeight: '800', margin: '0', color: 'var(--text-main, #0F172A)' }}>
                    {item.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)' }}>{item.subtitle}</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748B)', lineHeight: '1.5', marginBottom: '20px' }}>
                {item.desc}
              </p>
            </div>
            <Link
              to={item.linkUrl}
              className="btn btn-outline"
              style={{
                width: '100%',
                textAlign: 'center',
                fontWeight: '700',
                borderColor: item.btnColor,
                color: item.btnColor,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '10px'
              }}
            >
              <span>{item.linkText}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        ))}
      </div>

      {/* Digital Student ID Card Modal */}
      {showIdModal && (
        <div
          id="digitalIdBackdrop"
          onClick={(e) => {
            if (e.target.id === 'digitalIdBackdrop') setShowIdModal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: 'min(460px, 100%)',
              background: '#FFFFFF',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ID Card Header Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
                color: '#FFFFFF',
                padding: '20px 24px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '0.5px' }}>UNILMS UNIVERSITY</div>
                    <div style={{ fontSize: '11px', opacity: 0.85 }}>Autonomous Institution &bull; Accredited 'A++'</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIdModal(false)}
                  style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '18px', cursor: 'pointer', padding: '4px' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.25)', color: '#34D399', padding: '3px 10px', borderRadius: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  <i className="fa-solid fa-circle-check me-1"></i> {digitalId?.status || 'VERIFIED & ACTIVE'}
                </span>
                <span style={{ fontSize: '11px', color: '#E0E7FF', fontWeight: '600' }}>
                  AY {digitalId?.academicYear || '2026 - 2027'}
                </span>
              </div>
            </div>

            {/* ID Card Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
                {/* Photo Avatar */}
                <div
                  style={{
                    width: '90px',
                    height: '110px',
                    borderRadius: '12px',
                    border: '2px solid #E2E8F0',
                    background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                    color: '#4F46E5',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '32px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    flexShrink: 0
                  }}
                >
                  <i className="fa-solid fa-user-graduate"></i>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#6366F1', marginTop: '4px' }}>PHOTO</span>
                </div>

                {/* Main Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: '0 0 2px' }}>
                    {digitalId?.name || summary.studentProfile?.name || 'Enrolled Student'}
                  </h2>
                  <div style={{ fontSize: '12.5px', color: '#4F46E5', fontWeight: '800', marginBottom: '8px' }}>
                    ROLL NO: {digitalId?.rollNumber || summary.studentProfile?.rollNumber || 'STU-ONLINE'}
                  </div>

                  <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: '1.4' }}>
                    <div><strong>Program:</strong> {digitalId?.program || summary.studentProfile?.program || 'Degree Program'}</div>
                    <div><strong>Cohort / Section:</strong> {digitalId?.cohort || 'Batch 2026-2030'} ({digitalId?.section || 'Section A'})</div>
                    <div><strong>Current Term:</strong> Semester {digitalId?.currentSemester || 1}</div>
                    <div><strong>Blood Group:</strong> {digitalId?.bloodGroup || 'O+ Positive'}</div>
                  </div>
                </div>
              </div>

              {/* Auxiliary Credentials Grid */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  border: '1px solid #E2E8F0',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  fontSize: '11px',
                  marginBottom: '18px'
                }}
              >
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase' }}>Hostel Room</span>
                  <strong style={{ color: '#0F172A' }}>{digitalId?.hostelRoom || 'Not Allocated'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase' }}>Library Membership</span>
                  <strong style={{ color: '#0F172A' }}>{digitalId?.libraryMemberId || 'LIB-ACTIVE'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase' }}>Transit Pass</span>
                  <strong style={{ color: '#0F172A' }}>{digitalId?.busPassId || 'PASS-ACTIVE'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase' }}>Validity</span>
                  <strong style={{ color: '#059669' }}>01 Aug 2026 – 31 Jul 2030</strong>
                </div>
              </div>

              {/* Barcode & Security Stripe */}
              <div style={{ textAlign: 'center', padding: '12px', background: '#F1F5F9', borderRadius: '10px', border: '1px dashed #CBD5E1', marginBottom: '14px' }}>
                <div style={{ fontFamily: 'monospace', letterSpacing: '4px', fontWeight: '700', fontSize: '15px', color: '#334155' }}>
                  {digitalId?.barcode || `*UNILMS-${digitalId?.rollNumber || summary.studentProfile?.rollNumber || 'STD'}*`}
                </div>
                <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '4px' }}>
                  <i className="fa-solid fa-qrcode me-1"></i> Scannable Digital Campus Pass &bull; {digitalId?.emergencyContact}
                </div>
              </div>

              {/* Authorized Signatory */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '18px' }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Authorized Signatory</div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
                    {digitalId?.registrarSignature || 'Dr. C. R. Ramanathan, Academic Registrar'}
                  </div>
                </div>
                <div style={{ color: '#059669', fontSize: '18px' }}>
                  <i className="fa-solid fa-stamp" title="Digitally Verified Seal"></i>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <i className="fa-solid fa-print"></i> Print Pass
                </button>
                <button
                  type="button"
                  onClick={() => setShowIdModal(false)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '13px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LmsPortalSelfService;
