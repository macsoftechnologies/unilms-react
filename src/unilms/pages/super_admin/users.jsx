import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import superAdminService from '../../services/superAdmin.service';
import { useAuth } from '../../context/AuthContext';

const availablePermissions = [
    { id: 'organizations', label: 'Organizations', icon: 'fa-solid fa-building', desc: 'Manage university tenants' },
    { id: 'plans', label: 'Plans & Packages', icon: 'fa-solid fa-tags', desc: 'Pricing & billing cycles' },
    { id: 'payments', label: 'Payments', icon: 'fa-solid fa-credit-card', desc: 'Transactions & invoices' },
    { id: 'settings', label: 'Settings & Logs', icon: 'fa-solid fa-sliders', desc: 'Configuration & audit trails' }
];

const SuperAdminUsers = () => {
    const { user: currentUser } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState(null);

    // Form State
    const [form, setForm] = useState({
        id: null,
        name: '',
        email: '',
        password: '',
        role: 'Super Admin',
        permissions: ['organizations', 'plans', 'payments', 'settings']
    });

    // Flash Message
    const [flashMessage, setFlashMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const list = await superAdminService.getAdmins();
            const formatted = Array.isArray(list) ? list.map(a => ({
                id: a.id,
                email: a.email,
                name: a.name || 'Platform Administrator',
                role: 'Super Admin',
                isRoot: true,
                isYou: currentUser?.id === a.id || currentUser?.email === a.email,
                createdAt: new Date(a.createdAt).toLocaleString(),
                permissions: ['organizations', 'plans', 'payments', 'settings']
            })) : [];
            setAdmins(formatted);
        } catch (e) {
            console.error('Failed to load admins:', e);
            setFlashMessage({ type: 'error', text: 'Failed to load administrators from PostgreSQL: ' + (e.response?.data?.message || e.message) });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdmins();
    }, [currentUser]);

    const {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        paginatedItems: paginatedAdmins,
        totalItems
    } = useTablePagination(admins, 10);

    useEffect(() => {
        if (flashMessage) {
            const timer = setTimeout(() => setFlashMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [flashMessage]);

    // Open Add Modal
    const handleOpenAdd = () => {
        setModalMode('add');
        setForm({
            id: null,
            name: '',
            email: '',
            password: '',
            role: 'Super Admin',
            permissions: ['organizations', 'plans', 'payments', 'settings']
        });
        setShowModal(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (admin) => {
        setModalMode('edit');
        setForm({
            id: admin.id,
            name: admin.name || '',
            email: admin.email || '',
            password: '',
            role: admin.role || 'Super Admin',
            permissions: Array.isArray(admin.permissions) ? admin.permissions : ['organizations', 'plans', 'payments', 'settings']
        });
        setShowModal(true);
    };

    // Toggle Permission
    const handleTogglePermission = (permId) => {
        setForm(prev => {
            const exists = prev.permissions.includes(permId);
            const updated = exists 
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions: updated };
        });
    };

    // Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email.trim()) return;

        setSubmitting(true);
        try {
            if (modalMode === 'add') {
                if (!form.password) {
                    setFlashMessage({ type: 'error', text: 'Password is required for new administrator.' });
                    setSubmitting(false);
                    return;
                }
                await superAdminService.createAdmin({
                    email: form.email.trim(),
                    password: form.password,
                    name: form.name || 'Platform Admin'
                });
                setFlashMessage({ type: 'success', text: `Administrator "${form.email}" provisioned in PostgreSQL.` });
            } else {
                await superAdminService.updateAdmin(form.id, {
                    email: form.email.trim(),
                    name: form.name,
                    password: form.password || undefined
                });
                setFlashMessage({ type: 'success', text: `Administrator "${form.email}" updated in PostgreSQL.` });
            }
            setShowModal(false);
            await loadAdmins();
        } catch (err) {
            setFlashMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Operation failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Open Delete
    const handleOpenDelete = (admin) => {
        if (admin.isYou) {
            setFlashMessage({ type: 'error', text: 'You cannot delete your own active administrator account.' });
            return;
        }
        setAdminToDelete(admin);
        setShowDeleteModal(true);
    };

    // Confirm Delete
    const handleConfirmDelete = async (e) => {
        e.preventDefault();
        if (!adminToDelete) return;

        setSubmitting(true);
        try {
            await superAdminService.deleteAdmin(adminToDelete.id);
            setFlashMessage({ type: 'success', text: `Administrator "${adminToDelete.email}" deleted from PostgreSQL.` });
            setShowDeleteModal(false);
            setAdminToDelete(null);
            await loadAdmins();
        } catch (err) {
            setFlashMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to delete administrator.' });
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
                {/* Flash Message */}
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
                                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
                            }}
                        >
                            <i className="fa-solid fa-user-shield"></i>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main, #1e293b)', letterSpacing: '-0.3px' }}>
                                Super Admins
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                Manage platform administrators and configure granular sub-admin module permissions.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button 
                            className="btn btn-primary" 
                            onClick={handleOpenAdd}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                            <i className="fa-solid fa-plus"></i> Add Admin
                        </button>
                    </div>
                </div>

                <div className="table-container" style={{ background: 'var(--bg-card, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0, 0, 0, 0.02)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Email</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Role</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Created At</th>
                                <th style={{ textAlign: 'center', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableSkeletonLoader columns={4} rows={pageSize || 5} />
                            ) : paginatedAdmins.length > 0 ? (
                                paginatedAdmins.map(admin => (
                                    <tr key={admin.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-main, #1e293b)', fontSize: '14px' }}>{admin.email}</span>
                                            {admin.isYou && (
                                                <span style={{ display: 'inline-block', padding: '2px 8px', marginLeft: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '4px', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                                                    You
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            {admin.role === 'Root Admin' || admin.isRoot ? (
                                                <span className="badge badge-primary" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                                                    Root Admin
                                                </span>
                                            ) : (
                                                <span className="badge" style={{ background: '#e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                                                    Sub Admin
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 20px', color: 'var(--text-muted, #64748b)', fontSize: '13px' }}>
                                            {admin.createdAt}
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <div className="action-buttons" style={{ display: 'inline-flex', gap: '8px', justifyContent: 'center' }}>
                                                <button 
                                                    type="button"
                                                    className="btn-icon text-primary Edit" 
                                                    onClick={() => handleOpenEdit(admin)}
                                                    title="Edit Admin"
                                                >
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                {!admin.isYou && !admin.isRoot && (
                                                    <button 
                                                        type="button"
                                                        className="btn-icon text-danger Delete" 
                                                        onClick={() => handleOpenDelete(admin)}
                                                        title="Delete Admin"
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                        No administrators found.
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
                        itemName="super admins"
                    />
                </div>
            </section>

            {/* ========================================================= */}
            {/* ADD / EDIT SUPER ADMIN SLIDE-OVER DRAWER                  */}
            {/* ========================================================= */}
            {showModal && (
                <div 
                    className="modal-overlay active" 
                    id="modal-admin"
                    onClick={(e) => {
                        if (e.target.id === 'modal-admin') setShowModal(false);
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
                            background: 'var(--bg-card, #ffffff)',
                            color: 'var(--text-main, #1e293b)',
                            width: 'min(540px, 100vw)',
                            height: '100vh',
                            boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.25)',
                            borderLeft: '1px solid var(--border-color, #e2e8f0)',
                            display: 'flex',
                            flexDirection: 'column',
                            animation: 'unilmsSlideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            overflow: 'hidden'
                        }}
                    >
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
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
                                        background: 'rgba(37, 99, 235, 0.12)', 
                                        color: 'var(--primary, #2563EB)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '18px' 
                                    }}>
                                        <i className="fa-solid fa-user-shield"></i>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main, #1e293b)', letterSpacing: '-0.3px' }}>
                                            {modalMode === 'add' ? 'Add Super Admin' : 'Edit Super Admin'}
                                        </h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted, #64748b)' }}>
                                            {modalMode === 'add' 
                                                ? 'Create a new administrator account and assign permissions'
                                                : 'Update administrator account credentials and permissions'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    style={{ 
                                        background: 'rgba(0, 0, 0, 0.05)', 
                                        border: 'none', 
                                        color: 'var(--text-muted, #64748b)', 
                                        fontSize: '16px', 
                                        cursor: 'pointer', 
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
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
                            {/* Administrator Name */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted, #64748b)' }}>
                                    Full Name
                                </label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    id="admin_name" 
                                    className="form-control" 
                                    placeholder="e.g. Chief Executive Admin"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* Email */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted, #64748b)' }}>
                                    Email Address *
                                </label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    id="admin_email" 
                                    className="form-control" 
                                    required 
                                    placeholder="e.g. admin@superadmin.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                    autoFocus
                                />
                            </div>

                            {/* Password */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <label style={{ margin: 0, fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted, #64748b)' }}>
                                        Password {modalMode === 'add' ? '*' : ''}
                                    </label>
                                    {modalMode === 'edit' && (
                                        <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '11px', fontWeight: '500' }}>
                                            (Leave blank to keep existing password)
                                        </span>
                                    )}
                                </div>
                                <input 
                                    type="password" 
                                    name="password" 
                                    id="admin_password" 
                                    className="form-control" 
                                    required={modalMode === 'add'}
                                    placeholder={modalMode === 'add' ? 'Enter secure password' : 'Enter new password (optional)'}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* Role Select */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted, #64748b)' }}>
                                    Administrator Role
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px' }}>
                                    <div 
                                        onClick={() => setForm({ ...form, role: 'Sub Admin' })}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            border: form.role === 'Sub Admin' ? '2px solid var(--primary, #2563EB)' : '1px solid var(--border-color, #e2e8f0)',
                                            background: form.role === 'Sub Admin' ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-card, #ffffff)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            border: form.role === 'Sub Admin' ? '5px solid var(--primary, #2563EB)' : '2px solid var(--border-color, #cbd5e1)',
                                            boxSizing: 'border-box'
                                        }} />
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #1e293b)' }}>Sub Admin</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>Custom permissions</div>
                                        </div>
                                    </div>

                                    <div 
                                        onClick={() => setForm({ ...form, role: 'Root Admin' })}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            border: form.role === 'Root Admin' ? '2px solid var(--primary, #2563EB)' : '1px solid var(--border-color, #e2e8f0)',
                                            background: form.role === 'Root Admin' ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-card, #ffffff)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            border: form.role === 'Root Admin' ? '5px solid var(--primary, #2563EB)' : '2px solid var(--border-color, #cbd5e1)',
                                            boxSizing: 'border-box'
                                        }} />
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #1e293b)' }}>Root Admin</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>Full platform access</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sub Admin Permissions Grid */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ margin: 0, fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted, #64748b)' }}>
                                        Sub Admin Permissions
                                    </label>
                                    {form.role === 'Root Admin' && (
                                        <span style={{ fontSize: '11px', color: 'var(--primary, #2563EB)', fontWeight: '600' }}>
                                            <i className="fa-solid fa-lock" style={{ marginRight: '4px' }}></i> All granted for Root
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px' }}>
                                    {availablePermissions.map(perm => {
                                        const isChecked = form.role === 'Root Admin' || form.permissions.includes(perm.id);
                                        return (
                                            <label
                                                key={perm.id}
                                                onClick={() => handleTogglePermission(perm.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 12px',
                                                    borderRadius: '10px',
                                                    border: isChecked ? '1.5px solid var(--primary, #2563EB)' : '1px solid var(--border-color, #e2e8f0)',
                                                    background: isChecked ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-card, #ffffff)',
                                                    cursor: form.role === 'Root Admin' ? 'default' : 'pointer',
                                                    transition: 'all 0.18s ease',
                                                    boxSizing: 'border-box',
                                                    margin: 0
                                                }}
                                            >
                                                <input 
                                                    type="checkbox"
                                                    className="perm-checkbox"
                                                    checked={isChecked}
                                                    disabled={form.role === 'Root Admin'}
                                                    onChange={() => {}} // Handled by label onClick
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        minWidth: '18px',
                                                        accentColor: 'var(--primary, #2563EB)',
                                                        margin: 0,
                                                        padding: 0,
                                                        cursor: form.role === 'Root Admin' ? 'default' : 'pointer',
                                                        flexShrink: 0
                                                    }}
                                                />
                                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                    <span style={{ 
                                                        fontSize: '13px', 
                                                        fontWeight: '700', 
                                                        color: 'var(--text-main, #1e293b)', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '6px',
                                                        textTransform: 'none',
                                                        letterSpacing: 'normal'
                                                    }}>
                                                        <i className={perm.icon} style={{ color: isChecked ? 'var(--primary, #2563EB)' : 'var(--text-muted, #64748b)', fontSize: '12px' }}></i>
                                                        {perm.label}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '1px', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {perm.desc}
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
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
                                <button 
                                    type="button" 
                                    className="btn btn-outline" 
                                    onClick={() => setShowModal(false)}
                                    style={{ minWidth: '85px', padding: '9px 18px', borderRadius: '8px', fontSize: '13.5px', fontWeight: '600' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    style={{ minWidth: '120px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px 20px', borderRadius: '8px', fontSize: '13.5px', fontWeight: '700' }}
                                >
                                    <i className="fa-solid fa-check"></i> {modalMode === 'add' ? 'Save Admin' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* DRAWER: DELETE ADMIN CONFIRMATION (Right-Side Slide-Over) */}
            {/* ========================================================= */}
            {showDeleteModal && (
                <div 
                    className="modal-overlay active"
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
                        <form onSubmit={handleConfirmDelete} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                            <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                                        <i className="fa-solid fa-triangle-exclamation"></i>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Delete Administrator</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Irreversible privilege revocation</p>
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
                                        Are you sure you want to delete administrator <span style={{ color: 'var(--danger, #ef4444)' }}>"{adminToDelete?.email}"</span>?
                                    </p>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #64748b)', lineHeight: '1.5' }}>
                                        Name: <strong>{adminToDelete?.name}</strong>
                                    </p>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #64748b)', lineHeight: '1.6' }}>
                                    This administrator will immediately lose all Super Admin root privileges, active sessions will be terminated, and database access will be permanently revoked.
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
                                    className="btn btn-primary" 
                                    style={{ backgroundColor: 'var(--danger, #ef4444)', borderColor: 'var(--danger, #ef4444)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <i className="fa-solid fa-trash-can"></i> Delete Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default SuperAdminUsers;
