import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import { getStoredInternships, saveStoredInternships } from './placementsData';
import placementsService from '../../../services/placements.service';

const OrgPlacementsInternships = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [internships, setInternships] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const dbInternships = await placementsService.getInternships();
      if (Array.isArray(dbInternships) && dbInternships.length > 0) {
        const norm = dbInternships.map(i => {
          let milestones = [];
          try {
            milestones = i.milestonesJson ? JSON.parse(i.milestonesJson) : [];
          } catch {}
          return {
            id: i.id,
            company_name: i.companyName || i.company_name,
            role_title: i.roleTitle || i.role_title,
            work_mode: i.workMode || i.work_mode || 'Hybrid',
            location: i.location || 'Bangalore Campus & Remote',
            stipend_amount: Number(i.stipendAmount || i.stipend_amount || 0),
            total_seats: Number(i.totalSeats || i.total_seats || 5),
            available_seats: Number(i.availableSeats || i.available_seats || 5),
            start_date: i.startDate ? i.startDate.split('T')[0] : (i.start_date || '2026-06-01'),
            end_date: i.endDate ? i.endDate.split('T')[0] : (i.end_date || '2026-08-31'),
            status: i.status || 'Published',
            applicant_count: i.applicant_count || 12,
            milestones: milestones.length > 0 ? milestones : [
              'Mid-term Technical Presentation & Distributed Tracing Prototype',
              'Final Production Pull Request Merge & Peer Review'
            ]
          };
        });
        setInternships(norm);
      } else {
        setInternships([]);
      }
    } catch {
      setInternships([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  const [viewRoadmapItem, setViewRoadmapItem] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    company_name: '',
    role_title: '',
    work_mode: 'Hybrid',
    location: '',
    stipend_amount: '45000',
    total_seats: '5',
    available_seats: '5',
    start_date: '2027-01-10',
    end_date: '2027-06-30',
    status: 'Published',
    milestone1: 'Milestone 1: Corporate Tooling & Security Clearance',
    milestone2: 'Milestone 2: Sprint Feature Implementation & CI/CD Pipelines',
    milestone3: 'Milestone 3: Final Industry Defense & PPO Conversion Review'
  });

  // KPI Calculations
  const totalPostings = internships.length;
  const totalApplicants = internships.reduce((sum, i) => sum + (i.applicant_count || 0), 0);
  const highestStipend = internships.reduce((max, i) => (i.stipend_amount > max ? i.stipend_amount : max), 0);
  const avgStipend = internships.length > 0 
    ? (internships.reduce((sum, i) => sum + i.stipend_amount, 0) / internships.length).toFixed(0)
    : 0;

  // Filtered List
  const filteredInternships = useMemo(() => {
    return internships.filter(i => {
      const matchesSearch = 
        i.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.role_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.location && i.location.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesMode = workModeFilter === 'All' || i.work_mode === workModeFilter;
      return matchesSearch && matchesMode;
    });
  }, [internships, searchQuery, workModeFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedInternships,
    totalItems
  } = useTablePagination(filteredInternships, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [searchQuery, workModeFilter, setCurrentPage]);

  const handleOpenAddModal = () => {
    setEditingInternship(null);
    setFormData({
      id: '',
      company_name: '',
      role_title: '',
      work_mode: 'Hybrid',
      location: 'Bangalore / Pune',
      stipend_amount: '50000',
      total_seats: '5',
      available_seats: '5',
      start_date: '2027-01-10',
      end_date: '2027-06-30',
      status: 'Published',
      milestone1: 'Milestone 1: Corporate Tooling & Security Clearance',
      milestone2: 'Milestone 2: Sprint Feature Implementation & CI/CD Pipelines',
      milestone3: 'Milestone 3: Final Industry Defense & PPO Conversion Review'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (i) => {
    setEditingInternship(i);
    setFormData({
      id: i.id,
      company_name: i.company_name,
      role_title: i.role_title,
      work_mode: i.work_mode,
      location: i.location || '',
      stipend_amount: i.stipend_amount,
      total_seats: i.total_seats,
      available_seats: i.available_seats,
      start_date: i.start_date,
      end_date: i.end_date,
      status: i.status,
      milestone1: i.milestones && i.milestones[0] ? i.milestones[0] : '',
      milestone2: i.milestones && i.milestones[1] ? i.milestones[1] : '',
      milestone3: i.milestones && i.milestones[2] ? i.milestones[2] : ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInternship(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name || !formData.role_title) return;

    const actionText = editingInternship ? 'Update' : 'Publish New';
    const confirmed = await confirm({
      title: `${actionText} Internship Opportunity`,
      message: `Do you want to ${actionText.toLowerCase()} internship posting with "${formData.company_name}"?`,
      details: [
        `Partner: ${formData.company_name}`,
        `Role: ${formData.role_title} (${formData.work_mode || 'Hybrid'})`,
        `Monthly Stipend: ₹${Number(formData.stipend_amount || 0).toLocaleString('en-IN')}`,
        `Seats: ${formData.total_seats || 5} Total Seats`,
        `Duration: ${formData.start_date || 'N/A'} to ${formData.end_date || 'N/A'}`
      ],
      confirmText: editingInternship ? 'Yes, Update Posting' : 'Yes, Publish Posting',
      variant: 'primary'
    });
    if (!confirmed) return;

    const milestones = [
      formData.milestone1,
      formData.milestone2,
      formData.milestone3
    ].filter(Boolean);

    const numStipend = Number(formData.stipend_amount);
    const numTotal = Number(formData.total_seats);
    const numAvail = Number(formData.available_seats);

    try {
      if (editingInternship) {
        await placementsService.updateInternship(editingInternship.id, {
          companyName: formData.company_name,
          roleTitle: formData.role_title,
          workMode: formData.work_mode,
          location: formData.location,
          stipendAmount: numStipend,
          totalSeats: numTotal,
          availableSeats: numAvail,
          startDate: formData.start_date || null,
          endDate: formData.end_date || null,
          status: formData.status,
          milestones
        });
      } else {
        await placementsService.createInternship({
          companyName: formData.company_name,
          roleTitle: formData.role_title,
          workMode: formData.work_mode,
          location: formData.location,
          stipendAmount: numStipend,
          totalSeats: numTotal,
          availableSeats: numAvail,
          startDate: formData.start_date || null,
          endDate: formData.end_date || null,
          status: formData.status,
          milestones
        });
      }
      await fetchInternships();
    } catch (err) {
      console.error("Failed to save internship to db:", err);
      let updatedList;
      if (editingInternship) {
        updatedList = internships.map(i =>
          i.id === editingInternship.id
            ? { ...i, ...formData, stipend_amount: numStipend, total_seats: numTotal, available_seats: numAvail, milestones }
            : i
        );
      } else {
        const newInternship = {
          ...formData,
          id: Date.now(),
          stipend_amount: numStipend,
          total_seats: numTotal,
          available_seats: numAvail,
          applicant_count: 0,
          milestones
        };
        updatedList = [newInternship, ...internships];
      }
      setInternships(updatedList);
      saveStoredInternships(updatedList);
    }
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    const item = internships.find(i => i.id === id);
    const confirmed = await confirm({
      title: 'Confirm Delete Internship',
      message: `Are you sure you want to delete the internship posting "${item?.role_title}" with ${item?.company_name}?`,
      details: 'This will withdraw the posting from student portal listings.',
      confirmText: 'Yes, Delete Posting',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      await placementsService.deleteInternship(id);
      await fetchInternships();
    } catch (err) {
      console.error('Failed to delete internship from db:', err);
      const updatedList = internships.filter(i => i.id !== id);
      setInternships(updatedList);
      saveStoredInternships(updatedList);
    }
  };

  return (
    <div className="placements-internships">
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
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
            }}
          >
            <i className="fa-solid fa-map-signs"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Corporate Internships &amp; Milestone Roadmaps
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Structured sequential milestone roadmaps, stipend tracking &amp; verified certification
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAddModal}
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              color: '#ffffff',
              fontWeight: '700',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>Post Internship</span>
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
            <i className="fa-solid fa-arrow-left" style={{ color: '#7C3AED' }}></i>
            <span>Placements Hub</span>
          </Link>
        </div>
      </div>

      {/* KPI Statistical Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-briefcase"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Active Postings</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{totalPostings} Opportunities</div>
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>Live on Student Portal</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-users-viewfinder"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Student Applicants</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{totalApplicants} Applied</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Pre-Final & Final Year</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-coins"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Highest Stipend</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>₹{highestStipend.toLocaleString()} / mo</div>
            <div style={{ fontSize: '11px', color: '#D97706', fontWeight: '600' }}>Amazon AWS Cloud</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Average Stipend</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>₹{Number(avgStipend).toLocaleString()} / mo</div>
            <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: '600' }}>Verified by TPO Audit</div>
          </div>
        </div>
      </div>

      {/* Main Table with Filters */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
              Internship Opportunities & Trackers
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
              Sequential milestone checklists and industry roadmaps for student interns
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search company, role, city..."
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
              value={workModeFilter}
              onChange={e => setWorkModeFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                background: '#ffffff'
              }}
            >
              <option value="All">All Modes</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Company & Role</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Mode & Location</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Monthly Stipend</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Available Seats</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Internship Dates</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Milestones</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={8} rows={pageSize || 5} />
              ) : paginatedInternships.length > 0 ? (
                paginatedInternships.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ color: '#1E293B', fontSize: '14px', display: 'block' }}>{item.company_name}</strong>
                      <div style={{ color: '#4F46E5', fontWeight: '600', fontSize: '12px' }}>{item.role_title}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge" style={{ background: '#EEF2FF', color: '#4338CA', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                        {item.work_mode}
                      </span>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                        {item.location || 'Virtual'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: '700', color: '#059669', fontSize: '13px' }}>
                        {item.stipend_amount > 0 ? `₹${item.stipend_amount.toLocaleString()} / mo` : 'Academic / Unpaid'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>
                        {item.available_seats} / {item.total_seats} Seats
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#475569' }}>
                      <div>Start: {item.start_date}</div>
                      <div style={{ color: '#64748B' }}>End: {item.end_date}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        type="button"
                        onClick={() => setViewRoadmapItem(item)}
                        style={{
                          background: 'rgba(79, 70, 229, 0.1)',
                          border: 'none',
                          color: '#4F46E5',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fa-solid fa-map-signs me-1"></i> {item.milestones ? item.milestones.length : 3} Milestones
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                        <i className="fa-solid fa-check me-1"></i> {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link
                          to={`/unilms/org/internships/create_posting?id=${item.id}`}
                          className="btn-icon"
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: '#475569',
                            display: 'inline-flex',
                            alignItems: 'center',
                            textDecoration: 'none'
                          }}
                          title="Edit Posting & Roadmap"
                        >
                          <i className="fa-solid fa-pencil"></i>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="btn-icon"
                          style={{
                            background: '#FEE2E2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: '#DC2626'
                          }}
                          title="Delete Posting"
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
                    No internship opportunities found matching criteria.
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
          itemName="internship postings"
        />
      </div>

      {/* Modal for Viewing Roadmap Milestones */}
      {viewRoadmapItem && (
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
            maxWidth: '520px',
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
                  <i className="fa-solid fa-map-location-dot me-2" style={{ color: '#4F46E5' }}></i>
                  {viewRoadmapItem.company_name} Roadmap
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B' }}>
                  {viewRoadmapItem.role_title} • Sequential Assessment Plan
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setViewRoadmapItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(viewRoadmapItem.milestones || []).map((m, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                    background: '#F8FAFC',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0'
                  }}>
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#4F46E5',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '12px',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '2px' }}>
                        {m}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Faculty Review & TPO Verified Milestone Gate
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#F8FAFC'
            }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setViewRoadmapItem(null)}
                style={{ padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Posting / Editing Internship */}
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
            maxWidth: '620px',
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
                  <i className="fa-solid fa-plus-circle me-2" style={{ color: '#4F46E5' }}></i>
                  {editingInternship ? 'Edit Internship Opportunity' : 'Post Internship Opportunity'}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B' }}>
                  Define industry sponsor, stipend, seats, and sequential milestone roadmap.
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
              <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Microsoft / Cisco"
                      value={formData.company_name}
                      onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Role Title *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Cloud Engineering Intern"
                      value={formData.role_title}
                      onChange={e => setFormData({ ...formData, role_title: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Work Mode
                    </label>
                    <select
                      className="form-control"
                      value={formData.work_mode}
                      onChange={e => setFormData({ ...formData, work_mode: e.target.value })}
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Location
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Bangalore / Hyderabad"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Monthly Stipend (₹)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 50000"
                      value={formData.stipend_amount}
                      onChange={e => setFormData({ ...formData, stipend_amount: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Total Available Seats
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={formData.total_seats}
                      onChange={e => setFormData({ ...formData, total_seats: e.target.value, available_seats: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.start_date}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.end_date}
                      onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Milestone 1 (Foundation / Onboarding)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Cloud Certification & Security Clearance"
                      value={formData.milestone1}
                      onChange={e => setFormData({ ...formData, milestone1: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Milestone 2 (Core Development & Deliverables)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Sprint Deliverables & Code Merge"
                      value={formData.milestone2}
                      onChange={e => setFormData({ ...formData, milestone2: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Milestone 3 (Final Defense & PPO Review)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Industry Capstone Presentation & Offer Review"
                      value={formData.milestone3}
                      onChange={e => setFormData({ ...formData, milestone3: e.target.value })}
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
                  <i className="fa-solid fa-check me-1"></i> {editingInternship ? 'Update Internship' : 'Publish Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgPlacementsInternships;