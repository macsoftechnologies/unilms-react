import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import transportService from '../../../services/transport.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgTransportRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    name: '',
    route_number: '',
    start_point: '',
    end_point: 'Campus Main Terminal',
    total_km: '28.0',
    departure_morning: '07:15 AM',
    departure_evening: '04:45 PM',
    vehicle_id: '',
    status: 'Active'
  });

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const [routesData, vehiclesData] = await Promise.all([
        transportService.getRoutes(),
        transportService.getVehicles()
      ]);

      const mappedRoutes = (routesData || []).map(r => ({
        id: r.id,
        name: r.routeName || r.name,
        route_number: r.routeNumber || r.route_number,
        start_point: r.startPoint || r.start_point,
        end_point: r.endPoint || r.end_point,
        total_km: Number(r.totalKm || r.total_km || 25),
        departure_morning: r.departureMorning || r.departure_morning || '07:15 AM',
        departure_evening: r.departureEvening || r.departure_evening || '04:45 PM',
        vehicle_id: r.vehicleId || r.vehicle?.id || '',
        primary_vehicle: r.vehicle ? `${r.vehicle.vehicleNo} (${r.vehicle.type} - ${r.vehicle.capacity} Seats)` : 'Unassigned',
        driver_contact: r.vehicle?.driverName ? `${r.vehicle.driverName} (${r.vehicle.driverPhone || 'No Phone'})` : '',
        stops_count: r.stops?.length || 0,
        active_passengers: r.subscriptions?.length || 0,
        status: r.status || 'Active'
      }));

      setRoutes(mappedRoutes);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Failed to load transport routes from PostgreSQL:', e);
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
  const totalRoutes = routes.length;
  const totalKm = routes.reduce((sum, r) => sum + Number(r.total_km || 0), 0);
  const totalPassengers = routes.reduce((sum, r) => sum + Number(r.active_passengers || 0), 0);
  const totalStops = routes.reduce((sum, r) => sum + Number(r.stops_count || 0), 0);

  // Filtered List
  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      return (
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.start_point.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.end_point.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.route_number && r.route_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.primary_vehicle && r.primary_vehicle.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [routes, searchQuery]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedRoutes,
    totalItems
  } = useTablePagination(filteredRoutes, 10);

  const handleOpenAddModal = () => {
    setEditingRoute(null);
    const defVeh = vehicles[0];
    setFormData({
      name: '',
      route_number: `R-0${routes.length + 1}`,
      start_point: '',
      end_point: 'Campus Main Terminal',
      total_km: '28.0',
      departure_morning: '07:15 AM',
      departure_evening: '04:45 PM',
      vehicle_id: defVeh ? defVeh.id : '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r) => {
    setEditingRoute(r);
    setFormData({
      name: r.name,
      route_number: r.route_number || '',
      start_point: r.start_point,
      end_point: r.end_point,
      total_km: String(r.total_km || 25),
      departure_morning: r.departure_morning || '07:15 AM',
      departure_evening: r.departure_evening || '04:45 PM',
      vehicle_id: r.vehicle_id || '',
      status: r.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoute(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.start_point) return;

    try {
      const payload = {
        routeName: formData.name,
        routeNumber: formData.route_number || `R-0${routes.length + 1}`,
        startPoint: formData.start_point,
        endPoint: formData.end_point,
        totalKm: Number(formData.total_km),
        departureMorning: formData.departure_morning,
        departureEvening: formData.departure_evening,
        vehicleId: formData.vehicle_id || null,
        status: formData.status
      };

      if (editingRoute) {
        await transportService.updateRoute(editingRoute.id, payload);
      } else {
        await transportService.createRoute(payload);
      }

      handleCloseModal();
      loadData();
    } catch (err) {
      alert('Failed to save route: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = (route) => {
    confirmAction({
      title: 'Delete Transport Route',
      message: `Are you sure you want to permanently remove route "${route.name}" (${route.route_number})? This will unassign linked bus stops.`,
      confirmLabel: 'Yes, Delete Route',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await transportService.deleteRoute(route.id);
          loadData();
        } catch (err) {
          alert('Failed to delete route: ' + (err.response?.data?.message || err.message));
        }
      }
    });
  };

  return (
    <div className="transport-routes">
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
            <i className="fa-solid fa-route"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Transport Routes &amp; Networks
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Define transit paths, vehicle allocations &amp; passenger capacities &bull; AY 2026&ndash;2027
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
            <span>Add Route</span>
          </button>
          <Link to="/unilms/org/transport/halts" className="btn btn-outline" style={{
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
            <i className="fa-solid fa-map-pin" style={{ color: '#0D9488' }}></i>
            <span>Stops &amp; Pricing</span>
          </Link>
        </div>
      </div>

      {/* KPI Statistical Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#CCFBF1', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-route"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Active Routes</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{totalRoutes} Corridors</div>
            <div style={{ fontSize: '11px', color: '#0D9488', fontWeight: '600' }}>Daily Campus Operations</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-road"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Daily Coverage</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{totalKm.toFixed(1)} km</div>
            <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: '600' }}>Cumulative One-Way Transit</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Daily Passengers</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{totalPassengers} Commuters</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Students & Staff Subscribed</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-map-pin"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Total Halts</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{totalStops} Stops</div>
            <div style={{ fontSize: '11px', color: '#D97706', fontWeight: '600' }}>Designated Boarding Points</div>
          </div>
        </div>
      </div>

      {/* Main Routes Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
              Configured Transport Routes
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
              Showing {filteredRoutes.length} of {routes.length} transit routes
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search route, start, destination..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '7px 12px 7px 32px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  width: '260px'
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
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Route Name</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Start Point (Origin)</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Destination</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Timings &amp; Dist.</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Assigned Vehicle</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Halts &amp; Riders</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedRoutes.length > 0 ? (
                paginatedRoutes.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ color: '#0F766E', fontSize: '14px', display: 'block' }}>
                        {r.name}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Code: {r.route_number}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#1E293B', fontWeight: '600' }}>
                      <i className="fa-solid fa-location-dot me-1" style={{ color: '#0D9488' }}></i> {r.start_point}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>
                      <i className="fa-solid fa-flag-checkered me-1" style={{ color: '#94A3B8' }}></i> {r.end_point}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#1E293B' }}>
                        Dep: {r.departure_morning} &bull; Ret: {r.departure_evening}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Distance: <strong>{r.total_km} km</strong>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge" style={{ background: '#CCFBF1', color: '#0F766E', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                        {r.primary_vehicle || 'Assigned Bus'}
                      </span>
                      {r.driver_contact && (
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {r.driver_contact}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Link 
                        to="/unilms/org/transport/halts"
                        style={{
                          background: '#F1F5F9',
                          color: '#334155',
                          textDecoration: 'none',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="fa-solid fa-map-pin" style={{ color: '#0D9488' }}></i> {r.stops_count} Stops ({r.active_passengers} Riders)
                      </Link>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(r)}
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
                          onClick={() => handleDelete(r)}
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
                    No routes found.
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
            itemName="routes"
          />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div id="addRouteModal" className="modal" style={{
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
                {editingRoute ? 'Edit Route' : 'Add Route'}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Route Code</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g. R-01"
                    value={formData.route_number}
                    onChange={e => setFormData({ ...formData, route_number: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Route Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g. North Campus Express"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Start Point</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g. Hebbal Flyover"
                    value={formData.start_point}
                    onChange={e => setFormData({ ...formData, start_point: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Destination</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g. Campus Main Terminal"
                    value={formData.end_point}
                    onChange={e => setFormData({ ...formData, end_point: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Morning Dep</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="07:15 AM"
                    value={formData.departure_morning}
                    onChange={e => setFormData({ ...formData, departure_morning: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Evening Ret</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="04:45 PM"
                    value={formData.departure_evening}
                    onChange={e => setFormData({ ...formData, departure_evening: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Distance (km)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="form-control" 
                    value={formData.total_km}
                    onChange={e => setFormData({ ...formData, total_km: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Assigned Fleet Vehicle</label>
                <select 
                  className="form-control"
                  value={formData.vehicle_id}
                  onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
                >
                  <option value="">-- No vehicle assigned --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNo} ({v.type} - {v.capacity} Seats, Driver: {v.driverName || 'N/A'})
                    </option>
                  ))}
                </select>
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
                  {editingRoute ? 'Update Route' : 'Save Route'}
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

export default OrgTransportRoutes;
