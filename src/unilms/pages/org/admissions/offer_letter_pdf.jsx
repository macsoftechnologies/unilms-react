import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import admissionsService from '../../../services/admissions.service';

const OrgAdmissionsOfferLetterPdf = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const searchParams = new URLSearchParams(location.search);
        const targetId = searchParams.get('id') || location.state?.id;

        const apps = await admissionsService.getApplications();
        const list = Array.isArray(apps) ? apps : [];

        if (targetId) {
          const match = list.find(a => a.id === targetId || a.applicationNumber === targetId);
          if (match) {
            setCandidate(match);
            return;
          }
        }

        // If no ID or match, use first available applicant
        if (list.length > 0) {
          setCandidate(list[0]);
        }
      } catch (e) {
        console.warn('Failed to load candidate for offer letter:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [location.search, location.state]);

  const candidateName = candidate?.fullName || candidate?.full_name || 'Accepted Applicant';
  const appNumber = candidate?.applicationNumber || candidate?.adm_number || 'APP-2026-001';
  const programName = candidate?.programName || candidate?.program?.name || 'Undergraduate Degree Program';
  const category = candidate?.admissionCategory || candidate?.admission_category || 'General (Open Merit)';
  const phone = candidate?.phone || '+91 98765 43210';
  const email = candidate?.email || 'applicant@example.com';
  const issueDate = candidate?.createdAt ? new Date(candidate.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh', padding: '30px 20px' }}>
      {/* Top Action Bar */}
      <div style={{ maxWidth: '800px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          to="/unilms/org/admissions/offers"
          className="btn btn-outline"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            color: '#334155',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Offers
        </Link>
        <button
          onClick={() => window.print()}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 20px',
            background: '#7C3AED',
            border: 'none',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
          }}
        >
          <i className="fa-solid fa-print"></i> Print / Save as PDF
        </button>
      </div>

      {/* Official Offer Letter Card */}
      <div
        className="letter-container"
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          border: '1px solid #E2E8F0',
          color: '#1E293B',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #7C3AED', paddingBottom: '24px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E1B4B', margin: '0 0 4px 0' }}>UniLMS Institute of Technology & Management</h1>
            <div style={{ fontSize: '13px', color: '#64748B' }}>Campus Administrative Building, Technical Knowledge Park</div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Institution Code: <strong style={{ color: '#1E293B' }}>ORG1</strong></div>
          </div>
          <div style={{ textAlign: 'right', background: 'rgba(124, 58, 237, 0.08)', padding: '12px 18px', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#7C3AED', letterSpacing: '0.5px' }}>PROVISIONAL ADMISSION OFFER</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6366F1', marginTop: '4px' }}>Ref: OFF-{appNumber}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '13.5px', color: '#475569' }}>
          <div>Date of Issue: <strong style={{ color: '#1E293B' }}>{issueDate}</strong></div>
          <div>Offer Status: <strong style={{ color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 10px', borderRadius: '12px' }}>PROVISIONALLY OFFERED</strong></div>
        </div>

        <div style={{ background: '#F8FAFC', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #E2E8F0' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>To Candidate:</h4>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>{candidateName}</div>
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            Application No: <strong style={{ color: '#7C3AED' }}>{appNumber}</strong> | Mobile: {phone} | Email: {email}
          </div>
        </div>

        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1E1B4B', margin: '20px 0 14px 0', borderLeft: '4px solid #7C3AED', paddingLeft: '12px' }}>
          Sub: Offer of Provisional Admission for Academic Session 2026-2027
        </div>

        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155' }}>
          Dear <strong>{candidateName}</strong>,
        </p>
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155' }}>
          We are pleased to inform you that based on your application and evaluation, you have been provisionally selected for admission to <strong>UniLMS Institute of Technology & Management</strong>.
        </p>

        <table style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', margin: '24px 0', border: '1px solid #E2E8F0', borderRadius: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#475569', width: '35%' }}>Program / Branch</th>
              <td style={{ padding: '12px 16px', fontSize: '13.5px', fontWeight: '600', color: '#1E293B' }}>{programName}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>Admission Category</th>
              <td style={{ padding: '12px 16px', fontSize: '13.5px', color: '#1E293B' }}>{category}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>Admission Fee Amount</th>
              <td style={{ padding: '12px 16px', fontSize: '15px', fontWeight: '700', color: '#7C3AED' }}>₹85,000.00</td>
            </tr>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>Payment Due Date</th>
              <td style={{ padding: '12px 16px', fontSize: '13.5px', fontWeight: '600', color: '#DC2626' }}>Within 14 Days</td>
            </tr>
          </tbody>
        </table>

        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '16px', margin: '24px 0', fontSize: '12.5px', color: '#92400E', lineHeight: '1.6' }}>
          <strong>Terms & Conditions:</strong><br />
          1. This offer is provisional and subject to the physical verification of all original certificates and mark sheets.<br />
          2. Failure to accept this offer or submit the admission fee on or before the due date may lead to cancellation of this allotment.<br />
          3. Upon payment confirmation, your unique Student Roll Number and Unified LMS credentials will be provisioned.
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ height: '50px' }}></div>
            <div style={{ borderTop: '1px dashed #94A3B8', paddingTop: '8px', fontSize: '12.5px', color: '#64748B' }}>Candidate Acceptance</div>
          </div>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ height: '30px', fontWeight: '700', color: '#7C3AED', fontSize: '15px' }}>[ Seal & Signature ]</div>
            <div style={{ borderTop: '1px dashed #94A3B8', paddingTop: '8px', fontSize: '12.5px', color: '#1E293B', fontWeight: '600' }}>Registrar / Admissions Office</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgAdmissionsOfferLetterPdf;