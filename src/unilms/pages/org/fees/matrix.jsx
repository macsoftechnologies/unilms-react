import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConfirmDialog } from '../../../components';
import academicsService from '../../../services/academics.service';
import financeService from '../../../services/finance.service';

const OrgFeesMatrix = () => {
  const navigate = useNavigate();

  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Master Data States
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [structures, setStructures] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cascading Selection Filters
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedBatchYear, setSelectedBatchYear] = useState(String(new Date().getFullYear()));
  const [cohorts, setCohorts] = useState([]);

  // One-time Joining Fees configuration (Semester 1 Only)
  const [joiningFees, setJoiningFees] = useState({
    bldgFund: 0,
    cautionDeposit: 0,
    admissionFee: 0,
  });

  // Recurring semester fee templates (defaults to 0 until loaded from backend fee structures)
  const [semesterTuition, setSemesterTuition] = useState(0);
  const [semesterLab, setSemesterLab] = useState(0);
  const [semesterExamMisc, setSemesterExamMisc] = useState(0);

  // Modals & UI States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [editForm, setEditForm] = useState({ tuition: 0, lab: 0, misc: 0 });
  const [isCatalogDrawerOpen, setIsCatalogDrawerOpen] = useState(false);
  const [newFeeTypeName, setNewFeeTypeName] = useState('');
  const [newFeeTypeCode, setNewFeeTypeCode] = useState('');
  const [newFeeTypeCategory, setNewFeeTypeCategory] = useState('All Students');
  const [toastMsg, setToastMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load all master data
  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, structRes, typesRes, cohortRes] = await Promise.all([
        academicsService.getDepartments(),
        academicsService.getPrograms(),
        financeService.getFeeStructures(),
        financeService.getFeeTypes(),
        academicsService.getCohorts().catch(() => []),
      ]);

      const depts = Array.isArray(deptRes) ? deptRes : (deptRes?.data || []);
      const progs = Array.isArray(progRes) ? progRes : (progRes?.data || []);
      const structs = Array.isArray(structRes) ? structRes : (structRes?.data || []);
      const types = Array.isArray(typesRes) ? typesRes : (typesRes?.data || []);
      const chs = Array.isArray(cohortRes) ? cohortRes : (cohortRes?.data || []);

      setDepartments(depts);
      setPrograms(progs);
      setStructures(structs);
      setFeeTypes(types);
      setCohorts(chs);

      let initialProg = null;
      // Default selection
      if (depts.length > 0 && !selectedDeptId) {
        setSelectedDeptId(depts[0].id);
        const deptProgs = progs.filter(p => p.departmentId === depts[0].id || p.department?.id === depts[0].id);
        if (deptProgs.length > 0) {
          setSelectedProgramId(deptProgs[0].id);
          initialProg = deptProgs[0];
        } else if (progs.length > 0) {
          setSelectedProgramId(progs[0].id);
          initialProg = progs[0];
        }
      } else if (progs.length > 0 && !selectedProgramId) {
        setSelectedProgramId(progs[0].id);
        initialProg = progs[0];
      }

      if (initialProg) {
        syncProgramFeesFromBackend(initialProg, structs);
      }
    } catch (e) {
      console.error('Failed to load fee matrix data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync fee heads dynamically from existing backend fee structure for this program
  const syncProgramFeesFromBackend = (prog, currentStructs) => {
    if (!prog) return;
    const pool = currentStructs || structures;
    const matched = pool.filter(s => s.programId === prog.id);
    if (matched.length > 0) {
      const sem1Struct = matched.find(s => s.name?.includes('Semester 1')) || matched[0];
      const heads = sem1Struct.heads || [];
      const tuitionHead = heads.find(h => h.name?.toLowerCase().includes('tuition'));
      const labHead = heads.find(h => h.name?.toLowerCase().includes('lab'));
      const miscHead = heads.find(h => h.name?.toLowerCase().includes('exam') || h.name?.toLowerCase().includes('misc'));
      const bldgHead = heads.find(h => h.name?.toLowerCase().includes('building'));
      const depositHead = heads.find(h => h.name?.toLowerCase().includes('caution') || h.name?.toLowerCase().includes('deposit'));
      const admHead = heads.find(h => h.name?.toLowerCase().includes('admission'));

      setJoiningFees({
        bldgFund: bldgHead ? Number(bldgHead.amount) : 0,
        cautionDeposit: depositHead ? Number(depositHead.amount) : 0,
        admissionFee: admHead ? Number(admHead.amount) : 0,
      });
      setSemesterTuition(tuitionHead ? Number(tuitionHead.amount) : (sem1Struct.totalAmount ? Number(sem1Struct.totalAmount) : 0));
      setSemesterLab(labHead ? Number(labHead.amount) : 0);
      setSemesterExamMisc(miscHead ? Number(miscHead.amount) : 0);
    } else {
      setJoiningFees({ bldgFund: 0, cautionDeposit: 0, admissionFee: 0 });
      setSemesterTuition(0);
      setSemesterLab(0);
      setSemesterExamMisc(0);
    }
  };

  // Sync program when department changes
  const handleDepartmentChange = (deptId) => {
    setSelectedDeptId(deptId);
    const deptProgs = programs.filter(p => p.departmentId === deptId || p.department?.id === deptId);
    if (deptProgs.length > 0) {
      setSelectedProgramId(deptProgs[0].id);
      syncProgramFeesFromBackend(deptProgs[0], structures);
    } else {
      setSelectedProgramId('');
      setJoiningFees({ bldgFund: 0, cautionDeposit: 0, admissionFee: 0 });
      setSemesterTuition(0);
      setSemesterLab(0);
      setSemesterExamMisc(0);
    }
  };

  const handleProgramChange = (progId) => {
    setSelectedProgramId(progId);
    const prog = programs.find(p => p.id === progId);
    if (prog) {
      syncProgramFeesFromBackend(prog, structures);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Resolve current active program and batch metrics
  const activeProgram = programs.find(p => p.id === selectedProgramId) || programs[0] || null;
  const durationYears = activeProgram?.durationYears || 4;
  const totalSemestersCount = durationYears * 2;
  const programCode = activeProgram?.code || 'DEGREE';
  const programName = activeProgram?.name || 'Academic Degree Program';
  const isPostGrad = activeProgram?.type === 'PG' || durationYears === 2;

  // Active batch years
  const batchStart = Number(selectedBatchYear);
  const batchEnd = batchStart + durationYears;
  const batchLabel = `Class of ${batchStart}–${batchEnd} (Batch ${batchStart})`;

  // One-time joining subtotal
  const oneTimeJoiningSubtotal = Number(joiningFees.bldgFund || 0) + Number(joiningFees.cautionDeposit || 0) + Number(joiningFees.admissionFee || 0);

  // Find saved backend structures for this program
  const matchedBackendStructures = structures.filter(s => s.programId === activeProgram?.id);

  // Generate full semester list dynamically
  const semesterRows = [];
  let degreeGrandTotal = 0;

  for (let sem = 1; sem <= totalSemestersCount; sem++) {
    const yrNum = Math.ceil(sem / 2);
    const ayStart = batchStart + (yrNum - 1);
    const ayEnd = ayStart + 1;
    const academicYearStr = `${ayStart}-${ayEnd}`;

    // Check if backend already has this semester saved
    const backendStruct = matchedBackendStructures.find(s => s.name?.includes(`Semester ${sem}`) || s.academicYear === academicYearStr);

    let tFee = semesterTuition;
    let lFee = semesterLab;
    let mFee = semesterExamMisc;
    let joiningAmt = sem === 1 ? oneTimeJoiningSubtotal : 0;

    if (backendStruct) {
      const heads = backendStruct.heads || [];
      const tuitionHead = heads.find(h => h.name?.toLowerCase().includes('tuition'));
      const labHead = heads.find(h => h.name?.toLowerCase().includes('lab'));
      const bldgHead = heads.find(h => h.name?.toLowerCase().includes('building'));

      if (tuitionHead) tFee = Number(tuitionHead.amount);
      if (labHead) lFee = Number(labHead.amount);
      if (bldgHead && sem === 1) joiningAmt = Number(bldgHead.amount);
    }

    const termTotal = tFee + lFee + mFee + joiningAmt;
    degreeGrandTotal += termTotal;

    semesterRows.push({
      semesterNum: sem,
      yearNum: yrNum,
      academicYear: academicYearStr,
      tuition: tFee,
      lab: lFee,
      misc: mFee,
      joiningFee: joiningAmt,
      totalDemand: termTotal,
      isConfigured: !!backendStruct,
      structId: backendStruct?.id || null,
    });
  }

  // Save the entire Matrix package to backend (Semester 1 package + component heads)
  const handleSaveMatrix = async () => {
    if (!activeProgram) {
      alert('Please select a program first.');
      return;
    }

    const sem1 = semesterRows[0];

    const confirmed = await confirm({
      title: 'Confirm Save Fee Matrix Package',
      message: `Save and publish Fee Structure for ${programCode} (${batchLabel})?`,
      details: [
        `Degree Program: ${activeProgram.name} (${programCode})`,
        `Admitted Batch: ${batchLabel}`,
        `Semester 1 Fee Package: ₹${sem1.totalDemand.toLocaleString()}`,
        `4-Year Total Investment: ₹${fourYearCumulativeTotal.toLocaleString()}`
      ],
      confirmText: 'Yes, Save Fee Structure',
      variant: 'primary',
      icon: 'fa-solid fa-layer-group'
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      // 1. Create or update Semester 1 Fee Structure with full heads (including Building Fund)
      const headsPayload = [
        { name: 'Tuition Fee', amount: sem1.tuition },
        { name: isPostGrad ? 'Corporate Immersion & Sim Lab' : 'Lab & Practical Fee', amount: sem1.lab },
        { name: 'Examination & Digital Library Fee', amount: sem1.misc },
        { name: 'Building & Infrastructure Development Fund', amount: Number(joiningFees.bldgFund) },
        { name: 'Caution & Security Deposit (Refundable)', amount: Number(joiningFees.cautionDeposit) },
        { name: 'Admission & Student Kit Fee', amount: Number(joiningFees.admissionFee) },
      ];

      await financeService.createFeeStructure({
        programId: activeProgram.id,
        name: `${programCode} - Batch ${batchStart}–${batchEnd} (Semester 1 Package)`,
        academicYear: sem1.academicYear,
        totalAmount: sem1.totalDemand,
        heads: headsPayload,
      });

      showToast(`Fee Matrix for ${programCode} (${batchLabel}) saved successfully!`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to save fee matrix: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Open modal to customize a specific semester
  const openEditModal = (semRow) => {
    setEditingSemester(semRow);
    setEditForm({
      tuition: semRow.tuition,
      lab: semRow.lab,
      misc: semRow.misc,
    });
    setIsEditModalOpen(true);
  };

  const saveEditedSemester = async (e) => {
    e.preventDefault();
    if (!editingSemester) return;

    const newT = Number(editForm.tuition || 0);
    const newL = Number(editForm.lab || 0);
    const newM = Number(editForm.misc || 0);
    const newTotal = newT + newL + newM + (editingSemester.semesterNum === 1 ? oneTimeJoiningSubtotal : 0);

    const confirmed = await confirm({
      title: `Confirm Update Semester ${editingSemester.semesterNum} Schedule`,
      message: `Update fee demand for Semester ${editingSemester.semesterNum} to ₹${newTotal.toLocaleString()}?`,
      details: [
        `Tuition Fee: ₹${newT.toLocaleString()}`,
        `Lab & Practical Fee: ₹${newL.toLocaleString()}`,
        `Academic Misc Fee: ₹${newM.toLocaleString()}`,
        `Total Semester Demand: ₹${newTotal.toLocaleString()}`
      ],
      confirmText: 'Yes, Update Semester Schedule',
      variant: 'primary',
      icon: 'fa-solid fa-pen-to-square'
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      const headsPayload = [
        { name: 'Tuition Fee', amount: newT },
        { name: 'Lab & Practical Fee', amount: newL },
        { name: 'Examination & Academic Misc Fee', amount: newM },
      ];
      if (editingSemester.semesterNum === 1) {
        headsPayload.push({ name: 'Building & Infrastructure Development Fund', amount: Number(joiningFees.bldgFund) });
        headsPayload.push({ name: 'Caution & Security Deposit', amount: Number(joiningFees.cautionDeposit) });
        headsPayload.push({ name: 'Admission Fee', amount: Number(joiningFees.admissionFee) });
      }

      await financeService.createFeeStructure({
        programId: activeProgram.id,
        name: `${programCode} - Batch ${batchStart}–${batchEnd} (Semester ${editingSemester.semesterNum})`,
        academicYear: editingSemester.academicYear,
        totalAmount: newTotal,
        heads: headsPayload,
      });

      setIsEditModalOpen(false);
      showToast(`Semester ${editingSemester.semesterNum} fee schedule updated to ₹${newTotal.toLocaleString()}!`);
      await loadData();
    } catch (err) {
      alert('Failed to update semester fee: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Add custom fee type to catalog
  const handleCreateFeeType = async (e) => {
    e.preventDefault();
    if (!newFeeTypeName) {
      alert('Please enter fee type name.');
      return;
    }

    const confirmed = await confirm({
      title: 'Confirm Add Fee Head to Catalog',
      message: `Add fee head "${newFeeTypeName}" to institutional catalog?`,
      details: [
        `Fee Head Name: ${newFeeTypeName}`,
        `Category: ${newFeeTypeCategory}`
      ],
      confirmText: 'Yes, Add Fee Head',
      variant: 'success',
      icon: 'fa-solid fa-plus'
    });
    if (!confirmed) return;

    try {
      await financeService.createFeeType({
        name: newFeeTypeName,
        code: newFeeTypeCode || `FEE-${Date.now().toString().slice(-4)}`,
        applicableTo: newFeeTypeCategory,
      });
      setNewFeeTypeName('');
      setNewFeeTypeCode('');
      showToast(`Fee head "${newFeeTypeName}" added to catalog!`);
      const updatedTypes = await financeService.getFeeTypes();
      setFeeTypes(Array.isArray(updatedTypes) ? updatedTypes : (updatedTypes?.data || []));
    } catch (err) {
      alert('Failed to add fee type: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)', animation: 'fadeIn 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '14px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
          </div>
        )}

        {/* Top Header & Navigation Banner */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                minWidth: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7C3AED, #4C1D95)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
              }}
            >
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Unified Fee Matrix &amp; Department Packages
                </h2>
                <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                  ERP DESK 1
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Configure department-wise degree fee matrices, one-time building funds, and term breakdown across joining batches
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsCatalogDrawerOpen(true)}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '9px 14px', borderRadius: '9px' }}
            >
              <i className="fa-solid fa-tags"></i> Fee Heads Catalog ({feeTypes.length})
            </button>
            <button
              onClick={handleSaveMatrix}
              disabled={saving || !activeProgram}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '9px 18px', borderRadius: '9px', fontWeight: '700' }}
            >
              <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
              {saving ? 'Saving Matrix...' : 'Save Current Matrix'}
            </button>
            <Link
              to={`/unilms/org/fees/invoicing?program_id=${selectedProgramId}&semester=1`}
              className="btn"
              style={{ background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '9px 16px', borderRadius: '9px', fontWeight: '700', textDecoration: 'none' }}
            >
              <i className="fa-solid fa-file-invoice-dollar"></i> Issue Invoices
            </Link>
          </div>
        </div>

        {/* Cascading Filter Bar: Department -> Program -> Batch Year */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            alignItems: 'end',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
              <i className="fa-solid fa-building-columns me-1" style={{ color: '#7C3AED' }}></i> 1. Academic Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontWeight: '600', fontSize: '13.5px' }}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
              <i className="fa-solid fa-graduation-cap me-1" style={{ color: '#2563EB' }}></i> 2. Degree Program &amp; Major
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => handleProgramChange(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontWeight: '600', fontSize: '13.5px' }}
            >
              {programs
                .filter(p => !selectedDeptId || p.departmentId === selectedDeptId || p.department?.id === selectedDeptId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.code}] &bull; {p.durationYears || 4} Yrs ({p.type || 'UG'})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
              <i className="fa-solid fa-calendar-days me-1" style={{ color: '#D97706' }}></i> 3. Admitted Batch / Cohort
            </label>
            <select
              value={selectedBatchYear}
              onChange={(e) => setSelectedBatchYear(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontWeight: '600', fontSize: '13.5px' }}
            >
              {cohorts.length > 0 ? (
                cohorts.map((c) => {
                  const sYear = c.startYear || c.year || (c.name && c.name.match(/\d{4}/) ? c.name.match(/\d{4}/)[0] : new Date().getFullYear());
                  return (
                    <option key={c.id || sYear} value={String(sYear)}>
                      {c.name || `Class of ${sYear}–${Number(sYear) + durationYears}`} {c.status === 'active' ? '(Current Admitted)' : ''}
                    </option>
                  );
                })
              ) : (
                [0, -1, -2].map(offset => {
                  const year = new Date().getFullYear() + offset;
                  const label = offset === 0
                    ? `Class of ${year}–${year + durationYears} (Current Admitted Batch ${year})`
                    : offset === -1
                      ? `Class of ${year}–${year + durationYears} (Batch ${year} - Year 2)`
                      : `Class of ${year}–${year + durationYears} (Batch ${year} - Senior)`;
                  return <option key={year} value={String(year)}>{label}</option>;
                })
              )}
            </select>
          </div>
        </div>

        {/* Selected Program & Batch Metrics Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.04) 0%, rgba(37, 99, 235, 0.04) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.15)',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge" style={{ background: '#7C3AED', color: '#fff', fontWeight: '800', fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }}>
                {programCode}
              </span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {programName}
              </h3>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                &bull; {durationYears} Years ({totalSemestersCount} Semesters) &bull; {batchLabel}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700' }}>
                Total 1-Time Joining Charges
              </div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#D97706' }}>
                ₹{oneTimeJoiningSubtotal.toLocaleString()}
              </div>
            </div>

            <div style={{ width: '1px', height: '32px', background: 'var(--border-color)' }}></div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700' }}>
                Total Program Commitment
              </div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#7C3AED' }}>
                ₹{degreeGrandTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION A: One-Time Joining Fees (Semester 1 Only) */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '22px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                <i className="fa-solid fa-landmark"></i>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Section A: One-Time Joining Fees (Applies strictly to Semester 1 on Matriculation)
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  These heads are billed only once when the student enters the university and are omitted from Semesters 2–{totalSemestersCount}
                </div>
              </div>
            </div>
            <span className="badge" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', fontWeight: '700', fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }}>
              Subtotal: ₹{oneTimeJoiningSubtotal.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', background: 'var(--card-bg, #fff)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Building &amp; Infra Development Fund
                </span>
                <span className="badge" style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '10px', fontWeight: '700' }}>Non-Refundable</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Institutional capital expansion, campus facilities, and infrastructure
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '9px', fontWeight: '700', color: 'var(--text-muted)' }}>₹</span>
                <input
                  type="number"
                  value={joiningFees.bldgFund}
                  onChange={(e) => setJoiningFees({ ...joiningFees, bldgFund: Number(e.target.value) })}
                  className="form-control"
                  style={{ paddingLeft: '26px', fontWeight: '800', fontSize: '14px', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', background: 'var(--card-bg, #fff)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Caution &amp; Security Deposit
                </span>
                <span className="badge" style={{ background: '#D1FAE5', color: '#059669', fontSize: '10px', fontWeight: '700' }}>Refundable</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Held in trust against library &amp; lab damages; refunded upon final graduation
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '9px', fontWeight: '700', color: 'var(--text-muted)' }}>₹</span>
                <input
                  type="number"
                  value={joiningFees.cautionDeposit}
                  onChange={(e) => setJoiningFees({ ...joiningFees, cautionDeposit: Number(e.target.value) })}
                  className="form-control"
                  style={{ paddingLeft: '26px', fontWeight: '800', fontSize: '14px', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', background: 'var(--card-bg, #fff)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Admission &amp; Student Kit Fee
                </span>
                <span className="badge" style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '10px', fontWeight: '700' }}>Admin Kit</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Identity smart card, orientation, university handbook, and registration
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '9px', fontWeight: '700', color: 'var(--text-muted)' }}>₹</span>
                <input
                  type="number"
                  value={joiningFees.admissionFee}
                  onChange={(e) => setJoiningFees({ ...joiningFees, admissionFee: Number(e.target.value) })}
                  className="form-control"
                  style={{ paddingLeft: '26px', fontWeight: '800', fontSize: '14px', borderRadius: '8px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: Semester-by-Semester Academic Schedule */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                <i className="fa-solid fa-calendar-check"></i>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Section B: Semester-Wise Academic Breakdown ({totalSemestersCount} Semesters)
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Recurring semester instructional tuition, specialized lab charges, and examination heads
                </div>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--border-color)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Term / Level</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Academic Year</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Tuition Fee</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Lab / Immersion</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Exam &amp; Library</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>1-Time Joining</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--text-primary)' }}>Total Demand (₹)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {semesterRows.map((row) => (
                  <tr key={row.semesterNum} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                        Semester {row.semesterNum}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Year {row.yearNum} {row.semesterNum === 1 ? '• Admission Term' : ''}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {row.academicYear}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700' }}>
                      ₹{row.tuition.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      ₹{row.lab.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      ₹{row.misc.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {row.joiningFee > 0 ? (
                        <span className="badge" style={{ background: '#FEF3C7', color: '#B45309', fontWeight: '700' }}>
                          +₹{row.joiningFee.toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: '#7C3AED', fontSize: '14.5px' }}>
                      ₹{row.totalDemand.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {row.isConfigured ? (
                        <span className="badge" style={{ background: '#D1FAE5', color: '#059669', fontWeight: '700', fontSize: '11px' }}>
                          <i className="fa-solid fa-circle-check me-1"></i> Saved
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>
                          Template
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        onClick={() => openEditModal(row)}
                        className="btn btn-outline"
                        style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '6px' }}
                        title="Edit Semester Heads"
                      >
                        <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Customize Semester Heads */}
        {isEditModalOpen && editingSemester && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1050,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              style={{
                background: 'var(--card-bg, #fff)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>
                    Configure Semester {editingSemester.semesterNum} Heads
                  </h3>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {programCode} &bull; Academic Year {editingSemester.academicYear}
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={saveEditedSemester}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '5px' }}>
                    Tuition Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.tuition}
                    onChange={(e) => setEditForm({ ...editForm, tuition: Number(e.target.value) })}
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontWeight: '700' }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '5px' }}>
                    {isPostGrad ? 'Corporate Simulation & Immersion Lab (₹)' : 'Lab & Practical Computing Fee (₹)'}
                  </label>
                  <input
                    type="number"
                    value={editForm.lab}
                    onChange={(e) => setEditForm({ ...editForm, lab: Number(e.target.value) })}
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontWeight: '700' }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '5px' }}>
                    Examination, Library &amp; Misc Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.misc}
                    onChange={(e) => setEditForm({ ...editForm, misc: Number(e.target.value) })}
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontWeight: '700' }}
                  />
                </div>

                {editingSemester.semesterNum === 1 && (
                  <div style={{ background: '#FEF3C7', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#92400E' }}>
                    <i className="fa-solid fa-circle-info me-1"></i>
                    Semester 1 automatically inherits Section A One-Time Joining Fees (+₹{oneTimeJoiningSubtotal.toLocaleString()}).
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: '700' }}
                  >
                    {saving ? 'Updating...' : 'Save Semester Heads'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Drawer: Fee Types Catalog */}
        {isCatalogDrawerOpen && (
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
                maxWidth: '460px',
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
                    <i className="fa-solid fa-tags"></i>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Fee Heads Catalog</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Institutional Chart of Accounts Heads</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsCatalogDrawerOpen(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                <form onSubmit={handleCreateFeeType} style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-primary)' }}>
                    + Add New Fee Head to Catalog
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="e.g. Placement & Industry Immersion"
                      value={newFeeTypeName}
                      onChange={(e) => setNewFeeTypeName(e.target.value)}
                      className="form-control"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="Code (e.g. 1008-PLACE)"
                      value={newFeeTypeCode}
                      onChange={(e) => setNewFeeTypeCode(e.target.value)}
                      className="form-control"
                      style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px' }}
                    />
                    <select
                      value={newFeeTypeCategory}
                      onChange={(e) => setNewFeeTypeCategory(e.target.value)}
                      className="form-control"
                      style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px' }}
                    >
                      <option value="All Students">All Students</option>
                      <option value="One-Time Joining Fee">One-Time Joining</option>
                      <option value="Engineering Students">Engineering</option>
                      <option value="Management Students">Management</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '12.5px', padding: '8px', fontWeight: '700', borderRadius: '6px' }}>
                    Add Fee Head
                  </button>
                </form>

                <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Active Fee Heads in System ({feeTypes.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {feeTypes.map((ft) => (
                    <div key={ft.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', background: 'var(--card-bg, #fff)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>{ft.name}</span>
                        <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontSize: '10.5px' }}>{ft.code || 'FEE'}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        Applicability: {ft.applicableTo || 'All Students'} &bull; GL: {ft.glHead || 'General Ledger'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgFeesMatrix;
