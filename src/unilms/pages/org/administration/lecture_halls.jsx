import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import apiClient from '../../../services/api';

const initialHalls = [
  {
    id: 1,
    name: 'Room 101 - Alan Turing Smart Hall',
    hall_type: 'Lecture Hall',
    capacity: 75
  },
  {
    id: 2,
    name: 'Lab 204 - Advanced AI & Cloud Computing Lab',
    hall_type: 'Lab',
    capacity: 45
  },
  {
    id: 3,
    name: 'Ramanujan Seminar Hall (Block B)',
    hall_type: 'Seminar Hall',
    capacity: 120
  },
  {
    id: 4,
    name: 'Sir CV Raman Main Auditorium',
    hall_type: 'Auditorium',
    capacity: 450
  },
  {
    id: 5,
    name: 'Lab 108 - Robotics & IoT Prototyping Lab',
    hall_type: 'Lab',
    capacity: 35
  }
];

const OrgAdministrationLectureHalls = () => {
  const [halls, setHalls] = useState(initialHalls);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch halls from PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const fetchHalls = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/tenants/settings/org_lecture_halls');
        const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
        if (isMounted && list.length > 0) {
          setHalls(list);
        }
      } catch (err) {
        console.warn('Could not load lecture halls from database, using institutional baseline:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHalls();
    return () => { isMounted = false; };
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    hall_type: 'Lecture Hall',
    capacity: 60
  });

  const handleOpenAdd = () => {
    setEditingHall(null);
    setFormData({
      name: '',
      hall_type: 'Lecture Hall',
      capacity: 60
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (hall) => {
    setEditingHall(hall);
    setFormData({
      name: hall.name,
      hall_type: hall.hall_type,
      capacity: hall.capacity
    });
    setIsDrawerOpen(true);
  };

  const persistHalls = async (updatedList) => {
    setHalls(updatedList);
    try {
      await apiClient.post('/tenants/settings/org_lecture_halls', updatedList);
    } catch (err) {
      console.error('Failed to persist lecture halls to PostgreSQL:', err);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this classroom / lab?')) {
      const updated = halls.filter(h => h.id !== id);
      persistHalls(updated);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updated;
    if (editingHall) {
      updated = halls.map(h => h.id === editingHall.id ? { ...h, ...formData, capacity: Number(formData.capacity) } : h);
    } else {
      const newHall = {
        id: Date.now(),
        name: formData.name,
        hall_type: formData.hall_type,
        capacity: Number(formData.capacity)
      };
      updated = [...halls, newHall];
    }
    persistHalls(updated);
    setIsDrawerOpen(false);
  };

  const filteredHalls = halls.filter(h => {
    if (!searchQuery) return true;
    return (
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.hall_type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedHalls,
    totalItems
  } = useTablePagination(filteredHalls, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, setCurrentPage]);

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
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
            }}
          >
            <i className="fa-solid fa-chalkboard"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Lecture Halls &amp; Campus Infrastructure
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Smart classrooms, computer labs, seminar halls, and auditoriums for timetable &amp; exam seating &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleOpenAdd} 
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#fff', border: 'none', padding: '10px 18px', fontWeight: '700', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>Add Classroom / Lab</span>
          </button>
          <Link
            to="/unilms/org/administration"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-sitemap" style={{ color: '#7C3AED' }}></i>
            <span>Admin Setup</span>
          </Link>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Campus Rooms & Laboratories</h3>
            <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontSize: '12px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>
              {halls.length} Total Rooms
            </span>
          </div>
          <div style={{ maxWidth: '300px', width: '100%' }}>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="form-control" 
              placeholder="Search rooms, labs..." 
              style={{ height: '38px', fontSize: '13.5px', borderRadius: '8px', width: '100%', padding: '6px 12px', border: '1px solid var(--border-color)' }} 
            />
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Room / Lab Name</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Category Type</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' }}>Seating Capacity</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={4} rows={pageSize || 5} />
              ) : paginatedHalls.length > 0 ? (
                paginatedHalls.map((hall) => {
                  const isLab = hall.hall_type.toLowerCase().includes('lab');
                  const isAuditorium = hall.hall_type.toLowerCase().includes('auditorium') || hall.hall_type.toLowerCase().includes('seminar');

                  return (
                    <tr key={hall.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                            {isLab ? (
                              <i className="fa-solid fa-flask"></i>
                            ) : isAuditorium ? (
                              <i className="fa-solid fa-users-rectangle"></i>
                            ) : (
                              <i className="fa-solid fa-chalkboard"></i>
                            )}
                          </div>
                          <span>{hall.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontWeight: '700', fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }}>
                          {hall.hall_type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{hall.capacity}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '4px' }}>Seats</span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          onClick={() => handleOpenEdit(hall)} 
                          style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: '600', borderRadius: '6px', marginRight: '6px', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-edit me-1"></i> Edit
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleDelete(hall.id)} 
                          className="btn-icon text-danger" 
                          style={{ background: 'none', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '6px', color: '#DC2626', cursor: 'pointer' }} 
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
                  <td colSpan="4" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
                    No lecture halls or labs match your search.
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
            itemName="rooms & labs"
          />
        </div>
      </div>

      {/* Add/Edit Drawer Modal */}
      <div className={`drawer-overlay ${isDrawerOpen ? 'active' : ''}`} style={{ display: isDrawerOpen ? 'flex' : 'none', position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, justifyContent: 'flex-end' }}>
        <div className="drawer-content" style={{ width: '100%', maxWidth: '480px', background: 'var(--card-bg, #ffffff)', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="drawer-header" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', color: '#fff', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  <i className="fa-solid fa-chalkboard"></i>
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#fff' }}>
                  {editingHall ? 'Edit Classroom / Lab' : 'Add Classroom / Lab'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsDrawerOpen(false)} 
                style={{ color: '#fff', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="drawer-body" style={{ padding: '22px', flex: '1 1 auto' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                  Hall / Laboratory Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  className="form-control" 
                  placeholder="e.g. Room 101 - Smart Hall, AI Lab" 
                  required 
                  style={{ width: '100%', fontSize: '13.5px', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                  Room Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  value={formData.hall_type} 
                  onChange={(e) => setFormData({ ...formData, hall_type: e.target.value })} 
                  className="form-control" 
                  required 
                  style={{ width: '100%', fontSize: '13.5px', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                >
                  <option value="Lecture Hall">Smart Lecture Hall / Classroom</option>
                  <option value="Lab">Computer / Engineering Lab</option>
                  <option value="Seminar Hall">Department Seminar Hall</option>
                  <option value="Auditorium">Main Campus Auditorium</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                  Student Seating Capacity <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="1000" 
                  value={formData.capacity} 
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} 
                  className="form-control" 
                  required 
                  style={{ width: '100%', fontSize: '13.5px', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>

            <div className="drawer-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setIsDrawerOpen(false)} 
                className="btn btn-outline"
                style={{ padding: '8px 16px', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)', color: '#fff', border: 'none', padding: '10px 20px', fontWeight: '700', borderRadius: '6px', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-check-circle" style={{ marginRight: '6px' }}></i> Save Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default OrgAdministrationLectureHalls;