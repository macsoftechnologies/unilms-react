import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../components';
import { facultyService } from '../../services/faculty.service';

const FacultyLeaves = () => {
  const { confirmAction, ConfirmModal } = useConfirmDialog();
  const [leaves, setLeaves] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [applyForm, setApplyForm] = useState({
    leave_type: 'Casual Leave (CL)',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadLeaves = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const res = await facultyService.getLeaves();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setLeaves(list);
    } catch (e) {
      console.error('Failed to load faculty leaves:', e);
      if (!isPolling) showToast('Failed to sync leaves from server.');
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  // 30s Background Sync Polling
  useEffect(() => {
    const timer = setInterval(() => {
      loadLeaves(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadLeaves]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!applyForm.start_date || !applyForm.end_date || !applyForm.reason.trim()) {
      showToast('Please provide start date, end date, and reason.');
      return;
    }

    setSubmitting(true);
    try {
      await facultyService.applyLeave(applyForm);
      showToast('Leave application submitted to HOD successfully.');
      setApplyForm({
        leave_type: 'Casual Leave (CL)',
        start_date: '',
        end_date: '',
        reason: '',
      });
      await loadLeaves();
    } catch (err) {
      console.error('Failed to submit leave:', err);
      showToast('Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    const actionLabel = newStatus === 'Approved' ? 'Approve' : 'Decline';
    confirmAction({
      title: `${actionLabel} Leave Application?`,
      message: `Are you sure you want to ${actionLabel.toLowerCase()} this faculty leave application?`,
      confirmLabel: `${actionLabel} Leave`,
      confirmVariant: newStatus === 'Approved' ? 'primary' : 'danger',
      onConfirm: async () => {
        try {
          await facultyService.updateLeaveStatus(id, newStatus);
          showToast(`Leave application marked as ${newStatus}.`);
          await loadLeaves();
        } catch (e) {
          console.error('Failed to update leave status:', e);
          showToast('Failed to update leave status on server.');
        }
      },
    });
  };

  const handleDelete = (id) => {
    confirmAction({
      title: 'Cancel Leave Application?',
      message: 'Are you sure you want to cancel and delete this leave application permanently?',
      confirmLabel: 'Yes, Cancel Leave',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await facultyService.deleteLeave(id);
          showToast('Leave application cancelled.');
          await loadLeaves();
        } catch (e) {
          console.error('Failed to cancel leave:', e);
          showToast('Failed to cancel leave.');
        }
      },
    });
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        l.full_name?.toLowerCase().includes(q) ||
        l.employee_code?.toLowerCase().includes(q) ||
        l.leave_type?.toLowerCase().includes(q) ||
        l.reason?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || l.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [leaves, searchQuery, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedLeaves,
    totalItems,
  } = useTablePagination(filteredLeaves, 10);

  return (
    <>
      <ConfirmModal />
      <section className="view-section active">
        {toastMsg && (
          <div
            style={{
              background: '#10B981',
              color: '#fff',
              padding: '12px 18px',
              borderRadius: '10px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button
              onClick={() => setToastMsg(null)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        <div className="module-header d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="h4 font-weight-bold mb-1" style={{ fontSize: '20px', fontWeight: '800' }}>
              <i className="fa-solid fa-plane-departure text-primary me-2"></i> Faculty Leaves &amp; On-Duty Approvals
            </h1>
            <p className="text-muted small mb-0" style={{ fontSize: '12.5px' }}>
              Submit casual, medical, and duty leave applications &amp; audit departmental faculty attendance
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => loadLeaves()}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              title="Refresh Data"
            >
              <i className="fa-solid fa-arrows-rotate me-1"></i> Refresh
            </button>
          </div>
        </div>

        {/* Quick Leave Application Form Card */}
        <div
          style={{
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #e2e8f0)',
            padding: '18px 22px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-pen-to-square text-indigo"></i> Apply for Institutional Leave / On-Duty (OD)
          </div>

          <form
            onSubmit={handleApply}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Leave Type
              </label>
              <select
                value={applyForm.leave_type}
                onChange={(e) => setApplyForm({ ...applyForm, leave_type: e.target.value })}
                className="form-control"
                style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                <option value="Duty Leave (DL)">Duty Leave (DL) - Conference / Exam</option>
                <option value="Sick Leave (SL)">Sick Leave (SL) / Medical</option>
                <option value="Earned Leave (EL)">Earned Leave (EL)</option>
                <option value="Compensatory Off (CO)">Compensatory Off (CO)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                From Date
              </label>
              <input
                type="date"
                value={applyForm.start_date}
                onChange={(e) => setApplyForm({ ...applyForm, start_date: e.target.value })}
                className="form-control"
                required
                style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                To Date
              </label>
              <input
                type="date"
                value={applyForm.end_date}
                onChange={(e) => setApplyForm({ ...applyForm, end_date: e.target.value })}
                className="form-control"
                required
                style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Reason / Remarks
              </label>
              <input
                type="text"
                placeholder="Reason or paper presentation topic..."
                value={applyForm.reason}
                onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                className="form-control"
                required
                style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '38px',
                  background: '#4F46E5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Submitting...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i> Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Table & Filter Card */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search staff, code, leave type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ width: '260px', maxWidth: '100%', height: '36px', borderRadius: '6px', fontSize: '13px' }}
              />
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: '36px', borderRadius: '6px', fontSize: '13px' }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
              Showing {filteredLeaves.length} records
            </span>
          </div>

          <div className="table-responsive" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '720px', margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Employee Code</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Staff Name</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Leave Category</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Duration (From - To)</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Reason</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={7} rows={pageSize || 5} />
                ) : paginatedLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No leave applications found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedLeaves.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: '#4F46E5', fontFamily: 'monospace' }}>
                        {l.employee_code}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: '#1E293B' }}>
                        {l.full_name}
                        <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '400' }}>{l.department}</div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px' }}>
                        {l.leave_type}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '600' }}>
                        {l.start_date} &bull; {l.end_date}
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{l.days} Day(s)</div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '12.5px', color: '#475569', maxWidth: '240px' }}>
                        {l.reason}
                        {l.remarks && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                            {l.remarks}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          className="badge"
                          style={{
                            background:
                              l.status === 'Approved'
                                ? 'rgba(5, 150, 105, 0.1)'
                                : l.status === 'Pending'
                                ? 'rgba(217, 119, 6, 0.1)'
                                : 'rgba(239, 68, 68, 0.1)',
                            color:
                              l.status === 'Approved'
                                ? '#059669'
                                : l.status === 'Pending'
                                ? '#D97706'
                                : '#EF4444',
                            fontWeight: '700',
                            padding: '4px 10px',
                            borderRadius: '6px',
                          }}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', padding: '14px 18px' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {l.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(l.id, 'Approved')}
                                className="btn btn-outline"
                                style={{ padding: '4px 10px', fontSize: '12px', color: '#059669', borderColor: '#86efac' }}
                                title="Sanction Leave"
                              >
                                <i className="fa-solid fa-check"></i>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(l.id, 'Rejected')}
                                className="btn btn-outline"
                                style={{ padding: '4px 10px', fontSize: '12px', color: '#EF4444', borderColor: '#fca5a5' }}
                                title="Decline Leave"
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(l.id)}
                            className="btn btn-outline text-danger"
                            style={{ padding: '4px 10px', fontSize: '12px', borderColor: '#fee2e2' }}
                            title="Cancel / Delete Record"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <TablePagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemName="leave applications"
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default FacultyLeaves;
