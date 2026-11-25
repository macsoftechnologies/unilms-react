import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import studentsService from '../../../services/students.service';
import academicsService from '../../../services/academics.service';

const sampleBatch = [
  {
    roll_number: '23CSE015',
    first_name: 'Varun',
    last_name: 'Khanna',
    email: 'varun.k@college.edu',
    phone: '+91 98765 88123',
    parent_name: 'Manish Khanna',
    parent_phone: '+91 98765 99123',
    gender: 'Male',
    status: 'Active'
  },
  {
    roll_number: '23CSE016',
    first_name: 'Aishwarya',
    last_name: 'Menon',
    email: 'aishwarya.m@college.edu',
    phone: '+91 98765 88124',
    parent_name: 'K. R. Menon',
    parent_phone: '+91 98765 99124',
    gender: 'Female',
    status: 'Active'
  },
  {
    roll_number: '23IT010',
    first_name: 'Dev',
    last_name: 'Singhal',
    email: 'dev.s@college.edu',
    phone: '+91 98765 88125',
    parent_name: 'Anil Singhal',
    parent_phone: '+91 98765 99125',
    gender: 'Male',
    status: 'Active'
  }
];

const OrgStudentsImport = () => {
  const navigate = useNavigate();
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [fileSelected, setFileSelected] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [statusMsg, setStatusMsg] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const res = await academicsService.getCohorts();
        const list = Array.isArray(res) ? res : (res?.data || []);
        setCohorts(list);
        if (list.length > 0) setSelectedCohortId(list[0].id);
      } catch (err) {
        console.warn('Could not fetch cohorts:', err);
      }
    };
    fetchCohorts();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileSelected(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      if (typeof text !== 'string') return;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) return;

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/['"]/g, ''));
        if (cols.length < 2) continue;
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx] || '';
        });
        rows.push(row);
      }
      setParsedRows(rows);
      setStatusMsg({ type: 'info', text: `Loaded ${rows.length} records from ${file.name}. Ready to import.` });
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = (e) => {
    e.preventDefault();
    const csvHeader = 'roll_number,first_name,last_name,email,phone,parent_name,parent_phone,gender,status\n';
    const csvRows = sampleBatch.map(s => 
      `${s.roll_number},${s.first_name},${s.last_name},${s.email},${s.phone},${s.parent_name},${s.parent_phone},${s.gender},${s.status}`
    ).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_student_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMsg({ type: 'success', text: 'Sample CSV file template downloaded!' });
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImporting(true);
    setStatusMsg(null);

    try {
      const rowsToImport = parsedRows.length > 0 ? parsedRows : sampleBatch;
      const payload = rowsToImport.map(s => ({
        rollNumber: s.roll_number || s.rollnumber || s.roll_no || s.rollNumber,
        firstName: s.first_name || s.firstname || s.name?.split(' ')[0] || s.firstName,
        lastName: s.last_name || s.lastname || s.name?.split(' ').slice(1).join(' ') || s.lastName || '',
        email: s.email || null,
        phone: s.phone || null,
        parentName: s.parent_name || s.parentname || s.guardian || null,
        parentPhone: s.parent_phone || s.parentphone || null,
        gender: s.gender || 'Other',
        status: s.status || 'Active',
        cohortId: selectedCohortId || null
      }));

      const res = await studentsService.bulkImport(payload);
      const totalImported = res?.imported ?? payload.length;
      const totalExisting = res?.existing ?? 0;

      setStatusMsg({
        type: 'success',
        text: `PostgreSQL Import Complete: ${totalImported} new students onboarded, ${totalExisting} already existed.`
      });

      setTimeout(() => navigate('/unilms/org/students'), 1500);
    } catch (err) {
      console.error('Bulk import error:', err);
      setStatusMsg({ type: 'error', text: `Failed to import students: ${err.response?.data?.message || err.message}` });
    } finally {
      setImporting(false);
    }
  };

  return (
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
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            <i className="fa-solid fa-file-import"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Bulk Student Import (CSV / Excel)
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Upload a CSV file or load standard cohort batches to create multiple student master records &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/unilms/org/students" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', whiteSpace: 'nowrap' }}>
          <i className="fa-solid fa-arrow-left" style={{ color: '#2563EB' }}></i>
          <span>Student Directory</span>
        </Link>
        </div>
      </div>

      {statusMsg && (
        <div style={{ background: statusMsg.type === 'success' ? '#10B981' : '#3B82F6', color: '#fff', padding: '14px 20px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: '18px' }}></i>
          {statusMsg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', alignItems: 'start' }}>
        {/* Upload Form Card */}
        <div className="card" style={{ padding: '28px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-cloud-arrow-up" style={{ color: '#7c3aed' }}></i> Upload & Process CSV File
          </h3>

          <form onSubmit={handleImportSubmit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Default Cohort / Batch *</label>
              <select 
                value={selectedCohortId} 
                onChange={(e) => setSelectedCohortId(e.target.value)} 
                className="form-control"
                style={{ borderRadius: '8px' }}
              >
                {cohorts.length > 0 ? (
                  cohorts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.program ? `(${c.program.code || c.program.name})` : ''}</option>
                  ))
                ) : (
                  <option value="">Default Cohort</option>
                )}
              </select>
              <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Assigned automatically if cohort column is blank in the CSV.
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>CSV Data File *</label>
              <div style={{ border: '2px dashed #cbd5e1', padding: '24px', borderRadius: '10px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer' }}>
                <i className="fa-solid fa-file-csv" style={{ fontSize: '36px', color: '#7c3aed', marginBottom: '10px', display: 'block' }}></i>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                  id="csv-file-input" 
                />
                <label htmlFor="csv-file-input" style={{ cursor: 'pointer', fontWeight: '700', color: '#7c3aed', display: 'block' }}>
                  {fileSelected ? fileSelected : 'Click to select CSV file from your device'}
                </label>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supported formats: UTF-8 encoded .CSV (Max 10MB)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                type="submit" 
                disabled={importing}
                className="btn btn-primary" 
                style={{ 
                  flex: '1', 
                  padding: '12px 20px', 
                  borderRadius: '10px', 
                  fontWeight: '700', 
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', 
                  border: 'none', 
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)', 
                  color: '#fff', 
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <i className={`fa-solid ${importing ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i> 
                {importing ? 'Processing & Validating...' : 'Process & Import Students'}
              </button>
              <button 
                type="button" 
                onClick={handleDownloadSample} 
                className="btn btn-outline" 
                style={{ padding: '12px 18px', borderRadius: '10px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-download"></i> Sample CSV
              </button>
            </div>
          </form>
        </div>

        {/* Specifications Card */}
        <div className="card" style={{ padding: '26px', borderRadius: '14px', background: 'rgba(124, 58, 237, 0.03)', border: '1px solid rgba(124, 58, 237, 0.18)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-circle-info"></i> CSV Column Specifications
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
            Your CSV spreadsheet must include the following headers in row 1. Missing columns will default to blank or Active status.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>roll_number</span>
              <span className="badge" style={{ background: '#fee2e2', color: '#ef4444', fontWeight: '700' }}>Required</span>
            </div>
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>first_name</span>
              <span className="badge" style={{ background: '#fee2e2', color: '#ef4444', fontWeight: '700' }}>Required</span>
            </div>
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>last_name</span>
              <span style={{ color: 'var(--text-muted)' }}>Optional</span>
            </div>
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>email, phone</span>
              <span style={{ color: 'var(--text-muted)' }}>Optional</span>
            </div>
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>parent_name, parent_phone</span>
              <span style={{ color: 'var(--text-muted)' }}>Optional</span>
            </div>
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>gender, status</span>
              <span style={{ color: 'var(--text-muted)' }}>Default: Active</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrgStudentsImport;