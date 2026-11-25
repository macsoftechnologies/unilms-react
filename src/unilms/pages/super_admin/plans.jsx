import React, { useState, useEffect } from 'react';
import superAdminService from '../../services/superAdmin.service';

const STORAGE_KEY = 'unilms_superadmin_plans';

const SuperAdminPlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Modal Visibility States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Form States
    const [createForm, setCreateForm] = useState({
        name: '',
        price: '',
        duration_months: 1,
        features: ''
    });

    const [editForm, setEditForm] = useState({
        id: null,
        name: '',
        price: '',
        duration_months: 1,
        features: ''
    });

    const [deletePlan, setDeletePlan] = useState(null);
    const [flashMessage, setFlashMessage] = useState(null);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const res = await superAdminService.getPlans();
            const formatted = Array.isArray(res) ? res.map(p => ({
                id: p.id,
                name: p.name,
                price: Number(p.price),
                duration_months: p.durationMonths || p.duration_months || 1,
                duration: p.durationMonths || p.duration_months || 1,
                maxStudents: p.maxStudents || 1000,
                features: p.features || '',
                cmsEnabled: p.cmsEnabled ?? true,
                lmsEnabled: p.lmsEnabled ?? true,
                obeEnabled: p.obeEnabled ?? false,
                tenantCount: p._count?.tenants || 0,
            })) : [];
            setPlans(formatted);
        } catch (e) {
            console.warn('Backend plans fetch failed:', e);
            setFlashMessage({ type: 'error', text: 'Failed to load plans: ' + (e.response?.data?.message || e.message) });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    // Auto-clear flash message after 4s
    useEffect(() => {
        if (flashMessage) {
            const timer = setTimeout(() => setFlashMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [flashMessage]);

    // Handle Open Create
    const handleOpenCreate = () => {
        setCreateForm({
            name: '',
            price: '',
            duration_months: 1,
            features: ''
        });
        setShowCreateModal(true);
    };

    // Handle Create Submit
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!createForm.name.trim()) return;

        setSubmitting(true);
        try {
            const created = await superAdminService.createPlan({
                name: createForm.name.trim(),
                price: parseFloat(createForm.price) || 0,
                durationMonths: parseInt(createForm.duration_months, 10) || 1,
                features: createForm.features.trim(),
            });
            setShowCreateModal(false);
            setCreateForm({ name: '', price: '', duration_months: 1, features: '' });
            setFlashMessage({ type: 'success', text: `Plan "${created.name}" created successfully in PostgreSQL.` });
            await loadPlans();
        } catch (err) {
            setFlashMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to create plan in PostgreSQL.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Open Edit
    const handleOpenEdit = (plan) => {
        setEditForm({
            id: plan.id,
            name: plan.name || '',
            price: plan.price !== undefined ? plan.price : '',
            duration_months: plan.duration_months || plan.duration || 1,
            features: plan.features || ''
        });
        setShowEditModal(true);
    };

    // Handle Edit Submit
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editForm.name.trim() || !editForm.id) return;

        setSubmitting(true);
        try {
            await superAdminService.updatePlan(editForm.id, {
                name: editForm.name.trim(),
                price: parseFloat(editForm.price) || 0,
                durationMonths: parseInt(editForm.duration_months, 10) || 1,
                features: editForm.features.trim(),
            });
            setShowEditModal(false);
            setFlashMessage({ type: 'success', text: `Plan "${editForm.name}" updated successfully in PostgreSQL.` });
            await loadPlans();
        } catch (err) {
            setFlashMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to update plan in PostgreSQL.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Open Delete
    const handleOpenDelete = (plan) => {
        setDeletePlan(plan);
        setShowDeleteModal(true);
    };

    // Handle Delete Submit
    const handleDeleteSubmit = async (e) => {
        e.preventDefault();
        if (!deletePlan) return;

        setSubmitting(true);
        try {
            await superAdminService.deletePlan(deletePlan.id);
            setShowDeleteModal(false);
            setFlashMessage({ type: 'success', text: `Plan "${deletePlan.name}" was removed from PostgreSQL.` });
            setDeletePlan(null);
            await loadPlans();
        } catch (err) {
            setFlashMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to delete plan from PostgreSQL.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Reload all plans from database
    const handleResetDefaults = () => {
        loadPlans();
        setFlashMessage({ type: 'success', text: 'Refreshed all subscription plans from PostgreSQL.' });
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
                {/* Flash Notice */}
                {flashMessage && (
                    <div style={{
                        padding: '12px 20px',
                        marginBottom: '20px',
                        borderRadius: '10px',
                        background: flashMessage.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        border: `1px solid ${flashMessage.type === 'error' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                        color: flashMessage.type === 'error' ? '#ef4444' : '#10b981',
                        fontWeight: '600',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        animation: 'fadeIn 0.25s ease'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className={flashMessage.type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'}></i>
                            <span>{flashMessage.text}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFlashMessage(null)}
                            style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '18px', cursor: 'pointer', padding: '0 4px' }}
                        >
                            &times;
                        </button>
                    </div>
                )}

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
                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            <i className="fa-solid fa-tags"></i>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main, #1e293b)', letterSpacing: '-0.3px' }}>
                                Subscription Plans
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                Manage tier pricing, billing durations, and module packages for organizations.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button 
                            className="btn btn-outline" 
                            onClick={handleResetDefaults}
                            title="Refresh plans from database"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                            <i className="fa-solid fa-rotate-left"></i> Refresh
                        </button>
                        <button 
                            className="btn btn-primary" 
                            id="btn-add-plan" 
                            onClick={handleOpenCreate}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                            <i className="fa-solid fa-plus"></i> Create Plan
                        </button>
                    </div>
                </div>

                {plans.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: 'var(--bg-card, #fff)',
                        borderRadius: '16px',
                        border: '1px dashed var(--border-color, #e2e8f0)',
                        margin: '20px 0'
                    }}>
                        <div style={{ fontSize: '40px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                            <i className="fa-solid fa-tags"></i>
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>No Subscription Plans Found</h3>
                        <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: '14px' }}>Create a custom plan or restore the standard unilms packages.</p>
                        <button className="btn btn-primary" onClick={handleOpenCreate}>
                            <i className="fa-solid fa-plus"></i> Create Plan
                        </button>
                    </div>
                ) : (
                    <div className="plans-grid">
                        {plans.map(plan => {
                            const isProfessional = plan.name?.trim().toLowerCase() === 'professional';
                            const duration = plan.duration_months || plan.duration || 1;
                            const featureList = (typeof plan.features === 'string' ? plan.features.split(',') : [])
                                .map(f => f.trim())
                                .filter(Boolean);

                            return (
                                <div 
                                    className={`plan-card ${isProfessional ? 'premium' : ''}`} 
                                    key={plan.id}
                                    style={{
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.25s ease'
                                    }}
                                >
                                    {isProfessional && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-12px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: 'linear-gradient(135deg, var(--primary, #2563EB), #1d4ed8)',
                                            color: '#ffffff',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.8px',
                                            padding: '4px 14px',
                                            borderRadius: '20px',
                                            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.35)',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            <i className="fa-solid fa-star" style={{ marginRight: '4px', fontSize: '10px' }}></i> Popular
                                        </div>
                                    )}

                                    <div>
                                        <h3 style={{ fontSize: '22px', fontWeight: '800', marginTop: isProfessional ? '8px' : '0' }}>{plan.name}</h3>
                                        <div className="plan-price">
                                            ₹{Number(plan.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            <span> / {duration}mo</span>
                                        </div>
                                        <ul className="plan-features">
                                            {featureList.map((feat, idx) => (
                                                <li key={idx}>
                                                    <i className="fa-solid fa-check" style={{ color: 'var(--success, #10b981)' }}></i> 
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="action-buttons" style={{ justifyContent: 'center', marginTop: '24px', display: 'flex', gap: '10px' }}>
                                        <button 
                                            type="button"
                                            className="btn btn-outline btn-edit-plan" 
                                            onClick={() => handleOpenEdit(plan)}
                                            style={{ minWidth: '85px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                        >
                                            <i className="fa-solid fa-pen-to-square"></i> Edit
                                        </button>
                                        <button 
                                            type="button"
                                            className="btn btn-outline btn-delete-plan text-danger" 
                                            onClick={() => handleOpenDelete(plan)} 
                                            style={{ minWidth: '85px', borderColor: 'var(--danger)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                        >
                                            <i className="fa-solid fa-trash-can"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ========================================================= */}
            {/* ADD PLAN DRAWER (Right-Side Slide-Over)                   */}
            {/* ========================================================= */}
            {showCreateModal && (
                <div 
                    className="modal-overlay active" 
                    id="modal-add-plan" 
                    onClick={() => setShowCreateModal(false)}
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
                        className="modal-content" 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 'min(540px, 100vw)',
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
                        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                            <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                                        <i className="fa-solid fa-plus"></i>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Create New Plan</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Define subscription tier pricing & features</p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn-close btn-cancel-modal" 
                                    onClick={() => setShowCreateModal(false)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #64748b)', fontSize: '20px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            <div className="modal-body" style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>Plan Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        className="form-control" 
                                        required 
                                        placeholder="e.g. Starter" 
                                        value={createForm.name} 
                                        onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                        style={{ width: '100%', boxSizing: 'border-box' }}
                                        autoFocus
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px' }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>Price (₹)</label>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            name="price" 
                                            step="0.01" 
                                            className="form-control" 
                                            required 
                                            placeholder="e.g. 1999" 
                                            value={createForm.price} 
                                            onChange={e => setCreateForm({ ...createForm, price: e.target.value })}
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>Duration (Months)</label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            name="duration_months" 
                                            className="form-control" 
                                            required 
                                            value={createForm.duration_months} 
                                            onChange={e => setCreateForm({ ...createForm, duration_months: e.target.value })}
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <label style={{ margin: 0, fontWeight: '600', fontSize: '13px' }}>Features</label>
                                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Comma separated</span>
                                    </div>
                                    <textarea 
                                        name="features" 
                                        className="form-control" 
                                        required 
                                        placeholder="CRM Module, Up to 10 Users, Priority Support" 
                                        value={createForm.features} 
                                        onChange={e => setCreateForm({ ...createForm, features: e.target.value })}
                                        rows="4"
                                        style={{ width: '100%', minHeight: '90px', boxSizing: 'border-box', resize: 'vertical' }}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--surface, #ffffff)', flexShrink: 0, boxShadow: '0 -4px 14px rgba(0,0,0,0.03)' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-outline btn-cancel-modal" 
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <i className="fa-solid fa-check"></i> Create Plan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* EDIT PLAN DRAWER (Right-Side Slide-Over)                     */}
            {/* ========================================================= */}
            {showEditModal && (
                <div 
                    className="modal-overlay active" 
                    id="modal-edit-plan" 
                    onClick={() => setShowEditModal(false)}
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
                        className="modal-content" 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 'min(540px, 100vw)',
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
                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                            <input type="hidden" name="plan_id" value={editForm.id || ''} />
                            <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                                        <i className="fa-solid fa-pen-to-square"></i>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Edit Plan</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Update subscription tier pricing & features</p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn-close btn-cancel-modal" 
                                    onClick={() => setShowEditModal(false)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #64748b)', fontSize: '20px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            <div className="modal-body" style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>Plan Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        id="edit_plan_name" 
                                        className="form-control" 
                                        required 
                                        value={editForm.name} 
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        style={{ width: '100%', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px' }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>Price (₹)</label>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            name="price" 
                                            id="edit_plan_price" 
                                            step="0.01" 
                                            className="form-control" 
                                            required 
                                            value={editForm.price} 
                                            onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>Duration (Months)</label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            name="duration_months" 
                                            id="edit_plan_duration" 
                                            className="form-control" 
                                            required 
                                            value={editForm.duration_months} 
                                            onChange={e => setEditForm({ ...editForm, duration_months: e.target.value })}
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <label style={{ margin: 0, fontWeight: '600', fontSize: '13px' }}>Features</label>
                                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Comma separated</span>
                                    </div>
                                    <textarea 
                                        name="features" 
                                        id="edit_plan_features" 
                                        className="form-control" 
                                        required 
                                        value={editForm.features} 
                                        onChange={e => setEditForm({ ...editForm, features: e.target.value })}
                                        rows="4"
                                        style={{ width: '100%', minHeight: '90px', boxSizing: 'border-box', resize: 'vertical' }}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--surface, #ffffff)', flexShrink: 0, boxShadow: '0 -4px 14px rgba(0,0,0,0.03)' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-outline btn-cancel-modal" 
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <i className="fa-solid fa-save"></i> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* DRAWER: DELETE PLAN CONFIRMATION (Right-Side Slide-Over)   */}
            {/* ========================================================= */}
            {showDeleteModal && (
                <div 
                    className="modal-overlay active" 
                    id="modal-delete-plan" 
                    onClick={() => setShowDeleteModal(false)}
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
                        className="modal-content" 
                        onClick={(e) => e.stopPropagation()}
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
                        <form onSubmit={handleDeleteSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                            <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                                        <i className="fa-solid fa-triangle-exclamation"></i>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Delete Plan</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Irreversible plan removal</p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn-close btn-cancel-modal" 
                                    onClick={() => setShowDeleteModal(false)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #64748b)', fontSize: '20px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '16px' }}>
                                    <p style={{ margin: '0 0 10px', fontSize: '15px', lineHeight: '1.5', fontWeight: '600' }}>
                                        Are you sure you want to delete the plan <span style={{ color: 'var(--danger, #ef4444)' }}>"{deletePlan?.name}"</span>?
                                    </p>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #64748b)', lineHeight: '1.5' }}>
                                        Price: <strong>₹{deletePlan?.price}</strong> · Duration: <strong>{deletePlan?.durationMonths || deletePlan?.duration_months || 1} months</strong>
                                    </p>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #64748b)', lineHeight: '1.6' }}>
                                    Note: You cannot delete a plan if any active organizations or institutions are currently subscribed to it.
                                </p>
                            </div>

                            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--surface, #ffffff)', flexShrink: 0, boxShadow: '0 -4px 14px rgba(0,0,0,0.03)' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-outline btn-cancel-modal" 
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    style={{ backgroundColor: 'var(--danger, #ef4444)', borderColor: 'var(--danger, #ef4444)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <i className="fa-solid fa-trash-can"></i> Delete Plan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default SuperAdminPlans;