import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import { studentsService } from '../../../services/students.service';

const LmsPortalComplaints = () => {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [category, setCategory] = useState('Hostel & Facilities');
  const [priority, setPriority] = useState('High');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);

  const { confirm, ConfirmDialog } = useConfirmDialog();

  const loadComplaints = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await studentsService.getComplaints();
      const list = res?.data || res || [];
      setComplaints(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load student complaints from PostgreSQL:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadComplaints(true);
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
  } = useTablePagination(complaints, 5);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    const confirmed = await confirm({
      title: 'Confirm Register Grievance Ticket',
      message: `Submit confidential inquiry under category "${category}"?`,
      details: [
        `Category: ${category}`,
        `Priority: ${priority}`,
        `Grievance Subject: ${subject.trim()}`,
        `Description: ${description.trim()}`,
        'SLA Response Time: 48 Hours Guarantee',
        'Confidentiality: Routed directly to Department Dean & ICC Desk'
      ],
      confirmText: 'Yes, Lodge Grievance',
      variant: 'primary',
      icon: 'fa-solid fa-triangle-exclamation'
    });
    if (!confirmed) return;

    try {
      await studentsService.createComplaint({
        category,
        priority,
        subject: subject.trim(),
        description: description.trim()
      });
      showToast('Grievance ticket registered! Department administrators have been notified.');
      setSubject('');
      setDescription('');
      await loadComplaints();
    } catch (err) {
      alert('Failed to register complaint: ' + err.message);
    }
  };

  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const pendingCount = complaints.filter(c => c.status === 'Pending' || c.status === 'Open').length;

  return (
    <>
      <ConfirmDialog />

      <div className="lms-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <i className="fa-solid fa-bullhorn me-2" style={{ color: "var(--danger)" }}></i>
              Student Grievance &amp; Complaint Redressal
              
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
              Direct communication channel with department heads, facility managers, and the Internal Complaints Committee (ICC).
            </p>
          </div>
        </div>
      </div>

      {/* Grievance KPI Cards */}
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
            Total Complaints
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '2px', lineHeight: '1.2' }}>
            {complaints.length} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Logged</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '4px' }}>
            <i className="fa-solid fa-ticket me-1"></i> Active Audit Ledger
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
            Resolved
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981', marginTop: '2px', lineHeight: '1.2' }}>
            {resolvedCount} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Under SLA</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> Redressed by Dean / Warden
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
            In Progress
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
            {inProgressCount} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Active</span>
          </div>
          <div style={{ fontSize: '11px', color: '#0891B2', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-spinner fa-spin me-1"></i> Assigned to Investigation
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
            Pending
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            {pendingCount} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Queued</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '4px' }}>
            <i className="fa-solid fa-clock me-1"></i> Awaiting SLA Allocation
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
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "17px", fontWeight: "800", margin: "0", color: "var(--text-main)" }}>Lodge New Grievance</h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Confidential Redressal Ticket</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-control" required style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)" }}>
                <option value="Hostel & Facilities">Hostel &amp; Facilities</option>
                <option value="Academics">Academics &amp; Curriculum</option>
                <option value="Transport">Transport &amp; Bus Routes</option>
                <option value="Canteen">Canteen &amp; Dining Mess</option>
                <option value="Infrastructure">Campus Infrastructure &amp; Labs</option>
                <option value="Anti-Ragging">Anti-Ragging &amp; Safety Desk (High Priority)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Priority *</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-control" required style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)" }}>
                <option value="High">High (Urgent Attention)</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
                <option value="Emergency">Emergency (Immediate Intervention)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Grievance Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Hot water geyser non-functional on 3rd floor Block B..."
                className="form-control"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                placeholder="The solar water line in Block B Room 304 is not heating during morning hours..."
                className="form-control"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)", resize: "vertical" }}
              />
            </div>

            <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px 14px", marginBottom: "18px", fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-lock" style={{ color: "var(--danger)", fontSize: "16px" }}></i>
              <span>All submissions are confidential. You will receive SLA resolution audit logs here.</span>
            </div>

            <button type="submit" className="btn btn-danger" style={{ width: "100%", padding: "11px", borderRadius: "10px", fontWeight: "700", fontSize: "13.5px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#EF4444", color: "#fff", border: "none" }}>
              <i className="fa-solid fa-paper-plane"></i> Submit Formal Grievance
            </button>
          </form>
        </div>

        <div className="card" style={{ border: "1px solid var(--border)", borderRadius: "16px", minWidth: 0, width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "17px", fontWeight: "800", margin: "0", color: "var(--text-main)" }}>
              <i className="fa-solid fa-clock-rotate-left me-2" style={{ color: "var(--danger)" }}></i> Registered Tickets &amp; Audit Trail
            </h3>
            <span className="badge" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", fontSize: "11px", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>
              {totalItems} Tickets
            </span>
          </div>

          <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-canvas)" }}>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Category</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Subject</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Logged On</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Status</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)", textAlign: "right" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={5} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                      No grievance tickets registered.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((comp) => (
                    <tr key={comp.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "700", fontSize: "12px", color: "var(--text-main)" }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className="badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", fontSize: "10.5px", padding: "3px 8px", borderRadius: "6px", width: 'fit-content' }}>
                            {comp.category}
                          </span>
                          <span style={{ fontSize: "10.5px", fontFamily: "monospace", color: "#64748B", fontWeight: "700" }}>
                            {comp.ticketCode || `TCK-${comp.id?.slice(0, 6)?.toUpperCase()}`}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px", fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={comp.subject}>
                        {comp.subject}
                      </td>
                      <td style={{ padding: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                        {comp.createdAt ? new Date(comp.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (comp.date || 'Today')}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="badge" style={{
                          background: comp.status === "Resolved" ? "rgba(16, 185, 129, 0.12)" : "rgba(6, 182, 212, 0.12)",
                          color: comp.status === "Resolved" ? "var(--success)" : "#0891B2",
                          fontSize: "11px",
                          padding: "3px 8px",
                          borderRadius: "8px",
                          fontWeight: "700"
                        }}>
                          {comp.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setActiveTicket(comp)}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "700" }}
                        >
                          <i className="fa-solid fa-eye"></i> View Details
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
            itemName="tickets"
          />
        </div>
      </div>

      {/* Ticket Resolution Audit Modal */}
      {activeTicket && (
        <div
          id="ticketModalBackdrop"
          onClick={(e) => {
            if (e.target.id === 'ticketModalBackdrop') setActiveTicket(null);
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
              width: 'min(520px, 100%)',
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#F8FAFC', padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', fontWeight: '800', fontSize: '11px', padding: '4px 10px', borderRadius: '8px' }}>
                  {activeTicket.category}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                  Ticket #{activeTicket.id?.slice(0, 8)?.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '18px', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                {activeTicket.subject}
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', background: '#F1F5F9', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0', margin: '0 0 18px' }}>
                {activeTicket.description || 'No additional description provided.'}
              </p>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-user-shield text-primary"></i> Administrative Action &amp; Resolution
                </div>
                <div style={{ fontSize: '12.5px', color: '#334155', background: activeTicket.status === 'Resolved' ? '#ECFDF5' : '#EFF6FF', border: `1px solid ${activeTicket.status === 'Resolved' ? '#A7F3D0' : '#BFDBFE'}`, padding: '12px', borderRadius: '8px' }}>
                  {activeTicket.resolutionRemarks || (activeTicket.status === 'Resolved' ? 'Issue verified and resolved by campus engineering team.' : 'Ticket assigned to department administrator. Under active investigation.')}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '11px', color: '#64748B' }}>
                <span>Status: <strong style={{ color: activeTicket.status === 'Resolved' ? '#059669' : '#0284C7' }}>{activeTicket.status}</strong></span>
                <span>Date: {new Date(activeTicket.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '10px', fontWeight: '700' }}
              >
                Close Ticket View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LmsPortalComplaints;
