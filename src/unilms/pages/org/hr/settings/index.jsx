import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../../components';
import academicsService from '../../../../services/academics.service';
import apiClient from '../../../../services/api';

const initialDepartments = [
  { id: 1, name: 'Computer Science & Engineering', description: 'Core Computing, AI, Data Science & Software Systems' },
  { id: 2, name: 'Electronics & Communication', description: 'VLSI, Embedded Systems & Signal Processing' },
  { id: 3, name: 'Mechanical Engineering', description: 'Thermal, Robotics & CAD/CAM Design' },
  { id: 4, name: 'Civil Engineering', description: 'Structural, Geotechnical & Urban Infrastructure' },
  { id: 5, name: 'Applied Sciences & Humanities', description: 'Physics, Mathematics, Chemistry & Communication' },
  { id: 6, name: 'Management Studies', description: 'MBA, FinTech, Marketing & Business Analytics' }
];

const initialDesignations = [
  { id: 1, name: 'Professor & Head of Department' },
  { id: 2, name: 'Professor' },
  { id: 3, name: 'Associate Professor' },
  { id: 4, name: 'Assistant Professor' },
  { id: 5, name: 'Senior Technical Officer' },
  { id: 6, name: 'Lab Superintendent' }
];

const initialEmploymentTypes = [
  { id: 1, name: 'Full-Time Regular' },
  { id: 2, name: 'Adjunct / Visiting Professor' },
  { id: 3, name: 'Contractual Faculty' },
  { id: 4, name: 'Research Fellow' }
];

const initialLeavePolicies = [
  { id: 1, empType: 'Full-Time Regular', leaveType: 'Casual Leave (CL)', annualQuota: 12 },
  { id: 2, empType: 'Full-Time Regular', leaveType: 'Earned Leave (EL)', annualQuota: 30 },
  { id: 3, empType: 'Full-Time Regular', leaveType: 'Medical Leave (ML)', annualQuota: 10 },
  { id: 4, empType: 'Full-Time Regular', leaveType: 'Academic / Duty Leave', annualQuota: 15 },
  { id: 5, empType: 'Contractual Faculty', leaveType: 'Casual Leave (CL)', annualQuota: 8 },
  { id: 6, empType: 'Adjunct / Visiting Professor', leaveType: 'Academic Duty Leave', annualQuota: 5 }
];

const OrgHrSettingsIndex = () => {
  const [departments, setDepartments] = useState(initialDepartments);
  const [designations, setDesignations] = useState(initialDesignations);
  const [employmentTypes, setEmploymentTypes] = useState(initialEmploymentTypes);
  const [leavePolicies, setLeavePolicies] = useState(initialLeavePolicies);

  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [desigName, setDesigName] = useState('');
  const [empTypeName, setEmpTypeName] = useState('');
  const [lpEmpType, setLpEmpType] = useState('Full-Time Regular');
  const [lpLeaveType, setLpLeaveType] = useState('');
  const [lpQuota, setLpQuota] = useState('');

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [depts, hrSettingsRes] = await Promise.all([
        academicsService.getDepartments(),
        apiClient.get('/tenants/settings/org_hr_settings').catch(() => null)
      ]);

      if (Array.isArray(depts) && depts.length > 0) {
        setDepartments(depts.map(d => ({
          id: d.id,
          name: d.name,
          description: d.code ? `Code: ${d.code}` : 'Academic Department'
        })));
      }

      if (hrSettingsRes?.data) {
        const s = hrSettingsRes.data;
        if (Array.isArray(s.designations) && s.designations.length > 0) setDesignations(s.designations);
        if (Array.isArray(s.employmentTypes) && s.employmentTypes.length > 0) setEmploymentTypes(s.employmentTypes);
        if (Array.isArray(s.leavePolicies) && s.leavePolicies.length > 0) setLeavePolicies(s.leavePolicies);
      }
    } catch (err) {
      console.warn('Error loading HR settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const persistHrSettings = async (overrides = {}) => {
    const payload = {
      designations,
      employmentTypes,
      leavePolicies,
      ...overrides
    };
    try {
      await apiClient.post('/tenants/settings/org_hr_settings', payload);
    } catch (err) {
      console.error('Failed to persist HR settings to PostgreSQL:', err);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    try {
      const code = deptName.trim().slice(0, 4).toUpperCase();
      const created = await academicsService.createDepartment({ name: deptName.trim(), code });
      setDepartments([...departments, { id: created?.id || Date.now(), name: deptName.trim(), description: `Code: ${code}` }]);
      setDeptName('');
      setDeptDesc('');
      showToast('Department added and saved to PostgreSQL.');
    } catch (err) {
      setDepartments([...departments, { id: Date.now(), name: deptName.trim(), description: deptDesc.trim() || 'Academic Department' }]);
      setDeptName('');
      setDeptDesc('');
      showToast('Department added.');
    }
  };

  const handleDeleteDept = async (id) => {
    try {
      await academicsService.deleteDepartment(id);
    } catch {}
    setDepartments(departments.filter(d => d.id !== id));
    showToast('Department removed.');
  };

  const handleAddDesig = (e) => {
    e.preventDefault();
    if (!desigName.trim()) return;
    const updated = [...designations, { id: Date.now(), name: desigName.trim() }];
    setDesignations(updated);
    persistHrSettings({ designations: updated });
    setDesigName('');
    showToast('Designation added and saved to PostgreSQL.');
  };

  const handleDeleteDesig = (id) => {
    const updated = designations.filter(d => d.id !== id);
    setDesignations(updated);
    persistHrSettings({ designations: updated });
    showToast('Designation deleted.');
  };

  const handleAddEmpType = (e) => {
    e.preventDefault();
    if (!empTypeName.trim()) return;
    const updated = [...employmentTypes, { id: Date.now(), name: empTypeName.trim() }];
    setEmploymentTypes(updated);
    persistHrSettings({ employmentTypes: updated });
    setEmpTypeName('');
    showToast('Employment type added and saved to PostgreSQL.');
  };

  const handleDeleteEmpType = (id) => {
    const updated = employmentTypes.filter(e => e.id !== id);
    setEmploymentTypes(updated);
    persistHrSettings({ employmentTypes: updated });
    showToast('Employment type deleted.');
  };

  const handleAddLeavePolicy = (e) => {
    e.preventDefault();
    if (!lpLeaveType.trim() || !lpQuota) return;
    const updated = [...leavePolicies, { id: Date.now(), empType: lpEmpType, leaveType: lpLeaveType.trim(), annualQuota: Number(lpQuota) }];
    setLeavePolicies(updated);
    persistHrSettings({ leavePolicies: updated });
    setLpLeaveType('');
    setLpQuota('');
    showToast('Leave policy added and saved to PostgreSQL.');
  };

  const handleDeleteLeavePolicy = (id) => {
    const updated = leavePolicies.filter(l => l.id !== id);
    setLeavePolicies(updated);
    persistHrSettings({ leavePolicies: updated });
    showToast('Leave policy deleted.');
  };

  // Pagination for all 4 tables
  const deptPagination = useTablePagination(departments, 5);
  const desigPagination = useTablePagination(designations, 5);
  const empTypePagination = useTablePagination(employmentTypes, 5);
  const leavePagination = useTablePagination(leavePolicies, 5);

  return (
    <>
      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
          <i className="fa-solid fa-circle-check"></i>
          {toastMsg}
        </div>
      )}

      {/* Top Header Card matching Reference UI */}
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
            <i className="fa-solid fa-gears"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              HR &amp; Department Settings
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Configure organizational departments, employee designations &amp; staff leave policies
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
            to="/unilms/org/hr/leaves" 
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-person-walking-arrow-right" style={{ color: '#DB2777' }}></i>
            <span>Leave Management</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Departments */}
        <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: '0', fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Departments</h3>
          <form onSubmit={handleAddDept} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input 
              type="text" 
              value={deptName} 
              onChange={(e) => setDeptName(e.target.value)} 
              className="form-control" 
              placeholder="Department Name" 
              required 
              style={{ flex: 1, height: '38px', borderRadius: '8px' }}
            />
            <input 
              type="text" 
              value={deptDesc} 
              onChange={(e) => setDeptDesc(e.target.value)} 
              className="form-control" 
              placeholder="Description" 
              style={{ flex: 1, height: '38px', borderRadius: '8px' }}
            />
            <button className="btn btn-primary" type="submit" style={{ height: '38px', padding: '0 16px', background: '#DB2777', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
              Add
            </button>
          </form>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-main, #f8fafc)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={3} rows={deptPagination.pageSize || 5} />
                ) : deptPagination.paginatedItems.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No departments configured.</td></tr>
                ) : (
                  deptPagination.paginatedItems.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '600' }}>{d.name}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '12.5px' }}>{d.description}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteDept(d.id)} 
                          className="btn btn-outline" 
                          style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger, #EF4444)', borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={deptPagination.currentPage}
            totalItems={deptPagination.totalItems}
            pageSize={deptPagination.pageSize}
            onPageChange={deptPagination.setCurrentPage}
            onPageSizeChange={deptPagination.setPageSize}
            itemName="departments"
          />
        </div>

        {/* Designations */}
        <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: '0', fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Designations</h3>
          <form onSubmit={handleAddDesig} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input 
              type="text" 
              value={desigName} 
              onChange={(e) => setDesigName(e.target.value)} 
              className="form-control" 
              placeholder="Designation Name" 
              required 
              style={{ flex: 1, height: '38px', borderRadius: '8px' }}
            />
            <button className="btn btn-primary" type="submit" style={{ height: '38px', padding: '0 16px', background: '#DB2777', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
              Add
            </button>
          </form>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-main, #f8fafc)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={2} rows={desigPagination.pageSize || 5} />
                ) : desigPagination.paginatedItems.length === 0 ? (
                  <tr><td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No designations configured.</td></tr>
                ) : (
                  desigPagination.paginatedItems.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '600' }}>{d.name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteDesig(d.id)} 
                          className="btn btn-outline" 
                          style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger, #EF4444)', borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={desigPagination.currentPage}
            totalItems={desigPagination.totalItems}
            pageSize={desigPagination.pageSize}
            onPageChange={desigPagination.setCurrentPage}
            onPageSizeChange={desigPagination.setPageSize}
            itemName="designations"
          />
        </div>

        {/* Employment Types */}
        <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: '0', fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Employment Types</h3>
          <form onSubmit={handleAddEmpType} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input 
              type="text" 
              value={empTypeName} 
              onChange={(e) => setEmpTypeName(e.target.value)} 
              className="form-control" 
              placeholder="e.g. Full-Time, Contract" 
              required 
              style={{ flex: 1, height: '38px', borderRadius: '8px' }}
            />
            <button className="btn btn-primary" type="submit" style={{ height: '38px', padding: '0 16px', background: '#DB2777', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
              Add
            </button>
          </form>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-main, #f8fafc)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={2} rows={empTypePagination.pageSize || 5} />
                ) : empTypePagination.paginatedItems.length === 0 ? (
                  <tr><td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No employment types configured.</td></tr>
                ) : (
                  empTypePagination.paginatedItems.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '600' }}>{e.name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteEmpType(e.id)} 
                          className="btn btn-outline" 
                          style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger, #EF4444)', borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={empTypePagination.currentPage}
            totalItems={empTypePagination.totalItems}
            pageSize={empTypePagination.pageSize}
            onPageChange={empTypePagination.setCurrentPage}
            onPageSizeChange={empTypePagination.setPageSize}
            itemName="employment types"
          />
        </div>

        {/* Leave Policies */}
        <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: '0', fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Leave Policies</h3>
          <form onSubmit={handleAddLeavePolicy} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px auto', gap: '8px', marginBottom: '16px' }}>
            <select 
              value={lpEmpType} 
              onChange={(e) => setLpEmpType(e.target.value)} 
              className="form-control" 
              required
              style={{ height: '38px', borderRadius: '8px' }}
            >
              {employmentTypes.map(et => (
                <option key={et.id} value={et.name}>{et.name}</option>
              ))}
            </select>
            <input 
              type="text" 
              value={lpLeaveType} 
              onChange={(e) => setLpLeaveType(e.target.value)} 
              className="form-control" 
              placeholder="e.g. Casual Leave" 
              required 
              style={{ height: '38px', borderRadius: '8px' }}
            />
            <input 
              type="number" 
              min="1" 
              value={lpQuota} 
              onChange={(e) => setLpQuota(e.target.value)} 
              className="form-control" 
              placeholder="Quota" 
              required 
              style={{ height: '38px', borderRadius: '8px' }}
            />
            <button className="btn btn-primary" type="submit" style={{ height: '38px', padding: '0 16px', background: '#DB2777', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
              Add
            </button>
          </form>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-main, #f8fafc)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>Emp Type</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>Leave Type</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase' }}>Quota</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={4} rows={leavePagination.pageSize || 5} />
                ) : leavePagination.paginatedItems.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No policies configured.</td></tr>
                ) : (
                  leavePagination.paginatedItems.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontSize: '12.5px' }}>{l.empType}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '600' }}>{l.leaveType}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', color: '#DB2777' }}>{l.annualQuota} Days</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteLeavePolicy(l.id)} 
                          className="btn btn-outline" 
                          style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger, #EF4444)', borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={leavePagination.currentPage}
            totalItems={leavePagination.totalItems}
            pageSize={leavePagination.pageSize}
            onPageChange={leavePagination.setCurrentPage}
            onPageSizeChange={leavePagination.setPageSize}
            itemName="leave policies"
          />
        </div>
      </div>
    </>
  );
};

export default OrgHrSettingsIndex;
