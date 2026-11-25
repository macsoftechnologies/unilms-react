import React, { useState, useEffect } from 'react';
import { studentsService } from '../../../services/students.service';

const LmsPortalDiary = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const loadNotices = async () => {
    try {
      const data = await studentsService.getAcademicNotices();
      setNotices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load notices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadNotices();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const categories = ['All', 'Official', 'Placements', 'Event', 'Mandatory'];

  const filteredNotices = notices.filter(n => {
    if (activeCategory === 'All') return true;
    return (n.tag && n.tag.toLowerCase() === activeCategory.toLowerCase()) ||
           (n.category && n.category.toLowerCase().includes(activeCategory.toLowerCase()));
  });

  return (
    <>
      <div className="lms-page-header" style={{ marginBottom: "20px" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
              <i className="fa-solid fa-bullhorn me-2" style={{ color: "var(--primary, #7C3AED)" }}></i> 
              Campus Notices &amp; Academic Circulars
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Official announcements, holiday schedules, examination guidelines, and administrative orders published by university leadership.
            </p>
          </div>
          
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: activeCategory === cat ? '1px solid #7C3AED' : '1px solid var(--border-color, #e2e8f0)',
              background: activeCategory === cat ? '#7C3AED' : '#fff',
              color: activeCategory === cat ? '#fff' : 'var(--text-primary, #1e293b)',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "24px", background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid var(--border-color, #e2e8f0)' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "800", margin: "0", color: "var(--text-primary, #1e293b)" }}>
            <i className="fa-solid fa-newspaper me-2" style={{ color: "#7C3AED" }}></i> Active University Circulars
          </h2>
          <span className="badge" style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7C3AED", fontSize: "11.5px", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>
            {filteredNotices.length} Published Notices
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <i className="fa-solid fa-spinner fa-spin me-2"></i> Loading university notices...
          </div>
        ) : filteredNotices.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            <i className="fa-solid fa-bullhorn" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '10px' }}></i>
            <p style={{ margin: 0, fontWeight: '600' }}>No circulars found for category "{activeCategory}".</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {filteredNotices.map((n) => (
              <div key={n.id} style={{ border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "18px", background: "#f8fafc", transition: "all 0.2s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", marginBottom: "8px", flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7C3AED", fontSize: "10.5px", padding: "2px 8px", borderRadius: "6px", fontWeight: "700" }}>
                        <i className="fa-solid fa-users me-1"></i> {n.category || 'All Students'}
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--text-secondary, #64748b)", fontWeight: "600" }}>
                        <i className="fa-regular fa-calendar me-1"></i> {n.date || 'Recent'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-primary, #1e293b)", margin: "0" }}>
                      {n.title}
                    </h3>
                  </div>
                  <span style={{ 
                    background: n.tag === 'Mandatory' ? 'rgba(239, 68, 68, 0.12)' : n.tag === 'Placements' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(124, 58, 237, 0.12)', 
                    color: n.tag === 'Mandatory' ? '#ef4444' : n.tag === 'Placements' ? '#10b981' : '#7C3AED', 
                    fontSize: "11px", 
                    padding: "3px 9px", 
                    borderRadius: "8px", 
                    fontWeight: "800" 
                  }}>
                    {n.tag || 'Official'}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary, #475569)", lineHeight: "1.55", marginTop: "6px" }}>
                  {n.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default LmsPortalDiary;
