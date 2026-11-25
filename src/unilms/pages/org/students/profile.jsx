import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import studentsService from '../../../services/students.service';

const OrgStudentsProfile = () => {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('id');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        let data = null;
        if (studentId) {
          data = await studentsService.getStudentById(studentId);
        } else {
          const list = await studentsService.getStudents();
          if (Array.isArray(list) && list.length > 0) {
            data = await studentsService.getStudentById(list[0].id);
          }
        }

        if (data) {
          setStudent({
            id: data.id,
            roll_number: data.rollNumber || data.roll_number,
            first_name: data.firstName || data.first_name,
            last_name: data.lastName || data.last_name || '',
            program_id: data.programId,
            program_name: data.program?.name || data.programName || 'Undergraduate Degree',
            cohort_name: data.cohort?.name || data.cohortName || 'Class of 2027',
            email: data.email || '—',
            phone: data.phone || '—',
            parent_name: data.parentName || data.parent_name || '—',
            parent_phone: data.parentPhone || data.parent_phone || '—',
            mother_name: '—',
            blood_group: data.bloodGroup || '—',
            aadhar_number: '—',
            dob: data.dob ? data.dob.split('T')[0] : '—',
            gender: data.gender || '—',
            address: data.address || '—',
            city: '—',
            state: '—',
            pincode: '—',
            status: data.status || 'Active'
          });
        } else {
          setStudent(null);
        }
      } catch (err) {
        console.error('Fetch student profile error:', err);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [studentId]);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '14px', color: '#7c3aed' }}></i>
        <p>Loading 360-degree student record...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', background: 'var(--card-bg, #fff)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <i className="fa-solid fa-user-graduate" style={{ fontSize: '42px', opacity: 0.3, marginBottom: '16px', display: 'block' }}></i>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800' }}>No Student Record Found</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
          No student found for this identifier. Enroll a student first in the Student Directory.
        </p>
        <Link to="/unilms/org/students" className="btn btn-primary" style={{ textDecoration: 'none', padding: '10px 22px', borderRadius: '8px', background: '#7C3AED', color: '#fff', fontWeight: '700' }}>
          Go to Student Directory
        </Link>
      </div>
    );
  }

  return (
    <section className="view-section active">
      {/* Student Profile Banner */}
      <div style={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '26px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '18px' }}>
          <div style={{ display: 'flex', gap: '22px', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', boxShadow: '0 6px 16px rgba(124, 58, 237, 0.3)' }}>
              {student.first_name?.[0]}{student.last_name?.[0]}
            </div>
            <div>
              <h2 style={{ margin: '0', fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {student.first_name} {student.last_name}
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px' }}>
                  {student.status || 'Active'}
                </span>
              </h2>
              <div style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '13.5px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <span><i className="fa-solid fa-id-badge me-1" style={{ color: '#7c3aed' }}></i> Roll: <strong>{student.roll_number}</strong></span>
                <span><i className="fa-solid fa-graduation-cap me-1" style={{ color: '#7c3aed' }}></i> {student.program_name}</span>
                <span><i className="fa-solid fa-users-rectangle me-1" style={{ color: '#7c3aed' }}></i> Cohort: <strong>{student.cohort_name}</strong></span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link 
              to={`/unilms/org/students/create_edit?id=${student.id}`} 
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: '10px', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }}
            >
              <i className="fa-solid fa-pen"></i> Edit Profile
            </Link>
            <Link 
              to="/unilms/org/students" 
              className="btn btn-outline"
              style={{ padding: '9px 18px', borderRadius: '10px', fontWeight: '600', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-arrow-left"></i> Back
            </Link>
          </div>
        </div>

        {/* 360 Metric Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px', paddingTop: '22px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Attendance Rate</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: student.attendance_pct ? '#4f46e5' : '#94a3b8', marginTop: '4px' }}>
              {student.attendance_pct ? `${student.attendance_pct}%` : '—'}
            </div>
            <div style={{ fontSize: '12px', color: student.attendance_pct ? '#059669' : 'var(--text-muted)', marginTop: '2px', fontWeight: '600' }}>
              {student.attendance_summary || 'No Attendance Records'}
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Cumulative GPA</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: student.cgpa ? '#059669' : '#94a3b8', marginTop: '4px' }}>
              {student.cgpa ? `${student.cgpa} / 10` : '—'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {student.total_credits ? `Total ${student.total_credits} Earned Credits` : 'Awaiting Grading'}
            </div>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Active Backlogs</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: (Number(student.backlogs_count) || 0) > 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
              {student.backlogs_count !== undefined ? student.backlogs_count : 0}
            </div>
            <div style={{ fontSize: '12px', color: (Number(student.backlogs_count) || 0) > 0 ? '#ef4444' : '#059669', marginTop: '2px', fontWeight: '600' }}>
              {(Number(student.backlogs_count) || 0) > 0 ? 'Remedial coursework required' : 'All registered courses cleared'}
            </div>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Fee Balance Due</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
              {student.fee_balance !== undefined ? `₹${Number(student.fee_balance).toLocaleString('en-IN')}` : '₹0.00'}
            </div>
            <div style={{ fontSize: '12px', color: (Number(student.fee_balance) || 0) > 0 ? '#d97706' : '#059669', marginTop: '2px', fontWeight: '600' }}>
              {(Number(student.fee_balance) || 0) > 0 ? 'Dues Outstanding' : 'All Term Fees Cleared'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '22px' }}>
        {[
          { key: 'overview', label: 'Biographical & Contacts', icon: 'fa-user' },
          { key: 'academics', label: 'Academic Courses & Grades', icon: 'fa-book' },
          { key: 'fees', label: 'Fee Transactions', icon: 'fa-receipt' },
          { key: 'guardian', label: 'Parent / Guardian Portal', icon: 'fa-people-roof' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13.5px',
              color: activeTab === tab.key ? '#7c3aed' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '3px solid #7c3aed' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '18px', color: '#7c3aed' }}>
              <i className="fa-solid fa-address-card me-2"></i> Personal Information
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Full Name:</span>
                <span style={{ fontWeight: '700' }}>{student.first_name} {student.last_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gender / DOB:</span>
                <span style={{ fontWeight: '600' }}>{student.gender || 'Male'} • {student.dob || '2005-06-14'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Blood Group:</span>
                <span style={{ fontWeight: '700', color: '#dc2626' }}>{student.blood_group || 'O+'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>National ID (Aadhaar):</span>
                <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{student.aadhar_number || '8745 2314 9081'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Primary Email:</span>
                <span style={{ fontWeight: '600', color: '#4f46e5' }}>{student.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mobile Number:</span>
                <span style={{ fontWeight: '600' }}>{student.phone}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '18px', color: '#7c3aed' }}>
              <i className="fa-solid fa-location-dot me-2"></i> Residential & Family Details
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Father / Guardian:</span>
                <span style={{ fontWeight: '700' }}>{student.parent_name || 'Ramesh Verma'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mother Name:</span>
                <span style={{ fontWeight: '700' }}>{student.mother_name || 'Meena Verma'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Parent Mobile:</span>
                <span style={{ fontWeight: '600' }}>{student.parent_phone || '+91 98765 00001'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Address:</span>
                <span style={{ fontWeight: '600', textAlign: 'right' }}>{student.address || 'Prestige Greenfields, Sector 4'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>City, State:</span>
                <span style={{ fontWeight: '600' }}>{student.city || 'Bengaluru'}, {student.state || 'Karnataka'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Postal Pincode:</span>
                <span style={{ fontWeight: '600' }}>{student.pincode || '560100'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Academics */}
      {activeTab === 'academics' && (
        <div className="card" style={{ padding: '24px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#7c3aed' }}>
            Enrolled Core Courses & Assessment Attainment
          </h4>
          <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
<table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Course Code</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Subject Title</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Credits</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Internal Marks</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Attendance</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(student.courses) && student.courses.length > 0 ? (
                student.courses.map((c, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#6366f1' }}>{c.code}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>{c.title}</td>
                    <td style={{ padding: '14px 16px' }}>{c.credits}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700' }}>{c.internalMarks || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#059669', fontWeight: '700' }}>{c.attendancePct ? `${c.attendancePct}%` : '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: '800' }}>{c.grade || '—'}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                    No enrolled course records found for this student.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
</div>
        </div>
      )}

      {/* Tab 3: Fees */}
      {activeTab === 'fees' && (
        <div className="card" style={{ padding: '24px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#7c3aed' }}>
            Fee Invoices & Payment Ledger
          </h4>
          <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
<table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Invoice No</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Term / Description</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Amount</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Payment Date</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Mode</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(student.invoices) && student.invoices.length > 0 ? (
                student.invoices.map((inv, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700' }}>{inv.invoice_number || inv.invoiceNumber}</td>
                    <td style={{ padding: '14px 16px' }}>{inv.description || 'Tuition & Academic Fees'}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700' }}>₹{Number(inv.amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px 16px' }}>{inv.payment_date || inv.paymentDate || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>{inv.payment_mode || inv.paymentMode || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{ background: inv.status === 'Paid' ? '#dcfce7' : '#fee2e2', color: inv.status === 'Paid' ? '#15803d' : '#dc2626', fontWeight: '800' }}>
                        {inv.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                    No fee invoices or transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
</div>
        </div>
      )}

      {/* Tab 4: Guardian */}
      {activeTab === 'guardian' && (
        <div className="card" style={{ padding: '24px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#7c3aed' }}>
            Parent Portal Credentials & Access Status
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '500px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Registered Guardian:</span>
              <span style={{ fontWeight: '700' }}>{student.parent_name || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Contact Mobile:</span>
              <span style={{ fontWeight: '600' }}>{student.parent_phone || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Portal Status:</span>
              <span className="badge" style={{ background: student.parent_phone ? '#dcfce7' : '#f1f5f9', color: student.parent_phone ? '#15803d' : '#64748b', fontWeight: '700' }}>
                {student.parent_phone ? 'Active & Synced' : 'Awaiting Guardian Setup'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>SMS Alerts:</span>
              <span style={{ fontWeight: '600', color: student.parent_phone ? '#059669' : '#64748b' }}>
                {student.parent_phone ? 'Enabled (Daily Attendance & Marks)' : 'Disabled (No Phone Registered)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default OrgStudentsProfile;