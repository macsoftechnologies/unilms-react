import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import transportService from '../../../services/transport.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgTransportLogbook = () => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [headFilter, setHeadFilter] = useState('All');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    expense_head: 'Fuel',
    amount: '4500.00',
    odometer_km: '35000',
    description: ''
  });

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const [logsData, vehiclesData] = await Promise.all([
        transportService.getLogs(),
        transportService.getVehicles()
      ]);

      const mappedLogs = (logsData || []).map(l => ({
        id: l.id,
        expense_date: l.expenseDate ? new Date(l.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        vehicle_id: l.vehicleId,
        vehicle_no: l.vehicle?.vehicleNo || 'Fleet Bus',
        vehicle_type: l.vehicle?.type || 'Bus',
        driver_name: l.vehicle?.driverName || 'Driver',
        expense_head: l.expenseHead || 'Fuel',
        amount: Number(l.amount || 0),
        odometer_km: Number(l.odometerKm || 0),
        description: l.description || ''
      }));

      setLogs(mappedLogs);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Failed to load transport logs from PostgreSQL:', e);
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
  const fuelExpense = logs
    .filter(l => l.expense_head === 'Fuel')
    .reduce((sum, l) => sum + Number(l.amount || 0), 0);

  const maintenanceExpense = logs
    .filter(l => l.expense_head === 'Maintenance / Repair')
    .reduce((sum, l) => sum + Number(l.amount || 0), 0);

  const tollAndPermits = logs
    .filter(l => l.expense_head === 'Toll Tax' || l.expense_head === 'Insurance / Permit')
    .reduce((sum, l) => sum + Number(l.amount || 0), 0);

  const totalExpense = logs.reduce((sum, l) => sum + Number(l.amount || 0), 0);

  // Filtered List
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = 
        l.vehicle_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.expense_head.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesHead = headFilter === 'All' || l.expense_head === headFilter;
      const matchesVeh = vehicleFilter === 'All' || String(l.vehicle_id) === String(vehicleFilter);

      return matchesSearch && matchesHead && matchesVeh;
    });
  }, [logs, searchQuery, headFilter, vehicleFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedLogs,
    totalItems
  } = useTablePagination(filteredLogs, 10);

  const handleOpenAddModal = () => {
    setEditingLog(null);
    const defVeh = vehicles[0];
    setFormData({
      expense_date: new Date().toISOString().split('T')[0],
      vehicle_id: defVeh ? defVeh.id : '',
      expense_head: 'Fuel',
      amount: '5000.00',
      odometer_km: '42500',
      description: 'Diesel top-up 55 Litres'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (l) => {
    setEditingLog(l);
    setFormData({
      expense_date: l.expense_date,
      vehicle_id: l.vehicle_id,
      expense_head: l.expense_head,
      amount: String(l.amount),
      odometer_km: String(l.odometer_km || 0),
      description: l.description || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLog(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.amount) return;

    try {
      const payload = {
        vehicleId: formData.vehicle_id,
        expenseDate: formData.expense_date,
        expenseHead: formData.expense_head,
        amount: Number(formData.amount),
        odometerKm: Number(formData.odometer_km),
        description: formData.description
      };

      if (editingLog) {
        await transportService.updateLog(editingLog.id, payload);
      } else {
        await transportService.createLog(payload);
      }

      handleCloseModal();
      loadData();
    } catch (err) {
      alert('Failed to save logbook entry: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = (log) => {
    confirmAction({
      title: 'Delete Fleet Log Entry',
      message: `Are you sure you want to permanently delete this ${log.expense_head} record (₹${log.amount}) for vehicle ${log.vehicle_no}?`,
      confirmLabel: 'Yes, Delete Entry',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await transportService.deleteLog(log.id);
          loadData();
        } catch (err) {
          alert('Failed to delete log entry: ' + (err.response?.data?.message || err.message));
        }
      }
    });
  };

  return (
    <div className="transport-logbook">
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
            <i className="fa-solid fa-gas-pump"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Transport Fuel &amp; Trip Logbook
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Log fuel expenses, mileage, odometer tracking &amp; servicing
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
            <span>Log Fuel / Trip</span>
          </button>
          <Link to="/unilms/org/transport/vehicles" className="btn btn-outline" style={{
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
            <i className="fa-solid fa-van-shuttle" style={{ color: '#0D9488' }}></i>
            <span>Vehicles</span>
          </Link>
        </div>
      </div>

      {/* KPI Statistical Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#CCFBF1', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-gas-pump"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Fuel Expenditure</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>₹{fuelExpense.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#0D9488', fontWeight: '600' }}>Diesel &amp; Fleet Power</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-wrench"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Maintenance</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>₹{maintenanceExpense.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#D97706', fontWeight: '600' }}>Repairs, Tyres &amp; Spares</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Tolls &amp; Permits</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>₹{tollAndPermits.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: '600' }}>FASTag &amp; RTO Permits</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-file-invoice-dollar"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Total Expenses</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>₹{totalExpense.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Cumulative Fleet Cost</div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
              Fleet Operations &amp; Expense Log
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
              Showing {filteredLogs.length} of {logs.length} logged entries
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search log, vehicle, or description..."
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

            <select
              value={headFilter}
              onChange={e => setHeadFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                background: '#ffffff'
              }}
            >
              <option value="All">All Expense Heads</option>
              <option value="Fuel">Fuel</option>
              <option value="Maintenance / Repair">Maintenance / Repair</option>
              <option value="Toll Tax">Toll Tax</option>
              <option value="Insurance / Permit">Insurance / Permit</option>
            </select>

            <select
              value={vehicleFilter}
              onChange={e => setVehicleFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                background: '#ffffff'
              }}
            >
              <option value="All">All Fleet Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicleNo} ({v.type})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Date</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Vehicle</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Category / Head</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Amount</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Odometer Reading</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Description / Vendor</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedLogs.length > 0 ? (
                paginatedLogs.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                      {l.expense_date}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ color: '#0F766E', fontSize: '13px' }}>
                        {l.vehicle_no}
                      </strong>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {l.vehicle_type} &bull; {l.driver_name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge" style={{
                        background: l.expense_head === 'Fuel' ? '#CCFBF1' : l.expense_head === 'Maintenance / Repair' ? '#FEF3C7' : '#E0E7FF',
                        color: l.expense_head === 'Fuel' ? '#0F766E' : l.expense_head === 'Maintenance / Repair' ? '#D97706' : '#4338CA',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        {l.expense_head}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '700', color: '#059669' }}>
                      ₹{Number(l.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>
                      {l.odometer_km ? `${l.odometer_km.toLocaleString()} km` : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12.5px', color: '#64748B' }}>
                      {l.description || 'Routine log entry'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(l)}
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
                          onClick={() => handleDelete(l)}
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
                    No logbook entries found.
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
            itemName="logbook entries"
          />
        </div>
      </div>

      {/* Add / Edit Log Modal */}
      {isModalOpen && (
        <div id="addLogModal" className="modal" style={{
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
                {editingLog ? 'Edit Logbook Entry' : 'Add Vehicle Log Entry'}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Expense Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required 
                    value={formData.expense_date}
                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Category / Head</label>
                  <select 
                    className="form-control"
                    value={formData.expense_head}
                    onChange={e => setFormData({ ...formData, expense_head: e.target.value })}
                  >
                    <option value="Fuel">Fuel (Diesel / Electric)</option>
                    <option value="Maintenance / Repair">Maintenance / Repair</option>
                    <option value="Toll Tax">Toll Tax (FASTag)</option>
                    <option value="Insurance / Permit">Insurance / Permit</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Fleet Vehicle</label>
                <select 
                  className="form-control"
                  required
                  value={formData.vehicle_id}
                  onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
                >
                  <option value="">-- Select Fleet Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNo} ({v.type} - {v.capacity} Seats, Driver: {v.driverName || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Amount (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    required 
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Odometer (km)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.odometer_km}
                    onChange={e => setFormData({ ...formData, odometer_km: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Description / Vendor Details</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  placeholder="e.g. Full tank diesel at Shell Hebbal, receipt #8901"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
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
                  {editingLog ? 'Update Entry' : 'Save Entry'}
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

export default OrgTransportLogbook;
