import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../components';
import { facultyService } from '../../services/faculty.service';

const OrgFacultyProfiles = () => {
  const { confirmAction, ConfirmModal } = useConfirmDialog();
  const [profiles, setProfiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [toastMsg, setToastMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: '',
    phone: '',
    designation: 'Assistant Professor',
    department: 'Computer Science & Engineering',
    qualification: '',
    experienceYears: 3,
    status: 'Active',
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadProfiles = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const res = await facultyService.getProfiles();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setProfiles(list);
    } catch (e) {
      console.error('Failed to load faculty profiles:', e);
      if (!isPolling) showToast('Failed to load faculty profiles from database.');
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // 30s Background Sync Polling
  useEffect(() => {
    const timer = setInterval(() => {
      loadProfiles(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadProfiles]);

  const handleOpenAdd = () => {
    setEditingProfile(null);
    setFormData({
      code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      email: '',
      phone: '',
      designation: 'Assistant Professor',
      department: 'Computer Science & Engineering',
      qualification: 'M.Tech CSE',
      experienceYears: 3,
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProfile(p);
    setFormData({
      code: p.code || '',
      name: p.name || '',
      email: p.email || '',
      phone: p.phone || '',
      designation: p.designation || 'Assistant Professor',
      department: p.department || 'Computer Science & Engineering',
      qualification: p.qualification || '',
      experienceYears: p.experienceYears || 0,
      status: p.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Name and email are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProfile) {
        await facultyService.updateProfile(editingProfile.id, formData);
        showToast(`Faculty profile for ${formData.name} updated successfully.`);
      } else {
        await facultyService.createProfile(formData);
        showToast(`New faculty profile for ${formData.name} created successfully.`);
      }
      setIsModalOpen(false);
      await loadProfiles();
    } catch (err) {
      console.error('Failed to save profile:', err);
      showToast('Error saving profile to database.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (p) => {
    confirmAction({
      title: 'Delete Faculty Profile?',
      message: `Are you sure you want to permanently remove ${p.name} (${p.code}) from the institutional faculty directory?`,
      confirmLabel: 'Yes, Delete Profile',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await facultyService.deleteProfile(p.id);
          showToast(`Faculty profile for ${p.name} deleted.`);
          await loadProfiles();
        } catch (e) {
          console.error('Failed to delete faculty profile:', e);
          showToast('Failed to delete faculty profile.');
        }
      },
    });
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.designation?.toLowerCase().includes(q);
      const matchDept = deptFilter === 'All' || p.department?.toLowerCase().includes(deptFilter.toLowerCase());
      return matchSearch && matchDept;
    });
  }, [profiles, searchQuery, deptFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedProfiles,
    totalItems,
  } = useTablePagination(filteredProfiles, 10);

  return (
    <div className="faculty-workbench-container" style={{ padding: '4px 0 24px 0' }}>
      <ConfirmModal />

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

      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="h4 font-weight-bold mb-1" style={{ fontSize: '20px', fontWeight: '800' }}>
            <i className="fa-solid fa-address-book text-primary me-2"></i> Faculty Directory &amp; Academic Profiles
          </h1>
          <p className="text-muted small mb-0" style={{ fontSize: '12.5px' }}>
            Institutional teaching roster, designations, research specializations &amp; course workload assignments
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => loadProfiles()}
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            title="Refresh Directory"
          >
            <i className="fa-solid fa-arrows-rotate me-1"></i> Refresh
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{
              background: '#4F46E5',
              border: 'none',
              padding: '7px 16px',
              fontSize: '12.5px',
              fontWeight: '700',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#fff',
            }}
          >
            <i className="fa-solid fa-user-plus"></i> + Add Faculty Profile
          </button>
        </div>
      </div>

      {/* Directory Filter Card */}
      <div
        style={{
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search faculty name, code, designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ width: '280px', maxWidth: '100%', height: '36px', borderRadius: '6px', fontSize: '13px' }}
            />
            <select
              className="form-control"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{ height: '36px', borderRadius: '6px', fontSize: '13px' }}
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science &amp; Engineering</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Electronics">Electronics &amp; Communication</option>
            </select>
          </div>
          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
            Showing {filteredProfiles.length} active faculty profiles
          </span>
        </div>

        <div className="table-responsive" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '780px', margin: 0 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Faculty Code</th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Faculty Member</th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Department &amp; Designation</th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Qualifications &amp; Exp</th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Assigned Courses</th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '12px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedProfiles.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No faculty profiles found matching your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedProfiles.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: '700', color: '#4F46E5', fontFamily: 'monospace' }}>
                      {p.code}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '700', color: '#1E293B' }}>
                      {p.name}
                      <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '400' }}>
                        <i className="fa-regular fa-envelope me-1"></i> {p.email}
                      </div>
                      {p.phone && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400' }}>
                          <i className="fa-solid fa-phone me-1"></i> {p.phone}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '13px' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{p.designation}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>{p.department}</div>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '12.5px', color: '#475569' }}>
                      <div>{p.qualification}</div>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                        {p.experienceYears} Years Experience
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {Array.isArray(p.allocatedCourses) && p.allocatedCourses.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {p.allocatedCourses.map((c, i) => (
                            <span
                              key={i}
                              className="badge"
                              style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '11px', padding: '3px 7px', borderRadius: '4px' }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>None Allocated</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        className="badge"
                        style={{
                          background: p.status === 'Active' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: p.status === 'Active' ? '#059669' : '#EF4444',
                          fontWeight: '700',
                          padding: '4px 9px',
                          borderRadius: '6px',
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '14px 18px' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '12px', color: '#4F46E5', borderColor: '#c7d2fe' }}
                          title="Edit Profile"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="btn btn-outline text-danger"
                          style={{ padding: '4px 10px', fontSize: '12px', borderColor: '#fee2e2' }}
                          title="Delete Profile"
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
            itemName="faculty profiles"
          />
        </div>
      </div>

      {/* Add / Edit Profile Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxSizing: 'border-box',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                {editingProfile ? 'Edit Faculty Profile' : 'Add Faculty Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748b', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                    Code <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                    placeholder="EMP-105"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                    placeholder="Dr. Rajesh Kumar"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                    placeholder="faculty@unilms.edu"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                    placeholder="+91 98450 12345"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                    Designation
                  </label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  >
                    <option value="Professor & Head of Department">Professor &amp; HOD</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Senior Lecturer">Senior Lecturer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                    Highest Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                    placeholder="Ph.D. in Computer Science"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                    Exp (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: '#475569',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4F46E5',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgFacultyProfiles;
