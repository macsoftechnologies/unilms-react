import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import transportService from '../../../services/transport.service';
import { studentsService } from '../../../services/students.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgTransportSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [halts, setHalts] = useState([]);
  const [students, setStudents] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [routeFilter, setRouteFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [previewPass, setPreviewPass] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    student_id: '',
    full_name: '',
    roll_no: '',
    route_id: '',
    route_name: '',
    halt_id: '',
    halt_name: '',
    start_date: new Date().toISOString().split('T')[0],
    valid_till: '2027-05-31',
    annual_fee: 15000,
    fee_status: 'Paid',
    rfid_card_no: '',
    status: 'Active'
  });

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const [subsData, routesData, stopsData, studentsData] = await Promise.all([
        transportService.getSubscriptions(),
        transportService.getRoutes(),
        transportService.getStops(),
        studentsService.getStudents()
      ]);

      const mappedSubs = (subsData || []).map(s => ({
        id: s.id,
        student_id: s.studentId,
        full_name: s.student ? `${s.student.firstName} ${s.student.lastName || ''}`.trim() : 'Enrolled Student',
        roll_no: s.student?.rollNumber || 'N/A',
        program_name: s.student?.program?.name || 'B.Tech CSE',
        route_id: s.routeId,
        route_name: s.route ? `${s.route.routeNumber} - ${s.route.routeName}` : 'Assigned Route',
        halt_id: s.stopId,
        halt_name: s.stop?.stopName || 'Boarding Halt',
        pickup_time: s.stop?.pickupTime || '07:30 AM',
        drop_time: s.stop?.dropTime || '04:30 PM',
        annual_fee: Number(s.annualFee || s.stop?.stopFee || 15000),
        fee_status: s.feeStatus || 'Paid',
        rfid_card_no: s.rfidCardNo || `RFID-${s.id.slice(0, 6).toUpperCase()}`,
        pass_number: s.passNumber || `BUS-PASS-${s.id.slice(0, 6)}`,
        status: s.status || 'Active',
        valid_till: s.validTill ? new Date(s.validTill).toLocaleDateString() : '31/05/2027',
      }));

      setSubscriptions(mappedSubs);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setHalts(Array.isArray(stopsData) ? stopsData : []);

      const studentList = Array.isArray(studentsData) ? studentsData : (studentsData?.data || []);
      setStudents(studentList.map(st => ({
        id: st.id,
        full_name: `${st.firstName} ${st.lastName || ''}`.trim(),
        roll_no: st.rollNumber,
        program: st.program?.name || 'B.Tech'
      })));

      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Failed to load transport subscriptions from PostgreSQL:', e);
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
  const totalPasses = subscriptions.length;
  const activePasses = subscriptions.filter(s => s.status === 'Active').length;
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.fee_status === 'Paid' ? Number(s.annual_fee || 0) : 0), 0);
  const pendingRevenue = subscriptions.reduce((sum, s) => sum + (s.fee_status === 'Pending' ? Number(s.annual_fee || 0) : 0), 0);

  // Filtered Halts based on currently selected Route in Modal
  const availableHalts = useMemo(() => {
    if (!formData.route_id) return halts;
    return halts.filter(h => String(h.routeId || h.route_id) === String(formData.route_id));
  }, [halts, formData.route_id]);

  // Filtered List
  const filteredSubs = useMemo(() => {
    return subscriptions.filter(s => {
      const matchesSearch = 
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.halt_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.rfid_card_no && s.rfid_card_no.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesRoute = routeFilter === 'All' || String(s.route_id) === String(routeFilter);

      return matchesSearch && matchesStatus && matchesRoute;
    });
  }, [subscriptions, searchQuery, statusFilter, routeFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedSubs,
    totalItems
  } = useTablePagination(filteredSubs, 10);

  const handleOpenAddModal = () => {
    setEditingSub(null);
    const defRoute = routes[0];
    const matchingHalts = halts.filter(h => String(h.routeId || h.route_id) === String(defRoute ? defRoute.id : ''));
    const defHalt = matchingHalts[0] || halts[0];

    setFormData({
      student_id: '',
      full_name: '',
      roll_no: '',
      route_id: defRoute ? defRoute.id : '',
      route_name: defRoute ? (defRoute.routeName || defRoute.name) : '',
      halt_id: defHalt ? defHalt.id : '',
      halt_name: defHalt ? (defHalt.stopName || defHalt.name) : '',
      start_date: new Date().toISOString().split('T')[0],
      valid_till: '2027-05-31',
      annual_fee: defHalt ? Number(defHalt.stopFee || defHalt.annual_fee || 15000) : 15000,
      fee_status: 'Paid',
      rfid_card_no: `RFID-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s) => {
    setEditingSub(s);
    setFormData({
      student_id: s.student_id,
      full_name: s.full_name,
      roll_no: s.roll_no,
      route_id: s.route_id,
      route_name: s.route_name,
      halt_id: s.halt_id,
      halt_name: s.halt_name,
      start_date: new Date().toISOString().split('T')[0],
      valid_till: '2027-05-31',
      annual_fee: s.annual_fee,
      fee_status: s.fee_status || 'Paid',
      rfid_card_no: s.rfid_card_no || '',
      status: s.status
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSub(null);
  };

  const handleStudentSelect = (e) => {
    const sId = e.target.value;
    const sel = students.find(st => String(st.id) === String(sId));
    if (sel) {
      setFormData(prev => ({
        ...prev,
        student_id: sId,
        full_name: sel.full_name,
        roll_no: sel.roll_no
      }));
    }
  };

  const handleRouteChange = (e) => {
    const rId = e.target.value;
    const selRoute = routes.find(r => String(r.id) === String(rId));
    const routeHalts = halts.filter(h => String(h.routeId || h.route_id) === String(rId));
    const firstHalt = routeHalts[0];

    setFormData(prev => ({
      ...prev,
      route_id: rId,
      route_name: selRoute ? (selRoute.routeName || selRoute.name) : '',
      halt_id: firstHalt ? firstHalt.id : '',
      halt_name: firstHalt ? (firstHalt.stopName || firstHalt.name) : '',
      annual_fee: firstHalt ? Number(firstHalt.stopFee || firstHalt.annual_fee || 15000) : prev.annual_fee
    }));
  };

  const handleHaltChange = (e) => {
    const hId = e.target.value;
    const selHalt = halts.find(h => String(h.id) === String(hId));
    if (selHalt) {
      setFormData(prev => ({
        ...prev,
        halt_id: hId,
        halt_name: selHalt.stopName || selHalt.name,
        annual_fee: Number(selHalt.stopFee || selHalt.annual_fee || 15000)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.route_id || !formData.halt_id) return;

    try {
      const payload = {
        studentId: formData.student_id,
        routeId: formData.route_id,
        stopId: formData.halt_id,
        academicYear: '2026-2027',
        rfidCardNo: formData.rfid_card_no,
        feeStatus: formData.fee_status,
        annualFee: Number(formData.annual_fee),
        status: formData.status
      };

      if (editingSub) {
        await transportService.updateSubscription(editingSub.id, payload);
      } else {
        await transportService.createSubscription(payload);
      }

      handleCloseModal();
      loadData();
    } catch (err) {
      alert('Failed to save subscription: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = (sub) => {
    confirmAction({
      title: 'Revoke Student Bus Pass',
      message: `Are you sure you want to cancel and revoke the campus transit pass for "${sub.full_name}" (${sub.roll_no})?`,
      confirmLabel: 'Yes, Revoke Pass',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await transportService.deleteSubscription(sub.id);
          loadData();
        } catch (err) {
          alert('Failed to revoke pass: ' + (err.response?.data?.message || err.message));
        }
      }
    });
  };

  return (
    <div className="transport-subscriptions">
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
            <i className="fa-solid fa-id-card"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Transport Subscriptions &amp; Passes
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Manage student and staff bus passes, halt fees &amp; renewals &bull; AY 2026&ndash;2027
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
            <span>New Subscription</span>
          </button>
          <Link to="/unilms/org/transport/logbook" className="btn btn-outline" style={{
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
            <i className="fa-solid fa-gas-pump" style={{ color: '#0D9488' }}></i>
            <span>Log Book &amp; Fuel</span>
          </Link>
        </div>
      </div>

      {/* KPI Statistical Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#CCFBF1', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-id-card"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Active Passes</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{activePasses} Active</div>
            <div style={{ fontSize: '11px', color: '#0D9488', fontWeight: '600' }}>Out of {totalPasses} Registered</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-indian-rupee-sign"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Fees Collected</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>₹{totalRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Cleared Bus Subscriptions</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-hourglass-half"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Pending Fees</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>₹{pendingRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#D97706', fontWeight: '600' }}>Awaiting Fee Clearance</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-nfc-symbol"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>RFID Smart Cards</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{activePasses} Issued</div>
            <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: '600' }}>Contactless Tapping</div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
              Student Transport Passes Directory
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
              Showing {filteredSubs.length} of {subscriptions.length} student passes
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search student, roll no, halt..."
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
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                background: '#ffffff'
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

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
                <option key={r.id} value={r.id}>{r.routeNumber || r.id} - {r.routeName || r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Student Name &amp; Roll</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Assigned Route</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Boarding Halt</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Annual Fee &amp; Payment</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>RFID Smart Pass</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Pass Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedSubs.length > 0 ? (
                paginatedSubs.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ color: '#1E293B', fontSize: '14px', display: 'block' }}>
                        {s.full_name}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        Roll No: <strong>{s.roll_no}</strong> &bull; {s.program_name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge" style={{ background: '#CCFBF1', color: '#0F766E', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                        {s.route_name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '13px' }}>
                        <i className="fa-solid fa-map-pin me-1" style={{ color: '#0D9488' }}></i> {s.halt_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Pickup: {s.pickup_time}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '13px' }}>
                        ₹{Number(s.annual_fee).toLocaleString()}
                      </div>
                      {s.fee_status === 'Paid' ? (
                        <span style={{ color: '#059669', fontSize: '11px', fontWeight: '700' }}>
                          <i className="fa-solid fa-circle-check me-1"></i> Paid in Full
                        </span>
                      ) : (
                        <span style={{ color: '#D97706', fontSize: '11px', fontWeight: '700' }}>
                          <i className="fa-solid fa-clock me-1"></i> Payment Pending
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        type="button"
                        onClick={() => setPreviewPass(s)}
                        style={{
                          background: '#EEF2FF',
                          border: '1px solid #C7D2FE',
                          borderRadius: '6px',
                          color: '#4338CA',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '4px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fa-solid fa-id-card me-1"></i> {s.rfid_card_no || 'View Pass'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {s.status === 'Active' ? (
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                          ACTIVE
                        </span>
                      ) : (
                        <span style={{ background: '#F1F5F9', color: '#64748B', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewPass(s)}
                          className="btn btn-outline"
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: '6px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#475569',
                            cursor: 'pointer'
                          }}
                          title="Preview ID Badge"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(s)}
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
                          onClick={() => handleDelete(s)}
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
                    No student subscriptions found.
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
            itemName="student passes"
          />
        </div>
      </div>

      {/* Digital Pass Preview Modal */}
      {previewPass && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Card Header styling as Smart Card */}
            <div style={{
              background: 'linear-gradient(135deg, #042f2e 0%, #065f46 50%, #0d9488 100%)',
              color: '#ffffff',
              padding: '20px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-graduation-cap" style={{ fontSize: '18px' }}></i>
                  <span style={{ fontWeight: '800', letterSpacing: '0.5px', fontSize: '15px' }}>UniLMS CAMPUS TRANSIT</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPass(null)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '16px', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  color: '#065f46',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: '800'
                }}>
                  <i className="fa-solid fa-user"></i>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800' }}>{previewPass.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#ccfbf1' }}>Roll: {previewPass.roll_no} &bull; {previewPass.program_name}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Pass Number:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F766E' }}>{previewPass.pass_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Route Corridor:</span>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{previewPass.route_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Boarding Halt:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0D9488' }}>{previewPass.halt_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Timings:</span>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>Pickup {previewPass.pickup_time} &bull; Drop {previewPass.drop_time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>RFID Smart Tag:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'monospace', color: '#4338CA' }}>{previewPass.rfid_card_no}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Validity:</span>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>Until {previewPass.valid_till}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge" style={{
                  background: previewPass.fee_status === 'Paid' ? '#D1FAE5' : '#FEF3C7',
                  color: previewPass.fee_status === 'Paid' ? '#065F46' : '#92400E',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  fontSize: '12px'
                }}>
                  {previewPass.fee_status === 'Paid' ? 'VERIFIED PASS • FULLY PAID' : 'PENDING PAYMENT'}
                </span>
                <button
                  type="button"
                  onClick={() => alert(`Printing Official Bus Pass Card for ${previewPass.full_name} (${previewPass.pass_number})...`)}
                  style={{
                    background: '#0D9488',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-print me-1"></i> Print Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Subscription Modal */}
      {isModalOpen && (
        <div id="addSubModal" className="modal" style={{
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
                {editingSub ? 'Edit Student Bus Pass' : 'Issue New Transport Pass'}
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
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Enrolled Student Candidate</label>
                <select 
                  className="form-control"
                  required
                  disabled={Boolean(editingSub)}
                  value={formData.student_id}
                  onChange={handleStudentSelect}
                >
                  <option value="">-- Select Enrolled Student --</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.roll_no} - {st.full_name} ({st.program})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Transit Route Corridor</label>
                <select 
                  className="form-control"
                  required
                  value={formData.route_id}
                  onChange={handleRouteChange}
                >
                  <option value="">-- Select Route --</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.routeNumber || r.id} - {r.routeName || r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Boarding Halt / Stop</label>
                <select 
                  className="form-control"
                  required
                  value={formData.halt_id}
                  onChange={handleHaltChange}
                >
                  <option value="">-- Select Boarding Halt --</option>
                  {availableHalts.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.stopName || h.name} (₹{Number(h.stopFee || h.annual_fee || 15000).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Annual Fee (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    value={formData.annual_fee}
                    onChange={e => setFormData({ ...formData, annual_fee: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Payment Status</label>
                  <select 
                    className="form-control"
                    value={formData.fee_status}
                    onChange={e => setFormData({ ...formData, fee_status: e.target.value })}
                  >
                    <option value="Paid">Paid in Full</option>
                    <option value="Pending">Pending Payment</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>RFID Card UID</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.rfid_card_no}
                    onChange={e => setFormData({ ...formData, rfid_card_no: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px', display: 'block' }}>Pass Status</label>
                  <select 
                    className="form-control"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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
                  {editingSub ? 'Update Pass' : 'Issue Pass'}
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

export default OrgTransportSubscriptions;
