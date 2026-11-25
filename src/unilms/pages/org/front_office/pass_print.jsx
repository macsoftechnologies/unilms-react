import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import frontOfficeService from '../../../services/front-office.service';

const OrgFrontOfficePassPrint = () => {
  const [searchParams] = useSearchParams();
  const visitorId = searchParams.get('id');
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPass = async () => {
      setLoading(true);
      try {
        if (visitorId) {
          const data = await frontOfficeService.getVisitorById(visitorId);
          setVisitor(data);
        } else {
          const list = await frontOfficeService.getVisitors();
          if (Array.isArray(list) && list.length > 0) {
            setVisitor(list[0]);
          }
        }
      } catch (e) {
        console.error('Failed to load gatepass:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPass();
  }, [visitorId]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#0ea5e9', display: 'block', marginBottom: '12px' }}></i>
        Loading Visitor Gate Pass...
      </div>
    );
  }

  if (!visitor) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>No Visitor Gate Pass Found</h3>
        <p style={{ color: '#64748b' }}>The requested gate pass could not be retrieved from PostgreSQL.</p>
        <Link to="/unilms/org/front_office/visitors" className="btn btn-primary" style={{ padding: '8px 16px', textDecoration: 'none' }}>
          Back to Visitors Book
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '650px', margin: '20px auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Action Bar (No Print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link
          to="/unilms/org/front_office/visitors"
          style={{ textDecoration: 'none', color: '#475569', fontWeight: '600', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Visitors Registry
        </Link>
        <button
          onClick={() => window.print()}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '13.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
          }}
        >
          <i className="fa-solid fa-print"></i> Print Visitor Pass
        </button>
      </div>

      {/* Printable Pass Card */}
      <div
        className="pass-card"
        style={{
          background: '#fff',
          border: '2px solid #0284C7',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            color: '#fff',
            padding: '20px 24px',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: '700' }}>
            APEX INSTITUTE OF TECHNOLOGY &amp; MANAGEMENT
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '4px 0', letterSpacing: '-0.3px' }}>
            VISITOR SECURITY CLEARANCE PASS
          </h1>
          <div style={{ fontSize: '12px', opacity: '0.85' }}>
            Campus Main Gate 1 &bull; Central Security Checkpoint
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '4px 14px',
              background: '#fff',
              color: '#0369A1',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '800',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            {visitor.passNumber || visitor.pass_number}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Visitor Full Name</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {visitor.visitorName || visitor.visitor_name}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Contact Phone</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                {visitor.phone}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Visitor Type</div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0284c7', marginTop: '2px' }}>
                {visitor.visitorType || visitor.visitor_type}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>ID Proof Verification</div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#334155', marginTop: '2px' }}>
                {visitor.idProof || 'Verified at Security Desk'}
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Meeting Host / Staff</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                  {visitor.personToMeet || visitor.person_to_meet}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Department / Facility</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginTop: '2px' }}>
                  {visitor.department || 'Central Administration'}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Purpose of Visit</div>
              <div style={{ fontSize: '13.5px', color: '#1e293b', marginTop: '2px' }}>
                {visitor.purpose}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>In-Time (Entry)</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a', marginTop: '2px' }}>
                <i className="fa-solid fa-clock me-1"></i>
                {visitor.inTime ? new Date(visitor.inTime).toLocaleString() : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Out-Time (Exit)</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: visitor.outTime ? '#475569' : '#0284c7', marginTop: '2px' }}>
                {visitor.outTime ? new Date(visitor.outTime).toLocaleString() : 'Active On Campus'}
              </div>
            </div>
          </div>

          {/* Barcode Mock Visual */}
          <div style={{ textAlign: 'center', padding: '12px 0', borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', marginBottom: '24px' }}>
            <div style={{ fontFamily: 'monospace', letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
              ||| | | |||| | ||| |||| | | ||| || | ||
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              SECURITY SCAN CODE: {visitor.passNumber || visitor.pass_number}
            </div>
          </div>

          {/* Signature Blocks */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #475569', width: '160px', height: '30px' }}></div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>Security Desk Officer</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #475569', width: '160px', height: '30px' }}></div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>Visitor Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgFrontOfficePassPrint;
