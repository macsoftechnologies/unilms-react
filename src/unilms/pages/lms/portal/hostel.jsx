import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import { hostelService } from '../../../services/hostel.service';

const LmsPortalHostel = () => {
  const user = (() => { try { return JSON.parse(localStorage.getItem('unilms_user') || '{}'); } catch { return {}; } })();
  const studentName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Enrolled Student';
  const rollNumber = user.rollNumber || user.roll_number || 'STU-ONLINE';

  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState([]);
  const [preferredType, setPreferredType] = useState('Double Sharing AC (Attached Bath)');
  const [moveInDate, setMoveInDate] = useState('2026-12-01');
  const [emergencyContact, setEmergencyContact] = useState('+91 98765 43210');
  const [toastMsg, setToastMsg] = useState(null);

  const { confirm, ConfirmDialog } = useConfirmDialog();

  const loadAllocations = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await hostelService.getAllocations();
      const list = res?.data || res || [];
      setAllocations(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load hostel allocations from PostgreSQL:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadAllocations();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadAllocations(true);
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
  } = useTablePagination(allocations, 5);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const confirmed = await confirm({
      title: 'Confirm Accommodation Application',
      message: `Submit application for room category "${preferredType}"?`,
      details: [
        `Preferred Category: ${preferredType}`,
        `Target Move-In Date: ${moveInDate}`,
        `Emergency Contact: ${emergencyContact}`,
        'Amenities: High-Speed Campus WiFi & Mess Dining Access',
        'Verification: Transmitted to Chief Hostel Warden office'
      ],
      confirmText: 'Yes, Submit Application',
      variant: 'primary',
      icon: 'fa-solid fa-hotel'
    });
    if (!confirmed) return;

    try {
      // Find room or create allocation request in database
      const roomsRes = await hostelService.getRooms();
      const rooms = roomsRes?.data || roomsRes || [];
      const targetRoom = rooms[0] || { id: 'default-room' };

      await hostelService.createAllocation({
        roomId: targetRoom.id,
        bedNumber: `${preferredType} (Waitlist #04)`,
        allocatedFrom: moveInDate,
        emergencyContact,
        status: 'Verification Pending',
      });

      showToast('Accommodation application submitted! The Chief Warden desk is reviewing room availability.');
      await loadAllocations();
    } catch (err) {
      alert('Error submitting room application: ' + err.message);
    }
  };

  return (
    <>
      <ConfirmDialog />

      <div className="lms-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <i className="fa-solid fa-bed me-2" style={{ color: "var(--info)" }}></i>
              Campus Hostel &amp; Residential Accommodation
              
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
              Apply for on-campus student residences, request room category upgrades, and view allotment room keys.
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

      {/* Active Hostel Room Status Card */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          borderLeft: '4px solid #06B6D4',
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
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-hotel"></i>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>
              Current Residential Allotment
            </div>
            <div style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
              Block B - Room 304 (Key #B304)
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Aryabhata Residency &bull; Resident: {studentName} ({rollNumber})
            </div>
          </div>
        </div>
        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', fontWeight: '800' }}>
          <i className="fa-solid fa-circle-check me-1"></i> ACTIVE &amp; ALLOTTED
        </span>
      </div>

      <div className="lms-portal-grid-split">
        <div className="card" style={{ border: "1px solid var(--border)", borderRadius: "16px", minWidth: 0, width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(6, 182, 212, 0.1)", color: "var(--info)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
              <i className="fa-solid fa-hotel"></i>
            </div>
            <div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "17px", fontWeight: "800", margin: "0", color: "var(--text-main)" }}>Apply for Accommodation</h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Includes High-Speed WiFi &amp; Mess Dining</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Preferred Room Type *</label>
              <select value={preferredType} onChange={(e) => setPreferredType(e.target.value)} className="form-control" required style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)" }}>
                <option value="Double Sharing AC (Attached Bath)">Double Sharing AC (Attached Bath)</option>
                <option value="Single AC (Deluxe Private)">Single AC (Deluxe Private)</option>
                <option value="Single Non-AC (Private Room)">Single Non-AC (Private Room)</option>
                <option value="Double Sharing Non-AC">Double Sharing Non-AC</option>
                <option value="Triple Sharing Standard">Triple Sharing Standard</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Expected Move-In Date *</label>
              <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} name="joining_date" className="form-control" required style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)" }} />
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Emergency Contact *</label>
              <input type="text" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="+91 98765 43210 (Parent / Local Guardian)" className="form-control" required style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", background: "var(--surface)" }} />
            </div>

            <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px 14px", marginBottom: "18px", fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-utensils" style={{ color: "#06B6D4", fontSize: "16px" }}></i>
              <span>All hostel wings provide automated mess meal bookings and 24/7 security escorts.</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", fontWeight: "700", padding: "11px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <i className="fa-solid fa-paper-plane"></i> Submit Application
            </button>
          </form>
        </div>

        <div className="card" style={{ border: "1px solid var(--border)", borderRadius: "16px", minWidth: 0, width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "8px" }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "17px", fontWeight: "800", margin: "0", color: "var(--text-main)" }}>
              <i className="fa-solid fa-clock-rotate-left me-2" style={{ color: "var(--primary)" }}></i> Accommodation Dossier &amp; Keys
            </h3>
            <span className="badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", fontSize: "11px", padding: "3px 8px", borderRadius: "10px", fontWeight: "700" }}>
              {totalItems} Allotments
            </span>
          </div>

          <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
            <table className="data-table" style={{ width: "100%", minWidth: "480px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-canvas)" }}>
                  <th style={{ padding: "10px 14px", fontSize: "11.5px", color: "var(--text-muted)" }}>Applied Date</th>
                  <th style={{ padding: "10px 14px", fontSize: "11.5px", color: "var(--text-muted)" }}>Room Category &amp; Block</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "11.5px", color: "var(--text-muted)" }}>Allotment Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={3} rows={pageSize || 4} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                      No active accommodation allotments found in database.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((alloc) => (
                    <tr key={alloc.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-muted)" }}>
                        {alloc.allocatedFrom ? new Date(alloc.allocatedFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (alloc.appliedDate || 'Today')}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: "800", fontSize: "13px", color: "var(--text-main)" }}>
                          {alloc.room?.hostel?.name || 'Block B - Aryabhata Residency'} &bull; Room {alloc.room?.roomNumber || 'B-304'}
                        </div>
                        <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                          {alloc.bedNumber || alloc.room?.roomType || 'Double Sharing AC (Attached Bath)'}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span className="badge" style={{
                          background: alloc.status === "ACTIVE" || alloc.status === "Allotted" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                          color: alloc.status === "ACTIVE" || alloc.status === "Allotted" ? "var(--success)" : "var(--warning)",
                          fontSize: "11px",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontWeight: "700"
                        }}>
                          <i className={`fa-solid ${alloc.status === "ACTIVE" || alloc.status === "Allotted" ? "fa-key" : "fa-clock"} me-1`}></i>
                          {alloc.status === "ACTIVE" ? "Allotted" : alloc.status}
                        </span>
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
            itemName="allotments"
          />
        </div>
      </div>
    </>
  );
};

export default LmsPortalHostel;
