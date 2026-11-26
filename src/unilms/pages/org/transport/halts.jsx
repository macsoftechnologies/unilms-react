import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import transportService from '../../../services/transport.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgTransportHalts = () => {
  const [halts, setHalts] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHalt, setEditingHalt] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    route_id: '',
    name: '',
    distance_km: '15.0',
    annual_fee: '15000',
    morning_pickup: '07:20 AM',
    evening_drop: '05:20 PM',
    sequence: '1'
  });

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const [stopsData, routesData] = await Promise.all([
        transportService.getStops(),
        transportService.getRoutes()
      ]);

      const mappedHalts = (stopsData || []).map(h => ({
        id: h.id,
        route_id: h.routeId,
        route_name: h.route ? `${h.route.routeNumber} - ${h.route.routeName}` : 'General Route',
        name: h.stopName,
        distance_km: Number(h.distanceKm || 5.0),
        annual_fee: Number(h.stopFee || 15000),
        morning_pickup: h.pickupTime || '07:20 AM',
        evening_drop: h.dropTime || '04:30 PM',
        subscribers_count: h.subscriptions?.length || 0,
        sequence: h.sequence || 1,
      }));

      setHalts(mappedHalts);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Failed to load transport halts from PostgreSQL:', e);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 30s background sync
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadData]);

  // KPI Calculations
  const totalHalts = halts.length;
  const avgDistance = halts.length > 0 
    ? (halts.reduce((sum, h) => sum + Number(h.distance_km || 0), 0) / halts.length).toFixed(1)
    : 0;
  const avgFee = halts.length > 0 
    ? (halts.reduce((sum, h) => sum + Number(h.annual_fee || 0), 0) / halts.length).toFixed(0)
    : 0;
  const highestFee = halts.reduce((max, h) => (Number(h.annual_fee || 0) > max ? Number(h.annual_fee) : max), 0);

  // Filtered List
  const filteredHalts = useMemo(() => {
    return halts.filter(h => {
      const matchesSearch = 
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.route_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRoute = routeFilter === 'All' || String(h.route_id) === String(routeFilter);

      return matchesSearch && matchesRoute;
    });
  }, [halts, searchQuery, routeFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedHalts,
    totalItems
  } = useTablePagination(filteredHalts, 10);

  const handleOpenAddModal = () => {
    setEditingHalt(null);
    const defRoute = routes[0];
    setFormData({
      route_id: defRoute ? defRoute.id : '',
      name: '',
      distance_km: '14.0',
      annual_fee: '15000',
      morning_pickup: '07:25 AM',
      evening_drop: '04:35 PM',
      sequence: String(halts.length + 1)
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (h) => {
    setEditingHalt(h);
    setFormData({
      route_id: h.route_id || '',
      name: h.name,
      distance_km: String(h.distance_km),
      annual_fee: String(h.annual_fee),
      morning_pickup: h.morning_pickup || '07:20 AM',
      evening_drop: h.evening_drop || '05:20 PM',
      sequence: String(h.sequence || 1)
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHalt(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.route_id) return;

    try {
      const payload = {
        routeId: formData.route_id,
        stopName: formData.name,
        distanceKm: Number(formData.distance_km),
        stopFee: Number(formData.annual_fee),
        pickupTime: formData.morning_pickup,
        dropTime: formData.evening_drop,
        sequence: Number(formData.sequence || 1)
      };

      if (editingHalt) {
        await transportService.updateStop(editingHalt.id, payload);
      } else {
        await transportService.createStop(payload);
      }

      handleCloseModal();
      loadData();
    } catch (err) {
      alert('Failed to save halt: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = (halt) => {
    confirmAction({
      title: 'Delete Bus Halt / Stop',
      message: `Are you sure you want to permanently delete stop "${halt.name}"? Subscribed students on this stop will need reassignment.`,
      confirmLabel: 'Yes, Delete Stop',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await transportService.deleteStop(halt.id);
          loadData();
        } catch (err) {
          alert('Failed to delete halt: ' + (err.response?.data?.message || err.message));
        }
      }
    });
  };

  return (
    <div className="transport-halts">
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
              background: 'linear-gradient(135deg, #14B8A6, #0D9488)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)'
            }}
          >
            <i className="fa-solid fa-map-pin"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Transport Halts &amp; Fare Stages
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Manage bus stops, pickup timings &amp; fee stages along routes
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {isSyncing && (
            <span style={{ fontSize: '12px', color: '#0D9488', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <i className="fa-solid fa-arrows-rotate fa-spin"></i> Syncing...
            </span>
          )}
          <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>
            Live DB &bull; {lastSyncTime}
          </span>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleOpenAddModal}
            style={{
              background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
              color: '#ffffff',
              fontWeight: '700',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add Halt</span>
          </button>
          <Link to="/unilms/org/transport/subscriptions" className="btn btn-outline" style={{
            background: 'var(--card-bg, #fff)',
            color: 'var(--text-primary)',
            fontWeight: '700',
            border: '1px solid var(--border-color)',
            padding: '10px 18px',
            borderRadius: '10px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}>
            <i className="fa-solid fa-id-card" style={{ color: '#0D9488' }}></i>
            <span>Subscriptions</span>
          </Link>
        </div>
      </div>

      {/* KPI Statistical Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#CCFBF1', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-map-pin"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Designated Halts</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{totalHalts} Boarding Stops</div>
            <div style={{ fontSize: '11px', color: '#0D9488', fontWeight: '600' }}>Mapped to Active Routes</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-route"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Average Distance</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{avgDistance} km</div>
            <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: '600' }}>Mean Transit Radius</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-indian-rupee-sign"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Average Annual Fee</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>₹{Number(avgFee).toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Tiered by Distance Zone</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-tags"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Max Stage Fee</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>₹{Number(highestFee).toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#D97706', fontWeight: '600' }}>Outer Perimeter Halts</div>
          </div>
        </div>
      </div>

      {/* Main Halts Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
              Pickup Stops &amp; Fare Structure
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
              Showing {filteredHalts.length} of {halts.length} designated halts
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={routeFilter}
              onChange={e => setRouteFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                background: '#ffffff'
              }}
            >
              <option value="All">All Routes</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.routeNumber || r.id} - {r.routeName || r.name}
                </option>
              ))}
            </select>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search stop or route..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '7px 12px 7px 32px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  width: '240px'
                }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8', fontSize: '12px' }}></i>
            </div>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Stop Name</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Assigned Corridor</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Distance</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Pickup / Drop Timings</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Annual Fee</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Active Riders</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedHalts.length > 0 ? (
                paginatedHalts.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ color: '#0F766E', fontSize: '14px', display: 'block' }}>
                        {h.name}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Seq #{h.sequence}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#1E293B', fontWeight: '600' }}>
                      <i className="fa-solid fa-route me-1" style={{ color: '#0D9488' }}></i> {h.route_name}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>
                      <strong>{h.distance_km} km</strong>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#1E293B' }}>
                        Pickup: {h.morning_pickup}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Drop: {h.evening_drop}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: '#059669' }}>
                      ₹{Number(h.annual_fee).toLocaleString()} / yr
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge" style={{ background: '#F1F5F9', color: '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                        {h.subscribers_count} Boarding
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(h)}
                          className="btn btn-outline"
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: '6px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(h)}
                          className="btn btn-outline"
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: '6px',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            cursor: 'pointer'
                          }}
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    No halts matching filters.
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
            itemName="halts"
          />
        </div>
      </div>

      {/* Add / Edit Halt Modal */}
      {isModalOpen && (
        <div id="addHaltModal" className="modal" style={{
          display: 'flex',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-content card" style={{
            width: '460px',
            maxWidth: '90%',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '10px' }}>
              <h2 id="modalTitle" style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1E293B' }}>
                {editingHalt ? 'Edit Stop / Halt' : 'Add Stop / Halt'}
              </h2>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748B', lineHeight: 1 }} 
                onClick={handleCloseModal}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Assigned Bus Route</label>
                <select 
                  className="form-control"
                  required
                  value={formData.route_id}
                  onChange={e => setFormData({ ...formData, route_id: e.target.value })}
                >
                  <option value="">-- Select Transit Route --</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.routeNumber || r.id} - {r.routeName || r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Stop Name / Boarding Point</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. Kundalahalli Gate Metro Station"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Distance from Campus (km)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="form-control" 
                    required 
                    value={formData.distance_km}
                    onChange={e => setFormData({ ...formData, distance_km: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Annual Transport Fee (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    value={formData.annual_fee}
                    onChange={e => setFormData({ ...formData, annual_fee: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Morning Pickup Time</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="07:25 AM"
                    value={formData.morning_pickup}
                    onChange={e => setFormData({ ...formData, morning_pickup: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Evening Drop Time</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="04:35 PM"
                    value={formData.evening_drop}
                    onChange={e => setFormData({ ...formData, evening_drop: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={handleCloseModal}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: '#0D9488',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
                  }}
                >
                  {editingHalt ? 'Update Halt' : 'Save Halt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal />
    </div>
  );
};

export default OrgTransportHalts;
