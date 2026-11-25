import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import obeService from '../../services/obe.service';
import academicsService from '../../services/academics.service';

const FacultyPoSetup = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    type: 'PO',
    description: '',
  });

  const loadInitial = async () => {
    setLoading(true);
    try {
      const progList = await academicsService.getPrograms();
      setPrograms(progList || []);
      if (progList && progList.length > 0) {
        setSelectedProgram(progList[0].id);
      }
    } catch (e) {
      console.error('Failed to load programs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const loadPos = async (progId) => {
    if (!progId) return;
    setLoading(true);
    try {
      const poList = await obeService.getPos(progId);
      setOutcomes(poList || []);
    } catch (e) {
      console.error('Failed to load POs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProgram) {
      loadPos(selectedProgram);
    }
  }, [selectedProgram]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedOutcomes,
    totalItems
  } = useTablePagination(outcomes, 10);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenAdd = () => {
    setFormData({
      code: `PO${outcomes.filter(o => o.type === 'PO').length + 1}`,
      type: 'PO',
      description: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveOutcome = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.description.trim() || !selectedProgram) return;

    try {
      await obeService.createPo({
        programId: selectedProgram,
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        description: formData.description.trim(),
      });

      showToast(`Outcome ${formData.code} created successfully!`);
      setIsAddModalOpen(false);
      loadPos(selectedProgram);
    } catch (err) {
      alert('Failed to save PO: ' + err.message);
    }
  };

  const poCount = outcomes.filter(o => o.type === 'PO').length;
  const psoCount = outcomes.filter(o => o.type === 'PSO').length;

  return (
    <>
      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13.5px' }}>
              <i className="fa-solid fa-circle-check"></i>
              {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px 26px', marginBottom: '22px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)' }}>
              <i className="fa-solid fa-award"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                Program Outcomes (PO) &amp; PSOs
              </h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Configure Graduate Attributes, NBA Criteria 1 &bull; AY 2026&ndash;2027
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="btn btn-primary"
              style={{ padding: '10px 18px', fontSize: '13px', fontWeight: '700', borderRadius: '10px', background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Outcome
            </button>
          </div>
        </div>

        {/* Program Filter Card */}
        <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Select Academic Degree Program</label>
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="form-control"
            style={{ maxWidth: '600px', height: '42px', fontSize: '14px' }}
          >
            <option value="">-- Choose Program --</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </div>

        {/* Statistical Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>NBA PROGRAM OUTCOMES</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#7C3AED' }}>{poCount} POs</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>PROGRAM SPECIFIC (PSOs)</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563EB' }}>{psoCount} PSOs</div>
          </div>
        </div>

        {/* Outcomes Table */}
        <div className="card" style={{ padding: 0, borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', background: '#fff', overflow: 'hidden' }}>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', width: '100px' }}>Code</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', width: '100px' }}>Type</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px' }}>Description / Graduate Attribute</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={3} rows={5} />
                ) : paginatedOutcomes.length > 0 ? (
                  paginatedOutcomes.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '800', color: o.type === 'PO' ? '#7C3AED' : '#2563EB' }}>{o.code}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className="badge" style={{
                          background: o.type === 'PO' ? '#EDE9FE' : '#DBEAFE',
                          color: o.type === 'PO' ? '#6D28D9' : '#1E40AF',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          {o.type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13.5px', color: '#334155' }}>{o.description}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      No program outcomes configured yet for this program. Click 'Add Outcome' above.
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
            itemName="outcomes"
          />
        </div>

        {/* Add Outcome Slide-Over Drawer */}
        {isAddModalOpen && (
          <div
            id="poDrawerOverlay"
            onClick={(e) => {
              if (e.target.id === 'poDrawerOverlay') setIsAddModalOpen(false);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                width: 'min(500px, 100vw)',
                height: '100vh',
                background: '#fff',
                boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSaveOutcome} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      <i className="fa-solid fa-award"></i>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
                      Add Program Outcome
                    </h3>
                  </div>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#64748b', cursor: 'pointer' }}>
                    &times;
                  </button>
                </div>

                <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>Outcome Code</label>
                      <input
                        type="text"
                        placeholder="PO1 or PSO1"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="form-control"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="form-control"
                      >
                        <option value="PO">Program Outcome (PO)</option>
                        <option value="PSO">Program Specific (PSO)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>Graduate Attribute Description</label>
                    <textarea
                      rows={5}
                      placeholder="Describe engineering knowledge, problem analysis or specific competency..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="btn btn-outline"
                    style={{ padding: '9px 18px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '9px 20px', borderRadius: '8px', background: '#7C3AED', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Save Outcome
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

export default FacultyPoSetup;
