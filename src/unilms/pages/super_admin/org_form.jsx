import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import superAdminService from '../../services/superAdmin.service';

const defaultPlans = [
    {
        id: 1,
        name: 'Starter',
        price: 1999.00,
        durationMonths: 1,
        features: 'Basic LMS Module, Up to 500 Students, Standard Reports'
    },
    {
        id: 2,
        name: 'Professional',
        price: 4999.00,
        durationMonths: 6,
        features: 'Full LMS & CMS Modules, Up to 2500 Students, OBE Attainment System'
    },
    {
        id: 3,
        name: 'Enterprise',
        price: 14999.00,
        durationMonths: 12,
        features: 'Unlimited Students & Storage, Multi-Campus Management, Dedicated Database'
    }
];

const SuperAdminOrgForm = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');
    const isEdit = Boolean(editId);

    const [plans, setPlans] = useState(defaultPlans);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [domain, setDomain] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('Password@123');
    const [cmsEnabled, setCmsEnabled] = useState(true);
    const [lmsEnabled, setLmsEnabled] = useState(true);
    const [obeEnabled, setObeEnabled] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState(2);
    const [confirmPayment, setConfirmPayment] = useState(true);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);
    const [error, setError] = useState(null);

    useEffect(() => {
        superAdminService.getPlans().then(res => {
            if (Array.isArray(res) && res.length > 0) {
                setPlans(res);
            }
        }).catch(err => console.warn('Could not load plans from backend:', err));
    }, []);

    useEffect(() => {
        if (editId) {
            setInitialLoading(true);
            superAdminService.getOrganizationById(editId)
                .then(org => {
                    if (org) {
                        setName(org.name || '');
                        setCode(org.code || '');
                        setDomain(org.domain || '');
                        setAdminEmail(org.adminEmail || '');
                        setSelectedPlanId(org.planId || 2);
                        setCmsEnabled(org.cmsEnabled ?? true);
                        setLmsEnabled(org.lmsEnabled ?? true);
                        setObeEnabled(org.obeEnabled ?? false);
                        setAdminPassword(''); // Leave blank unless updating
                    }
                })
                .catch(err => {
                    console.error('Failed to load org for edit:', err);
                    setError('Failed to load organization record from PostgreSQL.');
                })
                .finally(() => setInitialLoading(false));
        }
    }, [editId]);

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
    };

    const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1] || plans[0];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isEdit) {
                await superAdminService.updateOrganization(editId, {
                    name,
                    domain: domain || `${code.toLowerCase()}.unilms.com`,
                    adminEmail,
                    planId: selectedPlanId,
                    cms_enabled: cmsEnabled,
                    lms_enabled: lmsEnabled,
                    obe_enabled: obeEnabled,
                });
                alert(`Organization "${name}" was successfully updated in PostgreSQL!`);
            } else {
                await superAdminService.createOrganization({
                    name,
                    code,
                    domain: domain || `${code.toLowerCase()}.unilms.com`,
                    adminEmail,
                    adminPassword: adminPassword || 'Password@123',
                    planId: selectedPlanId,
                    cms_enabled: cmsEnabled,
                    lms_enabled: lmsEnabled,
                    obe_enabled: obeEnabled,
                    confirmPayment,
                });
                alert(`Organization "${name}" (${code.toUpperCase()}) was successfully provisioned in PostgreSQL with the ${selectedPlan.name} plan!`);
            }
            navigate('/unilms/superadmin/organizations');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to save organization');
        } finally {
            setLoading(false);
        }
    };

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
                                background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
                            }}
                        >
                            <i className={isEdit ? "fa-solid fa-pen" : "fa-solid fa-plus"}></i>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main, #1e293b)', letterSpacing: '-0.3px' }}>
                                {isEdit ? 'Edit Organization' : 'Create New Organization'}
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                {isEdit ? `Update profile, licensed modules, and subscription for ${name || code}.` : 'Provision a new institutional campus, setup administrator credentials, and configure module licenses.'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Link to="/unilms/superadmin/organizations" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-arrow-left"></i> Back to Organizations
                        </Link>
                    </div>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        marginBottom: '20px',
                        color: '#dc2626',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '18px' }}></i>
                        <div>
                            <strong>Provisioning Failed: </strong>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="org-form-container" id="org_form">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                        gap: '24px',
                        alignItems: 'start'
                    }}>
                        {/* Main Details Column */}
                        <div>
                            {/* 1. Institutional Details Card */}
                            <div className="card" style={{
                                background: 'var(--bg-card, #ffffff)',
                                padding: 'clamp(16px, 3vw, 24px)',
                                borderRadius: '16px',
                                marginBottom: '24px',
                                border: '1px solid var(--border-color, #e2e8f0)',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <h3 style={{ marginTop: 0, color: 'var(--text-main, #1e293b)', fontSize: '18px', fontWeight: '700' }}>
                                    1. Institutional Details
                                </h3>
                                <hr style={{ border: 0, borderTop: '1px solid var(--border-color, #e2e8f0)', marginBottom: '20px' }} />
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '16px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: 'var(--text-main, #1e293b)' }}>
                                            Organization Name *
                                        </label>
                                        <input 
                                            type="text" 
                                            name="name" 
                                            id="org_name_input" 
                                            className="form-control" 
                                            required 
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '8px', fontSize: '14px', background: 'var(--surface, #ffffff)', color: 'var(--text-main, #1e293b)' }} 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. National Institute of Technology & Science" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: 'var(--text-main, #1e293b)' }}>
                                            Institution Code / Prefix *
                                        </label>
                                        <input 
                                            type="text" 
                                            name="code" 
                                            id="org_code_input" 
                                            className="form-control" 
                                            required 
                                            disabled={isEdit}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '8px', fontWeight: '700', textTransform: 'uppercase', fontSize: '14px', background: isEdit ? 'rgba(0,0,0,0.05)' : 'var(--surface, #ffffff)', color: 'var(--text-main, #1e293b)', cursor: isEdit ? 'not-allowed' : 'text' }} 
                                            value={code} 
                                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                                            placeholder="e.g. AIT" 
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: 'var(--text-main, #1e293b)' }}>
                                        Primary Admin Email *
                                    </label>
                                    <input 
                                        type="email" 
                                        name="admin_email" 
                                        className="form-control" 
                                        required 
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '8px', fontSize: '14px', background: 'var(--surface, #ffffff)', color: 'var(--text-main, #1e293b)' }} 
                                        value={adminEmail} 
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                        placeholder="admin@campus.edu" 
                                    />
                                </div>
                                
                                <div className="form-group" style={{ marginBottom: '18px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: 'var(--text-main, #1e293b)' }}>
                                        {isEdit ? 'Update Admin Password (Optional)' : 'Temporary Password *'}
                                    </label>
                                    <input 
                                        type="password" 
                                        name="admin_password" 
                                        className="form-control" 
                                        required={!isEdit}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '8px', fontSize: '14px', background: 'var(--surface, #ffffff)', color: 'var(--text-main, #1e293b)' }} 
                                        value={adminPassword} 
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        placeholder={isEdit ? 'Leave blank to retain current password' : '••••••••••••'} 
                                    />
                                </div>

                                {/* Institution Logo / Emblem Upload Option */}
                                <div className="form-group" style={{ marginBottom: '8px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: 'var(--text-main, #1e293b)' }}>
                                        Institution Logo / Emblem
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '16px',
                                        border: '2px dashed var(--border-color, #cbd5e1)',
                                        borderRadius: '12px',
                                        background: 'var(--surface-hover, rgba(0, 0, 0, 0.01))',
                                        flexWrap: 'wrap'
                                    }}>
                                        {logoPreview ? (
                                            <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color, #cbd5e1)', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <img src={logoPreview} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                        ) : (
                                            <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary, #6366f1)', fontSize: '24px' }}>
                                                <i className="fa-solid fa-building-columns"></i>
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: '180px' }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
                                                <label 
                                                    htmlFor="org_logo_upload"
                                                    style={{
                                                        padding: '7px 14px',
                                                        background: 'var(--primary, #6366f1)',
                                                        color: '#ffffff',
                                                        borderRadius: '8px',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        margin: 0
                                                    }}
                                                >
                                                    <i className="fa-solid fa-cloud-arrow-up"></i>
                                                    {logoPreview ? 'Change Image' : 'Upload Image'}
                                                </label>
                                                <input 
                                                    type="file" 
                                                    id="org_logo_upload" 
                                                    accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp" 
                                                    style={{ display: 'none' }} 
                                                    onChange={handleLogoChange}
                                                />
                                                {logoPreview && (
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveLogo}
                                                        style={{
                                                            padding: '7px 12px',
                                                            background: '#FEF2F2',
                                                            color: '#DC2626',
                                                            border: '1px solid #FECACA',
                                                            borderRadius: '8px',
                                                            fontSize: '12.5px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-trash-can"></i> Remove
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                                                PNG, JPG, SVG, or WebP (Max 2MB). Recommended square aspect ratio.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* 2. Module Access Card */}
                            <div className="card" style={{
                                background: 'var(--bg-card, #ffffff)',
                                padding: 'clamp(16px, 3vw, 24px)',
                                borderRadius: '16px',
                                marginBottom: '24px',
                                border: '1px solid var(--border-color, #e2e8f0)',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <h3 style={{ marginTop: 0, color: 'var(--text-main, #1e293b)', fontSize: '18px', fontWeight: '700' }}>
                                    2. Licensed Modules
                                </h3>
                                <hr style={{ border: 0, borderTop: '1px solid var(--border-color, #e2e8f0)', marginBottom: '20px' }} />
                                
                                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            name="cms_enabled" 
                                            id="cms_enabled_checkbox" 
                                            checked={cmsEnabled}
                                            onChange={(e) => setCmsEnabled(e.target.checked)}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary, #6366f1)', cursor: 'pointer' }} 
                                        />
                                        <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main, #1e293b)' }}>CMS Module: Core Base</span>
                                    </label>
                                    
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            name="lms_enabled" 
                                            id="lms_enabled_checkbox" 
                                            checked={lmsEnabled}
                                            onChange={(e) => setLmsEnabled(e.target.checked)}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary, #6366f1)', cursor: 'pointer' }} 
                                        />
                                        <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main, #1e293b)' }}>Enable LMS &amp; Classroom Engine</span>
                                    </label>
                                </div>
                            </div>
                            
                            {/* 3. Assign Plan Card */}
                            <div className="card" style={{
                                background: 'var(--bg-card, #ffffff)',
                                padding: 'clamp(16px, 3vw, 24px)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color, #e2e8f0)',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <h3 style={{ marginTop: 0, color: 'var(--text-main, #1e293b)', fontSize: '18px', fontWeight: '700' }}>
                                    3. Subscription Plan Package
                                </h3>
                                <hr style={{ border: 0, borderTop: '1px solid var(--border-color, #e2e8f0)', marginBottom: '20px' }} />
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px' }}>
                                    {(plans || []).map(plan => (
                                        <div 
                                            key={plan.id}
                                            onClick={() => setSelectedPlanId(plan.id)}
                                            style={{
                                                border: selectedPlanId === plan.id ? '2px solid var(--primary, #6366f1)' : '1px solid var(--border-color, #e2e8f0)',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                cursor: 'pointer',
                                                background: selectedPlanId === plan.id ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card, #ffffff)',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px', color: 'var(--text-main, #1e293b)' }}>{plan.name}</div>
                                            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary, #6366f1)', marginBottom: '8px' }}>
                                                ₹{(Number(plan.price) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted, #64748b)' }}> / {plan.duration_months || plan.durationMonths || 1}mo</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', lineHeight: '1.4' }}>{plan.features}</div>
                                            
                                            {selectedPlanId === plan.id && (
                                                <div style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--primary, #6366f1)', fontSize: '16px' }}>
                                                    <i className="fa-solid fa-circle-check"></i>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Summary / Confirmation Column */}
                        <div>
                            <div className="card" style={{
                                background: 'var(--bg-card, #ffffff)',
                                padding: 'clamp(16px, 3vw, 24px)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color, #e2e8f0)',
                                boxShadow: 'var(--shadow-sm)',
                                position: 'sticky',
                                top: '20px'
                            }}>
                                <h3 style={{ marginTop: 0, color: 'var(--text-main, #1e293b)', fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                                    Provisioning Summary
                                </h3>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', marginBottom: '20px' }}>License Review &amp; Order Confirmation</div>
                                
                                {logoPreview && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                                        <img src={logoPreview} alt="Institution logo preview" style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '8px', background: '#ffffff', padding: '2px', border: '1px solid var(--border-color, #e2e8f0)' }} />
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #1e293b)' }}>{name || 'New Organization'}</div>
                                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748b)' }}>{code ? `Code: ${code}` : 'Emblem Attached'}</div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px' }}>
                                        <span style={{ color: 'var(--text-muted, #64748b)' }}>Selected Plan:</span>
                                        <span style={{ fontWeight: '700', color: 'var(--text-main, #1e293b)' }}>{selectedPlan.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px' }}>
                                        <span style={{ color: 'var(--text-muted, #64748b)' }}>Billing Duration:</span>
                                        <span style={{ fontWeight: '600', color: 'var(--text-main, #1e293b)' }}>{selectedPlan.durationMonths || selectedPlan.duration_months} Month(s)</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px' }}>
                                        <span style={{ color: 'var(--text-muted, #64748b)' }}>CMS Feature:</span>
                                        <span style={{ fontWeight: '600', color: cmsEnabled ? '#16a34a' : '#64748b' }}>{cmsEnabled ? 'Enabled' : 'Disabled'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px' }}>
                                        <span style={{ color: 'var(--text-muted, #64748b)' }}>LMS Feature:</span>
                                        <span style={{ fontWeight: '600', color: lmsEnabled ? '#16a34a' : '#64748b' }}>{lmsEnabled ? 'Enabled' : 'Disabled'}</span>
                                    </div>
                                    <hr style={{ border: 0, borderTop: '1px dashed var(--border-color, #cbd5e1)', margin: '14px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px' }}>
                                        <span style={{ fontWeight: '700', color: 'var(--text-main, #1e293b)' }}>Total Due:</span>
                                        <span style={{ fontWeight: '800', color: 'var(--primary, #6366f1)' }}>
                                            ₹{Number(selectedPlan.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: '20px', background: 'rgba(0, 0, 0, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            name="confirm_payment" 
                                            checked={confirmPayment}
                                            onChange={(e) => setConfirmPayment(e.target.checked)}
                                            style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--primary, #6366f1)' }} 
                                        />
                                        <span style={{ fontSize: '13px', color: 'var(--text-main, #334155)', lineHeight: '1.4' }}>
                                            Record this as an active paid subscription in Payment History.
                                        </span>
                                    </label>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="btn btn-primary" 
                                    style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: '700', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: loading ? 'not-allowed' : 'pointer' }}
                                >
                                    <i className={loading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-check"}></i>
                                    <span>{loading ? (isEdit ? 'Updating in PostgreSQL...' : 'Provisioning Campus in PostgreSQL...') : (isEdit ? 'Save Changes' : 'Provision Campus & Launch')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </section>
        </>
    );
};

export default SuperAdminOrgForm;
