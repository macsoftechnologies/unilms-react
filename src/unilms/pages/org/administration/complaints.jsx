import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import studentsService from '../../../services/students.service';

const OrgAdministrationComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('Open');
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await studentsService.getComplaints();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setComplaints(list.map((c) => ({
        id: c.id,
        subject: c.subject || 'Campus Inquiry',
        user_name: c.student ? `${c.student.firstName} ${c.student.lastName || ''}`.trim() : 'Anonymous / Student',
        role: 'Student',
        email: c.student?.email || 'N/A',
        created_at: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
        status: c.status || 'In Progress',
        priority: c.category === 'Disciplinary' ? 'High' : (c.category === 'Hostel' ? 'High' : 'Medium'),
        description: c.description || ''
      })));
    } catch (err) {
      console.warn('Failed to fetch complaints from backend:', err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleOpenView = (c) => {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setIsDrawerOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      await studentsService.updateComplaint(selectedComplaint.id, { status: newStatus });
      setComplaints(prev =>
        prev.map(c => c.id === selectedComplaint.id ? { ...c, status: newStatus } : c)
      );
    } catch (err) {
      console.warn('Failed to update complaint status:', err);
    }
    setIsDrawerOpen(false);
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch =
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.user_name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredComplaints, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, setCurrentPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.25)' };
      case 'In Progress':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706', border: '1px solid rgba(245, 158, 11, 0.25)' };
      case 'Resolved':
        return { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)' };
      case 'Closed':
      default:
        return { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748B', border: '1px solid rgba(100, 116, 139, 0.25)' };
    }
  };

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
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Complaints &amp; Grievances Redressal Desk
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Monitor incoming complaints, status tracking, resolution reports &amp; student escalations &bull; AY 2026&ndash;2027
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
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

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px' }}></i>
            <input
              type="text"
              placeholder="Search complaint subject, applicant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '34px', height: '38px', borderRadius: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: '1px solid',
                  borderColor: statusFilter === st ? '#4F46E5' : 'var(--border-color)',
                  background: statusFilter === st ? '#4F46E5' : 'var(--card-bg, #fff)',
                  color: statusFilter === st ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {st === 'ALL' ? 'All Tickets' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Table */}
        <div className="table-container" style={{ background: 'var(--card-bg, #fff)', borderRadius: '14px', border: '1px solid var(--border-color)', overflowX: 'auto', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #F8FAFC)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Subject</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Submitted By</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((c) => {
                  const badge = getStatusBadge(c.status);
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: '300px' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px', display: 'block' }}>{c.subject}</strong>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Priority: {c.priority}</span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{c.user_name}</div>
                        <small style={{ color: 'var(--text-muted)' }}>{c.email}</small>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.08)', color: '#4F46E5', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '11.5px' }}>
                          {c.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {c.created_at}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ background: badge.bg, color: badge.color, border: badge.border, padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenView(c)}
                          style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <i className="fa-solid fa-eye"></i> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No complaints found matching the active filter.
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
            itemName="complaint tickets"
          />
        </div>
      </section>

      {/* View & Update Drawer Modal */}
      {isDrawerOpen && selectedComplaint && (
        <div
          className="drawer-overlay active"
          onClick={() => setIsDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}
        >
          <div
            className="drawer-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '500px', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}
          >
            <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="drawer-header" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                  Complaint Details &bull; #{selectedComplaint.id}
                </h3>
                <button type="button" className="btn-close" onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="drawer-body" style={{ padding: '22px', flex: 1, overflowY: 'auto' }}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Subject</label>
                  <p style={{ fontWeight: '700', fontSize: '14px', margin: '4px 0', color: 'var(--text-primary)' }}>{selectedComplaint.subject}</p>
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Applicant</label>
                  <p style={{ margin: '4px 0', fontSize: '13px' }}>
                    <strong>{selectedComplaint.user_name}</strong> ({selectedComplaint.role}) &bull; {selectedComplaint.email}
                  </p>
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Description</label>
                  <div style={{ padding: '12px', background: 'var(--bg-main, #F8FAFC)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', lineHeight: '1.5', marginTop: '4px' }}>
                    {selectedComplaint.description}
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 10px', fontSize: '13px' }}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="drawer-footer" style={{ padding: '16px 22px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsDrawerOpen(false)} style={{ borderRadius: '8px', padding: '8px 16px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: '700' }}>
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgAdministrationComplaints;
