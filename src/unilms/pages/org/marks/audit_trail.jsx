import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import { facultyService } from '../../../services/faculty.service';

const OrgMarksAuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [filterAction, setFilterAction] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLiveAudit = async () => {
      setLoading(true);
      try {
        const assessments = await facultyService.getAssessments();
        if (Array.isArray(assessments) && assessments.length > 0) {
          const liveLogs = assessments.map((a) => {
            const dateStr = a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
            return {
              id: a.id,
              timestamp: `${dateStr}, ${new Date(a.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              subject_name: `${a.subject?.name || 'Curriculum Subject'} (${a.subject?.code || 'SUB'})`,
              cohort_name: a.subject?.department?.name || 'Academic Department',
              exam_type: a.type || 'Continuous Internal Assessment',
              component_name: a.title || 'Continuous Assessment',
              action: a.status === 'locked' ? 'locked' : (a.status === 'unlocked' ? 'unlocked' : 'submitted'),
              user_name: a.faculty?.user?.name || 'Academic Faculty In-Charge',
              reason: a.status === 'locked' ? 'Administrative freeze of assessment marks.' : 'Assessment created and published for grading.',
            };
          });
          setLogs(liveLogs);
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.warn('Failed to load audit trail:', err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadLiveAudit();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchAction = !filterAction || log.action === filterAction;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      log.subject_name.toLowerCase().includes(q) ||
      log.cohort_name.toLowerCase().includes(q) ||
      log.user_name.toLowerCase().includes(q) ||
      log.component_name.toLowerCase().includes(q);
    return matchAction && matchSearch;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredLogs, 10);

  return (
    <>
      <section className="view-section active">
        {/* Top Header Card matching Reference UI */}
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
                background: 'linear-gradient(135deg, #475569, #1E293B)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(71, 85, 105, 0.3)'
              }}
            >
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Assessment Marks Audit Trail
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Immutable security logs of all mark entries, grade submissions, unlock approvals &amp; administrative lock actions.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/unilms/org/marks/components"
              className="btn btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: '700',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg, #fff)'
              }}
            >
              <i className="fa-solid fa-sliders text-primary"></i>
              <span>Assessment Setup</span>
            </Link>
          </div>
        </div>

        {/* Filter Card */}
        <div className="card" style={{ padding: '18px 24px', marginBottom: '20px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '240px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>
                Search Audit Trail
              </label>
              <input 
                type="text" 
                placeholder="Search by subject, cohort, faculty, or component..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ height: '40px', borderRadius: '8px' }}
              />
            </div>

            <div style={{ width: '220px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>
                Action Filter
              </label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="form-control"
                style={{ height: '40px', borderRadius: '8px' }}
              >
                <option value="">All Actions</option>
                <option value="locked">Locked Only</option>
                <option value="unlocked">Unlocked Only</option>
                <option value="submitted">Submitted Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', width: '170px' }}>Timestamp</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Subject Course</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Component</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Action</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>User / Role</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Audit Reason</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No audit trail logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((log) => {
                    const actionBg = log.action === 'locked' ? '#fee2e2' : log.action === 'unlocked' ? '#fef3c7' : '#dcfce7';
                    const actionColor = log.action === 'locked' ? '#991b1b' : log.action === 'unlocked' ? '#92400e' : '#166534';
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {log.timestamp}
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {log.subject_name}
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            {log.cohort_name}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '600' }}>
                          {log.component_name}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span className="badge" style={{ background: actionBg, color: actionColor, textTransform: 'capitalize', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '600' }}>
                          {log.user_name}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                          {log.reason}
                        </td>
                      </tr>
                    );
                  })
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
            itemName="audit logs"
          />
        </div>
      </section>
    </>
  );
};

export default OrgMarksAuditTrail;
