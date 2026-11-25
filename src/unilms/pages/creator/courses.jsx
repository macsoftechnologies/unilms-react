import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { lmsService } from '../../services/lms.service';

const CreatorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    category: 'Computer Science & Cloud',
    description: '',
    level: 'Intermediate',
    isPublished: true,
  });

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await lmsService.getCourses();
      if (Array.isArray(data)) {
        setCourses(
          data.map((c) => ({
            id: c.id,
            title: c.title,
            category: c.category,
            description: c.description,
            status: c.isPublished ? 'published' : 'draft',
            statusText: c.isPublished ? 'Published' : 'Draft',
            chapters: c.modules ? c.modules.length : 0,
            lessons: c.modules ? c.modules.reduce((sum, m) => sum + (m.lessons ? m.lessons.length : 0), 0) : 0,
            runtime: `${c.modules ? c.modules.reduce((sum, m) => sum + (m.lessons ? m.lessons.reduce((ls, l) => ls + (l.durationMinutes || 10), 0) : 0), 0) : 0}m`,
            thumbnailBg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load LMS courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title.trim()) return;

    try {
      await lmsService.createCourse({
        title: newCourse.title,
        category: newCourse.category,
        description: newCourse.description,
        level: newCourse.level,
        isPublished: newCourse.isPublished,
      });

      setIsModalOpen(false);
      setNewCourse({
        title: '',
        category: 'Computer Science & Cloud',
        description: '',
        level: 'Intermediate',
        isPublished: true,
      });
      loadCourses();
    } catch (err) {
      alert(err.message || 'Failed to create course.');
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'published') return matchesSearch && course.status === 'published';
    if (activeFilter === 'draft') return matchesSearch && course.status === 'draft';
    return matchesSearch;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems,
  } = useTablePagination(filteredCourses, 6);

  const totalLessons = courses.reduce((sum, c) => sum + (c.lessons || 0), 0);
  const totalChapters = courses.reduce((sum, c) => sum + (c.chapters || 0), 0);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .creator-filter-btn {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--border-color, #e2e8f0);
          background: transparent;
          color: var(--text-secondary, #475569);
        }
        .creator-filter-btn.active {
          background: var(--primary-gradient, linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%));
          color: #ffffff !important;
          border-color: transparent;
        }
      `,
        }}
      />

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              borderRadius: '20px',
              border: '1px solid var(--border-color, #E2E8F0)',
              background: 'var(--card-bg, #FFFFFF)',
              marginBottom: '10px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary, #475569)' }}>Creator Dashboard</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px', color: '#0F172A' }}>
            Video Courses &amp; Lessons Studio
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B' }}>
            Design curriculums, upload video lectures, and manage student course access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            padding: '9px 20px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <i className="fa-solid fa-circle-plus"></i>
          <span>Create New Course</span>
        </button>
      </div>

      {/* KPI Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ padding: '12px 16px', borderLeft: '4px solid #4F46E5', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total Courses</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#4F46E5', marginTop: '4px' }}>
            {courses.length}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Curriculum Units</div>
        </div>

        <div style={{ padding: '12px 16px', borderLeft: '4px solid #10B981', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Live Published</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#10B981', marginTop: '4px' }}>
            {courses.filter((c) => c.status === 'published').length}
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>Student Accessible</div>
        </div>

        <div style={{ padding: '12px 16px', borderLeft: '4px solid #06B6D4', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Modules &amp; Chapters</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#06B6D4', marginTop: '4px' }}>
            {totalChapters}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Structured Units</div>
        </div>

        <div style={{ padding: '12px 16px', borderLeft: '4px solid #F59E0B', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Video Lessons</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>
            {totalLessons}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Total Video Content</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className={`creator-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All ({courses.length})
            </button>
            <button
              type="button"
              className={`creator-filter-btn ${activeFilter === 'published' ? 'active' : ''}`}
              onClick={() => setActiveFilter('published')}
            >
              Published ({courses.filter((c) => c.status === 'published').length})
            </button>
            <button
              type="button"
              className={`creator-filter-btn ${activeFilter === 'draft' ? 'active' : ''}`}
              onClick={() => setActiveFilter('draft')}
            >
              Drafts ({courses.filter((c) => c.status === 'draft').length})
            </button>
          </div>
        </div>
      </div>

      {/* Courses Grid View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#4F46E5' }}></i>
        </div>
      ) : paginatedItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <i className="fa-solid fa-clapperboard" style={{ fontSize: '36px', color: '#cbd5e1', marginBottom: '12px', display: 'block' }}></i>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>No Courses Found</h4>
          <p style={{ margin: '4px 0 16px', fontSize: '13px', color: '#64748b' }}>Click "Create New Course" above to publish your first video curriculum.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {paginatedItems.map((c) => (
            <div key={c.id} style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '140px', background: c.thumbnailBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative' }}>
                <i className="fa-solid fa-clapperboard fa-2x" style={{ opacity: 0.8 }}></i>
                <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(15, 23, 42, 0.75)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>
                  {c.category}
                </span>
                <span style={{ position: 'absolute', top: '10px', right: '10px', background: c.status === 'published' ? '#10B981' : '#F59E0B', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>
                  {c.statusText}
                </span>
              </div>
              <div style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{c.title}</h4>
                <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#64748b', lineHeight: '1.4', flexGrow: 1 }}>{c.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <span><i className="fa-solid fa-folder-tree me-1" style={{ color: '#4F46E5' }}></i> {c.chapters} Ch</span>
                  <span><i className="fa-solid fa-play-circle me-1" style={{ color: '#4F46E5' }}></i> {c.lessons} Lessons</span>
                  <span><i className="fa-solid fa-clock me-1" style={{ color: '#4F46E5' }}></i> {c.runtime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TablePagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        itemName="courses"
      />

      {/* Create Course Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>Create Video Course</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Infrastructure & DevOps"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>Category</label>
                <input
                  type="text"
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>Description</label>
                <textarea
                  rows="3"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Provide syllabus and objectives overview..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="pubCheck"
                  checked={newCourse.isPublished}
                  onChange={(e) => setNewCourse({ ...newCourse, isPublished: e.target.checked })}
                />
                <label htmlFor="pubCheck" style={{ fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Publish immediately (accessible to enrolled students)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ padding: '8px 14px', borderRadius: '8px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', background: '#4F46E5', color: '#fff', border: 'none', fontWeight: '700' }}>
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CreatorCourses;
