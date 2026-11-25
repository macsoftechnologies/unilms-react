import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import transportService from '../../../services/transport.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgTransportVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    vehicle_no: '',
    type: 'Bus',
    capacity: '54',
    model_year: '2024',
    fuel_type: 'Diesel',
    driver_name: '',
    driver_phone: '',
    gps_tracking_id: '',
    status: 'In Service'
  });

  const loadVehicles = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const data = await transportService.getVehicles();
      const mapped = (data || []).map(v => ({
        id: v.id,
        vehicle_no: v.vehicleNo,
        type: v.type,
        capacity: v.capacity,
        model_year: v.modelYear,
        fuel_type: v.fuelType,
        driver_name: v.driverName,
        driver_phone: v.driverPhone,
        gps_tracking_id: v.gpsTrackingId,
        status: v.status,
        routes: v.routes || [],
      }));
      setVehicles(mapped);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Failed to load transport vehicles from PostgreSQL:', e);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // 30s background sync
  useEffect(() => {
    const timer = setInterval(() => {
      loadVehicles(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadVehicles]);

  // Statistical KPI Calculations
  const totalVehicles = vehicles.length;
  const totalCapacity = vehicles.reduce((sum, v) => sum + Number(v.capacity || 0), 0);
  const inServiceCount = vehicles.filter(v => v.status === 'In Service').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'Maintenance').length;

  // Filtered List
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = 
        (v.vehicle_no && v.vehicle_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.driver_name && v.driver_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.driver_phone && v.driver_phone.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = typeFilter === 'All' || v.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [vehicles, searchQuery, typeFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedVehicles,
    totalItems
  } = useTablePagination(filteredVehicles, 10);

  const handleOpenAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      vehicle_no: '',
      type: 'Bus',
      capacity: '54',
      model_year: '2024',
      fuel_type: 'Diesel',
      driver_name: '',
      driver_phone: '',
      gps_tracking_id: `GPS-BUS-${Math.floor(100 + Math.random() * 900)}`,
      status: 'In Service'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (v) => {
    setEditingVehicle(v);
    setFormData({
      vehicle_no: v.vehicle_no,
      type: v.type,
      capacity: String(v.capacity || 50),
      model_year: v.model_year || '2024',
      fuel_type: v.fuel_type || 'Diesel',
      driver_name: v.driver_name || '',
      driver_phone: v.driver_phone || '',
      gps_tracking_id: v.gps_tracking_id || '',
      status: v.status || 'In Service'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_no) return;

    try {
      if (editingVehicle) {
        await transportService.updateVehicle(editingVehicle.id, {
          vehicleNo: formData.vehicle_no,
          type: formData.type,
          capacity: Number(formData.capacity),
          modelYear: formData.model_year,
          fuelType: formData.fuel_type,
          driverName: formData.driver_name,
          driverPhone: formData.driver_phone,
          gpsTrackingId: formData.gps_tracking_id,
          status: formData.status,
        });
      } else {
        await transportService.createVehicle({
          vehicleNo: formData.vehicle_no,
          type: formData.type,
          capacity: Number(formData.capacity),
          modelYear: formData.model_year,
          fuelType: formData.fuel_type,
          driverName: formData.driver_name,
          driverPhone: formData.driver_phone,
          gpsTrackingId: formData.gps_tracking_id,
          status: formData.status,
        });
      }

      handleCloseModal();
      loadVehicles();
    } catch (err) {
      alert('Failed to save vehicle: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = (vehicle) => {
    confirmAction({
      title: 'Decommission Fleet Vehicle',
      message: `Are you sure you want to permanently remove vehicle "${vehicle.vehicle_no}" (${vehicle.type}) from the active campus fleet?`,
      confirmLabel: 'Yes, Decommission',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await transportService.deleteVehicle(vehicle.id);
          loadVehicles();
        } catch (err) {
          alert('Failed to decommission vehicle: ' + (err.response?.data?.message || err.message));
        }
      }
    });
  };

  return (
    <div className="transport-vehicles">
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
              background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
            }}
          >
            <i className="fa-solid fa-van-shuttle"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Transport Fleet Directory
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Manage college fleet vehicles, capacity, drivers &amp; live GPS telemetry &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {isSyncing && (
            <span style={{ fontSize: '12px', color: '#0284C7', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
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
              background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)', 
              color: '#fff', 
              border: 'none', 
              padding: '10px 18px', 
              borderRadius: '10px', 
              fontSize: '13px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)', 
              whiteSpace: 'nowrap' 
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add Vehicle</span>
          </button>
          <Link 
            to="/unilms/org/transport/routes" 
            className="btn btn-outline"
            style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-route" style={{ color: '#0284C7' }}></i>
            <span>Bus Routes</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px 18px', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>TOTAL FLEET VEHICLES</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0284C7' }}>{totalVehicles} Vehicles</div>
        </div>
        <div className="card" style={{ padding: '14px 18px', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>TOTAL SEATING CAPACITY</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669' }}>{totalCapacity} Seats</div>
        </div>
        <div className="card" style={{ padding: '14px 18px', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>IN SERVICE TODAY</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#10B981' }}>{inServiceCount} Active</div>
        </div>
        <div className="card" style={{ padding: '14px 18px', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>MAINTENANCE</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#F59E0B' }}>{maintenanceCount} In Depot</div>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Search by vehicle no, driver or phone..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="form-control"
          style={{ maxWidth: '320px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Bus', 'Van'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: typeFilter === t ? '#0284C7' : '#e2e8f0',
                color: typeFilter === t ? '#fff' : '#475569',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px' }}>Vehicle No</th>
                <th style={{ padding: '12px 14px', fontSize: '12px' }}>Type &amp; Year</th>
                <th style={{ padding: '12px 14px', fontSize: '12px' }}>Capacity</th>
                <th style={{ padding: '12px 14px', fontSize: '12px' }}>Fuel &amp; GPS</th>
                <th style={{ padding: '12px 14px', fontSize: '12px' }}>Driver</th>
                <th style={{ padding: '12px 14px', fontSize: '12px' }}>Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={5} />
              ) : paginatedVehicles.length > 0 ? (
                paginatedVehicles.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '800', color: '#0284C7' }}>
                      {v.vehicle_no}
                      {v.routes.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '500' }}>
                          Assigned: {v.routes[0].routeNumber}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px' }}>{v.type} ({v.model_year || '—'})</td>
                    <td style={{ padding: '12px 14px', fontWeight: '700' }}>{v.capacity} Seats</td>
                    <td style={{ padding: '12px 14px', fontSize: '12.5px' }}>{v.fuel_type} &bull; <small style={{ color: '#059669' }}>{v.gps_tracking_id || 'GPS Active'}</small></td>
                    <td style={{ padding: '12px 14px', fontSize: '13px' }}><strong>{v.driver_name || 'Unassigned'}</strong><br /><small style={{ color: '#64748B' }}>{v.driver_phone}</small></td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge" style={{ 
                        background: v.status === 'In Service' ? '#D1FAE5' : '#FEF3C7', 
                        color: v.status === 'In Service' ? '#065F46' : '#92400E', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px', 
                        fontWeight: '700' 
                      }}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleOpenEditModal(v)}
                        style={{ border: 'none', background: 'transparent', color: '#0284C7', cursor: 'pointer', padding: '4px 8px' }}
                        title="Edit Vehicle"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(v)}
                        style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: '4px 8px' }}
                        title="Decommission Vehicle"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>No vehicles found. Add one above.</td></tr>
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
          itemName="vehicles"
        />
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                {editingVehicle ? 'Edit Fleet Vehicle' : 'Add Vehicle to Fleet'}
              </h3>
              <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Vehicle Number / Registration</label>
                <input 
                  type="text" 
                  placeholder="e.g. KA-01-E-4521" 
                  value={formData.vehicle_no} 
                  onChange={e => setFormData({ ...formData, vehicle_no: e.target.value })} 
                  className="form-control" 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Type</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({ ...formData, type: e.target.value })} 
                    className="form-control"
                  >
                    <option value="Bus">Bus</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Capacity (Seats)</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={formData.capacity} 
                    onChange={e => setFormData({ ...formData, capacity: e.target.value })} 
                    className="form-control" 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Model Year</label>
                  <input 
                    type="text" 
                    value={formData.model_year} 
                    onChange={e => setFormData({ ...formData, model_year: e.target.value })} 
                    className="form-control" 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Fuel Type</label>
                  <select 
                    value={formData.fuel_type} 
                    onChange={e => setFormData({ ...formData, fuel_type: e.target.value })} 
                    className="form-control"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="CNG">CNG</option>
                    <option value="Petrol">Petrol</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Driver Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ramesh Jadhav" 
                    value={formData.driver_name} 
                    onChange={e => setFormData({ ...formData, driver_name: e.target.value })} 
                    className="form-control" 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Driver Phone</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 98450 12001" 
                    value={formData.driver_phone} 
                    onChange={e => setFormData({ ...formData, driver_phone: e.target.value })} 
                    className="form-control" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({ ...formData, status: e.target.value })} 
                    className="form-control"
                  >
                    <option value="In Service">In Service</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Decommissioned">Decommissioned</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>GPS Unit ID</label>
                  <input 
                    type="text" 
                    value={formData.gps_tracking_id} 
                    onChange={e => setFormData({ ...formData, gps_tracking_id: e.target.value })} 
                    className="form-control" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#0284C7', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                >
                  {editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enterprise Confirmation Dialog */}
      <ConfirmModal />
    </div>
  );
};

export default OrgTransportVehicles;
