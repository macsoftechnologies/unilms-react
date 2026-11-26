import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import financeService from '../../../services/finance.service';
import studentsService from '../../../services/students.service';
import academicsService from '../../../services/academics.service';
import { getCurrentAcademicYear } from '../../../utils/date';

const OrgFeesInvoicing = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [searchParams] = useSearchParams();
  const urlProgramId = searchParams.get('program_id');
  const urlSemester = searchParams.get('semester');

  const [assignMode, setAssignMode] = useState('BULK'); // 'BULK' | 'INDIVIDUAL'
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Installment Plan Configuration
  const [installmentPlan, setInstallmentPlan] = useState('2_TRANCHES'); // 'FULL' | '2_TRANCHES' | '3_TRANCHES'

  // Individual Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [customAmount, setCustomAmount] = useState('87000');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [tranche2Date, setTranche2Date] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });
  const [tranche3Date, setTranche3Date] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 150);
    return d.toISOString().split('T')[0];
  });
  const [reason, setReason] = useState('Term Academic Tuition & Package');

  // Bulk Form State
  const [bulkProgramId, setBulkProgramId] = useState(urlProgramId || '');
  const [bulkSemester, setBulkSemester] = useState(urlSemester || '1');
  const [bulkAmount, setBulkAmount] = useState('87000');
  const [bulkDueDate, setBulkDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [bulkTranche2Date, setBulkTranche2Date] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });
  const [bulkTranche3Date, setBulkTranche3Date] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 150);
    return d.toISOString().split('T')[0];
  });
  const [bulkTitle, setBulkTitle] = useState(() => `Academic Year ${getCurrentAcademicYear()} Term 1 Fee Package`);

  const [toastMsg, setToastMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stuRes, structRes, invRes, progRes] = await Promise.all([
        studentsService.getStudents(),
        financeService.getFeeStructures(),
        financeService.getInvoices(),
        academicsService.getPrograms(),
      ]);

      const stuList = Array.isArray(stuRes) ? stuRes : (stuRes?.data || []);
      const structList = Array.isArray(structRes) ? structRes : (structRes?.data || []);
      const invList = Array.isArray(invRes) ? invRes : (invRes?.data || []);
      const progList = Array.isArray(progRes) ? progRes : (progRes?.data || []);

      setStudents(stuList);
      setStructures(structList);
      setInvoices(invList);
      setPrograms(progList);

      if (stuList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(stuList[0].id);
      }
      if (progList.length > 0 && !bulkProgramId) {
        setBulkProgramId(urlProgramId || progList[0].id);
      }
      if (structList.length > 0 && !selectedStructureId) {
        setSelectedStructureId(structList[0].id);
        setCustomAmount(String(structList[0].totalAmount || 87000));
      }
    } catch (e) {
      console.error('Failed to load invoicing desk data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedInvoices,
    totalItems
  } = useTablePagination(invoices, 10);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleStructureSelect = (structId) => {
    setSelectedStructureId(structId);
    const found = structures.find(s => s.id === structId);
    if (found && found.totalAmount) {
      setCustomAmount(String(found.totalAmount));
    }
  };

  const handleProgramSelectInBulk = (progId) => {
    setBulkProgramId(progId);
    const prog = programs.find(p => p.id === progId);
    const isMba = prog?.code?.includes('MBA') || prog?.name?.toLowerCase().includes('management');
    const matched = structures.find(s => s.programId === progId);
    if (matched) {
      setBulkAmount(String(matched.totalAmount));
    } else {
      setBulkAmount(isMba ? '150000' : '87000');
    }
  };

  // Helper to format Installment description string
  const formatInstallmentPlanString = (total, plan, d1, d2, d3) => {
    const amt = Number(total);
    if (plan === 'FULL') {
      return `[Lump-Sum: 100% upfront (₹${amt.toLocaleString()})]`;
    } else if (plan === '2_TRANCHES') {
      const t1 = Math.round(amt * 0.5);
      const t2 = amt - t1;
      return `[Plan: 2 Tranches | T1: ₹${t1.toLocaleString()} (Due ${d1}), T2: ₹${t2.toLocaleString()} (Due ${d2})]`;
    } else if (plan === '3_TRANCHES') {
      const t1 = Math.round(amt * 0.4);
      const t2 = Math.round(amt * 0.3);
      const t3 = amt - t1 - t2;
      return `[Plan: 3 Tranches | T1: ₹${t1.toLocaleString()} (Due ${d1}), T2: ₹${t2.toLocaleString()} (Due ${d2}), T3: ₹${t3.toLocaleString()} (Due ${d3})]`;
    }
    return '';
  };

  // Submit Individual Invoice
  const handleIndividualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Please select an enrolled student.');
      return;
    }
    if (!customAmount || Number(customAmount) <= 0) {
      alert('Please specify a valid fee amount.');
      return;
    }

    const st = students.find(s => s.id === selectedStudentId);
    const struct = structures.find(s => s.id === selectedStructureId);

    const confirmed = await confirm({
      title: 'Confirm Issue Student Fee Demand',
      message: `Issue fee invoice for ₹${Number(customAmount).toLocaleString()} to ${st ? `${st.firstName} ${st.lastName || ''}` : 'selected student'}?`,
      details: [
        `Student: ${st ? `${st.firstName} ${st.lastName || ''} (${st.rollNumber || 'No Roll'})` : 'N/A'}`,
        `Amount: ₹${Number(customAmount).toLocaleString()}`,
        `Due Date: ${dueDate}`,
        `Payment Tranches: ${installmentPlan === 'FULL' ? 'Full Lump-sum' : installmentPlan === '2_TRANCHES' ? '2 Tranches' : '3 Tranches'}`
      ],
      confirmText: 'Yes, Issue Invoice',
      variant: 'primary',
      icon: 'fa-solid fa-file-invoice-dollar'
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const planNote = formatInstallmentPlanString(customAmount, installmentPlan, dueDate, tranche2Date, tranche3Date);
      const finalTitle = `${reason || 'Academic Tuition Fee'} ${planNote}`.trim();

      await financeService.createInvoice({
        studentId: selectedStudentId,
        totalAmount: Number(customAmount),
        dueDate: dueDate,
        title: finalTitle,
        semester: struct ? `Semester ${struct.semester || 1}` : 'Semester 1',
        academicYear: struct?.academicYear || getCurrentAcademicYear(),
      });

      const studentName = st ? `${st.firstName} ${st.lastName || ''}`.trim() : 'Student';
      showToast(`Fee demand of ₹${Number(customAmount).toLocaleString()} issued to ${studentName} successfully!`);
      await loadData();
    } catch (err) {
      alert('Failed to issue invoice: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Bulk Cohort Demand Generation
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkProgramId) {
      alert('Please select a degree program.');
      return;
    }
    if (!bulkAmount || Number(bulkAmount) <= 0) {
      alert('Please enter a valid billing amount.');
      return;
    }

    const prog = programs.find(p => p.id === bulkProgramId);

    const confirmed = await confirm({
      title: 'Confirm Batch Invoice Generation',
      message: `Generate batch fee demands of ₹${Number(bulkAmount).toLocaleString()} for ${prog?.name || prog?.code || 'all students in cohort'}?`,
      details: [
        `Program: ${prog?.name || 'Selected Program'} (${prog?.code || 'DEGREE'})`,
        `Target Semester: Semester ${bulkSemester}`,
        `Per Student Demand: ₹${Number(bulkAmount).toLocaleString()}`,
        `Installment Plan: ${installmentPlan}`
      ],
      confirmText: 'Yes, Generate Batch Invoices',
      variant: 'primary',
      icon: 'fa-solid fa-layer-group'
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const planNote = formatInstallmentPlanString(bulkAmount, installmentPlan, bulkDueDate, bulkTranche2Date, bulkTranche3Date);
      const finalTitle = `${bulkTitle || `${prog?.code || 'Degree'} Sem ${bulkSemester} Fee`} ${planNote}`.trim();

      const res = await financeService.createBulkInvoices({
        programId: bulkProgramId,
        semester: `Semester ${bulkSemester}`,
        academicYear: struct?.academicYear || getCurrentAcademicYear(),
        totalAmount: Number(bulkAmount),
        dueDate: bulkDueDate,
        title: finalTitle,
      });

      const count = res?.count !== undefined ? res.count : (res?.data?.count || 0);
      showToast(`Batch Demand Generated! Successfully created ${count} invoices with installment plan.`);
      await loadData();
    } catch (err) {
      alert('Bulk demand generation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', animation: 'fadeIn 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
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
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
              }}
            >
              <i className="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Billing &amp; Invoicing Desk
                </h2>
                <span className="badge" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                  ERP DESK 2
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Generate semester fee demands across cohorts or issue individual invoices with structured installment plans
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/unilms/org/fees/matrix" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '9px 14px', borderRadius: '8px', textDecoration: 'none' }}>
              <i className="fa-solid fa-layer-group"></i> Fee Matrix
            </Link>
            <Link to="/unilms/org/fees/collections" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '9px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700' }}>
              <i className="fa-solid fa-cash-register"></i> Collections Counter
            </Link>
          </div>
        </div>

        {/* Dual Mode Switcher Banner: Bulk vs Individual */}
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Choose Invoicing Mode</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {assignMode === 'BULK'
                ? 'Issue batch demands to all students enrolled in a degree program / batch simultaneously'
                : 'Issue a custom invoice or waiver adjustment to a single specific student'}
            </div>
          </div>

          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '4px' }}>
            <button
              onClick={() => setAssignMode('BULK')}
              style={{
                border: 'none',
                background: assignMode === 'BULK' ? '#059669' : 'transparent',
                color: assignMode === 'BULK' ? '#fff' : 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '12.5px',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-users"></i> Bulk Cohort Demand
            </button>
            <button
              onClick={() => setAssignMode('INDIVIDUAL')}
              style={{
                border: 'none',
                background: assignMode === 'INDIVIDUAL' ? '#7C3AED' : 'transparent',
                color: assignMode === 'INDIVIDUAL' ? '#fff' : 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '12.5px',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-user-tag"></i> Individual Student
            </button>
          </div>
        </div>

        {/* Global Installment Plan Selector Banner */}
        <div style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)', border: '1px solid rgba(37, 99, 235, 0.15)', borderRadius: '14px', padding: '16px 20px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-calendar-week" style={{ color: '#2563EB', fontSize: '18px' }}></i>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Installment &amp; Tranche Payment Schedule
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Choose how parents/students will settle this term fee demand
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setInstallmentPlan('FULL')}
                style={{
                  border: '1px solid var(--border-color)',
                  background: installmentPlan === 'FULL' ? '#2563EB' : 'var(--card-bg, #fff)',
                  color: installmentPlan === 'FULL' ? '#fff' : 'var(--text-primary)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                1 Tranche (100% Upfront)
              </button>
              <button
                type="button"
                onClick={() => setInstallmentPlan('2_TRANCHES')}
                style={{
                  border: '1px solid var(--border-color)',
                  background: installmentPlan === '2_TRANCHES' ? '#2563EB' : 'var(--card-bg, #fff)',
                  color: installmentPlan === '2_TRANCHES' ? '#fff' : 'var(--text-primary)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                2 Tranches (50% / 50%)
              </button>
              <button
                type="button"
                onClick={() => setInstallmentPlan('3_TRANCHES')}
                style={{
                  border: '1px solid var(--border-color)',
                  background: installmentPlan === '3_TRANCHES' ? '#2563EB' : 'var(--card-bg, #fff)',
                  color: installmentPlan === '3_TRANCHES' ? '#fff' : 'var(--text-primary)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                3 Tranches (40% / 30% / 30%)
              </button>
            </div>
          </div>

          {/* Tranche Breakdown Preview */}
          <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '10px', padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Tranche 1 (Admission / Start)</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>
                {installmentPlan === 'FULL' ? '100% of Total' : installmentPlan === '2_TRANCHES' ? '50% of Total' : '40% of Total'}
              </div>
            </div>

            {installmentPlan !== 'FULL' && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Tranche 2 (Mid-Term)</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
                  {installmentPlan === '2_TRANCHES' ? '50% of Total' : '30% of Total'}
                </div>
              </div>
            )}

            {installmentPlan === '3_TRANCHES' && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Tranche 3 (Pre-Exam)</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>
                  30% Balance
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BULK DEMAND GENERATION FORM */}
        {assignMode === 'BULK' && (
          <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <i className="fa-solid fa-layer-group" style={{ color: '#059669', fontSize: '18px' }}></i>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Batch Demand Generator (Whole Program / Cohort)
              </h3>
            </div>

            <form onSubmit={handleBulkSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                    Target Degree Program
                  </label>
                  <select
                    value={bulkProgramId}
                    onChange={(e) => handleProgramSelectInBulk(e.target.value)}
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontWeight: '600' }}
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.code}] ({p.durationYears || 4} Years)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                    Billing Semester
                  </label>
                  <select
                    value={bulkSemester}
                    onChange={(e) => setBulkSemester(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontWeight: '600' }}
                  >
                    <option value="1">Semester 1 (Includes One-Time Joining Fees)</option>
                    <option value="2">Semester 2 (Regular Term)</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                    Billing Amount per Student (₹)
                  </label>
                  <input
                    type="number"
                    value={bulkAmount}
                    onChange={(e) => setBulkAmount(e.target.value)}
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontWeight: '800', color: '#059669', fontSize: '14.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                    Tranche 1 Due Date
                  </label>
                  <input
                    type="date"
                    value={bulkDueDate}
                    onChange={(e) => setBulkDueDate(e.target.value)}
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                    Invoice Demand Title
                  </label>
                  <input
                    type="text"
                    value={bulkTitle}
                    onChange={(e) => setBulkTitle(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Academic Year 2026-2027 Term 1 Fee Package"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px' }}
                  />
                </div>

                {installmentPlan !== 'FULL' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                      Tranche 2 Due Date
                    </label>
                    <input
                      type="date"
                      value={bulkTranche2Date}
                      onChange={(e) => setBulkTranche2Date(e.target.value)}
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px' }}
                    />
                  </div>
                )}

                {installmentPlan === '3_TRANCHES' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                      Tranche 3 Due Date
                    </label>
                    <input
                      type="date"
                      value={bulkTranche3Date}
                      onChange={(e) => setBulkTranche3Date(e.target.value)}
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ background: '#059669', borderColor: '#059669', padding: '10px 24px', fontWeight: '700', borderRadius: '8px', fontSize: '13.5px' }}
                >
                  <i className={`fa-solid ${submitting ? 'fa-spinner fa-spin' : 'fa-bolt'} me-1`}></i>
                  {submitting ? 'Generating Invoices...' : 'Generate Batch Demands'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* INDIVIDUAL STUDENT FORM */}
        {assignMode === 'INDIVIDUAL' && (
          <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <i className="fa-solid fa-user-tag" style={{ color: '#7C3AED', fontSize: '18px' }}></i>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Individual Student Invoice &amp; Adjustment
              </h3>
            </div>

            <form onSubmit={handleIndividualSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                    Select Enrolled Student
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
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

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                    Fee Package Template
                  </label>
                  <select
                    value={selectedStructureId}
                    onChange={(e) => handleStructureSelect(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px' }}
                  >
                    <option value="">-- Custom / Ad-hoc Fee --</option>
                    {structures.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} (₹{Number(st.totalAmount).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                    Invoice Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontWeight: '800', color: '#7C3AED', fontSize: '14.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                    Tranche 1 Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                    Invoice Purpose / Description
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Term Academic Tuition & Package"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px' }}
                  />
                </div>

                {installmentPlan !== 'FULL' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                      Tranche 2 Due Date
                    </label>
                    <input
                      type="date"
                      value={tranche2Date}
                      onChange={(e) => setTranche2Date(e.target.value)}
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px' }}
                    />
                  </div>
                )}

                {installmentPlan === '3_TRANCHES' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                      Tranche 3 Due Date
                    </label>
                    <input
                      type="date"
                      value={tranche3Date}
                      onChange={(e) => setTranche3Date(e.target.value)}
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ background: '#7C3AED', borderColor: '#7C3AED', padding: '10px 24px', fontWeight: '700', borderRadius: '8px', fontSize: '13.5px' }}
                >
                  <i className={`fa-solid ${submitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'} me-1`}></i>
                  {submitting ? 'Issuing Invoice...' : 'Issue Student Invoice'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* RECENT INVOICES LOG TABLE */}
        <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Active Fee Invoices ({invoices.length})</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Generated invoices with installment tranche plans</div>
            </div>
            <Link to="/unilms/org/fees/collections" className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none' }}>
              View in Cashier Counter &rarr;
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--border-color)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Invoice #</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Student Name &amp; Roll</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Program / Plan</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Paid (₹)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Balance (₹)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Due Date</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.length === 0 && !loading && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No invoices generated yet. Use the form above to generate your first batch demand.
                    </td>
                  </tr>
                )}
                {paginatedInvoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#2563EB' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        {inv.student?.firstName} {inv.student?.lastName || ''}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {inv.student?.rollNumber || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '600' }}>
                        {inv.student?.program?.code || 'DEGREE'} &bull; {inv.semester || 'Sem 1'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={inv.title}>
                        {inv.title || 'Term Tuition Fee'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700' }}>
                      ₹{Number(inv.totalAmount).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                      ₹{Number(inv.paidAmount).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: Number(inv.balanceAmount) > 0 ? '#DC2626' : '#059669' }}>
                      ₹{Number(inv.balanceAmount).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(inv.dueDate).toLocaleDateString('en-GB')}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span
                        className="badge"
                        style={{
                          background: inv.status === 'PAID' ? '#D1FAE5' : inv.status === 'PARTIAL' ? '#FEF3C7' : '#FEE2E2',
                          color: inv.status === 'PAID' ? '#059669' : inv.status === 'PARTIAL' ? '#D97706' : '#DC2626',
                          fontWeight: '700',
                          fontSize: '11px'
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <Link
                        to={`/unilms/org/fees/collections?search=${inv.invoiceNumber}`}
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', textDecoration: 'none' }}
                      >
                        <i className="fa-solid fa-cash-register me-1"></i> Collect
                      </Link>
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
      </section>
    </>
  );
};

export default OrgFeesInvoicing;
