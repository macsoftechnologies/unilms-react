import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import staffService from '../../../services/staff.service';
import academicsService from '../../../services/academics.service';
import {
  staffDepartments,
  staffRoles
} from './staffData';

const OrgStaffDirectory = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [staff, setStaff] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [duties, setDuties] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  const fetchStaff = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [staffData, deptsData, dutiesData, certsData, checksData] = await Promise.all([
        staffService.getStaff(),
        academicsService.getDepartments(),
        staffService.getDuties(),
        staffService.getCertificates(),
        staffService.getChecklists()
      ]);
      setDepartmentsList(Array.isArray(deptsData) ? deptsData : []);
      setDuties(Array.isArray(dutiesData) ? dutiesData : []);
      setCertificates(Array.isArray(certsData) ? certsData : []);
      setChecklists(Array.isArray(checksData) ? checksData : []);

      const normalized = (Array.isArray(staffData) ? staffData : []).map(s => ({
        id: s.id,
        employee_code: s.employeeCode || s.employee_code,
        full_name: `${s.firstName || s.first_name || ''} ${s.lastName || s.last_name || ''}`.trim(),
        first_name: s.firstName || s.first_name,
        last_name: s.lastName || s.last_name,
        email: s.email,
        phone: s.phone || '—',
        role: s.staffType || s.role || 'Faculty',
        designation: s.designation || 'Assistant Professor',
        department_id: s.departmentId || s.department_id,
        department: s.department?.name || s.departmentName || s.department || 'General Department',
        qualification: s.qualification || 'M.Tech / Ph.D.',
        experience_years: String(s.experienceYears || s.experience_years || '5'),
        joining_date: s.joiningDate ? s.joiningDate.split('T')[0] : (s.joining_date || '2023-01-01'),
        basic_salary: s.basicSalary || s.basic_salary,
        status: s.status || 'Active'
      }));
      setStaff(normalized);
    } catch (err) {
      console.error('Fetch staff error:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchStaff(true);
      }
    }, 45000); // 45s smart polling
    return () => clearInterval(interval);
  }, []);

  // Add / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Tabbed Profile Modal State ("tab in modal")
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'duties' | 'certificates' | 'checklists'

  const [formData, setFormData] = useState({
    id: '',
    full_name: '',
    email: '',
    role: 'Faculty',
    designation: 'Assistant Professor',
    department: staffDepartments[0] || 'Computer Science & Engineering',
    phone: '',
    qualification: '',
    experience_years: '5',
    joining_date: '2022-08-01',
    specialization: '',
    status: 'Active'
  });

  // KPI Calculations ("satacal evethig")
  const totalStaff = staff.length;
  const facultyCount = staff.filter(s => s.role === 'Faculty' || s.designation?.includes('Professor')).length;
  const adminCount = staff.filter(s => s.role === 'Admin').length;
  const activeDutiesCount = duties.filter(d => d.status !== 'Completed').length;

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (s.full_name && s.full_name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.designation && s.designation.toLowerCase().includes(q));

      const matchesDept = departmentFilter === 'All' || s.department === departmentFilter;
      const matchesRole = roleFilter === 'All' || s.role === roleFilter;

      return matchesSearch && matchesDept && matchesRole;
    });
  }, [staff, searchQuery, departmentFilter, roleFilter]);



  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedStaff,
    totalItems
  } = useTablePagination(filteredStaff, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, departmentFilter, roleFilter, setCurrentPage]);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      id: '',
      full_name: '',
      email: '',
      role: 'Faculty',
      designation: 'Assistant Professor',
      department: staffDepartments[0] || 'Computer Science & Engineering',
      phone: '',
      qualification: 'M.Tech / Ph.D.',
      experience_years: '4',
      joining_date: new Date().toISOString().split('T')[0],
      specialization: '',
      status: 'Active'
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (s) => {
    setEditingStaff(s);
    setFormData({
      id: s.id,
      full_name: s.full_name || '',
      email: s.email || '',
      role: s.role || 'Faculty',
      designation: s.designation || 'Assistant Professor',
      department: s.department || staffDepartments[0],
      phone: s.phone || '',
      qualification: s.qualification || '',
      experience_years: s.experience_years || '0',
      joining_date: s.joining_date || '',
      specialization: s.specialization || '',
      status: s.status || 'Active'
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (s) => {
    setSelectedStaff(s);
    setActiveTab('profile');
    setIsDetailModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingStaff(null);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedStaff(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) {
      alert('Full Name and Email are required.');
      return;
    }

    const isEdit = Boolean(editingStaff);
    const ok = await confirm({
      title: isEdit ? 'Confirm Staff Profile Update' : 'Confirm New Staff Onboarding',
      message: isEdit
        ? `Are you sure you want to update the profile for ${formData.full_name}? Changes will be recorded in the institutional database.`
        : `Are you sure you want to onboard ${formData.full_name} (${formData.designation}) into the central staff directory?`,
      confirmText: isEdit ? 'Update Profile' : 'Onboard Staff',
      cancelText: 'Cancel',
      type: 'primary',
    });
    if (!ok) return;

    try {
      const names = formData.full_name.trim().split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || '';

      const dept = departmentsList.find(d => d.name === formData.department || d.id === formData.department);

      const payload = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        staffType: formData.role,
        departmentId: dept?.id || null,
        qualification: formData.qualification,
        experienceYears: parseInt(formData.experience_years || '0', 10),
        status: formData.status
      };

      if (editingStaff) {
        await staffService.updateStaff(editingStaff.id, payload);
      } else {
        const nextCode = `FAC-${String(staff.length + 43).padStart(3, '0')}`;
        await staffService.createStaff({
          employeeCode: nextCode,
          ...payload
        });
      }

      handleCloseFormModal();
      fetchStaff();
    } catch (err) {
      console.error('Save staff error:', err);
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Confirm Delete Staff Member',
      message: 'Are you sure you want to permanently delete this staff member? This will remove associated academic profile and directory records.',
      confirmText: 'Delete Member',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await staffService.deleteStaff(id);
      fetchStaff();
    } catch (err) {
      console.error('Delete staff error:', err);
      alert('Failed to delete staff member');
    }
  };

  // Staff specific related records
  const staffRelatedDuties = selectedStaff ? duties.filter(d => d.staff_id === selectedStaff.id || d.staff_name === selectedStaff.full_name) : [];
  const staffRelatedCerts = selectedStaff ? certificates.filter(c => c.staff_id === selectedStaff.id || c.staff_name === selectedStaff.full_name) : [];
  const staffRelatedChecks = selectedStaff ? checklists.filter(c => c.staff_id === selectedStaff.id || c.staff_name === selectedStaff.full_name) : [];

  return (
    <div className="staff-directory-view">
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
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            <i className="fa-solid fa-address-book"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Staff Directory Lookup
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Comprehensive directory of academic faculty, departmental heads, professors, and administrative personnel
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link
            to="/unilms/org/hr/employees"
            className="btn btn-primary"
            title="Single-Door Institutional Onboarding: Creates employee profile, payroll account, and LMS credentials in one step"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#ffffff',
              border: 'none',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="fa-solid fa-user-plus"></i>
            <span>Onboard Staff via HR</span>
          </Link>
        </div>
      </div>

      {/* Single Source of Truth / Academic Dossier Guidance Banner */}
      <div style={{
        background: 'rgba(37, 99, 235, 0.05)',
        border: '1px solid rgba(37, 99, 235, 0.2)',
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
          <i className="fa-solid fa-graduation-cap" style={{ color: '#2563EB', fontSize: '18px' }}></i>
          <span style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.4' }}>
            <strong>Academic Operations Dossier:</strong> Review departmental faculty workloads, committee duties, checklists, and service certificates. New employee registration and LMS credential provisioning are centrally handled via <strong>HR &amp; Payroll &rarr; Employees</strong>.
          </span>
        </div>
        <Link
          to="/unilms/org/hr/employees"
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#2563EB',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap'
          }}
        >
          <span>HR Onboarding</span>
          <i className="fa-solid fa-arrow-right"></i>
        </Link>
      </div>

      {/* KPI Cards Grid - Border-left Accent Model (Image 1) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px', marginBottom: '22px' }}>

        {/* Total Academic Staff */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #E11D48',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--card-bg, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Total Enrolled Staff
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#E11D48', marginTop: '3px', lineHeight: '1.2' }}>
            {totalStaff} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Personnel</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> 100% Active in Roster
          </div>
        </div>

        {/* Teaching Faculty */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid var(--success, #10B981)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--card-bg, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Teaching Faculty
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '3px', lineHeight: '1.2' }}>
            {facultyCount} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Faculty</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '4px' }}>
            Professors &amp; Lecturers
          </div>
        </div>

        {/* Academic Administration */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #06B6D4',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--card-bg, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Technical &amp; Support
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#06B6D4', marginTop: '3px', lineHeight: '1.2' }}>
            {adminCount} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Staff</span>
          </div>
          <div style={{ fontSize: '11px', color: '#06B6D4', fontWeight: '700', marginTop: '4px' }}>
            Labs &amp; Administration
          </div>
        </div>

        {/* Active Academic Duties */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid var(--warning, #F59E0B)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '12px',
            background: 'var(--card-bg, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Assigned Active Duties
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '3px', lineHeight: '1.2' }}>
            {activeDutiesCount} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Duties</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--warning, #F59E0B)', fontWeight: '700', marginTop: '4px' }}>
            Exam &amp; Committee Duties
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
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
              placeholder="Search by faculty name, email, designation, phone..."
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
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="form-control"
              style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', padding: '6px 12px' }}
            >
              <option value="All">All Departments</option>
              {departmentsList.length > 0 ? (
                departmentsList.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))
              ) : (
                staffDepartments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))
              )}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-control"
              style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', padding: '6px 12px' }}
            >
              <option value="All">All Roles</option>
              {staffRoles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table matching php_source/app/Views/org/staff/directory.php */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', width: '50px' }}>#</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name & Designation</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 6} />
              ) : paginatedStaff.length > 0 ? (
                paginatedStaff.map((s, idx) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: '#64748B', fontWeight: '600' }}>
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <strong style={{ color: '#1E293B', fontSize: '14px', display: 'block' }}>{s.full_name}</strong>
                      <span style={{ fontSize: '12px', color: '#7C3AED', fontWeight: '600' }}>
                        {s.designation || 'Faculty'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: '#F1F5F9',
                        color: '#334155',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {s.department || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13.5px', color: '#2563EB' }}>
                      <i className="fa-regular fa-envelope me-1" style={{ color: '#94a3b8' }}></i>
                      {s.email}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        background: s.role === 'Faculty' ? '#EFF6FF' : '#F5F3FF',
                        color: s.role === 'Faculty' ? '#2563EB' : '#7C3AED',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        {s.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13px', color: '#475569' }}>
                      {s.phone ? (
                        <span><i className="fa-solid fa-phone me-1" style={{ color: '#94a3b8' }}></i>{s.phone}</span>
                      ) : 'N/A'}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(s)}
                          className="btn btn-outline"
                          title="View Tabbed Profile"
                          style={{
                            padding: '5px 11px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#7C3AED',
                            borderColor: '#ddd6fe',
                            background: '#F5F3FF',
                            fontWeight: '600'
                          }}
                        >
                          <i className="fa-solid fa-id-card-clip me-1"></i> Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(s)}
                          className="btn btn-outline"
                          style={{
                            padding: '5px 10px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#334155',
                            borderColor: '#cbd5e1'
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id)}
                          className="btn btn-outline"
                          style={{
                            padding: '5px 9px',
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
                  <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    <i className="fa-solid fa-user-slash" style={{ fontSize: '32px', color: '#cbd5e1', display: 'block', marginBottom: '10px' }}></i>
                    No staff found in directory.
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
          itemName="staff members"
        />
      </div>

      {/* ============================================================== */}
      {/* 1. ADD / EDIT STAFF MODAL                                      */}
      {/* ============================================================== */}
      {isFormModalOpen && (
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
            width: '600px',
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
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff / Faculty'}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Dr. Rajesh Sharma"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-control"
                      placeholder="faculty@apex.edu"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Department
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    >
                      {departmentsList.length > 0 ? (
                        departmentsList.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))
                      ) : (
                        staffDepartments.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Designation
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Professor & HOD"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    >
                      {staffRoles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="form-control"
                      placeholder="10 digit number"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Qualification
                    </label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Ph.D. in Computer Science"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      name="experience_years"
                      min="0"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Specialization / Research Area
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Artificial Intelligence"
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
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
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
                  onClick={handleCloseFormModal}
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
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TABBED DETAIL MODAL ("tab in modal")                         */}
      {/* ============================================================== */}
      {isDetailModalOpen && selectedStaff && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '740px',
            maxWidth: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#7C3AED',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  {selectedStaff.full_name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                    {selectedStaff.full_name}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                    <span>{selectedStaff.designation}</span>
                    <span>•</span>
                    <span style={{ color: '#7C3AED', fontWeight: '600' }}>{selectedStaff.department}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseDetailModal}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* TAB NAVIGATION BAR */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              background: '#ffffff',
              padding: '0 24px',
              gap: '24px'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                style={{
                  padding: '14px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'profile' ? '3px solid #7C3AED' : '3px solid transparent',
                  color: activeTab === 'profile' ? '#7C3AED' : '#64748b',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-user-tie"></i> Profile & Qualifications
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('duties')}
                style={{
                  padding: '14px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'duties' ? '3px solid #7C3AED' : '3px solid transparent',
                  color: activeTab === 'duties' ? '#7C3AED' : '#64748b',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-list-check"></i> Academic Duties ({staffRelatedDuties.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('certificates')}
                style={{
                  padding: '14px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'certificates' ? '3px solid #7C3AED' : '3px solid transparent',
                  color: activeTab === 'certificates' ? '#7C3AED' : '#64748b',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-certificate"></i> Certificates ({staffRelatedCerts.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('checklists')}
                style={{
                  padding: '14px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'checklists' ? '3px solid #7C3AED' : '3px solid transparent',
                  color: activeTab === 'checklists' ? '#7C3AED' : '#64748b',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-clipboard-list"></i> Checklists ({staffRelatedChecks.length})
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* TAB 1: PROFILE OVERVIEW */}
              {activeTab === 'profile' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Email Address</div>
                      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600', marginTop: '4px' }}>{selectedStaff.email}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Phone / Mobile</div>
                      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600', marginTop: '4px' }}>{selectedStaff.phone || 'N/A'}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Academic Qualification</div>
                      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600', marginTop: '4px' }}>{selectedStaff.qualification || 'M.Tech / Ph.D.'}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Teaching Experience</div>
                      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600', marginTop: '4px' }}>{selectedStaff.experience_years || '5'} Years</div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Specialization & Research Focus</div>
                    <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600', marginTop: '4px' }}>
                      {selectedStaff.specialization || 'Distributed Systems, Machine Learning & Embedded Architectures'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '20px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Joining Date</div>
                      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600', marginTop: '4px' }}>{selectedStaff.joining_date || '2018-08-16'}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Employment Status</div>
                      <div style={{ fontSize: '14px', color: '#16a34a', fontWeight: '700', marginTop: '4px' }}>
                        <i className="fa-solid fa-circle-check me-1"></i> {selectedStaff.status || 'Active'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ACADEMIC DUTIES TABLE IN MODAL */}
              {activeTab === 'duties' && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>
                    Assigned Academic Duties for {selectedStaff.full_name}
                  </h4>
                  {staffRelatedDuties.length > 0 ? (
                    <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>Task / Duty</th>
                            <th style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>Assigned By</th>
                            <th style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>Due Date</th>
                            <th style={{ padding: '10px', textAlign: 'center', color: '#475569' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffRelatedDuties.map(d => (
                            <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px', fontWeight: '600', color: '#1e293b' }}>{d.task_name}</td>
                              <td style={{ padding: '10px', color: '#64748b' }}>{d.assigned_by}</td>
                              <td style={{ padding: '10px', color: '#334155' }}>{d.due_date}</td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  background: d.status === 'Completed' ? '#DCFCE7' : (d.status === 'In Progress' ? '#FEF3C7' : '#F1F5F9'),
                                  color: d.status === 'Completed' ? '#16A34A' : (d.status === 'In Progress' ? '#D97706' : '#64748B')
                                }}>
                                  {d.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      <i className="fa-solid fa-list-check" style={{ fontSize: '28px', marginBottom: '8px', display: 'block' }}></i>
                      No academic duties assigned to this staff member currently.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CERTIFICATES TABLE IN MODAL */}
              {activeTab === 'certificates' && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>
                    Certificates Issued to {selectedStaff.full_name}
                  </h4>
                  {staffRelatedCerts.length > 0 ? (
                    <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>Certificate Type</th>
                            <th style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>Issue Date</th>
                            <th style={{ padding: '10px', textAlign: 'left', color: '#475569' }}>Signatory Authority</th>
                            <th style={{ padding: '10px', textAlign: 'right', color: '#475569' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffRelatedCerts.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px', fontWeight: '600', color: '#1e293b' }}>{c.certificate_type}</td>
                              <td style={{ padding: '10px', color: '#64748b' }}>{c.issue_date}</td>
                              <td style={{ padding: '10px', color: '#334155' }}>{c.signatory || 'Registrar'}</td>
                              <td style={{ padding: '10px', textAlign: 'right' }}>
                                <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                                  <i className="fa-solid fa-file-pdf me-1"></i> PDF
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      <i className="fa-solid fa-certificate" style={{ fontSize: '28px', marginBottom: '8px', display: 'block' }}></i>
                      No official certificates on file for this staff member.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CHECKLISTS IN MODAL */}
              {activeTab === 'checklists' && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>
                    Onboarding & Exit Checklist Items
                  </h4>
                  {staffRelatedChecks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {staffRelatedChecks.map(chk => (
                        <div key={chk.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className={chk.is_completed ? "fa-solid fa-circle-check" : "fa-regular fa-circle"} style={{ color: chk.is_completed ? '#16A34A' : '#94A3B8', fontSize: '16px' }}></i>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13.5px' }}>{chk.item_name}</div>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Type: {chk.checklist_type}</span>
                            </div>
                          </div>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: chk.is_completed ? '#DCFCE7' : '#FEE2E2',
                            color: chk.is_completed ? '#16A34A' : '#DC2626'
                          }}>
                            {chk.is_completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      <i className="fa-solid fa-clipboard-check" style={{ fontSize: '28px', marginBottom: '8px', display: 'block' }}></i>
                      No pending checklist items for this staff member.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCloseDetailModal}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
};

export default OrgStaffDirectory;