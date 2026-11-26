import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import lmsService from '../../../services/lms.service';
import academicsService from '../../../services/academics.service';

const mapLearnCourses = (raw) => {
  const list = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
  if (list.length === 0) return [];
  return list.map((c, idx) => ({
    id: c.id || idx + 1,
    uuid: c.id,
    title: c.title,
    category: c.category || 'General',
    duration: c.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0) * 15, 0) || 60,
    chapter_count: c.modules?.length || 1,
    lesson_count: c.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || (c._count?.modules || 0),
    description: c.description || 'Comprehensive interactive course.',
    badge: 'Accredited'
  }));
};

const mapLearnNotes = (raw) => {
  const list = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
  if (list.length === 0) return [];
  const grouped = {};
  list.forEach(m => {
    const sName = m.subject?.name || 'General Coursework';
    if (!grouped[sName]) grouped[sName] = [];
    grouped[sName].push({
      id: m.id,
      title: m.title,
      type: (m.type || 'pdf').toLowerCase(),
      date: m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN') : 'Recent'
    });
  });
  return Object.keys(grouped).map(subject => ({
    subject,
    items: grouped[subject]
  }));
};

const LmsLearnIndex = () => {
  const cachedCourses = lmsService.getCachedCourses();
  const cachedMats = academicsService.getCachedStudyMaterials();
  const [courses, setCourses] = useState(() => mapLearnCourses(cachedCourses));
  const [notes, setNotes] = useState(() => mapLearnNotes(cachedMats));
  const [loading, setLoading] = useState(() => !cachedCourses && !cachedMats);

  const user = (() => { try { return JSON.parse(localStorage.getItem('unilms_user') || '{}'); } catch { return {}; } })();
  const studentName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student';

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      lmsService.getCourses({ isPublished: true }),
      academicsService.getStudyMaterials()
    ]).then(([coursesRes, matsRes]) => {
      if (!isMounted) return;

      // 1. Live LMS Masterclasses created in Content Creator Studio
      const rawCourses = coursesRes.status === 'fulfilled' ? (coursesRes.value?.data || coursesRes.value || []) : [];
      setCourses(mapLearnCourses(rawCourses));

      // 2. Live Subject Study Notes uploaded in Academics / Faculty desk
      const rawMats = matsRes.status === 'fulfilled' ? (matsRes.value?.data || matsRes.value || []) : [];
      setNotes(mapLearnNotes(rawMats));
    }).catch((e) => {
      console.warn('Learn fetch note:', e.message);
    }).finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const topCourse = courses.length > 0 ? courses[0] : null;

  return (
    <>
      <style>{`
        .learn-hero-card {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(168, 85, 247, 0.16) 45%, rgba(236, 72, 153, 0.14) 100%), #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.24);
          border-radius: 24px;
          padding: 36px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          margin-bottom: 36px;
          box-shadow: 0 10px 32px -6px rgba(99, 102, 241, 0.14);
          position: relative;
          overflow: hidden;
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 900px) {
          .learn-hero-card {
            flex-direction: column;
            padding: 20px 16px !important;
            gap: 20px !important;
            border-radius: 18px !important;
          }
          .hero-right-action {
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .hero-title {
            font-size: 24px !important;
          }
          .hero-stats-row {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 14px !important;
            width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .learn-hero-card {
            padding: 16px 14px !important;
            border-radius: 16px !important;
          }
          .hero-title {
            font-size: 20px !important;
          }
          .hero-stat-val {
            font-size: 20px !important;
          }
        }
        .hero-left {
          max-width: 700px;
        }
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.16));
          border: 1px solid rgba(99, 102, 241, 0.35);
          color: #6366f1;
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 14px;
        }
        .hero-title {
          font-family: 'Outfit', sans-serif !important;
          font-size: 32px !important;
          font-weight: 800 !important;
          line-height: 1.25 !important;
          color: #0f172a !important;
          margin-bottom: 10px !important;
        }
        body.dark-mode .hero-title {
          color: #f8fafc !important;
        }
        .hero-title .highlight {
          background: linear-gradient(135deg, #a78bfa, #c084fc, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #64748b;
          margin-bottom: 24px;
        }
        .hero-stats-row {
          display: flex;
          align-items: center;
          gap: 28px;
          flex-wrap: wrap;
        }
        .hero-stat-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .hero-stat-val {
          font-family: 'Outfit', sans-serif;
          font-size: 26px;
          font-weight: 800;
          line-height: 1;
        }
        .hero-stat-val.val-masterclasses { color: #6366f1; }
        .hero-stat-val.val-notes { color: #0284c7; }
        .hero-stat-val.val-tests { color: #f59e0b; }
        .hero-stat-val.val-assignments { color: #10b981; }
        .hero-stat-lbl {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .hero-right-action {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 20px;
          padding: 24px;
          width: 330px;
          flex-shrink: 0;
          box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.08);
          position: relative;
        }
        .c-watch-tag {
          font-size: 11px;
          font-weight: 800;
          color: #f43f5e;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .c-watch-title {
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 10px;
          line-height: 1.35;
        }
        .c-watch-meta {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .c-watch-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-resume-play {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 11px;
          border-radius: 12px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
          transition: all 0.2s;
        }
        .btn-resume-play:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
          color: #ffffff;
        }
        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }
        .section-heading-title {
          font-family: 'Outfit', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a !important;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section-heading-title span {
          color: #0f172a !important;
        }
        body.dark-mode .section-heading-title,
        body.dark-mode .section-heading-title span {
          color: #f8fafc !important;
        }
        .section-heading-sub {
          font-size: 13px;
          color: #475569 !important;
          margin-top: 2px;
        }
        body.dark-mode .section-heading-sub {
          color: #94a3b8 !important;
        }
        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 26px;
          margin-bottom: 40px;
        }
        @media (max-width: 600px) {
          .courses-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
        .course-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .course-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px -4px rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.4);
        }
        .course-cover {
          height: 180px;
          position: relative;
          background: linear-gradient(135deg, #1e1b4b, #312e81);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 42px;
        }
        .course-cat-tag {
          position: absolute;
          top: 14px;
          left: 14px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .course-duration-tag {
          position: absolute;
          bottom: 14px;
          right: 14px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .course-body {
          padding: 22px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .course-title {
          font-family: 'Outfit', sans-serif;
          font-size: 17px;
          font-weight: 800;
          color: var(--text-main, #0f172a);
          margin-bottom: 8px;
          line-height: 1.35;
        }
        .course-desc {
          font-size: 13px;
          color: var(--text-muted, #64748b);
          line-height: 1.5;
          margin-bottom: 16px;
        }
        .course-meta-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border, #e2e8f0);
        }
        .course-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted, #64748b);
          font-weight: 600;
        }
        .btn-watch-course {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-watch-course:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
          color: #ffffff;
        }
        .materials-subject-box {
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
        }
        .mat-subj-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a !important;
          margin-bottom: 16px;
        }
        .mat-subj-title span {
          color: #0f172a !important;
        }
        body.dark-mode .mat-subj-title,
        body.dark-mode .mat-subj-title span {
          color: #f8fafc !important;
        }
        .mat-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
        }
        .mat-item-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          background: var(--bg-canvas, #f8fafc);
          border: 1px solid var(--border, #e2e8f0);
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }
        .mat-item-card:hover {
          background: var(--surface-elevated, #ffffff);
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .mat-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(99, 102, 241, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .mat-info-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a !important;
          margin-bottom: 3px;
        }
        body.dark-mode .mat-info-title {
          color: #f8fafc !important;
        }
        .mat-info-type {
          font-size: 11px;
          color: #64748b !important;
        }
        body.dark-mode .mat-info-type {
          color: #94a3b8 !important;
        }
        .suite-quick-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .suite-quick-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 18px;
          padding: 22px;
          text-decoration: none;
          color: #0f172a !important;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          transition: all 0.25s;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
        }
        .suite-quick-card:hover {
          transform: translateY(-4px);
          border-color: #6366f1;
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
          color: #0f172a !important;
        }
        body.dark-mode .suite-quick-card,
        body.dark-mode .suite-quick-card:hover {
          color: #f8fafc !important;
        }
        .sqc-title {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a !important;
          margin-bottom: 4px;
        }
        body.dark-mode .sqc-title {
          color: #f8fafc !important;
        }
        .sqc-desc {
          font-size: 12.5px;
          color: #475569 !important;
          line-height: 1.5;
        }
        body.dark-mode .sqc-desc {
          color: #94a3b8 !important;
        }
        }
        .sqc-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 18px;
          flex-shrink: 0;
        }
        .sqc-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-main, #0f172a);
          margin-bottom: 4px;
        }
        .sqc-desc {
          font-size: 12px;
          color: var(--text-muted, #64748b);
          line-height: 1.4;
        }
      `}</style>

      {/* =========================================================================
           WELCOME HERO BANNER (Matches Image 2)
      ========================================================================= */}
      <section className="learn-hero-card">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <i className="fa-solid fa-wand-magic-sparkles" style={{ color: "#6366f1" }}></i>
            <span>Blended Video Masterclasses</span>
          </div>
          <h1 className="hero-title">
            Welcome back, <span className="highlight">{studentName}!</span> 🚀
          </h1>
          <p className="hero-desc">
            Explore your high-definition video masterclasses, interactive chapter streams, lecture handouts, and industry placement tracks in one unified suite.
          </p>
          <div className="hero-stats-row">
            <div className="hero-stat-item">
              <span className="hero-stat-val val-masterclasses">{courses.length}</span>
              <span className="hero-stat-lbl">Masterclasses</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-val val-notes">{notes.length}</span>
              <span className="hero-stat-lbl">Subject Notes</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-val val-tests">0</span>
              <span className="hero-stat-lbl">CBT Tests</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-val val-assignments">0</span>
              <span className="hero-stat-lbl">Assignments</span>
            </div>
          </div>
        </div>

        {/* Featured Masterclass Strip */}
        <div className="hero-right-action">
          <div className="c-watch-tag">
            <i className="fa-solid fa-play"></i>
            <span>{topCourse ? 'Featured Masterclass' : 'Video Library'}</span>
          </div>
          <div className="c-watch-title">{topCourse ? topCourse.title : 'Curriculum Course Material'}</div>
          <div className="c-watch-meta">
            <span><i className="fa-solid fa-book-open" style={{ color: "#6366f1" }}></i> {topCourse ? topCourse.chapter_count : courses.length} Chapters</span>
            <span style={{ color: "#cbd5e1" }}>•</span>
            <span><i className="fa-solid fa-video" style={{ color: "#ec4899" }}></i> {topCourse ? topCourse.lesson_count : 0} Lessons</span>
          </div>
          <Link to="/unilms/lms/materials/watch_course" className="btn-resume-play">
            <i className="fa-solid fa-circle-play"></i>
            <span>Stream Masterclass</span>
          </Link>
        </div>
      </section>

      {/* =========================================================================
           CURRICULUM VIDEO MASTERCLASSES
      ========================================================================= */}
      <div className="section-header-row">
        <div>
          <h2 className="section-heading-title">
            <i className="fa-solid fa-clapperboard" style={{ color: "#818cf8" }}></i>
            <span>Curriculum Video Masterclasses</span>
          </h2>
          <p className="section-heading-sub">High-definition chapter-by-chapter lectures with structured syllabus tracks</p>
        </div>
      </div>

      <div className="courses-grid">
        {courses.length > 0 ? (
          courses.map((course, idx) => (
            <div key={course.id} className="course-card">
              <div className="course-cover" style={{ background: idx === 0 ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : idx === 1 ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'linear-gradient(135deg, #0ea5e9, #10b981)' }}>
                <i className="fa-solid fa-film"></i>
                <span className="course-cat-tag">{course.category}</span>
                <span className="course-duration-tag">
                  <i className="fa-regular fa-clock"></i>
                  <span>{course.duration} mins</span>
                </span>
              </div>

              <div className="course-body">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-desc">{course.description}</p>

                <div className="course-meta-row">
                  <div className="course-meta-item">
                    <i className="fa-solid fa-folder-tree" style={{ color: "#818cf8" }}></i>
                    <span>{course.chapter_count} Chapters</span>
                  </div>
                  <div className="course-meta-item">
                    <i className="fa-solid fa-circle-play" style={{ color: "#f472b6" }}></i>
                    <span>{course.lesson_count} Lessons</span>
                  </div>
                  <div className="course-meta-item">
                    <i className="fa-solid fa-certificate" style={{ color: "#34d399" }}></i>
                    <span>{course.badge}</span>
                  </div>
                </div>

                <div style={{ marginTop: "auto" }}>
                  <Link to="/unilms/lms/materials/watch_course" className="btn-watch-course">
                    <i className="fa-solid fa-circle-play"></i>
                    <span>Start Masterclass</span>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '16px', gridColumn: '1 / -1' }}>
            <i className="fa-solid fa-clapperboard" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', opacity: 0.5 }}></i>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>No published courses in active curriculum</div>
            <div style={{ fontSize: '12.5px', marginTop: '4px' }}>Course modules published by your department faculty will appear here</div>
          </div>
        )}
      </div>

      {/* =========================================================================
           SUBJECT NOTES & STUDY MATERIALS
      ========================================================================= */}
      <div className="section-header-row" style={{ marginTop: "36px" }}>
        <div>
          <h2 className="section-heading-title">
            <i className="fa-solid fa-book-bookmark" style={{ color: "#38bdf8" }}></i>
            <span>Subject Notes & Lecture Slides</span>
          </h2>
          <p className="section-heading-sub">Download verified PDFs, handouts, and presentation slides</p>
        </div>
      </div>

      {notes.length > 0 ? (
        notes.map((sn, sIdx) => (
          <div key={sIdx} className="materials-subject-box">
            <div className="mat-subj-title">
              <i className="fa-solid fa-graduation-cap" style={{ color: "#818cf8" }}></i>
              <span>{sn.subject}</span>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--text-muted, #64748b)", marginLeft: "auto" }}>{sn.items.length} Resources</span>
            </div>

            <div className="mat-items-grid">
              {sn.items.map((item) => (
                <div key={item.id} className="mat-item-card">
                  <div className="mat-icon-wrap">
                    {item.type === 'youtube' ? (
                      <i className="fa-brands fa-youtube" style={{ color: "#ef4444" }}></i>
                    ) : item.type === 'link' ? (
                      <i className="fa-solid fa-link" style={{ color: "#38bdf8" }}></i>
                    ) : (
                      <i className="fa-regular fa-file-pdf" style={{ color: "#f87171" }}></i>
                    )}
                  </div>
                  <div>
                    <div className="mat-info-title">{item.title}</div>
                    <div className="mat-info-type">{item.type.toUpperCase()} • {item.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '16px' }}>
          <i className="fa-solid fa-book-bookmark" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', opacity: 0.5 }}></i>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>No course notes or handouts uploaded</div>
          <div style={{ fontSize: '12.5px', marginTop: '4px' }}>Subject lecture notes and slide decks will be available once uploaded by faculty</div>
        </div>
      )}

      {/* =========================================================================
           CAREER SUITE QUICK LAUNCHPAD
      ========================================================================= */}
      <div className="section-header-row" style={{ marginTop: "36px" }}>
        <div>
          <h2 className="section-heading-title">
            <i className="fa-solid fa-rocket" style={{ color: "#f472b6" }}></i>
            <span>Career Suite & Professional Sandboxes</span>
          </h2>
          <p className="section-heading-sub">Direct access to AI resumes, interview preparation, and placement drives</p>
        </div>
      </div>

      <div className="suite-quick-grid">
        <Link to="/unilms/lms/career/resume" className="suite-quick-card">
          <div className="sqc-icon" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
            <i className="fa-solid fa-file-invoice"></i>
          </div>
          <div>
            <div className="sqc-title">AI Resume Builder</div>
            <div className="sqc-desc">ATS keyword scanner, instant scorecards, and PDF export.</div>
          </div>
        </Link>

        <Link to="/unilms/lms/career/mock_interview" className="suite-quick-card">
          <div className="sqc-icon" style={{ background: "linear-gradient(135deg, #db2777, #ec4899)" }}>
            <i className="fa-solid fa-microphone-lines"></i>
          </div>
          <div>
            <div className="sqc-title">Mock Interviews</div>
            <div className="sqc-desc">Role-specific behavioral & technical questions with AI scoring.</div>
          </div>
        </Link>

        <Link to="/unilms/lms/career/portfolio" className="suite-quick-card">
          <div className="sqc-icon" style={{ background: "linear-gradient(135deg, #0891b2, #06b6d4)" }}>
            <i className="fa-solid fa-globe"></i>
          </div>
          <div>
            <div className="sqc-title">Digital Portfolio</div>
            <div className="sqc-desc">Personal portfolio website with live showcase, QR, and analytics.</div>
          </div>
        </Link>
      </div>
    </>
  );
};

export default LmsLearnIndex;