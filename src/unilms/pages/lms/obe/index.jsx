import React from 'react';

const LmsObeIndex = () => {
  const programOutcomes = [
    {
      code: 'PO1',
      title: 'Engineering Knowledge',
      desc: 'Apply mathematics, science, computing foundations, and engineering specialization to solve complex computer science problems.',
      status: 'Accredited'
    },
    {
      code: 'PO2',
      title: 'Problem Analysis',
      desc: 'Identify, formulate, research literature, and analyze complex software engineering problems reaching substantiated conclusions.',
      status: 'Accredited'
    },
    {
      code: 'PO3',
      title: 'Design & Development of Solutions',
      desc: 'Design scalable solutions for complex computing problems, architectures, and components meeting public safety, cultural, and environmental criteria.',
      status: 'Accredited'
    },
    {
      code: 'PO4',
      title: 'Conduct Investigations of Complex Problems',
      desc: 'Use research-based knowledge and research methods including design of experiments, analysis and synthesis of information to provide valid conclusions.',
      status: 'Accredited'
    },
    {
      code: 'PO5',
      title: 'Modern Tool Usage',
      desc: 'Create, select, and apply modern engineering and IT tools including modeling, CI/CD pipelines, containerization, and profiling tools.',
      status: 'Accredited'
    },
    {
      code: 'PSO1',
      title: 'Cloud & Distributed Systems',
      desc: 'Architect and deploy fault-tolerant cloud-native microservices, container orchestrations, and secure APIs for enterprise-grade workloads.',
      status: 'Accredited'
    }
  ];

  const subjectsCOs = [
    {
      name: 'Cloud Architecture & DevOps Microservices',
      code: 'CS402',
      cos: [
        { code: 'CO1', text: 'Analyze multi-tier enterprise systems and design containerized microservice architectures using Docker and Kubernetes.' },
        { code: 'CO2', text: 'Implement automated CI/CD deployment pipelines incorporating automated test verification and static analysis.' },
        { code: 'CO3', text: 'Configure service mesh mutual TLS, distributed tracing, and real-time observability telemetry using Prometheus and Grafana.' },
        { code: 'CO4', text: 'Evaluate serverless execution models and hybrid cloud cost-governance frameworks.' }
      ]
    },
    {
      name: 'Advanced Algorithms & System Design',
      code: 'CS201',
      cos: [
        { code: 'CO1', text: 'Analyze asymptotic time and space computational complexity of advanced tree and graph algorithms.' },
        { code: 'CO2', text: 'Apply dynamic programming and greedy paradigms to optimize combinatorial graph traversal problems.' },
        { code: 'CO3', text: 'Implement distributed hash tables, consistent hashing, and consensus protocols in high-throughput environments.' }
      ]
    },
    {
      name: 'Database Internals & Distributed Systems',
      code: 'CS202',
      cos: [
        { code: 'CO1', text: 'Examine database storage engine architectures, B+ tree indexing structures, and write-ahead logging (WAL).' },
        { code: 'CO2', text: 'Formulate transaction schedules under serializability, two-phase locking (2PL), and multi-version concurrency control (MVCC).' },
        { code: 'CO3', text: 'Assess partition tolerance, eventual consistency, and quorum replication models under the CAP theorem.' }
      ]
    }
  ];

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
            6 <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>POs &amp; PSOs</span>
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
            2.84 <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>/ 3.00</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-arrow-trend-up me-1"></i> 94.7% Attainment Level
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
            10 <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>COs Mapped</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> Direct CIE/TEE Mappings
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
          {subjectsCOs.map((sub, sIdx) => (
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
          ))}
        </div>
      </div>
    </>
  );
};

export default LmsObeIndex;