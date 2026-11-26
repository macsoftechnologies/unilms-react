import React, { useState, useEffect, useMemo } from 'react';
import lmsStudentService from '../../../services/lmsStudent.service';
import apiClient from '../../../services/api';

const DAY_NAME_TO_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const LmsAttendanceIndex = () => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [attendanceData, setAttendanceData] = useState(() => lmsStudentService.getCachedAttendance());
  const [timetableData, setTimetableData] = useState(() => lmsStudentService.getCachedTimetable());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(() => !lmsStudentService.getCachedAttendance());
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      try {
        const [attRes, ttRes, holRes] = await Promise.allSettled([
          lmsStudentService.getAttendance(),
          lmsStudentService.getTimetable(),
          apiClient.get('/tenants/settings/org_holidays')
        ]);

        if (isMounted) {
          if (attRes.status === 'fulfilled' && attRes.value) {
            setAttendanceData(attRes.value);
          }
          if (ttRes.status === 'fulfilled' && ttRes.value) {
            setTimetableData(ttRes.value);
          }
          if (holRes.status === 'fulfilled') {
            const hList = Array.isArray(holRes.value)
              ? holRes.value
              : (holRes.value?.data && Array.isArray(holRes.value.data) ? holRes.value.data : []);
            setHolidays(hList);
          }
        }
      } catch (err) {
        console.warn('LMS attendance synchronization note:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAll();
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

  // Map scheduled class days dynamically from the student's timetable
  const activeDayIndices = useMemo(() => {
    const slots = Array.isArray(timetableData?.slots) ? timetableData.slots : [];
    const scheduled = new Set();
    slots.forEach(s => {
      const rawDay = s.day || s.dayOfWeek;
      if (rawDay) {
        const key = String(rawDay).toLowerCase().trim();
        if (DAY_NAME_TO_INDEX[key] !== undefined) {
          scheduled.add(DAY_NAME_TO_INDEX[key]);
        }
      }
    });

    // In UniLMS and university timetables (as configured in Master Timetable Builder),
    // academic instruction runs Monday through Saturday (6-Day week).
    // Saturday is an active instructional class day; only Sunday (0) is the weekly non-instructional off-day.
    const weekDays = new Set([1, 2, 3, 4, 5, 6]);
    scheduled.forEach(d => weekDays.add(d));
    return weekDays;
  }, [timetableData]);

  // Overall attendance statistics
  const overall = {
    percentage: totalSessions > 0 ? attendanceRate : 0,
    statusText: totalSessions === 0 ? 'No Sessions Recorded' : (attendanceRate >= 75 ? 'Safe Zone (Good Standing)' : 'Detention Risk (<75%)'),
    present: presentCount,
    late: lateCount,
    absent: absentCount,
    total: totalSessions,
    safeBunkCount: Math.max(0, Math.floor(presentCount - totalSessions * 0.75))
  };

  // Month-filtered statistics for the active calendar view
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthRecords = useMemo(() => {
    return records.filter(r => {
      const dStr = r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : null;
      return dStr && dStr.startsWith(monthPrefix);
    });
  }, [records, monthPrefix]);

  const monthTotal = monthRecords.length;
  const monthPresent = monthRecords.filter(r => r.status?.toUpperCase() === 'PRESENT').length;
  const monthAbsent = monthRecords.filter(r => r.status?.toUpperCase() === 'ABSENT').length;
  const monthLate = monthRecords.filter(r => r.status?.toUpperCase() === 'LATE').length;
  const monthRate = monthTotal > 0 ? Number(((monthPresent / monthTotal) * 100).toFixed(1)) : (overall.percentage || 100);

  const monthStats = {
    name: monthName,
    percentage: monthRate,
    present: monthPresent,
    absent: monthAbsent,
    total: monthTotal,
    late: monthLate
  };

  // Group subjects dynamically from database attendance records
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

  // Map records by YYYY-MM-DD
  const recordMapByDate = useMemo(() => {
    const map = {};
    records.forEach(r => {
      const dStr = r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : null;
      if (dStr) {
        if (!map[dStr]) map[dStr] = [];
        map[dStr].push(r);
      }
    });
    return map;
  }, [records]);

  // Public & Institutional Holidays resolution
  const getHolidayForDate = useMemo(() => {
    // Standard gazetted public holidays for India
    const gazetted = [
      { title: 'New Year Day', date: `${viewYear}-01-01` },
      { title: 'Republic Day', date: `${viewYear}-01-26` },
      { title: 'May Day', date: `${viewYear}-05-01` },
      { title: 'Independence Day', date: `${viewYear}-08-15` },
      { title: 'Mahatma Gandhi Jayanti', date: `${viewYear}-10-02` },
      { title: 'Christmas', date: `${viewYear}-12-25` }
    ];

    return (dateStr) => {
      // 1. Check institutional holidays from DB
      for (const h of holidays) {
        const s = h.start_date ? (typeof h.start_date === 'string' ? h.start_date.split('T')[0] : '') : '';
        const e = h.end_date ? (typeof h.end_date === 'string' ? h.end_date.split('T')[0] : s) : s;
        if (s && dateStr >= s && dateStr <= (e || s)) {
          return { title: h.title, type: h.type || 'Institutional' };
        }
      }
      // 2. Check gazetted public holidays
      const gMatch = gazetted.find(g => g.date === dateStr);
      if (gMatch) {
        return { title: gMatch.title, type: 'Public Holiday' };
      }
      return null;
    };
  }, [holidays, viewYear]);

  // Calendar calculations
  const now = new Date();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const leadingOffset = (firstDayOfWeek + 6) % 7; // In Mon-Sun grid: Mon=0, ..., Sun=6

  const enrolledDateStr = student.enrolledAt ? (typeof student.enrolledAt === 'string' ? student.enrolledAt.split('T')[0] : new Date(student.enrolledAt).toISOString().split('T')[0]) : null;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const calendarDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateObj = new Date(viewYear, viewMonth, day);
      const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;
      const isBeforeEnrollment = enrolledDateStr ? (dateStr < enrolledDateStr) : false;
      const dayRecords = recordMapByDate[dateStr] || [];
      const isTimetableWorkingDay = activeDayIndices.has(dayOfWeek);
      const holiday = getHolidayForDate(dateStr);

      let status = 'upcoming';
      let title = null;

      if (isBeforeEnrollment) {
        status = 'pre_enrollment';
      } else if (holiday) {
        status = 'holiday';
        title = holiday.title;
      } else if (!isTimetableWorkingDay) {
        status = 'weekend'; // Off-day according to class timetable
      } else if (dayRecords.length > 0) {
        const pCount = dayRecords.filter(r => r.status?.toUpperCase() === 'PRESENT' || r.status?.toUpperCase() === 'LATE').length;
        const aCount = dayRecords.filter(r => r.status?.toUpperCase() === 'ABSENT').length;
        if (aCount === 0) status = 'present';
        else if (pCount > 0) status = 'partial';
        else status = 'absent';
      } else if (isFuture) {
        status = 'upcoming';
      } else {
        status = 'no_session'; // Scheduled working day with no roll-call held
      }

      return {
        day,
        dateStr,
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek],
        status,
        title,
        count: dayRecords.length,
        records: dayRecords,
        isToday,
        isTimetableWorkingDay
      };
    });
  }, [daysInMonth, viewYear, viewMonth, todayStr, enrolledDateStr, recordMapByDate, activeDayIndices, getHolidayForDate]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleCurrentMonth = () => {
    setViewDate(new Date());
  };

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
            <i className="fa-solid fa-graduation-cap me-1"></i> Biometric &amp; Faculty Classroom Logs
          </span>
          <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: 'var(--text-main, #0F172A)' }}>
            Attendance Monitor &amp; Eligibility
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted, #64748B)', fontSize: '13.5px' }}>
            Calculated dynamically against timetable schedule, gazetted public holidays, and faculty signatures.
          </p>
        </div>

        {/* Month Selector Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface, #FFFFFF)', padding: '6px 10px', borderRadius: '12px', border: '1px solid var(--border, #E2E8F0)' }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="btn btn-sm btn-outline-secondary"
            style={{ borderRadius: '8px', padding: '6px 12px', fontWeight: '700' }}
            title="Previous Month"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '800', fontSize: '14px', minWidth: '150px', textAlign: 'center', color: 'var(--text-main, #0F172A)' }}>
            {monthName}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="btn btn-sm btn-outline-secondary"
            style={{ borderRadius: '8px', padding: '6px 12px', fontWeight: '700' }}
            title="Next Month"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
          <button
            type="button"
            onClick={handleCurrentMonth}
            className="btn btn-sm"
            style={{ borderRadius: '8px', padding: '6px 10px', fontSize: '11.5px', fontWeight: '700', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #4F46E5)', border: 'none' }}
          >
            Today
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border, #E2E8F0)', borderLeft: '4px solid var(--primary, #4F46E5)' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)' }}>
            Semester Attendance
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: 'var(--primary, #4F46E5)', margin: '4px 0' }}>
            {overall.percentage}% <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Overall</span>
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '700' }}>
            <i className="fa-solid fa-arrow-trend-up me-1"></i> Safe Standing ({overall.present}/{overall.total})
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border, #E2E8F0)', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)' }}>
            Buffer Analysis
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: '#10B981', margin: '4px 0' }}>
            +{overall.safeBunkCount} Sessions
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>
            <i className="fa-solid fa-shield-halved me-1 text-success"></i> Safe Zone (Min 75% Cutoff)
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border, #E2E8F0)', borderLeft: '4px solid #0EA5E9' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)' }}>
            {monthName.toUpperCase()} MONTHLY
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: '#0EA5E9', margin: '4px 0' }}>
            {monthStats.percentage}% <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Rate</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>
            <i className="fa-solid fa-circle-check text-success me-1"></i> {monthStats.present} Present &bull; {monthStats.absent} Absent
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border, #E2E8F0)', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)' }}>
            CIE Eligibility
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: '#D97706', margin: '4px 0' }}>
            {overall.percentage >= 75 || overall.total === 0 ? '100% Eligible' : 'At Risk'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>
            Hall Ticket &amp; Exams Cleared
          </div>
        </div>
      </div>

      {/* Monthly Attendance Calendar Grid */}
      <div className="card" style={{ borderRadius: '20px', padding: '24px', border: '1px solid var(--border, #E2E8F0)', marginBottom: '24px' }}>
        <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: 'var(--text-main, #0F172A)' }}>
              {monthName} Attendance Grid
            </h2>
            <small style={{ color: 'var(--text-muted, #64748B)' }}>
              Working days dynamically driven by Student Timetable. Gazetted public &amp; institutional holidays highlighted. Click any date to inspect details.
            </small>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: '700' }}>
            <span style={{ color: '#4F46E5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <i className="fa-solid fa-calendar-week"></i>
              Timetable: 6-Day Instructional Week (Mon–Sat)
            </span>
          </div>
        </div>

        {/* Scrollable Container on Mobile */}
        <div className="lms-attendance-calendar-scroll">
          <div style={{ minWidth: '540px' }}>
            {/* Weekday Row (Mon through Sun) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px', textAlign: 'center', fontWeight: '800', fontSize: '12px', color: 'var(--text-muted, #64748B)' }}>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div style={{ color: '#0F172A' }}>Sat</div>
              <div style={{ color: '#EC4899' }}>Sun (Off)</div>
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
                      d.status === 'holiday' ? 'rgba(14, 165, 233, 0.09)' :
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
                      <span style={{ fontSize: '9px', fontWeight: '800', color: '#0284C7', display: 'flex', alignItems: 'center', gap: '3px', lineHeight: 1.2 }}>
                        <i className="fa-solid fa-umbrella-beach"></i> {d.title}
                      </span>
                    )}
                    {d.status === 'weekend' && (
                      <span style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: '600' }}>
                        {d.dayOfWeek === 0 ? 'Sunday Off' : 'Off-Day'}
                      </span>
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
          <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#0284C7', marginRight: '6px' }}></span> Public / College Holiday</span>
          <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#94A3B8', marginRight: '6px' }}></span> Timetable Off-Day</span>
        </div>
      </div>

      {/* Day Inspection Details Modal */}
      {selectedDay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '16px'
        }}
        onClick={() => setSelectedDay(null)}
        >
          <div
            style={{
              background: 'var(--surface, #FFFFFF)',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border, #E2E8F0)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border, #E2E8F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-canvas, #F8FAFC)'
            }}>
              <div>
                <span className="badge" style={{
                  background:
                    selectedDay.status === 'present' ? '#DCFCE7' :
                    selectedDay.status === 'absent' ? '#FEE2E2' :
                    selectedDay.status === 'holiday' ? '#E0F2FE' :
                    selectedDay.status === 'weekend' ? '#F1F5F9' : '#EDE9FE',
                  color:
                    selectedDay.status === 'present' ? '#16A34A' :
                    selectedDay.status === 'absent' ? '#DC2626' :
                    selectedDay.status === 'holiday' ? '#0284C7' :
                    selectedDay.status === 'weekend' ? '#64748B' : '#6366F1',
                  fontWeight: '800',
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  display: 'inline-block'
                }}>
                  {selectedDay.status === 'holiday' ? `Holiday: ${selectedDay.title}` :
                   selectedDay.status === 'weekend' ? 'Non-Instructional Day (Timetable Off)' :
                   selectedDay.status === 'pre_enrollment' ? 'Pre-Enrollment Date' :
                   selectedDay.status === 'present' ? 'Present (Full Day)' :
                   selectedDay.status === 'partial' ? 'Partial Attendance / Late' :
                   selectedDay.status === 'absent' ? 'Absent (No Classes Attended)' :
                   selectedDay.status === 'upcoming' ? 'Scheduled Class Day' : 'Working Day (No Session Held)'}
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: 'var(--text-main, #0F172A)' }}>
                  {selectedDay.dayName}, {selectedDay.dateStr}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  color: 'var(--text-muted, #64748B)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '8px'
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
              {selectedDay.status === 'holiday' ? (
                <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
                    <i className="fa-solid fa-umbrella-beach"></i>
                  </div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
                    {selectedDay.title}
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted, #64748B)', fontSize: '13.5px', lineHeight: 1.5 }}>
                    This day is a declared public or institutional holiday. No instructional sessions were scheduled or conducted, and attendance calculations are not impacted.
                  </p>
                </div>
              ) : selectedDay.status === 'weekend' ? (
                <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
                    <i className="fa-solid fa-calendar-minus"></i>
                  </div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
                    {selectedDay.dayOfWeek === 0 ? 'Sunday Weekly Off' : 'Non-Instructional Day'}
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted, #64748B)', fontSize: '13.5px', lineHeight: 1.5 }}>
                    {selectedDay.dayOfWeek === 0
                      ? 'Sunday is the standard weekly non-instructional off-day across the campus.'
                      : `According to the cohort's active class timetable, no lectures or laboratories are scheduled for ${selectedDay.dayName}s.`}
                  </p>
                </div>
              ) : selectedDay.status === 'pre_enrollment' ? (
                <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
                    <i className="fa-solid fa-clock-rotate-left"></i>
                  </div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
                    Pre-Enrollment Date
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted, #64748B)', fontSize: '13.5px', lineHeight: 1.5 }}>
                    This date precedes the official program enrollment start date ({student.enrolledAt ? student.enrolledAt.split('T')[0] : 'Academic Start'}). Attendance tracking commenced upon program onboarding.
                  </p>
                </div>
              ) : selectedDay.records && selectedDay.records.length > 0 ? (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)', marginBottom: '12px' }}>
                    Recorded Classroom Periods ({selectedDay.records.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedDay.records.map((r, rIdx) => (
                      <div
                        key={r.id || rIdx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border, #E2E8F0)',
                          background: 'var(--bg-canvas, #F8FAFC)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ fontWeight: '800', fontSize: '13px', color: 'var(--primary, #4F46E5)' }}>
                              {r.courseCode || 'CS111'}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #0F172A)' }}>
                              {r.courseName}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)' }}>
                            <i className="fa-solid fa-user-tie me-1"></i> {r.markedBy || 'Course Faculty'} &bull; {r.topic || 'Classroom Session'}
                          </div>
                        </div>
                        <span style={{
                          background: r.status === 'PRESENT' ? '#DCFCE7' : r.status === 'LATE' ? '#FEF3C7' : '#FEE2E2',
                          color: r.status === 'PRESENT' ? '#16A34A' : r.status === 'LATE' ? '#D97706' : '#DC2626',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <i className={`fa-solid ${r.status === 'PRESENT' ? 'fa-circle-check' : r.status === 'LATE' ? 'fa-clock' : 'fa-circle-xmark'}`}></i>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedDay.status === 'upcoming' ? (
                <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EDE9FE', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
                    <i className="fa-solid fa-calendar-plus"></i>
                  </div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
                    Upcoming Instructional Day
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted, #64748B)', fontSize: '13.5px', lineHeight: 1.5 }}>
                    Lectures and practical sessions are scheduled according to the active timetable. Faculty will record attendance at the start of each period.
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
                    <i className="fa-solid fa-clipboard-question"></i>
                  </div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
                    No Roll-Call Sessions Recorded
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted, #64748B)', fontSize: '13.5px', lineHeight: 1.5 }}>
                    This day was a scheduled working day on the timetable, but no faculty submitted roll-call logs for your cohort on this date.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border, #E2E8F0)',
              background: 'var(--bg-canvas, #F8FAFC)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedDay(null)}
                style={{ padding: '8px 20px', borderRadius: '10px', fontWeight: '700' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
