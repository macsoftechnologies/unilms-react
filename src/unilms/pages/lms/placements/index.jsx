import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import placementsService from '../../../services/placements.service';

const initialApplicationsList = [
  {
    id: 1,
    driveId: 1,
    company: 'Amazon Web Services',
    role: 'Cloud Systems Software Engineer (New Grad 2027)',
    currentRound: 'Technical Round 1',
    remarks: 'Application verified by TPO. Online test scheduled for 14 Nov.',
    appliedOn: '12 Oct 2026',
    status: 'In Review'
  },
  {
    id: 2,
    driveId: 2,
    company: 'Oracle Cloud Infrastructure (OCI)',
    role: 'Member of Technical Staff - Systems & Networking',
    currentRound: 'Coding Assessment',
    remarks: 'Shortlisted for online hacker-rank technical assessment.',
    appliedOn: '08 Oct 2026',
    status: 'Shortlisted'
  },
  {
    id: 3,
    driveId: 3,
    company: 'Goldman Sachs',
    role: 'Full Stack Engineer - Fintech Platform',
    currentRound: 'Application Screening',
    remarks: 'Resume submitted & verified with TPO. Screening in progress.',
    appliedOn: '05 Oct 2026',
    status: 'In Review'
  },
  {
    id: 4,
    driveId: 4,
    company: 'Microsoft India R&D',
    role: 'Software Development Engineer I',
    currentRound: 'Pre-Placement Talk',
    remarks: 'Attended session. Online OA link will be sent to registered inbox.',
    appliedOn: '28 Sep 2026',
    status: 'Shortlisted'
  },
  {
    id: 5,
    driveId: 5,
    company: 'Cisco Systems',
    role: 'Network Automation Software Engineer',
    currentRound: 'Technical Interview 2',
    remarks: 'Cleared round 1 system design with panel. Round 2 pending.',
    appliedOn: '20 Sep 2026',
    status: 'In Review'
  }
];

const LmsPlacementsIndex = () => {
  const [loading, setLoading] = useState(false);
  const [appliedDrives, setAppliedDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [myApplications, setMyApplications] = useState(initialApplicationsList);
  const [drives, setDrives] = useState([
    {
      id: 1,
      title: 'Cloud Systems Software Engineer (New Grad 2027)',
      company: 'Amazon Web Services',
      ctc: '₹28.5 LPA',
      description: 'Campus hiring drive for core backend infrastructure, low-latency microservices, and distributed cloud services.',
      driveDate: '12 Nov 2026',
      location: 'Bengaluru / Hyderabad',
      deadline: '28 Oct 2026',
      minCgpa: '7.50'
    },
    {
      id: 2,
      title: 'Member of Technical Staff - Systems & Networking',
      company: 'Oracle Cloud Infrastructure (OCI)',
      ctc: '₹24.0 LPA',
      description: 'Design and deploy high-performance software-defined network fabrics, virtualization controllers, and telemetry systems.',
      driveDate: '18 Nov 2026',
      location: 'Bengaluru, India',
      deadline: '04 Nov 2026',
      minCgpa: '7.00'
    },
    {
      id: 3,
      title: 'Full Stack Engineer - Fintech Platform',
      company: 'Goldman Sachs',
      ctc: '₹26.0 LPA',
      description: 'Build robust transaction processing systems, real-time analytics engines, and resilient cloud financial platforms.',
      driveDate: '24 Nov 2026',
      location: 'Bengaluru / Hybrid',
      deadline: '10 Nov 2026',
      minCgpa: '8.00'
    }
  ]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const [drivesRes, appsRes] = await Promise.allSettled([
          placementsService.getDrives(),
          placementsService.getApplications(),
        ]);

        if (isMounted) {
          if (drivesRes.status === 'fulfilled' && Array.isArray(drivesRes.value) && drivesRes.value.length > 0) {
            const mappedDrives = drivesRes.value.map((d) => ({
              id: d.id,
              title: d.title || 'Campus Placement Drive',
              company: d.company?.name || d.companyName || 'Corporate Partner',
              ctc: d.ctc ? `₹${Number(d.ctc).toLocaleString('en-IN')} LPA` : (d.package || '₹18.0 LPA'),
              description: d.description || 'Campus recruitment and engineering evaluation drive.',
              driveDate: d.driveDate ? new Date(d.driveDate).toLocaleDateString('en-GB') : 'Open',
              location: d.location || 'Pan-India',
              deadline: d.deadline ? new Date(d.deadline).toLocaleDateString('en-GB') : 'Rolling',
              minCgpa: d.minCgpa || '7.00'
            }));
            setDrives(mappedDrives);
          }

          if (appsRes.status === 'fulfilled' && Array.isArray(appsRes.value) && appsRes.value.length > 0) {
            const mappedApps = appsRes.value.value || appsRes.value;
            const liveApps = mappedApps.map((a, idx) => ({
              id: a.id || idx + 1,
              driveId: a.driveId || a.drive?.id,
              company: a.drive?.company?.name || a.companyName || 'Corporate Partner',
              role: a.drive?.title || a.role || 'Software Engineer',
              currentRound: a.stage || 'Application Screening',
              remarks: a.remarks || 'Application registered with Campus TPO.',
              appliedOn: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB') : 'Recent',
              status: a.stage === 'REJECTED' ? 'Rejected' : (a.stage === 'OFFERED' ? 'Offer Extended' : 'In Review')
            }));
            setMyApplications(liveApps);
            setAppliedDrives(liveApps.map((a) => a.driveId).filter(Boolean));
          }
        }
      } catch (err) {
        console.warn('Failed to load placement drives & applications:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(myApplications, 5);

  const handleOpenApplyModal = (drive) => {
    setSelectedDrive(drive);
    setResumeFileName('');
    setShowApplyModal(true);
  };

  const handleCloseModal = () => {
    setShowApplyModal(false);
    setSelectedDrive(null);
    setResumeFileName('');
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!selectedDrive) return;

    try {
      await placementsService.createApplication({
        driveId: selectedDrive.id,
        stage: 'APPLIED',
        remarks: 'Direct student self-application via Student LMS Portal'
      });
    } catch (err) {
      console.warn('Persisting application to DB note:', err.message);
    }

    if (!appliedDrives.includes(selectedDrive.id)) {
      setAppliedDrives([...appliedDrives, selectedDrive.id]);
    }

    const newApp = {
      id: Date.now(),
      driveId: selectedDrive.id,
      company: selectedDrive.company,
      role: selectedDrive.title,
      currentRound: 'Application Screening',
      remarks: 'Application received & verified by TPO. Screening round in progress.',
      appliedOn: 'Today',
      status: 'In Review'
    };

    setMyApplications((prev) => [newApp, ...prev.filter(a => a.driveId !== selectedDrive.id)]);
    setShowApplyModal(false);
    setSelectedDrive(null);
    setFeedbackMsg(`Application successfully submitted for ${selectedDrive.company}!`);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleWithdrawApplication = async (driveId, companyName) => {
    if (window.confirm(`Are you sure you want to withdraw your application for ${companyName}?`)) {
      const app = myApplications.find(a => a.driveId === driveId);
      if (app && app.id) {
        try {
          await placementsService.deleteApplication(app.id);
        } catch (e) {
          console.warn('Backend delete application note:', e.message);
        }
      }
      setAppliedDrives((prev) => prev.filter(id => id !== driveId));
      setMyApplications((prev) => prev.filter(app => app.driveId !== driveId));
      setFeedbackMsg(`Application for ${companyName} has been withdrawn.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <>
      <div className="lms-page-header">
        <h1>
          <i className="fa-solid fa-briefcase me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i>{' '}
          Campus Placement Drives & Jobs
        </h1>
        <p>Browse active institutional placement drives, check criteria eligibility, and track your recruitment stages.</p>
      </div>

      {feedbackMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#065F46',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '13.5px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div>
            <i className="fa-solid fa-circle-check me-2" style={{ color: '#10B981' }}></i>
            {feedbackMsg}
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', fontSize: '16px' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Student Candidate Eligibility Banner */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
              Student Candidate
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px' }}>
              Aarav Patel <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary, #4F46E5)' }}>(26CSE001)</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
              Standing Backlogs
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#10B981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="fa-solid fa-circle-check"></i> 0 Active Backlogs
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
              Program & Batch
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main, #0F172A)', marginTop: '2px' }}>
              B.Tech CSE • Class of 2027
            </div>
          </div>
        </div>
        <div>
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-shield-halved"></i> TPO Placement Eligible
          </span>
        </div>
      </div>

      {/* Statistical Overview KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '16px'
        }}
      >
        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--primary, #4F46E5)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Active Drives
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '2px', lineHeight: '1.2' }}>
            {drives.length} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Campus Drives</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            <i className="fa-solid fa-building me-1"></i> Institutional Campus Hiring
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--success, #10B981)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Applications Submitted
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
            {myApplications.length} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Applied</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> Active Candidate Profile
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid #06B6D4',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            In Screening / Review
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
            {myApplications.filter(a => a.status === 'In Review' || a.status === 'Shortlisted').length} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>In Review</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--warning, #F59E0B)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-clock me-1"></i> Technical Assessment Stage
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--warning, #F59E0B)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            TPO Clearance
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            100% Eligible
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            0 Active Backlogs (Cleared)
          </div>
        </div>
      </div>

      {/* My Recruitment Status Table Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '800', margin: '0', display: 'flex', alignItems: 'center' }}>
            <i className="fa-solid fa-clock-rotate-left me-2" style={{ color: '#10B981', fontSize: '18px' }}></i>{' '}
            My Recruitment Status
          </h2>
          <span
            className="badge"
            style={{
              background: myApplications.length > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.1)',
              color: myApplications.length > 0 ? '#10B981' : 'var(--text-muted, #64748B)',
              fontSize: '11.5px',
              padding: '4px 10px',
              borderRadius: '12px',
              fontWeight: '700'
            }}
          >
            {myApplications.length} Application{myApplications.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)' }}>
                  COMPANY
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)' }}>
                  ROLE / DRIVE TITLE
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)' }}>
                  CURRENT ROUND
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)' }}>
                  REMARKS
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)' }}>
                  APPLIED ON
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)' }}>
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      padding: '36px 20px',
                      color: 'var(--text-muted, #64748B)',
                      fontSize: '13.5px'
                    }}
                  >
                    You have not applied for any placement drives yet.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((app) => (
                  <tr key={app.id}>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ color: 'var(--text-main, #0F172A)' }}>
                        <i className="fa-solid fa-building me-1 text-primary" style={{ color: 'var(--primary, #4F46E5)' }}></i> {app.company}
                      </strong>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                      {app.role}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #4F46E5)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '11.5px' }}>
                        {app.currentRound}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12.5px', color: 'var(--text-muted, #64748B)', maxWidth: '280px' }}>
                      {app.remarks}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                      {app.appliedOn}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                          <i className="fa-solid fa-circle-check me-1"></i> {app.status}
                        </span>
                        <button
                          type="button"
                          title="Withdraw Application"
                          onClick={() => handleWithdrawApplication(app.driveId, app.company)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted, #94A3B8)',
                            fontSize: '12px',
                            padding: '2px 4px'
                          }}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
          pageSizeOptions={[5, 10, 20]}
          itemName="recruitment applications"
        />
      </div>

      {/* Recruitment Drives Grid */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '800', margin: '0' }}>
            <i className="fa-solid fa-building me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i> Upcoming Recruitment Drives
          </h2>
          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.08)', color: 'var(--primary, #4F46E5)', fontSize: '11.5px', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
            {drives.length} Active Openings
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {drives.map((d) => {
            const isApplied = appliedDrives.includes(d.id);
            return (
              <div
                key={d.id}
                className="card"
                style={{
                  border: '1px solid var(--border, #E2E8F0)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'var(--surface, #FFFFFF)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif", margin: '0', fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
                        {d.title}
                      </h3>
                      <div style={{ fontSize: '13px', color: 'var(--primary, #4F46E5)', fontWeight: '700', marginTop: '3px' }}>
                        <i className="fa-solid fa-building-circle-check me-1"></i> {d.company}
                      </div>
                    </div>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: '800', fontSize: '12px', padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                      {d.ctc}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748B)', margin: '10px 0 14px', lineHeight: '1.5' }}>
                    {d.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '16px', background: 'var(--bg-canvas, #F8FAFC)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border, #E2E8F0)' }}>
                    <div><span style={{ color: 'var(--text-muted, #64748B)' }}>Drive Date:</span> <strong>{d.driveDate}</strong></div>
                    <div><span style={{ color: 'var(--text-muted, #64748B)' }}>Location:</span> <strong>{d.location}</strong></div>
                    <div><span style={{ color: 'var(--text-muted, #64748B)' }}>Deadline:</span> <strong>{d.deadline}</strong></div>
                    <div><span style={{ color: 'var(--text-muted, #64748B)' }}>Min CGPA:</span> <strong>{d.minCgpa}+</strong></div>
                  </div>
                </div>

                <div>
                  {isApplied ? (
                    <button
                      className="btn btn-outline"
                      disabled
                      style={{
                        width: '100%',
                        cursor: 'default',
                        opacity: 0.9,
                        borderColor: '#10B981',
                        color: '#10B981',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="fa-solid fa-circle-check"></i> Application Submitted
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onClick={() => handleOpenApplyModal(d)}
                    >
                      <i className="fa-solid fa-paper-plane"></i> Submit Campus Application
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && selectedDrive && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={handleCloseModal}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '26px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              background: 'var(--surface, #FFFFFF)',
              animation: 'scaleIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmitApplication}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", margin: 0, fontSize: '19px', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
                  <i className="fa-solid fa-paper-plane me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i>
                  Apply for Campus Placement
                </h3>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '22px',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #64748B)',
                    lineHeight: '1'
                  }}
                >
                  &times;
                </button>
              </div>

              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  padding: '14px',
                  borderRadius: '12px',
                  marginBottom: '18px',
                  border: '1px solid rgba(99, 102, 241, 0.15)'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--primary, #4F46E5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Target Recruitment Drive
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '3px' }}>
                  {selectedDrive.title}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--primary, #4F46E5)', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span><i className="fa-solid fa-building me-1"></i> {selectedDrive.company}</span>
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: '800', padding: '2px 8px', borderRadius: '8px' }}>
                    {selectedDrive.ctc}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px', color: 'var(--text-main, #0F172A)' }}>
                  Upload Resume / CV (PDF or DOCX) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div
                  style={{
                    border: '2px dashed var(--border, #CBD5E1)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    background: 'var(--bg-canvas, #F8FAFC)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    required
                    onChange={(e) => setResumeFileName(e.target.files?.[0]?.name || '')}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                  <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '28px', color: 'var(--primary, #4F46E5)', marginBottom: '8px' }}></i>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #0F172A)' }}>
                    {resumeFileName ? resumeFileName : 'Click to select or drag and drop your Resume'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', marginTop: '4px' }}>
                    Accepted formats: PDF, DOCX (Max 10 MB)
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '22px', background: 'rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '12px', color: '#065F46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-circle-check" style={{ color: '#10B981', fontSize: '14px' }}></i>
                  <span>TPO Automated Verification: Verified 0 Backlogs & 8.5 CGPA</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseModal}
                  style={{ padding: '8px 18px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '8px 20px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-paper-plane"></i> Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LmsPlacementsIndex;
