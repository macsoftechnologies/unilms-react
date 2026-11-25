import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import studentsService from '../../../services/students.service';
import academicsService from '../../../services/academics.service';
import examinationsService from '../../../services/examinations.service';

const OrgExaminationsPrintHallTicket = () => {
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get('studentId');
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState({
    orgName: localStorage.getItem('unilms_tenant_name') || localStorage.getItem('unilms_org_name') || 'University Examination Authority',
    examName: 'End-Semester University Examinations',
    hallTicketNumber: '',
    studentName: '',
    rollNumber: '',
    programName: '',
    semesterName: 'Semester 1',
    issueDate: new Date().toLocaleDateString('en-GB'),
    schedule: []
  });

  useEffect(() => {
    const loadTicketData = async () => {
      setLoading(true);
      try {
        const [studentsRes, examsRes, schedulesRes] = await Promise.allSettled([
          studentsService.getStudents(),
          examinationsService.getExams(),
          examinationsService.getSchedules()
        ]);

        const students = studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value) ? studentsRes.value : [];
        const exams = examsRes.status === 'fulfilled' && Array.isArray(examsRes.value) ? examsRes.value : [];
        const schedules = schedulesRes.status === 'fulfilled' && Array.isArray(schedulesRes.value) ? schedulesRes.value : [];

        const student = studentIdParam
          ? students.find((s) => s.id === studentIdParam)
          : null;

        const activeExam = exams[0];
        const orgName = localStorage.getItem('unilms_tenant_name') || localStorage.getItem('unilms_org_name') || 'University Examination Authority';

        if (student) {
          const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Enrolled Student';
          const prog = student.program?.name || 'Academic Degree Program';
          const roll = student.rollNumber || 'STU-ONLINE';

          const mappedSchedule = schedules.length > 0
            ? schedules.map((sch) => ({
                date: sch.examDate ? new Date(sch.examDate).toLocaleDateString('en-GB') : 'TBD',
                startTime: sch.startTime || '09:30 AM',
                endTime: sch.endTime || '12:30 PM',
                subjectCode: sch.subject?.code || 'SUB',
                subjectName: sch.subject?.name || 'Academic Course'
              }))
            : [];

          setTicket({
            orgName,
            examName: activeExam?.name || 'End-Semester University Examinations',
            hallTicketNumber: `HT-${new Date().getFullYear()}-${roll.replace(/[^0-9]/g, '').slice(-4) || '0001'}`,
            studentName,
            rollNumber: roll,
            programName: prog,
            semesterName: 'Semester 1',
            issueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            schedule: mappedSchedule
          });
        }
      } catch (e) {
        console.warn('Failed to load live hall ticket data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadTicketData();
  }, [studentIdParam]);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .ticket-container { box-shadow: none !important; border: 1.5px solid #000 !important; }
        }
        .ticket-container {
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          border: 1.5px solid #0F172A;
          border-radius: 8px;
          padding: 28px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0F172A;
        }
        .ticket-header {
          text-align: center;
          border-bottom: 2px solid #0F172A;
          padding-bottom: 14px;
          margin-bottom: 18px;
        }
        .ticket-header h1 {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ticket-header h2 {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          color: #4F46E5;
          letter-spacing: 1px;
        }
        .ticket-header p {
          margin: 4px 0 0;
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px dashed #CBD5E1;
        }
        .details-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 16px;
          font-size: 12px;
        }
        .details-info strong {
          color: #475569;
        }
        .photo-box {
          width: 100px;
          height: 120px;
          border: 1.5px dashed #94A3B8;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: #94A3B8;
          background: #F8FAFC;
          justify-self: end;
        }
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 12px;
        }
        .schedule-table th, .schedule-table td {
          border: 1px solid #CBD5E1;
          padding: 8px 10px;
        }
        .schedule-table th {
          background: #F1F5F9;
          font-weight: 700;
          text-align: left;
        }
        .signature-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 20px;
        }
        .sig-block {
          text-align: center;
          width: 180px;
        }
        .sig-line {
          border-top: 1px solid #0F172A;
          margin-bottom: 6px;
        }
      `}</style>

      <div style={{ padding: '20px 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn btn-outline"
            style={{ fontWeight: '700', fontSize: '13px' }}
          >
            <i className="fa-solid fa-arrow-left me-1"></i> Back
          </button>
          {ticket.studentName && (
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-primary"
              style={{ fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-print"></i> Print Official Hall Ticket
            </button>
          )}
        </div>

        {!ticket.studentName ? (
          <div style={{ background: '#fff', padding: '48px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', maxWidth: '580px', margin: '40px auto', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <i className="fa-solid fa-id-card" style={{ fontSize: '44px', color: '#94a3b8', marginBottom: '16px', display: 'block' }}></i>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>No Candidate Selected</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '22px', lineHeight: '1.5' }}>
              Please select a specific candidate from the Hall Tickets register or Student Roster to generate an official examination hall ticket.
            </p>
            <Link to="/unilms/org/examinations/hall-tickets" className="btn btn-primary" style={{ padding: '9px 20px', fontWeight: '700', textDecoration: 'none', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-list-check"></i> Open Hall Tickets Register
            </Link>
          </div>
        ) : (
        <div className="ticket-container">
          <div className="ticket-header">
            <h1>{ticket.orgName}</h1>
            <h2>OFFICIAL EXAMINATION HALL TICKET</h2>
            <p>{ticket.examName}</p>
          </div>

          <div className="details-grid">
            <div className="details-info">
              <div>
                <strong>HT Number:</strong>
                <div>{ticket.hallTicketNumber}</div>
              </div>
              <div>
                <strong>Roll Number:</strong>
                <div>{ticket.rollNumber}</div>
              </div>
              <div>
                <strong>Candidate Name:</strong>
                <div style={{ fontWeight: '700' }}>{ticket.studentName}</div>
              </div>
              <div>
                <strong>Issue Date:</strong>
                <div>{ticket.issueDate}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Academic Program:</strong>
                <div>{ticket.programName} ({ticket.semesterName})</div>
              </div>
            </div>

            <div className="photo-box">
              <i className="fa-solid fa-user" style={{ fontSize: '28px', color: '#CBD5E1' }}></i>
            </div>
          </div>

          <h3 style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 10px', textTransform: 'uppercase' }}>
            Confirmed Examination Schedule
          </h3>
          <table className="schedule-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Date</th>
                <th style={{ width: '160px' }}>Time</th>
                <th style={{ width: '100px' }}>Course Code</th>
                <th>Subject Course Title</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Invigilator Sign</th>
              </tr>
            </thead>
            <tbody>
              {ticket.schedule.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: '#64748B' }}>
                    No examination timetable schedules configured yet for this cycle.
                  </td>
                </tr>
              ) : (
                ticket.schedule.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item.date}</strong></td>
                    <td>{item.startTime} - {item.endTime}</td>
                    <td><span style={{ fontWeight: '700', color: '#4F46E5' }}>{item.subjectCode}</span></td>
                    <td>{item.subjectName}</td>
                    <td></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '6px', fontSize: '11px', color: '#475569', marginBottom: '20px' }}>
            <strong>Important Instructions for Candidate:</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
              <li>Candidate must produce this Hall Ticket along with an institutional Photo Identity Card.</li>
              <li>Candidates must occupy allotted examination desks 15 minutes prior to commencement.</li>
              <li>Electronic gadgets, smartwatches, and unauthorized materials are strictly prohibited.</li>
            </ul>
          </div>

          <div className="signature-footer">
            <div className="sig-block">
              <div className="sig-line"></div>
              <div style={{ fontSize: '11px', fontWeight: '700' }}>Candidate's Signature</div>
            </div>
            <div className="sig-block">
              <div className="sig-line"></div>
              <div style={{ fontSize: '11px', fontWeight: '700' }}>Controller of Examinations</div>
            </div>
          </div>
        </div>
        )}
      </div>
    </>
  );
};

export default OrgExaminationsPrintHallTicket;
