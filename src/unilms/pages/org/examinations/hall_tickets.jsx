import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import examinationsService from '../../../services/examinations.service';
import studentsService from '../../../services/students.service';
import academicsService from '../../../services/academics.service';
import financeService from '../../../services/finance.service';

const OrgExaminationsHallTickets = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [sections, setSections] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState('ALL');
  const [selectedCohortId, setSelectedCohortId] = useState('ALL');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Hall Ticket Modal State
  const [activeHallTicket, setActiveHallTicket] = useState(null);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [examList, studentList, deptList, progList, cohortList, secList, invList] = await Promise.all([
        examinationsService.getExams(),
        studentsService.getStudents(),
        academicsService.getDepartments(),
        academicsService.getPrograms(),
        academicsService.getCohorts(),
        academicsService.getSections(),
        financeService.getInvoices(),
      ]);

      const exms = Array.isArray(examList) ? examList : (examList?.data || []);
      const stus = Array.isArray(studentList) ? studentList : (studentList?.data || []);
      const depts = Array.isArray(deptList) ? deptList : (deptList?.data || []);
      const progs = Array.isArray(progList) ? progList : (progList?.data || []);
      const cohs = Array.isArray(cohortList) ? cohortList : (cohortList?.data || []);
      const secs = Array.isArray(secList) ? secList : (secList?.data || []);
      const invs = Array.isArray(invList) ? invList : (invList?.data || []);

      setExams(exms);
      setStudents(stus);
      setDepartments(depts);
      setPrograms(progs);
      setCohorts(cohs);
      setSections(secs);
      setInvoices(invs);

      if (exms.length > 0 && !selectedExamId) {
        setSelectedExamId(exms[0].id);
      }
    } catch (e) {
      console.error('Failed to load hall tickets data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Programs based on Department
  const filteredPrograms = programs.filter(p => {
    if (selectedDeptId === 'ALL') return true;
    return p.departmentId === selectedDeptId || p.department?.id === selectedDeptId;
  });

  // Filtered Cohorts based on Program
  const filteredCohorts = cohorts.filter(c => {
    if (selectedProgramId === 'ALL') return true;
    return c.programId === selectedProgramId;
  });

  // Filtered Sections based on Cohort
  const filteredSections = sections.filter(s => {
    if (selectedCohortId === 'ALL') return true;
    return s.cohortId === selectedCohortId;
  });

  // Candidate filtering
  const filteredStudents = students.filter(st => {
    const prog = programs.find(p => p.id === st.programId);
    if (selectedDeptId !== 'ALL' && prog?.departmentId !== selectedDeptId) return false;
    if (selectedProgramId !== 'ALL' && st.programId !== selectedProgramId) return false;
    if (selectedCohortId !== 'ALL' && st.cohortId !== selectedCohortId) return false;
    if (selectedSectionId !== 'ALL' && st.sectionId !== selectedSectionId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = `${st.firstName} ${st.lastName || ''}`.toLowerCase();
      const roll = (st.rollNumber || '').toLowerCase();
      if (!name.includes(q) && !roll.includes(q)) return false;
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
  } = useTablePagination(filteredStudents, 10);

  // Helper to get Module 03 fee status for a student
  const getStudentFeeStatus = (studentId) => {
    const studentInvs = invoices.filter(i => i.studentId === studentId);
    if (studentInvs.length === 0) return { isCleared: true, balanceDue: 0, statusText: 'CLEARED' };
    const balance = studentInvs.reduce((sum, i) => sum + Number(i.balanceAmount || 0), 0);
    return {
      isCleared: balance <= 0,
      balanceDue: balance,
      statusText: balance <= 0 ? 'CLEARED' : `Dues: ₹${balance.toLocaleString()}`
    };
  };

  const handleGenerateAndPreview = async (student) => {
    if (!selectedExamId) {
      alert('Please select an examination cycle first.');
      return;
    }

    const fee = getStudentFeeStatus(student.id);
    const activeExam = exams.find(e => e.id === selectedExamId);

    if (!fee.isCleared) {
      const confirmed = await confirm({
        title: 'Conditional Admit Card Clearance',
        message: `Student "${student.firstName} ${student.lastName || ''}" has pending fee dues of ₹${fee.balanceDue?.toLocaleString()}. Proceed to generate conditional admit card?`,
        details: 'The digital hall ticket will be watermarked with conditional financial clearance.',
        confirmText: 'Generate Conditional Pass',
        cancelText: 'Cancel',
        variant: 'warning',
        icon: 'fa-solid fa-triangle-exclamation'
      });
      if (!confirmed) return;
    } else {
      const confirmed = await confirm({
        title: 'Confirm Generate Hall Ticket',
        message: `Generate official exam admit card for "${student.firstName} ${student.lastName || ''}" (${student.rollNumber})?`,
        details: [
          `Exam Cycle: ${activeExam?.title || activeExam?.name || 'Selected Examination'}`,
          `Module 03 Fee Gate: DUES FULLY CLEARED`,
          `Digital Signatures: QR Code verification payload embedded`
        ],
        confirmText: 'Generate Admit Card',
        variant: 'success'
      });
      if (!confirmed) return;
    }

    setGenerating(true);
    try {
      const res = await examinationsService.getHallTicket(student.id, selectedExamId);
      const ht = res?.data || res;
      if (ht) {
        setActiveHallTicket(ht);
      } else {
        alert('Could not generate hall ticket. Verify student exam registration.');
      }
    } catch (e) {
      alert('Failed to generate hall ticket: ' + (e.response?.data?.message || e.message));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      <section className="view-section active">
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
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
              }}
            >
              <i className="fa-solid fa-id-card-clip"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Hall Tickets &amp; Admit Cards Desk
                </h2>
                <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                  FEE GATE ENABLED
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Generate official QR-verifiable exam admit cards with Module 03 fee clearance gate
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to="/unilms/org/examinations/schedules"
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '9px 16px', borderRadius: '8px', textDecoration: 'none' }}
            >
              <i className="fa-solid fa-calendar-days" style={{ color: '#2563EB' }}></i>
              <span>Exam Schedules</span>
            </Link>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            {/* Exam Cycle Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#2563EB', marginBottom: '4px', textTransform: 'uppercase' }}>
                <i className="fa-solid fa-clipboard-check me-1"></i> Examination Cycle
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '8px', fontWeight: '700' }}
              >
                <option value="">-- Choose Examination Cycle --</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>{e.title || e.name} ({e.examType}) &bull; {e.academicYear}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Department
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => { setSelectedDeptId(e.target.value); setSelectedProgramId('ALL'); setSelectedCohortId('ALL'); setSelectedSectionId('ALL'); }}
                className="form-control"
                style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '8px' }}
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            {/* Degree Program */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Degree Program
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => { setSelectedProgramId(e.target.value); setSelectedCohortId('ALL'); setSelectedSectionId('ALL'); }}
                className="form-control"
                style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '8px' }}
              >
                <option value="ALL">All Programs</option>
                {filteredPrograms.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} &bull; {p.name}</option>
                ))}
              </select>
            </div>

            {/* Batch / Cohort */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Admitted Batch
              </label>
              <select
                value={selectedCohortId}
                onChange={(e) => { setSelectedCohortId(e.target.value); setSelectedSectionId('ALL'); }}
                className="form-control"
                style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '8px' }}
              >
                <option value="ALL">All Batches</option>
                {filteredCohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Class Section */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Class Section
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '8px' }}
              >
                <option value="ALL">All Sections</option>
                {filteredSections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ position: 'relative', marginTop: '10px' }}>
            <i className="fa-solid fa-search" style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)', fontSize: '12px' }}></i>
            <input
              type="text"
              placeholder="Search candidate by name or roll number (e.g. Aditya, 2026-UG-53)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ width: '100%', paddingLeft: '32px', fontSize: '12.5px', borderRadius: '8px' }}
            />
          </div>
        </div>

        {/* Candidate List Table */}
        <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>
              Enrolled Exam Candidates ({filteredStudents.length})
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {paginatedItems.length} of {filteredStudents.length} candidates
            </span>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--border-color)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Roll Number</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Candidate Name</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Program &amp; Cohort</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Fee Gate (Mod 03)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Exam Eligibility</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Admit Card Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No candidates found matching active filters.
                    </td>
                  </tr>
                )}
                {paginatedItems.map((st) => {
                  const fee = getStudentFeeStatus(st.id);
                  return (
                    <tr key={st.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: '#2563EB' }}>
                        {st.rollNumber || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {st.firstName} {st.lastName || ''}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '600' }}>{st.program?.code || 'DEGREE'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{st.cohort?.name || 'Class of 2026'}</div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {fee.isCleared ? (
                          <span className="badge" style={{ background: '#D1FAE5', color: '#059669', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' }}>
                            ✓ DUES CLEARED
                          </span>
                        ) : (
                          <span className="badge" style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' }}>
                            ⚠ {fee.statusText}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span className="badge" style={{ background: fee.isCleared ? '#EFF6FF' : '#FEF3C7', color: fee.isCleared ? '#2563EB' : '#D97706', fontSize: '11px', fontWeight: '700' }}>
                          {fee.isCleared ? 'ELIGIBLE' : 'CONDITIONAL'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleGenerateAndPreview(st)}
                          disabled={generating}
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700', borderRadius: '6px', background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-eye me-1"></i> View Admit Card
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

        {/* Admit Card Modal */}
        {activeHallTicket && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '640px', width: '100%', padding: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '92vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E2E8F0', paddingBottom: '16px', marginBottom: '18px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#2563EB', letterSpacing: '1px', textTransform: 'uppercase' }}>OFFICIAL ADMIT CARD</span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: '900', color: '#111827' }}>
                    {activeHallTicket.exam?.title || activeHallTicket.exam?.name || 'End Semester Examination'}
                  </h3>
                  <small style={{ color: '#64748B' }}>UniLMS Digital Central Examination Board &bull; Office of Controller</small>
                </div>
                <button onClick={() => setActiveHallTicket(null)} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748B' }}>&times;</button>
              </div>

              {/* Fee Clearance Notice Banner */}
              {activeHallTicket.feeClearance && (
                <div style={{ background: activeHallTicket.feeClearance.isCleared ? '#D1FAE5' : '#FEE2E2', border: `1px solid ${activeHallTicket.feeClearance.isCleared ? '#10B981' : '#EF4444'}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', fontWeight: '700', color: activeHallTicket.feeClearance.isCleared ? '#065F46' : '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className={`fa-solid ${activeHallTicket.feeClearance.isCleared ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
                  {activeHallTicket.feeClearance.withholdingNotice}
                </div>
              )}

              {/* Candidate Info Grid */}
              <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>CANDIDATE NAME</div>
                  <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#111827' }}>
                    {activeHallTicket.student?.name || activeHallTicket.student?.firstName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>ROLL / ENROLLMENT NO</div>
                  <div style={{ fontSize: '14.5px', fontWeight: '900', color: '#2563EB' }}>
                    {activeHallTicket.student?.rollNumber}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>ADMIT CARD ID</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                    {activeHallTicket.ticketNumber || `HT-2026-${activeHallTicket.student?.rollNumber}`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>SECURITY QR TOKEN</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#059669', fontFamily: 'monospace' }}>
                    {activeHallTicket.qrToken || 'QR-VERIFIED-AUTH'}
                  </div>
                </div>
              </div>

              {/* Scheduled Papers */}
              <h4 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', marginBottom: '10px' }}>
                Scheduled Examination Papers
              </h4>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', marginBottom: '22px' }}>
                <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Date</th>
                      <th style={{ padding: '8px 12px' }}>Subject</th>
                      <th style={{ padding: '8px 12px' }}>Timing</th>
                      <th style={{ padding: '8px 12px' }}>Venue / Hall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeHallTicket.schedules || []).map((sch, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '600' }}>{new Date(sch.date).toLocaleDateString()}</td>
                        <td style={{ padding: '8px 12px', fontWeight: '700' }}>{sch.subject?.name} ({sch.subject?.code})</td>
                        <td style={{ padding: '8px 12px' }}>{sch.startTime} - {sch.endTime}</td>
                        <td style={{ padding: '8px 12px', color: '#2563EB', fontWeight: '700' }}>{sch.hallRoomNo || sch.venue || 'Hall A-101'}</td>
                      </tr>
                    ))}
                    {(!activeHallTicket.schedules || activeHallTicket.schedules.length === 0) && (
                      <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#64748B' }}>No exam papers scheduled for this cycle yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => window.print()} className="btn btn-outline" style={{ padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                  <i className="fa-solid fa-print me-1"></i> Print Admit Card
                </button>
                <button onClick={() => setActiveHallTicket(null)} className="btn btn-primary" style={{ padding: '8px 18px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgExaminationsHallTickets;
