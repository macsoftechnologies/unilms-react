import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import frontOfficeService from '../../../services/front-office.service';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';

const OrgFrontOfficeIndex = () => {
  const [stats, setStats] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const [statsData, visitorsData, callsData] = await Promise.all([
        frontOfficeService.getStats(),
        frontOfficeService.getVisitors(),
        frontOfficeService.getCalls()
      ]);

      if (statsData) setStats(statsData);
      setVisitors(Array.isArray(visitorsData) ? visitorsData : []);
      setCalls(Array.isArray(callsData) ? callsData : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Failed to load front office telemetry from PostgreSQL:', e);
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
    currentPage: visitorsPage,
    setCurrentPage: setVisitorsPage,
    pageSize: visitorsSize,
    setPageSize: setVisitorsSize,
    paginatedItems: paginatedVisitors,
    totalItems: totalVisitors
  } = useTablePagination(visitors, 5);

  const {
    currentPage: callsPage,
    setCurrentPage: setCallsPage,
    pageSize: callsSize,
    setPageSize: setCallsSize,
    paginatedItems: paginatedCalls,
    totalItems: totalCalls
  } = useTablePagination(calls, 5);

  const todayVisitors = stats?.totalVisitorsToday ?? visitors.length;
  const currentlyInside = stats?.currentlyInside ?? visitors.filter(v => v.status === 'inside').length;
  const todayCalls = stats?.totalCallsLogged ?? calls.length;
  const todayPostal = stats?.totalPostalPackets ?? 0;
  const activeEnquiries = stats?.totalEnquiries ?? 0;

  return (
    <>
      <section className="view-section active">
        {/* Top Header Card matching Reference UI */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color, #e2e8f0)',
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
                background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
              }}
            >
              <i className="fa-solid fa-headset"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Front Office &amp; Reception Hub
                </h2>
                {isSyncing && (
                  <span style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-arrows-rotate fa-spin"></i> Syncing...
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Campus gate passes, visitor logs, telephony communications, postal dispatch &amp; enquiries &bull; Realtime DB &bull; Synced at {lastSyncTime}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link 
              to="/unilms/org/front_office/visitors" 
              className="btn btn-primary" 
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-person-walking"></i>
              <span>Visitors Book</span>
            </Link>
            <Link 
              to="/unilms/org/front_office/enquiries" 
              className="btn btn-outline" 
              style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '13px', textDecoration: 'none', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary, #334155)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-user-plus" style={{ color: '#0284C7' }}></i>
              <span>Enquiries</span>
            </Link>
            <Link 
              to="/unilms/org/front_office/call_logs" 
              className="btn btn-outline" 
              style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '13px', textDecoration: 'none', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary, #334155)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-phone" style={{ color: '#0284C7' }}></i>
              <span>Call Logs</span>
            </Link>
          </div>
        </div>

        {/* Top KPI Cards */}
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
              borderTop: '1px solid var(--border-color, #E2E8F0)',
              borderRight: '1px solid var(--border-color, #E2E8F0)',
              borderBottom: '1px solid var(--border-color, #E2E8F0)',
              borderRadius: '10px',
              background: 'var(--surface, #FFFFFF)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Today's Visitors
            </div>
            <div id="stat_today_visitors" style={{ fontSize: '18px', fontWeight: '800', color: '#E11D48', marginTop: '3px', lineHeight: '1.2' }}>
              {todayVisitors} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Logged</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '3px' }}>
              <i className="fa-solid fa-building-user me-1"></i> {currentlyInside} currently on campus
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '12px 16px',
              borderLeft: '4px solid #10B981',
              borderTop: '1px solid var(--border-color, #E2E8F0)',
              borderRight: '1px solid var(--border-color, #E2E8F0)',
              borderBottom: '1px solid var(--border-color, #E2E8F0)',
              borderRadius: '10px',
              background: 'var(--surface, #FFFFFF)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Admissions Enquiries
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginTop: '3px', lineHeight: '1.2' }}>
              {activeEnquiries} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Inquiries</span>
            </div>
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', marginTop: '3px' }}>
              <i className="fa-solid fa-user-plus me-1"></i> {stats?.convertedEnquiries ?? 0} converted to leads
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '12px 16px',
              borderLeft: '4px solid #06B6D4',
              borderTop: '1px solid var(--border-color, #E2E8F0)',
              borderRight: '1px solid var(--border-color, #E2E8F0)',
              borderBottom: '1px solid var(--border-color, #E2E8F0)',
              borderRadius: '10px',
              background: 'var(--surface, #FFFFFF)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Phone Communications
            </div>
            <div id="stat_today_calls" style={{ fontSize: '18px', fontWeight: '800', color: '#06B6D4', marginTop: '3px', lineHeight: '1.2' }}>
              {todayCalls} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Calls</span>
            </div>
            <div style={{ fontSize: '11px', color: '#06B6D4', fontWeight: '700', marginTop: '3px' }}>
              {stats?.incomingCalls ?? 0} In / {stats?.outgoingCalls ?? 0} Out
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '12px 16px',
              borderLeft: '4px solid #F59E0B',
              borderTop: '1px solid var(--border-color, #E2E8F0)',
              borderRight: '1px solid var(--border-color, #E2E8F0)',
              borderBottom: '1px solid var(--border-color, #E2E8F0)',
              borderRadius: '10px',
              background: 'var(--surface, #FFFFFF)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Postal &amp; Courier Logs
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#F59E0B', marginTop: '3px', lineHeight: '1.2' }}>
              {todayPostal} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Items</span>
            </div>
            <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: '700', marginTop: '3px' }}>
              {stats?.inwardPostal ?? 0} Inward / {stats?.outwardPostal ?? 0} Outward
            </div>
          </div>
        </div>

        {/* Dual Panels: Recent Visitors & Phone Communications */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '20px' }}>
          
          {/* Recent Visitors */}
          <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', background: 'var(--card-bg, #ffffff)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-person-walking" style={{ color: '#0ea5e9' }}></i> Recent Gatepasses
              </h3>
              <Link to="/unilms/org/front_office/visitors" style={{ fontSize: '12px', color: '#0ea5e9', textDecoration: 'none', fontWeight: '600' }}>
                View All
              </Link>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)', textAlign: 'left', background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>Visitor</th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>Purpose</th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>Person to Meet</th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={4} rows={visitorsSize || 5} />
                  ) : paginatedVisitors.length > 0 ? (
                    paginatedVisitors.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{v.visitorName || v.visitor_name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>{v.phone} ({v.passNumber || v.pass_number})</div>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>{v.purpose}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>{v.personToMeet || v.person_to_meet}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {v.status === 'inside' ? (
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Inside</span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.12)', color: '#64748b', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Out</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No visitors logged today.</td></tr>
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={visitorsPage}
                totalItems={totalVisitors}
                pageSize={visitorsSize}
                onPageChange={setVisitorsPage}
                onPageSizeChange={setVisitorsSize}
                itemName="visitors"
              />
            </div>
          </div>

          {/* Recent Phone Communications */}
          <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', background: 'var(--card-bg, #ffffff)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-phone" style={{ color: '#0ea5e9' }}></i> Recent Phone Calls
              </h3>
              <Link to="/unilms/org/front_office/call_logs" style={{ fontSize: '12px', color: '#0ea5e9', textDecoration: 'none', fontWeight: '600' }}>
                View All
              </Link>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)', textAlign: 'left', background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>Caller</th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>Type</th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>Purpose</th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={4} rows={callsSize || 5} />
                  ) : paginatedCalls.length > 0 ? (
                    paginatedCalls.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{c.callerName || c.caller_name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>{c.phone || c.phone_number}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span className="badge" style={{ background: (c.callType || c.call_type) === 'INCOMING' || (c.callType || c.call_type) === 'Incoming' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: (c.callType || c.call_type) === 'INCOMING' || (c.callType || c.call_type) === 'Incoming' ? '#0284c7' : '#d97706', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                            {c.callType || c.call_type}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>{c.purpose}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                          {c.duration || '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No call logs recorded today.</td></tr>
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={callsPage}
                totalItems={totalCalls}
                pageSize={callsSize}
                onPageChange={setCallsPage}
                onPageSizeChange={setCallsSize}
                itemName="call records"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default OrgFrontOfficeIndex;
