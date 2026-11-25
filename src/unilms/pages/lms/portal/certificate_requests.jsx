import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import { studentsService } from '../../../services/students.service';

const LmsPortalCertificateRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [certType, setCertType] = useState('Bonafide Certificate');
  const [deliveryMode, setDeliveryMode] = useState('Digital Download');
  const [urgencyLevel, setUrgencyLevel] = useState('Normal');
  const [reason, setReason] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [previewCert, setPreviewCert] = useState(null);

  const { confirm, ConfirmDialog } = useConfirmDialog();

  const loadRequests = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await studentsService.getCertificateRequests();
      const list = res?.data || res || [];
      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load certificate requests from PostgreSQL:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadRequests(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(requests, 5);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!certType) return;

    const user = (() => { try { return JSON.parse(localStorage.getItem('unilms_user') || '{}'); } catch { return {}; } })();
    const studentName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Enrolled Student';
    const rollNumber = user.rollNumber || user.roll_number || 'STU-ONLINE';

    const confirmed = await confirm({
      title: 'Confirm Certificate Request',
      message: `Submit official application for "${certType}"?`,
      details: [
        `Student Name: ${studentName}`,
        `Roll Number: ${rollNumber}`,
        `Certificate Type: ${certType}`,
        `Delivery Mode: ${deliveryMode}`,
        `Urgency Level: ${urgencyLevel}`,
        `Purpose / Reason: ${reason.trim() || 'Required for State Post-Matric Merit Scholarship 2026-27'}`
      ],
      confirmText: 'Yes, Submit Request',
      variant: 'primary',
      icon: 'fa-solid fa-file-signature'
    });
    if (!confirmed) return;

    try {
      await studentsService.createCertificateRequest({
        certificateType: certType,
        deliveryMode,
        urgency: urgencyLevel,
        reason: reason.trim() || 'Required for State Post-Matric Merit Scholarship 2026-27'
      });
      showToast(`Application for ${certType} successfully submitted to the Academic Registrar!`);
      setReason('');
      await loadRequests();
    } catch (err) {
      alert('Failed to submit certificate request: ' + err.message);
    }
  };

  return (
    <>
      <ConfirmDialog />

      <div className="lms-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <i className="fa-solid fa-certificate me-2" style={{ color: "var(--primary)" }}></i>
              Official Academic Certificate Desk
              
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
              Request digitally signed certificates directly from the Academic Registrar for visas, scholarships, internships, or transfer procedures.
            </p>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669", padding: "14px 18px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontWeight: "600" }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: "18px" }}></i>
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="lms-portal-grid-split">
        <div className="card" style={{ border: "1px solid var(--border)", borderRadius: "16px", minWidth: 0, width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
              <i className="fa-solid fa-file-signature"></i>
            </div>
            <div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "17px", fontWeight: "800", margin: "0", color: "var(--text-main)" }}>Apply for Certificate</h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Standard Processing: 2-3 Working Days</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Certificate Type *</label>
              <select value={certType} onChange={(e) => setCertType(e.target.value)} className="form-control" required style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)" }}>
                <option value="Bonafide Certificate">Bonafide Certificate (General / Passport / Visa)</option>
                <option value="Fee Estimate Certificate">Fee Estimate Certificate</option>
                <option value="Medium of Instruction Certificate">Medium of Instruction Certificate (English)</option>
                <option value="No Objection Certificate (NOC for External Internship)">No Objection Certificate (NOC for External Internship)</option>
                <option value="Course Completion / Study Certificate">Course Completion / Study Certificate</option>
                <option value="Custodian / Original Documents Certificate">Custodian / Original Documents Certificate</option>
                <option value="Conduct & Character Certificate">Conduct &amp; Character Certificate</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Delivery Mode *</label>
              <select value={deliveryMode} onChange={(e) => setDeliveryMode(e.target.value)} className="form-control" required style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)" }}>
                <option value="Digital Download">Digital Download (Cryptographically Signed PDF)</option>
                <option value="Physical Collect at Counter">Physical Collect at Counter</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Urgency Level *</label>
              <select value={urgencyLevel} onChange={(e) => setUrgencyLevel(e.target.value)} className="form-control" required style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)" }}>
                <option value="Normal">Normal (2-3 Working Days)</option>
                <option value="Urgent">Urgent (Express 24-Hour TAT)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Purpose / Reason *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
                placeholder="Required for State Post-Matric Merit Scholarship 2026-27..."
                className="form-control"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)", resize: "vertical" }}
              />
            </div>

            <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px 14px", marginBottom: "18px", fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-shield-halved" style={{ color: "var(--primary)", fontSize: "16px" }}></i>
              <span>All issued certificates are cryptographically verifiable and stamped by the Registrar Office.</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "11px", borderRadius: "10px", fontWeight: "700", fontSize: "13.5px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <i className="fa-solid fa-paper-plane"></i> Submit Formal Request
            </button>
          </form>
        </div>

        <div className="card" style={{ border: "1px solid var(--border)", borderRadius: "16px", minWidth: 0, width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "17px", fontWeight: "800", margin: "0", color: "var(--text-main)" }}>
              <i className="fa-solid fa-clock-rotate-left me-2" style={{ color: "var(--primary)" }}></i> Request History &amp; Downloads
            </h3>
            <span className="badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", fontSize: "11px", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>
              {totalItems} Applications
            </span>
          </div>

          <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-canvas)" }}>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Certificate</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Reason</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Date</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Status</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={5} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                      No certificate applications submitted yet.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((req) => (
                    <tr key={req.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "700", fontSize: "13px", color: "var(--text-main)" }}>
                        <div>{req.certificateType || req.certificate_type}</div>
                        <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--primary)", fontWeight: "700" }}>
                          {req.trackingCode || `CERT-${req.id?.slice(0, 8)?.toUpperCase()}`}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "12px", color: "var(--text-muted)", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={req.reason}>
                        {req.reason}
                      </td>
                      <td style={{ padding: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (req.date || 'Today')}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="badge" style={{
                          background: req.status === "Issued" || req.status === "Approved" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                          color: req.status === "Issued" || req.status === "Approved" ? "var(--success)" : "var(--warning)",
                          fontSize: "11px",
                          padding: "3px 8px",
                          borderRadius: "8px",
                          fontWeight: "700"
                        }}>
                          {req.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {req.status === "Issued" || req.status === "Approved" ? (
                          <button
                            type="button"
                            onClick={() => setPreviewCert(req)}
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "700" }}
                          >
                            <i className="fa-solid fa-file-arrow-down"></i> View &amp; Print
                          </button>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                            In Review
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="requests"
          />
        </div>
      </div>

      {/* Official Certificate Letterhead Preview Modal */}
      {previewCert && (
        <div
          id="certModalBackdrop"
          onClick={(e) => {
            if (e.target.id === 'certModalBackdrop') setPreviewCert(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: 'min(620px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              padding: '36px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Formal University Letterhead */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #1E1B4B', paddingBottom: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <i className="fa-solid fa-graduation-cap" style={{ fontSize: '28px', color: '#4F46E5' }}></i>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1E1B4B', letterSpacing: '0.5px' }}>
                  UNILMS UNIVERSITY OF TECHNOLOGY
                </h2>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                OFFICE OF THE ACADEMIC REGISTRAR &bull; ACCREDITED 'A++' GRADE
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                Campus Knowledge Park, Tech Corridor &bull; Ref: UNILMS/CERT/{previewCert.id?.slice(0, 8)?.toUpperCase()}
              </div>
            </div>

            {/* Certificate Title */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '16px', color: '#0F172A', fontWeight: '800', borderBottom: '1px dashed #CBD5E1', display: 'inline-block', paddingBottom: '4px' }}>
                {previewCert.certificateType || previewCert.certificate_type}
              </h3>
            </div>

            {/* Certificate Body Paragraph */}
            <div style={{ fontSize: '13.5px', lineHeight: '1.8', color: '#334155', textAlign: 'justify', marginBottom: '30px' }}>
              <p>
                This is to officially certify that <strong>{previewCert.studentName || previewCert.student_name || 'Enrolled Student'}</strong>, Roll Number <strong>{previewCert.rollNumber || previewCert.roll_number || 'STU-ONLINE'}</strong>, 
                is a bonafide student of this institution, currently enrolled in the academic degree program.
              </p>
              <p style={{ marginTop: '12px' }}>
                This certificate is issued upon the student's request for <strong>{previewCert.reason || 'official administrative and travel pass verification'}</strong>. 
                According to the university records, the medium of instruction for all lectures and laboratory examinations is English, 
                and the student bears a satisfactory conduct throughout their academic tenure.
              </p>
            </div>

            {/* Signatures & Verification Stamp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  <i className="fa-solid fa-shield-halved text-success me-1"></i> Digitally Verified Certificate
                </div>
                <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>
                  Issued on: {new Date(previewCert.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '16px', fontWeight: '700', color: '#1E1B4B' }}>
                  Dr. C. R. Ramanathan
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>Academic Registrar</div>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>UniLMS University</div>
              </div>
            </div>

            {/* Modal Controls */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-outline"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-print"></i> Print Certificate
              </button>
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '13px' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LmsPortalCertificateRequests;
