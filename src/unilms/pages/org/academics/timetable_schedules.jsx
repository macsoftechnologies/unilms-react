import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';

const initialSchedules = [
  {
    id: 1,
    cohort_name: 'B.Tech CSE (Batch 2023 - 2027)',
    semester_name: 'Semester 6',
    template_name: 'Standard B.Tech Engineering Timetable',
    status: 'Published'
  },
  {
    id: 2,
    cohort_name: 'B.Tech AIML (Batch 2024 - 2028)',
    semester_name: 'Semester 4',
    template_name: 'Standard B.Tech Engineering Timetable',
    status: 'Published'
  },
  {
    id: 3,
    cohort_name: 'B.Tech ECE (Batch 2023 - 2027)',
    semester_name: 'Semester 6',
    template_name: 'Standard B.Tech Engineering Timetable',
    status: 'Draft'
  },
  {
    id: 4,
    cohort_name: 'MBA Executive (Batch 2025 - 2027)',
    semester_name: 'Semester 2',
    template_name: 'Executive Trimester Matrix',
    status: 'Published'
  },
  {
    id: 5,
    cohort_name: 'B.Tech Mechanical (Batch 2023 - 2027)',
    semester_name: 'Semester 6',
    template_name: 'Standard Engineering Matrix',
    status: 'Draft'
  }
];

const OrgAcademicsTimetableSchedules = () => {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState('B.Tech CSE (Batch 2023 - 2027)');
  const [selectedSemester, setSelectedSemester] = useState('Semester 6');
  const [selectedTemplate, setSelectedTemplate] = useState('Standard B.Tech Engineering Timetable');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const newSchedule = {
      id: Date.now(),
      cohort_name: selectedCohort,
      semester_name: selectedSemester,
      template_name: selectedTemplate,
      status: 'Draft'
    };
    setSchedules([newSchedule, ...schedules]);
    setIsModalOpen(false);
    showToast(`Schedule created for ${selectedCohort}!`);
  };

  const handleTogglePublish = (id) => {
    setSchedules(schedules.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'Published' ? 'Draft' : 'Published';
        showToast(`Schedule is now ${nextStatus}.`);
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(schedules, 5);

  return (
    <>
      {toastMsg && (
        <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
          <i className="fa-solid fa-circle-check"></i>
          {toastMsg}
        </div>
      )}

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
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
              }}
            >
              <i className="fa-solid fa-calendar-days"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Cohort Schedules &amp; Batches
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Manage term timetable assignments for student cohorts and class sections &bull; AY 2026&ndash;2027
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setIsModalOpen(true)} 
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#fff', border: 'none', padding: '10px 18px', fontWeight: '700', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)', whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-calendar-plus"></i>
              <span>Create Schedule</span>
            </button>
            <Link to="/unilms/org/academics/dashboard" className="btn btn-outline" style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <i className="fa-solid fa-arrow-left" style={{ color: '#2563EB' }}></i>
              <span>Academics Hub</span>
            </Link>
          </div>
        </div>

        {/* Table Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Cohort</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Semester</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Template</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={5} rows={pageSize || 5} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No schedules created yet. Create a schedule to link a cohort with a template.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {s.cohort_name}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {s.semester_name}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: '600', color: '#7C3AED' }}>
                        {s.template_name}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {s.status === 'Published' ? (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
                            Published
                          </span>
                        ) : (
                          <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
                            Draft
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <Link 
                            to="/unilms/org/timetable/builder" 
                            className="btn btn-outline" 
                            style={{ padding: '5px 12px', fontSize: '12px', textDecoration: 'none', borderRadius: '6px', color: '#2563EB', borderColor: 'rgba(37, 99, 235, 0.3)' }}
                          >
                            <i className="fa-solid fa-table-cells me-1"></i> Builder
                          </Link>
                          <button 
                            type="button" 
                            onClick={() => handleTogglePublish(s.id)}
                            className="btn btn-primary" 
                            style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px', background: s.status === 'Published' ? '#F59E0B' : '#10B981', border: 'none', color: '#fff', cursor: 'pointer' }}
                          >
                            {s.status === 'Published' ? 'Unpublish' : 'Publish'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
            itemName="cohort schedules"
          />
        </div>

        {/* Modal Drawer */}
        <div 
          className={`drawer-overlay ${isModalOpen ? 'active' : ''}`}
          onClick={(e) => {
            if (e.target.classList.contains('drawer-overlay')) setIsModalOpen(false);
          }}
        >
          <div className="drawer-content" style={{ maxWidth: '480px' }}>
            <form onSubmit={handleCreate}>
              <div className="drawer-header" style={{ background: '#2563EB', color: '#fff', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#fff' }}>Create Schedule for Cohort</h3>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} style={{ color: '#fff', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="drawer-body" style={{ padding: '22px' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Cohort</label>
                  <select 
                    value={selectedCohort} 
                    onChange={(e) => setSelectedCohort(e.target.value)} 
                    className="form-control" 
                    required
                    style={{ width: '100%', height: '40px', borderRadius: '8px' }}
                  >
                    <option value="B.Tech CSE (Batch 2023 - 2027)">B.Tech CSE (Batch 2023 - 2027)</option>
                    <option value="B.Tech AIML (Batch 2024 - 2028)">B.Tech AIML (Batch 2024 - 2028)</option>
                    <option value="B.Tech ECE (Batch 2023 - 2027)">B.Tech ECE (Batch 2023 - 2027)</option>
                    <option value="MBA Executive (Batch 2025 - 2027)">MBA Executive (Batch 2025 - 2027)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Semester</label>
                  <select 
                    value={selectedSemester} 
                    onChange={(e) => setSelectedSemester(e.target.value)} 
                    className="form-control"
                    style={{ width: '100%', height: '40px', borderRadius: '8px' }}
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Timetable Template</label>
                  <select 
                    value={selectedTemplate} 
                    onChange={(e) => setSelectedTemplate(e.target.value)} 
                    className="form-control" 
                    required
                    style={{ width: '100%', height: '40px', borderRadius: '8px' }}
                  >
                    <option value="Standard B.Tech Engineering Timetable">Standard B.Tech Engineering Timetable</option>
                    <option value="Executive Trimester Matrix">Executive Trimester Matrix</option>
                    <option value="Laboratory & Hands-on Schedule">Laboratory &amp; Hands-on Schedule</option>
                  </select>
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>The template defines the daily time slots.</small>
                </div>
              </div>
              <div className="drawer-footer" style={{ padding: '16px 22px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#2563EB', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Create Schedule</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default OrgAcademicsTimetableSchedules;
