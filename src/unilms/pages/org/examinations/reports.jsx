import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import examinationsService from '../../../services/examinations.service';
import academicsService from '../../../services/academics.service';
import studentsService from '../../../services/students.service';

const OrgExaminationsReports = () => {
  // Master Data
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [examSummaries, setExamSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // 4-Tier Cascading Filter State
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState('ALL');
  const [selectedExamId, setSelectedExamId] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [activeTab, setActiveTab] = useState('defaulters');

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, examRes, stuRes, reportRes] = await Promise.all([
        academicsService.getDepartments(),
        academicsService.getPrograms(),
        examinationsService.getExams(),
        studentsService.getStudents(),
        examinationsService.getReports(selectedExamId !== 'ALL' ? selectedExamId : undefined),
      ]);

      const depts = Array.isArray(deptRes) ? deptRes : (deptRes?.data || []);
      const progs = Array.isArray(progRes) ? progRes : (progRes?.data || []);
      const exms = Array.isArray(examRes) ? examRes : (examRes?.data || []);
      const stus = Array.isArray(stuRes) ? stuRes : (stuRes?.data || []);

      setDepartments(depts);
      setPrograms(progs);
      setExams(exms);
      setStudents(stus);

      if (stus.length > 0 && !selectedStudentId) {
        setSelectedStudentId(stus[0].id);
      }

      if (reportRes) {
        setDefaulters(reportRes.defaulters || []);
        
        // Compute summary metrics per exam
        const exList = reportRes.exams || [];
        const summaries = exList.map(e => {
          let totalMarksCount = 0;
          let passCount = 0;
          (e.schedules || []).forEach(sch => {
            (sch.marks || []).forEach(m => {
              totalMarksCount++;
              const passM = sch.passMarks || sch.passingMarks || 40;
              if (!m.isAbsent && Number(m.marksObtained) >= passM) {
                passCount++;
              }
            });
          });

          const passRate = totalMarksCount > 0 ? `${Math.round((passCount / totalMarksCount) * 100)}%` : '100%';
          return {
            id: e.id,
            exam_name: e.title || e.name || 'Exam Cycle',
            type: e.type || 'REGULAR',
            schedulesCount: (e.schedules || []).length,
            totalMarksCount: totalMarksCount,
            pass_rate: passRate,
          };
        });
        setExamSummaries(summaries);
      }
    } catch (err) {
      console.error('Failed to load exam report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedExamId]);

  // Filtering for Defaulters table
  const filteredDefaulters = defaulters.filter(d => {
    if (selectedProgramId !== 'ALL') {
      const progMatch = (d.program || '').toLowerCase();
      const selProg = programs.find(p => p.id === selectedProgramId);
      if (selProg && !progMatch.includes(selProg.code?.toLowerCase()) && !progMatch.includes(selProg.name?.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const {
    currentPage: defPage,
    setCurrentPage: setDefPage,
    pageSize: defSize,
    setPageSize: setDefSize,
    paginatedItems: paginatedDefaulters,
    totalItems: totalDefaulters
  } = useTablePagination(filteredDefaulters, 10);

  const {
    currentPage: sumPage,
    setCurrentPage: setSumPage,
    pageSize: sumSize,
    setPageSize: setSumSize,
    paginatedItems: paginatedSummary,
    totalItems: totalSummary
  } = useTablePagination(examSummaries, 10);

  // Student details for Progress Tab
  const currStudent = students.find(s => s.id === selectedStudentId) || null;

  return (
    <>
      <section className="view-section active">
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
                background: 'linear-gradient(135deg, #059669, #0D9488)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
              }}
            >
              <i className="fa-solid fa-chart-pie"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Examination Reports &amp; Result Tabulation
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Generate D-Form fee defaulters, pass percentage analytics &amp; student grade transcripts &bull; AY 2026&ndash;2027
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link 
              to="/unilms/org/examinations" 
              className="btn btn-outline" 
              style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-graduation-cap" style={{ color: '#059669' }}></i>
              <span>Exam Cycles</span>
            </Link>
            <Link 
              to="/unilms/org/examinations/hall_tickets" 
              className="btn btn-outline" 
              style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-ticket" style={{ color: '#059669' }}></i>
              <span>Hall Tickets</span>
            </Link>
          </div>
        </div>

        {/* 4-Tier Cascading Academic Filter Bar */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)',
            background: 'var(--card-bg, #fff)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <i className="fa-solid fa-filter" style={{ color: '#059669', fontSize: '13px' }}></i>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Gazette &amp; Tabulation Filter Bar
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
            {/* Tier 1: Department */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>DEPARTMENT</label>
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  setSelectedProgramId('ALL');
                }}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            {/* Tier 2: Degree Program */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>DEGREE PROGRAM</label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
              >
                <option value="ALL">All Programs</option>
                {(selectedDeptId === 'ALL' ? programs : programs.filter(p => p.departmentId === selectedDeptId || p.department_id === selectedDeptId)).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            {/* Tier 3: Exam Cycle */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>EXAM CYCLE</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
              >
                <option value="ALL">All Exam Cycles</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.title || e.name} ({e.type})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            onClick={() => setActiveTab('defaulters')}
            className={`btn ${activeTab === 'defaulters' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '9px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', background: activeTab === 'defaulters' ? '#059669' : '#fff', color: activeTab === 'defaulters' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <i className="fa-solid fa-user-xmark" style={{ marginRight: '6px' }}></i> D-Form: Fee Defaulters ({filteredDefaulters.length})
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('summary')}
            className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '9px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', background: activeTab === 'summary' ? '#059669' : '#fff', color: activeTab === 'summary' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <i className="fa-solid fa-chart-pie" style={{ marginRight: '6px' }}></i> Institutional Result Summary
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('progress')}
            className={`btn ${activeTab === 'progress' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '9px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', background: activeTab === 'progress' ? '#059669' : '#fff', color: activeTab === 'progress' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <i className="fa-solid fa-graduation-cap" style={{ marginRight: '6px' }}></i> Student Grade Card
          </button>
        </div>

        {/* TAB 1: D-Form Defaulters */}
        {activeTab === 'defaulters' && (
          <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>D-Form: Exam Fee Defaulters Ledger</h3>
            <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 16px' }}>Enrolled candidates with uncollected examination dues &bull; Hall ticket release blocked by Module 03 Gate</p>
            
            <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', background: '#F8FAFC' }}>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Exam Name</th>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Candidate Name</th>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Roll Number &amp; Program</th>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Unpaid Amount Due</th>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Gate Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={5} rows={defSize || 5} />
                  ) : paginatedDefaulters.length > 0 ? (
                    paginatedDefaulters.map(d => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>{d.exam_name}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13.5px', fontWeight: '700' }}>{d.first_name} {d.last_name}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#475569', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                            {d.roll_number}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>&bull; {d.program}</span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <span style={{ color: '#DC2626', fontWeight: '800', fontSize: '13px' }}>{d.due_amount}</span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span className="badge" style={{ background: '#FEE2E2', color: '#DC2626', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                            <i className="fa-solid fa-lock" style={{ marginRight: '4px' }}></i> WITHHELD
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#16A34A', fontWeight: '600' }}>
                        <i className="fa-solid fa-circle-check" style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}></i>
                        All student fees cleared. Zero exam defaulters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={defPage}
                totalItems={totalDefaulters}
                pageSize={defSize}
                onPageChange={setDefPage}
                onPageSizeChange={setDefSize}
                itemName="defaulters"
              />
            </div>
          </div>
        )}

        {/* TAB 2: Institutional Result Summary */}
        {activeTab === 'summary' && (
          <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Institutional Examination Analytics</h3>
            <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 16px' }}>Session-wise schedule counts, candidate participation &amp; overall passing ratios</p>
            
            <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', background: '#F8FAFC' }}>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Exam Cycle Title</th>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Type</th>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Scheduled Courses</th>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Evaluated Marks</th>
                    <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Pass Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={5} rows={sumSize || 5} />
                  ) : paginatedSummary.length > 0 ? (
                    paginatedSummary.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>{c.exam_name}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className="badge" style={{ background: '#DCFCE7', color: '#16A34A', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                            {c.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px' }}><strong>{c.schedulesCount}</strong> Papers</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>{c.totalMarksCount} submissions</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', padding: '4px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>
                            {c.pass_rate}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No examination summary data found.</td></tr>
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={sumPage}
                totalItems={totalSummary}
                pageSize={sumSize}
                onPageChange={setSumPage}
                onPageSizeChange={setSumSize}
                itemName="summaries"
              />
            </div>
          </div>
        )}

        {/* TAB 3: Student Progress Report */}
        {activeTab === 'progress' && (
          <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Student Grade Card &amp; Academic Transcript</h3>
                <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '13px' }}>Subject-wise marks evaluation &amp; passing certifications</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  value={selectedStudentId} 
                  onChange={(e) => setSelectedStudentId(e.target.value)} 
                  style={{ height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 12px', fontSize: '13px' }}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNumber || 'Enrolled'})</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={() => window.print()}
                  className="btn btn-outline" 
                  style={{ height: '38px', padding: '0 14px', borderRadius: '8px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="fa-solid fa-print"></i> Print Grade Sheet
                </button>
              </div>
            </div>

            {currStudent ? (
              <div style={{ background: '#F8FAFC', padding: '16px 20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>STUDENT NAME</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{currStudent.firstName} {currStudent.lastName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>ROLL / REGISTRATION NO.</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#4338CA', fontFamily: 'monospace' }}>{currStudent.rollNumber || currStudent.enrollmentNumber || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>DEGREE PROGRAM</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>{currStudent.program?.name || 'Academic Degree Program'}</div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '10px', marginBottom: '20px', border: '1px solid var(--border-color)', textAlign: 'center', color: '#64748B' }}>
                <i className="fa-solid fa-user-xmark" style={{ fontSize: '28px', marginBottom: '8px', display: 'block', color: '#94A3B8' }}></i>
                Please select an enrolled student from the dropdown to view their official progress and grade report.
              </div>
            )}

            <div style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
              <i className="fa-solid fa-certificate" style={{ fontSize: '36px', color: '#059669', marginBottom: '10px', display: 'block' }}></i>
              Official Grade Card is ready for print issuance. Click <strong>Print Grade Sheet</strong> to generate physical seal copy.
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgExaminationsReports;
