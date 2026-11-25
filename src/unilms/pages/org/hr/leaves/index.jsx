import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../../components';
import leavesService from '../../../../services/leaves.service';
import staffService from '../../../../services/staff.service';

const OrgHrLeavesIndex = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [leaves, setLeaves] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toastMsg, setToastMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [applyForm, setApplyForm] = useState({
    staff_id: '',
    leave_type: 'Casual Leave (CL)',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [leavesData, staffData] = await Promise.all([
        leavesService.getLeaves(),
        staffService.getStaff()
      ]);

      const staffMembers = Array.isArray(staffData) ? staffData : [];
      setStaffList(staffMembers);
      if (staffMembers.length > 0 && !applyForm.staff_id) {
        setApplyForm(prev => ({ ...prev, staff_id: staffMembers[0].id }));
      }

      const normalized = (Array.isArray(leavesData) ? leavesData : []).map(l => ({
        id: l.id,
        full_name: `${l.staff?.firstName || ''} ${l.staff?.lastName || ''}`.trim() || 'Staff Member',
        employee_code: l.staff?.employeeCode || '—',
        department: l.staff?.department?.name || 'Department',
        leave_type: l.leaveType || l.leave_type || 'Casual Leave',
        start_date: l.startDate ? l.startDate.split('T')[0] : (l.start_date || '—'),
        end_date: l.endDate ? l.endDate.split('T')[0] : (l.end_date || '—'),
        reason: l.reason || 'Personal leave',
        status: l.status ? (l.status.charAt(0).toUpperCase() + l.status.slice(1).toLowerCase()) : 'Pending',
        remarks: l.approvedBy ? `Processed by ${l.approvedBy}` : 'Awaiting HR Authority review'
      }));
      setLeaves(normalized);
    } catch (err) {
      console.error('Fetch leaves error:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchData(true);
      }
    }, 30000); // 30s background sync polling
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!applyForm.staff_id || !applyForm.start_date || !applyForm.end_date || !applyForm.reason.trim()) {
      alert('Please select staff, dates, and provide a reason.');
      return;
    }

    const selectedStaff = staffList.find(s => s.id === applyForm.staff_id);
    const staffName = selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName || ''}`.trim() : 'Staff Member';

    const ok = await confirm({
      title: 'Confirm Leave Submission',
      message: `Submit a ${applyForm.leave_type} request for ${staffName} from ${applyForm.start_date} to ${applyForm.end_date}? Record will be registered in the central leave ledger.`,
      confirmText: 'Submit Leave',
      cancelText: 'Cancel',
      type: 'primary',
    });
    if (!ok) return;

    try {
      await leavesService.applyLeave({
        staffId: applyForm.staff_id,
        leaveType: applyForm.leave_type,
        startDate: applyForm.start_date,
        endDate: applyForm.end_date,
        reason: applyForm.reason.trim(),
        status: 'pending'
      });

      showToast('Leave request submitted successfully.');
      setApplyForm({
        staff_id: staffList.length > 0 ? staffList[0].id : '',
        leave_type: 'Casual Leave (CL)',
        start_date: '',
        end_date: '',
        reason: ''
      });
      fetchData();
    } catch (err) {
      console.error('Apply leave error:', err);
      alert('Failed to submit leave request.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const isApprove = newStatus.toLowerCase() === 'approved';
    const ok = await confirm({
      title: isApprove ? 'Confirm Leave Approval' : 'Confirm Leave Rejection',
      message: `Are you sure you want to mark this staff leave application as ${newStatus}?`,
      confirmText: isApprove ? 'Approve Leave' : 'Reject Leave',
      cancelText: 'Cancel',
      type: isApprove ? 'primary' : 'danger',
    });
    if (!ok) return;

    try {
      await leavesService.updateLeaveStatus(id, newStatus.toLowerCase());
      showToast(`Leave application marked as ${newStatus}.`);
      fetchData();
    } catch (err) {
      console.error('Status change error:', err);
      alert('Failed to update leave status.');
    }
  };

  const filteredLeaves = leaves.filter(l => {
    const matchesSearch = l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.leave_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.employee_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedLeaves,
    totalItems
  } = useTablePagination(filteredLeaves, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, setCurrentPage]);

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;

  return (
    <>
      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* Top Header Card matching Reference UI (Image 1 & 2) */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: 'clamp(16px, 3vw, 22px) clamp(18px, 3vw, 26px)',
            marginBottom: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                minWidth: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(219, 39, 119, 0.3)'
              }}
            >
              <i className="fa-solid fa-person-walking-arrow-right"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Staff Leave Management &amp; Approvals
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Track employee leave quotas, apply for leave requests, and manage approvals across departments &bull; AY 2026&ndash;2027
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              to="/unilms/org/hr/employees"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(219, 39, 119, 0.25)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-users"></i>
              <span>Staff Directory</span>
            </Link>
            <Link
              to="/unilms/org/hr/payroll/payslips"
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#DB2777' }}></i>
              <span>Payslips Hub</span>
            </Link>
          </div>
        </div>

        {/* Statistical KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Requests
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>
                {leaves.length} Filed
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                Current Semester Count
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-calendar-days"></i>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pending Review
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>
                {pendingCount} Pending
              </div>
              <div style={{ fontSize: '12px', color: '#D97706', marginTop: '4px', fontWeight: '600' }}>
                Requires HOD Sign-off
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-hourglass-half"></i>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Sanctioned Leaves
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                {approvedCount} Sanctioned
              </div>
              <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                Substituted & Approved
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Annual Quota
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#7C3AED', marginTop: '4px' }}>
                30 Days / Yr
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                12 CL + 10 SL + 8 EL
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-umbrella-beach"></i>
            </div>
          </div>

        </div>

        {/* Quick Apply Card */}
        <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '12px', padding: '22px 24px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-plus-circle" style={{ color: '#4F46E5' }}></i> Submit Leave Application
          </h3>
          <form onSubmit={handleApply} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>Staff Member *</label>
              <select
                className="form-control"
                value={applyForm.staff_id}
                onChange={(e) => setApplyForm({ ...applyForm, staff_id: e.target.value })}
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                required
              >
                <option value="">-- Choose Employee --</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName || s.first_name} {s.lastName || s.last_name} ({s.employeeCode || s.employee_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>Leave Category</label>
              <select
                className="form-control"
                value={applyForm.leave_type}
                onChange={(e) => setApplyForm({ ...applyForm, leave_type: e.target.value })}
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="Casual Leave (CL)">Casual Leave (CL) - Quota: 12</option>
                <option value="Sick Leave (SL)">Sick Leave (SL) - Quota: 10</option>
                <option value="Earned Leave (EL)">Earned Leave (EL) - Quota: 8</option>
                <option value="Duty Leave (DL)">Duty Leave (DL) - Quota: Official</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>Start Date</label>
              <input
                type="date"
                required
                value={applyForm.start_date}
                onChange={(e) => setApplyForm({ ...applyForm, start_date: e.target.value })}
                className="form-control"
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>End Date</label>
              <input
                type="date"
                required
                value={applyForm.end_date}
                onChange={(e) => setApplyForm({ ...applyForm, end_date: e.target.value })}
                className="form-control"
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>Reason</label>
              <input
                type="text"
                required
                placeholder="Reason for leave request"
                value={applyForm.reason}
                onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                className="form-control"
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', height: '40px', fontWeight: '700', borderRadius: '8px', background: '#4F46E5', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <i className="fa-solid fa-paper-plane"></i> Submit Request
              </button>
            </div>
          </form>
        </div>

        {/* Requests Table */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', background: 'var(--card-bg, #fff)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#1E293B' }}>
                All Staff Leave History & Requests
              </h3>
              <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}>
                {filteredLeaves.length} Total
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-control"
                style={{ height: '38px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Only</option>
                <option value="Approved">Approved Only</option>
                <option value="Rejected">Rejected Only</option>
              </select>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                placeholder="Search staff or leave type..."
                style={{ height: '38px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '240px' }}
              />
            </div>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: '0' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leave Type</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Range</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reason</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remarks</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>HR Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={7} rows={pageSize || 5} />
                ) : paginatedLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted, #64748b)' }}>
                      <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '26px', marginBottom: '8px', display: 'block', opacity: 0.4 }}></i>
                      No leave applications found matching your criteria
                    </td>
                  </tr>
                ) : (
                  paginatedLeaves.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <strong style={{ color: '#1E293B' }}>{l.full_name}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>{l.employee_code} • {l.department}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontWeight: '700', fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }}>
                          {l.leave_type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13.5px' }}>
                        <strong>{l.start_date}</strong> to <strong>{l.end_date}</strong>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-muted, #64748b)', maxWidth: '220px' }}>
                        {l.reason}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge" style={{
                          background: l.status === 'Approved' ? 'rgba(16, 185, 129, 0.12)' : l.status === 'Pending' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: l.status === 'Approved' ? '#10B981' : l.status === 'Pending' ? '#D97706' : '#EF4444',
                          fontWeight: '700',
                          fontSize: '12px',
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '12.5px', color: '#64748B' }}>
                        {l.remarks}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        {l.status === 'Pending' ? (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => handleStatusChange(l.id, 'Approved')}
                              style={{ padding: '5px 10px', fontSize: '12px', color: '#059669', borderColor: '#a7f3d0', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-check"></i> Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => handleStatusChange(l.id, 'Rejected')}
                              style={{ padding: '5px 10px', fontSize: '12px', color: '#DC2626', borderColor: '#fecaca', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-xmark"></i> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>Closed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Standardized Table Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="applications"
          />
        </div>

        <ConfirmDialog />
      </section>
    </>
  );
};

export default OrgHrLeavesIndex;