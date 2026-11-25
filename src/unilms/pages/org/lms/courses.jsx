import { Link } from 'react-router-dom';
import React, { useState, useMemo, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import apiClient from '../../../services/api';

const initialCourses = [];

const OrgLmsCourses = () => {
  const [courses, setCourses] = useState(initialCourses);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    department: 'General',
    instructor: '',
    credits: 4
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    apiClient.get('/tenants/settings/org_lms_courses')
      .then(res => {
        if (isMounted && res?.data?.value && Array.isArray(res.data.value)) {
          setCourses(res.data.value);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [searchQuery, deptFilter]);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchSearch = !searchQuery || 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === 'All' || c.department.includes(deptFilter);
      return matchSearch && matchDept;
    });
  }, [courses, searchQuery, deptFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredCourses, 10);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCourse = {
      id: Date.now(),
      title: formData.title,
      code: formData.code,
      department: formData.department,
      instructor: formData.instructor,
      enrolled_students: 0,
      modules_count: 1,
      status: 'Published',
      credits: Number(formData.credits)
    };
    const updated = [newCourse, ...courses];
    setCourses(updated);
    apiClient.post('/tenants/settings/org_lms_courses', { value: updated }).catch(() => {});
    setIsModalOpen(false);
    setFormData({
      title: '',
      code: '',
      department: 'Computer Science',
      instructor: 'Prof. Ananya Iyer',
      credits: 4
    });
  };

  return (
    <>
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
              background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
            }}
          >
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              LMS Digital Courses &amp; Curriculum Studio
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Manage digital courses, curriculum modules, video lessons, and online learning materials &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', color: '#ffffff', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Create New Course</span>
          </button>
          <Link
            to="/unilms/org/materials"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-book-open" style={{ color: '#7C3AED' }}></i>
            <span>Study Materials</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}
      >
        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid #E11D48',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Total Courses
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#E11D48', marginTop: '2px', lineHeight: '1.2' }}>
            {courses.length} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Active</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            Active digital syllabus
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--success, #10B981)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Enrolled Learners
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
            {courses.reduce((sum, c) => sum + c.enrolled_students, 0)} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Students</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> Active Enrollments
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid #06B6D4',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Curriculum Modules
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
            {courses.reduce((sum, c) => sum + c.modules_count, 0)} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Modules</span>
          </div>
          <div style={{ fontSize: '10px', color: '#06B6D4', fontWeight: '700', marginTop: '2px' }}>
            Learning chapters
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--warning, #F59E0B)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Active Instructors
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            4 <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Professors</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--warning, #F59E0B)', fontWeight: '700', marginTop: '2px' }}>
            Course coordinators
          </div>
        </div>
      </div>

      {/* Course Catalog Card */}
      <div className="card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
        
        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Course Directory
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing {filteredCourses.length} of {courses.length} courses
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px' }}></i>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search course title..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '13px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
              />
            </div>

            <div style={{ display: 'flex', background: 'var(--bg-main, #F1F5F9)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {['All', 'Computer', 'Electronics', 'Mechanical'].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDeptFilter(d)}
                  style={{
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: deptFilter === d ? '700' : '500',
                    background: deptFilter === d ? '#ffffff' : 'transparent',
                    color: deptFilter === d ? '#7C3AED' : 'var(--text-secondary)',
                    boxShadow: deptFilter === d ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Course Code</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Course Title</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Department</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Instructor</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Students</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedItems.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No courses found.</td></tr>
              ) : (
                paginatedItems.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge" style={{ background: '#F5F3FF', color: '#7C3AED', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {c.code}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {c.title}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {c.department}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {c.instructor}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {c.enrolled_students} Enrolled
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge" style={{ background: c.status === 'Published' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', color: c.status === 'Published' ? '#059669' : '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                        {c.status}
                      </span>
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
          itemName="courses"
        />
      </div>

      {/* Drawer */}
      <div 
        className={`drawer-overlay ${isModalOpen ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target.classList.contains('drawer-overlay')) setIsModalOpen(false);
        }}
      >
        <div className="drawer-content" style={{ maxWidth: '540px' }}>
          <form onSubmit={handleSubmit}>
            <div className="drawer-header" style={{ background: '#7C3AED', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Create New Course</h3>
                <small style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>Publish digital course module</small>
              </div>
              <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="drawer-body" style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Course Title *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. Cloud Computing & DevOps" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Course Code *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. CS-405" 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Department</label>
                <select 
                  className="form-control" 
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Instructor</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Faculty name" 
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                />
              </div>
            </div>
            <div className="drawer-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#7C3AED', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Publish Course</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default OrgLmsCourses;
