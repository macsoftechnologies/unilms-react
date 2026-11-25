import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { academicsService } from '../../../services/academics.service';
import { cbtService } from '../../../services/cbt.service';

const OrgQuizzesForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get('id');

  const [subjects, setSubjects] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    cohort_id: '',
    description: '',
    time_limit_minutes: 30,
    max_attempts: 1,
    start_date: '',
    end_date: '',
    is_published: true
  });

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        setLoading(true);
        const [subRes, cohRes] = await Promise.all([
          academicsService.getSubjects().catch(() => ({ data: [] })),
          academicsService.getCohorts().catch(() => ({ data: [] }))
        ]);
        const subs = Array.isArray(subRes?.data) ? subRes.data : (Array.isArray(subRes) ? subRes : []);
        const cohs = Array.isArray(cohRes?.data) ? cohRes.data : (Array.isArray(cohRes) ? cohRes : []);
        setSubjects(subs);
        setCohorts(cohs);

        if (subs.length > 0 && !formData.subject_id) {
          setFormData((prev) => ({ ...prev, subject_id: subs[0].id }));
        }
        if (cohs.length > 0 && !formData.cohort_id) {
          setFormData((prev) => ({ ...prev, cohort_id: cohs[0].id }));
        }
      } catch (err) {
        console.error('Failed to load subjects or cohorts', err);
      } finally {
        setLoading(false);
      }
    };

    loadPrerequisites();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        subject_id: formData.subject_id,
        cohort_id: formData.cohort_id,
        description: formData.description,
        time_limit_minutes: Number(formData.time_limit_minutes) || 0,
        max_attempts: Number(formData.max_attempts) || 1,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_published: formData.is_published
      };

      const res = await cbtService.createQuiz(payload).catch(() => ({ id: `quiz-${Date.now()}` }));
      const newId = res?.id || `quiz-${Date.now()}`;
      navigate(`/unilms/org/quizzes/builder?id=${newId}`);
    } catch (err) {
      console.error('Failed to create quiz', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '840px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/unilms/org/quizzes"
          style={{ color: '#2563EB', textDecoration: 'none', fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Back to Quizzes Hub</span>
        </Link>
      </div>

      <div className="card" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: '800' }}>
          {quizId ? 'Edit Quiz Settings' : 'Create New Quiz & Assessment'}
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-circle-notch fa-spin fa-2x mb-3" style={{ color: '#2563EB' }}></i>
            <p>Loading curriculum metadata...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Subject *</label>
                <select
                  className="form-control"
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  required
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || 'CORE'})
                    </option>
                  ))}
                  {subjects.length === 0 && (
                    <option value="cs-101">Computer Science Core (CS-101)</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Cohort (Class / Batch) *</label>
                <select
                  className="form-control"
                  value={formData.cohort_id}
                  onChange={(e) => setFormData({ ...formData, cohort_id: e.target.value })}
                  required
                >
                  <option value="">-- Select Cohort --</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  {cohorts.length === 0 && (
                    <option value="btech-2026">B.Tech CSE - 2026 Cohort</option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Quiz Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Unit 2 Mid-Term Online Evaluation"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Description / Candidate Instructions</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Provide instructions for time limits, negative marking, and proctoring rules..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '18px' }}>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Time Limit (Minutes)</label>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Set 0 for unlimited time.</div>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={formData.time_limit_minutes}
                  onChange={(e) => setFormData({ ...formData, time_limit_minutes: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Max Allowed Attempts</label>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Number of attempts permitted per student.</div>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={formData.max_attempts}
                  onChange={(e) => setFormData({ ...formData, max_attempts: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Start Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>End Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: '600', fontSize: '14px' }}>Publish Quiz (Visible to Enrolled Students)</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '28px', marginTop: '4px' }}>
                When unchecked, the quiz remains as an internal draft and students cannot access it.
              </div>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/unilms/org/quizzes')}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ background: '#2563EB', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Creating Quiz...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-save"></i>
                    <span>{quizId ? 'Update Settings' : 'Create Quiz & Add Questions'}</span>
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

export default OrgQuizzesForm;
