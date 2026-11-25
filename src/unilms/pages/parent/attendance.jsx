import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { parentService } from '../../services/parent.service';

const ParentAttendance = () => {
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
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

  // Fetch Attendance Data for Selected Ward
  const fetchAttendance = useCallback(async (silent = false) => {
    if (!activeChildId) return;
    if (!silent) setLoading(true);
    else setIsPolling(true);

    try {
      const data = await parentService.getAttendance(activeChildId);
      setAttendanceData(data);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, [activeChildId]);

  useEffect(() => {
    fetchAttendance(false);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      fetchAttendance(true);
    }, 30000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchAttendance]);

  const student = attendanceData?.student;
  const summary = attendanceData?.summary || {};
  const records = attendanceData?.records || [];

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(records, 10);

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
            onClick={() => fetchAttendance(false)}
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
      {student && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 18px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{student.name}</span>
            <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
              Roll: {student.rollNumber}
            </span>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              {student.program} &bull; Cohort {student.cohort}
            </span>
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: '800',
            padding: '4px 12px',
            borderRadius: '20px',
            background: (summary.attendanceRate || 0) >= 75 ? '#ECFDF5' : '#FEF2F2',
            color: (summary.attendanceRate || 0) >= 75 ? '#059669' : '#DC2626',
            border: `1px solid ${(summary.attendanceRate || 0) >= 75 ? '#A7F3D0' : '#FECACA'}`
          }}>
            <i className={`fa-solid ${(summary.attendanceRate || 0) >= 75 ? 'fa-circle-check' : 'fa-circle-xmark'} me-1`}></i>
            {(summary.attendanceRate || 0) >= 75 ? 'ELIGIBLE (≥ 75% ATTENDANCE)' : 'CONDITIONAL / SHORTAGE'}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Attendance Rate */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #4F46E5' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Overall Attendance Rate</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#4F46E5', marginTop: '6px' }}>
            {summary.attendanceRate ?? 100}%
          </div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: (summary.attendanceRate ?? 100) >= 75 ? '#059669' : '#DC2626', marginTop: '3px' }}>
            AICTE &amp; UGC Minimum: 75%
          </div>
        </div>

        {/* Present Sessions */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Classes Attended</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '6px' }}>
            {summary.presentCount ?? 0}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#059669', marginTop: '3px' }}>
            Of {summary.totalSessions ?? 0} Recorded Sessions
          </div>
        </div>

        {/* Absent Sessions */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #EF4444' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Classes Missed</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#EF4444', marginTop: '6px' }}>
            {summary.absentCount ?? 0}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>
            Unexcused / Absent Log
          </div>
        </div>

        {/* Late Sessions */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Late Arrivals</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#D97706', marginTop: '6px' }}>
            {summary.lateCount ?? 0}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>
            Recorded by Faculty
          </div>
        </div>
      </div>

      {/* Attendance Register Table Card */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-clipboard-user" style={{ color: '#4F46E5' }}></i> Daily Period Roll-Call Log ({totalItems})
          </h3>
        </div>

        {loading ? (
          <TableSkeletonLoader rows={6} columns={5} />
        ) : paginatedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
            <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '36px', color: '#CBD5E1', marginBottom: '12px' }}></i>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>No period roll-call records found for this student.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Subject / Course</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Topic Covered / Session</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Recorded By</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'center' }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((r) => {
                    const st = (r.status || 'PRESENT').toUpperCase();
                    const isPresent = st === 'PRESENT';
                    const isAbsent = st === 'ABSENT';
                    const isLate = st === 'LATE';

                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>
                          {r.date}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>
                            {r.courseCode}
                          </span>
                          <span style={{ fontWeight: '700', color: '#1E293B' }}>{r.courseName}</span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {r.topic}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B', fontWeight: '600' }}>
                          <i className="fa-solid fa-chalkboard-user me-1 text-primary opacity-75"></i> {r.markedBy}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '800',
                            background: isPresent ? '#DCFCE7' : isAbsent ? '#FEE2E2' : '#FEF3C7',
                            color: isPresent ? '#15803D' : isAbsent ? '#B91C1C' : '#B45309'
                          }}>
                            <i className={`fa-solid ${isPresent ? 'fa-check' : isAbsent ? 'fa-xmark' : 'fa-clock'}`}></i>
                            {r.status}
                          </span>
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
    </div>
  );
};

export default ParentAttendance;
