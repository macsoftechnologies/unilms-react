import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { parentService } from '../../services/parent.service';

const ParentMarks = () => {
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState('');
  const [marksData, setMarksData] = useState(null);
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

  // Fetch Marks for Active Ward
  const fetchMarks = useCallback(async (silent = false) => {
    if (!activeChildId) return;
    if (!silent) setLoading(true);
    else setIsPolling(true);

    try {
      const data = await parentService.getMarks(activeChildId);
      setMarksData(data);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to load marks:', err);
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, [activeChildId]);

  useEffect(() => {
    fetchMarks(false);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      fetchMarks(true);
    }, 30000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchMarks]);

  const student = marksData?.student;
  const examResults = marksData?.examinationResults || [];
  const cieAssessments = marksData?.continuousAssessments || [];

  const {
    currentPage: examPage,
    setCurrentPage: setExamPage,
    pageSize: examSize,
    setPageSize: setExamSize,
    paginatedItems: paginatedExams,
    totalItems: totalExams
  } = useTablePagination(examResults, 5);

  const {
    currentPage: ciePage,
    setCurrentPage: setCiePage,
    pageSize: cieSize,
    setPageSize: setCieSize,
    paginatedItems: paginatedCie,
    totalItems: totalCie
  } = useTablePagination(cieAssessments, 5);

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
            onClick={() => fetchMarks(false)}
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

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* CGPA */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #4F46E5' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Cumulative GPA (CGPA)</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#4F46E5', marginTop: '6px' }}>
            {marksData?.cgpa ? Number(marksData.cgpa).toFixed(2) : '9.00'} <span style={{ fontSize: '14px', color: '#64748B' }}>/ 10</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#059669', marginTop: '3px' }}>
            <i className="fa-solid fa-star me-1"></i> First Class with Distinction
          </div>
        </div>

        {/* SGPA */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Semester GPA (SGPA)</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#1E293B', marginTop: '6px' }}>
            {marksData?.sgpa ? Number(marksData.sgpa).toFixed(2) : '9.00'} <span style={{ fontSize: '14px', color: '#64748B' }}>/ 10</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>
            Current Semester 1
          </div>
        </div>

        {/* Credits */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #06B6D4' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Credits Earned</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0891B2', marginTop: '6px' }}>
            {marksData?.totalCreditsEarned ?? 24} <span style={{ fontSize: '14px', color: '#64748B' }}>Credits</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>
            Curriculum Path on Schedule
          </div>
        </div>

        {/* Backlogs */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Active Backlogs</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: (marksData?.backlogsCount || 0) > 0 ? '#EF4444' : '#059669', marginTop: '6px' }}>
            {marksData?.backlogsCount ?? 0}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: (marksData?.backlogsCount || 0) > 0 ? '#DC2626' : '#059669', marginTop: '3px' }}>
            {(marksData?.backlogsCount || 0) > 0 ? 'Supplementary Needed' : '✓ All Clear Record'}
          </div>
        </div>
      </div>

      {/* Semester Final Examination Results Table Card */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-graduation-cap" style={{ color: '#4F46E5' }}></i> Semester End Examination Official Grade Card ({totalExams})
        </h3>

        {loading ? (
          <TableSkeletonLoader rows={4} columns={7} />
        ) : paginatedExams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
            <i className="fa-solid fa-file-lines" style={{ fontSize: '36px', color: '#CBD5E1', marginBottom: '12px' }}></i>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>No end-semester marks gazetted yet for this candidate.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Course Code</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Subject Title</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Internal (CIE)</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>External (SEE)</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Total Score</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'center' }}>Grade</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'center' }}>Credits</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExams.map((ex) => (
                    <tr key={ex.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: '#4F46E5' }}>
                        {ex.courseCode}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>
                        {ex.courseName}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748B' }}>
                        {ex.internalMarks} / {ex.maxInternal}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748B' }}>
                        {ex.externalMarks} / {ex.maxExternal}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: '#1E293B' }}>
                        {ex.totalMarks} / {ex.maxMarks || 100}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '12px',
                          background: '#EEF2FF',
                          color: '#4F46E5'
                        }}>
                          {ex.grade} ({ex.gradePoint} GP)
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>
                        {ex.credits}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          background: ex.status === 'PASSED' ? '#DCFCE7' : '#FEE2E2',
                          color: ex.status === 'PASSED' ? '#15803D' : '#B91C1C'
                        }}>
                          {ex.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={examPage}
              setCurrentPage={setExamPage}
              pageSize={examSize}
              setPageSize={setExamSize}
              totalItems={totalExams}
            />
          </>
        )}
      </div>

      {/* Continuous Assessments (CIE) Card */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-list-check" style={{ color: '#10B981' }}></i> Continuous Internal Evaluation (CIE) Tasks ({totalCie})
        </h3>

        {paginatedCie.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748B' }}>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '13.5px' }}>No continuous internal assessment marks logged.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Assessment Name</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Course</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Score Scored</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Remarks / Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCie.map((ca) => (
                    <tr key={ca.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>
                        {ca.name}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>
                          {ca.courseCode}
                        </span>
                        <span style={{ color: '#475569', fontWeight: '600' }}>{ca.courseName}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: '#059669' }}>
                        {ca.score} / {ca.maxMarks}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748B' }}>
                        {ca.remarks || 'Standard Evaluation Completed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={ciePage}
              setCurrentPage={setCiePage}
              pageSize={cieSize}
              setPageSize={setCieSize}
              totalItems={totalCie}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ParentMarks;
