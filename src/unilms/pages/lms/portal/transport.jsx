import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import { transportService } from '../../../services/transport.service';
import { getCurrentAcademicYear } from '../../../utils/date';

const LmsPortalTransport = () => {
  const user = (() => { try { return JSON.parse(localStorage.getItem('unilms_user') || '{}'); } catch { return {}; } })();
  const studentName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Enrolled Student';
  const rollNumber = user.rollNumber || user.roll_number || 'STU-ONLINE';
  const programName = user.program || 'Degree Program';

  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [routeId, setRouteId] = useState('');
  const [halt, setHalt] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [activePass, setActivePass] = useState(null);

  const { confirm, ConfirmDialog } = useConfirmDialog();

  const loadTransportData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [routesRes, subsRes] = await Promise.all([
        transportService.getRoutes(),
        transportService.getSubscriptions(),
      ]);

      let rList = routesRes?.data || routesRes || [];
      const sList = subsRes?.data || subsRes || [];

      setRoutes(Array.isArray(rList) ? rList : []);
      setSubscriptions(Array.isArray(sList) ? sList : []);

      if (Array.isArray(rList) && rList.length > 0 && !routeId) {
        setRouteId(rList[0].id);
      }
    } catch (err) {
      console.warn('Failed to load transport data from PostgreSQL:', err);
      setRoutes([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadTransportData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadTransportData(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(subscriptions, 5);

  const selectedRouteObj = routes.find(r => r.id === routeId) || routes[0] || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!routeId) return;

    const routeName = selectedRouteObj ? `${selectedRouteObj.routeNumber}: ${selectedRouteObj.routeName}` : 'Selected Campus Route';
    const boardingHalt = halt.trim() || 'Designated Campus Halt';

    const confirmed = await confirm({
      title: 'Confirm Bus Pass Subscription',
      message: `Subscribe to "${routeName}"?`,
      details: [
        `Transport Route: ${routeName}`,
        `Designated Boarding Halt: ${boardingHalt}`,
        `Pass Validity: Academic Year ${getCurrentAcademicYear()}`,
        'Verification: Digital Boarding Pass will be generated in database'
      ],
      confirmText: 'Yes, Confirm Pass',
      variant: 'primary',
      icon: 'fa-solid fa-bus'
    });
    if (!confirmed) return;

    try {
      // Find stop or create default stop
      const stops = selectedRouteObj?.stops || [];
      const stopId = stops[0]?.id || selectedRouteObj?.id;

      await transportService.createSubscription({
        routeId,
        stopId,
        academicYear: getCurrentAcademicYear(),
      });

      showToast(`Bus Pass subscription registered for ${routeName}!`);
      setHalt('');
      await loadTransportData();
    } catch (err) {
      alert('Error creating bus pass: ' + err.message);
    }
  };

  return (
    <>
      <ConfirmDialog />

      <div className="lms-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <i className="fa-solid fa-bus me-2" style={{ color: "var(--primary)" }}></i>
              Campus Transit &amp; Shuttle Bus Pass
              
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
              Subscribe to university shuttle bus routes, register designated pickup halts, and track active commute passes.
            </p>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669", padding: "14px 18px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontWeight: "600" }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: "18px" }}></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Active Transit Pass Telemetry Card */}
      {(() => {
        const activePass = subscriptions.find(s => (s.status || '').toLowerCase() === 'active');
        if (!activePass) return null;
        return (
          <div
            className="card"
            style={{
              padding: '16px 20px',
              borderLeft: '4px solid #0284C7',
              borderTop: '1px solid var(--border, #E2E8F0)',
              borderRight: '1px solid var(--border, #E2E8F0)',
              borderBottom: '1px solid var(--border, #E2E8F0)',
              borderRadius: '14px',
              background: 'var(--surface, #FFFFFF)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <i className="fa-solid fa-bus"></i>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>
                  Active Route &amp; Transit Status
                </div>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                  {activePass.route ? `${activePass.route.routeNumber || ''} - ${activePass.route.routeName || 'Campus Shuttle'}` : 'Active Commute Pass'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Pass ID: <strong>{activePass.id}</strong> &bull; Halt: <strong>{activePass.stop?.stopName || 'Designated Halt'}</strong>
                </div>
              </div>
            </div>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', fontWeight: '800' }}>
              <i className="fa-solid fa-circle-check me-1"></i> VERIFIED &amp; ACTIVE PASS
            </span>
          </div>
        );
      })()}

      <div className="lms-portal-grid-split">
        <div className="card" style={{ border: "1px solid var(--border)", borderRadius: "16px", minWidth: 0, width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(100, 116, 139, 0.12)", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
              <i className="fa-solid fa-ticket"></i>
            </div>
            <div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "17px", fontWeight: "800", margin: "0", color: "var(--text-main)" }}>Apply for Transit Pass</h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Includes Morning Pickup &amp; Evening Drop</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Bus Route *</label>
              <select value={routeId} onChange={(e) => setRouteId(e.target.value)} className="form-control" required style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)" }}>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.routeNumber}: {r.routeName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Designated Boarding Halt *</label>
              <input
                type="text"
                value={halt}
                onChange={(e) => setHalt(e.target.value)}
                required
                placeholder="e.g. Marathahalli Bridge Junction, Near Metro Pillar #42"
                className="form-control"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)" }}
              />
            </div>

            <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px 14px", marginBottom: "18px", fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-location-dot" style={{ color: "#4F46E5", fontSize: "16px" }}></i>
              <span>All campus fleet buses are GPS-monitored with live route telemetry on the student app.</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", fontWeight: "700", padding: "11px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <i className="fa-solid fa-paper-plane"></i> Register Transit Pass
            </button>
          </form>
        </div>

        <div className="card" style={{ border: "1px solid var(--border)", borderRadius: "16px", minWidth: 0, width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "17px", fontWeight: "800", margin: "0", color: "var(--text-main)" }}>
              <i className="fa-solid fa-id-card-clip me-2" style={{ color: "var(--primary)" }}></i> Registered Bus Passes &amp; QR
            </h3>
            <span className="badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", fontSize: "11px", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>
              {totalItems} Subscriptions
            </span>
          </div>

          <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-canvas)" }}>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Route &amp; Pass ID</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Designated Halt</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>Status</th>
                  <th style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--text-muted)", textAlign: "right" }}>Pass</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={4} rows={pageSize || 4} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                      No transport subscriptions found in database.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((sub) => (
                    <tr key={sub.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: "700", fontSize: "12.5px", color: "var(--text-main)" }}>
                          {sub.route?.routeNumber ? `${sub.route.routeNumber}: ${sub.route.routeName}` : (sub.route || 'Express Route')}
                        </div>
                        <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#4F46E5", fontWeight: "700" }}>
                          {sub.passNumber || sub.passId || 'PASS-TC-2026-053'}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "12px", color: "var(--text-muted)", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={sub.stop?.stopName || sub.halt}>
                        {sub.stop?.stopName || sub.halt || 'Campus Main Stop'}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="badge" style={{
                          background: sub.status === "Approved" || sub.status === "Active" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                          color: sub.status === "Approved" || sub.status === "Active" ? "var(--success)" : "var(--warning)",
                          fontSize: "11px",
                          padding: "3px 8px",
                          borderRadius: "8px",
                          fontWeight: "700"
                        }}>
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setActivePass(sub)}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "700" }}
                        >
                          <i className="fa-solid fa-qrcode"></i> View Digital Boarding Pass
                        </button>
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
            itemName="subscriptions"
          />
        </div>
      </div>

      {/* Digital Transit Boarding Pass Modal */}
      {activePass && (
        <div
          id="passModalBackdrop"
          onClick={(e) => {
            if (e.target.id === 'passModalBackdrop') setActivePass(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: 'min(440px, 100%)',
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #0284C7, #0369A1)', color: '#fff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-bus" style={{ fontSize: '20px' }}></i>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800' }}>CAMPUS TRANSIT PASS</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>AY {activePass?.academicYear || getCurrentAcademicYear()} &bull; Student Pass</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePass(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>{studentName}</div>
                <div style={{ fontSize: '12px', color: '#0284C7', fontWeight: '700' }}>Roll No: {rollNumber} &bull; {programName}</div>
                <div style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: '800', marginTop: '6px', color: '#1E293B' }}>
                  {activePass.passNumber || activePass.passId || 'PASS-TC-2026-053'}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px', marginBottom: '18px' }}>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: '#64748B' }}>Route:</span>{' '}
                  <strong>{activePass.route?.routeName || 'Tech Corridor Express'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Designated Halt:</span>{' '}
                  <strong>{activePass.stop?.stopName || activePass.halt || 'Marathahalli Bridge'}</strong>
                </div>
              </div>

              {/* QR Verification Visual */}
              <div style={{ textAlign: 'center', padding: '16px', background: '#F1F5F9', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                <i className="fa-solid fa-qrcode" style={{ fontSize: '72px', color: '#0F172A' }}></i>
                <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '8px' }}>
                  Scan at bus turnstile or show to fleet conductor
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <i className="fa-solid fa-print"></i> Print Pass
                </button>
                <button
                  type="button"
                  onClick={() => setActivePass(null)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '13px' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LmsPortalTransport;
