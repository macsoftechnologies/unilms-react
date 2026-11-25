import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import superAdminService from '../../services/superAdmin.service';

const defaultPlans = [
    { id: 1, name: 'Starter', price: 1999, durationMonths: 1, features: 'Basic LMS Module, Up to 500 Students' },
    { id: 2, name: 'Professional', price: 4999, durationMonths: 6, features: 'Full LMS & CMS Modules, Up to 2500 Students' },
    { id: 3, name: 'Enterprise', price: 14999, durationMonths: 12, features: 'Unlimited Students & Storage, Dedicated Database' }
];

const SuperAdminOrganizations = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [orgs, setOrgs] = useState([]);
    const [plans, setPlans] = useState(defaultPlans);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orgToDelete, setOrgToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState(2);
    const [renewAmount, setRenewAmount] = useState('4999');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const loadTenants = async () => {
        setLoading(true);
        try {
            const data = await superAdminService.getOrganizations();
            const formatted = Array.isArray(data) ? data.map(org => ({
                id: org.id,
                name: org.name,
                code: org.code,
                domain: org.domain,
                plan_name: org.plan?.name || org.plan_name || 'Professional',
                cms_enabled: org.cmsEnabled ?? org.cms_enabled ?? true,
                lms_enabled: org.lmsEnabled ?? org.lms_enabled ?? true,
                subscription_end_date: org.subscriptionEndDate ? new Date(org.subscriptionEndDate).toLocaleDateString() : 'N/A',
                status: (org.status || 'active').toLowerCase()
            })) : [];
            setOrgs(formatted);
        } catch (err) {
            console.error('Failed to load tenants from backend:', err);
            setOrgs([]);
        } finally {
            setLoading(false);
        }
    };

    const loadPlans = async () => {
        try {
            const pData = await superAdminService.getPlans();
            if (Array.isArray(pData) && pData.length > 0) {
                setPlans(pData);
                setSelectedPlanId(pData[0].id);
                setRenewAmount(pData[0].price ? pData[0].price.toString() : '4999');
            }
        } catch (err) {
            console.warn('Failed to load plans:', err);
        }
    };

    useEffect(() => {
        loadTenants();
        loadPlans();
    }, []);

    useEffect(() => {
        if (searchParams.get('action') === 'add') {
            navigate('/unilms/superadmin/org_form', { replace: true });
        }
    }, [searchParams, navigate]);

    const handleToggleStatus = async (id) => {
        try {
            const newStatus = await superAdminService.toggleOrganizationStatus(id);
            setOrgs(prev => prev.map(org => {
                if (org.id === id || org.code === id) {
                    return { ...org, status: (newStatus || 'active').toLowerCase() };
                }
                return org;
            }));
        } catch (err) {
            alert('Failed to update tenant status: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleOpenDelete = (org) => {
        setOrgToDelete(org);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async (e) => {
        if (e) e.preventDefault();
        if (!orgToDelete) return;
        setDeleteLoading(true);
        try {
            await superAdminService.deleteOrganization(orgToDelete.id);
            setShowDeleteModal(false);
            setOrgToDelete(null);
            await loadTenants();
        } catch (err) {
            alert('Failed to delete organization: ' + (err.response?.data?.message || err.message));
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (filteredOrgs.length === 0) {
            alert('No organizations to export.');
            return;
        }
        const headers = ['Name', 'Code', 'Domain', 'Plan', 'CMS', 'LMS', 'Subscription End Date', 'Status'];
        const rows = filteredOrgs.map(o => [
            `"${(o.name || '').replace(/"/g, '""')}"`,
            `"${o.code || ''}"`,
            `"${o.domain || ''}"`,
            `"${o.plan_name || ''}"`,
            o.cms_enabled ? 'Enabled' : 'Disabled',
            o.lms_enabled ? 'Enabled' : 'Disabled',
            `"${o.subscription_end_date || ''}"`,
            `"${o.status || ''}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `unilms_organizations_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenRenew = (org) => {
        setSelectedOrg(org);
        if (plans.length > 0) {
            setSelectedPlanId(plans[0].id);
            setRenewAmount(plans[0].price ? plans[0].price.toString() : '4999');
        }
        setShowRenewModal(true);
    };

    const handleRenewSubmit = async (e) => {
        e.preventDefault();
        if (!selectedOrg) return;
        setActionLoading(true);
        try {
            await superAdminService.renewOrganization(selectedOrg.id, {
                planId: selectedPlanId,
                amount: Number(renewAmount),
                paymentMethod: 'Online Renewal'
            });
            alert(`Successfully renewed subscription for ${selectedOrg.name}!`);
            setShowRenewModal(false);
            await loadTenants();
        } catch (err) {
            alert('Renewal failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const filteredOrgs = orgs.filter(org => {
        const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.plan_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        paginatedItems: paginatedOrgs,
        totalItems
    } = useTablePagination(filteredOrgs, 10);

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes unilmsFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes unilmsSlideRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .modal-overlay:not(.active) {
                    display: none !important;
                    pointer-events: none !important;
                    visibility: hidden !important;
                }
            ` }} />
            <section className="view-section active" style={{ padding: 'clamp(12px, 3vw, 24px) clamp(10px, 2.5vw, 20px)' }}>
                {/* Top Header Card matching Reference UI (Image 1) */}
                <div
                    style={{
                        background: 'var(--bg-card, #ffffff)',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        borderRadius: '16px',
                        padding: 'clamp(14px, 2.5vw, 20px) clamp(16px, 3vw, 24px)',
                        marginBottom: '22px',
                        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        <div
                            style={{
                                width: '46px',
                                height: '46px',
                                minWidth: '46px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
                            }}
                        >
                            <i className="fa-solid fa-building"></i>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main, #1e293b)', letterSpacing: '-0.3px' }}>
                                Organizations
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                Manage tenant institutions, assigned license tiers, active module packages, and lifecycle statuses.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleExportCSV}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                            <i className="fa-solid fa-download"></i> Export CSV
                        </button>
                        <Link
                            to="/unilms/superadmin/org_form"
                            className="btn btn-primary"
                            id="btn-add-organization"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textDecoration: 'none' }}
                        >
                            <i className="fa-solid fa-plus"></i> Add Organization
                        </Link>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '18px'
                }}>
                    <div style={{
                        position: 'relative',
                        flex: '1 1 240px',
                        maxWidth: '380px'
                    }}>
                        <i className="fa-solid fa-magnifying-glass" style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted, #94a3b8)',
                            fontSize: '14px'
                        }}></i>
                        <input
                            type="text"
                            placeholder="Search organization or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px 10px 38px',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color, #e2e8f0)',
                                background: 'var(--bg-card, #ffffff)',
                                fontSize: '13.5px',
                                color: 'var(--text-main, #1e293b)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {['all', 'active', 'suspended'].map(status => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setStatusFilter(status)}
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: '20px',
                                    fontSize: '12.5px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: statusFilter === status ? 'var(--primary, #6366f1)' : 'var(--border-color, #e2e8f0)',
                                    background: statusFilter === status ? 'var(--primary, #6366f1)' : 'var(--bg-card, #ffffff)',
                                    color: statusFilter === status ? '#ffffff' : 'var(--text-muted, #64748b)',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {status === 'all' ? 'All Statuses' : status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Modern Card Wrapped Table Container */}
                <div className="table-container" style={{ background: 'var(--bg-card, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: 'var(--shadow-sm)' }}>
                    <table className="data-table" style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0, 0, 0, 0.02)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Plan</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Modules Enabled</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Subscription End</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Status</th>
                                <th style={{ textAlign: 'center', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                            ) : paginatedOrgs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                        <div>No organizations found matching your criteria.</div>
                                        <div style={{ marginTop: '12px' }}>
                                            <Link
                                                to="/unilms/superadmin/org_form"
                                                className="btn btn-primary"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px', textDecoration: 'none' }}
                                            >
                                                <i className="fa-solid fa-plus"></i> Add Organization
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedOrgs.map(org => (
                                    <tr key={org.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ fontWeight: '600', color: 'var(--text-main, #1e293b)', fontSize: '14px' }}>
                                                {org.name}
                                            </div>
                                            <span style={{ display: 'inline-block', background: 'rgba(124,58,237,0.1)', color: 'var(--primary, #7c3aed)', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', marginTop: '3px', fontFamily: 'monospace' }}>
                                                CODE: {org.code}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '12.5px',
                                                fontWeight: '600',
                                                background: org.plan_name === 'Enterprise' ? 'rgba(99, 102, 241, 0.12)' : org.plan_name === 'Professional' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                                                color: org.plan_name === 'Enterprise' ? '#6366f1' : org.plan_name === 'Professional' ? '#10b981' : '#64748b'
                                            }}>
                                                {org.plan_name}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <span className={`badge ${org.cms_enabled ? 'badge-success' : ''}`} style={!org.cms_enabled ? { background: '#e2e8f0', color: '#64748b' } : {}}>
                                                    CMS: {org.cms_enabled ? 'On' : 'Off'}
                                                </span>
                                                <span className={`badge ${org.lms_enabled ? 'badge-primary' : ''}`} style={!org.lms_enabled ? { background: '#e2e8f0', color: '#64748b' } : {}}>
                                                    LMS: {org.lms_enabled ? 'On' : 'Off'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-main, #334155)', fontWeight: '500' }}>
                                            {org.subscription_end_date}
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span className={`badge ${org.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                                {org.status === 'active' ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                            <div className="action-buttons" style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                                                <Link to={`/unilms/superadmin/view_organization?id=${org.id}`} className="btn-icon text-info" title="View Details">
                                                    <i className="fa-solid fa-eye"></i>
                                                </Link>
                                                <Link to={`/unilms/superadmin/org_form?id=${org.id}`} className="btn-icon text-primary" title="Edit">
                                                    <i className="fa-solid fa-pen"></i>
                                                </Link>
                                                <button type="button" className="btn-icon btn-renew" onClick={() => handleOpenRenew(org)} title="Renew / Add Payment">
                                                    <i className="fa-solid fa-arrows-rotate"></i>
                                                </button>
                                                {org.status === 'active' ? (
                                                    <button type="button" className="btn-icon text-danger btn-toggle-status" onClick={() => handleToggleStatus(org.id)} title="Suspend">
                                                        <i className="fa-solid fa-ban"></i>
                                                    </button>
                                                ) : (
                                                    <button type="button" className="btn-icon text-success btn-toggle-status" onClick={() => handleToggleStatus(org.id)} title="Activate">
                                                        <i className="fa-solid fa-check"></i>
                                                    </button>
                                                )}
                                                <button type="button" className="btn-icon text-danger" onClick={() => handleOpenDelete(org)} title="Delete Organization">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <TablePagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        itemName="organizations"
                    />
                </div>
            </section>

            {/* Right-Side Slide-Over Drawer for Renew / Add Payment */}
            {showRenewModal && (
                <div 
                    className="modal-overlay active" 
                    id="modal-renew"
                    onClick={(e) => {
                        if (e.target.id === 'modal-renew') setShowRenewModal(false);
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 9999,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'stretch',
                        animation: 'unilmsFadeIn 0.2s ease'
                    }}
                >
                    <div 
                        className="drawer-panel" 
                        style={{
                            width: 'min(540px, 100vw)',
                            height: '100vh',
                            background: 'var(--bg-card, #ffffff)',
                            boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            animation: 'unilmsSlideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            borderLeft: '1px solid var(--border-color, #e2e8f0)',
                            overflow: 'hidden'
                        }}
                    >
                        <form onSubmit={handleRenewSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                            {/* Drawer Fixed Header */}
                            <div style={{
                                padding: '18px 24px',
                                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'var(--bg-card, #ffffff)',
                                flexShrink: 0
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: 'rgba(16, 185, 129, 0.12)',
                                        color: '#10b981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px'
                                    }}>
                                        <i className="fa-solid fa-arrows-rotate"></i>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', color: 'var(--text-main, #1e293b)' }}>
                                            Record Payment / Renew
                                        </h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted, #64748b)' }}>
                                            Extend institution subscription &amp; log transaction receipt
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setShowRenewModal(false)}
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.05)',
                                        border: 'none',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        color: 'var(--text-muted, #64748b)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            {/* Drawer Scrollable Body */}
                            <div style={{
                                padding: '22px 24px',
                                overflowY: 'auto',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '18px'
                            }}>
                                {selectedOrg && (
                                    <div style={{ background: 'rgba(99, 102, 241, 0.06)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Target Organization</div>
                                        <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main, #1e293b)', marginTop: '2px' }}>{selectedOrg.name} ({selectedOrg.code})</div>
                                    </div>
                                )}

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)' }}>
                                        Select a Plan to Renew / Upgrade
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                        {(plans.length > 0 ? plans : defaultPlans).map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => { setSelectedPlanId(p.id); setRenewAmount(p.price ? p.price.toString() : '0'); }}
                                                style={{
                                                    border: selectedPlanId === p.id ? '2px solid var(--primary, #6366f1)' : '1px solid var(--border-color, #e2e8f0)',
                                                    borderRadius: '12px',
                                                    padding: '12px 14px',
                                                    cursor: 'pointer',
                                                    background: selectedPlanId === p.id ? 'rgba(99, 102, 241, 0.06)' : 'var(--bg-card, #ffffff)',
                                                    transition: 'all 0.2s ease',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div style={{ fontWeight: '700', fontSize: '13.5px', marginBottom: '4px', color: 'var(--text-main, #1e293b)' }}>{p.name}</div>
                                                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary, #6366f1)' }}>
                                                    ₹{p.price} <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted, #64748b)' }}>/{p.durationMonths || 1}mo</span>
                                                </div>
                                                {selectedPlanId === p.id && (
                                                    <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--primary, #6366f1)', fontSize: '14px' }}>
                                                        <i className="fa-solid fa-circle-check"></i>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)' }}>
                                        Payment Amount (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="amount"
                                        id="renew_amount"
                                        className="form-control"
                                        required
                                        value={renewAmount}
                                        onChange={(e) => setRenewAmount(e.target.value)}
                                        placeholder="e.g. 4999"
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '14px' }}
                                    />
                                </div>
                                <p style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                                    This will log a new completed payment invoice in Payment History and update subscription validity in PostgreSQL.
                                </p>
                            </div>

                            {/* Drawer Fixed Footer */}
                            <div style={{
                                padding: '16px 24px',
                                borderTop: '1px solid var(--border-color, #e2e8f0)',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '10px',
                                background: 'var(--surface, #ffffff)',
                                flexShrink: 0,
                                boxShadow: '0 -4px 14px rgba(0,0,0,0.03)'
                            }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowRenewModal(false)}>Cancel</button>
                                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ padding: '9px 20px', fontWeight: '700' }}>
                                    {actionLoading ? 'Processing...' : 'Confirm Renewal & Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DRAWER: DELETE ORGANIZATION (Right-Side Slide-Over)       */}
            {/* ========================================================= */}
            {showDeleteModal && (
                <div 
                    className="modal-overlay active"
                    id="modal-delete-org"
                    onClick={(e) => {
                        if (e.target.id === 'modal-delete-org') setShowDeleteModal(false);
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'stretch',
                        animation: 'unilmsFadeIn 0.2s ease'
                    }}
                >
                    <div 
                        className="drawer-panel"
                        style={{
                            width: 'min(480px, 100vw)',
                            height: '100vh',
                            background: 'var(--bg-card, #ffffff)',
                            color: 'var(--text-main, #1e293b)',
                            boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.25)',
                            borderLeft: '1px solid var(--border-color, #e2e8f0)',
                            display: 'flex',
                            flexDirection: 'column',
                            animation: 'unilmsSlideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            overflow: 'hidden'
                        }}
                    >
                        <form onSubmit={handleConfirmDelete} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                            <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                                        <i className="fa-solid fa-triangle-exclamation"></i>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Delete Organization</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Irreversible institutional removal</p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowDeleteModal(false)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #64748b)', fontSize: '20px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '16px' }}>
                                    <p style={{ margin: '0 0 10px', fontSize: '15px', lineHeight: '1.5', fontWeight: '600' }}>
                                        Are you sure you want to permanently delete <span style={{ color: 'var(--danger, #ef4444)' }}>"{orgToDelete?.name}"</span>?
                                    </p>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #64748b)', lineHeight: '1.5' }}>
                                        Institution Code: <strong>{orgToDelete?.code}</strong> · Plan: <strong>{orgToDelete?.plan_name}</strong>
                                    </p>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #64748b)', lineHeight: '1.6' }}>
                                    This will cascade-delete the tenant database entry, revoke campus admin access, and disable student and faculty logins associated with this institution.
                                </p>
                            </div>

                            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--surface, #ffffff)', flexShrink: 0, boxShadow: '0 -4px 14px rgba(0,0,0,0.03)' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-outline" 
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={deleteLoading}
                                    className="btn btn-primary" 
                                    style={{ backgroundColor: 'var(--danger, #ef4444)', borderColor: 'var(--danger, #ef4444)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <i className={deleteLoading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
                                    <span>{deleteLoading ? 'Deleting...' : 'Delete Organization'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default SuperAdminOrganizations;
