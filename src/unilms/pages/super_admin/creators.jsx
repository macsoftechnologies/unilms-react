import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { superAdminService } from '../../services/superAdmin.service';

const SuperAdminCreators = () => {
    const [creators, setCreators] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [showCreatorModal, setShowCreatorModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [creatorToDelete, setCreatorToDelete] = useState(null);

    const [form, setForm] = useState({
        id: null,
        name: '',
        email: '',
        password: '',
        orgName: 'Global',
        tenantId: null,
        status: 'active'
    });

    const [flashMessage, setFlashMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadCreators = async () => {
        setLoading(true);
        try {
            const data = await superAdminService.getCreators();
            if (Array.isArray(data)) {
                setCreators(data);
            }
        } catch (err) {
            console.error('Failed to load creators from database:', err);
            setFlashMessage({ type: 'error', text: 'Failed to load content creators from database.' });
        } finally {
            setLoading(false);
        }
    };

    const loadTenants = async () => {
        try {
            const res = await superAdminService.getOrganizations();
            if (Array.isArray(res)) setTenants(res);
        } catch (err) {
            console.error('Failed to load institutions:', err);
        }
    };

    useEffect(() => {
        loadCreators();
        loadTenants();
    }, []);

    const {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        paginatedItems: paginatedCreators,
        totalItems
    } = useTablePagination(creators, 10);

    useEffect(() => {
        if (flashMessage) {
            const timer = setTimeout(() => setFlashMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [flashMessage]);

    const handleOpenAdd = () => {
        setModalMode('add');
        setForm({
            id: null,
            name: '',
            email: '',
            password: '',
            orgName: 'Global',
            tenantId: null,
            status: 'active'
        });
        setShowCreatorModal(true);
    };

    const handleOpenEdit = (creator) => {
        setModalMode('edit');
        setForm({
            id: creator.id,
            name: creator.name || '',
            email: creator.email || '',
            password: '',
            orgName: creator.orgName || 'Global',
            tenantId: creator.tenantId || null,
            status: creator.status || 'active'
        });
        setShowCreatorModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim()) return;

        try {
            if (modalMode === 'add') {
                await superAdminService.createCreator({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    orgName: form.orgName,
                    tenantId: form.tenantId || undefined,
                    status: form.status
                });
                setShowCreatorModal(false);
                setFlashMessage({ type: 'success', text: `Content Creator "${form.name}" created successfully in PostgreSQL.` });
                await loadCreators();
            } else {
                const payload = {
                    name: form.name.trim(),
                    email: form.email.trim(),
                    orgName: form.orgName,
                    tenantId: form.tenantId || undefined,
                    status: form.status
                };
                if (form.password) payload.password = form.password;

                await superAdminService.updateCreator(form.id, payload);
                setShowCreatorModal(false);
                setFlashMessage({ type: 'success', text: `Content Creator "${form.name}" updated successfully in PostgreSQL.` });
                await loadCreators();
            }
        } catch (err) {
            console.error('Error saving creator:', err);
            const msg = err.response?.data?.message || err.message || 'Operation failed';
            setFlashMessage({ type: 'error', text: `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` });
        }
    };

    const handleOpenDelete = (creator) => {
        setCreatorToDelete(creator);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async (e) => {
        e.preventDefault();
        if (!creatorToDelete) return;

        try {
            await superAdminService.deleteCreator(creatorToDelete.id);
            setShowDeleteModal(false);
            setFlashMessage({ type: 'success', text: `Content Creator "${creatorToDelete.name}" deleted successfully from PostgreSQL.` });
            setCreatorToDelete(null);
            await loadCreators();
        } catch (err) {
            console.error('Error deleting creator:', err);
            const msg = err.response?.data?.message || err.message || 'Deletion failed';
            setFlashMessage({ type: 'error', text: `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` });
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
                                background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                boxShadow: '0 4px 14px rgba(236, 72, 153, 0.3)'
                            }}
                        >
                            <i className="fa-solid fa-pen-nib"></i>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main, #1e293b)', letterSpacing: '-0.3px' }}>
                                Content Creators
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                Manage pedagogical creators and authoring scopes across institutions.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={handleOpenAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-plus"></i> Add Content Creator
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div className="stat-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Total Content Creators</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary, #2563EB)', marginTop: '4px' }}>{creators.length}</div>
                    </div>
                    <div className="stat-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Active Creators</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#16A34A', marginTop: '4px' }}>
                            {creators.filter(c => c.status === 'active').length}
                        </div>
                    </div>
                    <div className="stat-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Creator Studio URL</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #1e293b)', marginTop: '8px' }}>
                            <a href="#/creator/login" style={{ color: 'var(--primary, #2563EB)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-solid fa-arrow-up-right-from-square"></i> /creator/login
                            </a>
                        </div>
                    </div>
                </div>

                <div className="table-container" style={{ background: 'var(--bg-card, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0, 0, 0, 0.02)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Creator</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Assigned Institution</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Courses Authored</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Created At</th>
                                <th style={{ textAlign: 'center', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                            ) : paginatedCreators.length > 0 ? (
                                paginatedCreators.map(creator => (
                                    <tr key={creator.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ fontWeight: '700', color: 'var(--text-main, #1e293b)' }}>{creator.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>{creator.email}</div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            {creator.orgName === 'Global' ? (
                                                <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED', fontWeight: '600', padding: '4px 10px', borderRadius: '6px' }}>
                                                    <i className="fa-solid fa-globe" style={{ marginRight: '4px' }}></i> Global (All Orgs)
                                                </span>
                                            ) : (
                                                <span className="badge badge-primary" style={{ padding: '4px 10px', borderRadius: '6px' }}>
                                                    <i className="fa-solid fa-building" style={{ marginRight: '4px' }}></i> {creator.orgName}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{ fontWeight: '700' }}>{creator.courseCount}</span> courses
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            {creator.status === 'active' ? (
                                                <span className="badge badge-success" style={{ padding: '4px 10px', borderRadius: '6px' }}>Active</span>
                                            ) : (
                                                <span className="badge badge-danger" style={{ padding: '4px 10px', borderRadius: '6px' }}>Inactive</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 20px', color: 'var(--text-muted, #64748b)', fontSize: '13px' }}>{creator.createdAt}</td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            <div className="action-buttons" style={{ display: 'inline-flex', gap: '8px', justifyContent: 'center' }}>
                                                <button 
                                                    type="button"
                                                    className="btn-icon text-primary" 
                                                    onClick={() => handleOpenEdit(creator)}
                                                    title="Edit Creator"
                                                >
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className="btn-icon text-danger" 
                                                    onClick={() => handleOpenDelete(creator)}
                                                    title="Delete Creator"
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No content creators found. Click "+ Add Content Creator" to create one.</td></tr>
                            )}
                        </tbody>
                    </table>
                    <TablePagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        itemName="content creators"
                    />
                </div>
            </section>

            {/* Slide-Over Drawer: Add/Edit Creator */}
            {showCreatorModal && (
                <div 
                    className="modal-overlay active" 
                    id="modal-creator"
                    onClick={(e) => {
                        if (e.target.id === 'modal-creator') setShowCreatorModal(false);
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
                                        <i className="fa-solid fa-chalkboard-user"></i>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' }}>
                                            {modalMode === 'add' ? 'Add Content Creator' : 'Edit Content Creator'}
                                        </h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted, #64748b)' }}>
                                            {modalMode === 'add' ? 'Provision pedagogical author & course curator' : 'Update creator details & institutional assignment'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setShowCreatorModal(false)}
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
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)' }}>Full Name *</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        className="form-control" 
                                        placeholder="e.g. Prof. Rajesh Sharma" 
                                        required 
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '13.5px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)' }}>Email Address *</label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        className="form-control" 
                                        placeholder="rajesh@ait.edu" 
                                        required 
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '13.5px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                
                                <div className="form-group" style={{ margin: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <label style={{ margin: 0, fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)' }}>Password {modalMode === 'add' ? '*' : ''}</label>
                                        {modalMode === 'edit' && (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Leave blank to keep existing password</span>
                                        )}
                                    </div>
                                    <input 
                                        type="password" 
                                        name="password" 
                                        className="form-control" 
                                        placeholder={modalMode === 'add' ? 'Enter secure password' : 'Enter new password (optional)'}
                                        required={modalMode === 'add'}
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '13.5px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)' }}>Assigned Institution / Scope *</label>
                                    <select 
                                        name="org_id" 
                                        className="form-control" 
                                        value={form.tenantId || 'Global'}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === 'Global') {
                                                setForm({ ...form, orgName: 'Global', tenantId: null });
                                            } else {
                                                const t = tenants.find(item => item.id === val);
                                                setForm({ ...form, orgName: t ? t.name : val, tenantId: val });
                                            }
                                        }}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '8px', fontSize: '13.5px', background: 'var(--bg-card)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                    >
                                        <option value="Global">🌐 Global (Master Courses for All Organizations)</option>
                                        {tenants.map(t => (
                                            <option key={t.id} value={t.id}>🏛️ {t.name} ({t.code})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)' }}>Account Status</label>
                                    <select 
                                        name="status" 
                                        className="form-control" 
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '8px', fontSize: '13.5px', background: 'var(--bg-card)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                    >
                                        <option value="active">Active (Can log in & publish)</option>
                                        <option value="inactive">Inactive / Suspended</option>
                                    </select>
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
                                <button type="button" className="btn btn-outline" onClick={() => setShowCreatorModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 20px', fontWeight: '700' }}>
                                    <i className="fa-solid fa-check"></i> {modalMode === 'add' ? 'Save Creator' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Drawer: Delete Confirmation (Right-Side Slide-Over) */}
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
                                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Delete Content Creator</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Irreversible deletion confirmation</p>
                                    </div>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #64748b)', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }}>
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '16px' }}>
                                    <p style={{ margin: '0 0 10px', fontSize: '15px', lineHeight: '1.5', fontWeight: '600' }}>
                                        Are you sure you want to delete creator <span style={{ color: 'var(--danger, #ef4444)' }}>"{creatorToDelete?.name}"</span>?
                                    </p>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #64748b)', lineHeight: '1.5' }}>
                                        Email: <strong>{creatorToDelete?.email}</strong>
                                    </p>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #64748b)', lineHeight: '1.6' }}>
                                    This creator will immediately lose access to the authoring studio, master course libraries, and pedagogical publishing privileges across the platform.
                                </p>
                            </div>

                            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--surface, #ffffff)', flexShrink: 0, boxShadow: '0 -4px 14px rgba(0,0,0,0.03)' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--danger, #ef4444)', borderColor: 'var(--danger, #ef4444)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="fa-solid fa-trash-can"></i> Delete Creator
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default SuperAdminCreators;
