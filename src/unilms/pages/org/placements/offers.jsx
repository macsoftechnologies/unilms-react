import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import {
  getStoredOffers,
  saveStoredOffers,
  getStoredCompanies,
  initialStudents
} from './placementsData';
import placementsService from '../../../services/placements.service';
import studentsService from '../../../services/students.service';

const OrgPlacementsOffers = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [offers, setOffers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOffersData = async () => {
    setLoading(true);
    try {
      const [dbOffers, dbComps, dbStudents] = await Promise.all([
        placementsService.getOffers(),
        placementsService.getCompanies(),
        studentsService.getStudents()
      ]);

      if (Array.isArray(dbStudents) && dbStudents.length > 0) {
        setStudents(dbStudents.map(s => ({
          id: s.id,
          first_name: s.firstName || 'Candidate',
          last_name: s.lastName || '',
          roll_number: s.rollNumber || 'N/A',
          cohort_name: s.program?.name || 'Academic Degree Program'
        })));
      } else {
        setStudents([]);
      }

      if (Array.isArray(dbComps) && dbComps.length > 0) {
        setCompanies(dbComps.map(c => ({
          id: c.id,
          company_name: c.name || c.company_name
        })));
      } else {
        setCompanies([]);
      }

      if (Array.isArray(dbOffers) && dbOffers.length > 0) {
        const norm = dbOffers.map(o => ({
          id: o.id,
          student_id: o.studentId || o.student?.id,
          first_name: o.student?.firstName || o.first_name || 'Student',
          last_name: o.student?.lastName || o.last_name || '',
          roll_number: o.student?.rollNumber || o.roll_number || 'N/A',
          company_id: o.companyId || o.company?.id,
          company_name: o.company?.name || o.company_name || 'Recruiting Partner',
          job_role: o.jobRole || o.job_role,
          ctc: Number(o.ctc) > 1000 ? Number(o.ctc) : Number(o.ctc) * 100000,
          offer_date: o.offerDate ? o.offerDate.split('T')[0] : (o.offer_date || new Date().toISOString().split('T')[0]),
          status: o.status || 'Accepted',
          department: o.department || 'Academic Department',
          offer_letter_ref: o.offerLetterRef || o.offer_letter_ref || 'OFFER-REF'
        }));
        setOffers(norm);
      } else {
        setOffers([]);
      }
    } catch {
      setOffers([]);
      setCompanies([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffersData();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    student_id: '',
    first_name: '',
    last_name: '',
    roll_number: '',
    company_id: '',
    company_name: '',
    job_role: '',
    ctc: '',
    offer_date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    department: 'Computer Science & Engineering',
    offer_letter_ref: ''
  });

  // KPI Calculations
  const totalOffers = offers.length;
  const acceptedOffers = offers.filter(o => o.status === 'Accepted').length;
  const topOffer = offers.length > 0 ? offers.reduce((max, o) => (Number(o.ctc) > Number(max?.ctc || 0) ? o : max), offers[0]) : null;
  const highestCtc = topOffer ? Number(topOffer.ctc || 0) : 0;
  const dreamOffersCount = offers.filter(o => o.ctc >= 1000000).length;

  // Filtered List
  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const matchesSearch = 
        `${o.first_name} ${o.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.job_role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      const matchesDept = departmentFilter === 'All' || o.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [offers, searchQuery, statusFilter, departmentFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedOffers,
    totalItems
  } = useTablePagination(filteredOffers, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, departmentFilter, setCurrentPage]);

  const handleOpenAddModal = () => {
    setEditingOffer(null);
    const defStudent = students[0];
    const defComp = companies[0];
    setFormData({
      id: '',
      student_id: defStudent ? defStudent.id : '',
      first_name: defStudent ? defStudent.first_name : '',
      last_name: defStudent ? defStudent.last_name : '',
      roll_number: defStudent ? defStudent.roll_number : '',
      company_id: defComp ? defComp.id : '',
      company_name: defComp ? defComp.company_name : '',
      job_role: '',
      ctc: '850000',
      offer_date: new Date().toISOString().split('T')[0],
      status: 'Accepted',
      department: defStudent ? defStudent.cohort_name.split('-')[0].trim() : 'Computer Science & Engineering',
      offer_letter_ref: `OFFER-${Date.now().toString().slice(-4)}`
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (o) => {
    setEditingOffer(o);
    setFormData({
      id: o.id,
      student_id: o.student_id,
      first_name: o.first_name,
      last_name: o.last_name,
      roll_number: o.roll_number,
      company_id: o.company_id,
      company_name: o.company_name,
      job_role: o.job_role,
      ctc: o.ctc,
      offer_date: o.offer_date,
      status: o.status,
      department: o.department || 'Computer Science & Engineering',
      offer_letter_ref: o.offer_letter_ref || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOffer(null);
  };

  const handleStudentChange = (e) => {
    const sId = e.target.value;
    const sel = students.find(s => String(s.id) === String(sId));
    if (sel) {
      setFormData({
        ...formData,
        student_id: sId,
        first_name: sel.first_name,
        last_name: sel.last_name,
        roll_number: sel.roll_number,
        department: sel.cohort_name?.includes('CSE') ? 'Computer Science & Engineering' :
                    sel.cohort_name?.includes('IT') ? 'Information Technology' :
                    sel.cohort_name?.includes('ECE') ? 'Electronics & Communication' : 'Mechanical Engineering'
      });
    }
  };

  const handleCompanyChange = (e) => {
    const cId = e.target.value;
    const sel = companies.find(c => String(c.id) === String(cId));
    if (sel) {
      setFormData({
        ...formData,
        company_id: cId,
        company_name: sel.company_name
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name || !formData.job_role || !formData.ctc) return;

    const actionText = editingOffer ? 'Update' : 'Record New';
    const confirmed = await confirm({
      title: `${actionText} Placement Offer`,
      message: `Do you want to ${actionText.toLowerCase()} placement offer for "${formData.first_name} ${formData.last_name}"?`,
      details: [
        `Candidate: ${formData.first_name} ${formData.last_name} (${formData.roll_number})`,
        `Company: ${formData.company_name}`,
        `Role: ${formData.job_role}`,
        `Compensation: ₹${Number(formData.ctc).toLocaleString('en-IN')} Per Annum`,
        `Status: ${formData.status}`
      ],
      confirmText: editingOffer ? 'Yes, Update Offer' : 'Yes, Record Offer',
      variant: 'primary'
    });
    if (!confirmed) return;

    const numericCtc = Number(formData.ctc);
    const lpa = numericCtc > 1000 ? (numericCtc / 100000) : numericCtc;

    try {
      if (editingOffer) {
        await placementsService.updateOffer(editingOffer.id, {
          companyId: formData.company_id,
          studentId: formData.student_id,
          jobRole: formData.job_role,
          ctc: lpa,
          offerDate: formData.offer_date || null,
          offerLetterRef: formData.offer_letter_ref,
          status: formData.status,
          department: formData.department
        });
      } else {
        await placementsService.createOffer({
          companyId: formData.company_id,
          studentId: formData.student_id,
          jobRole: formData.job_role,
          ctc: lpa,
          offerDate: formData.offer_date || null,
          offerLetterRef: formData.offer_letter_ref,
          status: formData.status,
          department: formData.department
        });
      }
      await fetchOffersData();
    } catch (err) {
      console.error('Failed to save offer in db:', err);
      let updatedList;
      if (editingOffer) {
        updatedList = offers.map(o => 
          o.id === editingOffer.id 
            ? { ...o, ...formData, ctc: numericCtc }
            : o
        );
      } else {
        const newOffer = {
          ...formData,
          id: Date.now(),
          ctc: numericCtc
        };
        updatedList = [newOffer, ...offers];
      }
      setOffers(updatedList);
      saveStoredOffers(updatedList);
    }
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    const off = offers.find(o => o.id === id);
    const confirmed = await confirm({
      title: 'Confirm Delete Offer Record',
      message: `Are you sure you want to delete the offer record for "${off?.first_name} ${off?.last_name}" with ${off?.company_name}?`,
      details: 'This will revoke the offer credential from student placement ledger.',
      confirmText: 'Yes, Delete Offer',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      await placementsService.deleteOffer(id);
      await fetchOffersData();
    } catch (err) {
      console.error('Failed to delete offer from db:', err);
      const updatedList = offers.filter(o => o.id !== id);
      setOffers(updatedList);
      saveStoredOffers(updatedList);
    }
  };

  return (
    <div className="placements-offers">
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
              background: 'linear-gradient(135deg, #059669, #0D9488)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
            }}
          >
            <i className="fa-solid fa-file-signature"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Campus Job Offers &amp; Letters
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Track placement offers, CTC packages, acceptance confirmations &amp; department metrics
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleOpenAddModal}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
              color: '#ffffff',
              fontWeight: '700',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Record Job Offer</span>
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
            <i className="fa-solid fa-arrow-left" style={{ color: '#059669' }}></i>
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
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Total Offers</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{totalOffers} Offers</div>
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>Issued by Partners</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-check-double"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Accepted Offers</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{acceptedOffers} Accepted</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>
              {totalOffers > 0 ? ((acceptedOffers / totalOffers) * 100).toFixed(1) : 0}% Conversion
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-trophy"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Highest CTC</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>₹{(highestCtc / 100000).toFixed(1)} LPA</div>
            <div style={{ fontSize: '11px', color: topOffer ? '#DC2626' : '#64748B', fontWeight: '600' }}>
              {topOffer ? `${topOffer.company_name} • ${topOffer.job_role || 'Selected Offer'}` : 'No offers recorded'}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-crown"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Dream Offers (&gt;10L)</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{dreamOffersCount} Offers</div>
            <div style={{ fontSize: '11px', color: '#D97706', fontWeight: '600' }}>High Value Selections</div>
          </div>
        </div>
      </div>

      {/* Main Table with Filters */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
              All Recorded Job Offers
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
              Showing {filteredOffers.length} of {offers.length} candidate offer records
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search student, roll no, company..."
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
              <option value="Accepted">Accepted</option>
              <option value="Pending">Decision Pending</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                background: '#ffffff'
              }}
            >
              <option value="All">All Departments</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Information Technology">IT</option>
              <option value="Electronics & Communication">ECE</option>
              <option value="Mechanical Engineering">Mechanical</option>
            </select>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Offer Date</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Student Candidate</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Hiring Company</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Designation / Role</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Annual CTC</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Ref / Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedOffers.length > 0 ? (
                paginatedOffers.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontSize: '13px', color: '#64748B' }}>
                      {o.offer_date}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '14px' }}>
                        {o.first_name} {o.last_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Roll: <strong>{o.roll_number}</strong> • {o.department}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#4F46E5', fontSize: '13px' }}>
                      {o.company_name}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155' }}>
                      {o.job_role}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '800', color: '#059669', fontSize: '14px' }}>
                        ₹{(o.ctc / 100000).toFixed(2)} LPA
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                        ₹{(o.ctc / 12).toFixed(0)} / mo gross
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ marginBottom: '4px' }}>
                        {o.status === 'Accepted' && (
                          <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                            <i className="fa-solid fa-check me-1"></i> ACCEPTED
                          </span>
                        )}
                        {o.status === 'Pending' && (
                          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                            <i className="fa-solid fa-clock me-1"></i> PENDING
                          </span>
                        )}
                        {o.status === 'Rejected' && (
                          <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                            <i className="fa-solid fa-xmark me-1"></i> REJECTED
                          </span>
                        )}
                      </div>
                      {o.offer_letter_ref && (
                        <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
                          Ref: {o.offer_letter_ref}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(o)}
                          className="btn-icon"
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: '#475569'
                          }}
                          title="Edit Offer"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(o.id)}
                          className="btn-icon"
                          style={{
                            background: '#FEE2E2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: '#DC2626'
                          }}
                          title="Delete Offer"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    No job offers found matching criteria.
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
          itemName="job offers"
        />
      </div>

      {/* Modal for Recording / Editing Job Offer */}
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
            maxWidth: '600px',
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
                  <i className="fa-solid fa-briefcase me-2" style={{ color: '#4F46E5' }}></i>
                  {editingOffer ? 'Edit Placement Offer' : 'Record Placement Job Offer'}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B' }}>
                  Assign job offer to eligible student, set package compensation, and track confirmation status.
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
                  
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Selected Student *
                    </label>
                    <select
                      className="form-control"
                      required
                      value={formData.student_id}
                      onChange={handleStudentChange}
                    >
                      <option value="">-- Choose Candidate Student --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.first_name} {s.last_name} ({s.roll_number}) - {s.cohort_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Hiring Partner *
                    </label>
                    <select
                      className="form-control"
                      required
                      value={formData.company_id}
                      onChange={handleCompanyChange}
                    >
                      <option value="">-- Select Company --</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name} ({c.tier})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Designation / Role *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Software Development Engineer"
                      value={formData.job_role}
                      onChange={e => setFormData({ ...formData, job_role: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      CTC (₹ Total Annual Package) *
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      placeholder="e.g. 1200000"
                      value={formData.ctc}
                      onChange={e => setFormData({ ...formData, ctc: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Offer Letter Date *
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={formData.offer_date}
                      onChange={e => setFormData({ ...formData, offer_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Student Acceptance Status
                    </label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Accepted">Accepted Offer</option>
                      <option value="Pending">Decision Pending</option>
                      <option value="Rejected">Rejected Offer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Offer Letter Reference / ID
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. MSFT-2026-CS101"
                      value={formData.offer_letter_ref}
                      onChange={e => setFormData({ ...formData, offer_letter_ref: e.target.value })}
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
                  <i className="fa-solid fa-check me-1"></i> {editingOffer ? 'Update Offer' : 'Save Offer Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgPlacementsOffers;