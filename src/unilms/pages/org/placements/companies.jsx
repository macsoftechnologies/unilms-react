import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import { getStoredCompanies, saveStoredCompanies } from './placementsData';
import placementsService from '../../../services/placements.service';

const OrgPlacementsCompanies = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [mouFilter, setMouFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modal / Drawer state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    company_name: '',
    industry: '',
    hr_contact_name: '',
    hr_email: '',
    hr_phone: '',
    tier: 'Tier 1',
    website: '',
    location: '',
    mou_signed: false
  });

  // KPI Calculations
  const totalPartners = companies.length;
  const mouSignedCount = companies.filter(c => c.mou_signed === 1 || c.mou_signed === true).length;
  const tier1Count = companies.filter(c => c.tier === 'Super Dream' || c.tier === 'Tier 1').length;
  const industriesCount = new Set(companies.map(c => c.industry)).size;

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const dbCompanies = await placementsService.getCompanies();
      if (Array.isArray(dbCompanies) && dbCompanies.length > 0) {
        const normalized = dbCompanies.map(c => ({
          id: c.id,
          company_name: c.name || c.company_name,
          industry: c.industry || '',
          hr_contact_name: c.hrName || c.hr_contact_name || '',
          hr_email: c.hrEmail || c.hr_email || '',
          hr_phone: c.hrPhone || c.hr_phone || '',
          tier: c.tier || 'Tier 1',
          website: c.website || '',
          location: c.location || '',
          mou_signed: c.mouSigned ?? c.mou_signed ?? true,
          status: c.status || 'Active'
        }));
        setCompanies(normalized);
      } else {
        setCompanies([]);
      }
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Filtered List
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchesSearch =
        c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.industry && c.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.hr_contact_name && c.hr_contact_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTier = tierFilter === 'All' || c.tier === tierFilter;
      const matchesMou = mouFilter === 'All'
        ? true
        : mouFilter === 'Signed'
          ? (c.mou_signed === 1 || c.mou_signed === true)
          : (c.mou_signed === 0 || !c.mou_signed);

      return matchesSearch && matchesTier && matchesMou;
    });
  }, [companies, searchQuery, tierFilter, mouFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedCompanies,
    totalItems
  } = useTablePagination(filteredCompanies, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, tierFilter, mouFilter, setCurrentPage]);

  const handleOpenAddModal = () => {
    setEditingCompany(null);
    setFormData({
      id: '',
      company_name: '',
      industry: '',
      hr_contact_name: '',
      hr_email: '',
      hr_phone: '',
      tier: 'Tier 1',
      website: '',
      location: '',
      mou_signed: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (comp) => {
    setEditingCompany(comp);
    setFormData({
      id: comp.id,
      company_name: comp.company_name,
      industry: comp.industry || '',
      hr_contact_name: comp.hr_contact_name || '',
      hr_email: comp.hr_email || '',
      hr_phone: comp.hr_phone || '',
      tier: comp.tier || 'Tier 1',
      website: comp.website || '',
      location: comp.location || '',
      mou_signed: comp.mou_signed === 1 || comp.mou_signed === true
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name) return;

    const actionText = editingCompany ? 'Update' : 'Add New';
    const confirmed = await confirm({
      title: `${actionText} Recruiting Partner`,
      message: `Do you want to save recruiting partner "${formData.company_name}"?`,
      details: [
        `Company: ${formData.company_name} (${formData.tier || 'Tier 1'})`,
        `Industry: ${formData.industry || 'General Corporate'}`,
        `HR Contact: ${formData.hr_contact_name || 'N/A'} (${formData.hr_email || 'N/A'})`,
        `MOU Status: ${formData.mou_signed ? 'MOU Signed' : 'Pending MOU'}`
      ],
      confirmText: editingCompany ? 'Yes, Update Partner' : 'Yes, Add Partner',
      variant: 'primary'
    });
    if (!confirmed) return;

    try {
      if (editingCompany) {
        await placementsService.updateCompany(editingCompany.id, {
          name: formData.company_name,
          industry: formData.industry,
          tier: formData.tier,
          hrName: formData.hr_contact_name,
          hrEmail: formData.hr_email,
          hrPhone: formData.hr_phone,
          website: formData.website,
          location: formData.location,
          mouSigned: !!formData.mou_signed
        });
      } else {
        await placementsService.createCompany({
          name: formData.company_name,
          industry: formData.industry,
          tier: formData.tier,
          hrName: formData.hr_contact_name,
          hrEmail: formData.hr_email,
          hrPhone: formData.hr_phone,
          website: formData.website,
          location: formData.location,
          mouSigned: !!formData.mou_signed,
          status: 'Active'
        });
      }
      await fetchCompanies();
    } catch (err) {
      console.error('Failed to save partner to db:', err);
      // Fallback local update
      let updatedList;
      if (editingCompany) {
        updatedList = companies.map(c =>
          c.id === editingCompany.id
            ? { ...c, ...formData, mou_signed: formData.mou_signed ? 1 : 0 }
            : c
        );
      } else {
        const newCompany = {
          ...formData,
          id: Date.now(),
          mou_signed: formData.mou_signed ? 1 : 0,
          status: 'Active'
        };
        updatedList = [newCompany, ...companies];
      }
      setCompanies(updatedList);
      saveStoredCompanies(updatedList);
    }
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    const comp = companies.find(c => c.id === id);
    const confirmed = await confirm({
      title: 'Confirm Delete Partner',
      message: `Are you sure you want to delete "${comp?.company_name || 'Recruiting Partner'}"?`,
      details: 'This will remove the partner from active campus drive registries.',
      confirmText: 'Yes, Delete Partner',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      await placementsService.deleteCompany(id);
      await fetchCompanies();
    } catch (err) {
      console.error('Failed to delete partner from db:', err);
      const updatedList = companies.filter(c => c.id !== id);
      setCompanies(updatedList);
      saveStoredCompanies(updatedList);
    }
  };

  return (
    <div className="placements-companies">
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
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            <i className="fa-solid fa-building"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Partners &amp; Recruiting Companies
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Manage campus hiring partners, signed MOUs, HR representatives &amp; enterprise contacts &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAddModal}
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#ffffff',
              fontWeight: '700',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add Partner Company</span>
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
            <i className="fa-solid fa-arrow-left" style={{ color: '#2563EB' }}></i>
            <span>Placements Hub</span>
          </Link>
        </div>
      </div>

      {/* KPI Statistical Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-building"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Total Partners</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{totalPartners} Companies</div>
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>Active in Portal</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-file-contract"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Signed MOUs</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{mouSignedCount} Active</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Legally Valid Agreements</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-star"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Super Dream & Tier 1</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{tier1Count} Marquee</div>
            <div style={{ fontSize: '11px', color: '#D97706', fontWeight: '600' }}>CTC &gt; ₹10 LPA</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-layer-group"></i>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Industry Sectors</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{industriesCount} Sectors</div>
            <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: '600' }}>IT, Core, Cloud, FinTech</div>
          </div>
        </div>
      </div>

      {/* Main Companies Table with Search and Filters */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
              Corporate Partners Directory
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
              Showing {filteredCompanies.length} of {companies.length} recruiting partners
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search company, industry, HR..."
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
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                background: '#ffffff'
              }}
            >
              <option value="All">All Tiers</option>
              <option value="Super Dream">Super Dream</option>
              <option value="Tier 1">Tier 1</option>
              <option value="Core Engineering">Core Engineering</option>
            </select>

            <select
              value={mouFilter}
              onChange={e => setMouFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                background: '#ffffff'
              }}
            >
              <option value="All">All MOUs</option>
              <option value="Signed">MOU Signed</option>
              <option value="Unsigned">MOU Pending</option>
            </select>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Company & Tier</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Industry Sector</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>HR Representative</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Location / HQ</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>MOU Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
              ) : paginatedCompanies.length > 0 ? (
                paginatedCompanies.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '14px' }}>
                        {c.company_name}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: c.tier === 'Super Dream' ? '#FEF3C7' : '#EEF2FF',
                          color: c.tier === 'Super Dream' ? '#B45309' : '#4338CA'
                        }}>
                          {c.tier}
                        </span>
                        {c.website && (
                          <a href={c.website} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#64748B' }} title="Visit Website">
                            <i className="fa-solid fa-link"></i>
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155' }}>
                      <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontWeight: '600', padding: '4px 8px' }}>
                        {c.industry}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#1E293B' }}>{c.hr_contact_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        <i className="fa-solid fa-envelope me-1"></i> {c.hr_email}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        <i className="fa-solid fa-phone me-1"></i> {c.hr_phone}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748B' }}>
                      <i className="fa-solid fa-location-dot me-1" style={{ color: '#94A3B8' }}></i> {c.location || 'Pan-India'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.mou_signed === 1 || c.mou_signed === true ? (
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                          <i className="fa-solid fa-check me-1"></i> SIGNED
                        </span>
                      ) : (
                        <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                          <i className="fa-solid fa-clock me-1"></i> PENDING
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
                          className="btn-icon"
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: '#475569'
                          }}
                          title="Edit Partner"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="btn-icon"
                          style={{
                            background: '#FEE2E2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: '#DC2626'
                          }}
                          title="Delete Partner"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    No corporate partners found matching search criteria.
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
          itemName="corporate partners"
        />
      </div>

      {/* Interactive Modal / Drawer for Add & Edit Partner */}
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
                  <i className="fa-solid fa-building me-2" style={{ color: '#4F46E5' }}></i>
                  {editingCompany ? 'Edit Corporate Partner' : 'Add Corporate Partner'}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B' }}>
                  Enter organization profile, recruitment tier, and HR representative details.
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
                      Company Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Google India / Infosys"
                      value={formData.company_name}
                      onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Industry Sector *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. IT, FinTech, Automotive"
                      value={formData.industry}
                      onChange={e => setFormData({ ...formData, industry: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Recruiter Tier
                    </label>
                    <select
                      className="form-control"
                      value={formData.tier}
                      onChange={e => setFormData({ ...formData, tier: e.target.value })}
                    >
                      <option value="Super Dream">Super Dream (&gt; 20 LPA)</option>
                      <option value="Tier 1">Tier 1 (10 - 20 LPA)</option>
                      <option value="Core Engineering">Core Engineering</option>
                      <option value="Mass Recruiter">Mass Recruiter</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      HR Contact Person
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Name of Lead Recruiter"
                      value={formData.hr_contact_name}
                      onChange={e => setFormData({ ...formData, hr_contact_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      HR Official Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="recruitment@company.com"
                      value={formData.hr_email}
                      onChange={e => setFormData({ ...formData, hr_email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      HR Direct Phone
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="10-digit mobile number"
                      value={formData.hr_phone}
                      onChange={e => setFormData({ ...formData, hr_phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Location / HQ
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Bangalore, Pune"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Website URL
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://company.com"
                      value={formData.website}
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
                    <input
                      type="checkbox"
                      id="mouCheckbox"
                      checked={formData.mou_signed}
                      onChange={e => setFormData({ ...formData, mou_signed: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="mouCheckbox" style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1E293B', cursor: 'pointer' }}>
                      Memorandum of Understanding (MOU) Signed with Institute
                    </label>
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
                  <i className="fa-solid fa-check me-1"></i> {editingCompany ? 'Update Partner' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgPlacementsCompanies;