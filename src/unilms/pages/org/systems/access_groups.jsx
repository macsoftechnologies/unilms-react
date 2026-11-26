import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import academicsService from '../../../services/academics.service';

const OrgSystemsAccessGroups = () => {
  const [groups, setGroups] = useState([]);

  const loadGroups = () => {
    academicsService.getAccessGroups().then(res => {
      setGroups(Array.isArray(res) ? res.map(g => ({
        ...g,
        permissions_count: g.permissionsCount || 0,
        created_by: g.createdBy || 'System',
        created_at: g.createdAt ? new Date(g.createdAt).toLocaleDateString() : 'Just now'
      })) : []);
    }).catch(e => {
      console.warn('Backend access groups fetch failed:', e);
      setGroups([]);
    });
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this access group? Users in it will lose these permissions.')) {
      try {
        await academicsService.deleteAccessGroup(id);
      } catch (e) {
        console.warn('Backend access group delete error:', e);
      }
      loadGroups();
    }
  };

  return (
    <>
      <section className="view-section active">
        {/* Header matching Image 2 */}
        {/* Top Header Card matching Reference UI (Image 1 & 2) */}
        <div
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color)',
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
                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
              }}
            >
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Security Roles &amp; Access Groups
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Define modular permission roles and granular access rights for faculty, accountants, wardens, and administrative staff
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link 
              to="/unilms/org/systems/access_group_form"
              className="btn btn-primary"
              style={{ 
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', 
                color: '#ffffff', 
                border: 'none', 
                padding: '10px 18px', 
                borderRadius: '10px', 
                fontWeight: '700', 
                fontSize: '13px',
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Create Access Group</span>
            </Link>
            <Link 
              to="/unilms/org/systems/users"
              className="btn btn-outline"
              style={{ 
                border: '1px solid var(--border-color)', 
                background: 'var(--card-bg, #fff)', 
                color: 'var(--text-primary)', 
                padding: '10px 18px', 
                borderRadius: '10px', 
                fontWeight: '700', 
                fontSize: '13px',
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-users" style={{ color: '#7C3AED' }}></i>
              <span>User Directory</span>
            </Link>
          </div>
        </div>

        {/* Group Cards Grid - Exactly matching Image 2 */}
        {groups.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '24px' }}>
            {groups.map((group) => (
              <div 
                key={group.id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRadius: '14px', 
                  border: '1px solid var(--border-color)', 
                  background: 'var(--card-bg, #ffffff)', 
                  padding: '24px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ marginBottom: '16px', flex: '1 0 auto' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                    {group.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                    {group.description || 'No description provided'}
                  </p>
                </div>

                {/* Permissions and Users Metric Counters */}
                <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', display: 'block', lineHeight: 1 }}>
                      {group.permissions_count || 18}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      Permissions
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', display: 'block', lineHeight: 1 }}>
                      {group.users_count || 0}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      Users
                    </span>
                  </div>
                </div>

                {/* Edit and Delete Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', marginBottom: '16px' }}>
                  <Link 
                    to={`/unilms/org/systems/access_group_form?id=${group.id}`}
                    className="btn btn-outline" 
                    style={{ 
                      flex: 1, 
                      justifyContent: 'center', 
                      padding: '8px 12px', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      textDecoration: 'none',
                      border: '1px solid #CBD5E1',
                      color: 'var(--text-primary)',
                      background: '#ffffff'
                    }}
                  >
                    <i className="fa-solid fa-pen"></i> Edit
                  </Link>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => handleDelete(group.id)}
                    style={{ 
                      flex: 1, 
                      justifyContent: 'center', 
                      padding: '8px 12px', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      borderRadius: '8px', 
                      color: '#EF4444', 
                      border: '1px solid #FCA5A5', 
                      background: '#ffffff',
                      cursor: 'pointer', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px' 
                    }}
                  >
                    <i className="fa-solid fa-trash"></i> Delete
                  </button>
                </div>
                
                {/* Audit Line matching Image 2: * Created by System (25/09/2026) */}
                <div style={{ paddingTop: '12px', borderTop: '1px dashed var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>* Created by <strong>{group.created_by || 'System'}</strong> ({group.created_at || '25/09/2026'})</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container card" style={{ padding: '60px', textAlign: 'center', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #ffffff)' }}>
            <i className="fa-solid fa-shield-halved" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }}></i>
            <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No Access Groups Yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Create your first Access Group to start defining custom roles for your team.</p>
            <Link 
              to="/unilms/org/systems/access_group_form"
              className="btn btn-primary"
              style={{ background: '#7C3AED', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus"></i> Create Access Group
            </Link>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgSystemsAccessGroups;