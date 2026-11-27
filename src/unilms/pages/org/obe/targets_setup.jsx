import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../../services/api';

const DEFAULT_OBE_TARGETS = {
  cie: {
    target_percentage: 60,
    level_1: 50,
    level_2: 65,
    level_3: 80
  },
  see: {
    target_percentage: 50,
    level_1: 50,
    level_2: 60,
    level_3: 75
  },
  weights: {
    direct_weight: 80,
    indirect_weight: 20
  }
};

const OrgObeTargetsSetup = () => {
  const [targets, setTargets] = useState(DEFAULT_OBE_TARGETS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadTargets = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/tenants/settings/obe_attainment_targets');
        if (res?.data?.value && typeof res.data.value === 'object') {
          setTargets(res.data.value);
        } else {
          setTargets(DEFAULT_OBE_TARGETS);
        }
      } catch {
        setTargets(DEFAULT_OBE_TARGETS);
      } finally {
        setLoading(false);
      }
    };

    loadTargets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/tenants/settings/obe_attainment_targets', { value: targets });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save OBE targets', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '880px' }}>
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
            <i className="fa-solid fa-bullseye"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              OBE Attainment Targets &amp; Rubric Thresholds
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Set institutional thresholds for calculating CO, PO, and PSO 3-level attainment &bull; NBA / NAAC Compliant
            </p>
          </div>
        </div>

        <div>
          <Link
            to="/unilms/org/academics/dashboard"
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
              gap: '8px'
            }}
          >
            <i className="fa-solid fa-arrow-left" style={{ color: '#0284C7' }}></i>
            <span>Academics Hub</span>
          </Link>
        </div>
      </div>

      <div className="card" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        {saveSuccess && (
          <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-circle-check"></i>
            Global OBE attainment targets saved successfully!
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-circle-notch fa-spin fa-2x mb-3" style={{ color: '#0284C7' }}></i>
            <p>Loading OBE attainment parameters...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* CIE Section */}
            <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>CIE</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Continuous Internal Evaluation Targets</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Target Mark Percentage (%) *</label>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Minimum score a student must attain on internal exams.</div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    className="form-control"
                    value={targets.cie?.target_percentage || 60}
                    onChange={(e) => setTargets({ ...targets, cie: { ...targets.cie, target_percentage: Number(e.target.value) } })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Level 1 Threshold (%)</label>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>% students crossing target</div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={targets.cie?.level_1 || 50}
                    onChange={(e) => setTargets({ ...targets, cie: { ...targets.cie, level_1: Number(e.target.value) } })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Level 2 Threshold (%)</label>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>% students crossing target</div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={targets.cie?.level_2 || 65}
                    onChange={(e) => setTargets({ ...targets, cie: { ...targets.cie, level_2: Number(e.target.value) } })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Level 3 Threshold (%)</label>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>% students crossing target</div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={targets.cie?.level_3 || 80}
                    onChange={(e) => setTargets({ ...targets, cie: { ...targets.cie, level_3: Number(e.target.value) } })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* SEE Section */}
            <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>SEE</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Semester End Examination Targets</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Target Mark Percentage (%) *</label>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Minimum score on terminal semester university exams.</div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    className="form-control"
                    value={targets.see?.target_percentage || 50}
                    onChange={(e) => setTargets({ ...targets, see: { ...targets.see, target_percentage: Number(e.target.value) } })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Level 1 Threshold (%)</label>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>% students crossing target</div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={targets.see?.level_1 || 50}
                    onChange={(e) => setTargets({ ...targets, see: { ...targets.see, level_1: Number(e.target.value) } })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Level 2 Threshold (%)</label>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>% students crossing target</div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={targets.see?.level_2 || 60}
                    onChange={(e) => setTargets({ ...targets, see: { ...targets.see, level_2: Number(e.target.value) } })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Level 3 Threshold (%)</label>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>% students crossing target</div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={targets.see?.level_3 || 75}
                    onChange={(e) => setTargets({ ...targets, see: { ...targets.see, level_3: Number(e.target.value) } })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Direct / Indirect Weights */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Overall Attainment Weightage</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Direct Attainment Weight (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={targets.weights?.direct_weight || 80}
                    onChange={(e) => setTargets({ ...targets, weights: { ...targets.weights, direct_weight: Number(e.target.value) } })}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Indirect Attainment Weight (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={targets.weights?.indirect_weight || 20}
                    onChange={(e) => setTargets({ ...targets, weights: { ...targets.weights, indirect_weight: Number(e.target.value) } })}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Link to="/unilms/org/academics/dashboard" className="btn btn-outline">Cancel</Link>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                  cursor: 'pointer'
                }}
              >
                {saving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Saving Targets...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-save"></i>
                    <span>Save Global Targets</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrgObeTargetsSetup;
