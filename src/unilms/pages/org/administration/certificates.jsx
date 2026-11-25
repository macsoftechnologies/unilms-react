import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import studentsService from '../../../services/students.service';

const OrgAdministrationCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [certName, setCertName] = useState('');
  const [certTemplate, setCertTemplate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const data = await studentsService.getCertificateRequests();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setCertificates(list.map((c, i) => ({
        id: c.id,
        certificate_name: c.certificateType || 'Bonafide Student Certificate',
        code: `CRT-0${(i + 1)}`,
        created_at: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
        issued_count: 1,
        template: `<p>This is to certify that student is awarded ${c.certificateType}...</p>`
      })));
    } catch (err) {
      console.warn('Failed to load certificates:', err);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleOpenAdd = () => {
    setEditingCert(null);
    setCertName('');
    setCertTemplate('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCert(c);
    setCertName(c.certificate_name);
    setCertTemplate(c.template || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!certName.trim()) return;

    if (editingCert) {
      setCertificates(prev =>
        prev.map(c => c.id === editingCert.id ? { ...c, certificate_name: certName, template: certTemplate } : c)
      );
    } else {
      const newCert = {
        id: Date.now(),
        certificate_name: certName,
        code: `CRT-${Date.now().toString().slice(-2)}`,
        created_at: new Date().toLocaleDateString('en-GB'),
        issued_count: 0,
        template: certTemplate
      };
      setCertificates([newCert, ...certificates]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this certificate template?')) {
      setCertificates(prev => prev.filter(c => c.id !== id));
    }
  };

  const filteredCerts = certificates.filter(c =>
    c.certificate_name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredCerts, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, setCurrentPage]);

  return (
    <>
      <section className="view-section active">
        {/* Top Header Card */}
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
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
              }}
            >
              <i className="fa-solid fa-certificate"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Certificate Masters &amp; Templates
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Bonafide, study, transfer, character &amp; course completion certificate issuance templates &bull; AY 2026&ndash;2027
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={handleOpenAdd}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add Certificate</span>
            </button>
            <Link
              to="/unilms/org/administration"
              className="btn btn-outline"
              style={{
                background: 'var(--card-bg, #fff)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-arrow-left" style={{ color: '#4F46E5' }}></i>
              <span>Admin Hub</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '16px', maxWidth: '340px', position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px' }}></i>
          <input
            type="text"
            placeholder="Search certificate templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '34px', height: '38px', borderRadius: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Table Container */}
        <div className="table-container" style={{ background: 'var(--card-bg, #fff)', borderRadius: '14px', border: '1px solid var(--border-color)', overflowX: 'auto', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #F8FAFC)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Certificate Name</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Template Code</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Created Date</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Issued To Date</th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={5} rows={pageSize || 5} />
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px' }}>{c.certificate_name}</strong>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span style={{ background: 'rgba(99, 102, 241, 0.08)', color: '#4F46E5', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '12px' }}>
                        {c.code}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {c.created_at}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px' }}>
                      <strong style={{ color: '#059669' }}>{c.issued_count}</strong> students
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div className="action-buttons" style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenEdit(c)}
                          style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-pen me-1"></i> Edit
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => handleDelete(c.id)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '13px' }}
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No certificates found matching your search.
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
            itemName="certificate templates"
          />
        </div>
      </section>

      {/* Drawer Overlay Modal */}
      {isModalOpen && (
        <div
          className="drawer-overlay active"
          onClick={() => setIsModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}
        >
          <div
            className="drawer-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '520px', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="drawer-header" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                  {editingCert ? 'Edit Certificate Template' : 'Add Certificate Template'}
                </h3>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="drawer-body" style={{ padding: '22px', flex: 1, overflowY: 'auto' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Certificate Title *</label>
                  <input
                    type="text"
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    className="form-control"
                    required
                    placeholder="e.g. Bonafide Student Certificate"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Template Body (HTML / Placeholders)</label>
                  <textarea
                    value={certTemplate}
                    onChange={(e) => setCertTemplate(e.target.value)}
                    className="form-control"
                    rows="8"
                    placeholder="Enter template with placeholders like {{student_name}}, {{roll_number}}, {{program}}..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>
              <div className="drawer-footer" style={{ padding: '16px 22px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ borderRadius: '8px', padding: '8px 16px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: '700' }}>
                  Save Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgAdministrationCertificates;
