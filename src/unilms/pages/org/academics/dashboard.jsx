import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';

const OrgAcademicsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [hierarchyData, setHierarchyData] = useState([]);
  const [stats, setStats] = useState({
    totalDepts: 0,
    totalPrograms: 0,
    totalCohorts: 0,
    totalSubjects: 0,
  });

  const loadAcademicsData = async () => {
    setLoading(true);
    try {
      const [depts, progs, cohorts, subjects] = await Promise.all([
        academicsService.getDepartments().catch(() => []),
        academicsService.getPrograms().catch(() => []),
        academicsService.getCohorts().catch(() => []),
        academicsService.getSubjects().catch(() => []),
      ]);

      const deptList = Array.isArray(depts) ? depts : [];
      const progList = Array.isArray(progs) ? progs : [];
      const cohortList = Array.isArray(cohorts) ? cohorts : [];
      const subjectList = Array.isArray(subjects) ? subjects : [];

      setStats({
        totalDepts: deptList.length,
        totalPrograms: progList.length,
        totalCohorts: cohortList.length,
        totalSubjects: subjectList.length,
      });

      // Map live degree programs to hierarchy rows
      const mappedHierarchy = progList.map(p => ({
        id: p.id,
        deptCode: p.department?.code || (p.departmentId ? 'DEPT' : '—'),
        deptName: p.department?.name || 'Department Attached',
        program: `${p.name} (${p.code}) • ${p.durationYears || 4} Years`,
        type: p.type || 'UG',
        batch: cohortList.find(c => c.programId === p.id)?.name || 'Admissions Ready',
        subjects: `${subjectList.filter(s => s.programId === p.id).length} Subjects Mapped`,
        status: p.status || 'Active'
      }));

      setHierarchyData(mappedHierarchy);
    } catch (e) {
      console.warn('Could not load academic stats:', e);
      setStats({ totalDepts: 0, totalPrograms: 0, totalCohorts: 0, totalSubjects: 0 });
      setHierarchyData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcademicsData();
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedHierarchy,
    totalItems
  } = useTablePagination(hierarchyData, 10);

  return (
    <>
      <section className="view-section active">
        {/* Sleek High-Density Header Toolbar */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
              }}
            >
              <i className="fa-solid fa-building-columns"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                Academics Command Center
              </h2>
              <p style={{ margin: '1px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '11.5px' }}>
                Multi-Disciplinary Governance (Pharmacy, Degree, PG, Engineering)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              to="/unilms/org/academics/student_analysis"
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '7px',
                fontWeight: '700',
                fontSize: '11.5px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="fa-solid fa-chart-user"></i>
              <span>Student 360° Analysis</span>
            </Link>
            <Link
              to="/unilms/org/academics/departments"
              className="btn btn-outline"
              style={{
                background: 'var(--card-bg, #fff)',
                padding: '6px 12px',
                borderRadius: '7px',
                fontWeight: '600',
                fontSize: '11.5px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="fa-solid fa-plus" style={{ color: '#0284C7' }}></i>
              <span>Add Department</span>
            </Link>
            <Link
              to="/unilms/org/academics/programs"
              className="btn btn-outline"
              style={{
                background: 'var(--card-bg, #fff)',
                padding: '6px 12px',
                borderRadius: '7px',
                fontWeight: '600',
                fontSize: '11.5px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="fa-solid fa-graduation-cap" style={{ color: '#0284C7' }}></i>
              <span>Programs</span>
            </Link>
          </div>
        </div>

        {/* Compact KPI Stat Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '8px',
            marginBottom: '10px',
          }}
        >
          <Link
            to="/unilms/org/academics/departments"
            style={{ textDecoration: 'none', color: 'inherit' }}
            title="View Departments"
          >
            <div
              className="card"
              style={{
                padding: '8px 12px',
                borderLeft: '3.5px solid var(--primary, #4F46E5)',
                borderTop: '1px solid var(--border-color, #E2E8F0)',
                borderRight: '1px solid var(--border-color, #E2E8F0)',
                borderBottom: '1px solid var(--border-color, #E2E8F0)',
                borderRadius: '8px',
                background: 'var(--surface, #FFFFFF)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                height: '100%',
              }}
            >
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                Departments
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '2px', lineHeight: '1.2' }}>
                {stats.totalDepts} <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Active</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
                Pharmacy, Engineering &amp; Sciences
              </div>
            </div>
          </Link>

          <Link
            to="/unilms/org/academics/programs"
            style={{ textDecoration: 'none', color: 'inherit' }}
            title="View Programs"
          >
            <div
              className="card"
              style={{
                padding: '8px 12px',
                borderLeft: '3.5px solid var(--success, #10B981)',
                borderTop: '1px solid var(--border-color, #E2E8F0)',
                borderRight: '1px solid var(--border-color, #E2E8F0)',
                borderBottom: '1px solid var(--border-color, #E2E8F0)',
                borderRadius: '8px',
                background: 'var(--surface, #FFFFFF)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                height: '100%',
              }}
            >
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                Degree Programs
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
                {stats.totalPrograms} Programs
              </div>
              <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
                <i className="fa-solid fa-graduation-cap me-1"></i> UG, PG &amp; Professional
              </div>
            </div>
          </Link>

          <Link
            to="/unilms/org/academics/cohorts"
            style={{ textDecoration: 'none', color: 'inherit' }}
            title="View Active Cohorts"
          >
            <div
              className="card"
              style={{
                padding: '8px 12px',
                borderLeft: '3.5px solid #06B6D4',
                borderTop: '1px solid var(--border-color, #E2E8F0)',
                borderRight: '1px solid var(--border-color, #E2E8F0)',
                borderBottom: '1px solid var(--border-color, #E2E8F0)',
                borderRadius: '8px',
                background: 'var(--surface, #FFFFFF)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                height: '100%',
              }}
            >
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                Active Batches
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
                {stats.totalCohorts} <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Batches</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
                Academic Terms Configured
              </div>
            </div>
          </Link>

          <Link
            to="/unilms/org/academics/subjects"
            style={{ textDecoration: 'none', color: 'inherit' }}
            title="View Subjects & Curriculum"
          >
            <div
              className="card"
              style={{
                padding: '8px 12px',
                borderLeft: '3.5px solid var(--warning, #F59E0B)',
                borderTop: '1px solid var(--border-color, #E2E8F0)',
                borderRight: '1px solid var(--border-color, #E2E8F0)',
                borderBottom: '1px solid var(--border-color, #E2E8F0)',
                borderRadius: '8px',
                background: 'var(--surface, #FFFFFF)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                height: '100%',
              }}
            >
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                Curriculum Courses
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
                {stats.totalSubjects} Courses
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
                Syllabi &amp; Credits Mapped
              </div>
            </div>
          </Link>
        </div>

        {/* Compact Setup Sequence Breadcrumb Strip */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '7px 14px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '11.5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: 'var(--text-primary)' }}>
            <i className="fa-solid fa-diagram-project" style={{ color: '#0284C7' }}></i>
            <span>Setup Flow:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px' }}>
            <Link to="/unilms/org/academics/departments" style={{ textDecoration: 'none', color: '#2563EB', fontWeight: '600' }}>1. Departments</Link>
            <span style={{ color: '#94a3b8' }}>&rarr;</span>
            <Link to="/unilms/org/academics/programs" style={{ textDecoration: 'none', color: '#7C3AED', fontWeight: '600' }}>2. Programs</Link>
            <span style={{ color: '#94a3b8' }}>&rarr;</span>
            <Link to="/unilms/org/academics/regulations" style={{ textDecoration: 'none', color: '#059669', fontWeight: '600' }}>3. Regulations</Link>
            <span style={{ color: '#94a3b8' }}>&rarr;</span>
            <Link to="/unilms/org/academics/academic_years" style={{ textDecoration: 'none', color: '#0891B2', fontWeight: '600' }}>4. Academic Years</Link>
            <span style={{ color: '#94a3b8' }}>&rarr;</span>
            <Link to="/unilms/org/academics/sections" style={{ textDecoration: 'none', color: '#D97706', fontWeight: '600' }}>5. Class Sections</Link>
            <span style={{ color: '#94a3b8' }}>&rarr;</span>
            <Link to="/unilms/org/academics/subjects" style={{ textDecoration: 'none', color: '#4F46E5', fontWeight: '600' }}>6. Subjects &amp; Allocations</Link>
          </div>
        </div>

        {/* Dashboard Widgets */}
        <div className="dashboard-widgets">
          <div className="widget" style={{ padding: '12px 16px', borderRadius: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
                <i className="fa-solid fa-sitemap me-2" style={{ color: 'var(--primary)' }}></i>
                Academic Hierarchy Overview
              </h2>
              <Link
                to="/unilms/org/academics/programs"
                style={{
                  fontSize: '12px',
                  color: 'var(--primary)',
                  fontWeight: '600',
                  textDecoration: 'none',
                }}
              >
                View Details <i className="fa-solid fa-arrow-right ms-1"></i>
              </Link>
            </div>

            <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
<table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Degree Program</th>
                  <th>Current Intake Batch</th>
                  <th>Subjects</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={5} rows={pageSize || 5} />
                ) : paginatedHierarchy.length > 0 ? (
                  paginatedHierarchy.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="badge badge-primary me-2">{item.deptCode}</span>
                        <strong>{item.deptName}</strong>
                      </td>
                      <td>{item.program}</td>
                      <td>{item.batch}</td>
                      <td>
                        <span className="badge badge-info">{item.subjects}</span>
                      </td>
                      <td>
                        <span className="badge badge-success">{item.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                      <div style={{ marginBottom: '8px', fontSize: '26px', color: '#94A3B8' }}><i className="fa-solid fa-building-columns"></i></div>
                      <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>Clean Academic Canvas</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        No departments or degree programs configured in the database yet.
                      </div>
                      <Link to="/unilms/org/academics/departments" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '11.5px', borderRadius: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-plus"></i> Add First Department
                      </Link>
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
              itemName="programs"
            />
</div>
          </div>
        </div>
      </section>
    </>
  );
};

export default OrgAcademicsDashboard;