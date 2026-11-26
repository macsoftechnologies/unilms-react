import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import hostelService from '../../../services/hostel.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgHostelIndex = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [outings, setOutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pollTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'BOYS',
    location: 'North Campus Quadrangle',
    warden_name: '',
    warden_contact: '',
    capacity: 100,
  });

  const loadHostelData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsPolling(true);

    try {
      const [hList, rList, aList, oList] = await Promise.all([
        hostelService.getHostels(),
        hostelService.getRooms(),
        hostelService.getAllocations(),
        hostelService.getOutings(),
      ]);

      setHostels(Array.isArray(hList) ? hList : []);
      setRooms(Array.isArray(rList) ? rList : []);
      setAllocations(Array.isArray(aList) ? aList : []);
      setOutings(Array.isArray(oList) ? oList : []);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to load hostel data:', err);
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, []);

  useEffect(() => {
    loadHostelData(false);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      loadHostelData(true);
    }, 30000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadHostelData]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedHostels,
    totalItems
  } = useTablePagination(hostels, 10);

  const totalCapacity = hostels.reduce((sum, h) => sum + Number(h.capacity || 0), 0);
  const totalHostels = hostels.length;
  const totalRooms = rooms.length;
  const activeResidents = allocations.filter((a) => a.status === 'ACTIVE').length;
  const activeOutings = outings.filter((o) => o.status === 'APPROVED' || o.status === 'OUTSIDE').length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const confirmed = await confirm({
      title: 'Confirm Add Hostel Block',
      message: `Establish new residential facility "${formData.name}"?`,
      details: [
        `Block Name: ${formData.name}`,
        `Type: ${formData.type} Hostel`,
        `Warden: ${formData.warden_name || 'To Be Assigned'} (${formData.warden_contact || 'N/A'})`,
        `Initial Capacity: ${formData.capacity} beds`,
      ],
      confirmText: 'Create Block',
      type: 'primary',
    });

    if (!confirmed) return;

    try {
      await hostelService.createHostel({
        name: formData.name,
        type: formData.type,
        location: formData.location,
        warden_name: formData.warden_name,
        warden_contact: formData.warden_contact,
        capacity: Number(formData.capacity),
      });

      setIsModalOpen(false);
      setFormData({
        name: '',
        type: 'BOYS',
        location: 'North Campus Quadrangle',
        warden_name: '',
        warden_contact: '',
        capacity: 100,
      });
      await loadHostelData(false);
    } catch (err) {
      console.error('Failed to create hostel block:', err);
      alert('Error creating block: ' + err.message);
    }
  };

  const handleDeleteHostel = async (hostel) => {
    const confirmed = await confirm({
      title: 'Delete Hostel Block',
      message: `Are you sure you want to decommission "${hostel.name}"? All associated rooms and bed records will be removed.`,
      confirmText: 'Yes, Delete Block',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await hostelService.deleteHostel(hostel.id);
      await loadHostelData(false);
    } catch (err) {
      alert('Failed to delete block: ' + err.message);
    }
  };

  return (
    <>
      <ConfirmDialog />
      <section className="view-section active">
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
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
              }}
            >
              <i className="fa-solid fa-bed"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Hostel &amp; Residential Life Dashboard
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Campus student residential housing, block configurations, warden assignments, and bed telemetry
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => loadHostelData(false)}
              className="btn btn-outline"
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              title="Refresh Data"
            >
              <i className={`fa-solid fa-rotate-right ${isPolling ? 'fa-spin' : ''}`}></i>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.25)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add Hostel Block</span>
            </button>
            <Link
              to="/unilms/org/hostel/rooms"
              className="btn btn-outline"
              style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-door-open" style={{ color: '#D97706' }}></i>
              <span>Rooms ({totalRooms})</span>
            </Link>
            <Link
              to="/unilms/org/hostel/registrations"
              className="btn btn-outline"
              style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-user-check" style={{ color: '#D97706' }}></i>
              <span>Allocations ({activeResidents})</span>
            </Link>
            <Link
              to="/unilms/org/hostel/outings"
              className="btn btn-outline"
              style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-person-walking-arrow-right" style={{ color: '#D97706' }}></i>
              <span>Outings ({outings.length})</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #F59E0B' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Total Hostel Capacity</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#D97706', marginTop: '6px' }}>{totalCapacity} Beds</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>Across {totalHostels} Blocks</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #10B981' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Active Residents</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '6px' }}>{activeResidents} Enrolled</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#059669', marginTop: '3px' }}>
              <i className="fa-solid fa-circle-check me-1"></i> Bed Allocations Confirmed
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #4F46E5' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Hostel Rooms</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#4F46E5', marginTop: '6px' }}>{totalRooms} Rooms</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>Single &amp; Sharing Suites</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #06B6D4' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Active Gatepasses / Outings</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0891B2', marginTop: '6px' }}>{activeOutings} Outside</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>Warden Approved Exits</div>
          </div>
        </div>

        {/* Hostel Blocks Table Card */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-building" style={{ color: '#D97706' }}></i> Campus Residential Blocks ({totalItems})
          </h3>

          {loading ? (
            <TableSkeletonLoader rows={4} columns={6} />
          ) : paginatedHostels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <i className="fa-solid fa-hotel" style={{ fontSize: '36px', color: '#CBD5E1', marginBottom: '12px' }}></i>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>No hostel blocks registered. Click "Add Hostel Block" to establish one.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Block Name</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Campus Location</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Resident Warden</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Capacity</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHostels.map((h) => {
                      const isBoys = (h.type || '').toUpperCase() === 'BOYS';
                      return (
                        <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: '800', color: '#1E293B' }}>
                            {h.name}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: '800',
                              background: isBoys ? '#EEF2FF' : '#FCE7F3',
                              color: isBoys ? '#4F46E5' : '#BE185D'
                            }}>
                              <i className={`fa-solid ${isBoys ? 'fa-mars' : 'fa-venus'} me-1`}></i>
                              {h.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#64748B' }}>
                            {h.location || 'Campus Quadrangle'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: '700', color: '#1E293B' }}>{h.wardenName || 'Assigned Staff'}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748B' }}>{h.wardenContact || '+91 98000 00000'}</div>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>
                            {h.capacity} Beds
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <Link
                              to={`/unilms/org/hostel/rooms?hostelId=${h.id}`}
                              style={{
                                background: '#EEF2FF',
                                color: '#4F46E5',
                                textDecoration: 'none',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '700',
                                marginRight: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <i className="fa-solid fa-door-open"></i> Rooms
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteHostel(h)}
                              style={{
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <TablePagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
                totalItems={totalItems}
              />
            </>
          )}
        </div>

        {/* Add Hostel Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>
                  <i className="fa-solid fa-hotel text-warning me-2"></i> Register Hostel Block
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}>&times;</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Block Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Block C - Ramanujan Hall of Residence"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Hostel Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                    >
                      <option value="BOYS">Boys Hostel</option>
                      <option value="GIRLS">Girls Hostel</option>
                      <option value="CO-ED">Co-Ed Executive</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Capacity (Beds)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Campus Location</label>
                  <input
                    type="text"
                    placeholder="e.g. North Campus Residential Quadrangle"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Warden Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. A. P. Sengupta"
                      value={formData.warden_name}
                      onChange={(e) => setFormData({ ...formData, warden_name: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Warden Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98450 11223"
                      value={formData.warden_contact}
                      onChange={(e) => setFormData({ ...formData, warden_contact: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', color: '#475569' }}>Cancel</button>
                  <button type="submit" style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#D97706', color: '#fff', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}>Save Block</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgHostelIndex;
