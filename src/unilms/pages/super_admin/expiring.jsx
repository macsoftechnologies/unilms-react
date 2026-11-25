import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { superAdminService } from '../../services/superAdmin.service';

const defaultExpiringOrgs = [];

const SuperAdminExpiring = () => {
    const [expiringOrgs, setExpiringOrgs] = useState(defaultExpiringOrgs);
    const [plans, setPlans] = useState([]);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [renewAmount, setRenewAmount] = useState('4999');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadExpiring = async () => {
        setLoading(true);
        try {
            const [orgs, plansRes] = await Promise.all([
                superAdminService.getOrganizations(),
                superAdminService.getPlans()
            ]);

            if (Array.isArray(plansRes)) {
                setPlans(plansRes);
            }

            if (Array.isArray(orgs)) {
                const expiring = orgs
                    .filter(o => o.subscriptionEndDate)
                    .map(o => {
                        const diff = Math.ceil((new Date(o.subscriptionEndDate) - new Date()) / (1000 * 60 * 60 * 24));
                        return {
                            id: o.id,
                            name: o.name,
                            code: o.code,
                            plan_name: o.plan?.name || 'Standard',
                            plan_id: o.planId,
                            subscription_end_date: new Date(o.subscriptionEndDate).toLocaleDateString('en-GB'),
                            days_remaining: diff,
                        };
                    })
                    .filter(o => o.days_remaining <= 30);
                setExpiringOrgs(expiring);
            }
        } catch (err) {
            console.error('Failed to load expiring organizations:', err);
            setExpiringOrgs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExpiring();
    }, []);

    const {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        paginatedItems: paginatedExpiring,
        totalItems
    } = useTablePagination(expiringOrgs, 10);

    const handleOpenRenew = (org) => {
        setSelectedOrg(org);
        setSelectedPlanId(org.plan_id || (plans[0]?.id ?? 2));
        const matchedPlan = plans.find(p => p.id === (org.plan_id || plans[0]?.id));
        setRenewAmount(matchedPlan ? matchedPlan.price.toString() : '4999');
        setShowRenewModal(true);
    };

    const handleRenewSubmit = async (e) => {
        e.preventDefault();
        if (!selectedOrg) return;

        setSubmitting(true);
        try {
            await superAdminService.renewOrganization(selectedOrg.id, {
                planId: selectedPlanId,
                amount: Number(renewAmount),
                paymentMethod: 'Expiring Portal Renewal'
            });
            alert(`Subscription for "${selectedOrg.name}" successfully renewed in PostgreSQL!`);
            setShowRenewModal(false);
            await loadExpiring();
        } catch (err) {
            alert('Failed to process renewal: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
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
                                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                            }}
                        >
                            <i className="fa-solid fa-hourglass-half"></i>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main, #1e293b)', letterSpacing: '-0.3px' }}>
                                Expiring Soon
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                Organizations with licenses and subscriptions expiring within the next 20 days.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge" style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#d97706',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <i className="fa-solid fa-triangle-exclamation"></i> Critical Renewal Window
                        </span>
                    </div>
                </div>

                {/* Modern Card Wrapped Table Container */}
                <div className="table-container" style={{ background: 'var(--bg-card, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: 'var(--shadow-sm)' }}>
                    <table className="data-table" style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0, 0, 0, 0.02)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Organization</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Plan</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Subscription End Date</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Days Remaining</th>
                                <th style={{ textAlign: 'center', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableSkeletonLoader columns={5} rows={pageSize || 5} />
                            ) : paginatedExpiring.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                        No organizations expiring soon! All subscriptions healthy.
                                    </td>
                                </tr>
                            ) : (
                                paginatedExpiring.map(org => (
                                    <tr key={org.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                                        <td style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--text-main, #1e293b)' }}>
                                            {org.name}
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '12.5px',
                                                fontWeight: '600',
                                                background: org.plan_name === 'Enterprise' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                                color: org.plan_name === 'Enterprise' ? '#6366f1' : '#10b981'
                                            }}>
                                                {org.plan_name}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span className="badge badge-warning" style={{ fontWeight: '600', fontSize: '12.5px' }}>
                                                {org.subscription_end_date}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 20px', color: 'var(--warning, #d97706)', fontWeight: '700', fontSize: '14px' }}>
                                            <i className="fa-solid fa-clock me-1"></i> {org.days_remaining} days
                                        </td>
                                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                            <button 
                                                className="btn btn-primary btn-renew" 
                                                onClick={() => handleOpenRenew(org)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '6px 14px' }}
                                            >
                                                <i className="fa-solid fa-arrows-rotate"></i> Renew Now
                                            </button>
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
                        itemName="expiring subscriptions"
                    />
                </div>
            </section>

            {/* Right-Side Slide-Over Drawer for Renew */}
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
                                        background: 'rgba(245, 158, 11, 0.12)',
                                        color: '#d97706',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px'
                                    }}>
                                        <i className="fa-solid fa-clock-rotate-left"></i>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', color: 'var(--text-main, #1e293b)' }}>
                                            Record Payment / Renew
                                        </h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted, #64748b)' }}>
                                            Extend institution subscription &amp; log invoice
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
                                    <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                        <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Target Institution</div>
                                        <div style={{ fontWeight: '800', fontSize: '15.5px', color: 'var(--text-main, #1e293b)', marginTop: '2px' }}>{selectedOrg.name}</div>
                                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                                            Current validity: <span style={{ color: '#dc2626', fontWeight: '700' }}>{selectedOrg.endDate}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)' }}>
                                        Select Subscription Plan *
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                        {plans.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => {
                                                    setSelectedPlanId(p.id);
                                                    setRenewAmount(p.price ? p.price.toString() : '0');
                                                }}
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
                                        className="form-control" 
                                        required 
                                        value={renewAmount} 
                                        onChange={(e) => setRenewAmount(e.target.value)} 
                                        placeholder="e.g. 4999" 
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '14px' }}
                                    />
                                </div>

                                <p style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                                    This will record a completed transaction in PostgreSQL and extend the institution's license end date.
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
                                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '9px 20px', fontWeight: '700' }}>
                                    {submitting ? 'Processing...' : 'Process Renewal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default SuperAdminExpiring;
