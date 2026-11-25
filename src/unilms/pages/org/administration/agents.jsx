import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import apiClient from '../../../services/api';

const initialAgents = [];

const OrgAdministrationAgents = () => {
  const [agents, setAgents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch agents from PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/tenants/settings/org_agents');
        const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
        if (isMounted) {
          setAgents(list);
        }
      } catch (err) {
        console.warn('Could not load agents from database:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAgents();
    return () => { isMounted = false; };
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedAgents,
    totalItems
  } = useTablePagination(agents, 10);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    commission_rate: 0,
    status: 'Active'
  });

  const handleEdit = (a) => {
    setEditingId(a.id);
    setFormData({
      name: a.name,
      phone: a.phone,
      email: a.email,
      commission_rate: a.commission_rate,
      status: a.status
    });
  };

  const handleReset = () => {
    setEditingId(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      commission_rate: 0,
      status: 'Active'
    });
  };

  const persistAgents = async (updatedList) => {
    setAgents(updatedList);
    try {
      await apiClient.post('/tenants/settings/org_agents', updatedList);
    } catch (err) {
      console.error('Failed to persist agents to PostgreSQL:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updated;
    if (editingId) {
      updated = agents.map(a => a.id === editingId ? { ...a, ...formData, commission_rate: Number(formData.commission_rate) } : a);
    } else {
      const newAgent = {
        id: Date.now(),
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        commission_rate: Number(formData.commission_rate),
        status: formData.status
      };
      updated = [...agents, newAgent];
    }
    persistAgents(updated);
    handleReset();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this admission agent?')) {
      const updated = agents.filter(a => a.id !== id);
      persistAgents(updated);
      if (editingId === id) handleReset();
    }
  };

  return (
    <>
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
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
            }}
          >
            <i className="fa-solid fa-users-viewfinder"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Admission Agents &amp; Counselors
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Manage partner agencies, counselors, and track referral commissions
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/unilms/org/administration"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-sitemap" style={{ color: '#D97706' }}></i>
            <span>Admin Setup</span>
          </Link>
          <Link
            to="/unilms/org/admissions/leads"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.25)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-filter"></i>
            <span>Admissions Leads</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
        {/* Form Column */}
        <div>
          <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '22px' }}>
            <h2 style={{ marginTop: 0, fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
              {editingId ? 'Edit Agent' : 'Add New Agent'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Full Name / Agency *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  className="form-control" 
                  required 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Phone Number *</label>
                <input 
                  type="tel" 
                  pattern="[0-9]{10}" 
                  maxLength="10" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  className="form-control" 
                  required 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  className="form-control" 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Commission Rate (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={formData.commission_rate} 
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })} 
                  className="form-control" 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                  className="form-control"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: '#7C3AED', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-save" style={{ marginRight: '6px' }}></i> {editingId ? 'Update' : 'Save Agent'}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={handleReset} 
                    className="btn btn-outline"
                    style={{ padding: '10px 16px', borderRadius: '6px' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Table Column */}
        <div>
          <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Contact</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Commission</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={5} rows={pageSize || 5} />
                ) : paginatedAgents.length > 0 ? (
                  paginatedAgents.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {a.name}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                        {a.phone}
                        {a.email && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.email}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                        <strong>{a.commission_rate}%</strong>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {a.status === 'Active' ? (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            Active
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px', cursor: 'pointer' }} 
                          onClick={() => handleEdit(a)}
                        >
                          Edit
                        </button>
                        <button 
                          type="button" 
                          className="btn-icon text-danger" 
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }} 
                          onClick={() => handleDelete(a.id)}
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No agents registered yet.
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
              itemName="agents"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default OrgAdministrationAgents;