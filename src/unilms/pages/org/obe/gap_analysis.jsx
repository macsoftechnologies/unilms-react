import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import academicsService from '../../../services/academics.service';
import apiClient from '../../../services/api';

const OrgObeGapAnalysis = () => {
  const [gaps, setGaps] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const [formData, setFormData] = useState({
    subject: '',
    co_code: 'CO1',
    attained_value: '55.0',
    target_value: '60.0',
    gap_identified: '',
    action_plan: '',
    status: 'IDENTIFIED'
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [subs, gapsRes] = await Promise.all([
          academicsService.getSubjects().catch(() => []),
          apiClient.get('/tenants/settings/obe_gap_analysis').catch(() => null)
        ]);
        if (Array.isArray(subs) && subs.length > 0) {
          setSubjects(subs);
          setFormData((prev) => ({
            ...prev,
            subject: prev.subject || `${subs[0].code} - ${subs[0].name}`,
          }));
        }
        if (gapsRes?.data?.value && Array.isArray(gapsRes.data.value)) {
          setGaps(gapsRes.data.value);
        }
      } catch (e) {
        console.warn('Failed to load data for gap analysis:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(gaps, 5);

  const persistGaps = (updated) => {
    setGaps(updated);
    apiClient.post('/tenants/settings/obe_gap_analysis', { value: updated }).catch(() => {});
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRecordGap = (e) => {
    e.preventDefault();
    if (!formData.gap_identified.trim() || !formData.action_plan.trim()) return;

    const parts = formData.subject.split(' - ');
    const code = parts[0] || 'SUB';
    const name = parts[1] || 'Course Subject';

    const newGap = {
      id: Date.now(),
      subject_code: code,
      subject_name: name,
      co_code: formData.co_code,
      attained_value: parseFloat(formData.attained_value) || 0,
      target_value: parseFloat(formData.target_value) || 60,
      gap_identified: formData.gap_identified.trim(),
      action_plan: formData.action_plan.trim(),
      status: formData.status
    };

    const updated = [newGap, ...gaps];
    persistGaps(updated);
    setFormData(prev => ({
      ...prev,
      gap_identified: '',
      action_plan: '',
      status: 'IDENTIFIED'
    }));
    showToast(`Action plan recorded for ${code} ${formData.co_code}!`);
  };

  const handleDelete = (id, co_code) => {
    if (window.confirm(`Delete gap entry for ${co_code}?`)) {
      const updated = gaps.filter(g => g.id !== id);
      persistGaps(updated);
      showToast(`Gap record for ${co_code} deleted.`);
    }
  };

  return (
    <>
      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* Top Header Card matching Reference UI */}
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
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
              }}
            >
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                CO Gap Analysis &amp; Action Plan
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Identify un-attained Course Outcomes, document root causes &amp; plan remedial teaching interventions.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/unilms/faculty/co_po_matrix"
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #D97706, #B45309)',
                border: 'none',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '10px',
                color: '#fff',
                textDecoration: 'none'
              }}
            >
              <i className="fa-solid fa-table-cells"></i>
              <span>CO-PO Matrix</span>
            </Link>
            <Link
              to="/unilms/faculty/po_setup"
              className="btn btn-outline"
              style={{
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                background: '#fff',
                border: '1px solid var(--border-color)'
              }}
            >
              <i className="fa-solid fa-bullseye text-primary"></i>
              <span>PO Setup</span>
            </Link>
          </div>
        </div>

        {/* Form and List Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '24px', alignItems: 'start' }}>
          {/* New Gap Form */}
          <div className="card" style={{ padding: '22px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <h2 style={{ marginTop: 0, fontSize: '17px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-circle-plus" style={{ color: '#7C3AED' }}></i> Record New Gap
            </h2>
            <form onSubmit={handleRecordGap}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Subject Course *</label>
                <select
                  required
                  className="form-control"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                >
                  {subjects.length === 0 ? (
                    <option value="">No subjects in database</option>
                  ) : (
                    subjects.map((s) => (
                      <option key={s.id} value={`${s.code} - ${s.name}`}>
                        {s.code} - {s.name} {s.departmentCode ? `[Dept: ${s.departmentCode}]` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>CO Code (e.g. CO1, CO2) *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="CO3"
                    value={formData.co_code}
                    onChange={(e) => setFormData({ ...formData, co_code: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Status *</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="IDENTIFIED">Identified</option>
                    <option value="IN PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Attained (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    className="form-control"
                    value={formData.attained_value}
                    onChange={(e) => setFormData({ ...formData, attained_value: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Target (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    className="form-control"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Gap Identified *</label>
                <textarea
                  required
                  className="form-control"
                  rows="2"
                  placeholder="Specific academic bottleneck observed in tests or lab exercises..."
                  value={formData.gap_identified}
                  onChange={(e) => setFormData({ ...formData, gap_identified: e.target.value })}
                ></textarea>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Corrective Action Plan *</label>
                <textarea
                  required
                  className="form-control"
                  rows="2"
                  placeholder="Intervention strategy (remedial tutorials, lab sessions, practice problem sets)..."
                  value={formData.action_plan}
                  onChange={(e) => setFormData({ ...formData, action_plan: e.target.value })}
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontWeight: '700', borderRadius: '10px', background: '#7C3AED', border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }}
              >
                <i className="fa-solid fa-floppy-disk me-2"></i> Record Action Plan
              </button>
            </form>
          </div>

          {/* Identified Gaps List */}
          <div>
            <div className="card" style={{ padding: '22px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-list-check" style={{ color: '#7C3AED' }}></i> Identified Gaps &amp; Remedial Action Plans
                </h2>
                <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}>
                  {gaps.length} Items
                </span>
              </div>

              <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Subject &amp; CO</th>
                      <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Att. / Tgt.</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Action Plan</th>
                      <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableSkeletonLoader columns={5} rows={pageSize || 5} />
                    ) : paginatedItems.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No gaps recorded yet.</td></tr>
                    ) : (
                      paginatedItems.map((g) => (
                        <tr key={g.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontWeight: '800', color: '#7C3AED', background: 'rgba(124, 58, 237, 0.08)', padding: '3px 8px', borderRadius: '6px', marginRight: '6px' }}>
                              {g.co_code}
                            </span>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', fontWeight: '600' }}>
                              {g.subject_name}
                            </div>
                          </td>
                          <td style={{ padding: '14px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{ color: '#DC2626', fontWeight: '800', fontSize: '13px' }}>{g.attained_value}%</span>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Target: {g.target_value}%</div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12.5px', maxWidth: '300px' }}>
                            <div style={{ marginBottom: '3px' }}><strong>Gap:</strong> {g.gap_identified}</div>
                            <div style={{ color: 'var(--text-secondary)' }}><strong>Action:</strong> {g.action_plan}</div>
                          </td>
                          <td style={{ padding: '14px 14px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '800',
                              background: g.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : g.status === 'IN PROGRESS' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: g.status === 'COMPLETED' ? '#059669' : g.status === 'IN PROGRESS' ? '#2563EB' : '#D97706'
                            }}>
                              {g.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', padding: '14px 16px' }}>
                            <button
                              type="button"
                              onClick={() => handleDelete(g.id, g.co_code)}
                              className="btn-icon"
                              style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', cursor: 'pointer' }}
                              title="Delete"
                            >
                              <i className="fa-solid fa-trash" style={{ fontSize: '12px' }}></i>
                            </button>
                          </td>
                        </tr>
                      ))
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
                itemName="identified gap action plans"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default OrgObeGapAnalysis;
