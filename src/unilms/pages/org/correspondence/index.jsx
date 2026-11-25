import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import notificationsService from '../../../services/notifications.service';
import { 
  getStoredNotifications, 
  toggleNotificationStatus, 
  markAllNotificationsRead, 
  addBroadcastNotification,
  getStoredTemplates,
  getStoredFestivals
} from './correspondenceData';

const OrgCorrespondenceIndex = () => {
  const [notifications, setNotifications] = useState([]);
  const [templates] = useState(getStoredTemplates());
  const [festivals] = useState(getStoredFestivals());

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Unread' | 'Read'

  // Quick Broadcast Drawer State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    recipient_name: 'All University Students & Faculty',
    title: '',
    message: '',
    channel: 'In-App Notification'
  });

  // Log Detail Modal State
  const [selectedLog, setSelectedLog] = useState(null);

  // Computed KPI Metrics
  const totalLogs = notifications.length;
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = notifications.filter(n => n.is_read).length;
  const totalTemplates = templates.length;
  const totalCampaigns = festivals.length;

  const [loading, setLoading] = useState(true);

  // Load from backend notifications service
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await notificationsService.getNotifications().catch(() => null);
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (list.length > 0) {
          const norm = list.map(n => ({
            id: n.id,
            recipient_name: n.recipient || 'All University Students & Faculty',
            title: n.title,
            message: n.message,
            created_at: n.createdAt ? n.createdAt.replace('T', ' ').slice(0, 19) : '2026-11-20 10:00:00',
            is_read: n.isRead ? 1 : 0,
            channel: n.channel || 'In-App Notification'
          }));
          setNotifications(norm);
        } else {
          setNotifications(getStoredNotifications());
        }
      } catch {
        setNotifications(getStoredNotifications());
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (item.recipient_name && item.recipient_name.toLowerCase().includes(q)) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.message && item.message.toLowerCase().includes(q));

      const matchStatus = 
        statusFilter === 'All' ? true :
        statusFilter === 'Unread' ? !item.is_read :
        item.is_read;

      return matchSearch && matchStatus;
    });
  }, [notifications, searchQuery, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedNotifications,
    totalItems
  } = useTablePagination(filteredNotifications, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, setCurrentPage]);

  const handleToggleStatus = (id) => {
    const updated = toggleNotificationStatus(id);
    setNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = markAllNotificationsRead();
    setNotifications(updated);
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      alert('Please fill in both Subject/Title and Message Body.');
      return;
    }

    try {
      await notificationsService.createNotification({
        title: broadcastForm.title.trim(),
        message: broadcastForm.message.trim(),
        recipient: broadcastForm.recipient_name,
        channel: broadcastForm.channel
      }).catch(() => {});
    } catch {}

    const updated = addBroadcastNotification({
      recipient_name: broadcastForm.recipient_name,
      title: broadcastForm.title,
      message: broadcastForm.message,
      channel: broadcastForm.channel
    });

    setNotifications(updated);
    setIsBroadcastModalOpen(false);
    setBroadcastForm({
      recipient_name: 'All University Students & Faculty',
      title: '',
      message: '',
      channel: 'In-App Notification'
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return dateStr;
      const pad = (n) => String(n).padStart(2, '0');
      const hours = d.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = pad(hours % 12 || 12);
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${formattedHours}:${pad(d.getMinutes())} ${ampm}`;
    } catch {
      return dateStr;
    }
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
              background: 'linear-gradient(135deg, #F43F5E, #E11D48)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)'
            }}
          >
            <i className="fa-solid fa-bullhorn"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Correspondence &amp; Circulars Hub
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Monitor university circulars, SMS broadcasts, email dispatches &amp; in-app announcements
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => setIsBroadcastModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)', color: '#ffffff', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(225, 29, 72, 0.25)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-paper-plane"></i>
            <span>Quick Broadcast</span>
          </button>
          {unreadCount > 0 && (
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleMarkAllRead}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-envelope-open-text" style={{ color: '#E11D48' }}></i>
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Statistical Summary Cards - Border-left Accent Model (Image 1) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px', marginBottom: '22px' }}>
        {/* Total Broadcasts */}
        <div 
          className="card" 
          style={{ 
            padding: '12px 16px', 
            borderLeft: '4px solid #E11D48', 
            borderTop: '1px solid var(--border-color, #E2E8F0)', 
            borderRight: '1px solid var(--border-color, #E2E8F0)', 
            borderBottom: '1px solid var(--border-color, #E2E8F0)', 
            borderRadius: '12px', 
            background: 'var(--card-bg, #FFFFFF)', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)' 
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Total Dispatch Logs
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#E11D48', marginTop: '3px', lineHeight: '1.2' }}>
            {totalLogs} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Entries</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> {readCount} Read &amp; Delivered
          </div>
        </div>

        {/* Unread Alerts */}
        <div 
          className="card" 
          style={{ 
            padding: '12px 16px', 
            borderLeft: '4px solid var(--warning, #F59E0B)', 
            borderTop: '1px solid var(--border-color, #E2E8F0)', 
            borderRight: '1px solid var(--border-color, #E2E8F0)', 
            borderBottom: '1px solid var(--border-color, #E2E8F0)', 
            borderRadius: '12px', 
            background: 'var(--card-bg, #FFFFFF)', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)' 
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Unread Alerts
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '3px', lineHeight: '1.2' }}>
            {unreadCount} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Pending</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--warning, #F59E0B)', fontWeight: '700', marginTop: '4px' }}>
            <i className="fa-solid fa-bell me-1"></i> Awaiting User Acknowledgement
          </div>
        </div>

        {/* Message Templates */}
        <Link to="/unilms/org/correspondence/templates" style={{ textDecoration: 'none' }}>
          <div 
            className="card" 
            style={{ 
              padding: '12px 16px', 
              borderLeft: '4px solid #06B6D4', 
              borderTop: '1px solid var(--border-color, #E2E8F0)', 
              borderRight: '1px solid var(--border-color, #E2E8F0)', 
              borderBottom: '1px solid var(--border-color, #E2E8F0)', 
              borderRadius: '12px', 
              background: 'var(--card-bg, #FFFFFF)', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              cursor: 'pointer' 
            }}
          >
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Active Templates
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#06B6D4', marginTop: '3px', lineHeight: '1.2' }}>
              {totalTemplates} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Templates</span>
            </div>
            <div style={{ fontSize: '11px', color: '#06B6D4', fontWeight: '700', marginTop: '4px' }}>
              <i className="fa-solid fa-layer-group me-1"></i> Reusable Broadcast Formats
            </div>
          </div>
        </Link>

        {/* Festival Greetings */}
        <Link to="/unilms/org/correspondence/festivals" style={{ textDecoration: 'none' }}>
          <div 
            className="card" 
            style={{ 
              padding: '12px 16px', 
              borderLeft: '4px solid var(--success, #10B981)', 
              borderTop: '1px solid var(--border-color, #E2E8F0)', 
              borderRight: '1px solid var(--border-color, #E2E8F0)', 
              borderBottom: '1px solid var(--border-color, #E2E8F0)', 
              borderRadius: '12px', 
              background: 'var(--card-bg, #FFFFFF)', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              cursor: 'pointer' 
            }}
          >
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Festival Campaigns
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success, #10B981)', marginTop: '3px', lineHeight: '1.2' }}>
              {totalCampaigns} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Campaigns</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '4px' }}>
              <i className="fa-solid fa-calendar-check me-1"></i> Scheduled &amp; Dispatched
            </div>
          </div>
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
        
        {/* Table Header and Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Recent System Notifications
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing {filteredNotifications.length} of {totalLogs} correspondence events
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px' }}></i>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search recipient, title..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '13px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', background: 'var(--bg-main, #F1F5F9)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {['All', 'Unread', 'Read'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: statusFilter === st ? '700' : '500',
                    background: statusFilter === st ? '#ffffff' : 'transparent',
                    color: statusFilter === st ? '#7C3AED' : 'var(--text-secondary)',
                    boxShadow: statusFilter === st ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Date & Time</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Recipient</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Subject / Title</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Message Snippet</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedNotifications.length > 0 ? (
                paginatedNotifications.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {formatDate(log.created_at)}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.is_read ? '#10B981' : '#F59E0B' }}></span>
                        {log.recipient_name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 'bold', color: 'var(--primary, #7C3AED)', fontSize: '13px' }}>
                      <span 
                        onClick={() => setSelectedLog(log)} 
                        style={{ cursor: 'pointer', textDecoration: 'none' }}
                        title="Click to view details"
                      >
                        {log.title}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.message}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {log.is_read ? (
                        <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success, #059669)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
                          READ
                        </span>
                      ) : (
                        <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning, #D97706)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
                          UNREAD
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={() => handleToggleStatus(log.id)}
                        title={log.is_read ? 'Mark as Unread' : 'Mark as Read'}
                        style={{ padding: '4px 9px', fontSize: '11px', marginRight: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <i className={`fa-solid ${log.is_read ? 'fa-envelope' : 'fa-envelope-open'}`}></i>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={() => setSelectedLog(log)}
                        title="View Details"
                        style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px', color: '#94A3B8' }}>
                      <i className="fa-solid fa-inbox"></i>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>No correspondence logs found.</div>
                    <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Adjust search criteria or dispatch a new broadcast message.</p>
                  </td>
                </tr>
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
          itemName="correspondence events"
        />
      </div>

      {/* Quick Broadcast Drawer (Offcanvas) */}
      <div 
        className={`drawer-overlay ${isBroadcastModalOpen ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target.classList.contains('drawer-overlay')) setIsBroadcastModalOpen(false);
        }}
      >
        <div className="drawer-content" style={{ maxWidth: '580px' }}>
          <form onSubmit={handleSendBroadcast}>
            <div className="drawer-header" style={{ background: '#7C3AED', color: '#ffffff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                  <i className="fa-solid fa-paper-plane" style={{ marginRight: '8px' }}></i> Quick Broadcast Notice
                </h3>
                <small style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
                  Dispatch instant notifications to students, faculty or staff
                </small>
              </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setIsBroadcastModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="drawer-body" style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Target Recipients <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select 
                  className="form-control"
                  value={broadcastForm.recipient_name}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, recipient_name: e.target.value })}
                  required
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                >
                  <option value="All University Students & Faculty">All University Students & Faculty</option>
                  <option value="All Faculty Members">All Faculty Members</option>
                  <option value="Final Year B.Tech Students">Final Year B.Tech Students</option>
                  <option value="B.Tech 1st Year Cohort">B.Tech 1st Year Cohort</option>
                  <option value="Parents & Guardians">Parents & Guardians</option>
                  <option value="Hostel Residents">Hostel Residents</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Broadcast Channel
                </label>
                <select 
                  className="form-control"
                  value={broadcastForm.channel}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, channel: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                >
                  <option value="In-App Notification">In-App Notification</option>
                  <option value="In-App & SMS">In-App & SMS Alert</option>
                  <option value="Email Circular">Official Email Circular</option>
                  <option value="Broadcast Circular">All Channels (App + SMS + Email)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Subject / Title <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Urgent Notice: Campus Closure for Election"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  required
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Message Content <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea 
                  className="form-control"
                  rows={6}
                  placeholder="Enter full announcement details here..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  required
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '12px' }}
                />
              </div>

              <div style={{ background: 'var(--bg-main, #F8FAFC)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-circle-info" style={{ color: '#7C3AED', fontSize: '16px' }}></i>
                <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Notifications will be dispatched in real-time to active sessions and recorded in the audit log.
                </small>
              </div>
            </div>

            <div className="drawer-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsBroadcastModalOpen(false)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#F1F5F9', color: '#475569', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#7C3AED', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
              >
                Dispatch Broadcast
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div 
          className="drawer-overlay active"
          onClick={(e) => {
            if (e.target.classList.contains('drawer-overlay')) setSelectedLog(null);
          }}
        >
          <div className="drawer-content" style={{ maxWidth: '540px' }}>
            <div className="drawer-header" style={{ background: '#7C3AED', color: '#ffffff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Notification Details</h3>
                <small style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>ID #{selectedLog.id}</small>
              </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setSelectedLog(null)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="drawer-body" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject / Title</span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#7C3AED', fontWeight: '700' }}>{selectedLog.title}</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '16px', marginBottom: '16px', background: 'var(--bg-main, #F8FAFC)', padding: '14px', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recipient</span>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>{selectedLog.recipient_name}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date & Time</span>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>{formatDate(selectedLog.created_at)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
                  <div style={{ marginTop: '4px' }}>
                    {selectedLog.is_read ? (
                      <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>READ</span>
                    ) : (
                      <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>UNREAD</span>
                    )}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Channel</span>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedLog.channel || 'In-App Notification'}</div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Message Body</span>
                <div style={{ marginTop: '6px', padding: '16px', background: 'var(--bg-main, #F1F5F9)', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {selectedLog.message}
                </div>
              </div>
            </div>

            <div className="drawer-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => {
                  handleToggleStatus(selectedLog.id);
                  setSelectedLog({ ...selectedLog, is_read: selectedLog.is_read ? 0 : 1 });
                }}
                style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
              >
                {selectedLog.is_read ? 'Mark as Unread' : 'Mark as Read'}
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setSelectedLog(null)}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#7C3AED', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgCorrespondenceIndex;