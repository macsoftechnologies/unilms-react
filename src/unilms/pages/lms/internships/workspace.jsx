import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../../../context/TenantContext';

const LmsInternshipsWorkspace = () => {
  const { currentTenant } = useTenant();
  const userStr = localStorage.getItem('unilms_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const studentName = user?.name || user?.fullName || 'Student';
  const studentRoll = user?.rollNumber || '26CSE001';
  const studentSlug = (studentName || 'student').toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(1420); // 23 mins 40 secs
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [submittedTaskIds, setSubmittedTaskIds] = useState([]);
  const [submissionInputs, setSubmissionInputs] = useState({
    link: `https://github.com/${studentSlug}/aws-prometheus-exporter`,
    notes: 'Configured Prometheus server with CloudWatch Exporter and latency alarms.'
  });
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Timer tick
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    setSubmittedTaskIds(prev => [...prev, 'task-3-2']);
    setSubmissionSuccess(true);
    setTimeout(() => setSubmissionSuccess(false), 4000);
  };

  // Internship Data
  const enrollment = {
    company: 'Industry Partner Practicum',
    companyShort: 'IPP',
    role: 'Cloud Engineering & DevOps Intern',
    dates: 'Jan 15, 2026 – Jun 30, 2026',
    duration: '24 Weeks Practicum',
    mode: 'Hybrid Workstation',
    status: 'in_progress',
    statusText: 'In Progress (Grade: A+)',
    progressPct: 75,
    certificateId: `${(currentTenant?.code || 'INST').toUpperCase()}-PRAC-${new Date().getFullYear()}-${studentRoll}`,
    weightedGrade: 'A+ (92.4%)',
    totalTasks: 12,
    approvedTasks: 9,
    underReviewTasks: 1,
    studentMidReview: 'Successfully implemented multi-AZ VPC architecture with zero security vulnerabilities. Transitioning containerized services to ECS Fargate and finalizing CI/CD test gates.'
  };

  // Structured Milestones
  const milestones = [
    {
      id: 1,
      number: 1,
      title: 'Cloud Architecture, VPC Peering & IAM Security',
      description: 'Foundational AWS networking, private subnets, NAT gateways, and zero-trust IAM boundaries.',
      isMidpointGate: false,
      progress: '100% Completed',
      tasks: [
        {
          id: 'task-1-1',
          code: 'Task 1.1',
          title: 'Design Multi-AZ Production VPC Architecture with Public/Private Subnets & NAT Gateways',
          description: 'Deploy resilient high-availability VPC across 3 availability zones with isolated database tiers and automated route tables.',
          expectedOutput: 'Terraform HCL manifests & Network Architecture Diagram',
          estimatedHours: 16,
          submissionType: 'file',
          status: 'approved',
          submission: {
            submittedAt: 'Feb 04, 2026, 04:30 PM',
            studentNote: 'VPC deployed across us-east-1a, 1b, 1c with redundant NAT gateways and CIDR 10.0.0.0/16.',
            facultyFeedback: 'Exemplary CIDR subnet allocation and security group containment verified.',
            fileName: 'aws-vpc-architecture-v1.2.zip'
          }
        },
        {
          id: 'task-1-2',
          code: 'Task 1.2',
          title: 'Implement Least-Privilege IAM Roles, Session Policies & MFA Enforcement',
          description: 'Define fine-grained permission boundaries, SCPs, and automated role switching for DevOps engineering cohorts.',
          expectedOutput: 'IAM Policy JSON manifests & Access Audit Report',
          estimatedHours: 12,
          submissionType: 'link',
          status: 'approved',
          submission: {
            submittedAt: 'Feb 18, 2026, 02:15 PM',
            studentNote: 'Repository link with policy templates and audit test harness.',
            facultyFeedback: 'Excellent zero-trust policy boundaries and condition blocks.',
            url: `https://github.com/${studentSlug}/aws-iam-least-privilege`
          }
        }
      ]
    },
    {
      id: 2,
      number: 2,
      title: 'Microservices Containerization & ECS Fargate Deployments',
      description: 'Production containerization, multi-stage Docker builds, ALB routing, and serverless compute.',
      isMidpointGate: false,
      progress: '100% Completed',
      tasks: [
        {
          id: 'task-2-1',
          code: 'Task 2.1',
          title: 'Multi-stage Dockerfile Optimization & Image Vulnerability Scanning with Trivy',
          description: 'Strip unnecessary binaries, utilize distroless base images, and establish CVE scanning in registry hooks.',
          expectedOutput: 'Dockerfile & Trivy Vulnerability Scan Log (<20MB base size)',
          estimatedHours: 18,
          submissionType: 'file',
          status: 'approved',
          submission: {
            submittedAt: 'Mar 10, 2026, 06:45 PM',
            studentNote: 'Image payload reduced by 74% using Alpine distroless. 0 critical or high CVEs.',
            facultyFeedback: 'Great multi-stage optimization and cache layer structuring.',
            fileName: 'trivy-scan-report-signed.pdf'
          }
        },
        {
          id: 'task-2-2',
          code: 'Task 2.2',
          title: 'ECS Fargate Task Definitions, ALB Target Groups & Blue/Green Deployments',
          description: 'Provision AWS Application Load Balancers, health checks, and CodeDeploy automated canary rollouts.',
          expectedOutput: 'CloudFormation Template & Live Cluster Demo URL',
          estimatedHours: 24,
          submissionType: 'link',
          status: 'approved',
          submission: {
            submittedAt: 'Mar 28, 2026, 05:20 PM',
            studentNote: 'Live staging cluster endpoint configured with weighted canary routing.',
            facultyFeedback: 'Zero-downtime blue/green deployment validated successfully under synthetic load.',
            url: 'https://staging-ecs.apex-cloudlab.edu'
          }
        }
      ]
    },
    {
      id: 3,
      number: 3,
      title: 'CI/CD Pipeline Automation & Production Observability',
      description: 'Continuous integration, GitHub Actions runners, OIDC authentication, and distributed telemetry.',
      isMidpointGate: true,
      progress: 'In Progress (Active Gate)',
      tasks: [
        {
          id: 'task-3-1',
          code: 'Task 3.1',
          title: 'Automated GitHub Actions Workflow with OIDC IAM Assumption & Secret Scanning',
          description: 'Implement secure keyless deployment using GitHub OIDC provider, SonarQube quality gates, and automated test runs.',
          expectedOutput: '.github/workflows/deploy.yml with OIDC Role Assumption & Test Reports',
          estimatedHours: 20,
          submissionType: 'link',
          status: 'review',
          submission: {
            submittedAt: 'Apr 12, 2026, 11:30 AM',
            studentNote: 'OIDC role assumption configured with Trufflehog secret scanning and automated PyTest runner.',
            facultyFeedback: 'Currently undergoing faculty review and automated security scan assessment.',
            url: `https://github.com/${studentSlug}/aws-cicd-pipeline`
          }
        },
        {
          id: 'task-3-2',
          code: 'Task 3.2',
          title: 'Prometheus & Grafana Telemetry Dashboard with CloudWatch Metrics Exporter',
          description: 'Instrument microservices with OpenTelemetry, export custom business metrics, and configure latency alerts.',
          expectedOutput: 'Grafana Dashboard JSON & P99 Latency Alerting Rules',
          estimatedHours: 14,
          submissionType: 'link',
          status: submittedTaskIds.includes('task-3-2') ? 'review' : 'pending',
          submission: submittedTaskIds.includes('task-3-2') ? {
            submittedAt: 'Just now',
            studentNote: submissionInputs.notes,
            facultyFeedback: 'Submission received. Awaiting mentor evaluation.',
            url: submissionInputs.link
          } : null
        }
      ]
    },
    {
      id: 4,
      number: 4,
      title: 'Infrastructure as Code (Terraform) & Capstone Defense',
      description: 'Modular Terraform pipelines, auto-remediation runbooks, and final university jury evaluation.',
      isMidpointGate: false,
      progress: 'Locked (Requires M3 Approval)',
      tasks: [
        {
          id: 'task-4-1',
          code: 'Task 4.1',
          title: 'Modular Terraform IaC Pipeline for Auto-scaling & Disaster Recovery Runbooks',
          description: 'Author reusable Terraform modules for VPC, ECS, and RDS with cross-region replication for disaster recovery.',
          expectedOutput: 'Production Terraform Modules & DR Runbook Markdown',
          estimatedHours: 28,
          submissionType: 'link',
          status: 'pending',
          submission: null
        }
      ]
    }
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ws-page-container {
          max-width: 1360px;
          margin: 0 auto;
          padding: 8px 0 40px;
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
        }

        /* Hero Card */
        .ws-hero-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 20px;
          padding: 26px 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease;
        }

        .ws-hero-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #4f46e5, #06b6d4, #10b981);
        }

        /* Stat Cards */
        .ws-stat-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 16px;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
        }

        .ws-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(79, 70, 229, 0.08);
          border-color: rgba(79, 70, 229, 0.3);
        }

        .ws-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        /* Milestone Roadmap Cards */
        .milestone-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 18px;
          margin-bottom: 22px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
        }

        .milestone-card:hover {
          border-color: rgba(79, 70, 229, 0.3);
        }

        .milestone-header {
          padding: 18px 24px;
          background: var(--bg-canvas, #f8fafc);
          border-bottom: 1px solid var(--border, #e2e8f0);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .task-item {
          padding: 22px 24px;
          border-bottom: 1px solid var(--border, #e2e8f0);
          transition: background 0.15s ease;
        }

        .task-item:last-child {
          border-bottom: none;
        }

        .task-item:hover {
          background: rgba(79, 70, 229, 0.015);
        }

        /* Status Pills */
        .status-pill-approved {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.28);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .status-pill-pending {
          background: rgba(100, 116, 139, 0.1);
          color: var(--text-muted, #64748b);
          border: 1px solid var(--border, #e2e8f0);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .status-pill-review {
          background: rgba(245, 158, 11, 0.12);
          color: #d97706;
          border: 1px solid rgba(245, 158, 11, 0.28);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .status-pill-rejected {
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.28);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* Stopwatch Card */
        .stopwatch-card {
          background: linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%);
          border: 1px solid rgba(99, 102, 241, 0.35);
          border-radius: 18px;
          padding: 22px;
          color: #ffffff;
          box-shadow: 0 12px 30px -5px rgba(15, 23, 42, 0.4);
          position: relative;
          overflow: hidden;
        }

        .stopwatch-card::after {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .stopwatch-digit {
          font-family: 'SF Mono', 'Fira Code', 'Roboto Mono', monospace;
          font-size: 34px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #38bdf8;
          text-shadow: 0 0 14px rgba(56, 189, 248, 0.45);
        }

        .stopwatch-pulse {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          margin-right: 6px;
          animation: timerPulse 1.5s infinite;
        }

        @keyframes timerPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        /* Dark mode overrides */
        body.dark-mode .ws-hero-card,
        html.dark-mode .ws-hero-card {
          background: #151A24 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
        }

        body.dark-mode .ws-stat-card,
        html.dark-mode .ws-stat-card {
          background: #151A24 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        body.dark-mode .milestone-card,
        html.dark-mode .milestone-card {
          background: #151A24 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        body.dark-mode .milestone-header,
        html.dark-mode .milestone-header {
          background: #11151F !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        body.dark-mode .task-item,
        html.dark-mode .task-item {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        body.dark-mode .form-control,
        html.dark-mode .form-control {
          background: #1B212E !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
          color: #F8FAFC !important;
        }

        body.dark-mode .sub-preview-card {
          background: #1B212E !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        @media (max-width: 992px) {
          .ws-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      ` }} />

      <div className="ws-page-container">

        {/* =========================================================================
             1. HERO HEADER: ROLE & COMPANY BANNER
        ========================================================================= */}
        <div className="ws-hero-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '62px',
                height: '62px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '800',
                boxShadow: '0 8px 18px rgba(79, 70, 229, 0.25)',
                flexShrink: '0'
              }}>
                <i className="fa-solid fa-briefcase"></i>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <Link 
                    to="/unilms/lms/internships" 
                    className="btn btn-sm"
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      background: 'var(--bg-canvas, #F1F5F9)',
                      border: '1px solid var(--border, #E2E8F0)',
                      color: 'var(--text-main, #0F172A)',
                      textDecoration: 'none',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fa-solid fa-arrow-left"></i> All Internships
                  </Link>

                  <span style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#4F46E5',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(99, 102, 241, 0.25)'
                  }}>
                    <i className="fa-solid fa-laptop-code me-1"></i> Interactive In-Browser Tool
                  </span>

                  <span style={{
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: '#2563EB',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(59, 130, 246, 0.25)'
                  }}>
                    <i className="fa-solid fa-building me-1"></i> {enrollment.company}
                  </span>

                  <span style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10B981',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}>
                    <i className="fa-solid fa-circle-check me-1"></i> Active Practicum
                  </span>
                </div>

                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  margin: '0 0 6px',
                  color: 'var(--text-main, #0F172A)',
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: '-0.3px'
                }}>
                  {enrollment.role}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: 'var(--text-muted, #64748B)', flexWrap: 'wrap' }}>
                  <span><i className="fa-regular fa-calendar me-1" style={{ color: '#4F46E5' }}></i> {enrollment.dates}</span>
                  <span>&bull;</span>
                  <span><i className="fa-solid fa-clock me-1" style={{ color: '#4F46E5' }}></i> {enrollment.duration}</span>
                  <span>&bull;</span>
                  <span><i className="fa-solid fa-location-dot me-1" style={{ color: '#4F46E5' }}></i> {enrollment.mode}</span>
                  <span>&bull;</span>
                  <span><i className="fa-solid fa-graduation-cap me-1" style={{ color: '#4F46E5' }}></i> Accredited University Practicum</span>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <div style={{
              background: 'var(--bg-canvas, #F8FAFC)',
              border: '1px solid var(--border, #E2E8F0)',
              borderRadius: '16px',
              padding: '16px 24px',
              minWidth: '240px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Milestone Progress
                </span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#4F46E5', fontFamily: "'Outfit', sans-serif" }}>
                  {enrollment.progressPct}%
                </span>
              </div>
              <div style={{ height: '8px', borderRadius: '10px', background: 'var(--border, #E2E8F0)', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{
                  width: `${enrollment.progressPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #4F46E5 0%, #10B981 100%)',
                  borderRadius: '10px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted, #64748B)' }}>
                <span>Phase 3 of 4 Active</span>
                <span>{enrollment.approvedTasks} of {enrollment.totalTasks} Tasks Approved</span>
              </div>
            </div>
          </div>

          {/* Official University Certificate Issued Banner */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '16px',
            padding: '14px 20px',
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.18)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                <i className="fa-solid fa-stamp"></i>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#065F46', marginBottom: '2px' }}>
                  Official University Practicum Certificate Issued &amp; Digitally Verified!
                </div>
                <div style={{ fontSize: '12px', color: '#047857' }}>
                  Certificate ID: <strong>{enrollment.certificateId}</strong> &bull; Cumulative Grade: <strong>{enrollment.weightedGrade}</strong> &bull; Accreditation: <strong>NBA / AICTE Verified</strong>
                </div>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setShowCertificateModal(true)}
              style={{
                background: '#10B981',
                color: '#ffffff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '24px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fa-solid fa-qrcode"></i>
              <span>View Verified Certificate</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
             2. KPI METRICS RIBBON (4 STATS)
        ========================================================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="ws-stat-card">
            <div className="ws-stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }}>
              <i className="fa-solid fa-map-location-dot"></i>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Roadmap Milestones
              </div>
              <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--text-main, #0F172A)', fontFamily: "'Outfit', sans-serif" }}>
                {milestones.length} Phases
              </div>
            </div>
          </div>

          <div className="ws-stat-card">
            <div className="ws-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <i className="fa-solid fa-list-check"></i>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Tasks Approved
              </div>
              <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--text-main, #0F172A)', fontFamily: "'Outfit', sans-serif" }}>
                {enrollment.approvedTasks} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted, #64748B)' }}>/ {enrollment.totalTasks} completed</span>
              </div>
            </div>
          </div>

          <div className="ws-stat-card">
            <div className="ws-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Under Evaluation
              </div>
              <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--text-main, #0F172A)', fontFamily: "'Outfit', sans-serif" }}>
                {enrollment.underReviewTasks} Deliverables
              </div>
            </div>
          </div>

          <div className="ws-stat-card">
            <div className="ws-stat-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' }}>
              <i className="fa-solid fa-award"></i>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Evaluation Status
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #0F172A)', fontFamily: "'Outfit', sans-serif" }}>
                🚀 In Progress (Grade: A+)
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
             3. MAIN 2-COLUMN WORKSPACE
        ========================================================================= */}
        <div className="ws-layout-grid">
          
          {/* =========================================================================
               LEFT COLUMN: SEQUENTIAL MILESTONE ROADMAP
          ========================================================================= */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{
                fontSize: '17px',
                fontWeight: '800',
                margin: '0',
                color: 'var(--text-main, #0F172A)',
                fontFamily: "'Outfit', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fa-solid fa-timeline" style={{ color: '#4F46E5' }}></i> Structured Practicum Deliverables
              </h4>
              <span style={{
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, #E2E8F0)',
                color: 'var(--text-muted, #64748B)',
                fontSize: '11.5px',
                fontWeight: '600',
                padding: '4px 10px',
                borderRadius: '8px'
              }}>
                Sequential Review Gate
              </span>
            </div>

            {/* Success alert on submission */}
            {submissionSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#065F46',
                padding: '12px 18px',
                borderRadius: '12px',
                marginBottom: '18px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: '16px', color: '#10B981' }}></i>
                <span>Deliverable submitted successfully! Time session logged and notification sent to university faculty mentor.</span>
              </div>
            )}

            {milestones.map((m) => (
              <div className="milestone-card" key={m.id}>
                {/* Milestone Header */}
                <div className="milestone-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: m.progress.includes('100%') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(79, 70, 229, 0.12)',
                      color: m.progress.includes('100%') ? '#10B981' : '#4F46E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '14px'
                    }}>
                      {m.progress.includes('100%') ? <i className="fa-solid fa-check"></i> : `M${m.number}`}
                    </div>
                    <div>
                      <h5 style={{ margin: '0 0 2px', fontSize: '15.5px', fontWeight: '800', color: 'var(--text-main, #0F172A)', fontFamily: "'Outfit', sans-serif" }}>
                        {m.title}
                      </h5>
                      <small style={{ color: 'var(--text-muted, #64748B)', fontSize: '12px' }}>{m.description}</small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {m.isMidpointGate && (
                      <span style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#DC2626',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontWeight: '700'
                      }}>
                        <i className="fa-solid fa-flag-checkered me-1"></i> Midpoint Review Gate
                      </span>
                    )}
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: m.progress.includes('100%') ? 'rgba(16, 185, 129, 0.1)' : m.progress.includes('In Progress') ? 'rgba(79, 70, 229, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      color: m.progress.includes('100%') ? '#10B981' : m.progress.includes('In Progress') ? '#4F46E5' : 'var(--text-muted, #64748B)'
                    }}>
                      {m.progress}
                    </span>
                  </div>
                </div>

                {/* Tasks List inside Milestone */}
                <div>
                  {m.tasks.map((t) => {
                    const isTaskSubmitted = submittedTaskIds.includes(t.id);
                    const currentStatus = isTaskSubmitted ? 'review' : t.status;
                    const sub = isTaskSubmitted ? {
                      submittedAt: 'Just now',
                      studentNote: submissionInputs.notes,
                      facultyFeedback: 'Submission logged. Under active evaluation.',
                      url: submissionInputs.link
                    } : t.submission;

                    return (
                      <div className="task-item" key={t.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: 'var(--text-muted, #64748B)',
                                background: 'var(--bg-canvas, #F1F5F9)',
                                border: '1px solid var(--border, #E2E8F0)',
                                padding: '2px 8px',
                                borderRadius: '6px'
                              }}>
                                {t.code}
                              </span>
                              <h6 style={{ margin: '0', fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main, #0F172A)' }}>
                                {t.title}
                              </h6>
                            </div>

                            <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-muted, #64748B)', lineHeight: '1.5' }}>
                              {t.description}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-muted, #64748B)', flexWrap: 'wrap' }}>
                              <span><i className="fa-solid fa-bullseye me-1" style={{ color: '#4F46E5' }}></i> <strong>Target Output:</strong> {t.expectedOutput}</span>
                              <span>&bull;</span>
                              <span><i className="fa-regular fa-clock me-1" style={{ color: '#4F46E5' }}></i> <strong>Estimated:</strong> {t.estimatedHours} hrs</span>
                              <span>&bull;</span>
                              <span>
                                <i className={`fa-solid ${t.submissionType === 'file' ? 'fa-file-arrow-up' : 'fa-link'} me-1`} style={{ color: '#4F46E5' }}></i>{' '}
                                {t.submissionType === 'file' ? 'File Submission' : 'URL Submission'}
                              </span>
                            </div>
                          </div>

                          {/* EXACT SINGLE STATUS PILL */}
                          <div style={{ flexShrink: '0' }}>
                            {currentStatus === 'approved' && (
                              <span className="status-pill-approved">
                                <i className="fa-solid fa-circle-check"></i> Faculty Approved
                              </span>
                            )}
                            {currentStatus === 'review' && (
                              <span className="status-pill-review">
                                <i className="fa-solid fa-clock-rotate-left"></i> Under Review
                              </span>
                            )}
                            {currentStatus === 'rejected' && (
                              <span className="status-pill-rejected">
                                <i className="fa-solid fa-circle-exclamation"></i> Changes Requested
                              </span>
                            )}
                            {currentStatus === 'pending' && (
                              <span className="status-pill-pending">
                                <i className="fa-regular fa-circle"></i> Pending Submission
                              </span>
                            )}
                          </div>
                        </div>

                        {/* If task is pending and active (Task 3.2): Render Submission Form */}
                        {currentStatus === 'pending' && t.id === 'task-3-2' && (
                          <div style={{
                            background: 'var(--bg-canvas, #F8FAFC)',
                            border: '1px dashed var(--border, #CBD5E1)',
                            borderRadius: '14px',
                            padding: '18px 20px',
                            marginTop: '14px'
                          }}>
                            <form onSubmit={handleTaskSubmit}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                <div>
                                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main, #0F172A)', marginBottom: '5px', display: 'block' }}>
                                    <i className="fa-solid fa-code-branch me-1" style={{ color: '#4F46E5' }}></i> Repository / Live Dashboard URL
                                  </label>
                                  <input 
                                    type="url" 
                                    className="form-control" 
                                    value={submissionInputs.link}
                                    onChange={(e) => setSubmissionInputs({ ...submissionInputs, link: e.target.value })}
                                    placeholder="https://github.com/..." 
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      fontSize: '13px',
                                      borderRadius: '8px',
                                      border: '1px solid var(--border, #CBD5E1)',
                                      boxSizing: 'border-box'
                                    }} 
                                    required 
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main, #0F172A)', marginBottom: '5px', display: 'block' }}>
                                    <i className="fa-regular fa-comment-dots me-1" style={{ color: '#4F46E5' }}></i> Work Summary / Notes
                                  </label>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    value={submissionInputs.notes}
                                    onChange={(e) => setSubmissionInputs({ ...submissionInputs, notes: e.target.value })}
                                    placeholder="Brief summary of implementation..." 
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      fontSize: '13px',
                                      borderRadius: '8px',
                                      border: '1px solid var(--border, #CBD5E1)',
                                      boxSizing: 'border-box'
                                    }} 
                                    required 
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <small style={{ color: 'var(--text-muted, #64748B)', fontSize: '11.5px' }}>
                                  <i className="fa-solid fa-stopwatch me-1" style={{ color: '#4F46E5' }}></i> Logged session time ({formatTimer(timerSeconds)}) will attach automatically.
                                </small>
                                <button 
                                  type="submit" 
                                  className="btn"
                                  style={{
                                    background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '8px 18px',
                                    borderRadius: '8px',
                                    fontWeight: '700',
                                    fontSize: '12.5px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                                  }}
                                >
                                  <i className="fa-solid fa-paper-plane"></i>
                                  <span>Submit Deliverable</span>
                                </button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* Completed / Submitted Preview Card */}
                        {sub && (
                          <div 
                            className="sub-preview-card"
                            style={{
                              background: 'var(--bg-canvas, #F8FAFC)',
                              border: '1px solid var(--border, #E2E8F0)',
                              borderRadius: '12px',
                              padding: '12px 18px',
                              marginTop: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '12.5px', color: '#10B981', fontWeight: '700' }}>
                                <i className="fa-solid fa-check-circle me-1"></i> Submitted on {sub.submittedAt}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-main, #0F172A)', marginTop: '3px' }}>
                                <strong>Student Note:</strong> &ldquo;{sub.studentNote}&rdquo;
                              </div>
                              {sub.facultyFeedback && (
                                <div style={{
                                  fontSize: '12px',
                                  color: '#4F46E5',
                                  marginTop: '5px',
                                  background: 'rgba(79, 70, 229, 0.08)',
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  display: 'inline-block'
                                }}>
                                  <i className="fa-solid fa-comment me-1"></i> <strong>Faculty Feedback:</strong> {sub.facultyFeedback}
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {sub.url && (
                                <a 
                                  href={sub.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn"
                                  style={{
                                    fontSize: '11.5px',
                                    padding: '5px 12px',
                                    borderRadius: '8px',
                                    background: 'var(--surface, #ffffff)',
                                    border: '1px solid var(--border, #CBD5E1)',
                                    color: 'var(--text-main, #0F172A)',
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <i className="fa-solid fa-arrow-up-right-from-square"></i> View Repository
                                </a>
                              )}
                              {sub.fileName && (
                                <button 
                                  type="button" 
                                  className="btn"
                                  onClick={() => alert(`Downloading deliverable artifact: ${sub.fileName}`)}
                                  style={{
                                    fontSize: '11.5px',
                                    padding: '5px 12px',
                                    borderRadius: '8px',
                                    background: 'var(--surface, #ffffff)',
                                    border: '1px solid var(--border, #CBD5E1)',
                                    color: 'var(--text-main, #0F172A)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <i className="fa-solid fa-download"></i> Download ({sub.fileName})
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* =========================================================================
               RIGHT COLUMN: STOPWATCH & MENTORSHIP WIDGETS
          ========================================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Stopwatch / Session Tracker */}
            <div className="stopwatch-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isTimerRunning && <span className="stopwatch-pulse"></span>}
                  <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                    Active Work Session
                  </span>
                </div>
                <span style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>
                  {isTimerRunning ? '🔴 Live Logger' : '⏸ Paused'}
                </span>
              </div>

              <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
                <div className="stopwatch-digit">{formatTimer(timerSeconds)}</div>
                <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '4px' }}>
                  Time will be logged with deliverable submissions
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  style={{
                    flex: 1,
                    background: isTimerRunning ? '#F59E0B' : '#38BDF8',
                    color: '#0F172A',
                    fontWeight: '800',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className={`fa-solid ${isTimerRunning ? 'fa-pause' : 'fa-play'}`}></i>
                  <span>{isTimerRunning ? 'Pause Session' : 'Start Session'}</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }}
                  title="Reset Timer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-rotate-right"></i>
                </button>
              </div>
            </div>

            {/* Midpoint Reflection Checkpoint */}
            <div style={{
              background: 'var(--surface, #ffffff)',
              borderRadius: '18px',
              padding: '22px',
              border: '1px solid var(--border, #E2E8F0)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px'
                }}>
                  <i className="fa-solid fa-signature"></i>
                </div>
                <div>
                  <h5 style={{ margin: '0', fontSize: '15px', fontWeight: '800', color: 'var(--text-main, #0F172A)', fontFamily: "'Outfit', sans-serif" }}>
                    Midpoint Reflection
                  </h5>
                  <small style={{ color: 'var(--text-muted, #64748B)', fontSize: '11.5px' }}>Self-Assessment Checkpoint</small>
                </div>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '12.5px',
                color: '#065F46',
                marginBottom: '10px'
              }}>
                <div style={{ fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-circle-check text-success" style={{ color: '#10B981' }}></i>
                  <span>Review Submitted &amp; Verified:</span>
                </div>
                <p style={{ margin: '0', fontStyle: 'italic', lineHeight: '1.5', color: '#047857' }}>
                  &ldquo;{enrollment.studentMidReview}&rdquo;
                </p>
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-user-check" style={{ color: '#10B981' }}></i>
                <span>Reviewed by Dr. Ramesh Kulkarni (Evaluation: 9.5 / 10)</span>
              </div>
            </div>

            {/* Assigned Mentorship Card */}
            <div style={{
              background: 'var(--surface, #ffffff)',
              borderRadius: '18px',
              padding: '22px',
              border: '1px solid var(--border, #E2E8F0)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(79, 70, 229, 0.1)',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px'
                }}>
                  <i className="fa-solid fa-user-tie"></i>
                </div>
                <div>
                  <h5 style={{ margin: '0', fontSize: '15px', fontWeight: '800', color: 'var(--text-main, #0F172A)', fontFamily: "'Outfit', sans-serif" }}>
                    Mentorship Team
                  </h5>
                  <small style={{ color: 'var(--text-muted, #64748B)', fontSize: '11.5px' }}>Industry &amp; Faculty Supervision</small>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#FF9900',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}>
                    VR
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #0F172A)' }}>Vikramaditya Rao</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)' }}>Principal Solutions Architect, AWS</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#4F46E5',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}>
                    RK
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #0F172A)' }}>Dr. Ramesh Kulkarni</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)' }}>Professor &amp; Faculty Guide, Dept of CSE</div>
                  </div>
                </div>
              </div>

              <div style={{
                borderTop: '1px solid var(--border, #E2E8F0)',
                paddingTop: '14px',
                fontSize: '12px',
                color: 'var(--text-muted, #64748B)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <i className="fa-solid fa-check" style={{ color: '#4F46E5', marginTop: '3px' }}></i>
                  <span>Evaluated against the <strong>6-Dimension University Rubric</strong>.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <i className="fa-solid fa-check" style={{ color: '#4F46E5', marginTop: '3px' }}></i>
                  <span>Approved tasks count towards <strong>Curricular Practicum Credits</strong>.</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Certificate Modal Dialog */}
        {showCertificateModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px'
          }}>
            <div style={{
              background: 'var(--surface, #ffffff)',
              borderRadius: '24px',
              maxWidth: '680px',
              width: '100%',
              padding: '36px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              border: '2px solid rgba(16, 185, 129, 0.3)'
            }}>
              <button 
                type="button" 
                onClick={() => setShowCertificateModal(false)}
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--bg-canvas, #F1F5F9)',
                  border: 'none',
                  color: 'var(--text-main, #0F172A)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px',
                  margin: '0 auto 14px',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                }}>
                  <i className="fa-solid fa-graduation-cap"></i>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
                  Certificate of Practicum Completion
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted, #64748B)', fontSize: '13.5px' }}>
                  {currentTenant?.name || 'Academic Institution'} &bull; Office of Academic &amp; Industry Partnerships
                </p>
              </div>

              <div style={{
                background: 'var(--bg-canvas, #F8FAFC)',
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: '16px',
                padding: '20px 24px',
                marginBottom: '24px',
                fontSize: '13.5px',
                lineHeight: '1.6',
                color: 'var(--text-main, #0F172A)'
              }}>
                <p style={{ margin: '0 0 12px' }}>
                  This is to certify that <strong>{studentName} ({studentRoll})</strong> has demonstrated outstanding technical competency as an accredited{' '}
                  <strong>{enrollment.role}</strong> at <strong>{enrollment.company}</strong>, fulfilling all deliverables under continuous mentor supervision.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', borderTop: '1px solid var(--border, #E2E8F0)', paddingTop: '12px' }}>
                  <div><strong>Credential ID:</strong> {enrollment.certificateId}</div>
                  <div><strong>Weighted Grade:</strong> {enrollment.weightedGrade}</div>
                  <div><strong>Duration:</strong> {enrollment.dates}</div>
                  <div><strong>Verification Status:</strong> <span style={{ color: '#10B981', fontWeight: '700' }}>✓ AICTE / NBA Verified</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #CBD5E1)',
                    background: 'var(--surface, #ffffff)',
                    color: 'var(--text-main, #0F172A)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => alert('Certificate downloaded as encrypted PDF with tamper-proof university watermark.')}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#10B981',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <i className="fa-solid fa-download"></i> Download Official PDF
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default LmsInternshipsWorkspace;