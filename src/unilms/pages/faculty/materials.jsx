import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../components';
import academicsService from '../../services/academics.service';

const FacultyMaterials = ({ defaultView = 'list' }) => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('create') === 'true' || defaultView === 'create' ? 'create' : 'list';

  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Master Data
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // 4-Tier Filter States
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState('ALL');
  const [selectedCohortId, setSelectedCohortId] = useState('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // View & Form States
  const [viewMode, setViewMode] = useState(initialMode); // 'list' | 'create'
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const emptyFormState = {
    dept_id: '',
    program_id: '',
    cohort_id: '',
    subject_id: '',
    title: '',
    description: '',
    type: 'file',
    url: '',
    file_name: '',
    is_active: true
  };
  const [formData, setFormData] = useState(emptyFormState);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, cohortRes, subRes, matRes] = await Promise.allSettled([
        academicsService.getDepartments(),
        academicsService.getPrograms(),
        academicsService.getCohorts(),
        academicsService.getSubjects(),
        academicsService.getStudyMaterials(),
      ]);

      const dList = deptRes.status === 'fulfilled' && Array.isArray(deptRes.value) ? deptRes.value : [];
      const pList = progRes.status === 'fulfilled' && Array.isArray(progRes.value) ? progRes.value : [];
      const cList = cohortRes.status === 'fulfilled' && Array.isArray(cohortRes.value) ? cohortRes.value : [];
      const sList = subRes.status === 'fulfilled' && Array.isArray(subRes.value) ? subRes.value : [];
      const mList = matRes.status === 'fulfilled' && Array.isArray(matRes.value) ? matRes.value : [];

      setDepartments(dList);
      setPrograms(pList);
      setCohorts(cList);
      setSubjects(sList);

      const combined = mList.map((m) => {
        const sub = m.subject || sList.find(s => s.id === m.subjectId) || {};
        const coh = m.cohort || cList.find(c => c.id === m.cohortId) || {};
        const prog = pList.find(p => p.id === coh.programId) || {};
        const dept = dList.find(d => d.id === prog.departmentId || d.id === sub.departmentId) || {};

        return {
          id: m.id,
          title: m.title,
          description: m.description || '',
          subject_id: m.subjectId || sub.id,
          subject_code: sub.code || 'CS101',
          subject_name: sub.name || 'Course Subject',
          department_id: dept.id || '',
          department_name: dept.name || 'Computer Science & Engineering',
          program_id: prog.id || '',
          program_name: prog.name || 'B.Tech CSE',
          cohort_id: m.cohortId || coh.id || '',
          cohort_name: coh.name || 'General Degree Batch',
          type: m.type === 'file' ? 'PDF Document' : (m.type === 'youtube' ? 'YouTube Video' : 'External Link'),
          raw_type: m.type || 'file',
          file_name: m.fileName || 'Material.pdf',
          url: m.fileUrl || '',
          uploaded_by: m.uploadedBy || 'Course Faculty User',
          is_active: m.status === 'active',
          status: m.status === 'active' ? 'Visible' : 'Hidden',
          created_at: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '2026-09-15'
        };
      });

      setMaterials(combined);
    } catch (e) {
      console.warn('Failed to load study materials:', e.message);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter cascades
  const filteredPrograms = programs.filter(p => {
    if (selectedDeptId === 'ALL') return true;
    return p.departmentId === selectedDeptId || p.department?.id === selectedDeptId;
  });

  const filteredCohorts = cohorts.filter(c => {
    if (selectedProgramId === 'ALL') return true;
    return c.programId === selectedProgramId;
  });

  const filteredSubjects = subjects.filter(s => {
    if (selectedDeptId !== 'ALL' && s.departmentId && s.departmentId !== selectedDeptId) return false;
    return true;
  });

  const handleDeptFilterChange = (deptId) => {
    setSelectedDeptId(deptId);
    setSelectedProgramId('ALL');
    setSelectedCohortId('ALL');
    setSelectedSubjectId('ALL');
  };

  const handleProgramFilterChange = (progId) => {
    setSelectedProgramId(progId);
    setSelectedCohortId('ALL');
    setSelectedSubjectId('ALL');
  };

  // Final filtered list
  const filteredMaterials = materials.filter(m => {
    if (selectedDeptId !== 'ALL' && m.department_id && m.department_id !== selectedDeptId) return false;
    if (selectedProgramId !== 'ALL' && m.program_id && m.program_id !== selectedProgramId) return false;
    if (selectedCohortId !== 'ALL' && m.cohort_id && m.cohort_id !== selectedCohortId) return false;
    if (selectedSubjectId !== 'ALL' && m.subject_id !== selectedSubjectId && m.subject_code !== selectedSubjectId) return false;
    if (selectedType !== 'ALL' && m.raw_type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title?.toLowerCase().includes(q);
      const matchSub = m.subject_name?.toLowerCase().includes(q) || m.subject_code?.toLowerCase().includes(q);
      const matchDesc = m.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchSub && !matchDesc) return false;
    }
    return true;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedMaterials,
    totalItems
  } = useTablePagination(filteredMaterials, 10);

  // Form Handlers
  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setFormData({
      ...emptyFormState,
      dept_id: departments[0]?.id || '',
      program_id: programs[0]?.id || '',
      cohort_id: cohorts[0]?.id || '',
      subject_id: subjects[0]?.id || ''
    });
    setErrorMsg(null);
    setViewMode('create');
  };

  const handleOpenEdit = (m) => {
    setEditingMaterial(m);
    setErrorMsg(null);
    setFormData({
      dept_id: m.department_id || departments[0]?.id || '',
      program_id: m.program_id || programs[0]?.id || '',
      cohort_id: m.cohort_id || cohorts[0]?.id || '',
      subject_id: m.subject_id || m.subject_code || subjects[0]?.id || '',
      title: m.title || '',
      description: m.description || '',
      type: m.raw_type || 'file',
      url: m.url || '',
      file_name: m.file_name || '',
      is_active: m.is_active !== undefined ? m.is_active : true
    });
    setViewMode('create');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg('Please enter a Title.');
      return;
    }
    if (!formData.subject_id) {
      setErrorMsg('Please select a Subject.');
      return;
    }

    const sub = subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id) || subjects[0] || {
      id: 'sub-gen',
      code: 'CS101',
      name: 'Operating Systems'
    };
    const coh = cohorts.find(c => c.id === formData.cohort_id) || cohorts[0] || { id: 'coh-gen', name: 'Batch 2026' };
    const dept = departments.find(d => d.id === formData.dept_id) || departments[0] || { id: 'dept-gen', name: 'Computer Science' };
    const prog = programs.find(p => p.id === formData.program_id) || programs[0] || { id: 'prog-gen', name: 'B.Tech CSE' };

    const typeLabel = formData.type === 'file'
      ? 'PDF Document'
      : (formData.type === 'youtube' ? 'YouTube Video' : 'External Link');

    const confirmed = await confirm({
      title: editingMaterial ? 'Confirm Update Material' : 'Confirm Upload Study Material',
      message: `Are you sure you want to ${editingMaterial ? 'save updates to' : 'publish'} "${formData.title.trim()}"?`,
      details: [
        `Course Subject: ${sub.code} - ${sub.name}`,
        `Target Cohort: ${coh.name}`,
        `Modality: ${typeLabel}`
      ],
      confirmText: editingMaterial ? 'Yes, Update' : 'Yes, Upload & Publish',
      variant: editingMaterial ? 'primary' : 'success'
    });
    if (!confirmed) return;

    if (editingMaterial) {
      const updatedFields = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject_id: sub.id,
        subject_code: sub.code,
        subject_name: sub.name,
        department_id: dept.id,
        department_name: dept.name,
        program_id: prog.id,
        program_name: prog.name,
        cohort_id: coh.id,
        cohort_name: coh.name,
        type: typeLabel,
        raw_type: formData.type,
        file_name: formData.file_name || editingMaterial.file_name || 'Document.pdf',
        url: formData.url,
        is_active: formData.is_active,
        status: formData.is_active ? 'Visible' : 'Hidden'
      };

      try {
        await academicsService.updateStudyMaterial(editingMaterial.id, {
          subjectId: sub.id,
          cohortId: coh.id || null,
          title: formData.title.trim(),
          description: formData.description.trim(),
          type: formData.type,
          fileUrl: formData.url || (formData.type === 'file' ? `https://storage.unilms.edu/${formData.file_name || 'document.pdf'}` : ''),
          fileName: formData.file_name || (formData.type === 'file' ? 'Course_Notes.pdf' : 'Resource_Link'),
          status: formData.is_active ? 'active' : 'hidden',
        });
        showToast(`Study material "${formData.title}" updated successfully!`);
      } catch (err) {
        console.warn('Backend updateStudyMaterial failed:', err.message);
        showToast(`Failed to update study material: ${err.message}`);
      }
      await loadData();
    } else {
      try {
        await academicsService.createStudyMaterial({
          subjectId: sub.id,
          cohortId: coh.id || null,
          title: formData.title.trim(),
          description: formData.description.trim(),
          type: formData.type,
          fileUrl: formData.url || (formData.type === 'file' ? `https://storage.unilms.edu/${formData.file_name || 'document.pdf'}` : ''),
          fileName: formData.file_name || (formData.type === 'file' ? 'Course_Notes.pdf' : 'Resource_Link'),
          uploadedBy: 'Course Faculty User',
          status: formData.is_active ? 'active' : 'hidden',
        });
        showToast(`Study material "${formData.title}" uploaded to learning repository!`);
      } catch (err) {
        console.warn('Backend createStudyMaterial failed:', err.message);
        showToast(`Failed to upload study material: ${err.message}`);
      }
      await loadData();
    }

    setViewMode('list');
    setEditingMaterial(null);
    setFormData(emptyFormState);
  };

  const handleDelete = async (id, title) => {
    const confirmed = await confirm({
      title: 'Confirm Delete Study Material',
      message: `Are you sure you want to permanently delete "${title}"?`,
      details: 'This will remove the handout file or resource link for all enrolled students.',
      confirmText: 'Yes, Delete Material',
      cancelText: 'Keep Material',
      variant: 'danger',
      icon: 'fa-solid fa-trash-can'
    });
    if (!confirmed) return;

    try {
      await academicsService.deleteStudyMaterial(id);
      showToast(`Study material "${title}" removed.`);
    } catch (e) {
      console.warn('Backend deleteStudyMaterial failed:', e.message);
      showToast(`Failed to delete study material: ${e.message}`);
    }
    await loadData();
  };

  return (
    <section className="view-section active">
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

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

      {viewMode === 'create' ? (
        /* Dedicated Upload Study Material Form */
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '30px' }}>
          {errorMsg && (
            <div style={{ background: '#EF4444', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              {errorMsg}
            </div>
          )}

          {/* Form Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                {editingMaterial ? 'Edit Study Material' : 'Upload Study Material'}
              </h2>
              <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '13px', margin: '4px 0 0' }}>
                Distribute lecture notes, lab manuals, and supplementary video links to enrolled student cohorts.
              </p>
            </div>
            <button
              onClick={() => { setViewMode('list'); setEditingMaterial(null); }}
              className="btn btn-outline"
              style={{
                background: '#fff',
                padding: '8px 18px',
                borderRadius: '8px',
                fontWeight: '600',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-arrow-left"></i> Back to Materials
            </button>
          </div>

          <div
            style={{
              background: 'var(--card-bg, #fff)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}
          >
            <form onSubmit={handleFormSubmit}>
              {/* Row 1: Cascading Department & Degree Program */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                    1. Academic Department
                  </label>
                  <select
                    value={formData.dept_id}
                    onChange={(e) => setFormData({ ...formData, dept_id: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '14px' }}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                    2. Degree Program
                  </label>
                  <select
                    value={formData.program_id}
                    onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '14px' }}
                  >
                    <option value="">-- Select Program --</option>
                    {programs
                      .filter(p => !formData.dept_id || p.departmentId === formData.dept_id || p.department?.id === formData.dept_id)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Cascading Cohort & Course Subject */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                    3. Target Cohort / Admitted Batch
                  </label>
                  <select
                    value={formData.cohort_id}
                    onChange={(e) => setFormData({ ...formData, cohort_id: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '14px' }}
                    required
                  >
                    <option value="">-- Select Cohort --</option>
                    {cohorts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                    4. Curriculum Subject
                  </label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '14px' }}
                    required
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Title */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                  Material Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unit 3: Process Synchronization, Mutexes & Semaphores"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 14px', fontSize: '14px' }}
                  required
                />
              </div>

              {/* Row 4: Description */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                  Content Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide syllabus context, prerequisites, or reading instructions for students..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px 14px', fontSize: '14px' }}
                />
              </div>

              {/* Row 5: Type Selection */}
              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                  Resource Modality
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'file', label: 'File Upload (PDF / Doc / PPT)', icon: 'fa-file-pdf', color: '#DC2626' },
                    { key: 'youtube', label: 'YouTube Video Screencast', icon: 'fa-youtube', color: '#EF4444' },
                    { key: 'link', label: 'External Cloud Link / Docs', icon: 'fa-link', color: '#2563EB' }
                  ].map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t.key })}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: formData.type === t.key ? `2px solid ${t.color}` : '1px solid #cbd5e1',
                        background: formData.type === t.key ? `${t.color}10` : '#fff',
                        color: formData.type === t.key ? t.color : '#475569',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className={`fa-solid ${t.icon}`}></i>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 6: File or URL Input */}
              {formData.type === 'file' ? (
                <div className="form-group" style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                    Upload File Attachment (Max 25MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setFormData({ ...formData, file_name: file.name });
                      }
                    }}
                    className="form-control"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                  />
                  {formData.file_name && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                      <i className="fa-solid fa-check"></i> Selected file: {formData.file_name}
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                    {formData.type === 'youtube' ? 'YouTube Video URL' : 'External Web / Cloud Resource URL'}
                  </label>
                  <input
                    type="url"
                    placeholder={formData.type === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://...'}
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 14px', fontSize: '14px' }}
                    required
                  />
                </div>
              )}

              {/* Row 7: Visibility Toggle */}
              <div className="form-group" style={{ marginTop: '16px', marginBottom: '26px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#7C3AED', cursor: 'pointer' }}
                  />
                  Publish immediately and grant access to enrolled students
                </label>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setViewMode('list'); setEditingMaterial(null); }}
                  className="btn btn-outline"
                  style={{ padding: '9px 24px', borderRadius: '8px', fontWeight: '600', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '9px 28px', borderRadius: '8px', background: '#7C3AED', border: 'none', color: '#fff', fontWeight: '700', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  {editingMaterial ? 'Update Material' : 'Upload to Content Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Table List View */
        <>
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
                  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
                }}
              >
                <i className="fa-solid fa-book-open"></i>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                    Study Materials &amp; Content Library
                  </h2>
                  <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                    MODULE 05: LMS
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '13px', margin: '4px 0 0' }}>
                  Manage course syllabus, lecture handouts, lab manuals, and video resources across departments and cohorts.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="btn btn-primary"
                style={{
                  background: '#7C3AED',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)'
                }}
              >
                <i className="fa-solid fa-cloud-arrow-up"></i> Upload Material
              </button>
            </div>
          </div>

          {/* KPI Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '22px' }}>
            <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Materials</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{materials.length}</div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <i className="fa-solid fa-book-bookmark"></i>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>PDF Lecture Notes</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>
                  {materials.filter(m => m.raw_type === 'file' || m.type?.toLowerCase().includes('pdf')).length}
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <i className="fa-solid fa-file-pdf"></i>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Video Lessons</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>
                  {materials.filter(m => m.raw_type === 'youtube').length}
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <i className="fa-solid fa-video"></i>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Student Access</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                  {materials.filter(m => m.is_active).length} Live
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <i className="fa-solid fa-circle-check"></i>
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
              <span>4-Tier Cascading Filter Bar</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {/* Tier 1: Department */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  1. DEPARTMENT
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => handleDeptFilterChange(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              {/* Tier 2: Degree Program */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  2. DEGREE PROGRAM
                </label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => handleProgramFilterChange(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="ALL">All Programs</option>
                  {filteredPrograms.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              {/* Tier 3: Cohort / Admitted Batch */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  3. ADMITTED BATCH / COHORT
                </label>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="ALL">All Cohorts / Batches</option>
                  {filteredCohorts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Tier 4: Course Subject */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  4. COURSE SUBJECT
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="ALL">All Subjects</option>
                  {filteredSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              {/* Modality Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  RESOURCE TYPE
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="ALL">All Modalities</option>
                  <option value="file">PDF / Documents</option>
                  <option value="youtube">YouTube Videos</option>
                  <option value="link">External Links</option>
                </select>
              </div>

              {/* Search Box */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  SEARCH TITLE / CODE
                </label>
                <div style={{ position: 'relative' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8', fontSize: '13px' }}></i>
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', height: '38px', borderRadius: '8px', paddingLeft: '34px', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            {/* Active Filters Pill Bar */}
            {(selectedDeptId !== 'ALL' || selectedProgramId !== 'ALL' || selectedCohortId !== 'ALL' || selectedSubjectId !== 'ALL' || selectedType !== 'ALL' || searchQuery.trim()) && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Active Filters:</span>
                  {selectedDeptId !== 'ALL' && (
                    <span className="badge" style={{ background: '#EDE9FE', color: '#6D28D9', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' }}>
                      Dept: {departments.find(d => d.id === selectedDeptId)?.name}
                    </span>
                  )}
                  {selectedProgramId !== 'ALL' && (
                    <span className="badge" style={{ background: '#DBEAFE', color: '#1D4ED8', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' }}>
                      Program: {programs.find(p => p.id === selectedProgramId)?.name}
                    </span>
                  )}
                  {selectedCohortId !== 'ALL' && (
                    <span className="badge" style={{ background: '#DCFCE7', color: '#15803D', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' }}>
                      Cohort: {cohorts.find(c => c.id === selectedCohortId)?.name}
                    </span>
                  )}
                  {selectedSubjectId !== 'ALL' && (
                    <span className="badge" style={{ background: '#FEF3C7', color: '#B45309', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' }}>
                      Subject: {subjects.find(s => s.id === selectedSubjectId || s.code === selectedSubjectId)?.name}
                    </span>
                  )}
                  {selectedType !== 'ALL' && (
                    <span className="badge" style={{ background: '#FCE7F3', color: '#BE185D', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' }}>
                      Type: {selectedType.toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedDeptId('ALL');
                    setSelectedProgramId('ALL');
                    setSelectedCohortId('ALL');
                    setSelectedSubjectId('ALL');
                    setSelectedType('ALL');
                    setSearchQuery('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#DC2626', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <i className="fa-solid fa-rotate-left"></i> Reset All
                </button>
              </div>
            )}
          </div>

          {/* Materials Table */}
          <div className="table-responsive" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '780px', margin: 0 }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>DOCUMENT / TITLE</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>SUBJECT &amp; COHORT</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>TYPE</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>STATUS</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>UPLOADED BY</th>
                  <th style={{ textAlign: 'right', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                ) : paginatedMaterials.length > 0 ? (
                  paginatedMaterials.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 20px', maxWidth: '300px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>
                          {m.title}
                        </div>
                        {m.description && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.description}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                          <i className="fa-solid fa-clock"></i> {m.created_at || 'Recently added'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#7C3AED', fontSize: '13px' }}>
                          {m.subject_code} - {m.subject_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          <i className="fa-solid fa-users" style={{ marginRight: '4px', opacity: 0.6 }}></i>
                          {m.cohort_name}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {m.raw_type === 'youtube' ? (
                          <span className="badge" style={{ background: '#FEE2E2', color: '#DC2626', fontWeight: '600', padding: '5px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                            <i className="fa-brands fa-youtube"></i> Video
                          </span>
                        ) : m.raw_type === 'link' ? (
                          <span className="badge" style={{ background: '#DBEAFE', color: '#2563EB', fontWeight: '600', padding: '5px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                            <i className="fa-solid fa-link"></i> Web Link
                          </span>
                        ) : (
                          <span className="badge" style={{ background: '#EDE9FE', color: '#7C3AED', fontWeight: '600', padding: '5px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                            <i className="fa-solid fa-file-pdf"></i> PDF Document
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {m.is_active ? (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-solid fa-circle-check"></i> Live
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#64748b', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px' }}>
                            Hidden
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <i className="fa-solid fa-user-tie" style={{ marginRight: '6px', color: '#94a3b8' }}></i>
                        {m.uploaded_by || 'Faculty'}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {m.url && (
                            <a
                              href={m.url}
                              target="_blank"
                              rel="noreferrer"
                              title="Open External Resource"
                              className="btn btn-outline"
                              style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: '#2563EB', borderColor: '#BFDBFE' }}
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenEdit(m)}
                            title="Edit Material"
                            className="btn btn-outline"
                            style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: '#7C3AED', borderColor: '#DDD6FE' }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(m.id, m.title)}
                            title="Delete Material"
                            className="btn btn-outline"
                            style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: '#DC2626', borderColor: '#FECACA' }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-folder-open" style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.5, display: 'block' }}></i>
                      No study materials found matching selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px' }}>
            <TablePagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
              totalItems={totalItems}
            />
          </div>
        </>
      )}
    </section>
  );
};

export default FacultyMaterials;