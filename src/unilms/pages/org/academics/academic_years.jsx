import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, IndianDateInput } from '../../../components';
import academicsService from '../../../services/academics.service';

const OrgAcademicsAcademicYears = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');

  const loadAcademicYears = async () => {
    setLoading(true);
    try {
      const data = await academicsService.getAcademicYears();
      setAcademicYears(Array.isArray(data) ? data.map(ay => ({
        ...ay,
        start_date: ay.startDate ? new Date(ay.startDate).toISOString().split('T')[0] : ay.start_date,
        end_date: ay.endDate ? new Date(ay.endDate).toISOString().split('T')[0] : ay.end_date,
      })) : []);
    } catch (e) {
      console.warn('Backend fetch failed for academic years:', e.message);
      setAcademicYears([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcademicYears();
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(academicYears, 10);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setStartDate('2026-06-01');
    setEndDate('2027-05-31');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (ay) => {
    setEditingId(ay.id);
    setName(ay.name);
    setStartDate(ay.start_date || ay.startDate || '');
    setEndDate(ay.end_date || ay.endDate || '');
    setStatus(ay.status || 'active');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      alert('Academic Year End Date must be after Start Date.');
      return;
    }

    try {
      if (editingId) {
        await academicsService.updateAcademicYear(editingId, {
          name: name.trim(),
          startDate: startDate || '2026-06-01',
          endDate: endDate || '2027-05-31',
          status,
        });
      } else {
        await academicsService.createAcademicYear({
          name: name.trim(),
          startDate: startDate || '2026-06-01',
          endDate: endDate || '2027-05-31',
          status,
        });
      }
      await loadAcademicYears();
      closeModal();
    } catch (err) {
      alert('Failed to save academic year: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this academic year?')) {
      try {
        await academicsService.deleteAcademicYear(id);
        await loadAcademicYears();
      } catch (err) {
        alert('Failed to delete academic year: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    try {
      const [y, m, day] = d.split('-');
      return `${day}/${m}/${y}`;
    } catch {
      return d;
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
        .drawer-overlay:not(.active) {
          display: none !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }
      ` }} />
      <section className="view-section active">
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
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
              }}
            >
              <i className="fa-solid fa-calendar"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Academic Years &amp; Calendars
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Define institution-wide operational academic calendars, active tenure dates &amp; active batches
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={openAddModal}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add Year</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Academic Year</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={5} rows={pageSize || 4} />
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((ay) => (
                  <tr key={ay.id}>
                    <td>
                      <strong>{ay.name}</strong>
                    </td>
                    <td>{formatDate(ay.start_date)}</td>
                    <td>{formatDate(ay.end_date)}</td>
                    <td>
                      <span
                        className={`badge ${ay.status === 'active' ? 'badge-success' : 'badge-warning'}`}
                        style={{ fontWeight: '600' }}
                      >
                        {ay.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons" style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openEditModal(ay)}
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => handleDelete(ay.id)}
                          title="Delete"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No academic years found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="academic years"
        />
      </section>

      {/* Modal Drawer (Right-Side Slide-Over) */}
      {isModalOpen && (
        <div
          className="drawer-overlay active"
          id="addModal"
          onClick={(e) => {
            if (e.target.id === 'addModal') closeModal();
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
            className="drawer-content"
            style={{
              width: 'min(540px, 100vw)',
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
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
              <div
                className="drawer-header"
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ffffff',
                  color: '#1e293b',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className="fa-solid fa-calendar"></i>
                  </div>
                  <div>
                    <h3 id="modal_title" style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
                      {editingId ? 'Edit Academic Year' : 'Add Academic Year'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      Configure institutional calendar dates (DD/MM/YYYY)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
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

              <div className="drawer-body" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Academic Year Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="form_name"
                    className="form-control"
                    required
                    placeholder="e.g. 2026-2027"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', margin: 0 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                      Start Date (DD/MM/YYYY)
                    </label>
                    <IndianDateInput
                      name="start_date"
                      id="form_start_date"
                      required
                      value={startDate}
                      onChange={(val) => setStartDate(val)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                      End Date (DD/MM/YYYY)
                    </label>
                    <IndianDateInput
                      name="end_date"
                      id="form_end_date"
                      required
                      value={endDate}
                      onChange={(val) => setEndDate(val)}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                    Status
                  </label>
                  <select
                    name="status"
                    id="form_status"
                    className="form-control"
                    required
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div
                className="drawer-footer"
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  background: '#ffffff',
                  flexShrink: 0,
                  boxShadow: '0 -4px 14px rgba(0,0,0,0.03)'
                }}
              >
                <button type="button" className="btn btn-outline" onClick={closeModal} style={{ padding: '9px 18px', borderRadius: '8px', fontWeight: '600' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '9px 22px', borderRadius: '8px', fontWeight: '700', background: '#0284C7', borderColor: '#0284C7' }}>
                  {editingId ? 'Update Academic Year' : 'Save Academic Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgAcademicsAcademicYears;