import { Link } from 'react-router-dom';
import React, { useState, useMemo, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import staffService from '../../../services/staff.service';

const OrgStaffChecklists = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [checklists, setChecklists] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    staff_id: '',
    checklist_type: 'Joining',
    item_name: '',
    is_completed: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [checklistsData, staffData] = await Promise.all([
        staffService.getChecklists(),
        staffService.getStaff()
      ]);

      const staffNormalized = (Array.isArray(staffData) ? staffData : []).map(s => ({
        id: s.id,
        full_name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Staff Member',
        employee_code: s.employeeCode || '—',
        designation: s.designation || 'Faculty'
      }));
      setStaffList(staffNormalized);

      const normalizedChecks = (Array.isArray(checklistsData) ? checklistsData : []).map(c => ({
        id: c.id,
        staff_id: c.staffId || c.staff?.id,
        staff_name: c.staff ? `${c.staff.firstName} ${c.staff.lastName || ''}`.trim() : (c.staff_name || 'Staff Member'),
        designation: c.staff?.designation || 'Faculty',
        checklist_type: c.checklistType || c.checklist_type || 'Joining',
        item_name: c.itemName || c.item_name,
        is_completed: c.isCompleted ? 1 : 0
      }));
      setChecklists(normalizedChecks);

      if (staffNormalized.length > 0 && !formData.staff_id) {
        setFormData(prev => ({ ...prev, staff_id: staffNormalized[0].id }));
      }
    } catch (err) {
      console.error('Fetch checklists error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchData();
      }
    }, 30000); // 30s smart background polling
    return () => clearInterval(interval);
  }, []);

  const filteredChecklists = useMemo(() => {
    return checklists.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (c.staff_name && c.staff_name.toLowerCase().includes(q)) ||
        (c.item_name && c.item_name.toLowerCase().includes(q));

      const matchesType = typeFilter === 'All' || c.checklist_type === typeFilter;
      let matchesStatus = true;
      if (statusFilter === 'completed') matchesStatus = !!c.is_completed;
      else if (statusFilter === 'pending') matchesStatus = !c.is_completed;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [checklists, searchQuery, typeFilter, statusFilter]);

  const totalItemsCount = checklists.length;
  const completedCount = checklists.filter(c => c.is_completed).length;
  const pendingCount = checklists.filter(c => !c.is_completed).length;

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedChecklists,
    totalItems
  } = useTablePagination(filteredChecklists, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter, statusFilter, setCurrentPage]);

  const handleOpenAddModal = () => {
    setEditingChecklist(null);
    setFormData({
      id: '',
      staff_id: staffList[0]?.id || '',
      checklist_type: 'Joining',
      item_name: '',
      is_completed: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (chk) => {
    setEditingChecklist(chk);
    setFormData({
      id: chk.id,
      staff_id: chk.staff_id || staffList[0]?.id,
      checklist_type: chk.checklist_type || 'Joining',
      item_name: chk.item_name || '',
      is_completed: chk.is_completed ? 1 : 0
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingChecklist(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_name.trim()) {
      alert('Item Description is required.');
      return;
    }

    const isEdit = Boolean(editingChecklist);
    const assignedStaff = staffList.find(s => s.id === formData.staff_id) || staffList[0];

    const ok = await confirm({
      title: isEdit ? 'Confirm Update Checklist Item' : 'Confirm New Checklist Item',
      message: isEdit
        ? `Are you sure you want to update checklist milestone "${formData.item_name}"?`
        : `Are you sure you want to add checklist item "${formData.item_name}" for ${assignedStaff?.full_name}?`,
      confirmText: isEdit ? 'Update Item' : 'Add Item',
      cancelText: 'Cancel',
      type: 'primary',
    });
    if (!ok) return;

    try {
      if (editingChecklist) {
        await staffService.updateChecklist(editingChecklist.id, {
          staffId: formData.staff_id,
          checklistType: formData.checklist_type,
          itemName: formData.item_name,
          isCompleted: formData.is_completed === 1
        });
      } else {
        await staffService.createChecklist({
          staffId: formData.staff_id,
          checklistType: formData.checklist_type,
          itemName: formData.item_name,
          isCompleted: formData.is_completed === 1
        });
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Save checklist error:', err);
      alert('Failed to save checklist item');
    }
  };

  const handleToggleCompleted = async (chk) => {
    const nextCompleted = !chk.is_completed;
    const ok = await confirm({
      title: nextCompleted ? 'Mark as Completed?' : 'Mark as Incomplete?',
      message: `Are you sure you want to mark milestone "${chk.item_name}" as ${nextCompleted ? 'completed' : 'pending'}?`,
      confirmText: 'Confirm Status',
      cancelText: 'Cancel',
      type: 'primary',
    });
    if (!ok) return;

    try {
      await staffService.updateChecklist(chk.id, {
        isCompleted: nextCompleted
      });
      fetchData();
    } catch (err) {
      console.error('Toggle checklist error:', err);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Confirm Delete Checklist Milestone',
      message: 'Are you sure you want to delete this checklist milestone from the database?',
      confirmText: 'Delete Milestone',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await staffService.deleteChecklist(id);
      fetchData();
    } catch (err) {
      console.error('Delete checklist error:', err);
      alert('Failed to delete checklist item');
    }
  };

  return (
    <div className="staff-checklists-view">
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
            <i className="fa-solid fa-list-check"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Staff Checklists &amp; Standard Operating Procedures
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Employee onboarding, routine compliance tasks &amp; departmental handover checklists
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
            <span>Add Checklist</span>
          </button>
          <Link
            to="/unilms/org/staff/duties"
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
            <i className="fa-solid fa-briefcase" style={{ color: '#7C3AED' }}></i>
            <span>Duty Rosters</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Checklist Items</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '4px 0' }}>{totalItemsCount}</div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Across all faculty</span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Completed Items</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', margin: '4px 0' }}>{completedCount}</div>
          <span style={{ fontSize: '12px', color: '#16a34a' }}>Cleared & documented</span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Pending Verification</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626', margin: '4px 0' }}>{pendingCount}</div>
          <span style={{ fontSize: '12px', color: '#dc2626' }}>Action required</span>
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
              placeholder="Search by faculty name or item description..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-control"
              style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', padding: '6px 12px' }}
            >
              <option value="All">All Types</option>
              <option value="Joining">Joining / Onboarding</option>
              <option value="Exit">Exit / Offboarding</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', padding: '6px 12px' }}
            >
              <option value="All">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table matching php_source/app/Views/org/staff/checklists.php */}
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
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item Description</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={5} rows={pageSize || 5} />
              ) : paginatedChecklists.length > 0 ? (
                paginatedChecklists.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <strong style={{ color: '#1E293B', fontSize: '14px' }}>{c.staff_name}</strong>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: c.checklist_type === 'Joining' ? '#EFF6FF' : '#F1F5F9',
                        color: c.checklist_type === 'Joining' ? '#2563EB' : '#475569',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        {c.checklist_type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13.5px', color: '#334155' }}>
                      {c.item_name}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleCompleted(c)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: 0,
                          fontSize: '13px',
                          color: c.is_completed ? '#16A34A' : '#DC2626',
                          fontWeight: '700'
                        }}
                      >
                        <i className={c.is_completed ? "fa-solid fa-circle-check" : "fa-solid fa-clock"} style={{ fontSize: '15px' }}></i>
                        {c.is_completed ? 'Completed' : 'Pending'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
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
                          onClick={() => handleDelete(c.id)}
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
                  <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    <i className="fa-solid fa-clipboard-check" style={{ fontSize: '32px', color: '#cbd5e1', display: 'block', marginBottom: '10px' }}></i>
                    No checklist items found.
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
          itemName="checklist items"
        />
      </div>

      {/* Modal matching php_source/app/Views/org/staff/checklists.php */}
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
            width: '520px',
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
                  {editingChecklist ? 'Edit Checklist Item' : 'Add Checklist Item'}
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
                    Checklist Type *
                  </label>
                  <select
                    name="checklist_type"
                    required
                    value={formData.checklist_type}
                    onChange={(e) => setFormData({ ...formData, checklist_type: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  >
                    <option value="Joining">Joining / Onboarding</option>
                    <option value="Exit">Exit / Offboarding</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Item Description *
                  </label>
                  <input 
                    type="text"
                    name="item_name"
                    required
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="form-control"
                    placeholder="e.g. ID Card Issued, Lab Keys Returned"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <input 
                    type="checkbox"
                    id="is_completed"
                    checked={!!formData.is_completed}
                    onChange={(e) => setFormData({ ...formData, is_completed: e.target.checked ? 1 : 0 })}
                    style={{ width: '18px', height: '18px', accentColor: '#7C3AED', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_completed" style={{ fontSize: '13.5px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                    Mark as Completed
                  </label>
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
                  Save Item
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

export default OrgStaffChecklists;