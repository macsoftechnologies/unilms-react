import { Link } from 'react-router-dom';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { systemsService } from '../../../services/systems.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgSystemsUsers = () => {
  const [users, setUsers] = useState([]);
  const [accessGroups, setAccessGroups] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'staff' | 'student' | 'parent'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    employee_code: '',
    full_name: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    role: 'staff',
    is_org_admin: false,
    access_groups: []
  });

  const loadData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setIsSyncing(true);

      const [usersData, groupsData] = await Promise.all([
        systemsService.getUsers(),
        systemsService.getAccessGroups()
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      if (Array.isArray(groupsData) && groupsData.length > 0) {
        setAccessGroups(groupsData);
      }
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load users from PostgreSQL:', err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 30s Smart Background Polling
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Dynamic filter counts
  const counts = useMemo(() => {
    return {
      all: users.length,
      staff: users.filter(u => u.role === 'admin' || u.role === 'staff' || u.role === 'faculty').length,
      student: users.filter(u => u.role === 'student').length,
      parent: users.filter(u => u.role === 'parent').length
    };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') return users;
    if (roleFilter === 'staff') return users.filter(u => u.role === 'admin' || u.role === 'staff' || u.role === 'faculty');
    if (roleFilter === 'student') return users.filter(u => u.role === 'student');
    if (roleFilter === 'parent') return users.filter(u => u.role === 'parent');
    return users;
  }, [users, roleFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedUsers,
    totalItems
  } = useTablePagination(filteredUsers, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, setCurrentPage]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      employee_code: '',
      full_name: '',
      email: '',
      password: '',
      phone: '',
      designation: '',
      role: 'faculty',
      is_org_admin: false,
      access_groups: ['Faculty / Teaching Staff']
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      employee_code: u.employee_code || '',
      full_name: u.full_name || '',
      email: u.email || '',
      password: '',
      phone: u.phone !== 'N/A' ? u.phone : '',
      designation: u.designation || '',
      role: u.role || 'staff',
      is_org_admin: Boolean(u.is_org_admin),
      access_groups: u.access_groups || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    confirmAction({
      title: 'Confirm Delete User Credential',
      message: `Are you sure you want to permanently delete the user account for "${user.full_name}" (${user.employee_code})? This will revoke login access to the campus portal.`,
      confirmLabel: 'Yes, Delete Account',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await systemsService.deleteUser(user.id);
          await loadData();
        } catch (err) {
          console.error('Delete user error:', err);
          alert('Failed to delete user account: ' + (err.response?.data?.message || err.message));
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await systemsService.updateUser(editingUser.id, {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          designation: formData.designation,
          employee_code: formData.employee_code,
          role: formData.role,
          access_groups: formData.access_groups || [],
          ...(formData.password ? { password: formData.password } : {})
        });
      } else {
        await systemsService.createUser({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          designation: formData.designation,
          employee_code: formData.employee_code,
          role: formData.role,
          access_groups: formData.access_groups || [],
          password: formData.password || 'password123'
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Save user error:', err);
      alert('Failed to save user account: ' + (err.response?.data?.message || err.message));
    }
  };

  const toggleGroup = (groupName) => {
    const current = formData.access_groups || [];
    if (current.includes(groupName)) {
      setFormData({ ...formData, access_groups: current.filter(g => g !== groupName) });
    } else {
      setFormData({ ...formData, access_groups: [...current, groupName] });
    }
  };

  return (
    <>
      <section className="view-section active">
        {/* Top Header Card */}
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
              <i className="fa-solid fa-users-gear"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  User Directory &amp; Security Credentials
                </h2>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Manage institutional staff, faculty, student, and parent user credentials &bull; Last Synced: {lastSyncTime}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openAddModal}
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add User</span>
            </button>
            <Link
              to="/unilms/org/systems/access_groups"
              className="btn btn-outline"
              style={{
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg, #fff)',
                color: 'var(--text-primary)',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-shield-halved" style={{ color: '#7C3AED' }}></i>
              <span>Access Groups</span>
            </Link>
          </div>
        </div>

        {/* Enterprise Single-Door Governance Notice */}
        <div style={{
          background: 'rgba(124, 58, 237, 0.05)',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-circle-info" style={{ color: '#7C3AED', fontSize: '18px' }}></i>
            <span style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.4' }}>
              <strong>Single-Door Staff Provisioning:</strong> Faculty and staff login credentials are automatically created during institutional onboarding in HR &amp; Payroll. Use this IT Governance Desk to reset passwords, manage 2FA, or assign custom security access groups.
            </span>
          </div>
          <Link
            to="/unilms/org/hr/employees"
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#7C3AED',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>HR Onboarding Desk</span>
            <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>

        {/* Filter Tabs (All, Staff & Faculty, Students, Parents) */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            style={{
              border: 'none',
              fontSize: '13px',
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: roleFilter === 'all' ? '700' : '500',
              background: roleFilter === 'all' ? '#7C3AED' : '#F1F5F9',
              color: roleFilter === 'all' ? '#ffffff' : '#475569',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>All Accounts</span>
            <span style={{ background: roleFilter === 'all' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('staff')}
            style={{
              border: 'none',
              fontSize: '13px',
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: roleFilter === 'staff' ? '700' : '500',
              background: roleFilter === 'staff' ? '#7C3AED' : '#F1F5F9',
              color: roleFilter === 'staff' ? '#ffffff' : '#475569',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Staff &amp; Faculty</span>
            <span style={{ background: roleFilter === 'staff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
              {counts.staff}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('student')}
            style={{
              border: 'none',
              fontSize: '13px',
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: roleFilter === 'student' ? '700' : '500',
              background: roleFilter === 'student' ? '#7C3AED' : '#F1F5F9',
              color: roleFilter === 'student' ? '#ffffff' : '#475569',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Students</span>
            <span style={{ background: roleFilter === 'student' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
              {counts.student}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('parent')}
            style={{
              border: 'none',
              fontSize: '13px',
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: roleFilter === 'parent' ? '700' : '500',
              background: roleFilter === 'parent' ? '#7C3AED' : '#F1F5F9',
              color: roleFilter === 'parent' ? '#ffffff' : '#475569',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Parents</span>
            <span style={{ background: roleFilter === 'parent' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
              {counts.parent}
            </span>
          </button>
        </div>

        {/* User Directory Table */}
        <div className="table-container card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)', overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>ID / Code</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Name</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Email</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Phone</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Designation / Program</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Access Groups</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Account Role</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={8} rows={pageSize || 8} />
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge" style={{ background: '#F5F3FF', color: '#7C3AED', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {user.employee_code}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {user.full_name}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {user.phone || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {user.designation || '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {user.access_groups && user.access_groups.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {user.access_groups.map((grp, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: 'rgba(124, 58, 237, 0.08)',
                                color: '#7C3AED',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              {grp}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {user.is_org_admin ? (
                        <span className="badge" style={{ background: 'rgba(5, 150, 105, 0.12)', color: '#059669', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-shield-halved"></i> Org Admin
                        </span>
                      ) : user.role === 'faculty' ? (
                        <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-chalkboard-user"></i> Faculty
                        </span>
                      ) : user.role === 'student' ? (
                        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563EB', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-graduation-cap"></i> Student
                        </span>
                      ) : user.role === 'parent' ? (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-users"></i> Parent
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.12)', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-user-tie"></i> Staff
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          title="Edit User"
                          style={{ border: 'none', background: 'rgba(124, 58, 237, 0.08)', color: '#7C3AED', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          title="Delete User"
                          style={{ border: 'none', background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No users found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="users"
          />
        </div>
      </section>

      {/* Drawer Overlay for Add / Edit User */}
      <div
        className={`drawer-overlay ${isModalOpen ? 'active' : ''}`}
        id="user-panel"
        onClick={(e) => {
          if (e.target.classList.contains('drawer-overlay')) setIsModalOpen(false);
        }}
        style={{
          display: isModalOpen ? 'flex' : 'none',
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          zIndex: 9999,
          justifyContent: 'flex-end',
          backdropFilter: 'blur(4px)'
        }}
      >
        <div
          className="drawer-content"
          style={{
            maxWidth: '540px',
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              margin: 0
            }}
          >
            <div
              className="drawer-header"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                color: '#ffffff',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <div>
                <h3 id="modal-user-title" style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                  {editingUser ? 'Edit User Credentials' : 'Add New User'}
                </h3>
                <small style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
                  Manage account access, designations and roles
                </small>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                style={{
                  background: 'rgba(255, 255, 255, 0.22)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  flexShrink: 0
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div
              className="drawer-body"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 28px',
                background: '#ffffff'
              }}
            >
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                  Employee ID / Staff Code / Roll Number
                </label>
                <input
                  type="text"
                  name="employee_code"
                  className="form-control"
                  placeholder="Leave blank to auto-generate (e.g. EMP-101 / 2026-UG-53)"
                  value={formData.employee_code}
                  onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1.5px solid #E2E8F0', padding: '0 12px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  className="form-control"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar / Aditya Sharma"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1.5px solid #E2E8F0', padding: '0 12px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  required
                  placeholder="user@campus.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1.5px solid #E2E8F0', padding: '0 12px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label id="password_label" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  name="password"
                  id="user_password"
                  className="form-control"
                  required={!editingUser}
                  placeholder={editingUser ? '••••••••' : 'Enter account password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1.5px solid #E2E8F0', padding: '0 12px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="user_phone"
                  className="form-control"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1.5px solid #E2E8F0', padding: '0 12px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                  Designation / Program / Department
                </label>
                <input
                  type="text"
                  name="designation"
                  className="form-control"
                  placeholder="e.g. Professor, B.Tech CSE, Administrator"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1.5px solid #E2E8F0', padding: '0 12px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                  Account Role
                </label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1.5px solid #E2E8F0', padding: '0 12px', fontSize: '14px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  <option value="admin">Administrator</option>
                  <option value="faculty">Faculty / Teaching Staff</option>
                  <option value="staff">Non-Teaching Staff</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>
                {(formData.role === 'faculty' || formData.role === 'staff') && (
                  <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#6366F1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-lightbulb"></i>
                    <span>Tip: For complete payroll, salary &amp; course workload linking, onboard new employees via <strong>HR &amp; Payroll &rarr; Employees</strong>.</span>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ background: 'rgba(124, 58, 237, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.15)', marginBottom: '16px' }}>
                <label style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', color: '#7C3AED' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_org_admin}
                    onChange={(e) => setFormData({ ...formData, is_org_admin: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#7C3AED' }}
                  />
                  <span>Grant Organization Admin Rights</span>
                </label>
                <p style={{ margin: '6px 0 0 28px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Admins have full unrestricted access to configure institutional settings and modules.
                </p>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: '600', display: 'block', fontSize: '13px', color: '#64748B', marginBottom: '10px' }}>
                  Assign Access Groups
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {accessGroups.map((ag) => (
                    <label
                      key={ag.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: (formData.access_groups || []).includes(ag.name) ? '#F5F3FF' : '#ffffff'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={(formData.access_groups || []).includes(ag.name)}
                        onChange={() => toggleGroup(ag.name)}
                        style={{ width: '16px', height: '16px', accentColor: '#7C3AED' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>{ag.name}</div>
                        <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{ag.description}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="drawer-footer"
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                backgroundColor: '#FAFAFA',
                flexShrink: 0
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: '#7C3AED', color: '#ffffff', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(124, 58, 237, 0.35)' }}
              >
                Save User
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Enterprise Confirmation Dialog */}
      <ConfirmModal />
    </>
  );
};

export default OrgSystemsUsers;
