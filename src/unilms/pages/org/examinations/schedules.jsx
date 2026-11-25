import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import examinationsService from '../../../services/examinations.service';
import academicsService from '../../../services/academics.service';

const OrgExaminationsSchedules = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [searchParams] = useSearchParams();
  const initialExamParam = searchParams.get('examId') || 'ALL';

  // Master Data
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // 4-Tier Cascading Filter Bar State
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedExamId, setSelectedExamId] = useState(initialExamParam);
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer / Add Schedule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalExamId, setModalExamId] = useState('');
  const [modalProgramId, setModalProgramId] = useState('');
  const [modalSubjectId, setModalSubjectId] = useState('');
  const [modalDate, setModalDate] = useState('2026-12-05');
  const [modalStartTime, setModalStartTime] = useState('10:00');
  const [modalEndTime, setModalEndTime] = useState('13:00');
  const [modalVenue, setModalVenue] = useState('Main Exam Hall A-101');
  const [modalMaxMarks, setModalMaxMarks] = useState(100);
  const [modalPassMarks, setModalPassMarks] = useState(40);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, subRes, examRes, schRes] = await Promise.all([
        academicsService.getDepartments(),
        academicsService.getPrograms(),
        academicsService.getSubjects(),
        examinationsService.getExams(),
        examinationsService.getSchedules(),
      ]);

      const depts = Array.isArray(deptRes) ? deptRes : (deptRes?.data || []);
      const progs = Array.isArray(progRes) ? progRes : (progRes?.data || []);
      const subs = Array.isArray(subRes) ? subRes : (subRes?.data || []);
      const exms = Array.isArray(examRes) ? examRes : (examRes?.data || []);
      const schs = Array.isArray(schRes) ? schRes : (schRes?.data || []);

      setDepartments(depts);
      setPrograms(progs);
      setSubjects(subs);
      setExams(exms);
      setSchedules(schs);

      if (exms.length > 0 && !modalExamId) setModalExamId(exms[0].id);
      if (progs.length > 0 && !modalProgramId) setModalProgramId(progs[0].id);
      if (subs.length > 0 && !modalSubjectId) setModalSubjectId(subs[0].id);
    } catch (err) {
      console.error('Failed to load examination timetable data:', err);
      showToast('Could not load schedules from server', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cascading filters for main view
  const availablePrograms = selectedDeptId === 'ALL'
    ? programs
    : programs.filter(p => p.departmentId === selectedDeptId || p.department_id === selectedDeptId);

  // Cascading subjects for the Add Modal
  const modalAvailableSubjects = modalProgramId
    ? subjects.filter(s => s.programId === modalProgramId || s.program_id === modalProgramId)
    : subjects;

  const displayModalSubjects = modalAvailableSubjects.length > 0 ? modalAvailableSubjects : subjects;

  useEffect(() => {
    if (displayModalSubjects.length > 0 && !displayModalSubjects.some(s => s.id === modalSubjectId)) {
      setModalSubjectId(displayModalSubjects[0].id);
    }
  }, [modalProgramId, displayModalSubjects, modalSubjectId]);

  const handleOpenModal = () => {
    const activeExam = (selectedExamId !== 'ALL' && exams.some(e => e.id === selectedExamId))
      ? selectedExamId
      : (exams[0]?.id || '');
    setModalExamId(activeExam);

    const targetProg = (selectedProgramId !== 'ALL' && programs.some(p => p.id === selectedProgramId))
      ? selectedProgramId
      : (programs[0]?.id || '');
    setModalProgramId(targetProg);

    const targetSubs = targetProg
      ? subjects.filter(s => s.programId === targetProg || s.program_id === targetProg)
      : subjects;
    const finalSubs = targetSubs.length > 0 ? targetSubs : subjects;
    setModalSubjectId(finalSubs[0]?.id || '');

    setIsModalOpen(true);
  };

  // Main list filtering
  const filteredSchedules = schedules.filter(sch => {
    // Subject Program check
    const subProgId = sch.subject?.programId || sch.subject?.program_id;
    if (selectedProgramId !== 'ALL' && subProgId && subProgId !== selectedProgramId) {
      return false;
    }
    // Department check
    if (selectedDeptId !== 'ALL') {
      const progObj = programs.find(p => p.id === subProgId);
      const deptId = progObj?.departmentId || progObj?.department_id;
      if (deptId && deptId !== selectedDeptId) return false;
    }
    // Semester check
    if (selectedSemester !== 'ALL') {
      const sem = String(sch.subject?.semester || sch.semester || '');
      if (sem !== selectedSemester) return false;
    }
    // Exam cycle check
    if (selectedExamId !== 'ALL') {
      if (sch.examId !== selectedExamId && sch.exam_id !== selectedExamId) return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const subName = (sch.subject?.name || '').toLowerCase();
      const subCode = (sch.subject?.code || '').toLowerCase();
      const hall = (sch.hallRoomNo || sch.venue || '').toLowerCase();
      const examName = (sch.exam?.title || sch.exam?.name || '').toLowerCase();
      return subName.includes(q) || subCode.includes(q) || hall.includes(q) || examName.includes(q);
    }
    return true;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedSchedules,
    totalItems
  } = useTablePagination(filteredSchedules, 10);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!modalExamId || !modalSubjectId || !modalDate) {
      showToast('Please select Exam Cycle, Subject, and Date.', 'danger');
      return;
    }

    const sub = subjects.find(s => s.id === modalSubjectId);
    const exm = exams.find(e => e.id === modalExamId);

    const confirmed = await confirm({
      title: 'Confirm Exam Schedule Slot',
      message: `Schedule "${sub?.name || 'Subject'}" on ${modalDate}?`,
      details: [
        `Examination Cycle: ${exm?.title || exm?.name || 'Cycle'}`,
        `Course Subject: ${sub?.code} - ${sub?.name}`,
        `Time Window: ${modalStartTime} to ${modalEndTime}`,
        `Examination Venue: ${modalVenue}`,
        `Marks Scheme: Max ${modalMaxMarks} | Pass ${modalPassMarks}`
      ],
      confirmText: 'Yes, Save Schedule Slot',
      variant: 'primary'
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await examinationsService.createSchedule({
        examId: modalExamId,
        subjectId: modalSubjectId,
        date: modalDate,
        startTime: modalStartTime,
        endTime: modalEndTime,
        hallRoomNo: modalVenue,
        venue: modalVenue,
        maxMarks: Number(modalMaxMarks),
        passingMarks: Number(modalPassMarks),
        passMarks: Number(modalPassMarks),
      });

      showToast('Exam schedule slot created successfully!');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create schedule:', err);
      showToast(err?.response?.data?.message || 'Failed to save timetable slot.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id, subName) => {
    const confirmed = await confirm({
      title: 'Confirm Delete Schedule Slot',
      message: `Are you sure you want to delete the schedule slot for "${subName}"?`,
      details: 'Warning: Removing this slot unallocates the examination hall room and erases attendance sheets for this session.',
      confirmText: 'Yes, Delete Slot',
      cancelText: 'Keep Slot',
      variant: 'danger',
      icon: 'fa-solid fa-trash-can'
    });
    if (!confirmed) return;

    try {
      await examinationsService.deleteSchedule(id);
      showToast('Schedule slot removed successfully.');
      await loadData();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      showToast('Cannot delete schedule if marks have already been recorded.', 'danger');
    }
  };

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

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
            <i className="fa-regular fa-calendar-days"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Exam Schedules &amp; Master Timetable
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Schedule course examinations across dates, timing slots &amp; examination halls &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/unilms/org/examinations"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none' }}
          >
            <i className="fa-solid fa-graduation-cap" style={{ color: '#16A34A' }}></i>
            <span>Exam Cycles</span>
          </Link>
          <Link
            to="/unilms/org/examinations/hall_tickets"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none' }}
          >
            <i className="fa-solid fa-ticket"></i>
            <span>Hall Tickets</span>
          </Link>
          <button
            onClick={handleOpenModal}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)' }}
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>Schedule Exam Slot</span>
          </button>
        </div>
      </div>

      {/* 4-Tier Cascading Academic Filter Bar */}
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
            Academic Timetable Filter Bar
          </span>
          <span style={{ fontSize: '11px', color: '#64748B', marginLeft: 'auto' }}>
            Showing <strong>{filteredSchedules.length}</strong> scheduled slots
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
              onChange={(e) => setSelectedProgramId(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
            >
              <option value="ALL">All Degree Programs</option>
              {availablePrograms.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          {/* Tier 3: Semester */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>SEMESTER</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
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
                <option key={e.id} value={e.id}>{e.title || e.name} ({e.type})</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>SEARCH SUBJECT / HALL</label>
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '12px' }}></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Course, code or hall..."
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Schedules Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)' }}>
        <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Exam Cycle</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Subject &amp; Code</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Date &amp; Session</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Examination Hall</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Marks Max / Pass</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={5} />
              ) : paginatedSchedules.length > 0 ? (
                paginatedSchedules.map((sch) => {
                  const examTitle = sch.exam?.title || sch.exam?.name || 'Institutional Exam';
                  const examType = sch.exam?.type || 'REGULAR';
                  const subName = sch.subject?.name || 'Subject';
                  const subCode = sch.subject?.code || '—';
                  const venue = sch.hallRoomNo || sch.venue || 'Exam Hall A-101';
                  const pass = sch.passingMarks || sch.passMarks || 40;
                  const max = sch.maxMarks || 100;

                  return (
                    <tr key={sch.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                          {examTitle}
                        </div>
                        <span
                          className="badge"
                          style={{
                            display: 'inline-block',
                            marginTop: '4px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '700',
                            background: examType === 'REGULAR' ? '#DCFCE7' : '#FEE2E2',
                            color: examType === 'REGULAR' ? '#16A34A' : '#DC2626'
                          }}
                        >
                          {examType}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#4338CA', fontSize: '13px' }}>
                          {subName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          Code: <strong>{subCode}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                        <div style={{ fontWeight: '600', color: '#0F172A' }}>
                          <i className="fa-regular fa-calendar" style={{ marginRight: '6px', color: '#16A34A' }}></i>
                          {sch.date ? new Date(sch.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          <i className="fa-regular fa-clock" style={{ marginRight: '6px' }}></i>
                          {sch.startTime || '10:00'} &ndash; {sch.endTime || '13:00'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#334155' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px' }}>
                          <i className="fa-solid fa-location-dot" style={{ color: '#64748B', fontSize: '11px' }}></i>
                          <span style={{ fontWeight: '600' }}>{venue}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                        <span style={{ fontWeight: '700', color: '#0F172A' }}>{max}</span>
                        <span style={{ color: '#94A3B8', margin: '0 4px' }}>/</span>
                        <span style={{ color: '#16A34A', fontWeight: '600' }}>Pass: {pass}</span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Link
                            to={`/unilms/org/examinations/marks_entry?scheduleId=${sch.id}`}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', textDecoration: 'none', background: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE', fontWeight: '700' }}
                          >
                            <i className="fa-solid fa-pen"></i> Enter Marks
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(sch.id, subName)}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', color: '#DC2626', borderColor: '#FECACA' }}
                          >
                            <i className="fa-regular fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '32px', color: '#CBD5E1', display: 'block', marginBottom: '8px' }}></i>
                    No exam schedule slots found for the selected criteria.
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
            itemName="timetable slots"
          />
        </div>
      </div>

      {/* Add Schedule Slot Modal Drawer */}
      {isModalOpen && (
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
            maxWidth: '560px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  <i className="fa-solid fa-calendar-plus"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>Schedule Examination Slot</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>Bind course subject to exam cycle, date and venue</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94A3B8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSlot} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Target Examination Cycle *</label>
                <select
                  value={modalExamId}
                  onChange={(e) => setModalExamId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#fff' }}
                >
                  <option value="">-- Select Examination Cycle --</option>
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.title || e.name} ({e.type})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Filter Program</label>
                  <select
                    value={modalProgramId}
                    onChange={(e) => {
                      const newProg = e.target.value;
                      setModalProgramId(newProg);
                      const matching = subjects.filter(s => s.programId === newProg || s.program_id === newProg);
                      if (matching.length > 0) setModalSubjectId(matching[0].id);
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="">-- All / Select Program --</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Subject Course *</label>
                  <select
                    value={modalSubjectId}
                    onChange={(e) => setModalSubjectId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="">-- Select Subject Course --</option>
                    {displayModalSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Exam Date *</label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Start Time</label>
                  <input
                    type="time"
                    required
                    value={modalStartTime}
                    onChange={(e) => setModalStartTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>End Time</label>
                  <input
                    type="time"
                    required
                    value={modalEndTime}
                    onChange={(e) => setModalEndTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Examination Hall / Venue *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Examination Hall A-101, Computer Lab 3"
                  value={modalVenue}
                  onChange={(e) => setModalVenue(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Max Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={modalMaxMarks}
                    onChange={(e) => setModalMaxMarks(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Passing Marks Threshold</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={modalPassMarks}
                    onChange={(e) => setModalPassMarks(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '9px 16px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '9px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', border: 'none', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Creating Slot...' : 'Save Timetable Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgExaminationsSchedules;
