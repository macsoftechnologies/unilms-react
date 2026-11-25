import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import {
  getStoredApplications,
  saveStoredApplications,
  getStoredDrives,
  getStoredOffers,
  saveStoredOffers
} from './placementsData';
import placementsService from '../../../services/placements.service';

const OrgPlacementsApplications = () => {
  const { id } = useParams();
  const [drive, setDrive] = useState({
    id: 1,
    title: 'Microsoft 2026 Campus Drive',
    company_name: 'Microsoft Corporation',
    job_role: 'Software Engineer (Azure Core & Cloud)',
    ctc_details: '₹44.0 LPA',
    drive_date: '2026-11-28'
  });

  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchApplicationsData = async () => {
    setLoading(true);
    try {
      const [dbDrives, dbApps] = await Promise.all([
        placementsService.getDrives(),
        placementsService.getApplications()
      ]);

      if (Array.isArray(dbDrives) && dbDrives.length > 0) {
        const found = dbDrives.find(d => String(d.id) === String(id)) || dbDrives[0];
        setDrive({
          id: found.id,
          company_id: found.companyId || found.company?.id,
          company_name: found.company?.name || found.company_name || 'Microsoft Corporation',
          title: found.title,
          job_role: found.jobRole || found.job_role || 'Software Engineer',
          ctc_details: found.ctcDetails || (found.ctcNumeric ? `₹${found.ctcNumeric} LPA` : '₹44.0 LPA'),
          ctc_numeric: found.ctcNumeric || 44.0,
          drive_date: found.driveDate ? found.driveDate.split('T')[0] : '2026-11-28'
        });
      }

      if (Array.isArray(dbApps) && dbApps.length > 0) {
        const norm = dbApps.map(a => ({
          id: a.id,
          student_id: a.studentId || a.student?.id,
          first_name: a.student?.firstName || 'Student',
          last_name: a.student?.lastName || '',
          roll_number: a.student?.rollNumber || 'N/A',
          cohort_name: a.student?.program?.name || 'Enrolled Program',
          cgpa: a.cgpa || 8.0,
          current_round: a.currentRound || 'Round 1: Screening',
          status: a.status || 'In Progress',
          remarks: a.remarks || '',
          resume_url: a.resumeUrl || ''
        }));
        setApplications(norm);
      } else {
        setApplications([]);
      }
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationsData();
  }, [id]);

  // Evaluation Modal State
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalApp, setEvalApp] = useState(null);
  const [evalData, setEvalData] = useState({
    current_round: '',
    status: '',
    remarks: ''
  });

  // KPI Calculations
  const totalApplicants = applications.length;
  const selectedCount = applications.filter(a => a.status === 'Selected').length;
  const inProgressCount = applications.filter(a => a.status === 'In Progress' || a.status === 'Shortlisted').length;
  const rejectedCount = applications.filter(a => a.status === 'Rejected').length;

  const filteredApps = applications.filter(a => {
    const matchesSearch =
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.cohort_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedApps,
    totalItems
  } = useTablePagination(filteredApps, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, setCurrentPage]);

  const handleOpenEval = (app) => {
    setEvalApp(app);
    setEvalData({
      current_round: app.current_round,
      status: app.status,
      remarks: app.remarks || ''
    });
    setIsEvalModalOpen(true);
  };

  const handleCloseEval = () => {
    setIsEvalModalOpen(false);
    setEvalApp(null);
  };

  const handleSaveEval = async (e) => {
    e.preventDefault();
    if (!evalApp) return;

    const confirmed = await confirm({
      title: 'Update Candidate Evaluation',
      message: `Update recruitment status for "${evalApp.first_name} ${evalApp.last_name}"?`,
      details: [
        `Candidate: ${evalApp.first_name} ${evalApp.last_name} (${evalApp.roll_number})`,
        `Drive: ${drive.title}`,
        `New Stage / Round: ${evalData.current_round}`,
        `Evaluation Status: ${evalData.status}`,
        `Remarks: ${evalData.remarks || 'No remarks provided'}`
      ],
      confirmText: 'Yes, Save Evaluation',
      variant: 'primary'
    });
    if (!confirmed) return;

    try {
      await placementsService.updateApplicationStage(evalApp.id, {
        currentRound: evalData.current_round,
        status: evalData.status,
        remarks: evalData.remarks
      });
      await fetchApplicationsData();
    } catch (err) {
      console.error('Failed to update stage in db:', err);
      const updated = applications.map(a =>
        a.id === evalApp.id
          ? { ...a, ...evalData }
          : a
      );
      setApplications(updated);
      saveStoredApplications(updated);
    }
    handleCloseEval();
  };

  const handleIssueOffer = async (app) => {
    const confirmed = await confirm({
      title: 'Issue Formal Job Offer',
      message: `Issue campus placement job offer for "${app.first_name} ${app.last_name}"?`,
      details: [
        `Candidate: ${app.first_name} ${app.last_name} (${app.roll_number})`,
        `Recruiter: ${drive.company_name}`,
        `Role: ${drive.job_role}`,
        `Package: ${drive.ctc_details || '₹9.5 LPA'}`,
        `Offer Letter Ref: OFFER-${drive.company_name.slice(0, 3).toUpperCase()}-${app.roll_number}`
      ],
      confirmText: 'Yes, Issue Job Offer',
      variant: 'success',
      icon: 'fa-solid fa-file-signature'
    });
    if (!confirmed) return;

    try {
      await placementsService.updateApplicationStage(app.id, {
        currentRound: 'Selected & Offer Issued',
        status: 'Selected'
      });
      if (app.student_id && drive.company_id) {
        await placementsService.createOffer({
          studentId: app.student_id,
          companyId: drive.company_id,
          jobRole: drive.job_role || 'Software Development Engineer',
          ctc: drive.ctc_numeric || 44.0,
          status: 'Accepted',
          offerLetterRef: `OFFER-${drive.company_name.slice(0, 3).toUpperCase()}-${app.roll_number}`,
          department: app.cohort_name ? app.cohort_name.split('-')[0].trim() : 'CSE'
        });
      }
      await fetchApplicationsData();
    } catch (err) {
      console.error('Failed to issue offer in db:', err);
      // Mark as selected
      const updatedApps = applications.map(a =>
        a.id === app.id ? { ...a, status: 'Selected', current_round: 'Selected & Offer Issued' } : a
      );
      setApplications(updatedApps);
      saveStoredApplications(updatedApps);

      // Add to offers
      const currentOffers = getStoredOffers();
      const newOffer = {
        id: Date.now(),
        student_id: app.student_id,
        first_name: app.first_name,
        last_name: app.last_name,
        roll_number: app.roll_number,
        company_id: drive.company_id || 1,
        company_name: drive.company_name,
        job_role: drive.job_role,
        ctc: drive.ctc_numeric || 950000,
        offer_date: new Date().toISOString().split('T')[0],
        status: 'Accepted',
        department: app.cohort_name ? app.cohort_name.split('-')[0].trim() : 'CSE',
        offer_letter_ref: `OFFER-${drive.company_name.slice(0, 3).toUpperCase()}-${app.roll_number}`
      };
      saveStoredOffers([newOffer, ...currentOffers]);
    }
  };

  return (
    <div className="placements-applications">
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      {/* Header Banner */}
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
              background: 'linear-gradient(135deg, #4F46E5, #4338CA)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
            }}
          >
            <i className="fa-solid fa-users-viewfinder"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {drive ? drive.title : 'Candidate Shortlisting &amp; Screening Queue'}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              {drive ? `${drive.company_name} | Role: ${drive.job_role} | Package: ${drive.ctc_details} | Date: ${drive.drive_date}` : 'Review candidate profiles, test scores &amp; interview statuses &bull; AY 2026&ndash;2027'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/unilms/org/placements/drives"
            className="btn btn-outline"
            style={{
              background: 'var(--card-bg, #fff)',
              color: 'var(--text-primary)',
              fontWeight: '700',
              border: '1px solid var(--border-color)',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              textDecoration: 'none'
            }}
          >
            <i className="fa-solid fa-arrow-left" style={{ color: '#4F46E5' }}></i>
            <span>Back to Drives</span>
          </Link>
        </div>
      </div>

      {/* KPI Statistical Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Total Applied</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B' }}>{totalApplicants}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-spinner"></i>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>In Progress</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B' }}>{inProgressCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-award"></i>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Selected</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B' }}>{selectedCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-xmark"></i>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Rejected</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B' }}>{rejectedCount}</div>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
              Candidate Evaluation & Rounds
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
              Advance candidate recruitment rounds, add interviewer remarks, and issue placement offers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search candidate, roll no..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '7px 12px 7px 32px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  width: '240px'
                }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8', fontSize: '12px' }}></i>
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                background: '#ffffff'
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="In Progress">In Progress</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Candidate Student</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Roll Number</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Cohort</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Current Round</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Evaluation Notes</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedApps.length > 0 ? (
                paginatedApps.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ color: '#1E293B', fontSize: '13px', display: 'block' }}>
                        {a.first_name} {a.last_name}
                      </strong>
                      <small style={{ color: '#64748B' }}>{a.email}</small>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#4F46E5' }}>
                      {a.roll_number}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748B' }}>
                      {a.cohort_name}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                        {a.current_round}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {a.status === 'Selected' && (
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                          Selected
                        </span>
                      )}
                      {a.status === 'Shortlisted' && (
                        <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                          Shortlisted
                        </span>
                      )}
                      {a.status === 'In Progress' && (
                        <span style={{ background: '#EEF2FF', color: '#4338CA', padding: '4px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                          In Progress
                        </span>
                      )}
                      {a.status === 'Applied' && (
                        <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                          Applied
                        </span>
                      )}
                      {a.status === 'Rejected' && (
                        <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                          Rejected
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748B' }}>
                      {a.remarks || '-'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEval(a)}
                          className="btn-icon"
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: '#475569'
                          }}
                          title="Evaluate Candidate"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        {a.status !== 'Selected' && (
                          <button
                            type="button"
                            onClick={() => handleIssueOffer(a)}
                            className="btn-icon"
                            style={{
                              background: '#D1FAE5',
                              border: '1px solid #A7F3D0',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              cursor: 'pointer',
                              color: '#059669'
                            }}
                            title="Select & Issue Placement Offer"
                          >
                            <i className="fa-solid fa-award"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    No student candidate applications found.
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
          itemName="candidate applications"
        />
      </div>

      {/* Evaluate Candidate Modal */}
      {isEvalModalOpen && evalApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
                  <i className="fa-solid fa-pen-to-square me-2" style={{ color: '#4F46E5' }}></i>
                  Evaluate Candidate
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B' }}>
                  {evalApp.first_name} {evalApp.last_name} ({evalApp.roll_number})
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEval}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEval}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Current Recruitment Round
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Round 2: Technical Interview"
                      value={evalData.current_round}
                      onChange={e => setEvalData({ ...evalData, current_round: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Candidate Status
                    </label>
                    <select
                      className="form-control"
                      value={evalData.status}
                      onChange={e => setEvalData({ ...evalData, status: e.target.value })}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Selected">Selected</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Interviewer Remarks & Feedback
                    </label>
                    <textarea
                      rows="3"
                      className="form-control"
                      placeholder="Coding score, communication skills, technical depth..."
                      value={evalData.remarks}
                      onChange={e => setEvalData({ ...evalData, remarks: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                background: '#F8FAFC'
              }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseEval}
                  style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-check me-1"></i> Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgPlacementsApplications;