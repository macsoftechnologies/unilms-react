import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TableSkeletonLoader, useConfirmDialog } from '../../../components';
import examinationsService from '../../../services/examinations.service';
import academicsService from '../../../services/academics.service';
import studentsService from '../../../services/students.service';
import apiClient from '../../../services/api';

const DEFAULT_PRESETS = {
  UGC_10: {
    key: 'UGC_10',
    name: 'UGC 10-Point Standard Scale',
    passMarksPct: 40,
    bands: [
      { grade: 'O', minPct: 90, desc: 'Outstanding', badgeColor: '#16A34A', bg: '#DCFCE7' },
      { grade: 'A+', minPct: 80, desc: 'Excellent', badgeColor: '#16A34A', bg: '#DCFCE7' },
      { grade: 'A', minPct: 70, desc: 'Very Good', badgeColor: '#2563EB', bg: '#DBEAFE' },
      { grade: 'B+', minPct: 60, desc: 'Good', badgeColor: '#4F46E5', bg: '#EEF2FF' },
      { grade: 'B', minPct: 50, desc: 'Above Average', badgeColor: '#0D9488', bg: '#CCFBF1' },
      { grade: 'C', minPct: 40, desc: 'Pass', badgeColor: '#D97706', bg: '#FEF3C7' },
      { grade: 'F', minPct: 0, desc: 'Fail / Arrear', badgeColor: '#DC2626', bg: '#FEE2E2' },
    ]
  },
  AUTONOMOUS_7: {
    key: 'AUTONOMOUS_7',
    name: 'Autonomous University 7-Grade Scale (35% Pass)',
    passMarksPct: 35,
    bands: [
      { grade: 'A+', minPct: 85, desc: 'Distinction', badgeColor: '#16A34A', bg: '#DCFCE7' },
      { grade: 'A', minPct: 75, desc: 'First Class Exemplary', badgeColor: '#2563EB', bg: '#DBEAFE' },
      { grade: 'B+', minPct: 65, desc: 'First Class', badgeColor: '#4F46E5', bg: '#EEF2FF' },
      { grade: 'B', minPct: 55, desc: 'Second Class', badgeColor: '#0D9488', bg: '#CCFBF1' },
      { grade: 'C', minPct: 45, desc: 'Third Class', badgeColor: '#D97706', bg: '#FEF3C7' },
      { grade: 'D', minPct: 35, desc: 'Pass Satisfactory', badgeColor: '#CA8A04', bg: '#FEF08A' },
      { grade: 'F', minPct: 0, desc: 'Fail / Backlog', badgeColor: '#DC2626', bg: '#FEE2E2' },
    ]
  },
  POSTGRADUATE_4: {
    key: 'POSTGRADUATE_4',
    name: 'Postgraduate / MBA 4.0 Scale (50% Pass)',
    passMarksPct: 50,
    bands: [
      { grade: 'A', minPct: 85, desc: 'High Honors (4.0)', badgeColor: '#16A34A', bg: '#DCFCE7' },
      { grade: 'B+', minPct: 75, desc: 'Honors (3.5)', badgeColor: '#2563EB', bg: '#DBEAFE' },
      { grade: 'B', minPct: 65, desc: 'Good Standing (3.0)', badgeColor: '#4F46E5', bg: '#EEF2FF' },
      { grade: 'C', minPct: 50, desc: 'Marginal Pass (2.0)', badgeColor: '#D97706', bg: '#FEF3C7' },
      { grade: 'F', minPct: 0, desc: 'Fail / Repeat (0.0)', badgeColor: '#DC2626', bg: '#FEE2E2' },
    ]
  }
};

const OrgExaminationsMarksEntry = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [searchParams] = useSearchParams();
  const initialScheduleParam = searchParams.get('scheduleId') || '';

  // Master Data
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [sections, setSections] = useState([]);
  const [exams, setExams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // 4-Tier Cascading Filter State
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState('ALL');
  const [selectedCohortId, setSelectedCohortId] = useState('ALL');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [selectedScheduleId, setSelectedScheduleId] = useState(initialScheduleParam);
  const [searchStudent, setSearchStudent] = useState('');

  // Editable Ledger State: array of student marks rows
  const [ledgerRows, setLedgerRows] = useState([]);

  // Customizable Grading Scale State
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [activeScaleKey, setActiveScaleKey] = useState('UGC_10');
  const [customScale, setCustomScale] = useState(DEFAULT_PRESETS.UGC_10);

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, cohortRes, secRes, examRes, schRes, stuRes] = await Promise.all([
        academicsService.getDepartments(),
        academicsService.getPrograms(),
        academicsService.getCohorts(),
        academicsService.getSections(),
        examinationsService.getExams(),
        examinationsService.getSchedules(),
        studentsService.getStudents(),
      ]);

      const depts = Array.isArray(deptRes) ? deptRes : (deptRes?.data || []);
      const progs = Array.isArray(progRes) ? progRes : (progRes?.data || []);
      const cohs = Array.isArray(cohortRes) ? cohortRes : (cohortRes?.data || []);
      const secs = Array.isArray(secRes) ? secRes : (secRes?.data || []);
      const exms = Array.isArray(examRes) ? examRes : (examRes?.data || []);
      const schs = Array.isArray(schRes) ? schRes : (schRes?.data || []);
      const stus = Array.isArray(stuRes) ? stuRes : (stuRes?.data || []);

      setDepartments(depts);
      setPrograms(progs);
      setCohorts(cohs);
      setSections(secs);
      setExams(exms);
      setSchedules(schs);
      setAllStudents(stus);

      if (initialScheduleParam && schs.some(s => s.id === initialScheduleParam)) {
        setSelectedScheduleId(initialScheduleParam);
      } else if (schs.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(schs[0].id);
      }
    } catch (err) {
      console.error('Failed to load marks entry master data:', err);
      showToast('Error loading master data from server', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Filter cascades
  const availablePrograms = selectedDeptId === 'ALL'
    ? programs
    : programs.filter(p => p.departmentId === selectedDeptId || p.department_id === selectedDeptId);

  const availableCohorts = selectedProgramId === 'ALL'
    ? cohorts
    : cohorts.filter(c => c.programId === selectedProgramId || c.program_id === selectedProgramId);

  const availableSections = selectedCohortId === 'ALL'
    ? sections
    : sections.filter(s => s.cohortId === selectedCohortId || s.cohort_id === selectedCohortId);

  const availableSchedules = schedules.filter(sch => {
    const subProgId = sch.subject?.programId || sch.subject?.program_id;
    if (selectedProgramId !== 'ALL' && subProgId && subProgId !== selectedProgramId) return false;
    return true;
  });

  const activeSchedule = schedules.find(s => s.id === selectedScheduleId) || schedules[0];
  const maxMarks = activeSchedule?.maxMarks || 100;
  const passMarksThreshold = activeSchedule?.passingMarks || activeSchedule?.passMarks || 40;

  // Load custom grading scale for schedule if saved in PostgreSQL
  useEffect(() => {
    if (!selectedScheduleId) return;
    const loadScale = async () => {
      try {
        const res = await apiClient.get(`/tenants/settings/unilms_grading_scale_${selectedScheduleId}`);
        if (res?.data?.value) {
          setCustomScale(res.data.value);
          setActiveScaleKey(res.data.value.key || 'CUSTOM');
          return;
        }
      } catch (e) {
        // Fall back to default preset
      }

      // Default heuristics based on program code
      const isPG = activeSchedule?.subject?.program?.code?.includes('MBA') || activeSchedule?.subject?.program?.code?.includes('PG');
      if (isPG) {
        setCustomScale(DEFAULT_PRESETS.POSTGRADUATE_4);
        setActiveScaleKey('POSTGRADUATE_4');
      } else {
        setCustomScale(DEFAULT_PRESETS.UGC_10);
        setActiveScaleKey('UGC_10');
      }
    };
    loadScale();
  }, [selectedScheduleId, activeSchedule]);

  // Dynamic Grade calculation using the active custom scale
  const evaluateGrade = (marks, isAbsent, maxM, scale) => {
    if (isAbsent) {
      return { grade: 'AB', status: 'ABSENT', badgeColor: '#64748B', bg: '#F1F5F9' };
    }
    if (marks === '' || marks === null || marks === undefined) {
      return { grade: '—', status: 'PENDING', badgeColor: '#D97706', bg: '#FEF3C7' };
    }
    const num = Number(marks);
    if (isNaN(num) || num < 0) {
      return { grade: '—', status: 'INVALID', badgeColor: '#EF4444', bg: '#FEE2E2' };
    }

    const pct = (num / maxM) * 100;
    const passPct = scale.passMarksPct || 40;

    // Check Fail status
    if (pct < passPct) {
      const failBand = scale.bands.find(b => b.minPct === 0) || { grade: 'F', badgeColor: '#DC2626', bg: '#FEE2E2' };
      return { grade: failBand.grade, status: 'FAILED', badgeColor: failBand.badgeColor, bg: failBand.bg };
    }

    // Sort bands descending
    const sortedBands = [...scale.bands].sort((a, b) => b.minPct - a.minPct);
    for (const b of sortedBands) {
      if (pct >= b.minPct) {
        return { grade: b.grade, status: 'PASSED', badgeColor: b.badgeColor, bg: b.bg };
      }
    }

    return { grade: 'C', status: 'PASSED', badgeColor: '#D97706', bg: '#FEF3C7' };
  };

  // Re-evaluate ledger rows when scale changes
  const applyScaleToRows = (newScale) => {
    setLedgerRows(prev => prev.map(r => {
      const evalResult = evaluateGrade(r.marksObtained, r.isAbsent, maxMarks, newScale);
      return {
        ...r,
        grade: evalResult.grade,
        status: evalResult.status,
        badgeColor: evalResult.badgeColor,
        bg: evalResult.bg,
      };
    }));
  };

  // Whenever selectedScheduleId or students change, fetch existing marks and bind rows
  useEffect(() => {
    if (!selectedScheduleId) return;

    const fetchMarks = async () => {
      setLoading(true);
      try {
        const existingMarks = await examinationsService.getMarks(selectedScheduleId);
        const marksMap = {};
        (Array.isArray(existingMarks) ? existingMarks : []).forEach(m => {
          marksMap[m.studentId] = m;
        });

        // Filter eligible students
        let eligible = allStudents;
        if (selectedProgramId !== 'ALL') {
          eligible = eligible.filter(s => s.programId === selectedProgramId || s.program_id === selectedProgramId);
        }
        if (selectedCohortId !== 'ALL') {
          eligible = eligible.filter(s => s.cohortId === selectedCohortId || s.cohort_id === selectedCohortId);
        }
        if (selectedSectionId !== 'ALL') {
          eligible = eligible.filter(s => s.sectionId === selectedSectionId || s.section_id === selectedSectionId);
        }

        if (eligible.length === 0 && allStudents.length > 0) {
          eligible = allStudents;
        }

        const rows = eligible.map(st => {
          const rec = marksMap[st.id];
          const isAbsent = rec ? rec.isAbsent : false;
          const marks = rec ? (rec.marksObtained !== null ? rec.marksObtained : '') : '';
          const remarks = rec ? (rec.remarks || '') : '';
          const grading = evaluateGrade(marks, isAbsent, maxMarks, customScale);

          return {
            studentId: st.id,
            rollNumber: st.rollNumber || st.enrollmentNumber || '—',
            name: `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Enrolled Student',
            programName: st.program?.name || 'Academic Program',
            batch: st.cohort?.name || '2026-2030',
            marksObtained: marks,
            isAbsent: isAbsent,
            grade: rec?.grade || grading.grade,
            status: grading.status,
            badgeColor: grading.badgeColor,
            bg: grading.bg,
            remarks: remarks,
          };
        });

        setLedgerRows(rows);
      } catch (err) {
        console.error('Error fetching marks for schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarks();
  }, [selectedScheduleId, allStudents, selectedProgramId, selectedCohortId, selectedSectionId]);

  // Handle Marks Input Change
  const handleMarksChange = (studentId, value) => {
    setLedgerRows(prev => prev.map(r => {
      if (r.studentId === studentId) {
        const isAbsent = r.isAbsent;
        const grading = evaluateGrade(value, isAbsent, maxMarks, customScale);
        return {
          ...r,
          marksObtained: value,
          grade: grading.grade,
          status: grading.status,
          badgeColor: grading.badgeColor,
          bg: grading.bg,
        };
      }
      return r;
    }));
  };

  // Handle Absent Toggle
  const handleAbsentToggle = (studentId) => {
    setLedgerRows(prev => prev.map(r => {
      if (r.studentId === studentId) {
        const nextAbsent = !r.isAbsent;
        const grading = evaluateGrade(nextAbsent ? '' : r.marksObtained, nextAbsent, maxMarks, customScale);
        return {
          ...r,
          isAbsent: nextAbsent,
          marksObtained: nextAbsent ? '' : r.marksObtained,
          grade: grading.grade,
          status: grading.status,
          badgeColor: grading.badgeColor,
          bg: grading.bg,
        };
      }
      return r;
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setLedgerRows(prev => prev.map(r => r.studentId === studentId ? { ...r, remarks } : r));
  };

  // Scale Modal Handlers
  const handleSelectPreset = (key) => {
    const preset = DEFAULT_PRESETS[key];
    if (preset) {
      setActiveScaleKey(key);
      setCustomScale({ ...preset });
    }
  };

  const handleBandChange = (index, field, value) => {
    const updatedBands = [...customScale.bands];
    updatedBands[index] = { ...updatedBands[index], [field]: field === 'minPct' ? Number(value) : value };
    setCustomScale({
      ...customScale,
      key: 'CUSTOM',
      name: 'Custom Tailored Evaluation Scale',
      bands: updatedBands,
    });
    setActiveScaleKey('CUSTOM');
  };

  const handleAddBand = () => {
    const newBand = { grade: 'A1', minPct: 85, desc: 'Merit Band', badgeColor: '#2563EB', bg: '#DBEAFE' };
    setCustomScale({
      ...customScale,
      key: 'CUSTOM',
      name: 'Custom Tailored Evaluation Scale',
      bands: [...customScale.bands, newBand],
    });
    setActiveScaleKey('CUSTOM');
  };

  const handleRemoveBand = (index) => {
    if (customScale.bands.length <= 2) {
      alert('A minimum of 2 grade bands (Pass/Fail) is required.');
      return;
    }
    const updated = customScale.bands.filter((_, i) => i !== index);
    setCustomScale({ ...customScale, key: 'CUSTOM', bands: updated });
    setActiveScaleKey('CUSTOM');
  };

  const handleApplyScale = async () => {
    const confirmed = await confirm({
      title: 'Confirm Apply Grading Scale',
      message: `Recalculate and apply "${customScale.name}" to all student marks?`,
      details: [
        `Active Standard: ${customScale.name}`,
        `Bands: ${customScale.bands.map(b => `${b.grade} (≥${b.minPct}%)`).join(' • ')}`
      ],
      confirmText: 'Yes, Apply Scale',
      variant: 'warning',
      icon: 'fa-solid fa-sliders'
    });
    if (!confirmed) return;

    if (selectedScheduleId) {
      apiClient.post(`/tenants/settings/unilms_grading_scale_${selectedScheduleId}`, { value: customScale }).catch(() => {});
    }
    applyScaleToRows(customScale);
    showToast(`Applied ${customScale.name} to active grade ledger!`);
    setIsScaleModalOpen(false);
  };

  // Batch Save Marks
  const handleSaveLedger = async () => {
    if (!selectedScheduleId) {
      showToast('Please select an active examination schedule.', 'danger');
      return;
    }

    const activeSchedule = schedules.find(s => s.id === selectedScheduleId);
    const evaluatedCount = ledgerRows.filter(r => r.marksObtained !== '' || r.isAbsent).length;

    const confirmed = await confirm({
      title: 'Confirm Save Grade Ledger',
      message: `Finalize and submit marks for "${activeSchedule?.subject?.name || 'this examination'}"?`,
      details: [
        `Examination: ${activeSchedule?.subject?.name || 'Subject'} (${activeSchedule?.exam?.title || 'Cycle'})`,
        `Students Evaluated: ${evaluatedCount} / ${ledgerRows.length}`,
        `Applied Standard: ${customScale.name}`
      ],
      confirmText: 'Yes, Submit Grade Ledger',
      variant: 'success',
      icon: 'fa-solid fa-check-double'
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      const payload = ledgerRows.map(r => ({
        studentId: r.studentId,
        marksObtained: r.isAbsent ? null : (r.marksObtained === '' ? null : Number(r.marksObtained)),
        maxMarks: maxMarks,
        isAbsent: Boolean(r.isAbsent),
        grade: r.grade !== '—' ? r.grade : undefined,
        remarks: r.remarks,
      }));

      await examinationsService.saveMarks(selectedScheduleId, payload);
      showToast(`Successfully saved grade ledger for ${payload.length} students!`);
    } catch (err) {
      console.error('Failed to save marks ledger:', err);
      showToast(err?.response?.data?.message || 'Failed to save marks ledger to server.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Filter rows by search
  const displayedRows = ledgerRows.filter(r => {
    if (!searchStudent.trim()) return true;
    const q = searchStudent.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.rollNumber.toLowerCase().includes(q);
  });

  // KPI stats
  const totalStudents = ledgerRows.length;
  const absentCount = ledgerRows.filter(r => r.isAbsent).length;
  const gradedCount = ledgerRows.filter(r => !r.isAbsent && r.marksObtained !== '').length;
  const passedCount = ledgerRows.filter(r => r.status === 'PASSED').length;
  const passRate = gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0;

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
            <i className="fa-solid fa-pen-fancy"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Marks Entry &amp; Grade Ledger Desk
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Record evaluated marks with customizable department grading scales &amp; UGC standards
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Customizable Grading Scale Trigger */}
          <button
            type="button"
            onClick={() => setIsScaleModalOpen(true)}
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '700',
              fontSize: '13px',
              padding: '10px 16px',
              borderRadius: '10px',
              background: '#F8FAFC',
              borderColor: '#CBD5E1',
              color: '#334155'
            }}
          >
            <i className="fa-solid fa-sliders" style={{ color: '#7C3AED' }}></i>
            <span>Grading Scale &amp; Cut-offs</span>
          </button>

          <Link
            to="/unilms/org/examinations/schedules"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none' }}
          >
            <i className="fa-regular fa-calendar-days"></i>
            <span>Schedules</span>
          </Link>
          <button
            onClick={handleSaveLedger}
            disabled={saving || ledgerRows.length === 0}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '700',
              fontSize: '13px',
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#fff',
              border: 'none',
              cursor: saving || ledgerRows.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)'
            }}
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>{saving ? 'Saving...' : 'Commit Marks Ledger'}</span>
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
            Academic Cohort &amp; Exam Schedule Selector
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
                setSelectedSectionId('ALL');
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
                setSelectedSectionId('ALL');
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
              onChange={(e) => {
                setSelectedCohortId(e.target.value);
                setSelectedSectionId('ALL');
              }}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
            >
              <option value="ALL">All Batches</option>
              {availableCohorts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tier 4: Section */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>CLASS SECTION</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
            >
              <option value="ALL">All Sections</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Target Exam Schedule Slot */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#16A34A', marginBottom: '4px' }}>
              EXAMINATION SCHEDULE SLOT *
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '2px solid #16A34A', fontSize: '12px', fontWeight: '700', background: '#F0FDF4' }}
            >
              {availableSchedules.map(sch => {
                const exTitle = sch.exam?.title || sch.exam?.name || 'Exam';
                const subName = sch.subject?.name || 'Subject';
                const subCode = sch.subject?.code || '';
                const date = sch.date ? new Date(sch.date).toLocaleDateString() : 'TBD';
                return (
                  <option key={sch.id} value={sch.id}>
                    {subName} ({subCode}) — {exTitle} &bull; {date} ({sch.maxMarks || 100} Marks)
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Active Scale & Schedule Banner + KPI Metrics */}
      {activeSchedule && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Active Course &amp; Scale</div>
              <button
                type="button"
                onClick={() => setIsScaleModalOpen(true)}
                style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
              >
                Change Scale
              </button>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#4338CA', marginTop: '2px' }}>
              {activeSchedule.subject?.name || 'Subject'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Scale: <strong style={{ color: '#0F172A' }}>{customScale.name}</strong></span>
              <span>&bull;</span>
              <span>Pass: <strong style={{ color: '#16A34A' }}>{customScale.passMarksPct}%</strong></span>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Max / Pass Marks</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>
              {maxMarks} <span style={{ fontSize: '12px', color: '#16A34A' }}>({Math.round((customScale.passMarksPct / 100) * maxMarks)} Pass)</span>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Enrolled Students</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{totalStudents}</div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase' }}>Pass Count</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#16A34A', marginTop: '4px' }}>{passedCount}</div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase' }}>Pass Rate %</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>{passRate}%</div>
          </div>
        </div>
      )}

      {/* Grade Ledger Table Card */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)' }}>
        {/* Table Search & Tooling */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px' }}></i>
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="Filter by student name or roll number..."
              style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Absentees: <strong style={{ color: '#DC2626' }}>{absentCount}</strong> | Evaluated: <strong style={{ color: '#16A34A' }}>{gradedCount}</strong>
            </span>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Student &amp; Roll Number</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Program &amp; Cohort</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', width: '140px' }}>Marks ({maxMarks})</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Absent?</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Computed Grade</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Remarks / Comments</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={6} />
              ) : displayedRows.length > 0 ? (
                displayedRows.map(row => (
                  <tr key={row.studentId} style={{ borderBottom: '1px solid var(--border-color)', background: row.isAbsent ? '#FFF5F5' : '#fff' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                        {row.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                        {row.rollNumber}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#334155' }}>
                      <div>{row.programName}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{row.batch}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <input
                        type="number"
                        min="0"
                        max={maxMarks}
                        disabled={row.isAbsent}
                        value={row.marksObtained}
                        onChange={(e) => handleMarksChange(row.studentId, e.target.value)}
                        placeholder={`0 - ${maxMarks}`}
                        style={{
                          width: '100%',
                          height: '36px',
                          padding: '0 10px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--border-color)',
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#0F172A',
                          background: row.isAbsent ? '#F1F5F9' : '#fff'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={row.isAbsent}
                        onChange={() => handleAbsentToggle(row.studentId)}
                        style={{ width: '18px', height: '18px', accentColor: '#DC2626', cursor: 'pointer' }}
                        title="Mark student as absent"
                      />
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          minWidth: '32px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '800',
                          background: row.bg,
                          color: row.badgeColor
                        }}
                      >
                        {row.grade}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        className="badge"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: row.status === 'PASSED' ? '#DCFCE7' : row.status === 'FAILED' ? '#FEE2E2' : '#F1F5F9',
                          color: row.status === 'PASSED' ? '#16A34A' : row.status === 'FAILED' ? '#DC2626' : '#64748B'
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={(e) => handleRemarksChange(row.studentId, e.target.value)}
                        placeholder="Optional remarks..."
                        style={{
                          width: '100%',
                          height: '34px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          fontSize: '12px'
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No students match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Action Bar */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Evaluated using <strong style={{ color: '#0F172A' }}>{customScale.name}</strong>. Pass threshold: <strong>{customScale.passMarksPct}%</strong>.
          </div>
          <button
            onClick={handleSaveLedger}
            disabled={saving || ledgerRows.length === 0}
            className="btn btn-primary"
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: '700',
              fontSize: '13px',
              cursor: saving || ledgerRows.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)'
            }}
          >
            <i className="fa-solid fa-floppy-disk" style={{ marginRight: '8px' }}></i>
            {saving ? 'Saving...' : 'Commit Marks Ledger'}
          </button>
        </div>
      </div>

      {/* Customizable Grading Scale Modal */}
      {isScaleModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '640px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                  ⚙️ Configure Evaluation Grading Scale &amp; Cut-offs
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B' }}>
                  Tailor letter grade bands, score cutoffs &amp; passing marks for this curriculum
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScaleModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', color: '#94A3B8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
              {/* Presets Row */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Grading Standard Presets
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {Object.entries(DEFAULT_PRESETS).map(([k, p]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleSelectPreset(k)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: activeScaleKey === k ? '2px solid #7C3AED' : '1px solid var(--border-color)',
                        background: activeScaleKey === k ? '#F5F3FF' : '#fff',
                        color: activeScaleKey === k ? '#7C3AED' : '#334155',
                        fontWeight: '700',
                        fontSize: '12px',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div>{p.name.split(' (')[0]}</div>
                      <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '500', marginTop: '2px' }}>
                        Pass threshold: {p.passMarksPct}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pass Threshold Setting */}
              <div style={{ marginBottom: '18px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Passing Mark Threshold Percentage</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Students with marks below this cutoff are graded as Fail</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customScale.passMarksPct}
                    onChange={(e) => {
                      setCustomScale({ ...customScale, passMarksPct: Number(e.target.value), key: 'CUSTOM' });
                      setActiveScaleKey('CUSTOM');
                    }}
                    style={{ width: '70px', height: '34px', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '0 8px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}
                  />
                  <span style={{ fontWeight: '700', fontSize: '13px' }}>%</span>
                </div>
              </div>

              {/* Grade Bands Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                    Grade Bands &amp; Minimum Percentage Cutoffs
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBand}
                    style={{ background: 'none', border: 'none', color: '#16A34A', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + Add Grade Band
                  </button>
                </div>

                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '8px 10px', width: '80px' }}>Grade</th>
                        <th style={{ padding: '8px 10px', width: '110px' }}>Min Cutoff (%)</th>
                        <th style={{ padding: '8px 10px' }}>Classification / Description</th>
                        <th style={{ padding: '8px 10px', width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {customScale.bands.map((band, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <input
                              type="text"
                              value={band.grade}
                              onChange={(e) => handleBandChange(idx, 'grade', e.target.value)}
                              style={{ width: '50px', height: '30px', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: 'center', fontWeight: '800' }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ color: '#64748B' }}>&ge;</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={band.minPct}
                                onChange={(e) => handleBandChange(idx, 'minPct', e.target.value)}
                                style={{ width: '60px', height: '30px', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: 'center', fontWeight: '700' }}
                              />
                              <span style={{ color: '#64748B' }}>%</span>
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <input
                              type="text"
                              value={band.desc}
                              onChange={(e) => handleBandChange(idx, 'desc', e.target.value)}
                              style={{ width: '100%', height: '30px', borderRadius: '4px', border: '1px solid var(--border-color)', padding: '0 8px' }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            {band.minPct !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveBand(idx)}
                                style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '13px' }}
                                title="Remove grade band"
                              >
                                &times;
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => setIsScaleModalOpen(false)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyScale}
                className="btn btn-primary"
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '13px'
                }}
              >
                Apply &amp; Recalculate Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgExaminationsMarksEntry;
