import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import lmsStudentService from '../../../services/lmsStudent.service';

const LmsAssessmentsIndex = () => {
  const [filter, setFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedAssessmentModal, setSelectedAssessmentModal] = useState(null);
  const [assessmentsData, setAssessmentsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    lmsStudentService.getAssignments()
      .then((res) => {
        if (!isMounted) return;
        if (res && Array.isArray(res.assignments) && res.assignments.length > 0) {
          const mapped = res.assignments.map((item, idx) => {
            const isGraded = item.submissionStatus === 'GRADED';
            const isPending = item.submissionStatus === 'PENDING';
            const due = item.dueDate ? new Date(item.dueDate) : null;
            const isOverdue = due ? due < new Date() && isPending : false;

            return {
              id: item.id || idx + 1,
              courseCode: item.courseCode || 'CS',
              shortSubject: item.courseCode || 'Subject',
              subject: item.courseName || 'Coursework Assignment',
              type: 'file_upload',
              typeName: 'Lab Practical',
              typeIcon: 'fa-solid fa-cloud-arrow-up',
              typeBadgeBg: 'rgba(99, 102, 241, 0.1)',
              typeTextColor: '#4F46E5',
              accentColor: '#4F46E5',
              title: item.title,
              description: item.description || 'Coursework evaluation and lab submission module.',
              tags: [item.courseCode || 'Course', 'Assessment'],
              maxMarks: `${item.maxScore || 50}.00 Pts`,
              weightage: `${item.weightage || 20}% Grade`,
              dueDate: due ? due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'End of Term',
              relativeDue: due ? 'Scheduled' : 'Term Work',
              isOverdue,
              status: isGraded ? 'submitted' : isPending ? 'pending' : 'submitted',
              score: item.score !== null ? `${item.score}.00 / ${item.maxScore || 50}.00` : null,
              grade: isGraded ? 'Graded' : null,
              feedback: item.remarks || null,
              actionText: isGraded ? 'Review Submission' : 'Submit Work',
              actionLink: '/unilms/lms/assessments/file_submit'
            };
          });
          setAssessmentsData(mapped);
        } else {
          setAssessmentsData([]);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch student assessments:', err);
        if (isMounted) setAssessmentsData([]);
      })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);



  const filteredAssessments = assessmentsData.filter((item) => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'submitted' ? item.status === 'submitted' :
      filter === 'pending' ? item.status === 'pending' : true;

    const matchesCourse =
      courseFilter === 'all' ? true :
      item.subject.toLowerCase().includes(courseFilter.toLowerCase()) ||
      item.courseCode.toLowerCase().includes(courseFilter.toLowerCase());

    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesCourse && matchesSearch;
  });

  const submittedCount = assessmentsData.filter(a => a.status === 'submitted').length;
  const pendingCount = assessmentsData.filter(a => a.status === 'pending').length;

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted, #64748B)', marginBottom: '14px', flexWrap: 'wrap' }}>
        <Link to="/unilms/lms/dashboard" style={{ color: 'var(--primary, #4F46E5)', textDecoration: 'none', fontWeight: '600' }}>
          Student Portal
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px', opacity: 0.6 }}></i>
        <span style={{ fontWeight: '700', color: 'var(--text-main, #0F172A)' }}>Assignments &amp; Evaluative Tests</span>
      </div>

      {/* Main Header Banner with Deep Ocean Teal Gradient */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #041416 0%, #0A2629 35%, #0F3D40 70%, #155557 100%)',
          borderRadius: '13px',
          padding: '14px 20px',
          color: '#FFFFFF',
          marginBottom: '16px',
          border: '1px solid rgba(45, 212, 191, 0.22)',
          boxShadow: '0 4px 18px -2px rgba(10, 38, 41, 0.45)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(45, 212, 191, 0.12)',
                border: '1px solid rgba(45, 212, 191, 0.3)',
                backdropFilter: 'blur(8px)',
                padding: '2.5px 9px',
                borderRadius: '16px',
                fontSize: '9.5px',
                fontWeight: '700',
                color: '#2DD4BF',
                marginBottom: '5px'
              }}
            >
              <i className="fa-solid fa-graduation-cap" style={{ fontSize: '9px' }}></i> B.Tech CSE (Batch 2023–2027) &bull; Semester V
            </div>
            <h1
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '17px',
                fontWeight: '800',
                margin: '0 0 3px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: 'rgba(45, 212, 191, 0.2)',
                  color: '#2DD4BF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px'
                }}
              >
                <i className="fa-solid fa-clipboard-check"></i>
              </span>
              My Assessments &amp; Tests
            </h1>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#99F6E4', maxWidth: '680px', lineHeight: '1.4' }}>
              Browse and complete your continuous internal evaluation (CIE) milestones, CBT conceptual quizzes, interactive video tests, and laboratory practical reports.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/unilms/lms/timetable"
              style={{
                background: 'rgba(255, 255, 255, 0.14)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                backdropFilter: 'blur(8px)',
                padding: '5px 11px',
                borderRadius: '7px',
                fontSize: '10.5px',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fa-solid fa-calendar-days"></i> View Timetable
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Micro-KPI Cards Strip */}
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
            Total Tasks
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '2px', lineHeight: '1.2' }}>
            {assessmentsData.length} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Assessments</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            <i className="fa-solid fa-list-check me-1"></i> {assessmentsData.length > 0 ? 'Assigned Coursework Tasks' : 'No Active Coursework'}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: `3.5px solid ${pendingCount > 0 ? 'var(--warning, #F59E0B)' : 'var(--success, #10B981)'}`,
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Action Required
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: pendingCount > 0 ? 'var(--warning, #F59E0B)' : 'var(--success, #10B981)', marginTop: '2px', lineHeight: '1.2' }}>
            {pendingCount} Pending
          </div>
          <div style={{ fontSize: '10px', color: pendingCount > 0 ? '#DC2626' : 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-clock me-1"></i> {pendingCount > 0 ? `${pendingCount} Milestones Pending` : 'All Work Up to Date'}
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
            Completed &amp; Graded
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
            {submittedCount} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Submissions</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> 100% On-Time Record
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
            Average Performance
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
            92.7%
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-arrow-trend-up me-1"></i> Grade A+ (Top 5% Cohort)
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Ribbon - Single Line on Desktop, Responsive on Mobile */}
      <div className="lms-filter-toolbar">
        {/* Segmented Filter Pills */}
        <div className="lms-filter-pills-scroll">
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '5px 12px',
              fontSize: '11.5px',
              fontWeight: '700',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: filter === 'all' ? 'var(--surface, #FFFFFF)' : 'transparent',
              color: filter === 'all' ? 'var(--primary, #4F46E5)' : 'var(--text-muted, #64748B)',
              boxShadow: filter === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap'
            }}
          >
            All Assessments ({assessmentsData.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            style={{
              padding: '5px 12px',
              fontSize: '11.5px',
              fontWeight: '700',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: filter === 'pending' ? 'var(--surface, #FFFFFF)' : 'transparent',
              color: filter === 'pending' ? '#D97706' : 'var(--text-muted, #64748B)',
              boxShadow: filter === 'pending' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }}></span>
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('submitted')}
            style={{
              padding: '5px 12px',
              fontSize: '11.5px',
              fontWeight: '700',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: filter === 'submitted' ? 'var(--surface, #FFFFFF)' : 'transparent',
              color: filter === 'submitted' ? '#059669' : 'var(--text-muted, #64748B)',
              boxShadow: filter === 'submitted' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-circle-check" style={{ fontSize: '10px', color: '#10B981' }}></i>
            Submitted ({submittedCount})
          </button>
        </div>

        {/* Course Filter Dropdown & Search Input */}
        <div className="lms-filter-inputs-group">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '11.5px',
              borderRadius: '7px',
              border: '1px solid var(--border, #E2E8F0)',
              background: 'var(--surface, #FFFFFF)',
              color: 'var(--text-main, #0F172A)',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <option value="all">All Courses</option>
            <option value="CS502">Cloud Architecture &amp; DevOps</option>
            <option value="CS503">Database Internals</option>
            <option value="CS505">Advanced Cloud Networks</option>
            <option value="CS501">Advanced Algorithms / Design</option>
          </select>

          <div className="search-wrapper" style={{ position: 'relative', width: '220px', maxWidth: '300px' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #64748B)',
                fontSize: '11.5px'
              }}
            ></i>
            <input
              type="text"
              placeholder="Search assessment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 26px 6px 30px',
                borderRadius: '7px',
                border: '1px solid var(--border, #E2E8F0)',
                background: 'var(--surface, #FFFFFF)',
                fontSize: '12px',
                outline: 'none',
                color: 'var(--text-main, #0F172A)',
                boxSizing: 'border-box'
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #64748B)',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Assessments Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {filteredAssessments.map((a) => {
          const isSubmitted = a.status === 'submitted';

          return (
            <div
              key={a.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: '16px',
                padding: '20px 22px',
                background: 'var(--surface, #FFFFFF)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                overflow: 'hidden'
              }}
            >
              {/* Top Decorative Border Accent */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3.5px',
                  background: a.accentColor || 'var(--primary, #4F46E5)'
                }}
              ></div>

              <div>
                {/* Header Row: Subject Badge + Format Pill */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                  <span
                    style={{
                      background: 'rgba(99, 102, 241, 0.08)',
                      color: 'var(--primary, #4F46E5)',
                      border: '1px solid rgba(99, 102, 241, 0.15)',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title={a.subject}
                  >
                    <i className="fa-solid fa-book-bookmark" style={{ fontSize: '10px' }}></i>
                    {a.courseCode} • {a.shortSubject}
                  </span>

                  <span
                    style={{
                      background: a.typeBadgeBg,
                      color: a.typeTextColor,
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexShrink: 0
                    }}
                  >
                    <i className={a.typeIcon} style={{ fontSize: '10.5px' }}></i> {a.typeName}
                  </span>
                </div>

                {/* Assessment Title */}
                <h3
                  onClick={() => setSelectedAssessmentModal(a)}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    margin: '0 0 8px',
                    fontSize: '16px',
                    fontWeight: '800',
                    color: 'var(--text-main, #0F172A)',
                    lineHeight: '1.35',
                    cursor: 'pointer'
                  }}
                  title={a.title}
                >
                  {a.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    color: 'var(--text-muted, #64748B)',
                    fontSize: '12.5px',
                    lineHeight: '1.5',
                    margin: '0 0 12px'
                  }}
                >
                  {a.description}
                </p>

                {/* Technical Topic Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '16px' }}>
                  {a.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      style={{
                        background: 'var(--bg-canvas, #F1F5F9)',
                        color: 'var(--text-muted, #64748B)',
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 7px',
                        borderRadius: '4px'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 3-Column Metric Strip */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    marginBottom: '16px',
                    background: 'var(--bg-canvas, #F8FAFC)',
                    border: '1px solid var(--border, #E2E8F0)',
                    padding: '8px 10px',
                    borderRadius: '10px'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted, #64748B)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Max Marks
                    </div>
                    <div style={{ fontWeight: '800', color: 'var(--primary, #4F46E5)', fontSize: '12.5px', marginTop: '2px' }}>
                      <i className="fa-solid fa-award me-1" style={{ fontSize: '10.5px' }}></i>
                      {a.maxMarks}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border, #E2E8F0)', borderRight: '1px solid var(--border, #E2E8F0)' }}>
                    <div style={{ color: 'var(--text-muted, #64748B)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Weightage
                    </div>
                    <div style={{ fontWeight: '800', color: 'var(--text-main, #0F172A)', fontSize: '12.5px', marginTop: '2px' }}>
                      <i className="fa-solid fa-chart-pie me-1" style={{ fontSize: '10px', opacity: 0.6 }}></i>
                      {a.weightage}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted, #64748B)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Due Date
                    </div>
                    <div style={{ fontWeight: '800', color: a.isUrgent ? '#DC2626' : 'var(--text-main, #0F172A)', fontSize: '12px', marginTop: '2px' }}>
                      <i className="fa-regular fa-clock me-1" style={{ fontSize: '10px', color: a.isUrgent ? '#DC2626' : 'var(--text-muted, #64748B)' }}></i>
                      {a.dueDate.split(',')[0]}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row / Status & CTA */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border, #E2E8F0)',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                {isSubmitted ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#059669',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fa-solid fa-circle-check"></i> Graded: {a.score}
                    </span>
                    <span
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--primary, #4F46E5)',
                        fontWeight: '800',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10.5px'
                      }}
                    >
                      {a.grade}
                    </span>
                  </div>
                ) : (
                  <span
                    style={{
                      background: a.isUrgent ? '#FEE2E2' : 'rgba(245, 158, 11, 0.12)',
                      color: a.isUrgent ? '#DC2626' : '#D97706',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className={a.isUrgent ? 'fa-solid fa-triangle-exclamation' : 'fa-regular fa-clock'}></i>
                    {a.relativeDue}
                  </span>
                )}

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    onClick={() => setSelectedAssessmentModal(a)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border, #E2E8F0)',
                      borderRadius: '8px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      color: 'var(--text-muted, #64748B)',
                      fontSize: '11.5px'
                    }}
                    title="View details & rubric"
                  >
                    <i className="fa-solid fa-circle-info"></i>
                  </button>

                  <Link
                    to={a.actionLink}
                    style={{
                      fontWeight: '700',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                      background: isSubmitted
                        ? 'var(--surface, #FFFFFF)'
                        : 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                      color: isSubmitted ? 'var(--text-main, #0F172A)' : '#FFFFFF',
                      border: isSubmitted ? '1px solid var(--border, #E2E8F0)' : 'none',
                      boxShadow: isSubmitted ? 'none' : '0 2px 6px rgba(79, 70, 229, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {a.actionText}
                    {!isSubmitted && <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px' }}></i>}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssessments.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px', borderRadius: '16px' }}>
          <i className="fa-regular fa-folder-open" style={{ fontSize: '42px', color: 'var(--text-muted, #64748B)', opacity: 0.4, marginBottom: '12px' }}></i>
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800' }}>No Assessments Found</h3>
          <p style={{ color: 'var(--text-muted, #64748B)', fontSize: '13px', margin: '0 0 16px' }}>
            No assessment tasks match your filter criteria. Try clearing search keywords or selecting "All Assessments".
          </p>
          <button
            onClick={() => { setFilter('all'); setCourseFilter('all'); setSearch(''); }}
            className="btn btn-outline"
            style={{ borderRadius: '8px', fontSize: '12.5px', fontWeight: '700' }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Assessment Details & Rubric Modal */}
      {selectedAssessmentModal && (
        <div
          onClick={() => setSelectedAssessmentModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface, #FFFFFF)',
              borderRadius: '18px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px 28px',
              border: '1px solid var(--border, #E2E8F0)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSelectedAssessmentModal(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'var(--bg-canvas, #F8FAFC)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted, #64748B)'
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: selectedAssessmentModal.typeBadgeBg, color: selectedAssessmentModal.typeTextColor, fontWeight: '800', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                <i className={selectedAssessmentModal.typeIcon} style={{ marginRight: '4px' }}></i>
                {selectedAssessmentModal.typeName}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '700' }}>
                {selectedAssessmentModal.courseCode} • {selectedAssessmentModal.subject}
              </span>
            </div>

            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '800', margin: '0 0 10px', color: 'var(--text-main, #0F172A)' }}>
              {selectedAssessmentModal.title}
            </h3>

            <p style={{ color: 'var(--text-muted, #64748B)', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px' }}>
              {selectedAssessmentModal.description}
            </p>

            <div style={{ background: 'var(--bg-canvas, #F8FAFC)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border, #E2E8F0)', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', display: 'block', fontWeight: '700' }}>MAX MARKS</span>
                  <strong style={{ color: 'var(--primary, #4F46E5)' }}>{selectedAssessmentModal.maxMarks}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', display: 'block', fontWeight: '700' }}>WEIGHTAGE</span>
                  <strong style={{ color: 'var(--text-main, #0F172A)' }}>{selectedAssessmentModal.weightage}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', display: 'block', fontWeight: '700' }}>DUE DATE</span>
                  <strong style={{ color: 'var(--text-main, #0F172A)' }}>{selectedAssessmentModal.dueDate}</strong>
                </div>
              </div>

              {selectedAssessmentModal.feedback && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border, #E2E8F0)' }}>
                  <span style={{ fontSize: '10.5px', color: '#059669', display: 'block', fontWeight: '800', marginBottom: '3px' }}>
                    <i className="fa-solid fa-chalkboard-user me-1"></i> FACULTY EVALUATION FEEDBACK
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-main, #0F172A)', lineHeight: '1.4' }}>
                    "{selectedAssessmentModal.feedback}"
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedAssessmentModal(null)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12.5px' }}
              >
                Close
              </button>
              <Link
                to={selectedAssessmentModal.actionLink}
                className="btn btn-primary"
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  background: 'var(--primary, #4F46E5)',
                  color: '#FFFFFF',
                  textDecoration: 'none'
                }}
              >
                {selectedAssessmentModal.actionText} <i className="fa-solid fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LmsAssessmentsIndex;
