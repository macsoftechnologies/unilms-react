import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { parentService } from '../../services/parent.service';

const ParentAssignments = () => {
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState('');
  const [homeworkData, setHomeworkData] = useState(null);
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

  // Fetch Homework & Tasks for Active Ward
  const fetchHomework = useCallback(async (silent = false) => {
    if (!activeChildId) return;
    if (!silent) setLoading(true);
    else setIsPolling(true);

    try {
      const data = await parentService.getHomework(activeChildId);
      setHomeworkData(data);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to load homework:', err);
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, [activeChildId]);

  useEffect(() => {
    fetchHomework(false);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      fetchHomework(true);
    }, 30000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchHomework]);

  const assignments = homeworkData?.assignments || [];
  const materials = homeworkData?.materials || [];

  const gradedCount = assignments.filter((a) => a.submissionStatus === 'GRADED').length;
  const pendingCount = assignments.filter((a) => a.submissionStatus === 'PENDING').length;

  const {
    currentPage: hwPage,
    setCurrentPage: setHwPage,
    pageSize: hwSize,
    setPageSize: setHwSize,
    paginatedItems: paginatedHw,
    totalItems: totalHw
  } = useTablePagination(assignments, 5);

  const {
    currentPage: matPage,
    setCurrentPage: setMatPage,
    pageSize: matSize,
    setPageSize: setMatSize,
    paginatedItems: paginatedMat,
    totalItems: totalMat
  } = useTablePagination(materials, 5);

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
            onClick={() => fetchHomework(false)}
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
        {/* Total Tasks */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #4F46E5' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Homework &amp; Tasks Assigned</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '6px' }}>
            {assignments.length}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#4F46E5', marginTop: '3px' }}>
            Continuous Evaluation Track
          </div>
        </div>

        {/* Graded Tasks */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Evaluated &amp; Graded</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '6px' }}>
            {gradedCount}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#059669', marginTop: '3px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> Marks Scored
          </div>
        </div>

        {/* Pending Tasks */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Pending Submissions</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#D97706', marginTop: '6px' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>
            Action Required by Ward
          </div>
        </div>

        {/* Course Materials */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px', borderLeft: '4px solid #06B6D4' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Course Study Materials</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0891B2', marginTop: '6px' }}>
            {materials.length}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>
            Handouts &amp; Lecture Slides
          </div>
        </div>
      </div>

      {/* Homework Tasks Table Card */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-file-pen" style={{ color: '#4F46E5' }}></i> Course Assignments &amp; Homework Tasks ({totalHw})
        </h3>

        {loading ? (
          <TableSkeletonLoader rows={4} columns={6} />
        ) : paginatedHw.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
            <i className="fa-solid fa-folder-open" style={{ fontSize: '36px', color: '#CBD5E1', marginBottom: '12px' }}></i>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>No homework or CIE tasks currently assigned.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Assignment Title</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Course</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Due Date</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Max Score</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'right' }}>Score / Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHw.map((a) => {
                    const isGraded = a.submissionStatus === 'GRADED';
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>
                          {a.title}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>
                            {a.courseCode}
                          </span>
                          <span style={{ color: '#475569' }}>{a.courseName}</span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>
                          {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-GB') : 'No Due Date'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>
                          {a.maxScore} pts ({a.weightage}% wt)
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: '800',
                            background: isGraded ? '#DCFCE7' : '#FEF3C7',
                            color: isGraded ? '#15803D' : '#B45309'
                          }}>
                            {a.submissionStatus}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {isGraded ? (
                            <div>
                              <span style={{ fontWeight: '800', color: '#059669', fontSize: '14px' }}>
                                {a.score} / {a.maxScore}
                              </span>
                              {a.remarks && (
                                <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic', marginTop: '2px' }}>
                                  "{a.remarks}"
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '12px', fontStyle: 'italic' }}>
                              Pending Evaluation
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={hwPage}
              setCurrentPage={setHwPage}
              pageSize={hwSize}
              setPageSize={setHwSize}
              totalItems={totalHw}
            />
          </>
        )}
      </div>

      {/* Course Study Materials Table Card */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-book-bookmark" style={{ color: '#06B6D4' }}></i> Course Study Materials &amp; Faculty Handouts ({totalMat})
        </h3>

        {paginatedMat.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748B' }}>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '13.5px' }}>No study materials published for this cohort yet.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Material Title</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Course</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Format</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Uploaded By</th>
                    <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'right' }}>Resource</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMat.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>
                        {m.title}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        {m.courseName}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: '#F1F5F9', color: '#475569' }}>
                          {m.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748B' }}>
                        {m.uploadedBy}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <a
                          href={m.fileUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: '#EEF2FF',
                            color: '#4F46E5',
                            textDecoration: 'none',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square"></i> Open Handout
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={matPage}
              setCurrentPage={setMatPage}
              pageSize={matSize}
              setPageSize={setMatSize}
              totalItems={totalMat}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ParentAssignments;
