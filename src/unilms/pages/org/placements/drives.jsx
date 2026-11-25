import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import { getStoredDrives, saveStoredDrives, getStoredCompanies } from './placementsData';
import placementsService from '../../../services/placements.service';

const OrgPlacementsDrives = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const navigate = useNavigate();
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivesAndCompanies = async () => {
    setLoading(true);
    try {
      const [dbDrives, dbCompanies] = await Promise.all([
        placementsService.getDrives(),
        placementsService.getCompanies()
      ]);

      if (Array.isArray(dbCompanies) && dbCompanies.length > 0) {
        const normComps = dbCompanies.map(c => ({
          id: c.id,
          company_name: c.name || c.company_name,
          tier: c.tier
        }));
        setCompanies(normComps);
      } else {
        setCompanies([]);
      }

      if (Array.isArray(dbDrives) && dbDrives.length > 0) {
        const normDrives = dbDrives.map(d => ({
          id: d.id,
          title: d.title,
          company_id: d.companyId || d.company?.id,
          company_name: d.company?.name || d.company_name,
          job_role: d.jobRole || d.job_role,
          ctc_details: d.ctcDetails || (d.ctcNumeric ? `₹${d.ctcNumeric} LPA` : d.ctc_details),
          location: d.location || 'On-Campus',
          drive_date: d.driveDate ? d.driveDate.split('T')[0] : (d.drive_date || ''),
          deadline_date: d.deadlineDate ? d.deadlineDate.split('T')[0] : (d.deadline_date || ''),
          required_cgpa: d.requiredCgpa ? String(d.requiredCgpa) : (d.required_cgpa || '6.5'),
          max_backlogs: d.maxBacklogs !== undefined ? String(d.maxBacklogs) : (d.max_backlogs || '0'),
          description: d.description || '',
          status: d.status || 'Upcoming',
          applicant_count: d._count?.applications || d.applicant_count || 0,
          selected_count: d.selected_count || 0
        }));
        setDrives(normDrives);
      } else {
        setDrives([]);
      }
    } catch {
      setDrives([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivesAndCompanies();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    company_id: '',
    company_name: '',
    job_role: '',
    ctc_details: '',
    location: '',
    drive_date: '',
    deadline_date: '',
    required_cgpa: '6.5',
    max_backlogs: '0',
    description: '',
    status: 'Upcoming'
  });

  // KPI Calculations
  const totalDrives = drives.length;
  const activeDrives = drives.filter(d => d.status === 'Active').length;
  const upcomingDrives = drives.filter(d => d.status === 'Upcoming').length;
  const totalApplicants = drives.reduce((sum, d) => sum + (d.applicant_count || 0), 0);
  const totalSelected = drives.reduce((sum, d) => sum + (d.selected_count || 0), 0);

  // Filtered Drives
  const filteredDrives = useMemo(() => {
    return drives.filter(d => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.job_role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [drives, searchQuery, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedDrives,
    totalItems
  } = useTablePagination(filteredDrives, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, setCurrentPage]);

  const handleOpenAddModal = () => {
    setEditingDrive(null);
    setFormData({
      id: '',
      title: '',
      company_id: companies.length > 0 ? companies[0].id : '',
      company_name: companies.length > 0 ? companies[0].company_name : '',
      job_role: '',
      ctc_details: '',
      location: 'Campus Auditorium & Labs',
      drive_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      deadline_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      required_cgpa: '6.5',
      max_backlogs: '0',
      description: 'Round 1: Online Aptitude & Coding, Round 2: Technical Interview, Round 3: HR Interview',
      status: 'Upcoming'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (d) => {
    setEditingDrive(d);
    setFormData({
      id: d.id,
      title: d.title,
      company_id: d.company_id,
      company_name: d.company_name,
      job_role: d.job_role,
      ctc_details: d.ctc_details,
      location: d.location || '',
      drive_date: d.drive_date,
      deadline_date: d.deadline_date,
      required_cgpa: d.required_cgpa,
      max_backlogs: d.max_backlogs,
      description: d.description || '',
      status: d.status
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDrive(null);
  };

  const handleCompanyChange = (e) => {
    const compId = e.target.value;
    const selectedComp = companies.find(c => String(c.id) === String(compId));
    setFormData({
      ...formData,
      company_id: compId,
      company_name: selectedComp ? selectedComp.company_name : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company_name) return;

    const actionText = editingDrive ? 'Update' : 'Schedule';
    const confirmed = await confirm({
      title: `${actionText} Recruitment Drive`,
      message: `Do you want to ${actionText.toLowerCase()} campus drive "${formData.title}"?`,
      details: [
        `Company: ${formData.company_name}`,
        `Job Role: ${formData.job_role || 'Not specified'} (${formData.ctc_details || 'N/A'})`,
        `Drive Date: ${formData.drive_date || 'N/A'} | Venue: ${formData.location || 'Campus'}`,
        `Eligibility: Min CGPA ${formData.required_cgpa || '0.0'} & Max Backlogs: ${formData.max_backlogs ?? 0}`
      ],
      confirmText: editingDrive ? 'Yes, Update Drive' : 'Yes, Schedule Drive',
      variant: 'primary'
    });
    if (!confirmed) return;

    try {
      if (editingDrive) {
        await placementsService.updateDrive(editingDrive.id, {
          companyId: formData.company_id,
          title: formData.title,
          jobRole: formData.job_role,
          ctcDetails: formData.ctc_details,
          driveDate: formData.drive_date || null,
          deadlineDate: formData.deadline_date || null,
          requiredCgpa: formData.required_cgpa,
          maxBacklogs: formData.max_backlogs,
          location: formData.location,
          status: formData.status,
          description: formData.description
        });
      } else {
        await placementsService.createDrive({
          companyId: formData.company_id,
          title: formData.title,
          jobRole: formData.job_role,
          ctcDetails: formData.ctc_details,
          driveDate: formData.drive_date || null,
          deadlineDate: formData.deadline_date || null,
          requiredCgpa: formData.required_cgpa,
          maxBacklogs: formData.max_backlogs,
          location: formData.location,
          status: formData.status,
          description: formData.description
        });
      }
      await fetchDrivesAndCompanies();
    } catch (err) {
      console.error('Failed to save drive to db:', err);
      let updatedList;
      if (editingDrive) {
        updatedList = drives.map(d =>
          d.id === editingDrive.id
            ? { ...d, ...formData }
            : d
        );
      } else {
        const newDrive = {
          ...formData,
          id: Date.now(),
          applicant_count: 0,
          selected_count: 0
        };
        updatedList = [newDrive, ...drives];
      }
      setDrives(updatedList);
      saveStoredDrives(updatedList);
    }
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    const drv = drives.find(d => d.id === id);
    const confirmed = await confirm({
      title: 'Confirm Delete Recruitment Drive',
      message: `Are you sure you want to delete "${drv?.title || 'Recruitment Drive'}"?`,
      details: 'This will remove the drive and unlink any active student applications.',
      confirmText: 'Yes, Delete Drive',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      await placementsService.deleteDrive(id);
      await fetchDrivesAndCompanies();
    } catch (err) {
      console.error('Failed to delete drive from db:', err);
      const updatedList = drives.filter(d => d.id !== id);
      setDrives(updatedList);
      saveStoredDrives(updatedList);
    }
  };

  return (
    <div className="placements-drives">
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      {/* Header Banner */}
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
              background: 'linear-gradient(135deg, #E11D48, #BE123C)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)'
            }}
          >
            <i className="fa-solid fa-bullhorn"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Campus Recruitment Drives
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Schedule and manage on-campus and virtual hiring drives, eligibility filters &amp; shortlists
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAddModal}
            style={{
              background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
              color: '#ffffff',
              fontWeight: '700',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Schedule Drive</span>
          </button>
          <Link
            to="/unilms/org/placements"
            className="btn btn-outline"
            style={{
              background: 'var(--card-bg, #fff)',
              color: 'var(--text-primary)',
              fontWeight: '700',
              border: '1px solid var(--border-color)',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              textDecoration: 'none'
            }}
          >
            <i className="fa-solid fa-arrow-left" style={{ color: '#E11D48' }}></i>
            <span>Placements Hub</span>
          </Link>
        </div>
      </div>

      {/* KPI Statistical Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Total Drives</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{totalDrives} Scheduled</div>
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>Academic Season 2026-27</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-bolt"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Active & Upcoming</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{activeDrives + upcomingDrives} In Pipeline</div>
            <div style={{ fontSize: '11px', color: '#D97706', fontWeight: '600' }}>{activeDrives} Active • {upcomingDrives} Upcoming</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#E0E7FF', color: '#3730A3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Candidate Applications</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{totalApplicants} Applied</div>
            <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: '600' }}>Across All Branches</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-award"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Selections & Placed</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{totalSelected} Selected</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Offers Released via TPO</div>
          </div>
        </div>
      </div>

      {/* Main Drives Table */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
              Scheduled Recruitment Drives
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
              Showing {filteredDrives.length} of {drives.length} total drives
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search drive, company, role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '7px 12px 7px 32px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  width: '240px'
                }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8', fontSize: '12px' }}></i>
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                background: '#ffffff'
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Drive Title & Role</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Hiring Company</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Package / CTC</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Drive Date & Deadline</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Eligibility</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Applicants</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={8} rows={pageSize || 5} />
              ) : paginatedDrives.length > 0 ? (
                paginatedDrives.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ color: '#1E293B', fontSize: '14px', display: 'block' }}>{d.title}</strong>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        <i className="fa-solid fa-user-tag me-1"></i> {d.job_role}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#4F46E5', fontSize: '13px' }}>
                      {d.company_name}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: '700', color: '#059669', fontSize: '13px' }}>
                        {d.ctc_details || 'As per norms'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{d.drive_date}</div>
                      <div style={{ fontSize: '11px', color: '#DC2626' }}>
                        Deadline: {d.deadline_date}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '12px', color: '#334155' }}>
                        Min CGPA: <strong>{d.required_cgpa}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Max Backlogs: <strong>{d.max_backlogs}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Link
                        to={`/unilms/org/placements/drives/${d.id}/applications`}
                        style={{
                          background: 'rgba(79, 70, 229, 0.1)',
                          color: '#4F46E5',
                          textDecoration: 'none',
                          fontWeight: '700',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px'
                        }}
                      >
                        <i className="fa-solid fa-users"></i> {d.applicant_count || 0} Candidates ({d.selected_count || 0} Selected)
                      </Link>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {d.status === 'Active' && (
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                          <i className="fa-solid fa-bolt me-1"></i> Active
                        </span>
                      )}
                      {d.status === 'Upcoming' && (
                        <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                          <i className="fa-solid fa-clock me-1"></i> Upcoming
                        </span>
                      )}
                      {d.status === 'Completed' && (
                        <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                          <i className="fa-solid fa-check me-1"></i> Completed
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link
                          to={`/unilms/org/placements/drives/${d.id}/applications`}
                          className="btn-icon"
                          style={{
                            background: '#EEF2FF',
                            border: '1px solid #C7D2FE',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            color: '#4F46E5'
                          }}
                          title="View Registered Applicants"
                        >
                          <i className="fa-solid fa-users-viewfinder"></i>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(d)}
                          className="btn-icon"
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: '#475569'
                          }}
                          title="Edit Drive"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          className="btn-icon"
                          style={{
                            background: '#FEE2E2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: '#DC2626'
                          }}
                          title="Delete Drive"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    No recruitment drives found matching criteria.
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
          itemName="recruitment drives"
        />
      </div>

      {/* Modal for Scheduling / Editing Drive */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
                  <i className="fa-solid fa-bullhorn me-2" style={{ color: '#4F46E5' }}></i>
                  {editingDrive ? 'Edit Recruitment Drive' : 'Schedule Recruitment Drive'}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B' }}>
                  Configure hiring partner, package specifications, dates, and eligibility rules.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '24px', maxHeight: '72vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Drive Title / Headline *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Infosys Campus Drive 2026 - Digital Specialist Engineer"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Hiring Partner / Company *
                    </label>
                    <select
                      className="form-control"
                      required
                      value={formData.company_id}
                      onChange={handleCompanyChange}
                    >
                      <option value="">-- Choose Company --</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name} ({c.tier})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Designation / Job Role *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Graduate Trainee Engineer"
                      value={formData.job_role}
                      onChange={e => setFormData({ ...formData, job_role: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      CTC / Package Offered
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ₹9.5 LPA + Performance Bonus"
                      value={formData.ctc_details}
                      onChange={e => setFormData({ ...formData, ctc_details: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Location / Venue
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Auditorium / Virtual Teams"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Drive Date *
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={formData.drive_date}
                      onChange={e => setFormData({ ...formData, drive_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Application Deadline *
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={formData.deadline_date}
                      onChange={e => setFormData({ ...formData, deadline_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Min Required CGPA
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      value={formData.required_cgpa}
                      onChange={e => setFormData({ ...formData, required_cgpa: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Max Standing Backlogs
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.max_backlogs}
                      onChange={e => setFormData({ ...formData, max_backlogs: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Drive Status
                    </label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Active">Active / In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Drive Description & Selection Rounds
                    </label>
                    <textarea
                      rows="3"
                      className="form-control"
                      placeholder="e.g. Round 1: Online Aptitude, Round 2: Tech Interview, Round 3: HR"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                background: '#F8FAFC'
              }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseModal}
                  style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-check me-1"></i> {editingDrive ? 'Update Drive' : 'Publish Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgPlacementsDrives;