import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader } from '../../components';
import { parentService } from '../../services/parent.service';
import { getCurrentAcademicYear } from '../../utils/date';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState('');
  const [overview, setOverview] = useState(null);
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

  // Fetch Ward Overview Data
  const fetchOverview = useCallback(async (silent = false) => {
    if (!activeChildId) return;
    if (!silent) setLoading(true);
    else setIsPolling(true);

    try {
      const data = await parentService.getStudentOverview(activeChildId);
      setOverview(data);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to load child overview:', err);
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, [activeChildId]);

  useEffect(() => {
    fetchOverview(false);

    // 30-Second Smart Background Polling
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      fetchOverview(true);
    }, 30000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchOverview]);

  const student = overview?.student;
  const metrics = overview?.metrics || {};
  const marks = overview?.recentMarks || [];
  const remarks = overview?.remarks || [];
  const invoices = overview?.feeInvoices || [];
  const attendance = overview?.recentAttendance || [];

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
            onClick={() => fetchOverview(false)}
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

      {/* Ward Academic Banner */}
      {student && (
        <div style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#fff',
          marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(49, 46, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>
              <i className="fa-solid fa-id-card"></i> WARD PROFILE &bull; AY {getCurrentAcademicYear()}
            </div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800' }}>
              {student.name}
            </h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13.5px', color: '#E0E7FF' }}>
              <span><i className="fa-solid fa-hashtag me-1 opacity-75"></i> Roll: <strong>{student.rollNumber}</strong></span>
              <span><i className="fa-solid fa-graduation-cap me-1 opacity-75"></i> {student.program}</span>
              <span><i className="fa-solid fa-layer-group me-1 opacity-75"></i> Cohort: {student.cohort} ({student.section})</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/unilms/parent/fees"
              style={{
                background: '#F59E0B',
                color: '#fff',
                textDecoration: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
              }}
            >
              <i className="fa-solid fa-credit-card"></i> Pay Fee Dues
            </Link>
            <Link
              to="/unilms/parent/timetable"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#fff',
                textDecoration: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
            >
              <i className="fa-solid fa-calendar-week"></i> View Schedule
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Attendance Card */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px 20px', borderLeft: '4px solid #4F46E5', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Attendance Standing</span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
              <i className="fa-solid fa-user-check"></i>
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '8px' }}>
            {metrics.attendancePct ?? 100}%
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: (metrics.attendancePct ?? 100) >= 75 ? '#059669' : '#DC2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i className={`fa-solid ${(metrics.attendancePct ?? 100) >= 75 ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
            {(metrics.attendancePct ?? 100) >= 75 ? 'Requirement Satisfied (≥ 75%)' : 'Attendance Shortage Alert'}
          </div>
        </div>

        {/* Academic Score Card */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px 20px', borderLeft: '4px solid #10B981', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Academic Performance</span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
              <i className="fa-solid fa-award"></i>
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '8px' }}>
            {metrics.academicPct ?? 85}%
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#059669', marginTop: '4px' }}>
            <i className="fa-solid fa-arrow-trend-up me-1"></i> Continuous CIE &amp; Term Exams
          </div>
        </div>

        {/* Fee Dues Card */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px 20px', borderLeft: '4px solid #F59E0B', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Outstanding Fee Balance</span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
              <i className="fa-solid fa-indian-rupee-sign"></i>
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: (metrics.feePending || 0) > 0 ? '#D97706' : '#059669', marginTop: '8px' }}>
            ₹{(metrics.feePending || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: (metrics.feePending || 0) > 0 ? '#B45309' : '#059669', marginTop: '4px' }}>
            {(metrics.feePending || 0) > 0 ? 'Pending Institutional Dues' : '✓ 100% Fees Cleared'}
          </div>
        </div>

        {/* Faculty Remarks Card */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px 20px', borderLeft: '4px solid #8B5CF6', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Proctor Remarks</span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
              <i className="fa-solid fa-comment-dots"></i>
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '8px' }}>
            {metrics.activeRemarks || remarks.length || 0}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginTop: '4px' }}>
            Faculty &amp; Mentor Logs
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeletonLoader rows={5} columns={4} />
      ) : (
        /* Two Column Main Body */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {/* Left Column: Recent Exam Results & CIE */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-chart-line" style={{ color: '#4F46E5' }}></i> Examination &amp; Evaluation Marks
              </h3>
              <Link to="/unilms/parent/marks" style={{ fontSize: '12.5px', fontWeight: '700', color: '#4F46E5', textDecoration: 'none' }}>
                View All &rarr;
              </Link>
            </div>

            {marks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
                <i className="fa-solid fa-receipt" style={{ fontSize: '32px', color: '#CBD5E1', marginBottom: '10px' }}></i>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '13.5px' }}>No examination results published yet for this term.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {marks.map((m) => (
                  <div key={m.id} style={{ padding: '14px 16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {m.schedule?.subject?.code || 'CS-COURSE'}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginTop: '2px' }}>
                        {m.schedule?.subject?.name || 'Academic Course'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        {m.schedule?.exam?.title || 'Semester Examination'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: '#DCFCE7',
                        color: '#166534',
                        fontWeight: '800',
                        fontSize: '13px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        display: 'inline-block'
                      }}>
                        {m.marksObtained} / {m.maxMarks || 100}
                      </span>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#059669', marginTop: '4px' }}>
                        Grade: {m.grade || 'A+'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Faculty Proctor Remarks */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-comments" style={{ color: '#0EA5E9' }}></i> Faculty &amp; Mentor Remarks
              </h3>
              <span style={{ fontSize: '12px', fontWeight: '700', background: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: '12px' }}>
                {remarks.length} Logged
              </span>
            </div>

            {remarks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
                <i className="fa-solid fa-message" style={{ fontSize: '32px', color: '#CBD5E1', marginBottom: '10px' }}></i>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '13.5px' }}>No teacher remarks logged for this period.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {remarks.map((r) => (
                  <div key={r.id} style={{ padding: '14px 16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: r.category === 'COMMENDATION' ? '#059669' : r.category === 'ATTENDANCE' ? '#D97706' : '#4F46E5',
                        background: r.category === 'COMMENDATION' ? '#ECFDF5' : r.category === 'ATTENDANCE' ? '#FFFBEB' : '#EEF2FF',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        textTransform: 'uppercase'
                      }}>
                        {r.category || 'ACADEMIC'}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13.5px', color: '#334155', lineHeight: '1.5' }}>
                      "{r.remark}"
                    </p>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>
                      <i className="fa-solid fa-chalkboard-user me-1 text-primary"></i> {r.facultyName || 'Course Faculty'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
