import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import academicsService from '../../../services/academics.service';

const defaultCourseData = {
  title: 'Cloud Architecture & Microservices 2026',
  category: 'Computer Science',
  duration: 180,
  instructor: 'Faculty Course Lead',
  chapters: [
    {
      id: 1,
      title: 'Chapter 1: Container Fundamentals & Docker Internals',
      lessons: [
        { id: 1, title: '1.1 Monolith to Microservices Deconstruction', duration: '14m', videoId: '1xo-0gCVhTU' },
        { id: 2, title: '1.2 Linux Namespaces & Cgroups Container Isolation', duration: '18m', videoId: '01wAcUQpu10' },
        { id: 3, title: '1.3 Multi-Stage Dockerfile Optimization', duration: '22m', videoId: 'fqMOX6JJhGo' }
      ]
    },
    {
      id: 2,
      title: 'Chapter 2: Kubernetes Orchestration & Networking',
      lessons: [
        { id: 4, title: '2.1 Pods, Deployments & ReplicaSets', duration: '25m', videoId: 'X48VuDVv0do' },
        { id: 5, title: '2.2 Services & Ingress NGINX Controllers', duration: '28m', videoId: '80Ew_fsV4rM' },
        { id: 6, title: '2.3 ConfigMaps, Secrets & Environment Variables', duration: '16m', videoId: 'W_qU_27P_7Q' }
      ]
    },
    {
      id: 3,
      title: 'Chapter 3: Resilient Service Mesh & Observability',
      lessons: [
        { id: 7, title: '3.1 Istio Service Mesh & Envoy Sidecars', duration: '20m', videoId: '16fgzRbjRVg' },
        { id: 8, title: '3.2 Distributed Tracing with Jaeger & OpenTelemetry', duration: '24m', videoId: 'cQP8WApzIQQ' }
      ]
    }
  ]
};

const LmsMaterialsWatchCourse = () => {
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const [course, setCourse] = useState(defaultCourseData);
  const [activeLesson, setActiveLesson] = useState(defaultCourseData.chapters[0].lessons[0]);
  const [completed, setCompleted] = useState([1]);

  useEffect(() => {
    let isMounted = true;
    if (subjectId) {
      academicsService.getSubjects()
        .then((subs) => {
          if (!isMounted) return;
          const found = Array.isArray(subs) ? subs.find((s) => s.id === subjectId) : null;
          if (found) {
            setCourse((prev) => ({
              ...prev,
              title: `${found.code ? `${found.code}: ` : ''}${found.name}`,
              category: found.department?.name || 'Computer Science'
            }));
          }
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [subjectId]);

  const toggleComplete = (id) => {
    if (completed.includes(id)) {
      setCompleted(completed.filter((c) => c !== id));
    } else {
      setCompleted([...completed, id]);
    }
  };

  return (
    <div style={{ maxWidth: "1360px", width: "100%", margin: "0 auto", position: "relative", boxSizing: "border-box" }}>
      <div style={{ marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            <Link to="/unilms/lms/materials" className="btn btn-sm btn-outline" style={{ padding: "5px 12px", fontSize: "12px", borderRadius: "8px" }}>
              <i className="fa-solid fa-arrow-left me-1"></i> Back to Courses
            </Link>
            <span className="badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px" }}>
              {course.category}
            </span>
          </div>
          <h2 style={{ fontSize: "19px", fontWeight: "800", margin: "0 0 4px", color: "var(--text-main)", fontFamily: "'Outfit', sans-serif" }}>
            {course.title}
          </h2>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            <i className="fa-solid fa-user-tie me-1"></i> {course.instructor}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span className="badge" style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)", fontSize: "12px", fontWeight: "600", padding: "6px 12px", borderRadius: "8px" }}>
            <i className="fa-solid fa-clock me-1 text-primary"></i> {courseData.duration} mins total
          </span>
          <span className="badge" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669", border: "1px solid rgba(16, 185, 129, 0.2)", fontSize: "12px", fontWeight: "700", padding: "6px 12px", borderRadius: "8px" }}>
            <i className="fa-solid fa-circle-check me-1"></i> {completed.length} Completed
          </span>
        </div>
      </div>

      <div className="lms-portal-grid-split" style={{ marginBottom: "24px" }}>
        <div style={{ minWidth: 0, width: "100%" }}>
          <div className="card" style={{ padding: "0", overflow: "hidden", borderRadius: "16px", background: "#000", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", color: "white", padding: "20px" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", cursor: "pointer", boxShadow: "0 0 25px rgba(99, 102, 241, 0.6)" }}>
                  <i className="fa-solid fa-play fa-xl" style={{ marginLeft: "4px" }}></i>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>{activeLesson.title}</h3>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "0" }}>
                  Interactive Video Lecture Player &bull; 1080p Full HD
                </p>
              </div>
            </div>

            <div style={{ padding: "14px 18px", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 4px", wordBreak: "break-word" }}>{activeLesson.title}</h3>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Duration: {activeLesson.duration}</span>
              </div>
              <button
                type="button"
                onClick={() => toggleComplete(activeLesson.id)}
                className={`btn ${completed.includes(activeLesson.id) ? 'btn-success' : 'btn-outline'}`}
                style={{ padding: "7px 16px", borderRadius: "10px", fontSize: "12.5px", fontWeight: "700", flexShrink: 0 }}
              >
                <i className={`fa-solid ${completed.includes(activeLesson.id) ? 'fa-circle-check' : 'fa-check'} me-1`}></i>
                {completed.includes(activeLesson.id) ? 'Completed' : 'Mark as Done'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0, width: "100%" }}>
          <div className="card" style={{ borderRadius: "16px", padding: "16px", border: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <div style={{ margin: "0 0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "15px", fontWeight: "800", color: "var(--text-main)" }}>
                <i className="fa-solid fa-list-ul me-2" style={{ color: "var(--primary)" }}></i> Course Playlist
              </span>
              <span className="badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", fontSize: "11px", fontWeight: "700" }}>
                8 Lectures
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "440px", paddingRight: "4px" }}>
              {course.chapters.map((ch) => (
                <div key={ch.id} style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", background: "var(--bg-canvas)", fontWeight: "700", fontSize: "12px", color: "var(--text-main)", borderBottom: "1px solid var(--border)" }}>
                    {ch.title}
                  </div>
                  <div>
                    {ch.lessons.map((les) => {
                      const isActive = activeLesson.id === les.id;
                      const isDone = completed.includes(les.id);
                      return (
                        <div
                          key={les.id}
                          onClick={() => setActiveLesson(les)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            cursor: "pointer",
                            fontSize: "12px",
                            borderBottom: "1px solid var(--border)",
                            background: isActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                            color: isActive ? "var(--primary)" : "var(--text-main)",
                            fontWeight: isActive ? "700" : "500",
                            transition: "all 0.15s ease",
                            gap: "8px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", minWidth: 0, flex: 1 }}>
                            <i className={`fa-solid ${isDone ? 'fa-circle-check' : isActive ? 'fa-play' : 'fa-circle-play'}`} style={{ color: isDone ? '#10b981' : isActive ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }}></i>
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{les.title}</span>
                          </div>
                          <small style={{ color: "var(--text-muted)", fontSize: "10.5px", flexShrink: 0 }}>{les.duration}</small>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LmsMaterialsWatchCourse;