import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cbtService from '../../../services/cbt.service';

const LmsQuizzesIndex = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedQuizModal, setSelectedQuizModal] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    cbtService.getQuizzes()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) {
          const mapped = list.map((q, idx) => ({
            id: q.id || idx + 1,
            code: q.subject?.code || `CBT${101 + idx}`,
            courseName: q.subject?.name || 'Academic Assessment',
            title: q.title || 'Course Objective Evaluation',
            description: q.description || 'Proctored computer-based test evaluating subject concepts and curriculum learning outcomes.',
            timeLimit: `${q.durationMinutes || 45} mins`,
            attempts: '0 / 1',
            status: 'pending',
            score: null,
            percentage: null,
            grade: null,
            accentColor: idx % 2 === 0 ? '#4F46E5' : '#0284C7',
            badgeBg: idx % 2 === 0 ? 'rgba(79, 70, 229, 0.1)' : 'rgba(2, 132, 199, 0.1)',
            tags: ['Proctored CBT', 'MCQs', 'Curriculum Gate'],
            questionsCount: `${q.questions?.length || 20} MCQs`,
            actionText: 'Start Exam',
            actionLink: `/unilms/lms/assessments/cbt_player?quizId=${q.id}`,
            feedback: null
          }));
          setQuizzes(mapped);
        }
      })
      .catch((err) => console.warn('CBT quizzes fetch note:', err.message))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const filteredQuizzes = quizzes.filter(q => {
    const matchesFilter =
      filter === 'all' ? true :
        filter === 'completed' ? q.status === 'completed' :
          filter === 'pending' ? q.status === 'pending' : true;

    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.code.toLowerCase().includes(search.toLowerCase()) ||
      q.description.toLowerCase().includes(search.toLowerCase()) ||
      q.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const completedCount = quizzes.filter(q => q.status === 'completed').length;
  const pendingCount = quizzes.filter(q => q.status === 'pending').length;

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted, #64748B)', marginBottom: '14px', flexWrap: 'wrap' }}>
        <Link to="/unilms/lms/dashboard" style={{ color: 'var(--primary, #4F46E5)', textDecoration: 'none', fontWeight: '600' }}>
          Student Portal
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px', opacity: 0.6 }}></i>
        <span style={{ fontWeight: '700', color: 'var(--text-main, #0F172A)' }}>CBT Quizzes &amp; Tests</span>
      </div>

      {/* Main Header Banner with Deep Midnight Sapphire Gradient (Matching CBT Center Theme) */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #070E1E 0%, #0C1833 35%, #132448 70%, #1B3569 100%)',
          borderRadius: '13px',
          padding: '14px 20px',
          color: '#FFFFFF',
          marginBottom: '16px',
          border: '1px solid rgba(56, 189, 248, 0.22)',
          boxShadow: '0 4px 18px -2px rgba(12, 24, 51, 0.45)',
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
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                backdropFilter: 'blur(8px)',
                padding: '2.5px 9px',
                borderRadius: '16px',
                fontSize: '9.5px',
                fontWeight: '700',
                color: '#38BDF8',
                marginBottom: '5px'
              }}
            >
              <i className="fa-solid fa-laptop-code" style={{ fontSize: '9px' }}></i> Computer-Based Test (CBT) Center &bull; Fall Term 2026
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
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38BDF8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px'
                }}
              >
                <i className="fa-solid fa-square-poll-vertical"></i>
              </span>
              Computer-Based Tests (CBT) &amp; Quizzes
            </h1>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#BAE6FD', maxWidth: '680px', lineHeight: '1.4' }}>
              Attempt cohort-assigned timed online quizzes, monitor active test sessions, and analyze score breakdowns.
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
              <i className="fa-solid fa-calendar-days"></i> Exam Schedule
            </Link>
          </div>
        </div>
      </div>

      {/* Top Overview Micro-KPI Cards Strip */}
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
            Total Quizzes
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '2px', lineHeight: '1.2' }}>
            {quizzes.length} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Assigned</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            <i className="fa-solid fa-layer-group me-1"></i> 3 Technical Modules
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
            Ready To Attempt
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            {pendingCount} Test Active
          </div>
          <div style={{ fontSize: '10px', color: '#B45309', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-play me-1"></i> CS201 Data Structures
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
            {completedCount} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Evaluated</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> Detailed Analysis Ready
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
            Average CBT Score
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
            95.5%
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-arrow-trend-up me-1"></i> 52.50 / 55.00 Pts (Top Tier)
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Toolbar - Single Line on Desktop, Responsive on Mobile */}
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
            All Quizzes ({quizzes.length})
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
            Active / Scheduled ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            style={{
              padding: '5px 12px',
              fontSize: '11.5px',
              fontWeight: '700',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: filter === 'completed' ? 'var(--surface, #FFFFFF)' : 'transparent',
              color: filter === 'completed' ? '#059669' : 'var(--text-muted, #64748B)',
              boxShadow: filter === 'completed' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-circle-check" style={{ fontSize: '10px', color: '#10B981' }}></i>
            Completed ({completedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="lms-filter-inputs-group">
          <div className="search-wrapper" style={{ position: 'relative', width: '260px', maxWidth: '350px' }}>
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
              placeholder="Search CBT quiz or course code..."
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

      {/* Grid of Quizzes Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {filteredQuizzes.map((q) => {
          const isCompleted = q.status === 'completed';

          return (
            <div
              key={q.id}
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
              {/* Top Accent Strip */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3.5px',
                  background: q.accentColor || 'var(--primary, #4F46E5)'
                }}
              ></div>

              <div>
                {/* Header Row: Course Code Pill + Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                  <span
                    style={{
                      background: q.badgeBg || 'rgba(99, 102, 241, 0.1)',
                      color: q.accentColor || 'var(--primary, #4F46E5)',
                      border: `1px solid ${q.accentColor}33`,
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <i className="fa-solid fa-terminal" style={{ fontSize: '10px' }}></i>
                    {q.code} • {q.courseName}
                  </span>

                  {isCompleted ? (
                    <span
                      style={{
                        background: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <i className="fa-solid fa-circle-check"></i> Completed
                    </span>
                  ) : (
                    <span
                      style={{
                        background: '#FFFBEB',
                        color: '#B45309',
                        border: '1px solid #FDE68A',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <i className="fa-solid fa-clock"></i> Ready to Launch
                    </span>
                  )}
                </div>

                {/* Quiz Title */}
                <h3
                  onClick={() => setSelectedQuizModal(q)}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    margin: '0 0 8px',
                    fontSize: '16px',
                    fontWeight: '800',
                    color: 'var(--text-main, #0F172A)',
                    lineHeight: '1.35',
                    cursor: 'pointer'
                  }}
                  title={q.title}
                >
                  {q.title}
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
                  {q.description}
                </p>

                {/* Topic Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
                  {q.tags.map((tag, tIdx) => (
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

                {/* 2-Column Info Strip: Time Limit & Attempts */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '14px',
                    background: 'var(--bg-canvas, #F8FAFC)',
                    border: '1px solid var(--border, #E2E8F0)',
                    padding: '8px 10px',
                    borderRadius: '10px'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted, #64748B)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Time Limit
                    </div>
                    <div style={{ fontWeight: '800', color: 'var(--text-main, #0F172A)', fontSize: '12.5px', marginTop: '2px' }}>
                      <i className="fa-regular fa-clock me-1" style={{ color: q.accentColor, fontSize: '11px' }}></i>
                      {q.timeLimit}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border, #E2E8F0)' }}>
                    <div style={{ color: 'var(--text-muted, #64748B)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Attempts
                    </div>
                    <div style={{ fontWeight: '800', color: 'var(--text-main, #0F172A)', fontSize: '12.5px', marginTop: '2px' }}>
                      <i className="fa-solid fa-rotate-right me-1" style={{ color: q.accentColor, fontSize: '11px' }}></i>
                      {q.attempts}
                    </div>
                  </div>
                </div>

                {/* Score Banner or Ready Status Banner */}
                {isCompleted ? (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', color: '#065F46', fontWeight: '700' }}>Obtained Score:</span>{' '}
                      <strong style={{ fontSize: '13px', color: '#047857', fontWeight: '800' }}>{q.score}</strong>
                    </div>
                    <span
                      style={{
                        background: '#059669',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: '10px',
                        padding: '2px 7px',
                        borderRadius: '4px'
                      }}
                    >
                      {q.percentage} • {q.grade.split(' ')[1]}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="fa-solid fa-stopwatch" style={{ color: '#D97706', fontSize: '12px' }}></i>
                    <span style={{ fontSize: '11.5px', color: '#92400E', fontWeight: '700' }}>
                      Timed Assessment • Single Attempt Window Active
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Row / CTA Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border, #E2E8F0)',
                  gap: '8px'
                }}
              >
                <button
                  onClick={() => setSelectedQuizModal(q)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border, #E2E8F0)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #64748B)',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="View guidelines & details"
                >
                  <i className="fa-solid fa-circle-info"></i> Details
                </button>

                <Link
                  to={q.actionLink}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    padding: '7px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    background: isCompleted
                      ? 'var(--surface, #FFFFFF)'
                      : 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                    color: isCompleted ? 'var(--text-main, #0F172A)' : '#FFFFFF',
                    border: isCompleted ? '1px solid var(--border, #E2E8F0)' : 'none',
                    boxShadow: isCompleted ? 'none' : '0 2px 6px rgba(79, 70, 229, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <i className={isCompleted ? 'fa-solid fa-eye' : 'fa-solid fa-pen-nib'}></i>
                  {q.actionText}
                  {!isCompleted && <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px' }}></i>}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredQuizzes.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px', borderRadius: '16px' }}>
          <i className="fa-regular fa-folder-open" style={{ fontSize: '42px', color: 'var(--text-muted, #64748B)', opacity: 0.4, marginBottom: '12px' }}></i>
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800' }}>No Quizzes Found</h3>
          <p style={{ color: 'var(--text-muted, #64748B)', fontSize: '13px', margin: '0 0 16px' }}>
            No quizzes match your filter criteria. Try resetting your search query.
          </p>
          <button
            onClick={() => { setFilter('all'); setSearch(''); }}
            className="btn btn-outline"
            style={{ borderRadius: '8px', fontSize: '12.5px', fontWeight: '700' }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Quiz Details Modal */}
      {selectedQuizModal && (
        <div
          onClick={() => setSelectedQuizModal(null)}
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
              maxWidth: '540px',
              width: '100%',
              padding: '24px 28px',
              border: '1px solid var(--border, #E2E8F0)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSelectedQuizModal(null)}
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
              <span style={{ background: selectedQuizModal.badgeBg, color: selectedQuizModal.accentColor, fontWeight: '800', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                {selectedQuizModal.code} • CBT Quiz
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '700' }}>
                {selectedQuizModal.courseName}
              </span>
            </div>

            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '800', margin: '0 0 10px', color: 'var(--text-main, #0F172A)' }}>
              {selectedQuizModal.title}
            </h3>

            <p style={{ color: 'var(--text-muted, #64748B)', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px' }}>
              {selectedQuizModal.description}
            </p>

            <div style={{ background: 'var(--bg-canvas, #F8FAFC)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border, #E2E8F0)', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', display: 'block', fontWeight: '700' }}>TIME LIMIT</span>
                  <strong style={{ color: 'var(--text-main, #0F172A)' }}>{selectedQuizModal.timeLimit}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', display: 'block', fontWeight: '700' }}>ATTEMPTS</span>
                  <strong style={{ color: 'var(--text-main, #0F172A)' }}>{selectedQuizModal.attempts}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', display: 'block', fontWeight: '700' }}>FORMAT</span>
                  <strong style={{ color: selectedQuizModal.accentColor }}>{selectedQuizModal.questionsCount}</strong>
                </div>
              </div>

              {selectedQuizModal.score && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border, #E2E8F0)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800' }}>OBTAINED EVALUATION:</span>
                    <strong style={{ fontSize: '13px', color: '#059669' }}>{selectedQuizModal.score} ({selectedQuizModal.percentage})</strong>
                  </div>
                  {selectedQuizModal.feedback && (
                    <span style={{ fontSize: '12px', color: 'var(--text-main, #0F172A)', lineHeight: '1.4', display: 'block' }}>
                      "{selectedQuizModal.feedback}"
                    </span>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedQuizModal(null)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12.5px' }}
              >
                Close
              </button>
              <Link
                to={selectedQuizModal.actionLink}
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
                {selectedQuizModal.actionText} <i className="fa-solid fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LmsQuizzesIndex;
