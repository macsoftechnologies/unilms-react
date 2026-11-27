import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';
import apiClient from '../../../services/api';

const OrgExaminationsFinance = () => {
  const [grants, setGrants] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);

  const [grantForm, setGrantForm] = useState({
    grant_type: '',
    source: '',
    amount: '',
    received_date: new Date().toISOString().split('T')[0],
    purpose: ''
  });

  const [expForm, setExpForm] = useState({
    head: '',
    exam_name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/tenants/settings/exam_finance').catch(() => null);
        if (res?.data?.value && typeof res.data.value === 'object') {
          setGrants(Array.isArray(res.data.value.grants) ? res.data.value.grants : []);
          setExpenditures(Array.isArray(res.data.value.expenditures) ? res.data.value.expenditures : []);
        } else {
          setGrants([]);
          setExpenditures([]);
        }
      } catch {
        setGrants([]);
        setExpenditures([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  const syncFinance = (newGrants, newExp) => {
    apiClient.post('/tenants/settings/exam_finance', {
      value: { grants: newGrants, expenditures: newExp }
    }).catch((err) => console.error('Failed to sync exam finance to PostgreSQL', err));
  };

  const handleAddGrant = (e) => {
    e.preventDefault();
    if (!grantForm.grant_type || !grantForm.amount) return;
    const newGrant = {
      id: Date.now(),
      grant_type: grantForm.grant_type,
      source: grantForm.source,
      amount: Number(grantForm.amount),
      received_date: grantForm.received_date,
      purpose: grantForm.purpose
    };
    const updated = [newGrant, ...grants];
    setGrants(updated);
    syncFinance(updated, expenditures);
    setIsGrantModalOpen(false);
    setGrantForm({ grant_type: '', source: '', amount: '', received_date: new Date().toISOString().split('T')[0], purpose: '' });
  };

  const handleAddExp = (e) => {
    e.preventDefault();
    if (!expForm.head || !expForm.amount) return;
    const newExp = {
      id: Date.now(),
      head: expForm.head,
      exam_name: expForm.exam_name,
      amount: Number(expForm.amount),
      date: expForm.date,
      description: expForm.description
    };
    const updated = [newExp, ...expenditures];
    setExpenditures(updated);
    syncFinance(grants, updated);
    setIsExpModalOpen(false);
    setExpForm({ head: '', exam_name: 'End Sem Finals', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  };

  const totalGrantsAmount = grants.reduce((sum, g) => sum + Number(g.amount || 0), 0);
  const totalExpAmount = expenditures.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netBalance = totalGrantsAmount - totalExpAmount;

  const {
    currentPage: grantsPage,
    setCurrentPage: setGrantsPage,
    pageSize: grantsPageSize,
    setPageSize: setGrantsPageSize,
    paginatedItems: paginatedGrants,
    totalItems: totalGrants
  } = useTablePagination(grants, 5);

  const {
    currentPage: expPage,
    setCurrentPage: setExpPage,
    pageSize: expPageSize,
    setPageSize: setExpPageSize,
    paginatedItems: paginatedExp,
    totalItems: totalExp
  } = useTablePagination(expenditures, 5);

  return (
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
              background: 'linear-gradient(135deg, #059669, #0D9488)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
            }}
          >
            <i className="fa-solid fa-file-invoice-dollar"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Examination Finance &amp; Budget Ledger
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Special grants, university allocation, invigilator honorarium &amp; logistics expenditure
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsGrantModalOpen(true)}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add Grant</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExpModalOpen(true)}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-receipt"></i>
            <span>Record Expenditure</span>
          </button>
          <Link
            to="/unilms/org/examinations"
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
            <i className="fa-solid fa-arrow-left" style={{ color: '#059669' }}></i>
            <span>Exams Hub</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#fff' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Grants Allocated</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>₹{totalGrantsAmount.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{grants.length} Recognized Grant Sources</div>
        </div>
        <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#fff' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Expenditures Incurred</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>₹{totalExpAmount.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{expenditures.length} Logged Disbursements</div>
        </div>
        <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#fff' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Available Budget</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: netBalance >= 0 ? '#2563EB' : '#DC2626', marginTop: '4px' }}>₹{netBalance.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Audited Ledger Balance</div>
        </div>
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '20px' }}>
        {/* Grants Table */}
        <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', background: '#fff' }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#059669' }}>
            <i className="fa-solid fa-hand-holding-dollar me-2"></i> Examination Grants
          </h4>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Grant Type</th>
                  <th style={{ padding: '10px 12px' }}>Source</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader rows={3} columns={3} />
                ) : paginatedGrants.length > 0 ? (
                  paginatedGrants.map((g) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '600' }}>{g.grant_type}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{g.source}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>₹{Number(g.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No grants recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenditures Table */}
        <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', background: '#fff' }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#DC2626' }}>
            <i className="fa-solid fa-receipt me-2"></i> Operational Expenditures
          </h4>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Disbursement Head</th>
                  <th style={{ padding: '10px 12px' }}>Cycle</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader rows={3} columns={3} />
                ) : paginatedExp.length > 0 ? (
                  paginatedExp.map((e) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '600' }}>{e.head}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{e.exam_name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#DC2626' }}>₹{Number(e.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No expenditures logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grant Modal */}
      {isGrantModalOpen && (
        <div className="drawer-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999 }}>
          <div className="drawer-content" style={{ background: '#fff', borderRadius: '16px', maxWidth: '480px', width: '90%', padding: '24px' }}>
            <form onSubmit={handleAddGrant}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '700' }}>Record New Examination Grant</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Grant Type *</label>
                  <input type="text" className="form-control" required value={grantForm.grant_type} onChange={e => setGrantForm({ ...grantForm, grant_type: e.target.value })} placeholder="e.g. State Examination Council Grant" />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Funding Source *</label>
                  <input type="text" className="form-control" required value={grantForm.source} onChange={e => setGrantForm({ ...grantForm, source: e.target.value })} placeholder="e.g. Directorate of Technical Education" />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Amount (INR) *</label>
                  <input type="number" min="0" className="form-control" required value={grantForm.amount} onChange={e => setGrantForm({ ...grantForm, amount: e.target.value })} placeholder="e.g. 500000" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsGrantModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#059669', color: '#fff', border: 'none' }}>Save Grant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenditure Modal */}
      {isExpModalOpen && (
        <div className="drawer-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999 }}>
          <div className="drawer-content" style={{ background: '#fff', borderRadius: '16px', maxWidth: '480px', width: '90%', padding: '24px' }}>
            <form onSubmit={handleAddExp}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '700' }}>Log Operational Expenditure</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Disbursement Head *</label>
                  <input type="text" className="form-control" required value={expForm.head} onChange={e => setExpForm({ ...expForm, head: e.target.value })} placeholder="e.g. Answer Booklet Printing" />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Amount (INR) *</label>
                  <input type="number" min="0" className="form-control" required value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} placeholder="e.g. 25000" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsExpModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#DC2626', color: '#fff', border: 'none' }}>Log Expenditure</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default OrgExaminationsFinance;
