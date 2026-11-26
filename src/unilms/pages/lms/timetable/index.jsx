import React, { useState, useEffect, useMemo } from 'react';
import { TableSkeletonLoader } from '../../../components';
import lmsStudentService from '../../../services/lmsStudent.service';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getTypeBadge = (type, marks) => {
  switch (type?.toLowerCase()) {
    case 'test':
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#DC2626',
            fontSize: '9.5px',
            fontWeight: '800',
            padding: '2px 7px',
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <i className="fa-solid fa-file-signature"></i> {marks ? `${marks} Test` : 'Test'}
        </span>
      );
    case 'lab':
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(13, 148, 136, 0.12)',
            color: '#0D9488',
            fontSize: '9.5px',
            fontWeight: '800',
            padding: '2px 7px',
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <i className="fa-solid fa-flask"></i> Laboratory
        </span>
      );
    default:
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(79, 70, 229, 0.1)',
            color: 'var(--primary, #4F46E5)',
            fontSize: '9.5px',
            fontWeight: '800',
            padding: '2px 7px',
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <i className="fa-solid fa-book-open"></i> Lecture
        </span>
      );
  }
};

const LmsTimetableIndex = () => {
  const cached = lmsStudentService.getCachedTimetable();
  const [loading, setLoading] = useState(() => !cached || !cached.periods?.length);
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalSlot, setActiveModalSlot] = useState(null);
  const [periods, setPeriods] = useState(() => {
    if (cached && Array.isArray(cached.periods)) {
      return [...cached.periods].sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0));
    }
    return [];
  });
  const [rawSlots, setRawSlots] = useState(() => (cached && Array.isArray(cached.slots)) ? cached.slots : []);
  const [ward, setWard] = useState(() => cached?.ward || null);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const data = await lmsStudentService.getTimetable();
        if (data) {
          if (Array.isArray(data.periods)) {
            // Sort periods by periodNumber
            const sortedPeriods = [...data.periods].sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0));
            setPeriods(sortedPeriods);
          }
          if (Array.isArray(data.slots)) {
            setRawSlots(data.slots);
          }
          if (data.ward) {
            setWard(data.ward);
          }
        }
      } catch (e) {
        console.warn('Failed to load live student timetable:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  // Today's day name in English
  const currentDayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  // Map database slots into day-by-day timetable grid
  const weeklySchedule = useMemo(() => {
    return DAYS.map((day) => {
      const isToday = day.toLowerCase() === currentDayName.toLowerCase();
      const slotsMap = {};

      rawSlots.forEach((slot) => {
        if (slot.dayOfWeek && slot.dayOfWeek.toLowerCase() === day.toLowerCase()) {
          const pNum = slot.periodNumber || slot.period?.periodNumber;
          if (pNum !== undefined) {
            slotsMap[pNum] = {
              id: slot.id,
              type: (slot.roomName?.toLowerCase().includes('lab') || slot.room?.toLowerCase().includes('lab')) ? 'lab' : 'lecture',
              subject: slot.subjectName || slot.subject?.name || 'Class Session',
              code: slot.subjectCode || slot.subject?.code || 'CS',
              faculty: slot.facultyName || slot.faculty?.name || 'Faculty Member',
              room: slot.roomName || slot.room || 'Lecture Hall',
              time: slot.periodTime || ''
            };
          }
        }
      });

      return {
        day,
        isToday,
        slots: slotsMap
      };
    });
  }, [rawSlots, currentDayName]);

  const filteredSchedule = useMemo(() => {
    if (selectedDayFilter === 'all') return weeklySchedule;
    return weeklySchedule.filter((r) => r.day.toLowerCase() === selectedDayFilter.toLowerCase());
  }, [weeklySchedule, selectedDayFilter]);

  return (
    <>
      <div className="lms-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1>
              <i className="fa-solid fa-calendar-days me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i>{' '}
              Weekly Academic Timetable
            </h1>
            <p>
              Official lecture slots, laboratory hours, and classroom allocations
              {ward ? ` • ${ward.name} (${ward.rollNumber || 'Admitted'}) • Cohort ${ward.cohort || 'A'}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-outline"
            style={{ fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fa-solid fa-print"></i> Print Schedule
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          padding: '12px 16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted, #64748B)' }}>
            Filter by Day:
          </span>
          <button
            type="button"
            onClick={() => setSelectedDayFilter('all')}
            className={`btn btn-sm ${selectedDayFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '11.5px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}
          >
            All Days
          </button>
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDayFilter(d.toLowerCase())}
              className={`btn btn-sm ${selectedDayFilter === d.toLowerCase() ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '11.5px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}
            >
              {d.slice(0, 3)}
              {d.toLowerCase() === currentDayName.toLowerCase() && ' (Today)'}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '220px' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted, #64748B)', fontSize: '12px' }}
          ></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject, faculty, hall..."
            style={{
              paddingLeft: '30px',
              paddingRight: '10px',
              height: '32px',
              borderRadius: '8px',
              fontSize: '12px',
              border: '1px solid var(--border, #E2E8F0)',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Live Timetable Grid */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-canvas, #F8FAFC)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', width: '120px' }}>Day / Period</th>
                {periods.map((p) => (
                  <th
                    key={p.id}
                    style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      background: p.isBreak ? 'rgba(254, 243, 199, 0.4)' : 'transparent',
                      borderLeft: '1px solid var(--border, #E2E8F0)'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: '800', color: p.isBreak ? '#B45309' : 'var(--text-main, #0F172A)' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', marginTop: '2px', fontWeight: '600' }}>
                      {p.startTime} - {p.endTime}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={periods.length + 1 || 8} rows={6} />
              ) : (
                filteredSchedule.map((row) => (
                  <tr key={row.day} style={{ borderBottom: '1px solid var(--border, #E2E8F0)' }}>
                    {/* Day Column */}
                    <td
                      style={{
                        padding: '12px 14px',
                        background: row.isToday ? 'rgba(79, 70, 229, 0.05)' : 'var(--bg-canvas, #F8FAFC)',
                        borderRight: '1px solid var(--border, #E2E8F0)',
                        verticalAlign: 'middle'
                      }}
                    >
                      <strong style={{ fontSize: '13px', color: row.isToday ? 'var(--primary, #4F46E5)' : 'var(--text-main, #0F172A)' }}>
                        {row.day}
                      </strong>
                      {row.isToday && (
                        <span
                          className="badge"
                          style={{
                            background: 'var(--primary, #4F46E5)',
                            color: 'white',
                            fontSize: '8.5px',
                            fontWeight: '800',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            marginTop: '3px',
                            display: 'block',
                            width: 'fit-content'
                          }}
                        >
                          TODAY
                        </span>
                      )}
                    </td>

                    {/* Period Columns */}
                    {periods.map((p) => {
                      if (p.isBreak) {
                        return (
                          <td
                            key={p.id}
                            style={{
                              borderLeft: '1px solid var(--border, #E2E8F0)',
                              textAlign: 'center',
                              padding: '10px 4px',
                              verticalAlign: 'middle',
                              background: 'rgba(254, 243, 199, 0.25)'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <i className={`fa-solid ${p.name.toLowerCase().includes('lunch') ? 'fa-utensils' : 'fa-mug-hot'}`} style={{ color: '#D97706', fontSize: '11px' }}></i>
                              <span style={{ fontSize: '9px', fontWeight: '800', color: '#92400E' }}>
                                {p.name.toLowerCase().includes('lunch') ? 'Lunch Break' : 'Interval'}
                              </span>
                            </div>
                          </td>
                        );
                      }

                      const entry = row.slots[p.periodNumber];
                      const isMatchesSearch = !searchQuery || (
                        entry && (
                          entry.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.faculty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.code.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                      );

                      return (
                        <td
                          key={p.id}
                          onClick={() => entry && setActiveModalSlot({ ...entry, periodName: p.name, time: `${p.startTime} - ${p.endTime}`, day: row.day })}
                          style={{
                            borderLeft: '1px solid var(--border, #E2E8F0)',
                            textAlign: 'center',
                            padding: '8px 6px',
                            verticalAlign: 'middle',
                            cursor: entry ? 'pointer' : 'default',
                            opacity: isMatchesSearch ? 1 : 0.25,
                            background: entry?.type === 'lab' ? 'rgba(240, 253, 250, 0.55)' : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {entry ? (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '4px 3px',
                                borderRadius: '6px'
                              }}
                            >
                              <div>{getTypeBadge(entry.type)}</div>
                              <strong
                                style={{
                                  fontFamily: "'Outfit', sans-serif",
                                  color: entry.type === 'lab' ? '#0F766E' : 'var(--primary, #4F46E5)',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  lineHeight: '1.25'
                                }}
                              >
                                {entry.subject}
                              </strong>
                              <span style={{ color: 'var(--text-muted, #64748B)', fontSize: '9.5px', fontWeight: '600' }}>
                                <i className="fa-solid fa-chalkboard-user me-1" style={{ fontSize: '9px' }}></i>
                                {entry.faculty}
                              </span>
                              <span
                                className="badge"
                                style={{
                                  background: 'var(--bg-canvas, #F8FAFC)',
                                  color: 'var(--text-muted, #64748B)',
                                  border: '1px solid var(--border, #E2E8F0)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontSize: '9px',
                                  fontWeight: '700',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <i className="fa-solid fa-door-open" style={{ color: '#4F46E5', fontSize: '8.5px' }}></i>
                                {entry.room}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted, #64748B)', opacity: 0.35, fontSize: '13px' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Timetable Slot Details */}
      {activeModalSlot && (
        <div
          onClick={() => setActiveModalSlot(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface, #FFFFFF)',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '22px 24px',
              border: '1px solid var(--border, #E2E8F0)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setActiveModalSlot(null)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                border: 'none',
                background: 'var(--bg-canvas, #F8FAFC)',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted, #64748B)',
                fontSize: '11px'
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div style={{ marginBottom: '10px' }}>
              {getTypeBadge(activeModalSlot.type)}
            </div>

            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '16.5px',
                fontWeight: '800',
                color: 'var(--text-main, #0F172A)',
                margin: '0 0 6px'
              }}
            >
              {activeModalSlot.subject}
            </h3>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10.5px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #4F46E5)', fontWeight: '700', padding: '2px 7px', borderRadius: '5px' }}>
                {activeModalSlot.code}
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>
                <i className="fa-solid fa-calendar me-1"></i> {activeModalSlot.day} ({activeModalSlot.periodName})
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>
                <i className="fa-solid fa-clock me-1"></i> {activeModalSlot.time}
              </span>
            </div>

            <div
              style={{
                background: 'var(--bg-canvas, #F8FAFC)',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border, #E2E8F0)',
                marginBottom: '14px',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', display: 'block', fontWeight: '700' }}>
                    FACULTY / INSTRUCTOR
                  </span>
                  <strong style={{ color: 'var(--text-main, #0F172A)' }}>{activeModalSlot.faculty}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', display: 'block', fontWeight: '700' }}>
                    LOCATION / HALL
                  </span>
                  <strong style={{ color: 'var(--text-main, #0F172A)' }}>{activeModalSlot.room}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setActiveModalSlot(null)}
                className="btn btn-outline"
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '12px',
                  border: '1px solid var(--border, #E2E8F0)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LmsTimetableIndex;
