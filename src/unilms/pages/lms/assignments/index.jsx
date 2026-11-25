import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader } from '../../../components';
import lmsStudentService from '../../../services/lmsStudent.service';

const LmsAssignmentsIndex = () => {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedAssessmentModal, setSelectedAssessmentModal] = useState(null);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const res = await lmsStudentService.getAssignments();
        if (res && Array.isArray(res.assignments)) {
          const mapped = res.assignments.map((item) => {
            const isGraded = item.submissionStatus === 'GRADED';
            const isPending = item.submissionStatus === 'PENDING';
            const due = item.dueDate ? new Date(item.dueDate) : null;
            const isOverdue = due ? due < new Date() && isPending : false;

            return {
              id: item.id,
              courseCode: item.courseCode || 'CS111',
              subject: item.courseName || 'Operating system',
              title: item.title,
              type: 'file_upload',
              typeName: 'Coursework Assignment',
              maxMarks: `${item.maxScore || 50} Pts`,
              weightage: `${item.weightage || 20}% Grade`,
              dueDate: due ? due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
              isOverdue,
              status: isGraded ? 'graded' : isPending ? 'pending' : 'submitted',
              score: item.score !== null ? `${item.score} / ${item.maxScore}` : 'Pending Evaluation',
              feedback: item.remarks || (isGraded ? 'Evaluated by faculty. Good work!' : 'Submission received and awaiting grading.'),
              actionText: isGraded ? 'Review Evaluation' : isPending ? 'Submit Assignment' : 'View Submission',
              actionLink: '/unilms/lms/assessments/file_submit'
            };
          });
          setAssignments(mapped);
        }
      } catch (err) {
        console.warn('Failed to load live student assignments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const matchFilter =
        filter === 'all' ? true :
        filter === 'pending' ? item.status === 'pending' :
        filter === 'graded' ? item.status === 'graded' : true;

      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.subject.toLowerCase().includes(search.toLowerCase()) ||
        item.courseCode.toLowerCase().includes(search.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [assignments, filter, search]);

  const stats = useMemo(() => {
    const total = assignments.length;
    const graded = assignments.filter((a) => a.status === 'graded').length;
    const pending = assignments.filter((a) => a.status === 'pending').length;
    return { total, graded, pending };
  }, [assignments]);

  return (
    <>
      <div className="lms-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1>
              <i className="fa-solid fa-file-pen me-2" style={{ color: 'var(--primary, #4F46E5)' }}></i>{' '}
              Assignments &amp; Coursework Deliverables
            </h1>
            <p>Access active class assignments, submit laboratory solutions, and review graded submissions.</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid var(--primary, #4F46E5)',
            background: 'var(--surface, #FFFFFF)',
            borderRadius: '12px',
            border: '1px solid var(--border, #E2E8F0)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase' }}>
            Total Allocated
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '4px' }}>
            {stats.total} Tasks
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', marginTop: '2px' }}>
            Active Term Coursework
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #10B981',
            background: 'var(--surface, #FFFFFF)',
            borderRadius: '12px',
            border: '1px solid var(--border, #E2E8F0)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase' }}>
            Graded Submissions
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981', marginTop: '4px' }}>
            {stats.graded} Evaluated
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> Marks Synced with OBE
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid #F59E0B',
            background: 'var(--surface, #FFFFFF)',
            borderRadius: '12px',
            border: '1px solid var(--border, #E2E8F0)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase' }}>
            Pending Action
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#F59E0B', marginTop: '4px' }}>
            {stats.pending} Deliverables
          </div>
          <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: '700', marginTop: '2px' }}>
            Awaiting Submission
          </div>
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
          marginBottom: '20px',
          padding: '12px 16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}
          >
            All Assignments ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}
          >
            Pending ({stats.pending})
          </button>
          <button
            type="button"
            onClick={() => setFilter('graded')}
            className={`btn btn-sm ${filter === 'graded' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}
          >
            Graded ({stats.graded})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '240px' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted, #64748B)', fontSize: '12px' }}
          ></i>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments or subjects..."
            style={{
              paddingLeft: '30px',
              paddingRight: '10px',
              height: '34px',
              borderRadius: '8px',
              fontSize: '12px',
              border: '1px solid var(--border, #E2E8F0)',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <TableSkeletonLoader columns={3} rows={3} />
      ) : filteredAssignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-folder-open" style={{ fontSize: '36px', marginBottom: '12px', color: '#94A3B8' }}></i>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main, #0F172A)' }}>No Assignments Found</h3>
          <p style={{ fontSize: '13px', margin: '4px 0 0' }}>There are no coursework assignments matching your current filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredAssignments.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: '14px',
                padding: '18px 20px',
                background: 'var(--surface, #FFFFFF)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span
                    style={{
                      background: 'rgba(79, 70, 229, 0.1)',
                      color: 'var(--primary, #4F46E5)',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    {item.courseCode}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: item.status === 'graded' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: item.status === 'graded' ? '#10B981' : '#D97706',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    {item.status === 'graded' ? 'Graded' : 'Pending Submission'}
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main, #0F172A)', margin: '0 0 6px' }}>
                  {item.title}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', marginBottom: '12px', fontWeight: '600' }}>
                  {item.subject}
                </div>

                <div
                  style={{
                    background: 'var(--bg-canvas, #F8FAFC)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    fontSize: '11.5px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748B)', display: 'block', fontSize: '10px', fontWeight: '700' }}>DUE DATE</span>
                    <strong style={{ color: item.isOverdue ? '#DC2626' : 'var(--text-main, #0F172A)' }}>{item.dueDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748B)', display: 'block', fontSize: '10px', fontWeight: '700' }}>MAX MARKS</span>
                    <strong style={{ color: 'var(--text-main, #0F172A)' }}>{item.maxMarks} ({item.weightage})</strong>
                  </div>
                </div>

                {item.status === 'graded' && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669' }}>Awarded Score:</span>
                      <strong style={{ fontSize: '13px', color: '#059669', fontWeight: '800' }}>{item.score}</strong>
                    </div>
                    {item.feedback && (
                      <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px', fontStyle: 'italic' }}>
                        "{item.feedback}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedAssessmentModal(item)}
                  className="btn btn-outline"
                  style={{ flex: 1, fontSize: '12px', fontWeight: '700', padding: '8px 12px', borderRadius: '8px' }}
                >
                  View Details
                </button>
                <Link
                  to={item.actionLink}
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '12px', fontWeight: '700', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', textDecoration: 'none' }}
                >
                  {item.actionText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedAssessmentModal && (
        <div
          onClick={() => setSelectedAssessmentModal(null)}
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
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--border, #E2E8F0)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSelectedAssessmentModal(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'var(--bg-canvas, #F8FAFC)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted, #64748B)'
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <span
              style={{
                background: 'rgba(79, 70, 229, 0.1)',
                color: 'var(--primary, #4F46E5)',
                fontSize: '11.5px',
                fontWeight: '800',
                padding: '3px 9px',
                borderRadius: '6px'
              }}
            >
              {selectedAssessmentModal.courseCode}
            </span>

            <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main, #0F172A)', margin: '10px 0 4px' }}>
              {selectedAssessmentModal.title}
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748B)', marginBottom: '16px' }}>
              {selectedAssessmentModal.subject}
            </div>

            <div style={{ background: 'var(--bg-canvas, #F8FAFC)', padding: '14px', borderRadius: '10px', marginBottom: '16px', fontSize: '12.5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', display: 'block' }}>DEADLINE</span>
                  <strong>{selectedAssessmentModal.dueDate}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', display: 'block' }}>MAXIMUM MARKS</span>
                  <strong>{selectedAssessmentModal.maxMarks}</strong>
                </div>
              </div>
            </div>

            {selectedAssessmentModal.status === 'graded' && (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '16px' }}>
                <div style={{ fontWeight: '800', color: '#059669', fontSize: '13px', marginBottom: '4px' }}>
                  Faculty Evaluation Feedback:
                </div>
                <div style={{ fontSize: '12.5px', color: '#047857' }}>
                  {selectedAssessmentModal.feedback}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedAssessmentModal(null)}
                className="btn btn-outline"
                style={{ fontSize: '12.5px', fontWeight: '700', padding: '8px 16px', borderRadius: '8px' }}
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

export default LmsAssignmentsIndex;
