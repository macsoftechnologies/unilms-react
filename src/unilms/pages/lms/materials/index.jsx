import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import academicsService from '../../../services/academics.service';

const LmsMaterialsIndex = () => {
  const [coursesList, setCoursesList] = useState([]);
  const [subjectMaterialsList, setSubjectMaterialsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    academicsService.getSubjects()
      .then((subjects) => {
        if (!isMounted) return;
        const subArray = Array.isArray(subjects) ? subjects : [];
        if (subArray.length > 0) {
          const mappedCourses = subArray.map((s, idx) => ({
            id: s.id || idx + 1,
            title: `${s.code ? `${s.code}: ` : ''}${s.name}`,
            category: s.department?.name || 'Computer Science',
            duration: 180 + (idx * 30),
            lessons: (s.credits || 4) * 3,
            chapters: s.credits || 4,
            description: s.description || `Comprehensive institutional curriculum for ${s.name} covering theoretical foundations and hands-on laboratory exercises.`,
            watchUrl: `/unilms/lms/materials/watch?subjectId=${s.id}`
          }));
          setCoursesList(mappedCourses);

          const mappedMaterials = subArray.map((s) => ({
            subject: `${s.code ? `${s.code}: ` : ''}${s.name}`,
            materials: [
              {
                id: `mat-${s.id}-1`,
                title: `${s.name} - Complete Lecture Notes & Syllabus Overview.pdf`,
                date: 'Autumn Term 2026',
                description: `Official faculty lecture slides and syllabus notes for ${s.name}.`,
                type: 'pdf',
                size: '3.2 MB'
              },
              {
                id: `mat-${s.id}-2`,
                title: `${s.name} - Problem Set & Laboratory Practice Archive.zip`,
                date: 'Autumn Term 2026',
                description: `Curated practice problems, code skeletons and reference documentation.`,
                type: 'link',
                size: 'Practice Pack'
              }
            ]
          }));
          setSubjectMaterialsList(mappedMaterials);
        }
      })
      .catch((e) => console.warn('Subject fetch note:', e.message))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);
  return (
    <>
      <div className="lms-page-header">
        <h1><i className="fa-solid fa-play-circle me-2" style={{ color: "var(--primary)" }}></i> Learning & Content Library</h1>
        <p>Access video masterclasses, curriculum lectures, and subject study notes.</p>
      </div>

      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: "20px", color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fa-solid fa-clapperboard"></i> Video Courses & Masterclasses
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {coursesList.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-graduation-cap" style={{ fontSize: '32px', color: '#94A3B8', marginBottom: '8px' }}></i>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>No courses published yet for this academic department.</p>
            </div>
          ) : (
            coursesList.map((c) => (
            <div key={c.id} className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: "0", border: "1px solid var(--border-color)", borderRadius: "16px" }}>
              <div style={{ width: "100%", height: "160px", background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "40px", position: "relative" }}>
                <i className="fa-solid fa-film"></i>
                <div style={{ position: "absolute", bottom: "10px", right: "12px", background: "rgba(0,0,0,0.6)", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
                  <i className="fa-regular fa-clock me-1"></i> {c.duration} mins
                </div>
              </div>

              <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: "1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span className="badge" style={{ background: "rgba(79, 70, 229, 0.1)", color: "var(--primary)", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px" }}>
                    {c.category}
                  </span>
                  <small style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                    <i className="fa-solid fa-video me-1"></i> {c.lessons} Lessons
                  </small>
                </div>

                <h3 style={{ margin: "0 0 8px", fontSize: "17px", lineHeight: "1.4", fontWeight: "700", color: "var(--text-primary)" }}>
                  {c.title}
                </h3>

                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 16px", lineHeight: "1.5", flexGrow: "1" }}>
                  {c.description}
                </p>

                <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <small style={{ color: "var(--text-muted)" }}>
                    <i className="fa-solid fa-layer-group me-1"></i> {c.chapters} Chapters
                  </small>
                  <Link to={c.watchUrl} className="btn btn-primary" style={{ padding: "8px 18px", fontSize: "13px", borderRadius: "20px" }}>
                    Watch Now <i className="fa-solid fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          )))}
        </div>
      </div>

      <h2 style={{ margin: "0 0 20px", fontSize: "20px", color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
        <i className="fa-solid fa-book-open"></i> Subject Study Materials & Handouts
      </h2>

      {subjectMaterialsList.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <i className="fa-solid fa-book-open" style={{ fontSize: '32px', color: '#94A3B8', marginBottom: '8px' }}></i>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>No study materials or handouts uploaded yet for this department.</p>
        </div>
      ) : (
        subjectMaterialsList.map((subj, idx) => (
        <div key={idx} style={{ marginBottom: "32px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "17px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fa-solid fa-folder-closed" style={{ color: "var(--primary)" }}></i> {subj.subject}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {subj.materials.map((m) => (
              <div key={m.id} className="card" style={{ display: "flex", flexDirection: "column", borderRadius: "14px", padding: "18px" }}>
                <div style={{ display: "flex", gap: "14px", marginBottom: "14px" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: m.type === 'pdf' ? "rgba(239, 68, 68, 0.1)" : m.type === 'video' ? "rgba(79, 70, 229, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    color: m.type === 'pdf' ? "#ef4444" : m.type === 'video' ? "var(--primary)" : "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0
                  }}>
                    <i className={`fa-solid ${m.type === 'pdf' ? 'fa-file-pdf' : m.type === 'video' ? 'fa-play' : 'fa-link'}`}></i>
                  </div>

                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "14px", lineHeight: "1.3", fontWeight: "700" }}>{m.title}</h4>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      Uploaded {m.date} &bull; {m.size}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: "0 0 16px", lineHeight: "1.5", flexGrow: 1 }}>
                  {m.description}
                </p>

                <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  <button type="button" onClick={() => alert(`Accessing ${m.title}`)} className="btn btn-outline" style={{ width: "100%", fontSize: "12.5px", borderRadius: "10px" }}>
                    <i className={`fa-solid ${m.type === 'pdf' ? 'fa-download' : 'fa-arrow-up-right-from-square'} me-1`}></i>
                    {m.type === 'pdf' ? 'Download Resource' : 'Open Resource'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )))}
    </>
  );
};

export default LmsMaterialsIndex;