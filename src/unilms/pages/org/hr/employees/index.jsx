import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../../components';
import staffService from '../../../../services/staff.service';
import academicsService from '../../../../services/academics.service';

const OrgHrEmployeesIndex = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);
  const [formError, setFormError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    employee_code: '',
    department_id: '',
    designation_name: 'Assistant Professor',
    staff_type: 'Teaching',
    employment_type: 'Full-Time Permanent',
    joining_date: new Date().toISOString().split('T')[0],
    base_salary: 50000
  });

  const existingStaffCode = useMemo(() => {
    const code = formData.employee_code.trim().toUpperCase();
    if (!code) return null;
    return employees.find(e => (e.employee_code || '').toUpperCase() === code);
  }, [formData.employee_code, employees]);

  const existingStaffEmail = useMemo(() => {
    const email = formData.email.trim().toLowerCase();
    if (!email) return null;
    return employees.find(e => (e.email || '').toLowerCase() === email);
  }, [formData.email, employees]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffData, deptsData] = await Promise.all([
        staffService.getStaff(),
        academicsService.getDepartments()
      ]);

      const depts = Array.isArray(deptsData) ? deptsData : [];
      setDepartments(depts);

      const list = (Array.isArray(staffData) ? staffData : []).map(s => ({
        id: s.id,
        employee_code: s.employeeCode || '—',
        full_name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Staff Member',
        email: s.email || '—',
        department_name: s.department?.name || 'Central Administration',
        designation_name: s.designation || 'Staff',
        employment_type: s.staffType === 'FACULTY' || s.staffType === 'Teaching' ? 'Academic Faculty' : 'Administrative Staff',
        joining_date: s.joiningDate ? s.joiningDate.split('T')[0] : '2023-01-01',
        base_salary: Number(s.basicSalary) || 0,
        status: s.status === 'active' ? 'Active' : 'Inactive'
      }));
      setEmployees(list);
    } catch (err) {
      console.error('Fetch employees error:', err);
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

  const showToast = (msg, type = 'success') => {
    setToastMsg({ text: msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOnboard = async (e) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.employee_code.trim()) return;

    if (existingStaffCode) {
      setFormError(`Staff member with Employee Code '${formData.employee_code}' already exists.`);
      return;
    }
    setFormError(null);

    const ok = await confirm({
      title: 'Confirm Onboard Employee',
      message: `Are you sure you want to onboard ${formData.first_name} ${formData.last_name || ''} (${formData.employee_code}) as ${formData.designation_name}? Profile will be created in PostgreSQL database.`,
      confirmText: 'Onboard Employee',
      cancelText: 'Cancel',
      type: 'primary',
    });
    if (!ok) return;

    try {
      await staffService.createStaff({
        employeeCode: formData.employee_code.trim().toUpperCase(),
        firstName: formData.first_name.trim(),
        lastName: formData.last_name.trim() || 'Staff',
        email: formData.email.trim() || `${formData.employee_code.toLowerCase()}@apex.edu`,
        departmentId: formData.department_id || undefined,
        designation: formData.designation_name,
        basicSalary: parseFloat(formData.base_salary) || 50000,
        staffType: formData.staff_type === 'Teaching' ? 'Teaching' : 'Administrative',
        createAuthAccount: false
      });

      setFormError(null);
      showToast(`Staff profile for "${formData.first_name}" onboarded. IT can now provision portal credentials in System Settings → Users.`, 'success');
      fetchData();
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        employee_code: '',
        department_id: departments[0]?.id || '',
        designation_name: 'Assistant Professor',
        staff_type: 'Teaching',
        employment_type: 'Full-Time Permanent',
        joining_date: new Date().toISOString().split('T')[0],
        base_salary: 50000
      });
    } catch (err) {
      console.error('Onboard staff error:', err);
      const msg = err.response?.data?.message || 'Failed to onboard staff member.';
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleRemove = async (id, name) => {
    const ok = await confirm({
      title: 'Confirm Delete Employee Profile',
      message: `Are you sure you want to permanently remove the profile for "${name}" from the database?`,
      confirmText: 'Remove Employee',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await staffService.deleteStaff(id);
      showToast(`Employee "${name}" removed from database.`);
      fetchData();
    } catch (err) {
      console.error('Delete staff error:', err);
      showToast('Failed to delete staff member.');
    }
  };

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.designation_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || e.department_name === deptFilter;
    return matchesSearch && matchesDept;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedEmployees,
    totalItems
  } = useTablePagination(filteredEmployees, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, deptFilter, setCurrentPage]);

  return (
    <>
      <section className="view-section active">
        {toastMsg && (
          <div style={{
            background: toastMsg.type === 'error' ? '#EF4444' : '#10B981',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: toastMsg.type === 'error' ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 4px 12px rgba(16, 185, 129, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className={`fa-solid ${toastMsg.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'}`}></i>
              {toastMsg.text}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

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
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <i className="fa-solid fa-id-card-clip"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                HR Employee Roster &amp; Profiles
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Manage teaching faculty, technical officers and administrative payroll contracts
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              to="/unilms/org/staff/directory"
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-users" style={{ color: '#059669' }}></i>
              <span>Staff Directory</span>
            </Link>
            <Link
              to="/unilms/org/hr/payroll"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-file-invoice-dollar"></i>
              <span>Payroll Console</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '24px' }}>

          {/* Onboarding Form Card */}
          <div className="card" style={{ padding: '22px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', height: 'fit-content' }}>
            <h2 style={{ marginTop: 0, fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Onboard New Staff Member
            </h2>
            <form onSubmit={handleOnboard}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>First Name</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData(p => ({ ...p, first_name: e.target.value }))}
                  placeholder="e.g. Dr. Rajesh"
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData(p => ({ ...p, last_name: e.target.value }))}
                  placeholder="e.g. Sharma"
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Staff Code / Employee ID</label>
                <input
                  type="text"
                  required
                  value={formData.employee_code}
                  onChange={(e) => setFormData(p => ({ ...p, employee_code: e.target.value }))}
                  placeholder="e.g. FAC-2005"
                  className="form-control"
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '8px',
                    border: existingStaffCode ? '1.5px solid #EF4444' : undefined,
                    background: existingStaffCode ? '#FEF2F2' : undefined
                  }}
                />
                {existingStaffCode && (
                  <div style={{ color: '#DC2626', fontSize: '11.5px', marginTop: '5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>Staff Code '{formData.employee_code.toUpperCase()}' already exists (assigned to {existingStaffCode.full_name}).</span>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Official Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="e.g. rajesh.s@apex.edu"
                  className="form-control"
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '8px',
                    border: existingStaffEmail ? '1.5px solid #EF4444' : undefined,
                    background: existingStaffEmail ? '#FEF2F2' : undefined
                  }}
                />
                {existingStaffEmail && (
                  <div style={{ color: '#DC2626', fontSize: '11.5px', marginTop: '5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>Email '{formData.email.toLowerCase()}' already exists for {existingStaffEmail.full_name}.</span>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                  Department {formData.staff_type === 'Non-Teaching' ? <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>(Optional for Administrative Staff)</span> : <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData(p => ({ ...p, department_id: e.target.value }))}
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px' }}
                >
                  <option value="">Central Administration / General Operations</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Staff Type &amp; Academic Classification</label>
                <select
                  value={formData.staff_type}
                  onChange={(e) => setFormData(p => ({ ...p, staff_type: e.target.value }))}
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px' }}
                >
                  <option value="Teaching">Teaching (Faculty / Professor / Lecturer)</option>
                  <option value="Non-Teaching">Non-Teaching (Administrative / Support Staff)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Designation</label>
                <input
                  type="text"
                  value={formData.designation_name}
                  onChange={(e) => setFormData(p => ({ ...p, designation_name: e.target.value }))}
                  placeholder="e.g. Associate Professor"
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Basic Salary (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.base_salary}
                  onChange={(e) => setFormData(p => ({ ...p, base_salary: e.target.value }))}
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px' }}
                />
              </div>

              {/* Enterprise IT Governance Notice */}
              <div style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: '#6366F1', marginTop: '2px', fontSize: '13px' }}></i>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#4338CA' }}>IT Access Governance Notice</div>
                    <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px', lineHeight: '1.4' }}>
                      HR onboards the employee profile. Portal login credentials, passwords, and security Access Groups are provisioned by the Central IT Administrator in <strong>System Settings → Users &amp; Logins</strong>.
                    </div>
                  </div>
                </div>
              </div>

              {formError && (
                <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '16px', color: '#EF4444', flexShrink: 0 }}></i>
                  <span style={{ fontWeight: '600' }}>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={Boolean(existingStaffCode)}
                style={{
                  width: '100%',
                  padding: '11px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  background: existingStaffCode ? '#9CA3AF' : '#059669',
                  border: 'none',
                  color: '#fff',
                  cursor: existingStaffCode ? 'not-allowed' : 'pointer',
                  boxShadow: existingStaffCode ? 'none' : '0 4px 12px rgba(5, 150, 105, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-user-plus"></i> Save Staff Profile
              </button>
            </form>
          </div>

          {/* Employee Directory Table Card */}
          <div className="card" style={{ padding: '22px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Active Institutional Staff ({employees.length})
              </h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="form-control"
                  style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="All">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control"
                  placeholder="Search staff name or code..."
                  style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', minWidth: '200px' }}
                />
              </div>
            </div>

            <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase' }}>CODE</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase' }}>EMPLOYEE NAME</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase' }}>DEPARTMENT &amp; ROLE</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>BASE SALARY</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={5} rows={pageSize || 5} />
                  ) : paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <i className="fa-solid fa-users" style={{ fontSize: '28px', opacity: 0.3, marginBottom: '8px', display: 'block' }}></i>
                        No staff members found in database matching your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((e) => (
                      <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: '700', color: '#059669', background: 'rgba(5, 150, 105, 0.08)', padding: '3px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                            {e.employee_code}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{e.full_name}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{e.email}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{e.designation_name}</div>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{e.department_name}</span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                          ₹{e.base_salary.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => handleRemove(e.id, e.full_name)}
                            className="btn btn-outline"
                            style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #EF4444', color: '#EF4444', cursor: 'pointer' }}
                            title="Remove Staff"
                          >
                            <i className="fa-solid fa-trash"></i>
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
              itemName="employees"
            />
          </div>

        </div>
        <ConfirmDialog />
      </section>
    </>
  );
};

export default OrgHrEmployeesIndex;
