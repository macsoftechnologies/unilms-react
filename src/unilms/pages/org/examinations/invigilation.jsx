import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';
import examinationsService from '../../../services/examinations.service';
import staffService from '../../../services/staff.service';
import apiClient from '../../../services/api';

const OrgExaminationsInvigilation = () => {
  // Master Data
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [exams, setExams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [liveFaculty, setLiveFaculty] = useState([]);
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // 4-Tier Cascading Filter Bar State
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState('ALL');
  const [selectedExamId, setSelectedExamId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formScheduleId, setFormScheduleId] = useState('');
  const [formInvigilatorName, setFormInvigilatorName] = useState('');
  const [formInvigilatorRole, setFormInvigilatorRole] = useState('Assistant Professor');
  const [formHall, setFormHall] = useState('Hall 101 (Block A)');
  const [formSessions, setFormSessions] = useState(1);
  const [formRate, setFormRate] = useState(750);
  const [formPaid, setFormPaid] = useState(false);

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, progRes, examRes, schRes, staffRes, dutiesRes] = await Promise.all([
        academicsService.getDepartments(),
        academicsService.getPrograms(),
        examinationsService.getExams(),
        examinationsService.getSchedules(),
        staffService.getStaff(),
        apiClient.get('/tenants/settings/exam_invigilation').catch(() => null)
      ]);

      const depts = Array.isArray(deptRes) ? deptRes : (deptRes?.data || []);
      const progs = Array.isArray(progRes) ? progRes : (progRes?.data || []);
      const exms = Array.isArray(examRes) ? examRes : (examRes?.data || []);
      const schs = Array.isArray(schRes) ? schRes : (schRes?.data || []);
      const staffList = Array.isArray(staffRes) ? staffRes : (staffRes?.data || []);

      setDepartments(depts);
      setPrograms(progs);
      setExams(exms);
      setSchedules(schs);
      setLiveFaculty(staffList);

      if (staffList.length > 0 && !formInvigilatorName) {
        const first = staffList[0];
        setFormInvigilatorName(`${first.firstName || ''} ${first.lastName || ''}`.trim() || 'Faculty Member');
        setFormInvigilatorRole(first.designation || 'Assistant Professor');
      }

      if (schs.length > 0 && !formScheduleId) {
        setFormScheduleId(schs[0].id);
        setFormHall(schs[0].hallRoomNo || schs[0].venue || 'Hall 101');
      }

      // Load saved duties from PostgreSQL
      if (dutiesRes?.data && Array.isArray(dutiesRes.data) && dutiesRes.data.length > 0) {
        setDuties(dutiesRes.data);
        return;
      }

      // Initial baseline duties using real faculty and real schedules
      const baseline = (schs.length > 0 ? schs : [1, 2, 3]).map((s, idx) => {
        const staff = staffList.length > 0 ? staffList[idx % staffList.length] : null;
        const staffName = staff ? `${staff.firstName || ''} ${staff.lastName || ''}`.trim() : `Faculty Invigilator ${idx + 1}`;
        const staffRole = staff?.designation || 'Assistant Professor';
        const staffDept = staff?.department?.name || 'Academic Faculty';
        const subName = s?.subject?.name || (idx === 0 ? 'Cloud Architecture' : idx === 1 ? 'Data Structures' : 'Database Systems');
        const venue = s?.hallRoomNo || s?.venue || `Hall ${101 + idx} (Block A)`;
        const dateStr = s?.date ? new Date(s.date).toLocaleDateString() : `2026-12-${10 + idx}`;

        return {
          id: `duty-${idx + 1}`,
          exam_schedule_id: s?.id || `sch-${idx}`,
          exam_name: subName,
          exam_date: dateStr,
          hall: venue,
          invigilator_name: staffName,
          invigilator_role: staffRole,
          invigilator_dept: staffDept,
          sessions: 2,
          charge_per_session: 750,
          total_charge: 1500,
          paid: idx % 2 === 0
        };
      });

      setDuties(baseline);
      apiClient.post('/tenants/settings/exam_invigilation', baseline).catch(console.error);
    } catch (err) {
      console.error('Failed to load invigilation data:', err);
      showToast('Error loading timetable duties', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const persistDuties = async (updated) => {
    setDuties(updated);
    try {
      await apiClient.post('/tenants/settings/exam_invigilation', updated);
    } catch (err) {
      console.error('Failed to persist exam invigilation to PostgreSQL:', err);
    }
  };

  // Cascading filters
  const availablePrograms = selectedDeptId === 'ALL'
    ? programs
    : programs.filter(p => p.departmentId === selectedDeptId || p.department_id === selectedDeptId);

  const filteredDuties = duties.filter(d => {
    if (statusFilter === 'PAID' && !d.paid) return false;
    if (statusFilter === 'UNPAID' && d.paid) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const stName = (d.invigilator_name || '').toLowerCase();
      const examName = (d.exam_name || '').toLowerCase();
      const hall = (d.hall || '').toLowerCase();
      return stName.includes(q) || examName.includes(q) || hall.includes(q);
    }
    return true;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedDuties,
    totalItems
  } = useTablePagination(filteredDuties, 10);

  const handleCreateDuty = (e) => {
    e.preventDefault();
    if (!formInvigilatorName.trim()) {
      showToast('Please enter faculty member name.', 'danger');
      return;
    }

    const sch = schedules.find(s => s.id === formScheduleId);
    const subTitle = sch?.subject?.name || 'Examination Session';
    const dateStr = sch?.date ? new Date(sch.date).toLocaleDateString() : '2026-12-15';

    const newDuty = {
      id: `duty-${Date.now()}`,
      exam_schedule_id: formScheduleId,
      exam_name: subTitle,
      exam_date: dateStr,
      hall: formHall,
      invigilator_name: formInvigilatorName,
      invigilator_role: formInvigilatorRole,
      sessions: Number(formSessions),
      charge_per_session: Number(formRate),
      total_charge: Number(formSessions) * Number(formRate),
      paid: formPaid,
    };

    persistDuties([newDuty, ...duties]);
    showToast(`Assigned invigilation duty to ${formInvigilatorName}!`);
    setIsModalOpen(false);
    setFormInvigilatorName('');
  };

  const handleTogglePayment = (id) => {
    const updated = duties.map(d => d.id === id ? { ...d, paid: !d.paid } : d);
    persistDuties(updated);
    showToast('Invigilation honorarium status updated.');
  };

  const handleDeleteDuty = (id, name) => {
    if (!window.confirm(`Remove invigilation allocation for ${name}?`)) return;
    const updated = duties.filter(d => d.id !== id);
    persistDuties(updated);
    showToast('Duty allocation removed.');
  };

  // KPIs
  const totalAllocations = duties.length;
  const totalPaid = duties.filter(d => d.paid).reduce((acc, d) => acc + (d.total_charge || 0), 0);
  const totalPending = duties.filter(d => !d.paid).reduce((acc, d) => acc + (d.total_charge || 0), 0);

  return (
    <>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          background: toastMsg.type === 'danger' ? '#EF4444' : '#10B981',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          fontWeight: '600',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className={toastMsg.type === 'danger' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'}></i>
          {toastMsg.text}
        </div>
      )}

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
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
            }}
          >
            <i className="fa-solid fa-user-shield"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Invigilation Rosters &amp; Squad Allocations
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Assign faculty examiners to exam halls, track sessions &amp; disburse invigilation honorarium &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/unilms/org/examinations/schedules"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none' }}
          >
            <i className="fa-regular fa-calendar-days"></i>
            <span>Schedules</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)' }}
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>Assign Invigilator</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Allocations</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{totalAllocations}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-users-gear"></i>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase' }}>Honorarium Disbursed</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#16A34A', marginTop: '4px' }}>₹{totalPaid.toLocaleString()}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#D97706', textTransform: 'uppercase' }}>Pending Remittance</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>₹{totalPending.toLocaleString()}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-clock"></i>
          </div>
        </div>
      </div>

      {/* 4-Tier Cascading Filter Bar */}
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
          <i className="fa-solid fa-filter" style={{ color: '#16A34A', fontSize: '13px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Invigilation Duty Filter Bar
          </span>
          <span style={{ fontSize: '11px', color: '#64748B', marginLeft: 'auto' }}>
            Showing <strong>{filteredDuties.length}</strong> duty records
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'center' }}>
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
              <option value="ALL">All Degree Programs</option>
              {availablePrograms.map(p => (
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
                <option key={e.id} value={e.id}>{e.title || e.name}</option>
              ))}
            </select>
          </div>

          {/* Honorarium Status */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>HONORARIUM REMITTANCE</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '600', background: '#fff' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Disbursed (Paid)</option>
              <option value="UNPAID">Pending Remittance</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>SEARCH EXAMINER / HALL</label>
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '12px' }}></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Faculty name or hall..."
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)' }}>
        <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Invigilating Examiner</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Subject Course</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Examination Hall</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Date &amp; Sessions</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Remuneration</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Honorarium Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={5} />
              ) : paginatedDuties.length > 0 ? (
                paginatedDuties.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                        {d.invigilator_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {d.invigilator_role} {d.invigilator_dept ? `• ${d.invigilator_dept}` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#4338CA' }}>
                      {d.exam_name}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#334155' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px' }}>
                        <i className="fa-solid fa-location-dot" style={{ color: '#64748B', fontSize: '10px' }}></i>
                        <span>{d.hall}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                      <div>{d.exam_date}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{d.sessions} Session(s)</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                      ₹{d.total_charge?.toLocaleString()}
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '400', marginLeft: '4px' }}>
                        (@ ₹{d.charge_per_session})
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleTogglePayment(d.id)}
                        style={{
                          background: d.paid ? '#DCFCE7' : '#FEF3C7',
                          color: d.paid ? '#16A34A' : '#D97706',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                        title="Click to toggle payment state"
                      >
                        {d.paid ? '✓ DISBURSED' : '⏱ PENDING'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteDuty(d.id, d.invigilator_name)}
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', color: '#DC2626', borderColor: '#FECACA' }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No invigilation duties match filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="duties"
          />
        </div>
      </div>

      {/* Assign Invigilator Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                Allocate Invigilation Duty
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94A3B8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDuty} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Target Scheduled Slot *</label>
                <select
                  value={formScheduleId}
                  onChange={(e) => {
                    setFormScheduleId(e.target.value);
                    const sch = schedules.find(s => s.id === e.target.value);
                    if (sch) setFormHall(sch.hallRoomNo || sch.venue || 'Hall 101');
                  }}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#fff' }}
                >
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.subject?.name || 'Subject'} &bull; {s.date ? new Date(s.date).toLocaleDateString() : 'TBD'} ({s.hallRoomNo || s.venue || 'Hall'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Examiner / Faculty Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={formInvigilatorName}
                  onChange={(e) => setFormInvigilatorName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Designation / Rank</label>
                  <select
                    value={formInvigilatorRole}
                    onChange={(e) => setFormInvigilatorRole(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Senior Lecturer">Senior Lecturer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Hall / Venue</label>
                  <input
                    type="text"
                    required
                    value={formHall}
                    onChange={(e) => setFormHall(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Sessions Allocated</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formSessions}
                    onChange={(e) => setFormSessions(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Honorarium / Session (₹)</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '9px 16px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '9px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', border: 'none', fontWeight: '700' }}
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgExaminationsInvigilation;
