import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api';
import admissionsService from '../../services/admissions.service';
import { useTenant } from '../../context/TenantContext';

const OrgDashboard = () => {
  const { tenant } = useTenant();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalLeads: 0,
    enrolledCount: 0,
    planTier: 'Enterprise Pro',
    planStatus: 'Active',
    planExpiry: 'Enterprise License Active'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const [usersRes, admRes] = await Promise.allSettled([
          apiClient.get('/auth/users'),
          admissionsService.getDashboardStats(),
        ]);

        if (isMounted) {
          let userCount = 0;
          if (usersRes.status === 'fulfilled') {
            const users = Array.isArray(usersRes.value?.data) ? usersRes.value.data : (Array.isArray(usersRes.value) ? usersRes.value : []);
            userCount = users.length;
          }

          let admData = null;
          if (admRes.status === 'fulfilled' && admRes.value) {
            admData = admRes.value;
          }

          setStats((prev) => ({
            ...prev,
            totalUsers: userCount > 0 ? userCount : (admData?.totalStudents || 0),
            totalStudents: admData?.totalStudents || userCount,
            totalLeads: admData?.totalLeads || 0,
            enrolledCount: admData?.enrolledCount || 0,
            planTier: tenant?.plan || 'Enterprise Pro',
            planStatus: 'Active',
            planExpiry: tenant?.subscriptionEndDate ? `Valid Through ${new Date(tenant.subscriptionEndDate).toLocaleDateString()}` : 'Enterprise License Active'
          }));
        }
      } catch (err) {
        console.warn('Dashboard stats fetch failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, [tenant]);

  return (
    <section className="view-section active">
      {/* Top Header Card */}
      <div
        style={{
          background: 'var(--card-bg, #fff)',
          border: '1px solid var(--border-color, #E2E8F0)',
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
              background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
            }}
          >
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {tenant?.name || 'Institutional Campus'} Cockpit &amp; Operations Overview
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Live institutional metrics, active enrollments, revenue collection &amp; system health
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/unilms/org/admissions/dashboard"
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
              color: '#ffffff',
              fontWeight: '700',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
              whiteSpace: 'nowrap',
              textDecoration: 'none'
            }}
          >
            <i className="fa-solid fa-graduation-cap"></i>
            <span>Admissions CRM</span>
          </Link>
          <Link
            to="/unilms/org/fees/dues_list"
            className="btn btn-outline"
            style={{
              background: 'var(--card-bg, #fff)',
              color: 'var(--text-primary)',
              fontWeight: '700',
              border: '1px solid var(--border-color, #E2E8F0)',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              textDecoration: 'none'
            }}
          >
            <i className="fa-solid fa-indian-rupee-sign" style={{ color: '#4F46E5' }}></i>
            <span>Fee Collection</span>
          </Link>
          <Link
            to="/unilms/org/mis/dashboard"
            className="btn btn-outline"
            style={{
              background: 'var(--card-bg, #fff)',
              color: 'var(--text-primary)',
              fontWeight: '700',
              border: '1px solid var(--border-color, #E2E8F0)',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              textDecoration: 'none'
            }}
          >
            <i className="fa-solid fa-chart-pie" style={{ color: '#4F46E5' }}></i>
            <span>MIS Cockpit</span>
          </Link>
        </div>
      </div>

      {/* Academic Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}
      >
        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--primary, #4F46E5)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Total Users
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--primary, #4F46E5)', marginTop: '2px', lineHeight: '1.2' }}>
            {loading ? '...' : stats.totalUsers} <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: '600' }}>Active</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            Enrolled Profiles &amp; Staff
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--success, #10B981)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Subscription Status
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginTop: '2px', lineHeight: '1.2' }}>
            {stats.planTier}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-circle-check me-1"></i> {stats.planExpiry}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid #06B6D4',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Admissions Pipeline
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#06B6D4', marginTop: '2px', lineHeight: '1.2' }}>
            {loading ? '...' : `${stats.enrolledCount} Enrolled`}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--success, #10B981)', fontWeight: '700', marginTop: '2px' }}>
            <i className="fa-solid fa-check me-1"></i> {stats.totalLeads} Total Inquiries
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '9px 13px',
            borderLeft: '3.5px solid var(--warning, #F59E0B)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            borderRight: '1px solid var(--border-color, #E2E8F0)',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748B)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
            Infrastructure
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--warning, #F59E0B)', marginTop: '2px', lineHeight: '1.2' }}>
            Operational
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)', fontWeight: '600', marginTop: '2px' }}>
            Enterprise Cloud Multi-Tenant
          </div>
        </div>
      </div>

      <div className="dashboard-widgets">
        <div className="widget" style={{ marginBottom: '24px' }}>
          <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Welcome to {tenant?.name || 'Your Institutional'} Operations Portal
            <div style={{ fontSize: '14px', fontWeight: 'normal' }}>
              Modules Active:
              <span className="badge badge-success" style={{ marginLeft: '5px' }}>ERP Core</span>
              <span className="badge badge-primary" style={{ marginLeft: '5px' }}>Student LMS</span>
            </div>
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '15px' }}>
            This is your centralized campus management cockpit. Use the top navigation bar to manage admissions, academic departments, examinations, fee collection, staff payroll, hostel, and student transport.
            <br /><br />
            As the <strong>Campus Administrator</strong>, you have access to system governance, user directory, and role configuration. Head to <Link to="/unilms/org/systems/users" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Systems &rarr; User Directory</Link> to audit active campus accounts.
          </p>
        </div>
      </div>
    </section>
  );
};

export default OrgDashboard;
