import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import placementsService from '../../../services/placements.service';
import studentsService from '../../../services/students.service';

const OrgInternshipsFacultyMentorship = () => {
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [internships, students] = await Promise.allSettled([
          placementsService.getInternships(),
          studentsService.getStudents()
        ]);

        const intList = internships.status === 'fulfilled' && Array.isArray(internships.value) ? internships.value : [];
        const stuList = students.status === 'fulfilled' && Array.isArray(students.value) ? students.value : [];

        if (stuList.length > 0 && isMounted) {
          const mapped = stuList.slice(0, 10).map((stu, idx) => {
            const intPosting = intList[idx % (intList.length || 1)] || {};
            return {
              id: stu.id,
              studentName: `${stu.firstName || ''} ${stu.lastName || ''}`.trim() || 'Student Intern',
              rollNumber: stu.rollNumber || `2026-UG-${idx + 10}`,
              program: stu.program?.name || 'Computer Science & Engineering',
              company: intPosting.company_name || intPosting.companyName || 'Technology Solutions Partner',
              roleTitle: intPosting.role_title || intPosting.roleTitle || 'Software Engineering Intern',
              milestone: `Milestone ${(idx % 4) + 1}: Sprint Deliverable`,
              status: idx % 3 === 0 ? 'Review Pending' : (idx % 3 === 1 ? 'Under Evaluation' : 'Approved'),
              score: idx % 3 === 2 ? '88/100' : 'Pending',
            };
          });
          setMentees(mapped);
        }
      } catch (err) {
        console.warn('Failed to load mentorship workspace:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const totalMentees = mentees.length;
  const pendingReviews = mentees.filter(m => m.status === 'Review Pending').length;
  const approvedMentees = mentees.filter(m => m.status === 'Approved').length;

  return (
    <div className="container-fluid p-0">
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
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
            }}
          >
            <i className="fa-solid fa-user-tie"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Faculty Internship Mentorship Workspace
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Review deliverables, evaluate weekly progress reports &amp; submit final rubric &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/unilms/org/internships" className="btn btn-outline" style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            <i className="fa-solid fa-arrow-left" style={{ color: '#7C3AED' }}></i>
            <span>Back to Internships</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '18px', borderRadius: '14px', border: '1px solid var(--border)', background: '#fff' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Assigned Mentees</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#7C3AED', marginTop: '4px' }}>{totalMentees}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Registered Students</div>
        </div>
        <div className="card" style={{ padding: '18px', borderRadius: '14px', border: '1px solid var(--border)', background: '#fff' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Reviews Pending</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>{pendingReviews}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Awaiting Evaluation</div>
        </div>
        <div className="card" style={{ padding: '18px', borderRadius: '14px', border: '1px solid var(--border)', background: '#fff' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Rubrics Cleared</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>{approvedMentees}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Completed &amp; Signed</div>
        </div>
      </div>

      {/* Mentorship Roster Table */}
      <div className="card" style={{ borderRadius: '16px', border: '1px solid var(--border)', background: '#fff', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
            <i className="fa-solid fa-clipboard-check me-2" style={{ color: '#7C3AED' }}></i>
            Student Mentee Deliverable Submissions
          </h3>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
            Showing {mentees.length} assigned candidate(s)
          </span>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border, #E2E8F0)', borderRadius: '10px' }}>
          <table className="table" style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 14px', fontSize: '11.5px', fontWeight: '700', color: '#64748B', textAlign: 'left' }}>Student</th>
                <th style={{ padding: '12px 14px', fontSize: '11.5px', fontWeight: '700', color: '#64748B', textAlign: 'left' }}>Host Company &amp; Role</th>
                <th style={{ padding: '12px 14px', fontSize: '11.5px', fontWeight: '700', color: '#64748B', textAlign: 'left' }}>Current Milestone</th>
                <th style={{ padding: '12px 14px', fontSize: '11.5px', fontWeight: '700', color: '#64748B', textAlign: 'center' }}>Evaluation Status</th>
                <th style={{ padding: '12px 14px', fontSize: '11.5px', fontWeight: '700', color: '#64748B', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                    <i className="fa-solid fa-spinner fa-spin me-2"></i> Loading mentorship candidates...
                  </td>
                </tr>
              ) : mentees.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                    No student internship mentees assigned to your portfolio yet.
                  </td>
                </tr>
              ) : (
                mentees.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>{m.studentName}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>Roll: {m.rollNumber} &bull; {m.program}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#0F172A' }}>{m.company}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>{m.roleTitle}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#4F46E5' }}>{m.milestone}</span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: m.status === 'Approved' ? 'rgba(16, 185, 129, 0.12)' : (m.status === 'Review Pending' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(99, 102, 241, 0.12)'),
                        color: m.status === 'Approved' ? '#059669' : (m.status === 'Review Pending' ? '#D97706' : '#4F46E5')
                      }}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <Link
                        to={`/unilms/org/internships/review_student?studentId=${m.id}&name=${encodeURIComponent(m.studentName)}`}
                        style={{
                          background: '#7C3AED',
                          color: '#fff',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Review Rubric
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrgInternshipsFacultyMentorship;