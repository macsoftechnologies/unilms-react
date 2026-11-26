import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import studentsService from '../../../services/students.service';
import academicsService from '../../../services/academics.service';

const OrgStudentsIndex = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [students, setStudents] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [cohortsList, setCohortsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editStudentId, setEditStudentId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const formatDateDisplay = (dateStr) => {
    if (!dateStr || dateStr === '—' || dateStr === '-') return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const [formData, setFormData] = useState({
    intake_type: 'LATERAL_DIPLOMA',
    roll_number: '',
    first_name: '',
    last_name: '',
    program_id: '',
    cohort_id: '',
    cohort_name: '',
    section_id: '',
    section_name: '',
    current_semester: 3,
    previous_institute: '',
    previous_qualifying_exam: 'State Board Technical Diploma (Polytechnic)',
    previous_marks_percentage: '',
    transfer_order_ref: '',
    email: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    gender: 'Male',
    dob: '2004-06-15',
    status: 'Active'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [stList, progs, chs, secs] = await Promise.all([
        studentsService.getStudents(),
        academicsService.getPrograms(),
        academicsService.getCohorts(),
        academicsService.getSections()
      ]);

      setProgramsList(Array.isArray(progs) ? progs : []);
      setCohortsList(Array.isArray(chs) ? chs : []);
      setSectionsList(Array.isArray(secs) ? secs : []);

      const normalized = (Array.isArray(stList) ? stList : []).map(s => ({
        id: s.id,
        roll_number: s.rollNumber || s.roll_number,
        first_name: s.firstName || s.first_name,
        last_name: s.lastName || s.last_name || '',
        program_id: s.programId || s.program_id,
        program_name: s.program?.name || s.programName || s.program_name || 'Undergraduate Degree',
        cohort_id: s.cohortId || s.cohort_id,
        cohort_name: s.cohort?.name || s.cohortName || s.cohort_name || 'Class of 2027',
        section_id: s.sectionId || s.section_id,
        section_name: s.section?.name || s.sectionName || s.section_name || '',
        current_semester: s.currentSemester || s.current_semester || 1,
        email: s.email || '—',
        phone: s.phone || '—',
        parent_name: s.parentName || s.parent_name || '—',
        parent_phone: s.parentPhone || s.parent_phone || '—',
        gender: s.gender || 'Male',
        dob: s.dob ? s.dob.split('T')[0] : (s.dob || '—'),
        status: s.status || 'Active'
      }));
      setStudents(normalized);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const openAddDrawer = () => {
    setEditStudentId(null);
    const count = students.length + 1;
    const prog = programsList.length > 0 ? programsList[0] : null;
    const progCode = prog?.code ? prog.code.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() : 'CSE';
    
    // Default to the cohort that accommodates lateral entry (e.g. 2025-2029 batch), or first cohort
    const targetCohort = cohortsList.find(c => c.name?.includes('2025')) || cohortsList[0] || null;
    const chSecs = targetCohort ? sectionsList.filter(s => s.cohortId === targetCohort.id) : sectionsList;
    const sec = chSecs.length > 0 ? chSecs[0] : (sectionsList[0] || null);

    setFormData({
      intake_type: 'LATERAL_DIPLOMA',
      roll_number: `25${progCode}L${String(count).padStart(2, '0')}`,
      first_name: '',
      last_name: '',
      program_id: prog?.id || '',
      cohort_id: targetCohort?.id || '',
      cohort_name: targetCohort?.name || '',
      section_id: sec?.id || '',
      section_name: sec?.name || '',
      current_semester: 3,
      previous_institute: '',
      previous_qualifying_exam: 'State Board Technical Diploma (Polytechnic)',
      previous_marks_percentage: '',
      transfer_order_ref: '',
      email: '',
      phone: '',
      parent_name: '',
      parent_phone: '',
      gender: 'Male',
      dob: '2004-06-15',
      status: 'Active'
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (st) => {
    setEditStudentId(st.id);
    setFormData({
      intake_type: (st.roll_number?.includes('L') ? 'LATERAL_DIPLOMA' : st.roll_number?.includes('T') ? 'COLLEGE_TRANSFER' : 'REGULAR_ADMISSION'),
      roll_number: st.roll_number || '',
      first_name: st.first_name || '',
      last_name: st.last_name || '',
      program_id: st.program_id || (programsList.length > 0 ? programsList[0].id : ''),
      cohort_id: st.cohort_id || (cohortsList.length > 0 ? cohortsList[0].id : ''),
      cohort_name: st.cohort_name || '',
      section_id: st.section_id || (sectionsList.length > 0 ? sectionsList[0].id : ''),
      section_name: st.section_name || '',
      current_semester: st.current_semester || 1,
      previous_institute: '',
      previous_qualifying_exam: 'State Board Technical Diploma (Polytechnic)',
      previous_marks_percentage: '',
      transfer_order_ref: '',
      email: st.email && st.email !== '—' ? st.email : '',
      phone: st.phone && st.phone !== '—' ? st.phone : '',
      parent_name: st.parent_name && st.parent_name !== '—' ? st.parent_name : '',
      parent_phone: st.parent_phone && st.parent_phone !== '—' ? st.parent_phone : '',
      gender: st.gender || 'Male',
      dob: st.dob && st.dob !== '—' ? st.dob : '',
      status: st.status || 'Active'
    });
    setIsDrawerOpen(true);
  };

  const handleIntakeTypeChange = (e) => {
    const intakeType = e.target.value;
    const count = students.length + 1;
    const progObj = programsList.find(p => p.id === formData.program_id);
    const progCode = progObj?.code ? progObj.code.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() : 'CSE';

    let roll = formData.roll_number;
    let sem = 3;
    let exam = 'State Board Technical Diploma (Polytechnic)';
    let targetCohort = cohortsList.find(c => c.name?.includes('2025')) || cohortsList[0];

    if (intakeType === 'LATERAL_DIPLOMA') {
      roll = `25${progCode}L${String(count).padStart(2, '0')}`;
      sem = 3;
      exam = 'State Board Technical Diploma (Polytechnic)';
    } else if (intakeType === 'COLLEGE_TRANSFER') {
      roll = `25${progCode}T${String(count).padStart(2, '0')}`;
      sem = 3;
      exam = 'Inter-University Transfer NOC / Equivalence Certificate';
    } else {
      roll = `26${progCode}${String(count).padStart(3, '0')}`;
      sem = 1;
      exam = '12th Standard Higher Secondary / Intermediate';
      targetCohort = cohortsList.find(c => c.name?.includes('2026')) || cohortsList[0];
    }

    const chSecs = targetCohort ? sectionsList.filter(s => s.cohortId === targetCohort.id) : sectionsList;

    setFormData(prev => ({
      ...prev,
      intake_type: intakeType,
      roll_number: !editStudentId ? roll : prev.roll_number,
      current_semester: sem,
      previous_qualifying_exam: exam,
      cohort_id: targetCohort?.id || prev.cohort_id,
      cohort_name: targetCohort?.name || prev.cohort_name,
      section_id: chSecs.length > 0 ? chSecs[0].id : prev.section_id,
      section_name: chSecs.length > 0 ? chSecs[0].name : prev.section_name
    }));
  };

  const handleProgramChange = (e) => {
    const progId = e.target.value;
    const progObj = programsList.find(p => p.id === progId);
    const progCode = progObj?.code ? progObj.code.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() : 'CSE';
    const count = students.length + 1;
    const matchingCohort = cohortsList.find(c => c.programId === progId);
    const matchingSecs = matchingCohort ? sectionsList.filter(s => s.cohortId === matchingCohort.id) : sectionsList;

    const prefix = formData.intake_type === 'LATERAL_DIPLOMA' ? `25${progCode}L${String(count).padStart(2, '0')}` :
                   formData.intake_type === 'COLLEGE_TRANSFER' ? `25${progCode}T${String(count).padStart(2, '0')}` :
                   `26${progCode}${String(count).padStart(3, '0')}`;

    setFormData(prev => ({
      ...prev,
      program_id: progId,
      program_name: progObj?.name || '',
      roll_number: !editStudentId ? prefix : prev.roll_number,
      cohort_id: matchingCohort ? matchingCohort.id : prev.cohort_id,
      cohort_name: matchingCohort ? matchingCohort.name : prev.cohort_name,
      section_id: matchingSecs.length > 0 ? matchingSecs[0].id : prev.section_id,
      section_name: matchingSecs.length > 0 ? matchingSecs[0].name : prev.section_name
    }));
  };

  const handleCohortChange = (e) => {
    const chId = e.target.value;
    const ch = cohortsList.find(c => c.id === chId);
    const matchingSecs = sectionsList.filter(s => s.cohortId === chId);
    setFormData(prev => ({
      ...prev,
      cohort_id: chId,
      cohort_name: ch?.name || '',
      section_id: matchingSecs.length > 0 ? matchingSecs[0].id : '',
      section_name: matchingSecs.length > 0 ? matchingSecs[0].name : ''
    }));
  };

  const fillSampleData = () => {
    const sampleNames = [
      { first: 'Suresh', last: 'Reddy', gender: 'Male', email: 'suresh.reddy@college.edu', parent: 'Venkat Reddy', poly: 'Govt Polytechnic College Hyderabad', percent: '82.4%', ref: 'ECET-LAT-2026-089' },
      { first: 'Pooja', last: 'Sharma', gender: 'Female', email: 'pooja.s@college.edu', parent: 'Manoj Sharma', poly: 'V.K. Polytechnic Institute', percent: '85.2%', ref: 'SBTET/LAT/2026/012' },
      { first: 'Rahul', last: 'Kulkarni', gender: 'Male', email: 'rahul.k@college.edu', parent: 'Anand Kulkarni', poly: 'Dr. B.R. Ambedkar Polytechnic', percent: '79.8%', ref: 'TRANSFER-UNIV-2026-44' }
    ];
    const pick = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    setFormData(prev => ({
      ...prev,
      first_name: pick.first,
      last_name: pick.last,
      gender: pick.gender,
      email: pick.email,
      phone: '+91 98765 ' + Math.floor(10000 + Math.random() * 90000),
      parent_name: pick.parent,
      parent_phone: '+91 98765 ' + Math.floor(10000 + Math.random() * 90000),
      previous_institute: pick.poly,
      previous_marks_percentage: pick.percent,
      transfer_order_ref: pick.ref
    }));
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!formData.roll_number.trim() || !formData.first_name.trim()) return;

    const isEdit = Boolean(editStudentId);
    const progObj = programsList.find(p => p.id === formData.program_id);

    const confirmed = await confirm({
      title: isEdit ? 'Confirm Update Student Record' : 'Confirm Register New Student',
      message: `${isEdit ? 'Save modifications for student' : 'Create new institutional student enrollment for'} "${formData.first_name} ${formData.last_name}"?`,
      details: [
        `Roll Number: ${formData.roll_number}`,
        `Candidate: ${formData.first_name} ${formData.last_name}`,
        `Program: ${progObj?.name || 'Selected Program'} (${progObj?.code || 'DEGREE'})`,
        `Current Semester: Semester ${formData.current_semester || 1}`,
        `Status: ${formData.status || 'Active'}`
      ],
      confirmText: isEdit ? 'Yes, Update Student' : 'Yes, Register Student',
      variant: isEdit ? 'primary' : 'success',
      icon: isEdit ? 'fa-solid fa-user-pen' : 'fa-solid fa-user-plus'
    });
    if (!confirmed) return;

    try {
      if (editStudentId) {
        await studentsService.updateStudent(editStudentId, {
          firstName: formData.first_name,
          lastName: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          programId: formData.program_id || null,
          cohortId: formData.cohort_id || null,
          sectionId: formData.section_id || null,
          currentSemester: formData.current_semester || 1,
          parentName: formData.parent_name,
          parentPhone: formData.parent_phone,
          gender: formData.gender,
          dob: formData.dob || null,
          status: formData.status
        });
        showToast(`Student record for ${formData.first_name} ${formData.last_name} updated successfully!`);
      } else {
        await studentsService.createStudent({
          rollNumber: formData.roll_number,
          firstName: formData.first_name,
          lastName: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          programId: formData.program_id || null,
          cohortId: formData.cohort_id || null,
          sectionId: formData.section_id || null,
          currentSemester: formData.current_semester || 1,
          parentName: formData.parent_name,
          parentPhone: formData.parent_phone,
          gender: formData.gender,
          dob: formData.dob || null,
          status: formData.status
        });
        showToast(`Student ${formData.first_name} ${formData.last_name} (${formData.roll_number}) registered successfully!`);
      }
      setIsDrawerOpen(false);
      loadData();
    } catch (err) {
      console.error('Save student error:', err);
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirm({
      title: 'Confirm Delete Student Profile',
      message: `Permanently delete student record for "${name}"?`,
      details: 'This action is irreversible and will remove all student enrollments, exam entries, and ledger links.',
      confirmText: 'Yes, Delete Student',
      variant: 'danger',
      icon: 'fa-solid fa-trash-can'
    });
    if (!confirmed) return;

    try {
      await studentsService.deleteStudent(id);
      showToast(`Student record for ${name} removed.`);
      loadData();
    } catch (err) {
      console.error('Delete student error:', err);
      alert('Failed to delete student.');
    }
  };

  const filteredStudents = students.filter(s => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      (s.roll_number && s.roll_number.toLowerCase().includes(query)) ||
      `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().includes(query) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.phone && s.phone.toLowerCase().includes(query));

    const matchesProgram = !filterProgram || String(s.program_id) === String(filterProgram);
    const matchesStatus = !filterStatus || s.status === filterStatus;

    return matchesSearch && matchesProgram && matchesStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedStudents,
    totalItems
  } = useTablePagination(filteredStudents, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterProgram, filterStatus, setCurrentPage]);

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* View Header */}
        {/* Top Header Card matching Reference UI (Image 1 & 2) */}
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
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
              }}
            >
              <i className="fa-solid fa-user-graduate"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Student Directory &amp; Central Academic Registry
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Master roster of active students, academic standing &amp; 360° performance
              </p>
            </div>
          </div>

          <div>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '6px 14px', 
              borderRadius: '20px', 
              background: 'rgba(59, 130, 246, 0.1)', 
              color: '#2563EB', 
              fontWeight: '700', 
              fontSize: '13px' 
            }}>
              <i className="fa-solid fa-user-graduate"></i>
              <span>{students.length} Enrolled Student{students.length !== 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div 
          style={{ 
            background: 'var(--card-bg, #fff)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '14px', 
            padding: '14px 18px', 
            marginBottom: '18px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input
                type="text"
                placeholder="Search by roll number, student name, email or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 38px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--input-bg, #f8fafc)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg, #fff)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                minWidth: '180px'
              }}
            >
              <option value="">All Degree Programs</option>
              {programsList.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg, #fff)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                minWidth: '140px'
              }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Promoted">Promoted</option>
              <option value="Detained">Detained</option>
              <option value="Graduated">Graduated</option>
            </select>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Showing {paginatedStudents.length} of {totalItems} enrolled student(s)
          </div>
        </div>

        {/* Data Table */}
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: 'var(--table-header-bg, #F8FAFC)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)' }}>Roll No</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)' }}>Student Name</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)' }}>Program &amp; Cohort</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)' }}>Contact</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)' }}>Guardian</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={7} rows={5} />
                ) : paginatedStudents.length > 0 ? (
                  paginatedStudents.map(st => (
                    <tr key={st.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '800', fontFamily: 'monospace', color: '#2563EB' }}>
                        {st.roll_number}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                            {st.first_name?.[0]}{st.last_name?.[0]}
                          </div>
                          <div>
                            <Link to={`/unilms/org/students/profile?id=${st.id}`} style={{ fontWeight: '700', color: 'var(--text-primary)', textDecoration: 'none' }}>
                              {st.first_name} {st.last_name}
                            </Link>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{st.gender} &bull; DOB: {formatDateDisplay(st.dob)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{st.program_name}</span>
                          {(st.current_semester >= 3 || (st.roll_number && (st.roll_number.includes('L') || st.roll_number.includes('T')))) && (
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '700',
                              background: 'rgba(124, 58, 237, 0.1)',
                              color: '#7C3AED',
                              border: '1px solid rgba(124, 58, 237, 0.2)'
                            }}>
                              {st.roll_number?.includes('T') ? 'Transfer' : 'Lateral'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {st.cohort_name}{st.section_name ? ` • ${st.section_name}` : ''} • Sem {st.current_semester}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div>{st.email}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{st.phone}</div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div>{st.parent_name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{st.parent_phone}</div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          background: st.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : st.status === 'Promoted' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: st.status === 'Active' ? '#059669' : st.status === 'Promoted' ? '#2563EB' : '#DC2626'
                        }}>
                          {st.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <Link
                            to={`/unilms/org/students/profile?id=${st.id}`}
                            className="btn-icon"
                            title="360 Student Profile"
                            style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                          >
                            <i className="fa-solid fa-eye" style={{ fontSize: '12px' }}></i>
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditDrawer(st)}
                            className="btn-icon"
                            title="Quick Edit"
                            style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(124, 58, 237, 0.1)', border: 'none', color: '#7C3AED', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <i className="fa-solid fa-pen" style={{ fontSize: '12px' }}></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(st.id, st.first_name)}
                            className="btn-icon"
                            title="Delete Student"
                            style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <i className="fa-solid fa-trash" style={{ fontSize: '12px' }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-user-graduate" style={{ fontSize: '36px', opacity: 0.3, marginBottom: '12px', display: 'block' }}></i>
                      No enrolled students found. Click <strong>Add Student</strong> or <strong>Full Form</strong> to register students.
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
          />
        </div>
      </section>

      {/* Add / Edit Student Drawer Modal */}
      <div 
        className={`drawer-overlay ${isDrawerOpen ? 'active' : ''}`} 
        style={{ 
          display: isDrawerOpen ? 'flex' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          justifyContent: 'flex-end',
          alignItems: 'stretch',
          zIndex: 99999,
          opacity: isDrawerOpen ? 1 : 0,
          pointerEvents: isDrawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease'
        }}
        onClick={(e) => {
          if (e.target.classList.contains('drawer-overlay')) setIsDrawerOpen(false);
        }}
      >
        <div 
          className="drawer-content" 
          style={{ 
            maxWidth: '620px',
            width: '100%',
            height: '100vh',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '-20px 0 50px rgba(0, 0, 0, 0.25)',
            borderTopLeftRadius: '20px',
            borderBottomLeftRadius: '20px',
            overflow: 'hidden'
          }}
        >
          <form onSubmit={handleSaveStudent} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Drawer Header */}
            <div 
              className="drawer-header" 
              style={{ 
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', 
                color: '#fff', 
                padding: '20px 24px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <i className="fa-solid fa-arrows-split-up-and-left"></i>
                  {editStudentId ? 'Edit Student Record' : 'Lateral Entry & Transfer Onboarding'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'rgba(255,255,255,0.85)' }}>
                  {editStudentId ? 'Modify academic details, contact info, and status' : 'Direct academic intake into ongoing cohorts (Semester 3+ Diploma/Transfers)'}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsDrawerOpen(false)} 
                style={{ 
                  color: '#fff', 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  border: 'none', 
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px', 
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="drawer-body" style={{ padding: '24px', overflowY: 'auto', flex: '1' }}>
              {!editStudentId && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                  <button 
                    type="button" 
                    onClick={fillSampleData} 
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderColor: '#7c3aed', color: '#7c3aed' }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i> Auto-fill Lateral Sample
                  </button>
                </div>
              )}

              {/* Section 1: Academic & Admission Track */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-id-card"></i> 1. Intake Track &amp; Academic Placement
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Intake Category *</label>
                    <select
                      value={formData.intake_type}
                      onChange={handleIntakeTypeChange}
                      className="form-control"
                      style={{ borderRadius: '8px', fontWeight: '600' }}
                    >
                      <option value="LATERAL_DIPLOMA">Lateral Entry (Diploma ➔ 2nd Year / Sem 3)</option>
                      <option value="COLLEGE_TRANSFER">Inter-University / College Transfer</option>
                      <option value="SPOT_ADMISSION">Direct Institutional Intake (Semester 1)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Roll / Admission No. *</label>
                    <input
                      type="text"
                      required
                      value={formData.roll_number}
                      onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                      className="form-control"
                      placeholder="e.g. 25CSEL01"
                      style={{ fontWeight: '700', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Degree Program *</label>
                    <select
                      value={formData.program_id}
                      onChange={handleProgramChange}
                      className="form-control"
                      style={{ borderRadius: '8px' }}
                    >
                      <option value="">-- Select Degree Program --</option>
                      {programsList.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Target Cohort / Batch</label>
                    <select
                      value={formData.cohort_id}
                      onChange={handleCohortChange}
                      className="form-control"
                      style={{ borderRadius: '8px' }}
                    >
                      <option value="">-- Select Cohort --</option>
                      {cohortsList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Class Section</label>
                    <select
                      value={formData.section_id}
                      onChange={(e) => {
                        const sec = sectionsList.find(s => s.id === e.target.value);
                        setFormData({ ...formData, section_id: e.target.value, section_name: sec?.name || '' });
                      }}
                      className="form-control"
                      style={{ borderRadius: '8px' }}
                    >
                      <option value="">-- Select Section --</option>
                      {sectionsList
                        .filter(s => !formData.cohort_id || !s.cohortId || s.cohortId === formData.cohort_id)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name} {s.maxStudents ? `(Cap: ${s.maxStudents})` : ''}</option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Entry Semester</label>
                    <select
                      value={formData.current_semester || 3}
                      onChange={(e) => setFormData({ ...formData, current_semester: parseInt(e.target.value, 10) })}
                      className="form-control"
                      style={{ borderRadius: '8px', fontWeight: '700', color: '#7C3AED' }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem} {sem === 3 ? '(Lateral Standard)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Enrollment Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Promoted">Promoted</option>
                      <option value="Detained">Detained</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Previous Institution & Transfer Record */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-graduation-cap"></i> 2. Previous Qualification &amp; Transfer Record
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Previous Polytechnic / College</label>
                    <input
                      type="text"
                      value={formData.previous_institute}
                      onChange={(e) => setFormData({ ...formData, previous_institute: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Govt Polytechnic Hyderabad"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Qualifying Exam Stream</label>
                    <input
                      type="text"
                      value={formData.previous_qualifying_exam}
                      onChange={(e) => setFormData({ ...formData, previous_qualifying_exam: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Diploma in Computer Engineering"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Diploma Marks % / CGPA</label>
                    <input
                      type="text"
                      value={formData.previous_marks_percentage}
                      onChange={(e) => setFormData({ ...formData, previous_marks_percentage: e.target.value })}
                      className="form-control"
                      placeholder="e.g. 82.5%"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>NOC / Allotment Reference No.</label>
                    <input
                      type="text"
                      value={formData.transfer_order_ref}
                      onChange={(e) => setFormData({ ...formData, transfer_order_ref: e.target.value })}
                      className="form-control"
                      placeholder="e.g. ECET-LAT-2026-089"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Biographical */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-user"></i> 2. Student Biographical Data
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="form-control"
                      placeholder="First Name"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="form-control"
                      placeholder="Last Name"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Contact & Parents */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-address-book"></i> 3. Contact & Guardian Details
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Student Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-control"
                      placeholder="student@college.edu"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Student Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="form-control"
                      placeholder="+91 98765 43210"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Parent / Guardian Name</label>
                    <input
                      type="text"
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Ramesh Verma"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '5px', display: 'block' }}>Parent Contact</label>
                    <input
                      type="text"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                      className="form-control"
                      placeholder="+91 98765 00001"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div 
              className="drawer-footer" 
              style={{ 
                padding: '16px 24px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderTop: '1px solid var(--border-color)',
                background: '#f8fafc',
                flexShrink: 0
              }}
            >
              <button 
                type="button" 
                onClick={() => setIsDrawerOpen(false)} 
                className="btn btn-outline" 
                style={{ borderRadius: '8px', fontWeight: '600', padding: '9px 18px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', 
                  border: 'none', 
                  padding: '10px 24px', 
                  borderRadius: '8px', 
                  fontWeight: '700', 
                  color: '#fff', 
                  cursor: 'pointer', 
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-check"></i>
                {editStudentId ? 'Save Changes' : 'Confirm Lateral / Transfer Onboarding'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default OrgStudentsIndex;