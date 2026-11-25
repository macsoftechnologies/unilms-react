import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import academicsService from '../../../services/academics.service';
import studentsService from '../../../services/students.service';
import examinationsService from '../../../services/examinations.service';

const OrgExaminationsBacklogs = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Master Data
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [backlogs, setBacklogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 4-Tier Cascading Filter Bar State
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState('ALL');
  const [selectedCohortId, setSelectedCohortId] = useState('ALL');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer / Modal State for Recording Backlog
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [formStudentId, setFormStudentId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formExamId, setFormExamId] = useState('');
  const [formSemester, setFormSemester] = useState('1');
  const [formAttempt, setFormAttempt] = useState(2);
  const [formStatus, setFormStatus] = useState('Pending');

  // Load all master data
  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, cohortRes, secRes, subRes, stuRes, examRes] = await Promise.all([
        academicsService.getDepartments(),
        academicsService.getPrograms(),
        academicsService.getCohorts(),
        academicsService.getSections(),
        academicsService.getSubjects(),
        studentsService.getStudents(),
        examinationsService.getExams(),
      ]);

      const depts = Array.isArray(deptRes) ? deptRes : (deptRes?.data || []);
      const progs = Array.isArray(progRes) ? progRes : (progRes?.data || []);
      const cohs = Array.isArray(cohortRes) ? cohortRes : (cohortRes?.data || []);
      const secs = Array.isArray(secRes) ? secRes : (secRes?.data || []);
      const subs = Array.isArray(subRes) ? subRes : (subRes?.data || []);
      const stus = Array.isArray(stuRes) ? stuRes : (stuRes?.data || []);
      const exms = Array.isArray(examRes) ? examRes : (examRes?.data || []);

      setDepartments(depts);
      setPrograms(progs);
      setCohorts(cohs);
      setSections(secs);
      setSubjects(subs);
      setStudents(stus);
      setExams(exms);

      if (stus.length > 0 && !formStudentId) setFormStudentId(stus[0].id);
      if (subs.length > 0 && !formSubjectId) setFormSubjectId(subs[0].id);
      if (exms.length > 0 && !formExamId) setFormExamId(exms[0].id);

      // Load real backlogs from PostgreSQL backend
      try {
        const dbBacklogs = await examinationsService.getBacklogs();
        if (Array.isArray(dbBacklogs) && dbBacklogs.length > 0) {
          const mapped = dbBacklogs.map(b => ({
            id: b.id,
            studentId: b.studentId || b.student?.id,
            studentName: b.student ? `${b.student.firstName} ${b.student.lastName || ''}`.trim() : 'Unassigned Student',
            rollNumber: b.student?.rollNumber || 'N/A',
            departmentId: b.student?.program?.departmentId || depts[0]?.id || '',
            departmentName: depts.find(d => d.id === b.student?.program?.departmentId)?.name || 'General Department',
            programId: b.student?.programId || b.student?.program?.id || '',
            programCode: b.student?.program?.code || 'PROGRAM',
            programName: b.student?.program?.name || 'Degree Program',
            cohortId: b.student?.cohortId || cohs[0]?.id || '',
            cohortName: cohs.find(c => c.id === b.student?.cohortId)?.name || 'Batch Cohort',
            sectionId: b.student?.sectionId || secs[0]?.id || '',
            sectionName: secs.find(s => s.id === b.student?.sectionId)?.name || 'General Section',
            subjectCode: b.subject?.code || 'N/A',
            subjectName: b.subject?.name || 'Academic Course',
            originalExam: b.exam?.title || 'Semester Examination',
            semester: b.semester || 1,
            attempt: b.attempt || 1,
            status: b.status || 'Pending',
            remarks: b.remarks || 'Supplementary exam application.'
          }));
          setBacklogs(mapped);
          return;
        }
      } catch (err) {
        console.warn('Backend backlogs fetch:', err);
      }

      setBacklogs([]);
    } catch (e) {
      console.error('Failed to load backlogs master data:', e);
      setBacklogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync program dropdown when department changes
  const handleDeptFilterChange = (deptId) => {
    setSelectedDeptId(deptId);
    setSelectedProgramId('ALL');
    setSelectedCohortId('ALL');
    setSelectedSectionId('ALL');
  };

  // Filtered Programs based on selected Department
  const filteredPrograms = programs.filter(p => {
    if (selectedDeptId === 'ALL') return true;
    return p.departmentId === selectedDeptId || p.department?.id === selectedDeptId;
  });

  // Filtered Cohorts based on selected Program
  const filteredCohorts = cohorts.filter(c => {
    if (selectedProgramId === 'ALL') return true;
    return c.programId === selectedProgramId;
  });

  // Filtered Sections based on selected Cohort
  const filteredSections = sections.filter(s => {
    if (selectedCohortId === 'ALL') return true;
    return s.cohortId === selectedCohortId;
  });

  // Final filtered backlogs list
  const filteredBacklogs = backlogs.filter((bkl) => {
    // 1. Department Filter
    if (selectedDeptId !== 'ALL' && bkl.departmentId !== selectedDeptId) return false;
    // 2. Program Filter
    if (selectedProgramId !== 'ALL' && bkl.programId !== selectedProgramId) return false;
    // 3. Cohort Filter
    if (selectedCohortId !== 'ALL' && bkl.cohortId !== selectedCohortId) return false;
    // 4. Section Filter
    if (selectedSectionId !== 'ALL' && bkl.sectionId !== selectedSectionId) return false;
    // 5. Semester Filter
    if (selectedSemester !== 'ALL' && String(bkl.semester) !== selectedSemester) return false;
    // 6. Status Filter
    if (selectedStatus !== 'ALL' && bkl.status !== selectedStatus) return false;
    // 7. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = bkl.studentName?.toLowerCase().includes(q);
      const matchRoll = bkl.rollNumber?.toLowerCase().includes(q);
      const matchSub = bkl.subjectCode?.toLowerCase().includes(q) || bkl.subjectName?.toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchSub) return false;
    }
    return true;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredBacklogs, 10);

  // Statistics
  const totalCount = backlogs.length;
  const pendingCount = backlogs.filter(b => b.status === 'Pending').length;
  const clearedCount = backlogs.filter(b => b.status === 'Cleared').length;
  const clearanceRate = totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;

  // Toggle Clear / Remediate Backlog
  const handleToggleStatus = async (bklId) => {
    const b = backlogs.find(x => x.id === bklId);
    const nextStatus = b?.status === 'Pending' ? 'Cleared' : 'Pending';

    const confirmed = await confirm({
      title: `Confirm Status: ${nextStatus}`,
      message: `Mark academic arrear for "${b?.studentName}" (${b?.subjectCode}) as ${nextStatus}?`,
      details: nextStatus === 'Cleared'
        ? 'This certifies student has passed supplementary examination attempt and fulfilled graduation requirements.'
        : 'Student will be placed back in pending retest arrears roster.',
      confirmText: `Yes, Mark as ${nextStatus}`,
      variant: nextStatus === 'Cleared' ? 'success' : 'warning',
      icon: nextStatus === 'Cleared' ? 'fa-solid fa-circle-check' : 'fa-solid fa-rotate-left'
    });
    if (!confirmed) return;

    try {
      await examinationsService.updateBacklog(bklId, { status: nextStatus });
    } catch (err) {
      console.warn('Could not update backlog on server:', err);
    }

    const updated = backlogs.map((item) => {
      if (item.id === bklId) {
        return { ...item, status: nextStatus };
      }
      return item;
    });
    setBacklogs(updated);
    showToast('Backlog clearance status updated successfully!');
  };

  // Add new Backlog Record
  const handleSaveBacklog = async (e) => {
    e.preventDefault();
    const stu = students.find(s => s.id === formStudentId);
    const sub = subjects.find(s => s.id === formSubjectId);
    const exm = exams.find(e => e.id === formExamId);

    if (!stu || !sub) {
      alert('Please select both a student and a course subject.');
      return;
    }

    const confirmed = await confirm({
      title: 'Confirm Register Backlog Case',
      message: `Record supplementary attempt #${formAttempt} for "${stu.firstName} ${stu.lastName || ''}"?`,
      details: [
        `Candidate: ${stu.firstName} ${stu.lastName || ''} (${stu.rollNumber || 'No Roll'})`,
        `Subject: ${sub.code} - ${sub.name}`,
        `Original Examination: ${exm?.title || 'End Semester Examination'}`,
        `Attempt Number: #${formAttempt} | Semester: ${formSemester}`
      ],
      confirmText: 'Yes, Register Arrear',
      variant: 'primary'
    });
    if (!confirmed) return;

    try {
      await examinationsService.createBacklog({
        studentId: stu.id,
        subjectId: sub.id,
        examId: exm?.id || null,
        semester: Number(formSemester),
        attempt: Number(formAttempt),
        status: formStatus,
        remarks: 'Remediation case registered via Examination Office'
      });
      await loadData();
      showToast(`Arrear registered in PostgreSQL for ${stu.firstName} (${sub.code})!`);
    } catch (err) {
      console.warn('Could not create backlog on server:', err);
      showToast('Could not register arrear on server.', 'danger');
    }
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)', animation: 'fadeIn 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
          </div>
        )}

        {/* Top Header Card */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '20px 24px',
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
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Backlogs Tracking &amp; Remediation
                </h2>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                  EXAMS REGISTRY
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Track academic arrears, supplementary attempts, and remediation clearance credentials across departments and batches
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '9px 18px', borderRadius: '8px', fontWeight: '700', background: '#7C3AED', borderColor: '#7C3AED' }}
            >
              <i className="fa-solid fa-plus"></i> Record Backlog Case
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Backlogs</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>{totalCount}</div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              <i className="fa-solid fa-list-check"></i>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Pending Retests</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#DC2626', marginTop: '2px' }}>{pendingCount}</div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Cleared Courses</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>{clearedCount}</div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Clearance Rate</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>{clearanceRate}%</div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              <i className="fa-solid fa-chart-line"></i>
            </div>
          </div>
        </div>

        {/* 🌟 4-TIER CASCADING ACADEMIC FILTER BAR 🌟 */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-filter" style={{ color: '#7C3AED' }}></i>
            Academic Hierarchy Filters
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {/* 1. Department */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                1. Department
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => handleDeptFilterChange(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '8px', fontWeight: '600' }}
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            {/* 2. Degree Program */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                2. Degree Program
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => { setSelectedProgramId(e.target.value); setSelectedCohortId('ALL'); setSelectedSectionId('ALL'); }}
                className="form-control"
                style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '8px', fontWeight: '600' }}
              >
                <option value="ALL">All Programs</option>
                {filteredPrograms.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} &bull; {p.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Batch / Cohort */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                3. Admitted Batch
              </label>
              <select
                value={selectedCohortId}
                onChange={(e) => { setSelectedCohortId(e.target.value); setSelectedSectionId('ALL'); }}
                className="form-control"
                style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '8px', fontWeight: '600' }}
              >
                <option value="ALL">All Batches</option>
                {filteredCohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name || 'Cohort Batch'}</option>
                ))}
              </select>
            </div>

            {/* 4. Class Section */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                4. Class Section
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '8px', fontWeight: '600' }}
              >
                <option value="ALL">All Sections</option>
                {filteredSections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary Filters: Semester, Status, Live Search */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Semester Level
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '8px' }}
              >
                <option value="ALL">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Remediation Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '8px' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending Retest</option>
                <option value="Cleared">Cleared</option>
              </select>
            </div>

            <div style={{ minWidth: '200px', flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Search Student or Subject
              </label>
              <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-search" style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)', fontSize: '12px' }}></i>
                <input
                  type="text"
                  placeholder="Search by student name, roll number, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', paddingLeft: '30px', fontSize: '12.5px', borderRadius: '8px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Backlogs Table */}
        <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>
              Backlog Registry ({filteredBacklogs.length} Records)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {paginatedItems.length} of {filteredBacklogs.length} cases
            </span>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '8px' }}>
            <table className="table" style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--border-color)', fontSize: '11.5px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Candidate Details</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Department &amp; Program</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Subject &amp; Code</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Original Exam</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Term</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Attempt</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Remediation Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No backlog records found matching the active filters.
                    </td>
                  </tr>
                )}
                {paginatedItems.map((bkl) => (
                  <tr key={bkl.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{bkl.studentName}</div>
                      <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', fontSize: '10.5px' }}>
                        {bkl.rollNumber}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '700', fontSize: '12.5px' }}>{bkl.programCode}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{bkl.departmentName}</div>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '800', color: '#7C3AED' }}>{bkl.subjectCode}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{bkl.subjectName}</div>
                    </td>

                    <td style={{ padding: '12px 14px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {bkl.originalExam}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700' }}>
                      Sem {bkl.semester}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span className="badge" style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-primary)', fontWeight: '700' }}>
                        Attempt #{bkl.attempt}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span
                        className="badge"
                        style={{
                          background: bkl.status === 'Cleared' ? '#D1FAE5' : '#FEE2E2',
                          color: bkl.status === 'Cleared' ? '#059669' : '#DC2626',
                          fontWeight: '700',
                          fontSize: '11px'
                        }}
                      >
                        {bkl.status === 'Cleared' ? '✓ Cleared' : '⚠ Pending'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleStatus(bkl.id)}
                        className="btn btn-outline"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11.5px',
                          borderRadius: '6px',
                          color: bkl.status === 'Cleared' ? '#D97706' : '#059669',
                          borderColor: bkl.status === 'Cleared' ? '#D97706' : '#059669'
                        }}
                      >
                        {bkl.status === 'Cleared' ? 'Mark Pending' : 'Mark Cleared'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / pageSize)}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={totalItems}
          />
        </div>

        {/* DRAWER: Record Backlog Case */}
        {isDrawerOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 1060,
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                height: '100%',
                background: 'var(--card-bg, #fff)',
                boxShadow: '-4px 0 25px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideInRight 0.2s'
              }}
            >
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-plus"></i>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Record Academic Backlog</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Register supplementary arrear attempt</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                <form onSubmit={handleSaveBacklog}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '5px' }}>
                      Select Enrolled Student
                    </label>
                    <select
                      value={formStudentId}
                      onChange={(e) => setFormStudentId(e.target.value)}
                      className="form-control"
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontWeight: '600' }}
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName || ''} ({s.rollNumber || 'No Roll'}) &bull; {s.program?.code || 'UG'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '5px' }}>
                      Course Subject with Arrear
                    </label>
                    <select
                      value={formSubjectId}
                      onChange={(e) => setFormSubjectId(e.target.value)}
                      className="form-control"
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontWeight: '600' }}
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.code} &bull; {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '5px' }}>
                      Examination Session
                    </label>
                    <select
                      value={formExamId}
                      onChange={(e) => setFormExamId(e.target.value)}
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px' }}
                    >
                      {exams.map((exm) => (
                        <option key={exm.id} value={exm.id}>
                          {exm.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px' }}>
                        Failed Semester
                      </label>
                      <select
                        value={formSemester}
                        onChange={(e) => setFormSemester(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px' }}
                      >
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                        <option value="3">Semester 3</option>
                        <option value="4">Semester 4</option>
                        <option value="5">Semester 5</option>
                        <option value="6">Semester 6</option>
                        <option value="7">Semester 7</option>
                        <option value="8">Semester 8</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px' }}>
                        Attempt Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formAttempt}
                        onChange={(e) => setFormAttempt(e.target.value)}
                        className="form-control"
                        required
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '5px' }}>
                      Initial Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="form-control"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px' }}
                    >
                      <option value="Pending">Pending Retest</option>
                      <option value="Cleared">Cleared</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="btn btn-outline"
                      style={{ padding: '8px 16px', borderRadius: '8px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: '700', background: '#7C3AED', borderColor: '#7C3AED' }}
                    >
                      Save Backlog Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgExaminationsBacklogs;
