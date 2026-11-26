import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import hostelService from '../../../services/hostel.service';
import studentsService from '../../../services/students.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgHostelRegistrations = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [allocations, setAllocations] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hostelFilter, setHostelFilter] = useState('all');
  const pollTimerRef = useRef(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [formData, setFormData] = useState({
    student_id: '',
    hostel_id: '',
    room_id: '',
    bed_no: 'Bed 1',
    joining_date: todayStr,
  });

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsPolling(true);

    try {
      const [aList, hList, rList, sList] = await Promise.all([
        hostelService.getAllocations(),
        hostelService.getHostels(),
        hostelService.getRooms(),
        studentsService.getStudents(),
      ]);

      const normalizedAllocations = (Array.isArray(aList) ? aList : []).map(a => ({
        id: a.id,
        student_id: a.studentId,
        student_name: a.student ? `${a.student.firstName} ${a.student.lastName || ''}`.trim() : 'Enrolled Student',
        roll_no: a.student?.rollNumber || 'N/A',
        program_cohort: a.student?.program?.name ? `${a.student.program.name}` : 'B.Tech CSE',
        hostel_id: a.room?.hostelId,
        hostel_name: a.room?.hostel?.name || 'Assigned Block',
        room_id: a.roomId,
        room_no: a.room?.roomNumber || 'N/A',
        room_type: a.room?.roomType || 'Double Sharing',
        bed_no: a.bedNumber || 'Bed 1',
        joining_date: a.allocatedFrom ? new Date(a.allocatedFrom).toLocaleDateString('en-GB') : todayStr,
        status: a.status || 'ACTIVE',
        phone: a.student?.phone || '+91 98765 00000',
      }));

      setAllocations(normalizedAllocations);
      setHostels(Array.isArray(hList) ? hList : []);
      setRooms(Array.isArray(rList) ? rList : []);
      setStudents(Array.isArray(sList) ? sList : []);

      if (sList && sList.length > 0 && !formData.student_id) {
        setFormData(prev => ({
          ...prev,
          student_id: sList[0].id,
          hostel_id: hList[0]?.id || '',
          room_id: rList[0]?.id || '',
        }));
      }

      setLastSynced(new Date());
    } catch (e) {
      console.error('Failed to load hostel allocations:', e);
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, [todayStr]);

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

  // Filter available rooms based on selected hostel
  const availableRooms = useMemo(() => {
    if (!formData.hostel_id) return rooms;
    const filtered = rooms.filter(r => r.hostelId === formData.hostel_id || r.hostel?.id === formData.hostel_id);
    return filtered.length > 0 ? filtered : rooms;
  }, [rooms, formData.hostel_id]);

  // Handle hostel block change in modal
  const handleHostelChange = (hId) => {
    const matchedRooms = rooms.filter(r => r.hostelId === hId || r.hostel?.id === hId);
    setFormData(prev => ({
      ...prev,
      hostel_id: hId,
      room_id: matchedRooms[0]?.id || prev.room_id,
    }));
  };

  // Filtered allocations list
  const filteredAllocations = useMemo(() => {
    return allocations.filter((item) => {
      const matchesSearch =
        item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.room_no.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesHostel = hostelFilter === 'all' || item.hostel_id === hostelFilter;
      return matchesSearch && matchesHostel;
    });
  }, [allocations, searchTerm, hostelFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedAllocations,
    totalItems
  } = useTablePagination(filteredAllocations, 10);

  const handleOpenAllocate = () => {
    const firstHostel = hostels[0];
    const matchedRooms = rooms.filter(r => r.hostelId === firstHostel?.id);
    setFormData({
      student_id: '',
      hostel_id: firstHostel?.id || '',
      room_id: matchedRooms[0]?.id || rooms[0]?.id || '',
      bed_no: 'Bed 1',
      joining_date: todayStr,
    });
    setIsModalOpen(true);
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.room_id) return;

    const matchedStudent = students.find(s => s.id === formData.student_id);
    const matchedRoom = rooms.find(r => r.id === formData.room_id);
    const matchedHostel = hostels.find(h => h.id === formData.hostel_id);

    const studentName = matchedStudent ? `${matchedStudent.firstName} ${matchedStudent.lastName || ''}`.trim() : 'Student';

    const confirmed = await confirm({
      title: 'Confirm Student Bed Allocation',
      message: `Allocate hostel bed to ${studentName} (${matchedStudent?.rollNumber})?`,
      details: [
        `Candidate: ${studentName} (Roll: ${matchedStudent?.rollNumber})`,
        `Hostel Block: ${matchedHostel?.name || matchedRoom?.hostel?.name}`,
        `Room Number: ${matchedRoom?.roomNumber} (${matchedRoom?.roomType})`,
        `Bed Space: ${formData.bed_no}`,
        `Effective From: ${formData.joining_date}`,
      ],
      confirmText: 'Confirm Allotment',
      type: 'primary',
    });

    if (!confirmed) return;

    try {
      await hostelService.createAllocation({
        studentId: formData.student_id,
        roomId: formData.room_id,
        bedNumber: formData.bed_no,
        allocatedFrom: formData.joining_date,
      });

      setIsModalOpen(false);
      await loadData(false);
    } catch (err) {
      alert('Failed to allocate hostel bed: ' + err.message);
    }
  };

  const handleVacateAllocation = async (item) => {
    const confirmed = await confirm({
      title: 'Vacate Student Hostel Bed',
      message: `Vacate bed for ${item.student_name} (${item.roll_no}) in Room ${item.room_no}?`,
      details: [
        `Student: ${item.student_name}`,
        `Roll Number: ${item.roll_no}`,
        `Hostel & Room: ${item.hostel_name} - ${item.room_no}`,
        `Bed: ${item.bed_no}`,
      ],
      confirmText: 'Yes, Vacate Bed',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await hostelService.deleteAllocation(item.id);
      await loadData(false);
    } catch (err) {
      alert('Failed to vacate bed: ' + err.message);
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
              <i className="fa-solid fa-user-check"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Student Hostel Bed Allotments
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Active residential bed registry, room assignments, joining dates, and vacate processing
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
              onClick={handleOpenAllocate}
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
              <span>Allocate Student Bed</span>
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
              to="/unilms/org/hostel/rooms"
              className="btn btn-outline"
              style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-door-open"></i>
              <span>Rooms</span>
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search candidate by name, roll number, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <select
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
            >
              <option value="all">All Hostel Blocks</option>
              {hostels.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Allocations Table Card */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-id-card-clip" style={{ color: '#D97706' }}></i> Enrolled Resident Ledger ({totalItems})
          </h3>

          {loading ? (
            <TableSkeletonLoader rows={6} columns={7} />
          ) : paginatedAllocations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <i className="fa-solid fa-user-xmark" style={{ fontSize: '36px', color: '#CBD5E1', marginBottom: '12px' }}></i>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>No student hostel allocations match the selected criteria.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Roll No</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Resident Name</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Hostel Block</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Room &amp; Bed</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Allotted Date</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAllocations.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '800', color: '#4F46E5' }}>
                          {item.roll_no}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '800', color: '#1E293B' }}>{item.student_name}</div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>{item.phone}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#475569' }}>
                          {item.hostel_name}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: '800', color: '#D97706' }}>Room {item.room_no}</span>
                          <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>{item.bed_no}</span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>
                          {item.joining_date}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: '800',
                            background: item.status === 'ACTIVE' ? '#DCFCE7' : '#F1F5F9',
                            color: item.status === 'ACTIVE' ? '#15803D' : '#64748B'
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleVacateAllocation(item)}
                            style={{
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <i className="fa-solid fa-arrow-right-from-bracket"></i> Vacate Bed
                          </button>
                        </td>
                      </tr>
                    ))}
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

        {/* Allocate Bed Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>
                  <i className="fa-solid fa-user-plus text-warning me-2"></i> Allocate Student to Hostel Bed
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}>&times;</button>
              </div>

              <form onSubmit={handleAllocateSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Select Enrolled Candidate</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName || ''} ({s.rollNumber})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Hostel Block</label>
                    <select
                      value={formData.hostel_id}
                      onChange={(e) => handleHostelChange(e.target.value)}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                    >
                      {hostels.map(h => (
                        <option key={h.id} value={h.id}>{h.name} ({h.type})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Room Number</label>
                    <select
                      value={formData.room_id}
                      onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                    >
                      {availableRooms.map(r => (
                        <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.roomType})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Bed Space</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bed A-1 (Window)"
                      value={formData.bed_no}
                      onChange={(e) => setFormData({ ...formData, bed_no: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Effective From</label>
                    <input
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', color: '#475569' }}>Cancel</button>
                  <button type="submit" style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#D97706', color: '#fff', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}>Confirm Allotment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgHostelRegistrations;
