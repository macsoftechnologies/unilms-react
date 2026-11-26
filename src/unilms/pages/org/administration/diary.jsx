import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import studentsService from '../../../services/students.service';

const OrgAdministrationDiary = () => {
  const [notices, setNotices] = useState([]);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_audience: 'All',
    publish_date: new Date().toISOString().split('T')[0],
    expiry_date: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await studentsService.getAcademicNotices();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setNotices(list.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content || n.message || '',
        target_audience: n.targetAudience || 'All',
        publish_date: n.createdAt ? n.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        expiry_date: n.expiryDate ? n.expiryDate.split('T')[0] : '',
        created_by_name: n.author || n.createdBy || 'Campus Registrar'
      })));
    } catch (err) {
      console.warn('Failed to load academic notices:', err);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleOpenAdd = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      content: '',
      target_audience: 'All',
      publish_date: new Date().toISOString().split('T')[0],
      expiry_date: ''
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (n) => {
    setEditingNotice(n);
    setFormData({
      title: n.title,
      content: n.content,
      target_audience: n.target_audience,
      publish_date: n.publish_date,
      expiry_date: n.expiry_date || ''
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await studentsService.createAcademicNotice({
        title: formData.title,
        content: formData.content,
        targetAudience: formData.target_audience,
      });
      await fetchNotices();
    } catch (err) {
      console.warn('Failed to save academic notice:', err);
    }
    setIsDrawerOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this circular announcement?')) {
      setNotices(prev => prev.filter(n => n.id !== id));
    }
  };

  const filteredNotices = notices.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.created_by_name.toLowerCase().includes(search.toLowerCase());
    const matchesAudience = audienceFilter === 'ALL' || n.target_audience === audienceFilter;
    return matchesSearch && matchesAudience;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredNotices, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, audienceFilter, setCurrentPage]);

  return (
    <>
      <section className="view-section active">
        {/* Top Header Card */}
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
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
              }}
            >
              <i className="fa-solid fa-newspaper"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Institutional Diary &amp; Public Notice Board
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Campus announcements, administrative circulars, official circulars &amp; student notifications
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={handleOpenAdd}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Post Notice</span>
            </button>
            <Link
              to="/unilms/org/administration"
              className="btn btn-outline"
              style={{
                background: 'var(--card-bg, #fff)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-arrow-left" style={{ color: '#4F46E5' }}></i>
              <span>Admin Hub</span>
            </Link>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px' }}></i>
            <input
              type="text"
              placeholder="Search circulars and notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '34px', height: '38px', borderRadius: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'All', 'Students', 'Faculty', 'Staff'].map((aud) => (
              <button
                key={aud}
                type="button"
                onClick={() => setAudienceFilter(aud)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: '1px solid',
                  borderColor: audienceFilter === aud ? '#4F46E5' : 'var(--border-color)',
                  background: audienceFilter === aud ? '#4F46E5' : 'var(--card-bg, #fff)',
                  color: audienceFilter === aud ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {aud === 'ALL' ? 'All Audiences' : aud}
              </button>
            ))}
          </div>
        </div>

        {/* Notices Table */}
        <div className="table-container" style={{ background: 'var(--card-bg, #fff)', borderRadius: '14px', border: '1px solid var(--border-color)', overflowX: 'auto', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #F8FAFC)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Notice / Circular Title</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Target Audience</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Publish Date</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Expiry Date</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Authority / Desk</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: '300px' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px', display: 'block' }}>{d.title}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.content.slice(0, 75)}...</span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.08)', color: '#4F46E5', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '11.5px' }}>
                        {d.target_audience}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {d.publish_date}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {d.expiry_date || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Permanent</span>}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {d.created_by_name}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div className="action-buttons" style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenEdit(d)}
                          style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-pen me-1"></i> Edit
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => handleDelete(d.id)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '13px' }}
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No notices found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="notices & circulars"
          />
        </div>
      </section>

      {/* Post/Edit Notice Drawer */}
      {isDrawerOpen && (
        <div
          className="drawer-overlay active"
          onClick={() => setIsDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}
        >
          <div
            className="drawer-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '520px', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="drawer-header" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                  {editingNotice ? 'Edit Notice' : 'Post New Notice'}
                </h3>
                <button type="button" className="btn-close" onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="drawer-body" style={{ padding: '22px', flex: 1, overflowY: 'auto' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Notice Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-control"
                    required
                    placeholder="e.g. Mid-Term Exam Notification"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Target Audience</label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 10px', fontSize: '13px' }}
                  >
                    <option value="All">All Campus</option>
                    <option value="Students">Students Only</option>
                    <option value="Faculty">Faculty Only</option>
                    <option value="Staff">Staff Only</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Publish Date *</label>
                    <input
                      type="date"
                      value={formData.publish_date}
                      onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                      className="form-control"
                      required
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="form-control"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Notice Details / Circular Body</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="form-control"
                    rows="5"
                    required
                    placeholder="Provide full text of the circular..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>
              <div className="drawer-footer" style={{ padding: '16px 22px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsDrawerOpen(false)} style={{ borderRadius: '8px', padding: '8px 16px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: '700' }}>
                  Save Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgAdministrationDiary;
