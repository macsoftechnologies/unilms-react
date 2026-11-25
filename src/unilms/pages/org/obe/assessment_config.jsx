import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../components';

const initialSessions = [
  { id: '1', session_name: 'B.Tech SEM-1 2024-25', type: 'Internal' },
  { id: '2', session_name: 'B.Tech SEM-2 2024-25', type: 'Internal' },
  { id: '3', session_name: 'End-Term External Winter 2024', type: 'External' },
  { id: '4', session_name: 'Summer Supplementary 2024', type: 'External' }
];

const initialConfigs = [
  { id: '1', sessionId: '1', short_name: 'MID-1 Assessment', max_marks: 30, passing_marks: 12, average_logic: 'Standard', n_value: 1 },
  { id: '2', sessionId: '1', short_name: 'MID-2 Assessment', max_marks: 30, passing_marks: 12, average_logic: 'Best of N', n_value: 1 },
  { id: '3', sessionId: '1', short_name: 'Lab Assignment & Viva', max_marks: 20, passing_marks: 8, average_logic: 'Average of N', n_value: 3 },
  { id: '4', sessionId: '1', short_name: 'Continuous Quiz Series', max_marks: 20, passing_marks: 10, average_logic: 'Best of N', n_value: 4 },
  { id: '5', sessionId: '2', short_name: 'Semester Midterm I', max_marks: 40, passing_marks: 16, average_logic: 'Standard', n_value: 1 },
  { id: '6', sessionId: '3', short_name: 'University Theory Exam', max_marks: 100, passing_marks: 40, average_logic: 'Standard', n_value: 1 }
];

const OrgObeAssessmentConfig = () => {
  const [sessions, setSessions] = useState(initialSessions);
  const [configs, setConfigs] = useState(initialConfigs);
  const [selectedSession, setSelectedSession] = useState('1');
  const [loading, setLoading] = useState(false);

  // Form states
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionType, setNewSessionType] = useState('Internal');

  const [formExamSession, setFormExamSession] = useState('1');
  const [formShortName, setFormShortName] = useState('');
  const [formMaxMarks, setFormMaxMarks] = useState('100');
  const [formPassMarks, setFormPassMarks] = useState('40');
  const [formLogic, setFormLogic] = useState('Standard');
  const [formNValue, setFormNValue] = useState('1');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [selectedSession]);

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    const newSession = {
      id: String(Date.now()),
      session_name: newSessionName.trim(),
      type: newSessionType
    };
    setSessions([...sessions, newSession]);
    setSelectedSession(newSession.id);
    setNewSessionName('');
  };

  const handleAddConfig = (e) => {
    e.preventDefault();
    if (!formShortName.trim()) return;
    const newCfg = {
      id: String(Date.now()),
      sessionId: formExamSession,
      short_name: formShortName.trim(),
      max_marks: parseFloat(formMaxMarks) || 100,
      passing_marks: parseFloat(formPassMarks) || 40,
      average_logic: formLogic,
      n_value: parseInt(formNValue, 10) || 1
    };
    setConfigs([...configs, newCfg]);
    setFormShortName('');
  };

  const filteredConfigs = configs.filter((c) => !selectedSession || c.sessionId === selectedSession);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredConfigs, 5);

  return (
    <section className="view-section active">
      <div className="header-banner" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>
            OBE Assessment Configuration
          </h1>
          <p className="header-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Configure examination sessions, evaluation metrics, and calculation logics.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
        {/* Left Column: Create & Active Sessions */}
        <div>
          <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '24px', background: 'var(--card-bg, #fff)' }}>
            <h2 style={{ marginTop: '0', fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-plus-circle" style={{ color: '#0D9488' }}></i>
              <span>Create Exam Session</span>
            </h2>
            <form onSubmit={handleCreateSession}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Session Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. B.Tech SEM-1 2024-25"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Type</label>
                <select
                  className="form-control"
                  value={newSessionType}
                  onChange={(e) => setNewSessionType(e.target.value)}
                  required
                >
                  <option value="Internal">Internal Assessment</option>
                  <option value="External">External Examination</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', fontWeight: '700', padding: '10px' }}>
                <i className="fa-solid fa-check me-1"></i> Create Session
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)' }}>
            <h2 style={{ marginTop: '0', fontSize: '16px', fontWeight: '800', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-list-check" style={{ color: '#3B82F6' }}></i>
              <span>Active Sessions</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSession(s.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: selectedSession === s.id ? '2px solid #0D9488' : '1px solid var(--border-color)',
                    background: selectedSession === s.id ? 'rgba(13, 148, 136, 0.06)' : 'var(--bg-main, #f8fafc)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>{s.session_name}</div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s.type}</span>
                  </div>
                  {selectedSession === s.id && (
                    <span className="badge" style={{ background: '#0D9488', color: '#fff', fontSize: '11px' }}>Selected</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Assessment Logic & Configured Table */}
        <div className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)' }}>
          <h2 style={{ marginTop: '0', fontSize: '17px', fontWeight: '800', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-sliders" style={{ color: '#7C3AED' }}></i>
            <span>Configure Assessment Logic</span>
          </h2>
          <form onSubmit={handleAddConfig} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Exam Session</label>
                <select
                  className="form-control"
                  value={formExamSession}
                  onChange={(e) => setFormExamSession(e.target.value)}
                  required
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.session_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Short Name (e.g. MID-1)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. MID-1"
                  value={formShortName}
                  onChange={(e) => setFormShortName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Max Marks</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="form-control"
                  value={formMaxMarks}
                  onChange={(e) => setFormMaxMarks(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Passing Marks</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="form-control"
                  value={formPassMarks}
                  onChange={(e) => setFormPassMarks(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Average Logic</label>
                <select
                  className="form-control"
                  value={formLogic}
                  onChange={(e) => setFormLogic(e.target.value)}
                  required
                >
                  <option value="Standard">Standard (No averaging)</option>
                  <option value="Best of N">Best of N</option>
                  <option value="Average of N">Average of N</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>N Value (if applicable)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={formNValue}
                  onChange={(e) => setFormNValue(e.target.value)}
                  disabled={formLogic === 'Standard'}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', fontWeight: '700', padding: '9px 20px' }}>
              <i className="fa-solid fa-floppy-disk me-1"></i> Save Configuration
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Configured Exams for Session: <span style={{ color: '#0D9488' }}>{sessions.find(s => s.id === selectedSession)?.session_name || 'All'}</span>
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Total: {filteredConfigs.length} configured
              </div>
            </div>

            <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="data-table" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Exam Name</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Max / Pass</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Calculation Logic</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader columns={3} rows={pageSize || 5} />
                  ) : paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No examination configurations found for this session.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {c.short_name}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13.5px' }}>
                          <span style={{ fontWeight: '800', color: '#059669' }}>{c.max_marks}</span> / <span style={{ color: 'var(--text-secondary)' }}>{c.passing_marks}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#2563EB',
                              fontWeight: '700',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px'
                            }}
                          >
                            {c.average_logic} {c.average_logic !== 'Standard' ? `(N = ${c.n_value})` : ''}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemName="assessment configurations"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrgObeAssessmentConfig;
