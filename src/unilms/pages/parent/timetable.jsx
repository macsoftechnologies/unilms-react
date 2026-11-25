import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TableSkeletonLoader } from '../../components';
import { parentService } from '../../services/parent.service';

const ParentTimetable = () => {
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState('');
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [selectedDay, setSelectedDay] = useState('ALL');
  const pollTimerRef = useRef(null);

  // Load Parent's Registered Wards
  useEffect(() => {
    let isMounted = true;
    const loadChildren = async () => {
      try {
        const res = await parentService.getChildren();
        const wardList = Array.isArray(res) ? res : (res?.data || []);
        if (isMounted && wardList.length > 0) {
          setChildren(wardList);
          const firstId = wardList[0].student?.id || wardList[0].studentId;
          setActiveChildId(firstId);
        }
      } catch (err) {
        console.error('Failed to load parent wards:', err);
      }
    };
    loadChildren();
    return () => { isMounted = false; };
  }, []);

  // Fetch Timetable for Active Ward
  const fetchTimetable = useCallback(async (silent = false) => {
    if (!activeChildId) return;
    if (!silent) setLoading(true);
    else setIsPolling(true);

    try {
      const data = await parentService.getTimetable(activeChildId);
      setTimetableData(data);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, [activeChildId]);

  useEffect(() => {
    fetchTimetable(false);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      fetchTimetable(true);
    }, 30000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchTimetable]);

  const ward = timetableData?.ward || {};
  const slots = timetableData?.slots || [];
  const periods = timetableData?.periods || [];

  // Group slots by Day
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const slotsByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = slots.filter((s) => s.dayOfWeek?.toLowerCase() === day.toLowerCase());
    return acc;
  }, {});

  const displayedDays = selectedDay === 'ALL'
    ? daysOfWeek.filter((day) => (slotsByDay[day] || []).length > 0)
    : [selectedDay];

  return (
    <div style={{ padding: '0 0 32px 0' }}>
      {/* Top Header & Ward Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Registered Ward:
          </span>
          {children.length > 0 ? (
            children.map((c) => {
              const st = c.student;
              const sId = st?.id || c.studentId;
              const isActive = sId === activeChildId;
              return (
                <button
                  key={sId}
                  type="button"
                  onClick={() => setActiveChildId(sId)}
                  style={{
                    border: 'none',
                    background: isActive ? '#4F46E5' : '#EEF2FF',
                    color: isActive ? '#fff' : '#4F46E5',
                    padding: '8px 18px',
                    borderRadius: '20px',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <i className="fa-solid fa-graduation-cap"></i>
                  {st ? `${st.firstName} ${st.lastName || ''}`.trim() : c.fatherName}
                  {isActive && <i className="fa-solid fa-circle-check ms-1" style={{ fontSize: '11px' }}></i>}
                </button>
              );
            })
          ) : (
            <span style={{ fontSize: '13px', color: '#64748B' }}>Connecting to institutional registry...</span>
          )}
        </div>

        {/* Manual Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => fetchTimetable(false)}
            title="Refresh Data"
            style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#4F46E5',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className={`fa-solid fa-rotate-right ${isPolling ? 'fa-spin' : ''}`}></i> Refresh
          </button>
        </div>
      </div>

      {/* Ward Info Strip */}
      {ward.name && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 18px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{ward.name}</span>
            <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
              Roll: {ward.rollNumber}
            </span>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Cohort: {ward.cohort} &bull; Section: {ward.section}
            </span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#4F46E5' }}>
            <i className="fa-solid fa-clock me-1"></i> {periods.length} Daily Periods Configured
          </div>
        </div>
      )}

      {/* Day Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setSelectedDay('ALL')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            background: selectedDay === 'ALL' ? '#4F46E5' : '#F1F5F9',
            color: selectedDay === 'ALL' ? '#fff' : '#475569',
            transition: 'all 0.2s ease',
          }}
        >
          All Days ({slots.length} Lectures)
        </button>
        {daysOfWeek.map((day) => {
          const count = (slotsByDay[day] || []).length;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                background: selectedDay === day ? '#4F46E5' : '#F1F5F9',
                color: selectedDay === day ? '#fff' : '#475569',
                transition: 'all 0.2s ease',
              }}
            >
              {day} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {loading ? (
        <TableSkeletonLoader rows={4} columns={3} />
      ) : displayedDays.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '48px 20px', textAlign: 'center', color: '#64748B' }}>
          <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '40px', color: '#CBD5E1', marginBottom: '14px' }}></i>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '800', color: '#1E293B' }}>No Timetable Slots Published</h4>
          <p style={{ margin: 0, fontSize: '13.5px' }}>The academic department has not yet published timetable slots for this section.</p>
        </div>
      ) : (
        /* Days Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
          {displayedDays.map((day) => {
            const daySlots = slotsByDay[day] || [];
            return (
              <div
                key={day}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-calendar-day" style={{ color: '#4F46E5' }}></i> {day}
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#4F46E5', background: '#EEF2FF', padding: '2px 8px', borderRadius: '6px' }}>
                    {daySlots.length} Classes
                  </span>
                </div>

                {daySlots.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                    No lecture sessions scheduled for {day}.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {daySlots.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          background: '#F8FAFC',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          padding: '12px 14px',
                          borderLeft: '4px solid #4F46E5'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase' }}>
                            Period {s.periodNumber} &bull; {s.periodTime}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', background: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                            <i className="fa-solid fa-door-open me-1"></i> {s.roomName}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>
                          {s.subjectName}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '12px', color: '#64748B' }}>
                          <span>
                            <i className="fa-solid fa-chalkboard-user me-1 text-primary"></i> {s.facultyName}
                          </span>
                          <span style={{ fontWeight: '700', color: '#475569' }}>
                            {s.subjectCode}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParentTimetable;
