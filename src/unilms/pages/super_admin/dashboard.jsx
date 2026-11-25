import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import superAdminService from '../../services/superAdmin.service';

const SuperAdminDashboard = () => {
    const [orgs, setOrgs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [statsRes, orgsRes] = await Promise.allSettled([
                superAdminService.getDashboardStats(),
                superAdminService.getOrganizations()
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value) {
                setStats(statsRes.value);
            }

            if (orgsRes.status === 'fulfilled' && Array.isArray(orgsRes.value)) {
                const formatted = orgsRes.value.map(o => ({
                    id: o.id,
                    name: o.name,
                    code: o.code,
                    plan: o.plan?.name || 'Professional',
                    planColor: o.plan?.name === 'Enterprise' ? '#6366f1' : o.plan?.name === 'Professional' ? '#10b981' : '#64748b',
                    planBg: o.plan?.name === 'Enterprise' ? 'rgba(99, 102, 241, 0.12)' : o.plan?.name === 'Professional' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                    status: (o.status || 'Active').toLowerCase() === 'active' ? 'Active' : 'Suspended',
                    joinedDate: new Date(o.createdAt).toLocaleDateString()
                }));
                setOrgs(formatted);
            }
        } catch (e) {
            console.warn('Dashboard data fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        paginatedItems,
        totalItems
    } = useTablePagination(orgs, 5);

    return (
        <>
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
                                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
                            }}
                        >
                            <i className="fa-solid fa-gauge-high"></i>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main, #1e293b)', letterSpacing: '-0.3px' }}>
                                Platform Dashboard
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                Multi-tenant cloud telemetry, subscriber health, revenue overview, and tenant provisioning.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Link to="/unilms/superadmin/plans" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-tags"></i> Manage Plans
                        </Link>
                        <Link to="/unilms/superadmin/org_form" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-plus"></i> Add Organization
                        </Link>
                    </div>
                </div>

                {/* Academic Summary KPI Cards */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                        gap: '12px',
                        marginBottom: '24px'
                    }}
                >
                    <div
                        className="card"
                        style={{
                            padding: '12px 16px',
                            borderLeft: '4px solid var(--primary, #4F46E5)',
                            borderTop: '1px solid var(--border-color, #E2E8F0)',
                            borderRight: '1px solid var(--border-color, #E2E8F0)',
                            borderBottom: '1px solid var(--border-color, #E2E8F0)',
                            borderRadius: '12px',
                            background: 'var(--bg-card, #FFFFFF)',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Total Organizations
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '3px', lineHeight: '1.2' }}>
                            {stats?.totalTenants ?? orgs.length} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Campuses</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '4px' }}>
                            <i className="fa-solid fa-building me-1"></i> Multi-tenant Infrastructure
                        </div>
                    </div>

                    <div
                        className="card"
                        style={{
                            padding: '12px 16px',
                            borderLeft: '4px solid var(--success, #10B981)',
                            borderTop: '1px solid var(--border-color, #E2E8F0)',
                            borderRight: '1px solid var(--border-color, #E2E8F0)',
                            borderBottom: '1px solid var(--border-color, #E2E8F0)',
                            borderRadius: '12px',
                            background: 'var(--bg-card, #FFFFFF)',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Active Subscriptions
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '3px', lineHeight: '1.2' }}>
                            {stats?.activeTenants ?? orgs.filter(o => o.status === 'Active').length} Active
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '4px' }}>
                            <i className="fa-solid fa-circle-check me-1"></i> Up-to-date Renewals
                        </div>
                    </div>

                    <div
                        className="card"
                        style={{
                            padding: '12px 16px',
                            borderLeft: '4px solid #06B6D4',
                            borderTop: '1px solid var(--border-color, #E2E8F0)',
                            borderRight: '1px solid var(--border-color, #E2E8F0)',
                            borderBottom: '1px solid var(--border-color, #E2E8F0)',
                            borderRadius: '12px',
                            background: 'var(--bg-card, #FFFFFF)',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Platform Users
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#06B6D4', marginTop: '3px', lineHeight: '1.2' }}>
                            {(stats?.totalUsers ?? 0).toLocaleString()} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Accounts</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '4px' }}>
                            <i className="fa-solid fa-users me-1"></i> Students, Faculty &amp; Admins
                        </div>
                    </div>

                    <div
                        className="card"
                        style={{
                            padding: '12px 16px',
                            borderLeft: '4px solid var(--warning, #F59E0B)',
                            borderTop: '1px solid var(--border-color, #E2E8F0)',
                            borderRight: '1px solid var(--border-color, #E2E8F0)',
                            borderBottom: '1px solid var(--border-color, #E2E8F0)',
                            borderRadius: '12px',
                            background: 'var(--bg-card, #FFFFFF)',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Total Revenue
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '3px', lineHeight: '1.2' }}>
                            ₹{(stats?.totalRevenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '4px' }}>
                            Real-time Platform Billing
                        </div>
                    </div>
                </div>

                {/* Recent Organizations in Modern Background Card */}
                <div style={{
                    background: 'var(--bg-card, #ffffff)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-main, #1e293b)' }}>Recent Organizations</h3>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Latest university tenants registered on the platform</p>
                        </div>
                        <Link to="/unilms/superadmin/organizations" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary, #6366f1)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            View All <i className="fa-solid fa-arrow-right" style={{ fontSize: '11px' }}></i>
                        </Link>
                    </div>

                    <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className="data-table" style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0, 0, 0, 0.02)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Organization Name</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Plan</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Status</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Joined Date</th>
                                    <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableSkeletonLoader columns={5} rows={pageSize || 4} />
                                ) : paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                            <div>No recent organizations found.</div>
                                            <div style={{ marginTop: '12px' }}>
                                                <Link to="/unilms/superadmin/org_form" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '6px 14px' }}>
                                                    <i className="fa-solid fa-plus"></i> Add Organization
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedItems.map(org => (
                                        <tr key={org.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                                            <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-main, #1e293b)' }}>
                                                {org.name}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', background: org.planBg, color: org.planColor }}>
                                                    {org.plan}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span className={`badge ${org.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{org.status}</span>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                                {org.joinedDate}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <Link to={`/unilms/superadmin/view_organization?id=${org.id}`} className="btn-icon text-info" title="View Details">
                                                    <i className="fa-solid fa-eye"></i>
                                                </Link>
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
                            itemName="recent organizations"
                        />
                    </div>
                </div>
            </section>
        </>
    );
};

export default SuperAdminDashboard;
