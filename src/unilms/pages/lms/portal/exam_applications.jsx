import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import { studentsService } from '../../../services/students.service';

const LmsPortalExamApplications = () => {
  const user = (() => { try { return JSON.parse(localStorage.getItem('unilms_user') || '{}'); } catch { return {}; } })();
  const studentName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Enrolled Student';
  const rollNumber = user.rollNumber || user.roll_number || 'STU-ONLINE';
  const programName = user.program || 'Degree Program';

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);

  const [toastMsg, setToastMsg] = useState(null);
  const [previewTicket, setPreviewTicket] = useState(null);

  const { confirm, ConfirmDialog } = useConfirmDialog();

  const loadApplications = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await studentsService.getExamRegistrations();
      const list = res?.data || res || [];
      setApplications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load exam registrations from PostgreSQL:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadApplications(true);
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
  } = useTablePagination(applications, 5);

  const handleEnroll = async (exam) => {
    const confirmed = await confirm({
      title: 'Confirm Exam Registration',
      message: `Enroll in "${exam.name}"?`,
      details: [
        `Examination Cycle: ${exam.name}`,
        `Evaluation Type: ${exam.type}`,
        `Examination Fee: ${exam.fee} (Auto-cleared via student account)`,
        'Hall Ticket: Will be generated and cryptographically verifiable'
      ],
      confirmText: 'Yes, Confirm Registration',
      variant: 'primary',
      icon: 'fa-solid fa-file-signature'
    });
    if (!confirmed) return;

    try {
      await studentsService.createExamRegistration({
        examName: exam.name,
        examType: exam.type,
        feeStatus: `Paid (${exam.fee})`,
        status: 'Registered & Hall Ticket Issued'
      });
      setAvailableExams(prev => prev.filter(e => e.id !== exam.id));
      showToast(`Successfully enrolled in ${exam.name}! Hall ticket generated in database.`);
      await loadApplications();
    } catch (err) {
      alert('Failed to enroll in exam: ' + err.message);
    }
  };

  return (
    <>
      <ConfirmDialog />

      <style>{`
        .lms-portal-grid-split {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 24px;
          align-items: start;
          width: 100%;
          box-sizing: border-box;
        }
        .exam-cycle-row {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-canvas);
          flex-wrap: wrap;
          gap: 12px;
        }
        @media (max-width: 992px) {
          .lms-portal-grid-split {
            display: flex !important;
            flex-direction: column !important;
            gap: 18px !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div className="lms-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <i className="fa-solid fa-file-signature me-2" style={{ color: "var(--primary)" }}></i>
              Examination Registration &amp; Hall Ticket Portal
              
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
              Enroll for semester examinations, register for supplementary re-tests, and generate verifiable hall tickets.
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
        {/* Available Exam Cycles for Enrollment */}
        <div className="card" style={{ border: "1px solid var(--border)", borderRadius: "16px", minWidth: 0, width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
              <i className="fa-solid fa-calendar-check"></i>
            </div>
            <div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "17px", fontWeight: "800", margin: "0", color: "var(--text-main)" }}>Open Exam Registrations</h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Controller of Examinations (COE) Window</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {availableExams.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", background: "var(--bg-canvas)", borderRadius: "12px", border: "1px dashed var(--border)", color: "var(--text-muted)", fontSize: "13px" }}>
                <i className="fa-solid fa-calendar-xmark me-2 text-muted"></i> No open examination registration windows at this time.
              </div>
            ) : (
              availableExams.map((exam) => (
                <div key={exam.id} className="exam-cycle-row">
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "800", color: "var(--text-main)" }}>{exam.name}</h4>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>{exam.type}</span>
                    <span className="badge" style={{ marginTop: "6px", background: "rgba(16, 185, 129, 0.12)", color: "var(--success)", fontSize: "11px", fontWeight: "700" }}>
                      Fee: {exam.fee}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEnroll(exam)}
                    className="btn btn-primary"
                    style={{ padding: "8px 14px", borderRadius: "8px", fontWeight: "700", fontSize: "12px" }}
                  >
                    Register &amp; Enroll
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Enrolled Applications & Hall Ticket Downloads */}
        <div className="card" style={{ border: "1px solid var(--border)", borderRadius: "16px", minWidth: 0, width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "17px", fontWeight: "800", margin: "0", color: "var(--text-main)" }}>
              <i className="fa-solid fa-id-card me-2" style={{ color: "var(--primary)" }}></i> Enrolled Registrations &amp; Hall Tickets
            </h3>
            <span className="badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", fontSize: "11px", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>
              {totalItems} Registrations
            </span>
          </div>

          <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-canvas)" }}>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Exam Session</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Hall Ticket No</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Fee Status</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={4} rows={pageSize || 4} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                      No exam registrations found in database.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((app) => (
                    <tr key={app.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "700", fontSize: "12.5px", color: "var(--text-main)" }}>
                        <div>{app.examName || app.exam_name}</div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>{app.examType || app.type}</span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "12px", fontFamily: "monospace", fontWeight: "700", color: "#4F46E5" }}>
                        {app.hallTicketNumber || app.hall_ticket}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="badge" style={{ background: "rgba(16, 185, 129, 0.12)", color: "var(--success)", fontSize: "11px", padding: "3px 8px", borderRadius: "8px", fontWeight: "700" }}>
                          {app.feeStatus || app.fee_status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setPreviewTicket(app)}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: "11.5px", padding: "5px 10px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "700" }}
                        >
                          <i className="fa-solid fa-download"></i> Download Hall Ticket
                        </button>
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
            itemName="registrations"
          />
        </div>
      </div>

      {/* Hall Ticket Admit Card Modal */}
      {previewTicket && (
        <div
          id="ticketModalBackdrop"
          onClick={(e) => {
            if (e.target.id === 'ticketModalBackdrop') setPreviewTicket(null);
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
              width: 'min(640px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              padding: '32px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #1E1B4B', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-graduation-cap" style={{ fontSize: '24px', color: '#4F46E5' }}></i>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1E1B4B' }}>UNILMS UNIVERSITY</h2>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                OFFICIAL EXAMINATION ADMIT CARD / HALL TICKET
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                {previewTicket.examName || previewTicket.exam_name}
              </div>
            </div>

            {/* Student & Ticket Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{studentName}</div>
                <div style={{ fontSize: '12px', color: '#4F46E5', fontWeight: '700', marginTop: '2px' }}>
                  Roll No: {rollNumber} &bull; {programName}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                  Exam Center: <strong>Academic Block 4, Hall A-101</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700' }}>HALL TICKET NO.</div>
                <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '800', color: '#1E1B4B' }}>
                  {previewTicket.hallTicketNumber || previewTicket.hall_ticket}
                </div>
                <span className="badge" style={{ marginTop: '4px', background: '#DCFCE7', color: '#15803D', fontSize: '10.5px', fontWeight: '700' }}>
                  FEE VERIFIED
                </span>
              </div>
            </div>

            {/* Registered Subjects Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Code</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Course Subject</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Date</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Session</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '8px', fontWeight: '700' }}>CS111</td>
                  <td style={{ padding: '8px' }}>Operating System Principles</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>05 Dec 2026</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>10:00 AM – 01:00 PM</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '8px', fontWeight: '700' }}>CS201</td>
                  <td style={{ padding: '8px' }}>Data Structures &amp; Algorithms</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>08 Dec 2026</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>10:00 AM – 01:00 PM</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '8px', fontWeight: '700' }}>CS202</td>
                  <td style={{ padding: '8px' }}>Database Management Systems</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>11 Dec 2026</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>10:00 AM – 01:00 PM</td>
                </tr>
              </tbody>
            </table>

            {/* Instructions */}
            <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.5', background: '#FFFBEB', padding: '12px', borderRadius: '8px', border: '1px solid #FDE68A', marginBottom: '20px' }}>
              <strong>Important Candidate Instructions:</strong><br />
              1. Candidates must report to the exam hall 20 minutes prior to session start.<br />
              2. Electronic gadgets, mobile devices, and smartwatches are strictly prohibited.<br />
              3. This Hall Ticket along with university photo identity card must be displayed during invigilation.
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-outline"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-print"></i> Print Admit Card
              </button>
              <button
                type="button"
                onClick={() => setPreviewTicket(null)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '13px' }}
              >
                Close Hall Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LmsPortalExamApplications;
