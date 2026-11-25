import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import academicsService from '../../../services/academics.service';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const OrgAcademicsTimetableBuilder = () => {
  const [periods, setPeriods] = useState([]);
  const [slots, setSlots] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drawer / Assign Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null); // { day, periodId }
  const [selectedAllocId, setSelectedAllocId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [periodsRes, slotsRes, allocRes] = await Promise.all([
          academicsService.getTimetablePeriods().catch(() => []),
          academicsService.getTimetableSlots().catch(() => []),
          academicsService.getFacultyAllocations().catch(() => [])
        ]);

        const pList = Array.isArray(periodsRes) ? periodsRes : (periodsRes?.data || []);
        const sList = Array.isArray(slotsRes) ? slotsRes : (slotsRes?.data || []);
        const aList = Array.isArray(allocRes) ? allocRes : (allocRes?.data || []);

        setPeriods(pList);
        setSlots(sList);
        setAllocations(aList);
      } catch (err) {
        console.warn('Could not load timetable data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCellClick = (day, periodId) => {
    setActiveCell({ day, periodId });
    const existing = slots.find(s => s.dayOfWeek === day && s.periodId === periodId);
    if (existing) {
      setSelectedAllocId(existing.allocationId || '');
      setRoomNumber(existing.roomNumber || existing.roomName || '');
    } else {
      setSelectedAllocId('');
      setRoomNumber('Hall 101');
    }
    setIsModalOpen(true);
  };

  const handleSaveAssignment = (e) => {
    e.preventDefault();
    if (!activeCell) return;

    if (!selectedAllocId) {
      // Clear slot
      setSlots(prev => prev.filter(s => !(s.dayOfWeek === activeCell.day && s.periodId === activeCell.periodId)));
    } else {
      const alloc = allocations.find(a => String(a.id) === String(selectedAllocId));
      const newSlot = {
        id: `slot-${Date.now()}`,
        dayOfWeek: activeCell.day,
        periodId: activeCell.periodId,
        allocationId: selectedAllocId,
        subjectCode: alloc?.subject?.code || alloc?.subjectCode || 'SUB',
        facultyName: alloc?.faculty?.name || alloc?.facultyName || 'Faculty',
        roomNumber: roomNumber.trim() || 'Hall 101'
      };
      setSlots(prev => [
        ...prev.filter(s => !(s.dayOfWeek === activeCell.day && s.periodId === activeCell.periodId)),
        newSlot
      ]);
    }
    setIsModalOpen(false);
  };

  return (
    <>
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
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            <i className="fa-solid fa-calendar-week"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Timetable Builder: Class Scheduling
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Construct weekly timetable slots, room allocations &amp; faculty assignments &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/unilms/org/academics/timetable_schedules" className="btn btn-outline" style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            <i className="fa-solid fa-arrow-left" style={{ color: '#2563EB' }}></i>
            <span>Back to Schedules</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Timetable Grid */}
        <div style={{ flex: '1', minWidth: '600px', overflowX: 'auto', background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <table className="timetable-grid" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '12px', border: '1px solid #E2E8F0', textAlign: 'left', minWidth: '100px' }}>Time</th>
                {days.map(d => (
                  <th key={d} style={{ padding: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(p => {
                const isBreak = p.isBreak || p.periodType === 'BREAK';
                return (
                  <tr key={p.id}>
                    <td style={{ padding: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{p.startTime?.slice(0, 5)} - {p.endTime?.slice(0, 5)}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{p.name || p.periodName}</div>
                    </td>

                    {isBreak ? (
                      <td colSpan={6} style={{ padding: '12px', textAlign: 'center', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#64748B', fontWeight: '600', fontSize: '13px' }}>
                        <i className="fa-solid fa-mug-hot me-1"></i> {p.name || 'Break'}
                      </td>
                    ) : (
                      days.map(d => {
                        const entry = slots.find(s => s.dayOfWeek === d && s.periodId === p.id);
                        return (
                          <td 
                            key={d} 
                            onClick={() => handleCellClick(d, p.id)}
                            style={{ padding: '8px', border: '1px solid #E2E8F0', textAlign: 'center', cursor: 'pointer', verticalAlign: 'top', minHeight: '60px', background: entry ? '#EEF2FF' : '#fff' }}
                          >
                            {entry ? (
                              <div style={{ padding: '6px', borderRadius: '6px', background: '#fff', border: '1px solid #C7D2FE', textAlign: 'left' }}>
                                <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#4F46E5' }}>{entry.subjectCode}</div>
                                <div style={{ fontSize: '11px', color: '#64748B' }}><i className="fa-solid fa-user-tie me-1"></i>{entry.facultyName}</div>
                                {entry.roomNumber && (
                                  <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: '600' }}><i className="fa-solid fa-door-open me-1"></i>{entry.roomNumber}</div>
                                )}
                              </div>
                            ) : (
                              <div style={{ color: '#CBD5E1', fontSize: '11px', paddingTop: '14px' }}>+ Assign</div>
                            )}
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Allocations Sidebar */}
        <div style={{ width: '280px', background: '#fff', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '800', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px', color: '#0F172A' }}>
            Allocated Subjects ({allocations.length})
          </h3>
          {allocations.length > 0 ? (
            allocations.map(a => (
              <div key={a.id} style={{ padding: '10px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: '8px' }}>
                <div style={{ fontWeight: '700', fontSize: '12.5px', color: '#0F172A' }}>{a.subject?.code || a.subjectCode} - {a.subject?.name || a.subjectName}</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}><i className="fa-solid fa-user-tie me-1"></i>{a.faculty?.name || a.facultyName}</div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              No faculty allocations assigned yet.
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Assign Subject ({activeCell?.day})</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveAssignment}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Course Allocation</label>
                <select 
                  value={selectedAllocId} 
                  onChange={(e) => setSelectedAllocId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                >
                  <option value="">-- Clear Slot (Remove Entry) --</option>
                  {allocations.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.subject?.code || a.subjectCode} ({a.faculty?.name || a.facultyName})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Lecture Room / Lab</label>
                <input 
                  type="text" 
                  value={roomNumber} 
                  onChange={(e) => setRoomNumber(e.target.value)} 
                  placeholder="e.g. Lab 204, Lecture Hall 101" 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: '700', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', background: 'var(--primary, #6366F1)', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgAcademicsTimetableBuilder;
