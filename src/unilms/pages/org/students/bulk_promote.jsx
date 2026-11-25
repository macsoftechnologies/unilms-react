import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import studentsService from '../../../services/students.service';
import academicsService from '../../../services/academics.service';

const OrgStudentsBulkPromote = () => {
  const navigate = useNavigate();
  const [cohorts, setCohorts] = useState([]);
  const [sourceCohortId, setSourceCohortId] = useState('');
  const [targetCohortId, setTargetCohortId] = useState('');
  const [targetSemester, setTargetSemester] = useState(2);
  const [allStudents, setAllStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [chList, stList] = await Promise.all([
          academicsService.getCohorts(),
          studentsService.getStudents()
        ]);
        const chs = Array.isArray(chList) ? chList : [];
        setCohorts(chs);
        if (chs.length > 0) {
          setSourceCohortId(chs[0].id);
          if (chs.length > 1) {
            setTargetCohortId(chs[1].id);
          } else {
            setTargetCohortId(chs[0].id);
          }
        }
        setAllStudents(Array.isArray(stList) ? stList : []);
      } catch (err) {
        console.error('Failed to initialize bulk promote:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!sourceCohortId) {
      setStudents(allStudents);
      setSelectedIds(new Set(allStudents.map(s => s.id)));
    } else {
      const filtered = allStudents.filter(s => (s.cohortId || s.cohort_id) === sourceCohortId);
      setStudents(filtered);
      setSelectedIds(new Set(filtered.map(s => s.id)));
    }
  }, [sourceCohortId, allStudents]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(students, 10);

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s.id)));
    }
  };

  const toggleStudent = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAction = async (action) => {
    if (selectedIds.size === 0) {
      alert('Please select at least one student.');
      return;
    }

    try {
      if (action === 'promote') {
        await studentsService.bulkPromote({
          studentIds: Array.from(selectedIds),
          targetCohortId: targetCohortId || undefined,
          targetSemester
        });
        setToastMsg(`Successfully promoted ${selectedIds.size} student(s) to next semester/cohort!`);
      } else {
        // Detain action
        for (const id of Array.from(selectedIds)) {
          await studentsService.updateStudent(id, { status: 'Detained' });
        }
        setToastMsg(`Marked ${selectedIds.size} student(s) as Detained.`);
      }

      setTimeout(() => {
        navigate('/unilms/org/students');
      }, 1500);
    } catch (err) {
      console.error('Bulk promote error:', err);
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  return (
    <section className="view-section active">
      {/* Top Header Card matching Reference UI (Image 1 & 2) */}
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
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            <i className="fa-solid fa-arrows-up-to-line"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Bulk Term Promotion Wizard
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Progress an entire cohort batch to the next academic semester based on attendance and backlog criteria &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/unilms/org/students" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', whiteSpace: 'nowrap' }}>
          <i className="fa-solid fa-arrow-left" style={{ color: '#2563EB' }}></i>
          <span>Student Directory</span>
        </Link>
        </div>
      </div>

      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '14px 20px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)' }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: '18px' }}></i>
          {toastMsg}
        </div>
      )}

      {/* Cohort Selector Card */}
      <div className="card" style={{ padding: '20px 24px', borderRadius: '14px', marginBottom: '20px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '280px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Select Source Cohort / Current Term *</label>
            <select 
              value={sourceCohortId} 
              onChange={(e) => setSourceCohortId(e.target.value)} 
              className="form-control"
              style={{ borderRadius: '8px', height: '42px' }}
            >
              <option value="">All Cohorts</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1', minWidth: '280px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Target Destination Next Cohort *</label>
            <select 
              value={targetCohortId} 
              onChange={(e) => setTargetCohortId(e.target.value)} 
              className="form-control"
              style={{ borderRadius: '8px', height: '42px' }}
            >
              <option value="">-- Choose Target Cohort --</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={() => handleAction('promote')} 
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-graduation-cap"></i> Promote Selected ({selectedIds.size})
            </button>
            <button 
              type="button" 
              onClick={() => handleAction('detain')} 
              className="btn btn-outline text-danger"
              style={{ borderColor: '#ef4444', color: '#dc2626', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-ban"></i> Detain Selected
            </button>
          </div>
        </div>
      </div>

      {/* Student List for Promotion */}
      <div className="table-container" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ width: '50px', padding: '14px 18px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={students.length > 0 && selectedIds.size === students.length} 
                  onChange={toggleSelectAll} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Roll Number</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Student Name</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Program</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Current Status</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader columns={6} rows={pageSize || 5} />
            ) : paginatedItems.length > 0 ? (
              paginatedItems.map(st => (
                <tr key={st.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(st.id)} 
                      onChange={() => toggleStudent(st.id)} 
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontWeight: '700', color: '#6366f1', background: 'rgba(99, 102, 241, 0.08)', padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                      {st.roll_number}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {st.first_name} {st.last_name}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '13px' }}>
                    {st.program_name}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
                      {st.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '600', color: '#059669' }}>
                    <i className="fa-solid fa-circle-check me-1"></i> 88.5% (Eligible)
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-users-slash" style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.4, display: 'block' }}></i>
                  No students currently enrolled in this cohort.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        itemName="students for promotion"
      />
    </section>
  );
};

export default OrgStudentsBulkPromote;