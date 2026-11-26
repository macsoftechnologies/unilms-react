import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import hostelService from '../../../services/hostel.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgHostelRooms = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedHostelParam = searchParams.get('hostelId') || 'all';

  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(selectedHostelParam);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pollTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    hostel_id: '',
    room_number: '',
    floor: '1st Floor',
    room_type: 'Double Sharing',
    capacity: 2,
    has_ac: true,
  });

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsPolling(true);

    try {
      const [hList, rList] = await Promise.all([
        hostelService.getHostels(),
        hostelService.getRooms(selectedHostel),
      ]);
      setHostels(Array.isArray(hList) ? hList : []);
      setRooms(Array.isArray(rList) ? rList : []);
      if (hList && hList.length > 0 && !formData.hostel_id) {
        setFormData(prev => ({ ...prev, hostel_id: hList[0].id }));
      }
      setLastSynced(new Date());
    } catch (e) {
      console.error('Failed to load hostel rooms:', e);
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, [selectedHostel]);

  useEffect(() => {
    loadData(false);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadData]);

  const handleHostelFilterChange = (hId) => {
    setSelectedHostel(hId);
    if (hId === 'all') {
      searchParams.delete('hostelId');
    } else {
      searchParams.set('hostelId', hId);
    }
    setSearchParams(searchParams);
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedRooms,
    totalItems
  } = useTablePagination(rooms, 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hostel_id || !formData.room_number) return;

    const matchedHostel = hostels.find(h => h.id === formData.hostel_id);

    const confirmed = await confirm({
      title: 'Confirm Add Hostel Room',
      message: `Create room "${formData.room_number}" in ${matchedHostel?.name || 'selected block'}?`,
      details: [
        `Hostel Block: ${matchedHostel?.name}`,
        `Room Number: ${formData.room_number}`,
        `Floor: ${formData.floor}`,
        `Type: ${formData.room_type} (${formData.has_ac ? 'AC' : 'Non-AC'})`,
        `Capacity: ${formData.capacity} beds`,
      ],
      confirmText: 'Create Room',
      type: 'primary',
    });

    if (!confirmed) return;

    try {
      await hostelService.createRoom({
        hostelId: formData.hostel_id,
        roomNumber: formData.room_number,
        floor: formData.floor,
        roomType: `${formData.room_type} (${formData.has_ac ? 'AC' : 'Non-AC'})`,
        capacity: Number(formData.capacity),
      });

      setIsModalOpen(false);
      setFormData(prev => ({ ...prev, room_number: '' }));
      await loadData(false);
    } catch (err) {
      alert('Failed to create room: ' + err.message);
    }
  };

  const handleDeleteRoom = async (room) => {
    const confirmed = await confirm({
      title: 'Delete Hostel Room',
      message: `Decommission Room ${room.roomNumber}? Any active student bed allocations in this room will be removed.`,
      confirmText: 'Yes, Delete Room',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await hostelService.deleteRoom(room.id);
      await loadData(false);
    } catch (err) {
      alert('Failed to delete room: ' + err.message);
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
              <i className="fa-solid fa-door-open"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Hostel Rooms &amp; Floor Inventory
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Room numbers, sharing tier specifications, bed occupancy, and availability
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => loadData(false)}
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
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
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
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add Room</span>
            </button>
            <Link
              to="/unilms/org/hostel"
              className="btn btn-outline"
              style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-building"></i>
              <span>Blocks</span>
            </Link>
            <Link
              to="/unilms/org/hostel/registrations"
              className="btn btn-outline"
              style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-user-check"></i>
              <span>Allocations</span>
            </Link>
          </div>
        </div>

        {/* Filter Pills for Hostel Blocks */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => handleHostelFilterChange('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              background: selectedHostel === 'all' ? '#D97706' : '#F1F5F9',
              color: selectedHostel === 'all' ? '#fff' : '#475569',
              transition: 'all 0.2s ease',
            }}
          >
            All Blocks ({rooms.length} Rooms)
          </button>
          {hostels.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => handleHostelFilterChange(h.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                background: selectedHostel === h.id ? '#D97706' : '#F1F5F9',
                color: selectedHostel === h.id ? '#fff' : '#475569',
                transition: 'all 0.2s ease',
              }}
            >
              {h.name}
            </button>
          ))}
        </div>

        {/* Rooms Table Card */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-bed" style={{ color: '#D97706' }}></i> Hostel Room Directory ({totalItems})
          </h3>

          {loading ? (
            <TableSkeletonLoader rows={5} columns={6} />
          ) : paginatedRooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <i className="fa-solid fa-door-closed" style={{ fontSize: '36px', color: '#CBD5E1', marginBottom: '12px' }}></i>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>No hostel rooms found. Click "Add Room" to configure rooms in this block.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Room No</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Hostel Block</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Floor &amp; Tier</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Capacity</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Occupancy Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRooms.map((r) => {
                      const isFull = r.occupied >= r.capacity;
                      const isPartial = r.occupied > 0 && r.occupied < r.capacity;

                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: '800', color: '#D97706', fontSize: '15px' }}>
                            {r.roomNumber}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>
                            {r.hostel?.name || 'Assigned Block'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ color: '#1E293B', fontWeight: '600' }}>{r.floor}</div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>{r.roomType}</div>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>
                            {r.capacity} Beds
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: '800',
                              background: isFull ? '#FEE2E2' : isPartial ? '#FEF3C7' : '#DCFCE7',
                              color: isFull ? '#B91C1C' : isPartial ? '#B45309' : '#15803D'
                            }}>
                              <i className={`fa-solid ${isFull ? 'fa-user-slash' : 'fa-bed'} me-1`}></i>
                              {r.occupied} / {r.capacity} {isFull ? 'Full' : isPartial ? 'Partial' : 'Available'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(r)}
                              style={{
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer'
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

        {/* Create Room Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>
                  <i className="fa-solid fa-door-open text-warning me-2"></i> Add Hostel Room
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}>&times;</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Hostel Block</label>
                  <select
                    value={formData.hostel_id}
                    onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                  >
                    {hostels.map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.type})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Room Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B-204"
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Floor</label>
                    <select
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                    >
                      <option value="Ground Floor">Ground Floor</option>
                      <option value="1st Floor">1st Floor</option>
                      <option value="2nd Floor">2nd Floor</option>
                      <option value="3rd Floor">3rd Floor</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Sharing Tier</label>
                    <select
                      value={formData.room_type}
                      onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                    >
                      <option value="Single Suite">Single Suite (1 Bed)</option>
                      <option value="Double Sharing">Double Sharing (2 Beds)</option>
                      <option value="Triple Sharing">Triple Sharing (3 Beds)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Bed Capacity</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600', color: '#1E293B' }}>
                    <input
                      type="checkbox"
                      checked={formData.has_ac}
                      onChange={(e) => setFormData({ ...formData, has_ac: e.target.checked })}
                    />
                    Air Conditioned (AC Room Unit)
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', color: '#475569' }}>Cancel</button>
                  <button type="submit" style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#D97706', color: '#fff', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}>Save Room</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgHostelRooms;
