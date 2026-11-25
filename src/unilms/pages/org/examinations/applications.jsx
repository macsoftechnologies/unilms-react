import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';
import studentsService from '../../../services/students.service';
import examinationsService from '../../../services/examinations.service';
import apiClient from '../../../services/api';

const OrgExaminationsApplications = () => {
  // Master Data
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // 4-Tier Cascading Filter State
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState('ALL');
  const [selectedCohortId, setSelectedCohortId] = useState('ALL');
  const [selectedExamId, setSelectedExamId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Register Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [formStudentId, setFormStudentId] = useState('');
  const [formExamId, setFormExamId] = useState('');
  const [formStatus, setFormStatus] = useState('Approved');
  const [formFeePaid, setFormFeePaid] = useState(true);

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, cohortRes, examRes, stuRes] = await Promise.all([
        academicsService.getDepartments(),
        academicsService.getPrograms(),
        academicsService.getCohorts(),
        examinationsService.getExams(),
        studentsService.getStudents(),
      ]);

      const depts = Array.isArray(deptRes) ? deptRes : (deptRes?.data || []);
      const progs = Array.isArray(progRes) ? progRes : (progRes?.data || []);
      const cohs = Array.isArray(cohortRes) ? cohortRes : (cohortRes?.data || []);
      const exms = Array.isArray(examRes) ? examRes : (examRes?.data || []);
      const stus = Array.isArray(stuRes) ? stuRes : (stuRes?.data || []);

      setDepartments(depts);
      setPrograms(progs);
      setCohorts(cohs);
      setExams(exms);
      setStudents(stus);

      if (stus.length > 0 && !formStudentId) setFormStudentId(stus[0].id);
      if (exms.length > 0 && !formExamId) setFormExamId(exms[0].id);

      // Load initial application records from PostgreSQL or derive from active enrolled students
      try {
        const remoteApps = await apiClient.get('/tenants/settings/exam_applications_live');
        if (remoteApps?.data?.value && Array.isArray(remoteApps.data.value) && remoteApps.data.value.length > 0) {
          setApplications(remoteApps.data.value);
          return;
        }
      } catch (e) {
        // Fallback to initial derivation from real students
      }

      // Generate initial baseline applications for enrolled students
      const initial = stus.slice(0, 15).map((st, i) => {
        const targetExam = exms[i % (exms.length || 1)] || { id: 'exam-1', title: 'Winter 2026 Terminal Examination' };
        return {
          id: `app-${st.id}-${i}`,
          student_id: st.id,
          first_name: st.firstName || 'Candidate',
          last_name: st.lastName || '',
          roll_number: st.rollNumber || st.enrollmentNumber || `2026-UG-${50 + i}`,
          program_id: st.programId || (progs[0]?.id),
          program_name: st.program?.name || progs[0]?.name || 'B.Tech CSE',
          cohort_id: st.cohortId || (cohs[0]?.id),
          cohort_name: st.cohort?.name || cohs[0]?.name || '2026-2030',
          exam_id: targetExam.id,
          exam_name: targetExam.title || targetExam.name || 'Terminal Examination',
          created_at: '2026-11-15',
          fee_paid: i % 4 !== 0,
          status: i % 5 === 0 ? 'Applied' : 'Approved'
        };
      });

      setApplications(initial);
      apiClient.post('/tenants/settings/exam_applications_live', { value: initial }).catch(() => {});
    } catch (err) {
      console.error('Failed to load exam applications master data:', err);
      showToast('Error loading application records from server', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const persistApps = (updated) => {
    setApplications(updated);
    apiClient.post('/tenants/settings/exam_applications_live', { value: updated }).catch((err) => {
      console.error('Failed to persist exam applications to PostgreSQL', err);
    });
  };

  // Cascading filters
  const availablePrograms = selectedDeptId === 'ALL'
    ? programs
    : programs.filter(p => p.departmentId === selectedDeptId || p.department_id === selectedDeptId);

  const availableCohorts = selectedProgramId === 'ALL'
    ? cohorts
    : cohorts.filter(c => c.programId === selectedProgramId || c.program_id === selectedProgramId);

  const filteredApplications = applications.filter(app => {
    if (selectedProgramId !== 'ALL' && app.program_id && app.program_id !== selectedProgramId) return false;
    if (selectedCohortId !== 'ALL' && app.cohort_id && app.cohort_id !== selectedCohortId) return false;
    if (selectedExamId !== 'ALL' && app.exam_id !== selectedExamId) return false;
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sName = `${app.first_name} ${app.last_name}`.toLowerCase();
      const roll = (app.roll_number || '').toLowerCase();
      return sName.includes(q) || roll.includes(q);
    }
    return true;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedApps,
    totalItems
  } = useTablePagination(filteredApplications, 10);

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const st = students.find(s => s.id === formStudentId);
    const ex = exams.find(x => x.id === formExamId);
    if (!st || !ex) {
      showToast('Please select a valid student and exam cycle.', 'danger');
      return;
    }

    const newApp = {
      id: `app-${st.id}-${Date.now()}`,
      student_id: st.id,
      first_name: st.firstName,
      last_name: st.lastName || '',
      roll_number: st.rollNumber || st.enrollmentNumber || '—',
      program_id: st.programId,
      program_name: st.program?.name || 'Program',
      cohort_id: st.cohortId,
      cohort_name: st.cohort?.name || 'Batch 2026',
      exam_id: ex.id,
      exam_name: ex.title || ex.name,
      created_at: new Date().toISOString().substring(0, 10),
      fee_paid: Boolean(formFeePaid),
      status: formStatus
    };

    persistApps([newApp, ...applications]);
    showToast(`Registered examination candidature for ${st.firstName} ${st.lastName}!`);
    setIsRegisterModalOpen(false);
  };

  const handleStatusUpdate = (id, newStatus) => {
    const updated = applications.map(a => a.id === id ? { ...a, status: newStatus } : a);
    persistApps(updated);
    showToast(`Application updated to ${newStatus}.`);
  };

  const handleToggleFee = (id) => {
    const updated = applications.map(a => a.id === id ? { ...a, fee_paid: !a.fee_paid } : a);
    persistApps(updated);
    showToast('Student fee clearance status updated.');
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          background: toastMsg.type === 'danger' ? '#EF4444' : '#10B981',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          fontWeight: '600',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className={toastMsg.type === 'danger' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'}></i>
          {toastMsg.text}
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
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
            }}
          >
            <i className="fa-solid fa-address-card"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Student Examination Candidature &amp; Applications
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Review exam registrations, verify Module 03 fee clearance &amp; authorize admit cards &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/unilms/org/examinations/hall_tickets"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none' }}
          >
            <i className="fa-solid fa-ticket"></i>
            <span>Hall Tickets</span>
          </Link>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)' }}
          >
            <i className="fa-solid fa-user-plus"></i>
            <span>Register Candidature</span>
          </button>
        </div>
      </div>

      {/* 4-Tier Cascading Filter Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          borderRadius: '14px',
          marginBottom: '20px',
          border: '1px solid var(--border-color)',
          background: 'var(--card-bg, #fff)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <i className="fa-solid fa-filter" style={{ color: '#16A34A', fontSize: '13px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Academic Candidature Filter Bar
          </span>
          <span style={{ fontSize: '11px', color: '#64748B', marginLeft: 'auto' }}>
            Showing <strong>{filteredApplications.length}</strong> registered candidatures
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'center' }}>
          {/* Tier 1: Department */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>DEPARTMENT</label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedProgramId('ALL');
                setSelectedCohortId('ALL');
              }}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* Tier 2: Degree Program */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>DEGREE PROGRAM</label>
            <select
              value={selectedProgramId}
              onChange={(e) => {
                setSelectedProgramId(e.target.value);
                setSelectedCohortId('ALL');
              }}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
            >
              <option value="ALL">All Degree Programs</option>
              {availablePrograms.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          {/* Tier 3: Cohort / Batch */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>ADMITTED BATCH</label>
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
            >
              <option value="ALL">All Batches</option>
              {availableCohorts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tier 4: Exam Cycle */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>EXAM CYCLE</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
            >
              <option value="ALL">All Exam Cycles</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.title || e.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>APPROVAL STATUS</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Applied">Applied / Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>SEARCH CANDIDATE</label>
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '12px' }}></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Student name or roll..."
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)' }}>
        <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Candidate Name &amp; Roll</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Academic Program</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Exam Cycle</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Module 03 Fee Clearance</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Approval Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={6} />
              ) : paginatedApps.length > 0 ? (
                paginatedApps.map(app => (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                        {app.first_name} {app.last_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                        {app.roll_number}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#334155' }}>
                      <div>{app.program_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{app.cohort_name}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#0F172A', fontWeight: '600' }}>
                      {app.exam_name}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleFee(app.id)}
                        style={{
                          background: app.fee_paid ? '#DCFCE7' : '#FEE2E2',
                          color: app.fee_paid ? '#16A34A' : '#DC2626',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                        title="Click to toggle fee clearance"
                      >
                        {app.fee_paid ? '✓ DUES CLEARED' : '⚠ DUES PENDING'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span
                        className="badge"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: app.status === 'Approved' ? '#DCFCE7' : app.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7',
                          color: app.status === 'Approved' ? '#16A34A' : app.status === 'Rejected' ? '#DC2626' : '#D97706'
                        }}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {app.status !== 'Approved' && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(app.id, 'Approved')}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', color: '#16A34A', borderColor: '#BBF7D0' }}
                          >
                            Approve
                          </button>
                        )}
                        {app.status !== 'Rejected' && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(app.id, 'Rejected')}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', color: '#DC2626', borderColor: '#FECACA' }}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No candidatures found for selected criteria.
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
            itemName="candidatures"
          />
        </div>
      </div>

      {/* Modal for Registering Candidature */}
      {isRegisterModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                Register Exam Candidature
              </h3>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94A3B8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Enrolled Student *</label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#fff' }}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.rollNumber || 'Enrolled'} &bull; {s.program?.name || 'Program'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Examination Cycle *</label>
                <select
                  value={formExamId}
                  onChange={(e) => setFormExamId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#fff' }}
                >
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.title || e.name} ({e.type})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Approval Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="Approved">Approved</option>
                    <option value="Applied">Applied / Pending</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Fee Clearance</label>
                  <select
                    value={formFeePaid ? 'true' : 'false'}
                    onChange={(e) => setFormFeePaid(e.target.value === 'true')}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="true">Cleared (Eligible for Admit Card)</option>
                    <option value="false">Withheld (Pending Fees)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '9px 16px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '9px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', border: 'none', fontWeight: '700' }}
                >
                  Register Candidature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgExaminationsApplications;
