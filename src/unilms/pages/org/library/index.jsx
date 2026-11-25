import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import libraryService from '../../../services/library.service';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';

const OrgLibraryIndex = () => {
  const [stats, setStats] = useState({
    totalTitles: 8,
    totalVolumes: 42,
    availableVolumes: 39,
    issuedVolumes: 3,
    categoriesCount: 4,
    activeIssues: 3,
    overdueIssues: 1,
    activeMembers: 8,
    periodicalsCount: 4
  });
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const [sRes, iRes, cRes] = await Promise.all([
        libraryService.getStats(),
        libraryService.getIssues(),
        libraryService.getCategories()
      ]);

      if (sRes) setStats(sRes);
      if (Array.isArray(iRes)) setIssues(iRes);
      if (Array.isArray(cRes)) setCategories(cRes);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Failed to load library dashboard data:', err);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedIssues,
    totalItems
  } = useTablePagination(issues, 5);

  return (
    <div className="library-dashboard-view">
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
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <i className="fa-solid fa-book-bookmark"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Central Library &amp; OPAC Catalog
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: isSyncing ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  color: isSyncing ? '#6366F1' : '#10B981',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <i className={`fa-solid ${isSyncing ? 'fa-arrows-rotate fa-spin' : 'fa-circle-check'}`} style={{ fontSize: '9px' }}></i>
                {isSyncing ? 'Syncing...' : 'Live Sync'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Physical catalog accession register, circulation loans &amp; member borrower records &bull; Last Synced: {lastSyncTime}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => loadData(false)}
            className="btn btn-outline"
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--card-bg, #fff)',
              color: 'var(--text-primary)',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
            title="Refresh database records"
          >
            <i className={`fa-solid fa-rotate-right me-1 ${loading ? 'fa-spin' : ''}`}></i>
            Refresh
          </button>
          <Link 
            to="/unilms/org/library/issues" 
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-hand-holding-hand"></i>
            <span>Circulation Desk</span>
          </Link>
          <Link 
            to="/unilms/org/library/books" 
            className="btn btn-outline"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              background: 'var(--card-bg, #fff)',
              fontWeight: '700',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-book" style={{ color: '#059669' }}></i>
            <span>OPAC Catalog</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #E11D48',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Book Titles Cataloged
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#E11D48', marginTop: '2px', lineHeight: '1.2' }}>
            {stats.totalTitles} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Titles</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '4px' }}>
            {stats.totalVolumes} Total Volumes ({stats.availableVolumes} Available)
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid var(--success, #10B981)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Currently Circulating
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
            {stats.activeIssues} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Books Issued</span>
          </div>
          <div style={{ fontSize: '11px', color: stats.overdueIssues > 0 ? '#DC2626' : 'var(--success, #10B981)', fontWeight: '700', marginTop: '4px' }}>
            <i className={`fa-solid ${stats.overdueIssues > 0 ? 'fa-triangle-exclamation' : 'fa-circle-check'} me-1`}></i>
            {stats.overdueIssues > 0 ? `${stats.overdueIssues} Overdue Loans` : 'All loans within due date'}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #06B6D4',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Active Library Members
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
            {stats.activeMembers} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Cardholders</span>
          </div>
          <div style={{ fontSize: '11px', color: '#06B6D4', fontWeight: '600', marginTop: '4px' }}>
            Students &amp; teaching faculty cards
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid var(--warning, #F59E0B)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Categories &amp; Journals
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            {stats.categoriesCount} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Sections</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--warning, #F59E0B)', fontWeight: '700', marginTop: '4px' }}>
            {stats.periodicalsCount} Periodical &amp; Journal Subscriptions
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Issues & Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Recent Circulation */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>
              <i className="fa-solid fa-clock-rotate-left me-2" style={{ color: '#7C3AED' }}></i> Recent Circulation Desk Activity
            </h4>
            <Link to="/unilms/org/library/issues" style={{ fontSize: '13px', color: '#7C3AED', textDecoration: 'none', fontWeight: '600' }}>
              View All ({issues.length}) <i className="fa-solid fa-arrow-right ms-1"></i>
            </Link>
          </div>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Book Title</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Issued To</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Due Date</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={4} rows={pageSize || 5} />
                ) : paginatedIssues.length > 0 ? (
                  paginatedIssues.map((i) => {
                    const borrowerName = i.student ? `${i.student.firstName} ${i.student.lastName || ''}`.trim() : (i.staff ? `${i.staff.firstName} ${i.staff.lastName || ''}`.trim() : 'Borrower');
                    const rollOrCode = i.student?.rollNumber || i.staff?.employeeCode || '';
                    const isOverdue = i.status === 'OVERDUE' || (i.status === 'ISSUED' && new Date(i.dueDate) < new Date());

                    return (
                      <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{i.book?.accessionNo || 'ACC'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {i.book?.title || 'Book Title'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: '600', color: '#334155' }}>
                            {borrowerName}
                          </div>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: i.student ? '#EFF6FF' : '#F5F3FF',
                            color: i.student ? '#2563EB' : '#7C3AED',
                            fontWeight: '600'
                          }}>
                            {rollOrCode} ({i.student ? 'Student' : 'Faculty'})
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ color: isOverdue ? '#DC2626' : '#334155', fontWeight: isOverdue ? '700' : '500' }}>
                            {i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'N/A'}
                          </span>
                          {isOverdue && <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: '700' }}>Overdue</div>}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            background: i.status === 'RETURNED' ? '#DCFCE7' : (isOverdue ? '#FEE2E2' : '#FEF3C7'),
                            color: i.status === 'RETURNED' ? '#16A34A' : (isOverdue ? '#DC2626' : '#D97706')
                          }}>
                            {i.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No circulation records found in database.</td></tr>
                )}
              </tbody>
            </table>

            <TablePagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemName="circulation records"
            />
          </div>
        </div>

        {/* Categories Breakdown */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>
              <i className="fa-solid fa-layer-group me-2" style={{ color: '#059669' }}></i> Classification Sections
            </h4>
            <Link to="/unilms/org/library/categories" style={{ fontSize: '13px', color: '#7C3AED', textDecoration: 'none', fontWeight: '600' }}>
              Manage Sections <i className="fa-solid fa-arrow-right ms-1"></i>
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categories.map((cat) => {
              const bookCount = cat._count?.books ?? 0;
              return (
                <div key={cat.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#F8FAFC',
                  border: '1px solid #F1F5F9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10B981' }}></div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>{cat.name}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>{cat.description || 'General section'}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748B',
                    background: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    whiteSpace: 'nowrap'
                  }}>
                    {bookCount} titles
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgLibraryIndex;
