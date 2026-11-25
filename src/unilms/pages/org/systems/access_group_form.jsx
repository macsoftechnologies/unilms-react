import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import academicsService from '../../../services/academics.service';

const permissionModules = [
  {
    module: 'cms',
    category: 'Admissions & CRM',
    icon: 'fa-user-plus',
    permissions: [
      { id: 'adm_view', label: 'View Prospect Leads & Student Enquiries' },
      { id: 'adm_create', label: 'Create New Admission Applications' },
      { id: 'adm_verify', label: 'Verify Certificates & Eligibility' },
      { id: 'adm_offers', label: 'Generate Provisional Offer Letters' },
      { id: 'adm_enroll', label: 'Complete Final Student Enrollment' },
      { id: 'adm_reports', label: 'Export Admission & Funnel Reports' },
      { id: 'adm_funnel', label: 'View Admission ➔ Joining Funnel & Yield Analytics' },
      { id: 'adm_narrative', label: 'View AI Narrative & Admissions Executive Briefing' }
    ]
  },
  {
    module: 'cms',
    category: 'Academics & Faculty Allocation',
    icon: 'fa-book-open',
    permissions: [
      { id: 'acad_syllabus', label: 'Manage Academic Regulations & Syllabus' },
      { id: 'acad_timetable', label: 'Build & Publish Weekly Class Timetables' },
      { id: 'acad_attendance', label: 'Mark, Edit & Audit Daily Attendance' },
      { id: 'acad_faculty', label: 'Assign Faculty Course Allocations' },
      { id: 'acad_obe', label: 'OBE Course Outcomes (CO) & Mapping Setup' },
      { id: 'acad_attainment', label: 'Analyze PO/CO Attainment Reports' },
      { id: 'acad_student_analysis', label: 'View Student 360° Scorecard & At-Risk Radar' },
      { id: 'acad_risk_alerts', label: 'Trigger Early-Warning Dropout & Detention Alerts' }
    ]
  },
  {
    module: 'cms',
    category: 'MIS & Executive Intelligence',
    icon: 'fa-chart-pie',
    permissions: [
      { id: 'mis_executive_cockpit', label: 'Access Executive Boardroom Cockpit & Institutional KPIs' },
      { id: 'mis_financial_reports', label: 'View Consolidated Fee Revenue & Recovery MIS' },
      { id: 'mis_academic_reports', label: 'Export Campus-wide Pass Rates & OBE Attainment' },
      { id: 'mis_compliance_naac', label: 'Generate NAAC, NIRF & AICTE Regulatory Reports' }
    ]
  },
  {
    module: 'cms',
    category: 'Examinations & Marks Processing',
    icon: 'fa-graduation-cap',
    permissions: [
      { id: 'exam_schedule', label: 'Configure Exam Schedules & Datesheets' },
      { id: 'exam_hallticket', label: 'Generate & Release Student Hall Tickets' },
      { id: 'exam_marks_entry', label: 'Faculty Internal & External Marks Entry' },
      { id: 'exam_ratify', label: 'Ratify Marks & Publish Grade Cards' },
      { id: 'exam_backlogs', label: 'Manage Supplementary / Backlog Registrations' },
      { id: 'exam_revaluation', label: 'Process Revaluation & Scrutiny Requests' }
    ]
  },
  {
    module: 'cms',
    category: 'Student Accounts & Fee Management',
    icon: 'fa-receipt',
    permissions: [
      { id: 'fee_structures', label: 'Configure Semester & Annual Fee Structures' },
      { id: 'fee_collect', label: 'Collect Counter Fees & Generate PDF Receipts' },
      { id: 'fee_dues', label: 'Monitor Defaulter Lists & Send Reminders' },
      { id: 'fee_discounts', label: 'Apply Scholarships & Fee Concessions' },
      { id: 'fee_reports', label: 'Export Daily Cash Collection & Ledger Reports' }
    ]
  },
  {
    module: 'cms',
    category: 'HR, Staff & Payroll Operations',
    icon: 'fa-users-gear',
    permissions: [
      { id: 'hr_employees', label: 'Manage Staff & Faculty Directory Profiles' },
      { id: 'hr_leaves', label: 'Review & Approve Staff Leave Applications' },
      { id: 'hr_payroll', label: 'Run Monthly Salary Payroll & Generate Payslips' },
      { id: 'hr_appraisals', label: 'Conduct Annual Faculty Appraisals' },
      { id: 'hr_attendance', label: 'Audit Biometric Gate & Attendance Logs' }
    ]
  },
  {
    module: 'cms',
    category: 'Hostel & Residential Life',
    icon: 'fa-hotel',
    permissions: [
      { id: 'hostel_view', label: 'View Hostel Blocks & Real-time Room Vacancies' },
      { id: 'hostel_allot', label: 'Register Residential Students & Allot Beds' },
      { id: 'hostel_outings', label: 'Approve Night Outings & Gate Departure Passes' },
      { id: 'hostel_fees', label: 'Track Hostel Boarding & Mess Fee Clearances' }
    ]
  },
  {
    module: 'cms',
    category: 'Front Office & Visitor Management',
    icon: 'fa-id-card-clip',
    permissions: [
      { id: 'fo_visitors', label: 'Log Campus Visitors & Issue Printed Badges' },
      { id: 'fo_calls', label: 'Maintain Inward & Outward Telephone Registers' },
      { id: 'fo_postal', label: 'Manage Courier Dispatch & Inward Mail Registry' },
      { id: 'fo_enquiries', label: 'Track Walk-in Admission & General Enquiries' }
    ]
  },
  {
    module: 'cms',
    category: 'Campus Placements & Corporate Drives',
    icon: 'fa-briefcase',
    permissions: [
      { id: 'place_companies', label: 'Manage Corporate Recruiters & HR Contacts' },
      { id: 'place_drives', label: 'Schedule Campus Recruitment Drives & Eligibility' },
      { id: 'place_offers', label: 'Record Placement Offer Letters & Packages' },
      { id: 'place_internships', label: 'Monitor Student Summer Internship Records' }
    ]
  },
  {
    module: 'lms',
    category: 'LMS Digital Courses & Quizzes',
    icon: 'fa-laptop-code',
    permissions: [
      { id: 'lms_courses', label: 'Create & Publish Online Learning Courses' },
      { id: 'lms_materials', label: 'Upload Video Lectures, PDFs & Notes' },
      { id: 'lms_assignments', label: 'Create Homework Tasks & Evaluate Submissions' },
      { id: 'lms_quizzes', label: 'Build Objective Quizzes & Question Banks' },
      { id: 'lms_progress', label: 'Track Student Chapter Progress & Course Analytics' }
    ]
  },
  {
    module: 'system',
    category: 'System Security & Administration',
    icon: 'fa-shield-halved',
    permissions: [
      { id: 'sys_users', label: 'Manage User Accounts, Passwords & Access Groups' },
      { id: 'sys_access_groups', label: 'Create & Modify System Access Roles' },
      { id: 'sys_college_details', label: 'Update College Profile, Accreditation & Logo' },
      { id: 'sys_audit_logs', label: 'Inspect Security Audit Trails & Login Logs' }
    ]
  }
];

const OrgSystemsAccessGroupForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [existingGroups, setExistingGroups] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState(new Set());

  const allPermIds = useMemo(() => {
    return permissionModules.flatMap(m => m.permissions.map(p => p.id));
  }, []);

  // Pre-load data from PostgreSQL when editing an existing group
  useEffect(() => {
    academicsService.getAccessGroups().then(groups => {
      const list = Array.isArray(groups) ? groups : [];
      setExistingGroups(list);
      if (editId) {
        const found = list.find(g => String(g.id) === String(editId));
        if (found) {
          setName(found.name || '');
          setDescription(found.description || '');

          if (found.name?.toLowerCase().includes('admin')) {
            setSelectedPerms(new Set(allPermIds));
          } else if (found.name?.toLowerCase().includes('hod')) {
            const hodPerms = allPermIds.filter(id => 
              id.startsWith('acad_') || id.startsWith('exam_') || id.startsWith('lms_')
            );
            setSelectedPerms(new Set(hodPerms));
          } else if (found.name?.toLowerCase().includes('faculty')) {
            const facPerms = [
              'acad_attendance', 'acad_syllabus', 'acad_obe',
              'exam_marks_entry',
              'lms_courses', 'lms_materials', 'lms_assignments', 'lms_quizzes', 'lms_progress'
            ];
            setSelectedPerms(new Set(facPerms));
          } else {
            setSelectedPerms(new Set(allPermIds.slice(0, found.permissionsCount || 14)));
          }
        }
      } else {
        setSelectedPerms(new Set(['adm_view', 'acad_syllabus', 'exam_schedule', 'fo_visitors']));
      }
    }).catch(err => {
      console.warn('Failed to load access groups:', err);
    });
  }, [editId, allPermIds]);

  const handleSelectAll = () => {
    setSelectedPerms(new Set(allPermIds));
  };

  const handleClearAll = () => {
    setSelectedPerms(new Set());
  };

  const togglePerm = (id) => {
    const next = new Set(selectedPerms);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPerms(next);
  };

  const toggleCategory = (perms) => {
    const ids = perms.map(p => p.id);
    const allChecked = ids.every(id => selectedPerms.has(id));
    const next = new Set(selectedPerms);
    if (allChecked) {
      ids.forEach(id => next.delete(id));
    } else {
      ids.forEach(id => next.add(id));
    }
    setSelectedPerms(next);
  };

  const handleClone = (e) => {
    const groupName = e.target.value;
    if (!groupName) return;
    const found = existingGroups.find(g => g.name === groupName);
    if (found) {
      setDescription(found.description);
      if (groupName.toLowerCase().includes('admin')) {
        setSelectedPerms(new Set(allPermIds));
      } else if (groupName.toLowerCase().includes('hod')) {
        const hodPerms = allPermIds.filter(id => 
          id.startsWith('acad_') || id.startsWith('exam_') || id.startsWith('lms_')
        );
        setSelectedPerms(new Set(hodPerms));
      } else if (groupName.toLowerCase().includes('faculty')) {
        const facPerms = [
          'acad_attendance', 'acad_syllabus', 'acad_obe',
          'exam_marks_entry',
          'lms_courses', 'lms_materials', 'lms_assignments', 'lms_quizzes', 'lms_progress'
        ];
        setSelectedPerms(new Set(facPerms));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editId) {
        await academicsService.updateAccessGroup(editId, {
          name: name.trim(),
          description: description.trim(),
          permissionsCount: selectedPerms.size,
        });
      } else {
        await academicsService.createAccessGroup({
          name: name.trim(),
          description: description.trim() || 'Role-based access privileges for institutional staff',
          permissionsCount: selectedPerms.size,
          createdBy: 'Organization Admin',
        });
      }
    } catch (err) {
      console.warn('Failed to save access group to database:', err);
    }

    navigate('/unilms/org/systems/access_groups');
  };

  return (
    <>
      <section className="view-section active" style={{ paddingBottom: '90px' }}>
        {/* Header with Back button */}
        <div className="view-header" style={{ marginBottom: '24px' }}>
          <div>
            <Link 
              to="/unilms/org/systems/access_groups" 
              style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-arrow-left"></i> Back to Access Groups
            </Link>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {editId ? `Edit Access Group: ${name || 'Role'}` : 'Create Access Group Settings'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(min(100%, 300px), 1fr) 2.2fr', gap: '28px', alignItems: 'start' }}>
            {/* Left Column: Group Settings */}
            <div style={{ position: 'sticky', top: '90px' }}>
              <div className="card" style={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Group Definition
                </h3>
                
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: '600', fontSize: '13px', color: '#64748B', marginBottom: '6px', display: 'block' }}>
                    Group Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="form-control" 
                    required 
                    placeholder="e.g. Examination Cell, Accounts Desk" 
                    style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: '600', fontSize: '13px', color: '#64748B', marginBottom: '6px', display: 'block' }}>
                    Description
                  </label>
                  <textarea 
                    rows="3" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="form-control" 
                    placeholder="Briefly describe what members of this group are permitted to do."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                  ></textarea>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: '600', fontSize: '13px', color: '#64748B', marginBottom: '6px', display: 'block' }}>
                    <i className="fa-solid fa-clone" style={{ color: '#7C3AED', marginRight: '6px' }}></i> Clone Permissions From
                  </label>
                  <select 
                    onChange={handleClone} 
                    className="form-control"
                    style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '13px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' }}
                  >
                    <option value="">-- Start from template --</option>
                    {existingGroups.map(g => (
                      <option key={g.id} value={g.name}>{g.name} ({g.permissions_count || 18} perms)</option>
                    ))}
                  </select>
                </div>

                <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  <i className="fa-solid fa-circle-info" style={{ color: '#7C3AED', marginRight: '6px' }}></i>
                  Staff assigned to this access group will inherit all checked privileges across institutional modules immediately.
                </div>
              </div>
            </div>

            {/* Right Column: Permissions Matrix */}
            <div>
              <div className="card" style={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                {/* Search & Actions Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Select Module Permissions
                    </h3>
                    <span style={{ fontSize: '13px', color: '#7C3AED', fontWeight: '700' }}>
                      {selectedPerms.size} of {allPermIds.length} Permissions Selected
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      onClick={handleSelectAll} 
                      style={{ padding: '7px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <i className="fa-solid fa-check-double"></i> Select All
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      onClick={handleClearAll} 
                      style={{ padding: '7px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <i className="fa-solid fa-eraser"></i> Clear
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      onClick={() => setShowOnlySelected(!showOnlySelected)} 
                      style={{ padding: '7px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer', background: showOnlySelected ? '#F5F3FF' : '#fff', color: showOnlySelected ? '#7C3AED' : '#475569', borderColor: showOnlySelected ? '#7C3AED' : '#CBD5E1' }}
                    >
                      {showOnlySelected ? 'View All' : 'View Only Selected'}
                    </button>
                  </div>
                </div>

                {/* Search bar */}
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px' }}></i>
                  <input 
                    type="text" 
                    value={searchFilter} 
                    onChange={(e) => setSearchFilter(e.target.value)} 
                    placeholder="Search permissions (e.g. attendance, marks, fees, gate passes)..." 
                    className="form-control" 
                    style={{ width: '100%', height: '42px', padding: '0 14px 0 38px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', outline: 'none' }}
                  />
                </div>

                {/* Modules Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {permissionModules.map((mod, idx) => {
                    let filteredPerms = mod.permissions.filter(p => !searchFilter || p.label.toLowerCase().includes(searchFilter.toLowerCase()));
                    if (showOnlySelected) {
                      filteredPerms = filteredPerms.filter(p => selectedPerms.has(p.id));
                    }
                    if (filteredPerms.length === 0) return null;

                    const allChecked = mod.permissions.every(p => selectedPerms.has(p.id));

                    return (
                      <div key={idx} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '18px 20px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#7C3AED', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                              <i className={`fa-solid ${mod.icon}`}></i>
                            </div>
                            <span>{mod.category}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => toggleCategory(mod.permissions)}
                            style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: '#64748B', padding: '3px 10px', cursor: 'pointer' }}
                          >
                            {allChecked ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                          {filteredPerms.map((perm) => {
                            const isChecked = selectedPerms.has(perm.id);
                            return (
                              <label 
                                key={perm.id} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '10px', 
                                  padding: '10px 14px', 
                                  borderRadius: '8px', 
                                  background: isChecked ? '#F5F3FF' : '#ffffff', 
                                  border: isChecked ? '1.5px solid #7C3AED' : '1px solid #E2E8F0', 
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  userSelect: 'none'
                                }}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked} 
                                  onChange={() => togglePerm(perm.id)} 
                                  style={{ width: '16px', height: '16px', accentColor: '#7C3AED' }}
                                />
                                <span style={{ fontSize: '13px', fontWeight: isChecked ? '600' : '400', color: isChecked ? '#5B21B6' : 'var(--text-primary)' }}>
                                  {perm.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div 
            style={{ 
              position: 'fixed', 
              bottom: 0, 
              left: 'var(--sidebar-width, 260px)', 
              right: 0, 
              background: '#ffffff', 
              padding: '16px 32px', 
              boxShadow: '0 -4px 16px rgba(0,0,0,0.08)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              zIndex: 1000, 
              borderTop: '1px solid var(--border-color)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#F5F3FF', color: '#7C3AED', padding: '6px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '13px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                <span>{selectedPerms.size}</span> Selected
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {name ? `Configuring: ${name}` : 'New Access Role'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link 
                to="/unilms/org/systems/access_groups"
                className="btn btn-outline"
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', color: '#475569', textDecoration: 'none', fontWeight: '600', fontSize: '13px' }}
              >
                Cancel
              </Link>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ background: '#7C3AED', color: '#fff', border: 'none', padding: '9px 24px', fontSize: '14px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)' }}
              >
                <i className="fa-solid fa-check" style={{ marginRight: '8px' }}></i> 
                {editId ? 'Save Changes' : 'Create Access Group'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </>
  );
};

export default OrgSystemsAccessGroupForm;