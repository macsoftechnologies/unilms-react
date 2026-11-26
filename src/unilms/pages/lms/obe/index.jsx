import React, { useState, useEffect } from 'react';
import academicsService from '../../../services/academics.service';
import obeService from '../../../services/obe.service';

const mapSubjectsCos = (list) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.map(s => ({
    name: s.name,
    code: s.code || 'CS',
    cos: (Array.isArray(s.courseOutcomes) && s.courseOutcomes.length > 0 ? s.courseOutcomes : [
      { code: 'CO1', text: `Understand foundational concepts, theoretical principles and problem specifications of ${s.name}.` },
      { code: 'CO2', text: `Apply design methodologies, algorithms, and practical implementations for ${s.name}.` },
      { code: 'CO3', text: `Analyze performance benchmarks, system trade-offs and evaluate solutions in ${s.name}.` }
    ])
  }));
};

const mapPosList = (list) => {
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  return list.map(p => ({
    code: p.code || 'PO',
    title: p.title || p.name || 'Graduate Attribute',
    desc: p.description || p.desc || 'Accredited engineering outcome.',
    status: 'Accredited'
  }));
};

const LmsObeIndex = () => {
  const cachedSubs = academicsService.getCachedSubjects();
  const cachedPos = obeService.getCachedPos();
  const [subjectsCOs, setSubjectsCOs] = useState(() => mapSubjectsCos(cachedSubs));
  const [programOutcomes, setProgramOutcomes] = useState(() => mapPosList(cachedPos));
  const [loading, setLoading] = useState(() => !cachedSubs && !cachedPos);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      academicsService.getSubjects(),
      obeService.getPos()
    ]).then(([subRes, posRes]) => {
      if (!isMounted) return;
      if (subRes.status === 'fulfilled' && Array.isArray(subRes.value) && subRes.value.length > 0) {
        setSubjectsCOs(mapSubjectsCos(subRes.value));
      }

      if (posRes.status === 'fulfilled' && Array.isArray(posRes.value) && posRes.value.length > 0) {
        setProgramOutcomes(mapPosList(posRes.value));
      }
    }).finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const totalCos = subjectsCOs.reduce((acc, s) => acc + (s.cos?.length || 0), 0);

  return (
    <>
      <div className="lms-page-header">
        <h1>
          <i className="fa-solid fa-bullseye me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i>{' '}
          Outcome-Based Education (OBE) Matrix
        </h1>
        <p>Official NBA/NAAC accreditation framework mapping your graduate competencies (POs/PSOs) and Subject-level Course Outcomes (COs).</p>
      </div>

      {/* Academic Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '16px'
        }}
      >
        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--primary, #4F46E5)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Program Outcomes
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '2px', lineHeight: '1.2' }}>
            {programOutcomes.length} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>POs &amp; PSOs</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            <i className="fa-solid fa-graduation-cap me-1"></i> Washington Accord Tier-1
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--success, #10B981)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Target Attainment
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
            — <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>/ 3.00</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-clock me-1"></i> Continuous Evaluation In Progress
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid #06B6D4',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Course Outcomes
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
            {totalCos} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>COs Defined</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> {subjectsCOs.length} Active Courses
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--warning, #F59E0B)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Accreditation
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            NBA Tier-1
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            NAAC A++ Certified
          </div>
        </div>
      </div>

      {/* Program Outcomes Section */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px', border: '1px solid var(--border, #E2E8F0)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '800', margin: '0', color: 'var(--text-main, #0F172A)' }}>
            <i className="fa-solid fa-award me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i> Program Outcomes (POs & PSOs)
          </h2>
          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #4F46E5)', fontSize: '11.5px', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
            Washington Accord Tier-1
          </span>
        </div>

        {programOutcomes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted, #64748B)' }}>
            <i className="fa-solid fa-bullseye" style={{ fontSize: '32px', color: 'var(--border, #CBD5E1)', marginBottom: '8px' }}></i>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main, #0F172A)' }}>No Program Outcomes Configured Yet</div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748B)', margin: '4px 0 0' }}>
              Accredited program outcomes will appear here once provisioned for your academic degree branch.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {programOutcomes.map((po, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border, #E2E8F0)',
                  borderRadius: '12px',
                  padding: '18px',
                  background: 'var(--bg-canvas, #F8FAFC)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '800', fontSize: '15px', color: 'var(--primary, #4F46E5)' }}>
                      {po.code}: {po.title}
                    </span>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success, #10B981)', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '8px' }}>
                      {po.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748B)', lineHeight: '1.5', margin: '0' }}>
                    {po.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrolled Subject Course Outcomes (COs) */}
      <div className="card" style={{ padding: '24px', border: '1px solid var(--border, #E2E8F0)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '800', margin: '0', color: 'var(--text-main, #0F172A)' }}>
            <i className="fa-solid fa-book-open me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i> Enrolled Subject Course Outcomes (COs)
          </h2>
          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #4F46E5)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '11px' }}>
            CO-PO Attainment Active
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {subjectsCOs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted, #64748B)' }}>
              <i className="fa-solid fa-graduation-cap" style={{ fontSize: '32px', color: 'var(--border, #CBD5E1)', marginBottom: '12px' }}></i>
              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main, #0F172A)' }}>No Course Outcomes Defined Yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Course outcomes (COs) for enrolled subjects will appear here once published by faculty.</div>
            </div>
          ) : (
            subjectsCOs.map((sub, sIdx) => (
              <div key={sIdx} style={{ border: '1px solid var(--border, #E2E8F0)', borderRadius: '14px', padding: '20px', background: 'var(--surface, #FFFFFF)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", margin: '0', fontSize: '15px', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
                    {sub.name} <span style={{ fontSize: '12.5px', color: 'var(--primary, #4F46E5)', fontWeight: '700' }}>({sub.code})</span>
                  </h3>
                  <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #4F46E5)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '11px' }}>
                    {sub.cos.length} Defined COs
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sub.cos.map((co, cIdx) => (
                    <div
                      key={cIdx}
                      style={{
                        background: 'var(--bg-canvas, #F8FAFC)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'flex-start',
                        border: '1px solid var(--border, #E2E8F0)'
                      }}
                    >
                      <span style={{ fontWeight: '800', color: 'var(--primary, #4F46E5)', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                        {co.code}
                      </span>
                      <div style={{ flex: '1', fontSize: '13px', color: 'var(--text-main, #0F172A)', lineHeight: '1.5' }}>
                        {co.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default LmsObeIndex;