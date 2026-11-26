import { Link } from 'react-router-dom';
import React, { useState, useMemo, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import staffService from '../../../services/staff.service';

const OrgStaffDuties = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [duties, setDuties] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDuty, setEditingDuty] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    staff_id: '',
    task_name: '',
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Pending',
    remarks: ''
  });

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [dutiesData, staffData] = await Promise.all([
        staffService.getDuties(),
        staffService.getStaff()
      ]);

      const staffNormalized = (Array.isArray(staffData) ? staffData : []).map(s => ({
        id: s.id,
        full_name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Faculty Member',
        employee_code: s.employeeCode || '—',
        designation: s.designation || 'Faculty'
      }));
      setStaffList(staffNormalized);

      const normalizedDuties = (Array.isArray(dutiesData) ? dutiesData : []).map(d => ({
        id: d.id,
        staff_id: d.staffId || d.staff?.id,
        staff_name: d.staff ? `${d.staff.firstName} ${d.staff.lastName || ''}`.trim() : (d.staff_name || 'Faculty Member'),
        designation: d.staff?.designation || 'Faculty',
        task_name: d.taskName || d.task_name,
        assigned_by: d.assignedBy || d.assigned_by || 'Dean Academics',
        due_date: d.dueDate ? d.dueDate.split('T')[0] : (d.due_date || ''),
        status: d.status || 'Pending',
        remarks: d.remarks || ''
      }));
      setDuties(normalizedDuties);

      if (staffNormalized.length > 0 && !formData.staff_id) {
        setFormData(prev => ({ ...prev, staff_id: staffNormalized[0].id }));
      }
    } catch (err) {
      console.error('Fetch duties error:', err);
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

  const filteredDuties = useMemo(() => {
    return duties.filter((d) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (d.staff_name && d.staff_name.toLowerCase().includes(q)) ||
        (d.task_name && d.task_name.toLowerCase().includes(q)) ||
        (d.assigned_by && d.assigned_by.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [duties, searchQuery, statusFilter]);

  const totalDuties = duties.length;
  const completedCount = duties.filter(d => d.status === 'Completed').length;
  const inProgressCount = duties.filter(d => d.status === 'In Progress').length;
  const pendingCount = duties.filter(d => d.status === 'Pending' || d.status === 'Assigned').length;

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedDuties,
    totalItems
  } = useTablePagination(filteredDuties, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, setCurrentPage]);

  const handleOpenAddModal = () => {
    setEditingDuty(null);
    setFormData({
      id: '',
      staff_id: staffList[0]?.id || '',
      task_name: '',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (duty) => {
    setEditingDuty(duty);
    setFormData({
      id: duty.id,
      staff_id: duty.staff_id || staffList[0]?.id,
      task_name: duty.task_name || '',
      due_date: duty.due_date || '',
      status: duty.status || 'Pending',
      remarks: duty.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDuty(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.task_name.trim()) {
      alert('Task Name is required.');
      return;
    }

    const isEdit = Boolean(editingDuty);
    const assignedStaff = staffList.find(s => s.id === formData.staff_id) || staffList[0];

    const ok = await confirm({
      title: isEdit ? 'Confirm Duty Assignment Update' : 'Confirm New Duty Assignment',
      message: isEdit
        ? `Are you sure you want to update duty assignment "${formData.task_name}"? Changes will be saved to the database.`
        : `Are you sure you want to assign "${formData.task_name}" to ${assignedStaff?.full_name || 'selected faculty member'}?`,
      confirmText: isEdit ? 'Update Duty' : 'Assign Duty',
      cancelText: 'Cancel',
      type: 'primary',
    });
    if (!ok) return;

    try {
      if (editingDuty) {
        await staffService.updateDuty(editingDuty.id, {
          staffId: formData.staff_id,
          taskName: formData.task_name,
          dueDate: formData.due_date,
          status: formData.status,
          remarks: formData.remarks
        });
      } else {
        await staffService.createDuty({
          staffId: formData.staff_id,
          taskName: formData.task_name,
          assignedBy: 'Dean Academics',
          dueDate: formData.due_date,
          status: formData.status,
          remarks: formData.remarks
        });
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Save duty error:', err);
      alert('Failed to save duty assignment');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Confirm Delete Duty Assignment',
      message: 'Are you sure you want to remove this duty assignment from the institutional workload ledger?',
      confirmText: 'Delete Assignment',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await staffService.deleteDuty(id);
      fetchData();
    } catch (err) {
      console.error('Delete duty error:', err);
      alert('Failed to delete duty assignment');
    }
  };

  return (
    <div className="staff-duties-view">
      {/* Banner */}
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
              background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
            }}
          >
            <i className="fa-solid fa-briefcase"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Staff Duty Rosters &amp; Assignments
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Campus supervisory rotations, institutional committee duties &amp; faculty allocations
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAddModal}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add Duty Roster</span>
          </button>
          <Link
            to="/unilms/org/staff/checklists"
            className="btn btn-outline"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none',
              border: '1px solid var(--border-color)',
              background: 'var(--card-bg, #fff)',
              color: 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-list-check" style={{ color: '#7C3AED' }}></i>
            <span>Checklists</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Duties Assigned</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '4px 0' }}>{totalDuties}</div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Institutional workload</span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Completed</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', margin: '4px 0' }}>{completedCount}</div>
          <span style={{ fontSize: '12px', color: '#16a34a' }}>Successfully delivered</span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>In Progress</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#ea580c', margin: '4px 0' }}>{inProgressCount}</div>
          <span style={{ fontSize: '12px', color: '#ea580c' }}>Active committees</span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Pending Initial Action</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#64748b', margin: '4px 0' }}>{pendingCount}</div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Awaiting start</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
            <input 
              type="text"
              placeholder="Search by duty name, assigned staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{
                paddingLeft: '36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                width: '100%'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
            style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', padding: '6px 12px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Table matching php_source/app/Views/org/staff/duties.php */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff Name</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Task Description</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned By</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Date</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedDuties.length > 0 ? (
                paginatedDuties.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <strong style={{ color: '#1E293B', fontSize: '14px' }}>{d.staff_name}</strong>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '13.5px' }}>{d.task_name}</div>
                      {d.remarks && (
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                          {d.remarks}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13px', color: '#475569' }}>
                      {d.assigner_name || d.assigned_by || 'Admin Office'}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13.5px', color: '#334155', fontWeight: '600' }}>
                      {d.due_date}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: d.status === 'Completed' ? '#DCFCE7' : (d.status === 'In Progress' ? '#FEF3C7' : '#F1F5F9'),
                        color: d.status === 'Completed' ? '#16A34A' : (d.status === 'In Progress' ? '#D97706' : '#64748B')
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: d.status === 'Completed' ? '#16A34A' : (d.status === 'In Progress' ? '#D97706' : '#94A3B8')
                        }}></span>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(d)}
                          className="btn btn-outline"
                          style={{
                            padding: '5px 12px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#334155',
                            borderColor: '#cbd5e1'
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          className="btn btn-outline"
                          style={{
                            padding: '5px 10px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#ef4444',
                            borderColor: '#fca5a5'
                          }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    <i className="fa-solid fa-list-check" style={{ fontSize: '32px', color: '#cbd5e1', display: 'block', marginBottom: '10px' }}></i>
                    No academic duties found matching criteria.
                  </td>
                </tr>
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
          itemName="staff duties"
        />
      </div>

      {/* Modal matching php_source/app/Views/org/staff/duties.php */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '540px',
            maxWidth: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                  {editingDuty ? 'Edit Duty' : 'Assign Academic Duty'}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ padding: '24px' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Select Staff *
                  </label>
                  <select
                    name="staff_id"
                    required
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  >
                    {staffList.map((sl) => (
                      <option key={sl.id} value={sl.id}>
                        {sl.full_name} ({sl.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Task Name *
                  </label>
                  <input 
                    type="text"
                    name="task_name"
                    required
                    value={formData.task_name}
                    onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                    className="form-control"
                    placeholder="e.g. NAAC Criterion-3 Lead / Exam Coordinator"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Due Date *
                    </label>
                    <input 
                      type="date"
                      name="due_date"
                      required
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Remarks / Scope
                  </label>
                  <textarea 
                    name="remarks"
                    rows="3"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="form-control"
                    placeholder="Key deliverables, meeting schedule, committee members..."
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  ></textarea>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseModal}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13.5px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '8px 22px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13.5px',
                    background: '#7C3AED',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                  }}
                >
                  Save Duty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
};

export default OrgStaffDuties;