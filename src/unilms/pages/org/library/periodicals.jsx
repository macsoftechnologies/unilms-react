import { Link } from 'react-router-dom';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import libraryService from '../../../services/library.service';

const OrgLibraryPeriodicals = () => {
  const [periodicals, setPeriodicals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriodical, setEditingPeriodical] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    title: '',
    type: 'Journal',
    issn: '',
    frequency: 'Monthly',
    publisher: '',
    subscription_start: '2026-01-01',
    subscription_end: '2026-12-31',
    annual_cost: 25000,
    status: 'Active'
  });

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const data = await libraryService.getPeriodicals();
      setPeriodicals(Array.isArray(data) ? data : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Failed to load periodicals from PostgreSQL:', e);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredPeriodicals = useMemo(() => {
    return periodicals.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.issn && p.issn.toLowerCase().includes(q)) ||
        (p.publisher && p.publisher.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'All' || p.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [periodicals, searchQuery, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedPeriodicals,
    totalItems
  } = useTablePagination(filteredPeriodicals, 10);

  const handleOpenAddModal = () => {
    setEditingPeriodical(null);
    setFormData({
      title: '',
      type: 'Journal',
      issn: '',
      frequency: 'Monthly',
      publisher: '',
      subscription_start: '2026-01-01',
      subscription_end: '2026-12-31',
      annual_cost: 25000,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingPeriodical(p);
    setFormData({
      title: p.title,
      type: p.type || 'Journal',
      issn: p.issn || '',
      frequency: p.frequency || 'Monthly',
      publisher: p.publisher || '',
      subscription_start: p.subscriptionStart ? p.subscriptionStart.split('T')[0] : '',
      subscription_end: p.subscriptionEnd ? p.subscriptionEnd.split('T')[0] : '',
      annual_cost: p.annualCost || 0,
      status: p.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPeriodical(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingPeriodical) {
        await libraryService.updatePeriodical(editingPeriodical.id, {
          title: formData.title,
          type: formData.type,
          issn: formData.issn,
          frequency: formData.frequency,
          publisher: formData.publisher,
          annualCost: Number(formData.annual_cost),
          status: formData.status
        });
      } else {
        await libraryService.createPeriodical({
          title: formData.title,
          type: formData.type,
          issn: formData.issn,
          frequency: formData.frequency,
          publisher: formData.publisher,
          subscriptionStart: formData.subscription_start,
          subscriptionEnd: formData.subscription_end,
          annualCost: Number(formData.annual_cost),
          status: formData.status
        });
      }

      handleCloseModal();
      await loadData();
    } catch (err) {
      alert('Failed to save periodical subscription: ' + err.message);
    }
  };

  const handleDelete = (p) => {
    confirmAction({
      title: 'Unsubscribe / Delete Periodical',
      message: `Are you sure you want to delete subscription for "${p.title}"?`,
      confirmText: 'Delete Periodical',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await libraryService.deletePeriodical(p.id);
          await loadData();
        } catch (err) {
          alert('Failed to delete periodical: ' + err.message);
        }
      }
    });
  };

  return (
    <>
      <ConfirmModal />
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
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <i className="fa-solid fa-newspaper"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Journals &amp; Periodicals Subscriptions
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: isSyncing ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: isSyncing ? '#6366F1' : '#10B981',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <i className={`fa-solid ${isSyncing ? 'fa-arrows-rotate fa-spin' : 'fa-circle-check'}`} style={{ fontSize: '9px' }}></i>
                  {isSyncing ? 'Syncing...' : 'Live Sync'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Academic journals, peer-reviewed publications &amp; technical magazines &bull; Last Synced: {lastSyncTime}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/unilms/org/library/books" className="btn btn-outline" style={{ textDecoration: 'none', padding: '10px 16px', borderRadius: '10px' }}>
              <i className="fa-solid fa-book me-1"></i> Catalog OPAC
            </Link>
            <button
              onClick={handleOpenAddModal}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-plus"></i> New Subscription
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
            <input
              type="text"
              placeholder="Search journal title, ISSN, or publisher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '42px', borderRadius: '10px' }}
            />
          </div>
          <div style={{ minWidth: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ height: '42px', borderRadius: '10px' }}
            >
              <option value="All">All Statuses ({periodicals.length})</option>
              <option value="Active">Active Subscriptions</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Periodical / Journal Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Type &amp; ISSN</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Frequency</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Publisher</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>Annual Cost</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={7} rows={pageSize || 5} />
                ) : paginatedPeriodicals.length > 0 ? (
                  paginatedPeriodicals.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1E293B' }}>
                        {p.title}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '11.5px' }}>
                          {p.type}
                        </span>
                        {p.issn && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>ISSN: {p.issn}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {p.frequency}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>
                        {p.publisher || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#059669' }}>
                        ₹{Number(p.annualCost || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: p.status === 'Active' ? '#DCFCE7' : '#FEE2E2',
                          color: p.status === 'Active' ? '#16A34A' : '#DC2626'
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px' }}
                            title="Edit Periodical"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', color: '#DC2626', borderColor: '#FEE2E2' }}
                            title="Delete Subscription"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      No periodicals found. Click 'New Subscription' to add an academic journal.
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
            itemName="periodicals"
          />
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                  {editingPeriodical ? 'Edit Periodical Subscription' : 'New Periodical / Journal Subscription'}
                </h3>
                <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Publication Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACM Computing Surveys"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="form-select"
                    >
                      <option value="Journal">Academic Journal</option>
                      <option value="Magazine">Technical Magazine</option>
                      <option value="Research Paper">Research Digest</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>ISSN</label>
                    <input
                      type="text"
                      placeholder="e.g. 0360-0300"
                      value={formData.issn}
                      onChange={(e) => setFormData({ ...formData, issn: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Frequency</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="form-select"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Bi-Monthly">Bi-Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annual">Annual</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Annual Fee (₹)</label>
                    <input
                      type="number"
                      value={formData.annual_cost}
                      onChange={(e) => setFormData({ ...formData, annual_cost: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Publisher Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. IEEE / Springer Nature"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={handleCloseModal} className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#10B981', color: '#fff', padding: '8px 18px', borderRadius: '8px', border: 'none', fontWeight: '700' }}>
                    {editingPeriodical ? 'Save Changes' : 'Subscribe Periodical'}
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

export default OrgLibraryPeriodicals;
