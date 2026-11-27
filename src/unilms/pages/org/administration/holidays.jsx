import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, IndianDateInput } from '../../../components';
import { formatDate } from '../../../utils/date';
import apiClient from '../../../services/api';

const initialHolidays = [];

const OrgAdministrationHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch holidays from PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const fetchHolidays = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/tenants/settings/org_holidays');
        const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
        if (isMounted) {
          setHolidays(list);
        }
      } catch (err) {
        console.warn('Could not load holidays from database:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHolidays();
    return () => { isMounted = false; };
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedHolidays,
    totalItems
  } = useTablePagination(holidays, 10);

  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    type: 'Public'
  });

  const handleEdit = (h) => {
    setEditingId(h.id);
    setFormData({
      title: h.title,
      start_date: h.start_date,
      end_date: h.end_date,
      type: h.type
    });
  };

  const handleReset = () => {
    setEditingId(null);
    setFormData({
      title: '',
      start_date: '',
      end_date: '',
      type: 'Public'
    });
  };

  const persistHolidays = async (updatedList) => {
    setHolidays(updatedList);
    try {
      await apiClient.post('/tenants/settings/org_holidays', updatedList);
    } catch (err) {
      console.error('Failed to persist holidays to PostgreSQL:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updated;
    if (editingId) {
      updated = holidays.map(h => h.id === editingId ? { ...h, ...formData } : h);
    } else {
      const newHol = {
        id: Date.now(),
        ...formData
      };
      updated = [...holidays, newHol];
    }
    persistHolidays(updated);
    handleReset();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this holiday?')) {
      const updated = holidays.filter(h => h.id !== id);
      persistHolidays(updated);
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
              background: 'linear-gradient(135deg, #E11D48, #BE123C)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)'
            }}
          >
            <i className="fa-solid fa-umbrella-beach"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Academic Calendar &amp; Holidays
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Define public, institutional, and restricted holidays across the academic year
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/unilms/org/administration"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-sitemap" style={{ color: '#E11D48' }}></i>
            <span>Admin Setup</span>
          </Link>
          <Link
            to="/unilms/org/academics/academic_years"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(225, 29, 72, 0.25)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-calendar-days"></i>
            <span>Academic Years</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
        {/* Form Column */}
        <div>
          <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '22px' }}>
            <h2 style={{ marginTop: 0, fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
              {editingId ? 'Edit Holiday' : 'Add New Holiday'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Holiday Title *</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  className="form-control" 
                  required 
                  placeholder="e.g. Republic Day" 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Start Date *</label>
                <IndianDateInput 
                  value={formData.start_date} 
                  onChange={(val) => setFormData({ ...formData, start_date: val })} 
                  required 
                  placeholder="DD/MM/YYYY" 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>End Date *</label>
                <IndianDateInput 
                  value={formData.end_date} 
                  onChange={(val) => setFormData({ ...formData, end_date: val })} 
                  required 
                  placeholder="DD/MM/YYYY" 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Type</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })} 
                  className="form-control"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                >
                  <option value="Public">Public Holiday</option>
                  <option value="Institutional">Institutional Holiday</option>
                  <option value="Restricted">Restricted Holiday</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: '#7C3AED', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-save" style={{ marginRight: '6px' }}></i> {editingId ? 'Update' : 'Save Holiday'}
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
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Title</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Dates</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Type</th>
                  <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={4} rows={pageSize || 5} />
                ) : paginatedHolidays.length > 0 ? (
                  paginatedHolidays.map((h) => {
                    let badgeBg = 'rgba(239, 68, 68, 0.1)';
                    let badgeColor = '#ef4444';
                    if (h.type === 'Institutional') {
                      badgeBg = 'rgba(124, 58, 237, 0.1)';
                      badgeColor = '#7C3AED';
                    } else if (h.type === 'Restricted') {
                      badgeBg = 'rgba(245, 158, 11, 0.1)';
                      badgeColor = '#d97706';
                    }

                    return (
                      <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {h.title}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                          {h.start_date === h.end_date ? formatDate(h.start_date) : `${formatDate(h.start_date)} to ${formatDate(h.end_date)}`}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className="badge" style={{ background: badgeBg, color: badgeColor, fontWeight: '700', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            {h.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button 
                            type="button" 
                            className="btn btn-outline" 
                            style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px', cursor: 'pointer' }} 
                            onClick={() => handleEdit(h)}
                          >
                            Edit
                          </button>
                          <button 
                            type="button" 
                            className="btn-icon text-danger" 
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }} 
                            onClick={() => handleDelete(h.id)}
                            title="Delete"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No holidays scheduled yet.
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
              itemName="holidays"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default OrgAdministrationHolidays;