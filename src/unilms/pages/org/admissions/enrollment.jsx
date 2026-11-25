import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import admissionsService from '../../../services/admissions.service';
import academicsService from '../../../services/academics.service';

const OrgAdmissionsEnrollment = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState('PENDING'); // 'PENDING' or 'ENROLLED'
  const [toastMsg, setToastMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Academics integration
  const [cohortsList, setCohortsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [cohortId, setCohortId] = useState('');
  const [sectionId, setSectionId] = useState('');

  // Form enrollment fields
  const [rollNumber, setRollNumber] = useState('');
  const [instituteEmail, setInstituteEmail] = useState('');
  const [sendCredentials, setSendCredentials] = useState(true);

  const loadAcademicsData = async () => {
    try {
      const [cohorts, sections] = await Promise.all([
        academicsService.getCohorts(),
        academicsService.getSections()
      ]);
      setCohortsList(Array.isArray(cohorts) ? cohorts : []);
      setSectionsList(Array.isArray(sections) ? sections : []);
      if (Array.isArray(cohorts) && cohorts.length > 0) setCohortId(cohorts[0].id);
      if (Array.isArray(sections) && sections.length > 0) setSectionId(sections[0].id);
    } catch (e) {
      console.warn('Failed to load cohorts/sections:', e);
    }
  };

  const loadCandidates = async () => {
    try {
      setIsLoading(true);
      const apps = await admissionsService.getApplications();
      const list = (Array.isArray(apps) ? apps : []).map(a => ({
        id: a.id,
        adm_number: a.applicationNumber || a.adm_number,
        full_name: a.fullName || a.full_name,
        email: a.email,
        phone: a.phone,
        program_id: a.programId,
        program_name: a.programName || a.program?.name || 'Undergraduate Degree',
        offer_status: a.status === 'Enrolled' ? 'Enrolled' : (a.offerLetterSent ? 'Offer Accepted' : a.status),
        fee_status: 'Paid in Full (₹85,000)',
        receipt_no: `RCP-${a.id.slice(0, 8)}`,
        is_enrolled: a.status === 'Enrolled',
        roll_number: a.rollNumber || '',
        section: a.section?.name || 'Section A',
        batch: a.cohort?.name || '2026 - 2030 Batch'
      }));
      setCandidates(list);
    } catch (err) {
      console.error('Failed to load candidate applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
    loadAcademicsData();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenEnrollModal = (candidate) => {
    setSelectedCandidate(candidate);
    
    // Auto generate roll number suggestion
    const initials = candidate.program_name.includes('Computer') ? 'CSE' :
                     candidate.program_name.includes('MBA') ? 'MBA' :
                     candidate.program_name.includes('BBA') ? 'BBA' : 'UG';
    const randNum = String(Math.floor(10 + Math.random() * 89));
    setRollNumber(`2026-${initials}-${randNum}`);

    const sanitizedName = candidate.full_name.toLowerCase().replace(/[^a-z]/g, '.');
    setInstituteEmail(`${sanitizedName}@unilms.edu`);
    
    // Select matching or first cohort from Academics
    if (cohortsList.length > 0) {
      const match = cohortsList.find(c => c.programId === candidate.program_id) || cohortsList[0];
      setCohortId(match.id);
    }
    if (sectionsList.length > 0) {
      setSectionId(sectionsList[0].id);
    }
    setSendCredentials(true);
    setIsModalOpen(true);
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    try {
      await admissionsService.enrollApplication(selectedCandidate.id, {
        rollNumber,
        cohortId,
        sectionId,
        email: instituteEmail
      });
      setIsModalOpen(false);
      showToast(`🎉 ${selectedCandidate.full_name} enrolled successfully! Roll No: ${rollNumber}`);
      await loadCandidates();
    } catch (err) {
      console.error('Enrollment error:', err);
      alert('Enrollment failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const pendingCount = candidates.filter((c) => !c.is_enrolled).length;
  const enrolledCount = candidates.filter((c) => c.is_enrolled).length;

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.adm_number.toLowerCase().includes(search.toLowerCase()) ||
      c.program_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.roll_number && c.roll_number.toLowerCase().includes(search.toLowerCase()));

    const matchesTab =
      tabFilter === 'PENDING' ? !c.is_enrolled : c.is_enrolled;

    return matchesSearch && matchesTab;
  });

  const pagination = useTablePagination(filteredCandidates, 10);

  return (
    <div className="enrollment-page-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 10000,
            background: '#10B981',
            color: '#fff',
            padding: '12px 22px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '600',
            animation: 'modalFadeIn 0.2s ease'
          }}
        >
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      <section className="view-section active">
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
                background: 'linear-gradient(135deg, #059669, #0D9488)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
              }}
            >
              <i className="fa-solid fa-user-plus"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Final Student Enrollment &amp; Matriculation
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Applications with accepted offers &amp; cleared dues ready for section assignment &amp; roll numbers &bull; AY 2026&ndash;2027
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setTabFilter('PENDING')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: tabFilter === 'PENDING' ? '#0D9488' : 'var(--border-color)',
                background: tabFilter === 'PENDING' ? '#0D9488' : 'var(--card-bg, #fff)',
                color: tabFilter === 'PENDING' ? '#FFFFFF' : 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-clock"></i>
              <span>Ready for Enrollment ({candidates.filter((c) => c.status === 'Ready for Enrollment').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setTabFilter('MATRICULATED')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: tabFilter === 'MATRICULATED' ? '#0D9488' : 'var(--border-color)',
                background: tabFilter === 'MATRICULATED' ? '#0D9488' : 'var(--card-bg, #fff)',
                color: tabFilter === 'MATRICULATED' ? '#FFFFFF' : 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-circle-check"></i>
              <span>Matriculated ({candidates.filter((c) => c.status === 'Matriculated').length})</span>
            </button>
          </div>
        </div>

        {/* Statistical KPI Cards - Modern Compact Reference Cards */}
        <div className="faculty-kpi-grid">
          {/* Card 1: Ready for Enrollment */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <i className="fa-solid fa-user-clock"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Ready for Enrollment</div>
              <div className="faculty-metric-value" style={{ color: '#D97706' }}>{pendingCount}</div>
              <div className="faculty-metric-sub" style={{ color: '#D97706' }}>
                <i className="fa-solid fa-hourglass-half"></i>
                <span>Dues cleared &amp; verified</span>
              </div>
            </div>
          </div>

          {/* Card 2: Enrolled Students */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <i className="fa-solid fa-user-graduate"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Enrolled Students</div>
              <div className="faculty-metric-value" style={{ color: '#059669' }}>{enrolledCount}</div>
              <div className="faculty-metric-sub" style={{ color: '#059669' }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>Active LMS profiles</span>
              </div>
            </div>
          </div>

          {/* Card 3: Approved Intake Quota */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' }}>
              <i className="fa-solid fa-building-columns"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Approved Intake Quota</div>
              <div className="faculty-metric-value" style={{ color: '#2563EB' }}>300</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Across all programs</span>
              </div>
            </div>
          </div>

          {/* Card 4: Remaining Seats */}
          <div className="faculty-metric-card">
            <div className="faculty-metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
              <i className="fa-solid fa-chair"></i>
            </div>
            <div className="faculty-metric-info">
              <div className="faculty-metric-label">Remaining Seats</div>
              <div className="faculty-metric-value" style={{ color: '#7C3AED' }}>{300 - enrolledCount}</div>
              <div className="faculty-metric-sub" style={{ color: 'var(--text-secondary, #64748b)' }}>
                <span>Open for admissions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div style={{ marginBottom: '16px', maxWidth: '380px' }}>
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
            <input
              type="text"
              placeholder="Search candidate, program, or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px', borderRadius: '10px', fontSize: '13.5px', width: '100%' }}
            />
          </div>
        </div>

        {/* Enrollment Candidates Table */}
        <div className="table-container" style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '14px', border: '1px solid var(--border-color)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #F8FAFC)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>App Number</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicant Name</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Program / Degree</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Offer &amp; Payment Status</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {tabFilter === 'PENDING' ? 'Status' : 'Roll No. & Section'}
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonLoader columns={6} rows={5} />
              ) : pagination.paginatedItems.length > 0 ? (
                pagination.paginatedItems.map((cand) => (
                  <tr key={cand.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <strong style={{ color: '#7C3AED', fontSize: '13.5px' }}>{cand.adm_number}</strong>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{cand.full_name}</strong>
                      <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>{cand.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13.5px' }}>
                      {cand.program_name}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ color: '#059669', fontSize: '12.5px', fontWeight: '600' }}>
                          <i className="fa-solid fa-circle-check me-1"></i> {cand.offer_status}
                        </span>
                        <small style={{ color: '#6B7280', fontSize: '11.5px' }}>
                          {cand.fee_status} ({cand.receipt_no})
                        </small>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      {cand.is_enrolled ? (
                        <div>
                          <strong style={{ color: '#1E293B', fontSize: '13.5px' }}>{cand.roll_number}</strong>
                          <div style={{ color: '#6B7280', fontSize: '12px' }}>{cand.section} ({cand.batch})</div>
                        </div>
                      ) : (
                        <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
                          Ready to Enroll
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      {cand.is_enrolled ? (
                        <span style={{ color: '#10B981', fontWeight: '600', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <i className="fa-solid fa-id-card"></i> Enrolled
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEnrollModal(cand)}
                          className="btn btn-primary btn-sm"
                          style={{
                            padding: '7px 16px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#7C3AED',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                          }}
                        >
                          <i className="fa-solid fa-user-check"></i>
                          <span>Enroll Student</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-user-graduate" style={{ fontSize: '32px', opacity: 0.3, marginBottom: '10px', display: 'block' }}></i>
                    No candidates found in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <TablePagination {...pagination} itemName="candidates" />
        </div>
      </section>

      {/* ================= RIGHT-SIDE OFFCANVAS DRAWER: ENROLL STUDENT ================= */}
      <div
        className={`drawer-overlay ${isModalOpen ? 'active' : ''}`}
        id="enrollModal"
        onClick={(e) => {
          if (e.target.id === 'enrollModal') setIsModalOpen(false);
        }}
        style={{ zIndex: 9999 }}
      >
        <div
          className="drawer-content"
          style={{
            maxWidth: '560px',
            borderTopLeftRadius: '24px',
            borderBottomLeftRadius: '24px',
            background: '#FFFFFF'
          }}
        >
          {selectedCandidate && (
            <form onSubmit={handleEnrollSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Drawer Header */}
              <div
                className="drawer-header"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  color: '#FFFFFF',
                  padding: '22px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTopLeftRadius: '24px',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-user-check"></i> Final Student Matriculation
                  </h3>
                  <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                    Candidate: {selectedCandidate.full_name} ({selectedCandidate.adm_number})
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.22)',
                    border: 'none',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  title="Close"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Drawer Body */}
              <div className="drawer-body" style={{ flexGrow: 1, padding: '26px 28px', background: '#FFFFFF', overflowY: 'auto' }}>
                
                {/* Candidate Overview Card */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{selectedCandidate.program_name}</div>
                  <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>
                    Fee Clearance: <strong style={{ color: '#059669' }}>{selectedCandidate.fee_status}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Receipt Reference: {selectedCandidate.receipt_no}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    Assigned Student Roll Number / ID <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="form-control"
                    required
                    placeholder="e.g. 2026-CSE-042"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 14px',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#7C3AED',
                      boxSizing: 'border-box'
                    }}
                  />
                  <small style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    This unique identifier will be used for attendance, transcripts, and exams.
                  </small>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                      Academic Cohort (Batch) <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={cohortId}
                      onChange={(e) => setCohortId(e.target.value)}
                      className="form-control"
                      required
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1.5px solid #E5E7EB',
                        padding: '0 12px',
                        fontSize: '13.5px',
                        color: '#1F2937',
                        boxSizing: 'border-box'
                      }}
                    >
                      {cohortsList.length === 0 ? (
                        <option value="">No Cohorts Found in Academics</option>
                      ) : (
                        cohortsList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.academicYear?.name ? `(${c.academicYear.name})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                      Class Section / Division <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={sectionId}
                      onChange={(e) => setSectionId(e.target.value)}
                      className="form-control"
                      required
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1.5px solid #E5E7EB',
                        padding: '0 12px',
                        fontSize: '13.5px',
                        color: '#1F2937',
                        boxSizing: 'border-box'
                      }}
                    >
                      {sectionsList.length === 0 ? (
                        <option value="">No Sections Found in Academics</option>
                      ) : (
                        sectionsList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (Cap: {s.capacity || 60})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>
                    Institutional Email Address
                  </label>
                  <input
                    type="email"
                    value={instituteEmail}
                    onChange={(e) => setInstituteEmail(e.target.value)}
                    className="form-control"
                    placeholder="student@unilms.edu"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid #E5E7EB',
                      padding: '0 14px',
                      fontSize: '13.5px',
                      color: '#1F2937',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '12px', padding: '14px', marginBottom: '18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={sendCredentials}
                      onChange={(e) => setSendCredentials(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#7C3AED' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#312E81' }}>
                      Auto-generate Unified LMS password &amp; email credentials to candidate
                    </span>
                  </label>
                </div>

              </div>

              {/* Drawer Footer */}
              <div
                className="drawer-footer"
                style={{
                  padding: '18px 28px',
                  background: '#F9FAFB',
                  borderTop: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px'
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#7C3AED',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(124, 58, 237, 0.3)'
                  }}
                >
                  <i className="fa-solid fa-user-check me-1"></i> Complete Enrollment
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgAdmissionsEnrollment;