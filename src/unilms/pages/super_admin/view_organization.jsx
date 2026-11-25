import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import superAdminService from '../../services/superAdmin.service';
import { TableSkeletonLoader } from '../../components';

const SuperAdminViewOrganization = () => {
    const [searchParams] = useSearchParams();
    const orgId = searchParams.get('id');

    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!orgId) {
            // If no ID provided, try to fetch the first organization from database
            superAdminService.getOrganizations()
                .then(list => {
                    if (Array.isArray(list) && list.length > 0) {
                        return superAdminService.getOrganizationById(list[0].id);
                    }
                    return null;
                })
                .then(data => setOrg(data))
                .catch(err => setError(err.message || 'Failed to load organization'))
                .finally(() => setLoading(false));
            return;
        }

        setLoading(true);
        superAdminService.getOrganizationById(orgId)
            .then(data => setOrg(data))
            .catch(err => {
                console.error('Failed to load organization:', err);
                setError(err.response?.data?.message || err.message || 'Organization not found in database.');
            })
            .finally(() => setLoading(false));
    }, [orgId]);

    if (loading) {
        return (
            <section className="view-section active" style={{ padding: 'clamp(12px, 3vw, 24px) clamp(10px, 2.5vw, 20px)' }}>
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '16px', color: '#6366f1' }}></i>
                    <div>Loading organization records from PostgreSQL...</div>
                </div>
            </section>
        );
    }

    if (error || !org) {
        return (
            <section className="view-section active" style={{ padding: 'clamp(12px, 3vw, 24px) clamp(10px, 2.5vw, 20px)' }}>
                <div style={{
                    background: 'var(--bg-card, #ffffff)',
                    padding: '40px 24px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    textAlign: 'center',
                    maxWidth: '540px',
                    margin: '40px auto'
                }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '42px', color: '#f59e0b', marginBottom: '16px' }}></i>
                    <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700' }}>Organization Record Not Found</h3>
                    <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '14px', marginBottom: '24px' }}>
                        {error || 'No institution matches the requested identifier in the database.'}
                    </p>
                    <Link to="/unilms/superadmin/organizations" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-arrow-left"></i> Return to Organizations
                    </Link>
                </div>
            </section>
        );
    }

    const counts = org._count || {};
    const users = org.users || [];

    return (
        <section className="view-section active" style={{ padding: 'clamp(12px, 3vw, 24px) clamp(10px, 2.5vw, 20px)' }}>
            {/* Top Header Card */}
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
                            background: `linear-gradient(135deg, ${org.primaryColor || '#7C3AED'}, #6366F1)`,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
                        }}
                    >
                        <i className="fa-solid fa-building-circle-check"></i>
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main, #1e293b)', letterSpacing: '-0.3px' }}>
                                {org.name}
                            </h2>
                            <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', fontFamily: 'monospace' }}>
                                {org.code}
                            </span>
                            <span className={`badge ${org.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                                {org.status}
                            </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                            Domain: <a href={`https://${org.domain}`} target="_blank" rel="noreferrer" style={{ color: '#6366f1', fontWeight: '600' }}>{org.domain}</a> • Registered: {new Date(org.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link to="/unilms/superadmin/organizations" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-arrow-left"></i> Back to Organizations
                    </Link>
                    <Link to={`/unilms/superadmin/org_form?id=${org.id}`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-pen"></i> Edit Organization
                    </Link>
                </div>
            </div>

            {/* Quick Metrics KPI Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                    gap: '12px',
                    marginBottom: '24px'
                }}
            >
                <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', borderLeft: '4px solid #6366f1' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted, #64748b)' }}>Assigned Plan</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#6366f1', marginTop: '4px' }}>{org.plan?.name || 'Standard'}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>₹{Number(org.plan?.price || 0).toLocaleString()} / {org.plan?.durationMonths || 1}mo</div>
                </div>

                <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted, #64748b)' }}>Subscription Valid Until</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                        {org.subscriptionEndDate ? new Date(org.subscriptionEndDate).toLocaleDateString() : 'Perpetual'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>License Status: {org.status}</div>
                </div>

                <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', borderLeft: '4px solid #06b6d4' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted, #64748b)' }}>Total Campus Users</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#06b6d4', marginTop: '4px' }}>{counts.users || users.length || 0}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Students, Faculty & Staff</div>
                </div>

                <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted, #64748b)' }}>Academic Structure</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
                        {counts.departments || 0} Depts • {counts.programs || 0} Progs
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Configured in DB</div>
                </div>
            </div>

            {/* Profile & Entitlements Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* Details Column */}
                <div className="card" style={{ background: 'var(--bg-card, #ffffff)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: 'var(--text-main, #1e293b)' }}>
                        Institutional Profile
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color, #f1f5f9)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Admin Email:</span>
                            <span style={{ fontWeight: '600' }}>{org.adminEmail || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color, #f1f5f9)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Campus Code:</span>
                            <span style={{ fontWeight: '700', color: '#6366f1' }}>{org.code}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color, #f1f5f9)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Primary Theme:</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: org.primaryColor || '#7C3AED', display: 'inline-block' }}></span>
                                {org.primaryColor || '#7C3AED'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Database UUID:</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--text-muted)' }}>{org.id}</span>
                        </div>
                    </div>
                </div>

                {/* Modules Entitlements Column */}
                <div className="card" style={{ background: 'var(--bg-card, #ffffff)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: 'var(--text-main, #1e293b)' }}>
                        Licensed Module Entitlements
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color, #f1f5f9)', paddingBottom: '8px' }}>
                            <div>
                                <div style={{ fontWeight: '600' }}>CMS Core Engine</div>
                                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Academics, Staff, Payroll, Attendance</div>
                            </div>
                            <span className={`badge ${org.cmsEnabled ? 'badge-success' : ''}`} style={!org.cmsEnabled ? { background: '#e2e8f0', color: '#64748b' } : {}}>
                                {org.cmsEnabled ? 'Active' : 'Disabled'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color, #f1f5f9)', paddingBottom: '8px' }}>
                            <div>
                                <div style={{ fontWeight: '600' }}>LMS & Classroom Engine</div>
                                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Courses, Modules, CBT Assessments</div>
                            </div>
                            <span className={`badge ${org.lmsEnabled ? 'badge-primary' : ''}`} style={!org.lmsEnabled ? { background: '#e2e8f0', color: '#64748b' } : {}}>
                                {org.lmsEnabled ? 'Active' : 'Disabled'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px' }}>
                            <div>
                                <div style={{ fontWeight: '600' }}>OBE Analytics & Attainment</div>
                                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Course Outcomes & Program Attainment</div>
                            </div>
                            <span className={`badge ${org.obeEnabled ? 'badge-success' : ''}`} style={!org.obeEnabled ? { background: '#e2e8f0', color: '#64748b' } : {}}>
                                {org.obeEnabled ? 'Active' : 'Disabled'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Affiliated Campus Users Table */}
            <div style={{
                background: 'var(--bg-card, #ffffff)',
                borderRadius: '16px',
                border: '1px solid var(--border-color, #e2e8f0)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-main, #1e293b)' }}>
                            Campus Users & Accounts
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                            Registered users belonging to this institutional tenant in PostgreSQL
                        </p>
                    </div>
                </div>

                <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table className="data-table" style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0, 0, 0, 0.02)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Email</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Role</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                        No users registered under this organization yet.
                                    </td>
                                </tr>
                            ) : (
                                users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-main, #1e293b)' }}>
                                            {u.name}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                            {u.email || 'N/A'}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '600' }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span className={`badge ${(u.status || '').toLowerCase() === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                                {u.status || 'active'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default SuperAdminViewOrganization;
