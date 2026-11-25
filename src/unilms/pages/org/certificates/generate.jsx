import React, { useState, useEffect } from 'react';
import studentsService from '../../../services/students.service';

const CERTIFICATE_TEMPLATES = [
  { id: 'bonafide', name: 'Bonafide Student Certificate', category: 'Enrollment Verification' },
  { id: 'completion', name: 'Course Completion & Character Certificate', category: 'Academic Clearance' },
  { id: 'noc', name: 'No Objection Certificate (Internship / Industrial Visit)', category: 'Corporate & Career' },
  { id: 'transfer', name: 'Official Transfer & Conduct Certificate (TC)', category: 'Institutional Exit' },
  { id: 'merit', name: 'Dean\'s Academic Excellence & Merit Award', category: 'Honors & Recognition' }
];

const OrgCertificatesGenerate = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [issuingDate, setIssuingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const liveStudents = await studentsService.getStudents();
        const list = Array.isArray(liveStudents) ? liveStudents : (liveStudents?.data || []);
        setStudents(list);
        if (list.length > 0) {
          setSelectedStudentId(list[0].id);
        }
        setSelectedTemplateId('bonafide');
      } catch (e) {
        console.warn('Failed to load students for certificate generation:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!selectedTemplateId || !selectedStudentId) {
      setToastMsg('Please select both a certificate template and a student.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    const t = CERTIFICATE_TEMPLATES.find((tpl) => tpl.id === selectedTemplateId);
    const s = students.find((std) => std.id === selectedStudentId);

    if (t && s) {
      const studentName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
      const prog = s.program?.name || 'Computer Science & Engineering';
      const roll = s.rollNumber || '2026-UG-01';

      setPreviewDoc({
        template: t,
        student: s,
        certificateNumber: `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        studentName,
        roll,
        prog,
        date: new Date(issuingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      });
    }
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .certificate-preview-box { border: 4px double #0F172A !important; box-shadow: none !important; }
        }
      `}</style>

      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#EF4444', color: '#fff', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
            {toastMsg}
          </div>
        )}

        <div className="view-header no-print">
          <div>
            <h2><i className="fa-solid fa-stamp text-primary me-2"></i> Issue Official Institutional Certificate</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              Select a verified enrolled student and authorized template to generate, preview, and print formal university certificates.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: previewDoc ? '1fr 1.3fr' : '1fr', gap: '24px' }}>
          {/* Issue Form */}
          <div className="card no-print" style={{ padding: '24px', height: 'fit-content' }}>
            <form onSubmit={handleGenerate}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-main, #0F172A)' }}>
                  1. Select Certificate Template *
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="form-control"
                  style={{ height: '42px', width: '100%', borderRadius: '8px', padding: '0 12px' }}
                  required
                >
                  <option value="">-- Choose Template --</option>
                  {CERTIFICATE_TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-main, #0F172A)' }}>
                  2. Select Student Recipient *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="form-control"
                  style={{ height: '42px', width: '100%', borderRadius: '8px', padding: '0 12px' }}
                  required
                >
                  <option value="">-- Choose Enrolled Student --</option>
                  {loading ? (
                    <option disabled>Loading students from database...</option>
                  ) : (
                    students.map((st) => {
                      const name = `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student';
                      const prog = st.program?.name || 'CSE';
                      return (
                        <option key={st.id} value={st.id}>
                          {st.rollNumber} — {name} ({prog})
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-main, #0F172A)' }}>
                  3. Official Issue Date
                </label>
                <input
                  type="date"
                  value={issuingDate}
                  onChange={(e) => setIssuingDate(e.target.value)}
                  className="form-control"
                  style={{ height: '42px', width: '100%', borderRadius: '8px', padding: '0 12px' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', height: '44px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '10px' }}
              >
                <i className="fa-solid fa-file-invoice"></i> Generate &amp; Preview Certificate
              </button>
            </form>
          </div>

          {/* Certificate Live Preview */}
          {previewDoc && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }} className="no-print">
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669', background: '#DCFCE7', padding: '3px 10px', borderRadius: '12px' }}>
                  <i className="fa-solid fa-check me-1"></i> Generated Successfully
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: '700', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="fa-solid fa-print"></i> Print Certificate
                </button>
              </div>

              <div
                className="certificate-preview-box"
                style={{
                  border: '3px double #1E293B',
                  borderRadius: '12px',
                  padding: '36px 30px',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontFamily: 'Georgia, serif',
                  textAlign: 'center',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#64748B', marginBottom: '6px' }}>
                  Apex University of Technology &amp; Higher Education
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 10px', color: '#1E1B4B', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {previewDoc.template.name}
                </h1>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '24px' }}>
                  Certificate Serial: <strong>{previewDoc.certificateNumber}</strong> &bull; Date: {previewDoc.date}
                </div>

                <p style={{ fontSize: '14px', lineHeight: '2', margin: '0 0 24px', color: '#334155' }}>
                  This is to certify that <strong>{previewDoc.studentName}</strong>, bearing University Roll Number{' '}
                  <strong>{previewDoc.roll}</strong>, is a bonafide student of this institution pursuing the{' '}
                  <strong>{previewDoc.prog}</strong> academic degree program. During their study, their conduct and
                  academic character have been exemplary.
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                  <div style={{ textAlign: 'center', width: '160px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700' }}>Academic Registrar</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>Institutional Office</div>
                  </div>
                  <div style={{ textAlign: 'center', width: '160px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700' }}>Dean of Academics</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>Apex University</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default OrgCertificatesGenerate;
