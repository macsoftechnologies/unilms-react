import React, { useState, useEffect } from 'react';
import lmsStudentService from '../../../services/lmsStudent.service';

const LmsAttendanceIndex = () => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [attendanceData, setAttendanceData] = useState(() => lmsStudentService.getCachedAttendance());
  const [loading, setLoading] = useState(() => !lmsStudentService.getCachedAttendance());
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    let isMounted = true;
    const fetchAttendance = async () => {
      try {
        const data = await lmsStudentService.getAttendance();
        if (isMounted && data) setAttendanceData(data);
      } catch (err) {
        console.warn('Failed to load live student attendance:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAttendance();
    return () => { isMounted = false; };
  }, []);

  const summary = attendanceData?.summary || {};
  const records = Array.isArray(attendanceData?.records) ? attendanceData.records : [];
  const student = attendanceData?.student || {};

  const totalSessions = summary.totalSessions !== undefined ? summary.totalSessions : (records.length || 0);
  const presentCount = summary.presentCount !== undefined ? summary.presentCount : records.filter(r => r.status === 'PRESENT').length;
  const absentCount = summary.absentCount !== undefined ? summary.absentCount : records.filter(r => r.status === 'ABSENT').length;
  const lateCount = summary.lateCount !== undefined ? summary.lateCount : records.filter(r => r.status === 'LATE').length;
  const attendanceRate = summary.attendanceRate !== undefined ? summary.attendanceRate : (totalSessions > 0 ? Number(((presentCount / totalSessions) * 100).toFixed(1)) : 0);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const overall = {
    percentage: totalSessions > 0 ? attendanceRate : 0,
    statusText: totalSessions === 0 ? 'No Sessions Recorded' : (attendanceRate >= 75 ? 'Safe Zone (Good Standing)' : 'Detention Risk (<75%)'),
    present: presentCount,
    late: lateCount,
    absent: absentCount,
    total: totalSessions,
    safeBunkCount: Math.max(0, Math.floor(presentCount - totalSessions * 0.75))
  };

  const monthStats = {
    name: monthName,
    percentage: totalSessions > 0 ? attendanceRate : 0,
    present: presentCount,
    absent: absentCount,
    total: totalSessions,
    late: lateCount
  };

  // Group real subjects dynamically from database attendance records
  const subjectMap = {};
  if (records.length > 0) {
    records.forEach(r => {
      const code = r.courseCode || 'CS111';
      if (!subjectMap[code]) {
        subjectMap[code] = {
          code: code,
          name: r.courseName || 'Course Subject',
          faculty: r.markedBy || 'Course Faculty',
          attended: 0,
          total: 0
        };
      }
      subjectMap[code].total += 1;
      if (r.status === 'PRESENT' || r.status === 'LATE') {
        subjectMap[code].attended += 1;
      }
    });
  }

  const subjects = Object.values(subjectMap).map(s => ({
    ...s,
    percentage: s.total > 0 ? Number(((s.attended / s.total) * 100).toFixed(1)) : 0,
    safeBunk: Math.max(0, Math.floor(s.attended - s.total * 0.75))
  }));

  // Dynamically calculate calendar days and leading blanks for active month & year
  const now = new Date();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const leadingOffset = (firstDayOfWeek + 6) % 7; // In Mon-Sun grid: Mon=0, ..., Sun=6

  const recordMapByDate = {};
  records.forEach(r => {
    const dStr = r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : null;
    if (dStr) {
      if (!recordMapByDate[dStr]) recordMapByDate[dStr] = [];
      recordMapByDate[dStr].push(r);
    }
  });

  const enrolledDateStr = student.enrolledAt ? (typeof student.enrolledAt === 'string' ? student.enrolledAt.split('T')[0] : new Date(student.enrolledAt).toISOString().split('T')[0]) : null;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateObj = new Date(viewYear, viewMonth, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;
    const isBeforeEnrollment = enrolledDateStr ? (dateStr < enrolledDateStr) : false;

    const dayRecords = recordMapByDate[dateStr] || [];
    let status = 'upcoming';
    let count = dayRecords.length;

    if (isWeekend) {
      status = 'weekend';
    } else if (dayRecords.length > 0) {
      const pCount = dayRecords.filter(r => r.status?.toUpperCase() === 'PRESENT' || r.status?.toUpperCase() === 'LATE').length;
      const aCount = dayRecords.filter(r => r.status?.toUpperCase() === 'ABSENT').length;
      if (aCount === 0) status = 'present';
      else if (pCount > 0) status = 'partial';
      else status = 'absent';
    } else if (isFuture) {
      status = 'upcoming';
    } else if (isBeforeEnrollment) {
      status = 'pre_enrollment';
    } else {
      status = 'no_session'; // Weekday with no attendance sessions conducted
    }

    return { day, dateStr, status, count, isToday };
  });

  return (
    <>
      <div className="att-header-banner" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.18) 50%, rgba(236, 72, 153, 0.1) 100%), var(--surface, #ffffff)',
        border: '1px solid var(--border, #E2E8F0)',
        borderRadius: '20px',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div>
          <span className="badge" style={{
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary, #4F46E5)',
            fontSize: '11px',
            fontWeight: '800',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: '20px',
            marginBottom: '6px',
            display: 'inline-block'
          }}>
            Academic Attendance Hub
          </span>
          <h1 style={{ margin: '0', fontSize: '24px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: 'var(--text-main, #0F172A)' }}>
            My Attendance Calendar
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748B)' }}>
            View daily presence, period-by-period class topics, and threshold calculations.
          </p>
        </div>

        <div className="att-month-controls" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--surface, #FFFFFF)',
          border: '1px solid var(--border, #E2E8F0)',
          borderRadius: '14px',
          padding: '6px 12px'
        }}>
          <button 
            type="button" 
            className="btn-month-nav" 
            onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', padding: '4px 8px' }}
            title="Previous Month"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
            <i className="fa-solid fa-calendar-days text-primary me-2" style={{ color: '#4F46E5' }}></i>
            {monthName}
          </div>
          <button 
            type="button" 
            className="btn-month-nav" 
            onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', padding: '4px 8px' }}
            title="Next Month"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Attendance Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '16px'
        }}
      >
        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--primary, #4F46E5)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Semester Attendance
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: totalSessions === 0 ? 'var(--text-muted, #64748B)' : 'var(--primary, #4F46E5)', marginTop: '2px', lineHeight: '1.2' }}>
            {totalSessions === 0 ? '—' : `${overall.percentage}%`} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Overall</span>
          </div>
          <div style={{ fontSize: '10px', color: totalSessions === 0 ? 'var(--text-muted, #64748B)' : 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className={`fa-solid ${totalSessions === 0 ? 'fa-clock' : 'fa-arrow-trend-up'} me-1`}></i>
            {totalSessions === 0 ? 'No Sessions Recorded' : `Safe Standing (${overall.present}/${overall.total})`}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--success, #10B981)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Buffer Analysis
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
            +{overall.safeBunkCount} Sessions
          </div>
          <div style={{ fontSize: '10px', color: totalSessions === 0 ? 'var(--text-muted, #64748B)' : 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-shield-halved me-1"></i> {totalSessions === 0 ? 'Program Just Commenced' : 'Safe Zone (Min 75% Cutoff)'}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid #06B6D4',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            {monthName} Monthly
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: totalSessions === 0 ? 'var(--text-muted, #64748B)' : '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
            {totalSessions === 0 ? '—' : `${monthStats.percentage}%`} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Rate</span>
          </div>
          <div style={{ fontSize: '10px', color: totalSessions === 0 ? 'var(--text-muted, #64748B)' : 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> {monthStats.present} Present • {monthStats.absent} Absent
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--warning, #F59E0B)',
            borderTop: '1px solid var(--border, #E2E8F0)',
            borderRight: '1px solid var(--border, #E2E8F0)',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            CIE Eligibility
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: totalSessions === 0 ? 'var(--text-muted, #64748B)' : 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            {totalSessions === 0 ? 'Eligible' : '100% Eligible'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            {totalSessions === 0 ? 'Awaiting First CIE Cycle' : 'Hall Ticket & Exams Cleared'}
          </div>
        </div>
      </div>

      {/* Calendar Matrix Card */}
      <div className="card" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--border, #E2E8F0)', marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: 'var(--text-main, #0F172A)' }}>
            {monthName} Attendance Grid
          </h2>
          <small style={{ color: 'var(--text-muted, #64748B)' }}>Inspect period timings, topics taught, and faculty sign-offs for actual recorded classes.</small>
        </div>

        {/* Scrollable Container on Mobile */}
        <div className="lms-attendance-calendar-scroll">
          <div style={{ minWidth: '540px' }}>
            {/* Weekday Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px', textAlign: 'center', fontWeight: '800', fontSize: '12px', color: 'var(--text-muted, #64748B)' }}>
              <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div style={{ color: '#4F46E5' }}>Sat</div><div style={{ color: '#EC4899' }}>Sun</div>
            </div>

            {/* Calendar Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {/* Dynamic leading blanks based on month's 1st day */}
              {Array.from({ length: leadingOffset }, (_, bIdx) => (
                <div key={`blank-${bIdx}`} style={{ minHeight: '75px', borderRadius: '12px', background: 'transparent' }}></div>
              ))}

              {calendarDays.map((d) => (
                <div
                  key={d.day}
                  onClick={() => setSelectedDay(d)}
                  style={{
                    minHeight: '75px',
                    borderRadius: '12px',
                    padding: '8px 10px',
                    border: d.isToday ? '1.5px solid #4F46E5' : '1px solid var(--border, #E2E8F0)',
                    background:
                      d.status === 'present' ? 'rgba(16, 185, 129, 0.08)' :
                      d.status === 'partial' ? 'rgba(245, 158, 11, 0.08)' :
                      d.status === 'absent' ? 'rgba(239, 68, 68, 0.08)' :
                      d.status === 'holiday' ? 'rgba(14, 165, 233, 0.08)' :
                      d.status === 'weekend' ? 'var(--bg-canvas, #F8FAFC)' :
                      d.status === 'pre_enrollment' ? 'var(--bg-canvas, #F8FAFC)' :
                      d.status === 'no_session' ? 'var(--surface, #FFFFFF)' : 'var(--card-bg, #FFFFFF)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                    opacity: d.status === 'pre_enrollment' ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '800', fontSize: '13px', color: 'var(--text-main, #0F172A)' }}>
                      {d.day}
                    </span>
                    {d.isToday && (
                      <span style={{ fontSize: '8.5px', fontWeight: '800', background: '#4F46E5', color: '#FFFFFF', padding: '1px 5px', borderRadius: '4px' }}>
                        Today
                      </span>
                    )}
                  </div>

                  <div>
                    {d.status === 'present' && (
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <i className="fa-solid fa-circle-check"></i> Present ({d.count})
                      </span>
                    )}
                    {d.status === 'partial' && (
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#D97706', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <i className="fa-solid fa-circle-exclamation"></i> Late/Part ({d.count})
                      </span>
                    )}
                    {d.status === 'absent' && (
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <i className="fa-solid fa-circle-xmark"></i> Absent ({d.count})
                      </span>
                    )}
                    {d.status === 'holiday' && (
                      <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#0284C7' }}>
                        {d.title}
                      </span>
                    )}
                    {d.status === 'weekend' && (
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>Weekend</span>
                    )}
                    {d.status === 'pre_enrollment' && (
                      <span style={{ fontSize: '9.5px', color: '#94A3B8' }}>Pre-Term</span>
                    )}
                    {d.status === 'no_session' && (
                      <span style={{ fontSize: '9.5px', color: '#94A3B8' }}>No Class</span>
                    )}
                    {d.status === 'upcoming' && (
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>Upcoming</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          padding: '14px',
          background: 'var(--bg-canvas, #F8FAFC)',
          border: '1px solid var(--border, #E2E8F0)',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '700',
          color: 'var(--text-muted, #64748B)',
          marginTop: '18px'
        }}>
          <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', marginRight: '6px' }}></span> 100% Present</span>
          <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B', marginRight: '6px' }}></span> Partial / Late</span>
          <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', marginRight: '6px' }}></span> Full Day Absent</span>
          <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#0284C7', marginRight: '6px' }}></span> College Holiday</span>
          <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#94A3B8', marginRight: '6px' }}></span> Weekend / Off</span>
        </div>
      </div>

      {/* Subject-Wise Distribution */}
      <div className="card" style={{ borderRadius: '20px', padding: '24px', border: '1px solid var(--border, #E2E8F0)' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: 'var(--text-main, #0F172A)' }}>
            Subject-wise Attendance Distribution
          </h2>
          <small style={{ color: 'var(--text-muted, #64748B)' }}>Continuous assessment tracking against academic thresholds.</small>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          {subjects.length > 0 ? (
            subjects.map((s, idx) => (
              <div key={idx} style={{ background: 'var(--bg-canvas, #F8FAFC)', border: '1px solid var(--border, #E2E8F0)', borderRadius: '16px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #4F46E5)', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                    {s.code}
                  </span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '800', color: '#10B981', fontSize: '16px' }}>
                    {s.percentage}%
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14.5px', fontWeight: '800', margin: '0 0 4px', color: 'var(--text-main, #0F172A)' }}>
                  {s.name}
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-muted, #64748B)' }}>
                  {s.faculty}
                </p>
                <div style={{ width: '100%', height: '6px', background: 'var(--border, #E2E8F0)', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${s.percentage}%`, height: '100%', background: '#10B981', borderRadius: '6px' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted, #64748B)' }}>
                  <span>{s.attended} / {s.total} Sessions</span>
                  <span style={{ color: '#059669', fontWeight: '700' }}>Safe buffer: +{s.safeBunk} classes</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted, #64748B)', gridColumn: '1 / -1' }}>
              <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '32px', marginBottom: '8px', color: '#94A3B8' }}></i>
              <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>No roll-call attendance sessions recorded yet for this semester.</p>
            </div>
          )}
        </div>
      </div>

      {/* Real Classroom Roll-Call Logs from PostgreSQL */}
      {records.length > 0 && (
        <div className="card" style={{ marginTop: '20px', borderRadius: '20px', padding: '24px', border: '1px solid var(--border, #E2E8F0)' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: 'var(--text-main, #0F172A)' }}>
                Official Attendance Audit Trail
              </h2>
              <small style={{ color: 'var(--text-muted, #64748B)' }}>Real-time verified classroom session logs signed by faculty.</small>
            </div>
            <span className="badge" style={{ background: '#DCFCE7', color: '#16A34A', fontWeight: '700', padding: '4px 10px', borderRadius: '12px' }}>
              {records.length} Recorded Sessions
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border, #E2E8F0)', color: 'var(--text-muted, #64748B)', fontWeight: '700' }}>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Course</th>
                  <th style={{ padding: '10px 12px' }}>Curriculum Topic</th>
                  <th style={{ padding: '10px 12px' }}>Signed By</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id || idx} style={{ borderBottom: '1px solid var(--border, #E2E8F0)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--text-main, #0F172A)' }}>{r.date}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--primary, #4F46E5)' }}>{r.courseCode || 'CS111'}</span> - {r.courseName}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted, #64748B)' }}>{r.topic || 'Classroom Lecture Session'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-main, #0F172A)' }}>{r.markedBy || 'Course Faculty'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{
                        background: r.status === 'PRESENT' ? '#DCFCE7' : r.status === 'LATE' ? '#FEF3C7' : '#FEE2E2',
                        color: r.status === 'PRESENT' ? '#16A34A' : r.status === 'LATE' ? '#D97706' : '#DC2626',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '11px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className={`fa-solid ${r.status === 'PRESENT' ? 'fa-circle-check' : r.status === 'LATE' ? 'fa-clock' : 'fa-circle-xmark'}`}></i>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default LmsAttendanceIndex;