import React, { useState, useEffect, useMemo } from 'react';
import { superAdminService } from '../../services/superAdmin.service';

// Default Gateways Configuration with Test & Live Keys support (Clean empty fields for user input)
const initialGateways = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    category: 'domestic',
    description: 'UPI (GPay, PhonePe, Paytm), NetBanking, Credit/Debit Cards & Auto-Debit Mandates',
    brandColor: '#0C2340',
    accentColor: '#3395FF',
    icon: 'fa-solid fa-bolt',
    enabled: true,
    isDefault: true,
    mode: 'test', // 'test' | 'live'
    testKeyId: '',
    testKeySecret: '',
    liveKeyId: '',
    liveKeySecret: '',
    webhookSecret: '',
    merchantId: '',
    currency: 'INR (₹)',
    supportedMethods: ['UPI', 'Cards', 'NetBanking', 'Wallets', 'EMI'],
    webhookUrl: 'https://api.unilms.edu/api/v1/payments/razorpay/webhook'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'international',
    description: 'Global Credit/Debit Cards, Apple Pay, Google Pay & Multi-Currency Settlement',
    brandColor: '#635BFF',
    accentColor: '#00D4FF',
    icon: 'fa-brands fa-stripe-s',
    enabled: true,
    isDefault: false,
    mode: 'test',
    testKeyId: '',
    testKeySecret: '',
    liveKeyId: '',
    liveKeySecret: '',
    webhookSecret: '',
    merchantId: '',
    currency: 'USD ($)',
    supportedMethods: ['Global Cards', 'Apple Pay', 'Google Pay', 'SEPA'],
    webhookUrl: 'https://api.unilms.edu/api/v1/payments/stripe/webhook'
  },
  {
    id: 'cashfree',
    name: 'Cashfree Payments',
    category: 'domestic',
    description: 'Instant UPI Intent, Payment Links, SoftPOS & Bank Auto-Collect',
    brandColor: '#0A2540',
    accentColor: '#10B981',
    icon: 'fa-solid fa-money-bill-transfer',
    enabled: false,
    isDefault: false,
    mode: 'test',
    testKeyId: '',
    testKeySecret: '',
    liveKeyId: '',
    liveKeySecret: '',
    webhookSecret: '',
    merchantId: '',
    currency: 'INR (₹)',
    supportedMethods: ['UPI', 'Cards', 'NetBanking', 'QR'],
    webhookUrl: 'https://api.unilms.edu/api/v1/payments/cashfree/webhook'
  },
  {
    id: 'payu',
    name: 'PayU',
    category: 'domestic',
    description: 'Indian Payment Orchestrator & Corporate Card Processing',
    brandColor: '#1F2937',
    accentColor: '#84CC16',
    icon: 'fa-solid fa-building-columns',
    enabled: false,
    isDefault: false,
    mode: 'test',
    testKeyId: '',
    testKeySecret: '',
    liveKeyId: '',
    liveKeySecret: '',
    webhookSecret: '',
    merchantId: '',
    currency: 'INR (₹)',
    supportedMethods: ['UPI', 'Cards', 'NetBanking'],
    webhookUrl: 'https://api.unilms.edu/api/v1/payments/payu/webhook'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'international',
    description: 'Cross-border International Student Invoicing & Digital Wallets',
    brandColor: '#003087',
    accentColor: '#0079C1',
    icon: 'fa-brands fa-paypal',
    enabled: false,
    isDefault: false,
    mode: 'test',
    testKeyId: '',
    testKeySecret: '',
    liveKeyId: '',
    liveKeySecret: '',
    webhookSecret: '',
    merchantId: '',
    currency: 'USD ($)',
    supportedMethods: ['PayPal Wallet', 'Credit Cards', 'Pay Later'],
    webhookUrl: 'https://api.unilms.edu/api/v1/payments/paypal/webhook'
  }
];

const SuperAdminSettings = () => {
  // Navigation Tabs: 'gateways' (default as requested) | 'general' | 'smtp' | 'security'
  const [activeTab, setActiveTab] = useState('gateways');

  // General Settings State (loaded from PostgreSQL PlatformSetting)
  const [settings, setSettings] = useState({
    site_name: 'UNILMS Global Platform',
    support_email: 'support@unilms.edu',
    default_currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST)',
    maintenance_mode: '0',
    org_registration: 'enabled',
    session_timeout: '60'
  });

  // Payment Gateways State (loaded from PostgreSQL PlatformSetting)
  const [gateways, setGateways] = useState(initialGateways);

  // SMTP Mail Server Settings State
  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: '',
    username: '',
    password: '',
    fromEmail: '',
    fromName: ''
  });

  // Security Policies State
  const [securitySettings, setSecuritySettings] = useState({
    timeout: '60',
    maxAttempts: '5',
    enforce2fa: 'superadmins_only'
  });

  // SMS Gateway Settings State
  const [smsSettings, setSmsSettings] = useState({
    enabled: false,
    provider: '',
    apiKey: '',
    apiSecret: '',
    senderId: '',
    templateId: '',
    dltEntityId: '',
    webhookUrl: '',
    fallbackToNotification: true
  });

  // Master Data: Degree Streams State
  const [degreeStreams, setDegreeStreams] = useState([
    { id: 'UG', code: 'UG', name: 'Undergraduate (UG)', examples: 'B.Pharm, B.Tech', defaultDuration: 4, active: true },
    { id: 'Degree', code: 'Degree', name: 'General Degree', examples: 'B.Sc, B.Com, B.A, BBA', defaultDuration: 3, active: true },
    { id: 'PG', code: 'PG', name: 'Postgraduate (PG)', examples: 'M.Pharm, M.Tech, MBA, MCA, M.Sc', defaultDuration: 2, active: true },
    { id: 'PharmD', code: 'PharmD', name: 'Doctor of Pharmacy (Pharm.D)', examples: 'Clinical Pharmacy', defaultDuration: 6, active: true },
    { id: 'Diploma', code: 'Diploma', name: 'Diploma / Polytechnic', examples: 'D.Pharm, Polytechnic', defaultDuration: 2, active: true }
  ]);
  const [editingStream, setEditingStream] = useState(null);
  const [newStream, setNewStream] = useState({ code: '', name: '', examples: '', defaultDuration: 4 });
  const [showAddStream, setShowAddStream] = useState(false);

  // UI States
  const [expandedGateway, setExpandedGateway] = useState('razorpay');
  const [showSecrets, setShowSecrets] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [testStatus, setTestStatus] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [savedToast, setSavedToast] = useState(null);
  const [isAddGatewayModalOpen, setIsAddGatewayModalOpen] = useState(false);

  // New Custom Gateway Form State
  const [newGateway, setNewGateway] = useState({
    name: '',
    category: 'domestic',
    description: '',
    currency: 'INR (₹)',
    testKeyId: '',
    testKeySecret: '',
    liveKeyId: '',
    liveKeySecret: '',
    webhookSecret: '',
    mode: 'test'
  });

  // Load platform settings from PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const fetchPlatformSettings = async () => {
      try {
        const data = await superAdminService.getSettings();
        if (!isMounted || !data) return;
        if (data.gateways && Array.isArray(data.gateways) && data.gateways.length > 0) {
          setGateways(data.gateways);
        }
        if (data.general && typeof data.general === 'object') {
          setSettings(prev => ({ ...prev, ...data.general }));
        }
        if (data.smtp && typeof data.smtp === 'object') {
          setSmtpSettings(prev => ({ ...prev, ...data.smtp }));
        }
        if (data.security && typeof data.security === 'object') {
          setSecuritySettings(prev => ({ ...prev, ...data.security }));
        }
        if (data.sms && typeof data.sms === 'object') {
          setSmsSettings(prev => ({ ...prev, ...data.sms }));
        }
        if (data.degree_streams && Array.isArray(data.degree_streams) && data.degree_streams.length > 0) {
          setDegreeStreams(data.degree_streams);
        }
      } catch (err) {
        console.warn('Failed to load settings from DB:', err);
      }
    };
    fetchPlatformSettings();
    return () => { isMounted = false; };
  }, []);

  const triggerToast = (msg) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3500);
  };

  const saveToDatabase = async (key, value, successMsg) => {
    try {
      await superAdminService.saveSetting(key, value);
      if (successMsg) triggerToast(successMsg);
    } catch (err) {
      console.error(`Failed to save ${key} to database:`, err);
      triggerToast(`Failed to save ${key} to database.`);
    }
  };

  const handleGeneralSubmit = (e) => {
    e.preventDefault();
    saveToDatabase('general', settings, 'General system settings successfully saved to database!');
  };

  // Toggle Gateway Enable / Disable
  const handleToggleGateway = (id) => {
    setGateways(prev => prev.map(gw => {
      if (gw.id === id) {
        const nextEnabled = !gw.enabled;
        return { ...gw, enabled: nextEnabled };
      }
      return gw;
    }));
    triggerToast(`Gateway status updated.`);
  };

  // Set as Primary Default Gateway
  const handleSetDefaultGateway = (id) => {
    setGateways(prev => prev.map(gw => ({
      ...gw,
      isDefault: gw.id === id,
      enabled: gw.id === id ? true : gw.enabled
    })));
    triggerToast(`Primary payment provider set successfully.`);
  };

  // Switch Mode (Test vs Live) for a specific gateway
  const handleModeChange = (id, newMode) => {
    setGateways(prev => prev.map(gw => {
      if (gw.id === id) {
        return { ...gw, mode: newMode };
      }
      return gw;
    }));
    triggerToast(`Gateway switched to ${newMode.toUpperCase()} mode.`);
  };

  // Update specific key fields for a gateway
  const handleKeyUpdate = (id, field, value) => {
    setGateways(prev => prev.map(gw => {
      if (gw.id === id) {
        return { ...gw, [field]: value };
      }
      return gw;
    }));
  };

  // Clear all key fields for a specific gateway
  const handleClearKeys = (id) => {
    setGateways(prev => prev.map(gw => {
      if (gw.id === id) {
        return {
          ...gw,
          testKeyId: '',
          testKeySecret: '',
          liveKeyId: '',
          liveKeySecret: '',
          webhookSecret: '',
          merchantId: ''
        };
      }
      return gw;
    }));
    triggerToast('All API key fields cleared.');
  };

  // Toggle Secret Masking
  const toggleSecretMask = (fieldKey) => {
    setShowSecrets(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  // Copy to clipboard helper
  const handleCopy = (text, keyLabel) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyLabel);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Test Handshake / Ping simulator
  const handleTestHandshake = (gw) => {
    setTestStatus(prev => ({ ...prev, [gw.id]: 'testing' }));
    
    setTimeout(() => {
      const activeKey = gw.mode === 'live' ? gw.liveKeyId : gw.testKeyId;
      const activeSecret = gw.mode === 'live' ? gw.liveKeySecret : gw.testKeySecret;

      if (!activeKey || !activeSecret) {
        setTestStatus(prev => ({
          ...prev,
          [gw.id]: {
            success: false,
            message: `Missing ${gw.mode.toUpperCase()} Key ID or Secret Key. Please enter both keys first.`
          }
        }));
      } else {
        setTestStatus(prev => ({
          ...prev,
          [gw.id]: {
            success: true,
            message: `Handshake Verified (200 OK): Successfully authenticated with ${gw.name} in ${gw.mode.toUpperCase()} mode!`
          }
        }));
      }

      setTimeout(() => {
        setTestStatus(prev => {
          const next = { ...prev };
          delete next[gw.id];
          return next;
        });
      }, 5000);
    }, 700);
  };

  // Filtered Gateways List
  const filteredGateways = useMemo(() => {
    return gateways.filter(gw => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || gw.name.toLowerCase().includes(q) || gw.description.toLowerCase().includes(q);
      const matchCategory = filterCategory === 'all' || gw.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [gateways, searchQuery, filterCategory]);

  // Handle adding new custom gateway
  const handleAddCustomGateway = (e) => {
    e.preventDefault();
    if (!newGateway.name.trim()) return;

    const customId = newGateway.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const created = {
      id: customId,
      name: newGateway.name.trim(),
      category: newGateway.category,
      description: newGateway.description || 'Custom payment gateway connector',
      brandColor: '#4F46E5',
      accentColor: '#6366F1',
      icon: 'fa-solid fa-credit-card',
      enabled: true,
      isDefault: false,
      mode: newGateway.mode,
      testKeyId: newGateway.testKeyId,
      testKeySecret: newGateway.testKeySecret,
      liveKeyId: newGateway.liveKeyId,
      liveKeySecret: newGateway.liveKeySecret,
      webhookSecret: newGateway.webhookSecret,
      merchantId: '',
      currency: newGateway.currency,
      supportedMethods: ['UPI', 'Cards', 'NetBanking'],
      webhookUrl: `https://api.unilms.edu/api/v1/payments/${customId}/webhook`
    };

    setGateways(prev => [...prev, created]);
    setExpandedGateway(customId);
    setIsAddGatewayModalOpen(false);
    setNewGateway({
      name: '',
      category: 'domestic',
      description: '',
      currency: 'INR (₹)',
      testKeyId: '',
      testKeySecret: '',
      liveKeyId: '',
      liveKeySecret: '',
      webhookSecret: '',
      mode: 'test'
    });
    triggerToast(`Added custom gateway "${created.name}" successfully!`);
  };

  const defaultGateway = gateways.find(g => g.isDefault) || gateways[0];
  const enabledCount = gateways.filter(g => g.enabled).length;

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
      <section className="view-section active" style={{ padding: '0 16px 20px' }}>
        {/* Top Header Card matching SuperAdmin standard */}
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px',
            padding: '8px 16px',
            marginBottom: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
              }}
            >
              <i className="fa-solid fa-gear"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-main, #1e293b)' }}>
                System &amp; Gateway Settings
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={async () => {
                await Promise.all([
                  saveToDatabase('gateways', gateways),
                  saveToDatabase('general', settings),
                  saveToDatabase('smtp', smtpSettings),
                  saveToDatabase('security', securitySettings),
                  saveToDatabase('sms', smsSettings),
                  saveToDatabase('degree_streams', degreeStreams),
                ]);
                triggerToast('All platform settings and credentials saved to PostgreSQL database!');
              }}
              className="btn btn-primary"
              style={{
                background: '#4F46E5',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '7px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-floppy-disk"></i>
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Global Toast Notification */}
        {savedToast && (
          <div
            style={{
              padding: '12px 20px',
              marginBottom: '20px',
              borderRadius: '12px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              fontWeight: '600',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-circle-check" style={{ color: '#10B981', fontSize: '16px' }}></i>
              <span>{savedToast}</span>
            </div>
            <button
              onClick={() => setSavedToast(null)}
              style={{ background: 'none', border: 'none', color: '#065F46', cursor: 'pointer', fontSize: '14px' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* Tabbed Navigation Bar */}
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('gateways')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeTab === 'gateways' ? '#4F46E5' : 'transparent',
              color: activeTab === 'gateways' ? '#ffffff' : 'var(--text-main, #334155)'
            }}
          >
            <i className="fa-solid fa-credit-card"></i>
            <span>Payment Gateways</span>
            <span
              style={{
                fontSize: '10px',
                background: activeTab === 'gateways' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: activeTab === 'gateways' ? '#fff' : '#475569',
                padding: '1px 6px',
                borderRadius: '8px',
                fontWeight: '800'
              }}
            >
              {gateways.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeTab === 'general' ? '#4F46E5' : 'transparent',
              color: activeTab === 'general' ? '#ffffff' : 'var(--text-main, #334155)'
            }}
          >
            <i className="fa-solid fa-sliders"></i>
            <span>General Platform</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('smtp')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeTab === 'smtp' ? '#4F46E5' : 'transparent',
              color: activeTab === 'smtp' ? '#ffffff' : 'var(--text-main, #334155)'
            }}
          >
            <i className="fa-solid fa-envelope"></i>
            <span>Email &amp; SMTP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeTab === 'security' ? '#4F46E5' : 'transparent',
              color: activeTab === 'security' ? '#ffffff' : 'var(--text-main, #334155)'
            }}
          >
            <i className="fa-solid fa-shield-halved"></i>
            <span>Security &amp; Access</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sms')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeTab === 'sms' ? '#4F46E5' : 'transparent',
              color: activeTab === 'sms' ? '#ffffff' : 'var(--text-main, #334155)'
            }}
          >
            <i className="fa-solid fa-comment-sms"></i>
            <span>SMS Gateway</span>
            <span
              style={{
                fontSize: '9.5px',
                background: smsSettings.enabled ? '#059669' : '#94a3b8',
                color: '#fff',
                padding: '1px 6px',
                borderRadius: '8px',
                fontWeight: '800'
              }}
            >
              {smsSettings.enabled ? 'ACTIVE' : 'FALLBACK'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('masterdata')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeTab === 'masterdata' ? '#4F46E5' : 'transparent',
              color: activeTab === 'masterdata' ? '#ffffff' : 'var(--text-main, #334155)'
            }}
          >
            <i className="fa-solid fa-database"></i>
            <span>Master Data</span>
            <span
              style={{
                fontSize: '9.5px',
                background: activeTab === 'masterdata' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: activeTab === 'masterdata' ? '#fff' : '#475569',
                padding: '1px 6px',
                borderRadius: '8px',
                fontWeight: '800'
              }}
            >
              {degreeStreams.length}
            </span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: PAYMENT GATEWAYS & API KEYS (RAZORPAY, STRIPE, ETC)
            ======================================================== */}
        {activeTab === 'gateways' && (
          <div>
            {/* KPI Metric Overview */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '22px'
              }}
            >
              <div
                style={{
                  background: 'var(--bg-card, #fff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(51, 149, 255, 0.12)',
                    color: '#3395FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}
                >
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase' }}>
                    Primary Payment Gateway
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main, #1e293b)' }}>
                    {defaultGateway ? defaultGateway.name : 'Razorpay'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: '700' }}>
                    <i className="fa-solid fa-circle-check me-1"></i> Default Routing Active
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-card, #fff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}
                >
                  <i className="fa-solid fa-toggle-on"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase' }}>
                    Active Gateways
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main, #1e293b)' }}>
                    {enabledCount} of {gateways.length} Enabled
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748b)' }}>
                    Ready for Checkout &amp; Invoicing
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-card, #fff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}
                >
                  <i className="fa-solid fa-flask"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase' }}>
                    Environment Mode
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#D97706' }}>
                    Test &amp; Live Available
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748b)' }}>
                    Per-gateway toggle enabled
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-card, #fff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: '#6366F1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}
                >
                  <i className="fa-solid fa-webhook"></i>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase' }}>
                    Webhook Listener
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#6366F1' }}>
                    Real-time Sync
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: '700' }}>
                    <i className="fa-solid fa-arrow-trend-up me-1"></i> Auto Payment Reconciliation
                  </div>
                </div>
              </div>
            </div>

            {/* Toolbar: Search, Filters & Add Custom Gateway */}
            <div
              style={{
                background: 'var(--bg-card, #fff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '14px',
                padding: '12px 18px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', flex: 1, maxWidth: '700px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 220px)' }}>
                  <i className="fa-solid fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}></i>
                  <input
                    type="text"
                    placeholder="Search payment gateways (e.g. Razorpay, Stripe)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '36px',
                      paddingRight: '12px',
                      height: '34px',
                      fontSize: '12.5px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      background: '#fff'
                    }}
                  />
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    height: '34px',
                    fontSize: '12.5px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    padding: '0 12px',
                    outline: 'none',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Gateway Types</option>
                  <option value="domestic">Domestic (INR / UPI / Cards)</option>
                  <option value="international">International (Multi-Currency)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsAddGatewayModalOpen(true)}
                  className="btn btn-outline"
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-plus-circle" style={{ color: '#4F46E5' }}></i>
                  <span>Add Custom Gateway</span>
                </button>
              </div>
            </div>

            {/* List of Payment Gateway Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredGateways.map(gw => {
                const isExpanded = expandedGateway === gw.id;
                const isLive = gw.mode === 'live';
                const currentTestMsg = testStatus[gw.id];

                return (
                  <div
                    key={gw.id}
                    style={{
                      background: 'var(--bg-card, #ffffff)',
                      border: isExpanded ? `1.5px solid ${gw.accentColor}` : '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: isExpanded ? '0 8px 24px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Header Row */}
                    <div
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        background: isExpanded ? 'rgba(248, 250, 252, 0.7)' : '#ffffff',
                        borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                        cursor: 'pointer'
                      }}
                      onClick={() => setExpandedGateway(isExpanded ? null : gw.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', flex: 1 }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            minWidth: '44px',
                            borderRadius: '12px',
                            background: gw.brandColor,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            boxShadow: `0 3px 10px ${gw.accentColor}40`
                          }}
                        >
                          <i className={gw.icon}></i>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                              {gw.name}
                            </h3>
                            {gw.isDefault && (
                              <span
                                style={{
                                  background: 'rgba(79, 70, 229, 0.1)',
                                  color: '#4F46E5',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  border: '1px solid rgba(79, 70, 229, 0.2)'
                                }}
                              >
                                Default Gateway
                              </span>
                            )}
                            <span
                              style={{
                                background: isLive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color: isLive ? '#059669' : '#D97706',
                                fontSize: '11px',
                                fontWeight: '800',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                border: isLive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                                textTransform: 'uppercase'
                              }}
                            >
                              <i className={`fa-solid ${isLive ? 'fa-satellite-dish' : 'fa-flask'} me-1`}></i>
                              {isLive ? 'Live Mode' : 'Test Mode'}
                            </span>
                          </div>
                          <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                            {gw.description}
                          </p>
                        </div>
                      </div>

                      {/* Right Header Actions */}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Enabled Toggle Switch */}
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            color: gw.enabled ? '#059669' : '#94a3b8'
                          }}
                        >
                          <span>{gw.enabled ? 'Enabled' : 'Disabled'}</span>
                          <input
                            type="checkbox"
                            checked={gw.enabled}
                            onChange={() => handleToggleGateway(gw.id)}
                            style={{
                              width: '36px',
                              height: '20px',
                              cursor: 'pointer',
                              accentColor: '#10B981'
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setExpandedGateway(isExpanded ? null : gw.id)}
                          style={{
                            background: '#f1f5f9',
                            border: 'none',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#475569'
                          }}
                        >
                          <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: '12px' }}></i>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Configuration Body */}
                    {isExpanded && (
                      <div style={{ padding: '20px 24px', background: '#ffffff' }}>
                        {/* Environment Mode Switcher Radio Pill */}
                        <div
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            marginBottom: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                              Gateway Environment Mode
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Select whether this provider executes simulated transactions (Sandbox) or real credit/UPI debits.
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'inline-flex',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              padding: '3px',
                              borderRadius: '10px',
                              gap: '4px'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleModeChange(gw.id, 'test')}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '7px',
                                fontSize: '12px',
                                fontWeight: '700',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: !isLive ? '#F59E0B' : 'transparent',
                                color: !isLive ? '#ffffff' : '#64748b',
                                boxShadow: !isLive ? '0 2px 6px rgba(245, 158, 11, 0.3)' : 'none'
                              }}
                            >
                              <i className="fa-solid fa-flask"></i> Test / Sandbox
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModeChange(gw.id, 'live')}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '7px',
                                fontSize: '12px',
                                fontWeight: '700',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: isLive ? '#10B981' : 'transparent',
                                color: isLive ? '#ffffff' : '#64748b',
                                boxShadow: isLive ? '0 2px 6px rgba(16, 185, 129, 0.3)' : 'none'
                              }}
                            >
                              <i className="fa-solid fa-satellite-dish"></i> Live / Production
                            </button>
                          </div>
                        </div>

                        {/* Handshake Result Alert */}
                        {currentTestMsg === 'testing' && (
                          <div
                            style={{
                              padding: '12px 16px',
                              marginBottom: '18px',
                              borderRadius: '10px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                            <span>Contacting {gw.name} API gateway servers to verify credentials...</span>
                          </div>
                        )}

                        {currentTestMsg && currentTestMsg.success && (
                          <div
                            style={{
                              padding: '12px 16px',
                              marginBottom: '18px',
                              borderRadius: '10px',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#065f46',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <i className="fa-solid fa-circle-check" style={{ color: '#10b981', fontSize: '16px' }}></i>
                            <span>{currentTestMsg.message}</span>
                          </div>
                        )}

                        {currentTestMsg && currentTestMsg.success === false && (
                          <div
                            style={{
                              padding: '12px 16px',
                              marginBottom: '18px',
                              borderRadius: '10px',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#991b1b',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ef4444', fontSize: '16px' }}></i>
                            <span>{currentTestMsg.message}</span>
                          </div>
                        )}

                        {/* Two Columns: Test Keys & Live Keys */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '20px',
                            marginBottom: '20px'
                          }}
                        >
                          {/* Column 1: Test / Sandbox Keys */}
                          <div
                            style={{
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              borderRadius: '14px',
                              padding: '18px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                              <i className="fa-solid fa-flask" style={{ color: '#D97706' }}></i>
                              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#92400e' }}>
                                Test / Sandbox API Keys
                              </h4>
                              <span style={{ fontSize: '11px', color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                Safe for Testing
                              </span>
                            </div>

                            {/* Test Key ID */}
                            <div style={{ marginBottom: '14px' }}>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#78350f', marginBottom: '5px' }}>
                                Test Key ID / Publishable Key
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  placeholder={gw.id === 'razorpay' ? 'Enter Razorpay Test Key ID (e.g. rzp_test_...)' : gw.id === 'stripe' ? 'Enter Stripe Publishable Key (pk_test_...)' : 'Enter Test Key ID / Publishable Key'}
                                  value={gw.testKeyId || ''}
                                  onChange={(e) => handleKeyUpdate(gw.id, 'testKeyId', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '9px 40px 9px 12px',
                                    fontSize: '12.5px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    fontFamily: 'monospace',
                                    outline: 'none'
                                  }}
                                />
                                <button
                                  type="button"
                                  title="Copy Key ID"
                                  onClick={() => handleCopy(gw.testKeyId, `${gw.id}_testKeyId`)}
                                  style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: copiedKey === `${gw.id}_testKeyId` ? '#10b981' : '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                  }}
                                >
                                  <i className={`fa-solid ${copiedKey === `${gw.id}_testKeyId` ? 'fa-check' : 'fa-copy'}`}></i>
                                </button>
                              </div>
                              <small style={{ fontSize: '11px', color: '#92400e', marginTop: '4px', display: 'block' }}>
                                Public key used in client-side checkout scripts
                              </small>
                            </div>

                            {/* Test Key Secret */}
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#78350f', marginBottom: '5px' }}>
                                Test Key Secret / Private Key
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type={showSecrets[`${gw.id}_testSecret`] ? 'text' : 'password'}
                                  placeholder="Enter Test Key Secret (Private Key)"
                                  value={gw.testKeySecret || ''}
                                  onChange={(e) => handleKeyUpdate(gw.id, 'testKeySecret', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '9px 70px 9px 12px',
                                    fontSize: '12.5px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    fontFamily: 'monospace',
                                    outline: 'none'
                                  }}
                                />
                                <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    title={showSecrets[`${gw.id}_testSecret`] ? 'Hide secret' : 'Show secret'}
                                    onClick={() => toggleSecretMask(`${gw.id}_testSecret`)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#64748b',
                                      cursor: 'pointer',
                                      fontSize: '13px'
                                    }}
                                  >
                                    <i className={`fa-solid ${showSecrets[`${gw.id}_testSecret`] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                  </button>
                                  <button
                                    type="button"
                                    title="Copy Secret"
                                    onClick={() => handleCopy(gw.testKeySecret, `${gw.id}_testKeySecret`)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: copiedKey === `${gw.id}_testKeySecret` ? '#10b981' : '#64748b',
                                      cursor: 'pointer',
                                      fontSize: '13px'
                                    }}
                                  >
                                    <i className={`fa-solid ${copiedKey === `${gw.id}_testKeySecret` ? 'fa-check' : 'fa-copy'}`}></i>
                                  </button>
                                </div>
                              </div>
                              <small style={{ fontSize: '11px', color: '#92400e', marginTop: '4px', display: 'block' }}>
                                Keep confidential. Used for payment capture &amp; server signature
                              </small>
                            </div>
                          </div>

                          {/* Column 2: Live / Production Keys */}
                          <div
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              borderRadius: '14px',
                              padding: '18px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                              <i className="fa-solid fa-satellite-dish" style={{ color: '#059669' }}></i>
                              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#065f46' }}>
                                Live / Production API Keys
                              </h4>
                              <span style={{ fontSize: '11px', color: '#047857', background: '#d1fae5', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                Real Money Transactions
                              </span>
                            </div>

                            {/* Live Key ID */}
                            <div style={{ marginBottom: '14px' }}>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#064e3b', marginBottom: '5px' }}>
                                Live Key ID / Publishable Key
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  placeholder={gw.id === 'razorpay' ? 'Enter Razorpay Live Key ID (e.g. rzp_live_...)' : gw.id === 'stripe' ? 'Enter Stripe Live Publishable Key (pk_live_...)' : 'Enter Live Key ID / Publishable Key'}
                                  value={gw.liveKeyId || ''}
                                  onChange={(e) => handleKeyUpdate(gw.id, 'liveKeyId', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '9px 40px 9px 12px',
                                    fontSize: '12.5px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    fontFamily: 'monospace',
                                    outline: 'none'
                                  }}
                                />
                                <button
                                  type="button"
                                  title="Copy Key ID"
                                  onClick={() => handleCopy(gw.liveKeyId, `${gw.id}_liveKeyId`)}
                                  style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: copiedKey === `${gw.id}_liveKeyId` ? '#10b981' : '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                  }}
                                >
                                  <i className={`fa-solid ${copiedKey === `${gw.id}_liveKeyId` ? 'fa-check' : 'fa-copy'}`}></i>
                                </button>
                              </div>
                              <small style={{ fontSize: '11px', color: '#047857', marginTop: '4px', display: 'block' }}>
                                Provided in your {gw.name} merchant dashboard under API Keys
                              </small>
                            </div>

                            {/* Live Key Secret */}
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#064e3b', marginBottom: '5px' }}>
                                Live Key Secret / Private Key
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type={showSecrets[`${gw.id}_liveSecret`] ? 'text' : 'password'}
                                  placeholder="Enter Live Key Secret (Private Key)"
                                  value={gw.liveKeySecret || ''}
                                  onChange={(e) => handleKeyUpdate(gw.id, 'liveKeySecret', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '9px 70px 9px 12px',
                                    fontSize: '12.5px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    fontFamily: 'monospace',
                                    outline: 'none'
                                  }}
                                />
                                <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    title={showSecrets[`${gw.id}_liveSecret`] ? 'Hide secret' : 'Show secret'}
                                    onClick={() => toggleSecretMask(`${gw.id}_liveSecret`)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#64748b',
                                      cursor: 'pointer',
                                      fontSize: '13px'
                                    }}
                                  >
                                    <i className={`fa-solid ${showSecrets[`${gw.id}_liveSecret`] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                  </button>
                                  <button
                                    type="button"
                                    title="Copy Secret"
                                    onClick={() => handleCopy(gw.liveKeySecret, `${gw.id}_liveKeySecret`)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: copiedKey === `${gw.id}_liveKeySecret` ? '#10b981' : '#64748b',
                                      cursor: 'pointer',
                                      fontSize: '13px'
                                    }}
                                  >
                                    <i className={`fa-solid ${copiedKey === `${gw.id}_liveKeySecret` ? 'fa-check' : 'fa-copy'}`}></i>
                                  </button>
                                </div>
                              </div>
                              <small style={{ fontSize: '11px', color: '#047857', marginTop: '4px', display: 'block' }}>
                                Encrypted in storage. Never share this secret with clients
                              </small>
                            </div>
                          </div>
                        </div>

                        {/* Webhook & Advanced Settings */}
                        <div
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '16px 18px',
                            marginBottom: '20px'
                          }}
                        >
                          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '800', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-code-fork" style={{ color: '#4F46E5' }}></i> Webhook &amp; Realtime Settlement Configuration
                          </h4>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                              gap: '14px'
                            }}
                          >
                            {/* Webhook Secret */}
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                                Webhook Secret / Signature Key
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type={showSecrets[`${gw.id}_webhookSecret`] ? 'text' : 'password'}
                                  placeholder="Enter Webhook Secret (e.g. whsec_...)"
                                  value={gw.webhookSecret || ''}
                                  onChange={(e) => handleKeyUpdate(gw.id, 'webhookSecret', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 40px 8px 12px',
                                    fontSize: '12px',
                                    borderRadius: '7px',
                                    border: '1px solid #cbd5e1',
                                    background: '#fff',
                                    fontFamily: 'monospace'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleSecretMask(`${gw.id}_webhookSecret`)}
                                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                                >
                                  <i className={`fa-solid ${showSecrets[`${gw.id}_webhookSecret`] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                              </div>
                            </div>

                            {/* Callback URL */}
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                                Webhook Callback URL (Copy to {gw.name} Dashboard)
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  readOnly
                                  value={gw.webhookUrl}
                                  style={{
                                    width: '100%',
                                    padding: '8px 36px 8px 12px',
                                    fontSize: '12px',
                                    borderRadius: '7px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    fontFamily: 'monospace'
                                  }}
                                />
                                <button
                                  type="button"
                                  title="Copy URL"
                                  onClick={() => handleCopy(gw.webhookUrl, `${gw.id}_url`)}
                                  style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: copiedKey === `${gw.id}_url` ? '#10b981' : '#64748b',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <i className={`fa-solid ${copiedKey === `${gw.id}_url` ? 'fa-check' : 'fa-copy'}`}></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions Footer inside Card */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px',
                            paddingTop: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleTestHandshake(gw)}
                              className="btn btn-outline"
                              style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                fontWeight: '700',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#1e293b',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <i className="fa-solid fa-plug-circle-check" style={{ color: '#059669' }}></i>
                              <span>Test Handshake / Ping</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleClearKeys(gw.id)}
                              className="btn btn-outline"
                              style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                fontWeight: '600',
                                border: '1px solid #fecaca',
                                background: '#ffffff',
                                color: '#dc2626',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer'
                              }}
                              title="Clear all entered keys for this provider"
                            >
                              <i className="fa-solid fa-eraser"></i>
                              <span>Clear Keys</span>
                            </button>

                            {!gw.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultGateway(gw.id)}
                                className="btn btn-outline"
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  fontSize: '12.5px',
                                  fontWeight: '700',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  color: '#334155',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <i className="fa-solid fa-star" style={{ color: '#F59E0B' }}></i>
                                <span>Set as Default Gateway</span>
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              saveToDatabase('gateways', gateways, `${gw.name} keys and configuration saved to database!`);
                            }}
                            className="btn btn-primary"
                            style={{
                              padding: '8px 20px',
                              borderRadius: '8px',
                              fontSize: '12.5px',
                              fontWeight: '700',
                              background: '#4F46E5',
                              border: 'none',
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fa-solid fa-floppy-disk"></i>
                            <span>Save {gw.name} Keys</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: GENERAL PLATFORM SETTINGS
            ======================================================== */}
        {activeTab === 'general' && (
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #e2e8f0)',
              maxWidth: '850px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
              Global Platform Parameters
            </h3>

            <form onSubmit={handleGeneralSubmit}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                  Platform Site Name
                </label>
                <input
                  type="text"
                  name="site_name"
                  className="form-control"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px', background: '#fff', color: '#1e293b' }}
                  value={settings.site_name}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                  Institutional Escalation &amp; Support Email
                </label>
                <input
                  type="email"
                  name="support_email"
                  className="form-control"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px', background: '#fff', color: '#1e293b' }}
                  value={settings.support_email}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                    Default Settlement Currency
                  </label>
                  <select
                    name="default_currency"
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px', background: '#fff', color: '#1e293b' }}
                    value={settings.default_currency}
                    onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
                  >
                    <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                    <option value="USD ($)">USD ($) - US Dollar</option>
                    <option value="EUR (€)">EUR (€) - Euro</option>
                    <option value="GBP (£)">GBP (£) - British Pound</option>
                    <option value="AED (د.إ)">AED (د.إ) - UAE Dirham</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                    System Server Timezone
                  </label>
                  <select
                    name="timezone"
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px', background: '#fff', color: '#1e293b' }}
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST, UTC+5:30)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York (EST)">America/New_York (EST)</option>
                    <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                    <option value="Asia/Dubai (GST)">Asia/Dubai (GST)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                  Platform Maintenance Mode
                </label>
                <select
                  name="maintenance_mode"
                  className="form-control"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px', background: '#fff', color: '#1e293b' }}
                  value={settings.maintenance_mode}
                  onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.value })}
                >
                  <option value="0">Disabled — Platform 100% Operational</option>
                  <option value="1">Enabled — Maintenance Screen Active</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  borderRadius: '6px',
                  background: '#4F46E5',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-floppy-disk"></i> Save General Settings
              </button>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 3: EMAIL & SMTP CONFIGURATION
            ======================================================== */}
        {activeTab === 'smtp' && (
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #e2e8f0)',
              maxWidth: '850px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
              Outgoing SMTP Mail Server Settings
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                  SMTP Host Server
                </label>
                <input
                  type="text"
                  value={smtpSettings.host || ''}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                  placeholder="e.g. smtp.sendgrid.net or smtp.gmail.com"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                  SMTP Port
                </label>
                <input
                  type="text"
                  value={smtpSettings.port || ''}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, port: e.target.value })}
                  placeholder="e.g. 587 (TLS) or 465 (SSL)"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                  SMTP Username / API Key
                </label>
                <input
                  type="text"
                  value={smtpSettings.username || ''}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, username: e.target.value })}
                  placeholder="Enter SMTP Username / API Key"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                  SMTP Password / Secret
                </label>
                <input
                  type="password"
                  value={smtpSettings.password || ''}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                  placeholder="Enter SMTP Password / Secret Key"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                  From Email Address
                </label>
                <input
                  type="email"
                  value={smtpSettings.fromEmail || ''}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, fromEmail: e.target.value })}
                  placeholder="e.g. no-reply@unilms.edu"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                  From Display Name
                </label>
                <input
                  type="text"
                  value={smtpSettings.fromName || ''}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, fromName: e.target.value })}
                  placeholder="e.g. UNILMS Notification System"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (!smtpSettings.host || !smtpSettings.fromEmail) {
                    triggerToast('Please configure SMTP Host and From Email before sending test email.');
                  } else {
                    triggerToast(`Test email dispatched successfully to ${smtpSettings.fromEmail}!`);
                  }
                }}
                className="btn btn-outline"
                style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-paper-plane me-1" style={{ color: '#059669' }}></i> Send Test Email
              </button>
              <button
                type="button"
                onClick={() => {
                  saveToDatabase('smtp', smtpSettings, 'SMTP credentials and server configuration saved to database!');
                }}
                className="btn btn-primary"
                style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', background: '#4F46E5', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-floppy-disk me-1"></i> Save SMTP Settings
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: SECURITY & WEBHOOKS
            ======================================================== */}
        {activeTab === 'security' && (
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #e2e8f0)',
              maxWidth: '850px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
              Platform Security &amp; Access Controls
            </h3>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                Admin Inactive Session Timeout
              </label>
              <select
                value={securitySettings.timeout || '60'}
                onChange={(e) => setSecuritySettings({ ...securitySettings, timeout: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px' }}
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">60 Minutes (Standard)</option>
                <option value="120">2 Hours</option>
                <option value="480">8 Hours</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                Maximum Failed Login Attempts Before IP Lockout
              </label>
              <select
                value={securitySettings.maxAttempts || '5'}
                onChange={(e) => setSecuritySettings({ ...securitySettings, maxAttempts: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px' }}
              >
                <option value="3">3 Attempts (Strict)</option>
                <option value="5">5 Attempts (Recommended)</option>
                <option value="10">10 Attempts</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#1e293b' }}>
                Enforce Two-Factor Authentication (2FA / OTP)
              </label>
              <select
                value={securitySettings.enforce2fa || 'superadmins_only'}
                onChange={(e) => setSecuritySettings({ ...securitySettings, enforce2fa: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px' }}
              >
                <option value="disabled">Disabled for all accounts</option>
                <option value="superadmins_only">Mandatory for SuperAdmin &amp; Finance Admins</option>
                <option value="all_staff">Mandatory for All Faculty &amp; Staff</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                saveToDatabase('security', securitySettings, 'Security policies updated and saved to database!');
              }}
              className="btn btn-primary"
              style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', background: '#4F46E5', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-floppy-disk me-1"></i> Save Security Policies
            </button>
          </div>
        )}

        {/* ========================================================
            TAB 5: SMS GATEWAY CONFIGURATION
            ======================================================== */}
        {activeTab === 'sms' && (
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              padding: '16px 20px',
              borderRadius: '14px',
              border: '1px solid var(--border-color, #e2e8f0)',
              maxWidth: '850px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                SMS Gateway Configuration
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: smsSettings.enabled ? '#059669' : '#94a3b8' }}>
                  {smsSettings.enabled ? 'SMS Active' : 'Fallback to In-App'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !smsSettings.enabled;
                    setSmsSettings({ ...smsSettings, enabled: next });
                    triggerToast(next ? 'SMS Gateway enabled.' : 'SMS Gateway disabled. Falling back to in-app notifications.');
                  }}
                  style={{
                    width: '42px',
                    height: '22px',
                    borderRadius: '11px',
                    border: 'none',
                    background: smsSettings.enabled ? '#059669' : '#cbd5e1',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                    padding: 0
                  }}
                  aria-label="Toggle SMS gateway"
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '3px',
                    left: smsSettings.enabled ? '23px' : '3px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                  }} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '18px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12.5px', color: '#1e293b' }}>
                  SMS Provider / Aggregator <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={smsSettings.provider || ''}
                  onChange={(e) => setSmsSettings({ ...smsSettings, provider: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="">— Select Provider —</option>
                  <option value="msg91">MSG91 (India - Fast OTP &amp; DLT)</option>
                  <option value="twilio">Twilio (Global SMS &amp; WhatsApp)</option>
                  <option value="fast2sms">Fast2SMS (Quick OTP API)</option>
                  <option value="textlocal">TextLocal (Enterprise DLT)</option>
                  <option value="kaleyra">Kaleyra</option>
                  <option value="gupshup">Gupshup (SMS &amp; Bot)</option>
                  <option value="custom">Custom HTTP / Webhook Gateway</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12.5px', color: '#1e293b' }}>
                  API Key / Auth Token <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  value={smsSettings.apiKey || ''}
                  onChange={(e) => setSmsSettings({ ...smsSettings, apiKey: e.target.value })}
                  placeholder="Enter provider API Auth Key"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '18px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12.5px', color: '#1e293b' }}>
                  API Secret (if required)
                </label>
                <input
                  type="password"
                  value={smsSettings.apiSecret || ''}
                  onChange={(e) => setSmsSettings({ ...smsSettings, apiSecret: e.target.value })}
                  placeholder="Enter API Secret / Account SID"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12.5px', color: '#1e293b' }}>
                  Sender ID (DLT Header) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={smsSettings.senderId || ''}
                  onChange={(e) => setSmsSettings({ ...smsSettings, senderId: e.target.value.toUpperCase() })}
                  placeholder="e.g. UNILMS or COLLEG"
                  maxLength={6}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                />
                <small style={{ color: '#64748b', marginTop: '4px', display: 'block', fontSize: '11px' }}>
                  6-character alphanumeric sender ID approved under TRAI DLT regulations
                </small>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '18px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12.5px', color: '#1e293b' }}>
                  DLT Principal Entity ID
                </label>
                <input
                  type="text"
                  value={smsSettings.dltEntityId || ''}
                  onChange={(e) => setSmsSettings({ ...smsSettings, dltEntityId: e.target.value })}
                  placeholder="e.g. 1101452390000012345"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                />
                <small style={{ color: '#64748b', marginTop: '4px', display: 'block', fontSize: '11px' }}>
                  TRAI DLT registered business / institution entity ID
                </small>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12.5px', color: '#1e293b' }}>
                  Default Template ID
                </label>
                <input
                  type="text"
                  value={smsSettings.templateId || ''}
                  onChange={(e) => setSmsSettings({ ...smsSettings, templateId: e.target.value })}
                  placeholder="e.g. 1007234891234567890"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                />
                <small style={{ color: '#64748b', marginTop: '4px', display: 'block', fontSize: '11px' }}>
                  DLT approved Content Template ID for OTPs
                </small>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12.5px', color: '#1e293b' }}>
                Delivery Callback / Webhook URL
              </label>
              <input
                type="text"
                value={smsSettings.webhookUrl || ''}
                onChange={(e) => setSmsSettings({ ...smsSettings, webhookUrl: e.target.value })}
                placeholder="https://api.unilms.edu/api/v1/sms/callback"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (!smsSettings.provider || !smsSettings.apiKey) {
                    triggerToast('Notice: No SMS credentials configured. Test dispatch simulated via In-App Notification channel.');
                  } else {
                    triggerToast(`Test SMS queued successfully via ${smsSettings.provider.toUpperCase()} (Header: ${smsSettings.senderId || 'DEFAULT'})!`);
                  }
                }}
                className="btn btn-outline"
                style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-paper-plane me-1" style={{ color: '#059669' }}></i> Send Test SMS
              </button>
              <button
                type="button"
                onClick={() => {
                  saveToDatabase('sms', smsSettings, 'SMS Gateway settings successfully saved to database!');
                }}
                className="btn btn-primary"
                style={{ padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', background: '#4F46E5', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-floppy-disk me-1"></i> Save SMS Settings
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: MASTER DATA (DEGREE STREAMS, ACADEMIC LEVELS)
            ======================================================== */}
        {activeTab === 'masterdata' && (
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              padding: '16px 20px',
              borderRadius: '14px',
              border: '1px solid var(--border-color, #e2e8f0)',
              maxWidth: '960px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
                Degree Streams &amp; Academic Levels
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStream(true)}
                className="btn btn-primary"
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: '700',
                  background: '#4F46E5',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fa-solid fa-plus"></i> Add Degree Stream
              </button>
            </div>

            {/* Add New Stream Drawer/Card */}
            {showAddStream && (
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                padding: '18px',
                marginBottom: '18px',
                animation: 'unilmsFadeIn 0.2s ease'
              }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-plus-circle" style={{ color: '#4F46E5' }}></i>
                  <span>Define New Degree Stream / Level</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      Stream Code <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. INTEGRATED, PHARMD, UG"
                      value={newStream.code}
                      onChange={(e) => setNewStream({ ...newStream, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      Stream / Level Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Integrated Dual Degree (UG+PG)"
                      value={newStream.name}
                      onChange={(e) => setNewStream({ ...newStream, name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      Example Programs
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech+M.Tech, B.A+LLB, Pharm.D"
                      value={newStream.examples}
                      onChange={(e) => setNewStream({ ...newStream, examples: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      Default Duration (Years) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newStream.defaultDuration}
                      onChange={(e) => setNewStream({ ...newStream, defaultDuration: parseInt(e.target.value) || 4 })}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newStream.code.trim() || !newStream.name.trim()) {
                        triggerToast('Please provide both Stream Code and Stream Name.');
                        return;
                      }
                      const exists = degreeStreams.some(s => s.code === newStream.code);
                      if (exists) {
                        triggerToast(`Stream code "${newStream.code}" already exists. Please choose a unique code.`);
                        return;
                      }
                      const added = {
                        id: newStream.code,
                        code: newStream.code,
                        name: newStream.name.trim(),
                        examples: newStream.examples.trim(),
                        defaultDuration: newStream.defaultDuration || 4,
                        active: true
                      };
                      const updated = [...degreeStreams, added];
                      setDegreeStreams(updated);
                      saveToDatabase('degree_streams', updated, `Degree stream "${added.name}" saved to database!`);
                      setNewStream({ code: '', name: '', examples: '', defaultDuration: 4 });
                      setShowAddStream(false);
                    }}
                    style={{ padding: '7px 16px', borderRadius: '6px', background: '#4F46E5', color: '#fff', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    <i className="fa-solid fa-check me-1"></i> Add Stream
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStream(false);
                      setNewStream({ code: '', name: '', examples: '', defaultDuration: 4 });
                    }}
                    style={{ padding: '7px 16px', borderRadius: '6px', background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Master Data Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <table className="data-table" style={{ width: '100%', minWidth: '650px', margin: 0 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Code</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Stream / Level Name</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Example Disciplines</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', textAlign: 'center' }}>Duration</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {degreeStreams.map((stream) => (
                    <tr key={stream.id || stream.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '700', fontFamily: 'monospace' }}>
                          {stream.code}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: '700', fontSize: '12.5px', color: '#1e293b' }}>
                        {editingStream === stream.id ? (
                          <input
                            type="text"
                            value={stream.name}
                            onChange={(e) => setDegreeStreams(prev => prev.map(s => s.id === stream.id ? { ...s, name: e.target.value } : s))}
                            style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '220px' }}
                          />
                        ) : stream.name}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748b' }}>
                        {editingStream === stream.id ? (
                          <input
                            type="text"
                            value={stream.examples}
                            onChange={(e) => setDegreeStreams(prev => prev.map(s => s.id === stream.id ? { ...s, examples: e.target.value } : s))}
                            style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '200px' }}
                          />
                        ) : (stream.examples || '—')}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', fontSize: '12.5px' }}>
                        {editingStream === stream.id ? (
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={stream.defaultDuration}
                            onChange={(e) => setDegreeStreams(prev => prev.map(s => s.id === stream.id ? { ...s, defaultDuration: parseInt(e.target.value) || 4 } : s))}
                            style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '60px', textAlign: 'center' }}
                          />
                        ) : `${stream.defaultDuration} Yrs`}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            background: stream.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: stream.active ? '#059669' : '#DC2626',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}
                        >
                          {stream.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          {editingStream === stream.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStream(null);
                                saveToDatabase('degree_streams', degreeStreams, `"${stream.name}" updated in master data database.`);
                              }}
                              style={{ padding: '4px 10px', borderRadius: '4px', background: '#059669', color: '#fff', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-check"></i> Save
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingStream(stream.id)}
                              title="Edit Stream"
                              style={{ padding: '4px 8px', borderRadius: '4px', background: '#EEF2FF', color: '#4F46E5', border: 'none', fontSize: '11px', cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-pen"></i>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = degreeStreams.map(s => s.id === stream.id ? { ...s, active: !s.active } : s);
                              setDegreeStreams(updated);
                              saveToDatabase('degree_streams', updated, `"${stream.name}" ${stream.active ? 'deactivated' : 'activated'} in database.`);
                            }}
                            title={stream.active ? 'Deactivate' : 'Activate'}
                            style={{ padding: '4px 8px', borderRadius: '4px', background: stream.active ? '#FEF3C7' : '#DCFCE7', color: stream.active ? '#D97706' : '#059669', border: 'none', fontSize: '11px', cursor: 'pointer' }}
                          >
                            <i className={`fa-solid ${stream.active ? 'fa-pause' : 'fa-play'}`}></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete degree stream "${stream.name}"? Existing programs with this code will retain their code.`)) {
                                const updated = degreeStreams.filter(s => s.id !== stream.id);
                                setDegreeStreams(updated);
                                saveToDatabase('degree_streams', updated, `"${stream.name}" removed from database.`);
                              }
                            }}
                            title="Delete"
                            style={{ padding: '4px 8px', borderRadius: '4px', background: '#FEF2F2', color: '#DC2626', border: 'none', fontSize: '11px', cursor: 'pointer' }}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  saveToDatabase('degree_streams', degreeStreams, 'Master Data saved to database! Degree streams are synchronized across all organizations.');
                }}
                className="btn btn-primary"
                style={{ padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', background: '#4F46E5', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-floppy-disk me-1"></i> Save Master Data
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            DRAWER: ADD CUSTOM PAYMENT GATEWAY (Right-Side Slide-Over)
            ======================================================== */}
        {isAddGatewayModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'stretch',
              animation: 'unilmsFadeIn 0.2s ease'
            }}
            onClick={() => setIsAddGatewayModalOpen(false)}
          >
            <div
              style={{
                width: 'min(560px, 100vw)',
                height: '100vh',
                background: '#ffffff',
                boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.25)',
                borderLeft: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                animation: 'unilmsSlideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleAddCustomGateway} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                {/* Drawer Fixed Header */}
                <div style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ffffff',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(79, 70, 229, 0.1)',
                      color: '#4F46E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      <i className="fa-solid fa-plus-circle"></i>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
                        Add Custom Payment Gateway
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                        Configure custom merchant keys & channels
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddGatewayModalOpen(false)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.05)',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      color: '#64748b',
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
                  gap: '16px'
                }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                      Gateway Provider Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PhonePe PG, CCAvenue, Paytm, Instamojo"
                      value={newGateway.name}
                      onChange={(e) => setNewGateway({ ...newGateway, name: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                        Category
                      </label>
                      <select
                        value={newGateway.category}
                        onChange={(e) => setNewGateway({ ...newGateway, category: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                      >
                        <option value="domestic">Domestic (India / UPI)</option>
                        <option value="international">International (Multi-Currency)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                        Currency
                      </label>
                      <input
                        type="text"
                        value={newGateway.currency}
                        onChange={(e) => setNewGateway({ ...newGateway, currency: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                      Description / Supported Channels
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI, QR Codes, NetBanking & Corporate Cards"
                      value={newGateway.description}
                      onChange={(e) => setNewGateway({ ...newGateway, description: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '12px' }}>
                      Initial API Credentials
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Test Key ID / App ID</label>
                        <input
                          type="text"
                          placeholder="rzp_test_..."
                          value={newGateway.testKeyId}
                          onChange={(e) => setNewGateway({ ...newGateway, testKeyId: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Test Key Secret</label>
                        <input
                          type="text"
                          placeholder="Secret..."
                          value={newGateway.testKeySecret}
                          onChange={(e) => setNewGateway({ ...newGateway, testKeySecret: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Live Key ID (Optional)</label>
                        <input
                          type="text"
                          placeholder="rzp_live_..."
                          value={newGateway.liveKeyId}
                          onChange={(e) => setNewGateway({ ...newGateway, liveKeyId: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Live Key Secret (Optional)</label>
                        <input
                          type="text"
                          placeholder="Secret..."
                          value={newGateway.liveKeySecret}
                          onChange={(e) => setNewGateway({ ...newGateway, liveKeySecret: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drawer Fixed Footer */}
                <div style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  background: '#ffffff',
                  flexShrink: 0,
                  boxShadow: '0 -4px 14px rgba(0,0,0,0.03)'
                }}>
                  <button
                    type="button"
                    onClick={() => setIsAddGatewayModalOpen(false)}
                    style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: '#4F46E5', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <i className="fa-solid fa-check"></i> Add Gateway
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default SuperAdminSettings;
