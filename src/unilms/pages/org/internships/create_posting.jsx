import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import placementsService from '../../../services/placements.service';
import { getStoredInternships, saveStoredInternships } from '../placements/placementsData';

const OrgInternshipsCreatePosting = () => {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const targetId = paramId || queryId;

  const [internships, setInternships] = useState(getStoredInternships());
  const [isEditing, setIsEditing] = useState(false);

  // Department options
  const departments = [
    { id: 1, name: 'Computer Science & Engineering' },
    { id: 2, name: 'Information Technology' },
    { id: 3, name: 'Electronics & Communication' },
    { id: 4, name: 'Mechanical Engineering' },
    { id: 5, name: 'Civil Engineering' }
  ];

  // Helper date generators
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getFutureDateStr = (days) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0];

  // Master Form State
  const [formData, setFormData] = useState({
    company_name: '',
    role_title: '',
    description: '',
    work_mode: 'onsite',
    location: '',
    stipend_amount: '0',
    total_seats: '5',
    min_cgpa: '6.5',
    start_date: getTodayStr(),
    end_date: getFutureDateStr(56), // +8 weeks
    application_deadline: getFutureDateStr(14), // +2 weeks
    target_department_id: ''
  });

  // Milestones State
  const [milestones, setMilestones] = useState([
    {
      id: 1,
      title: 'Week 1-2: Environment Setup, Architecture & Tech Stack Foundations',
      is_midpoint_gate: false,
      tasks: [
        { id: 101, task_title: 'Setup repository, local Docker container, and security clearance', submission_type: 'link', estimated_hours: 6 },
        { id: 102, task_title: 'Review system design specification and high-level architecture', submission_type: 'file', estimated_hours: 8 }
      ]
    },
    {
      id: 2,
      title: 'Week 3-6: Core Feature Development & Midpoint Code Audit',
      is_midpoint_gate: true,
      tasks: [
        { id: 201, task_title: 'Implement sprint user stories and CI/CD automated test pipeline', submission_type: 'link', estimated_hours: 18 },
        { id: 202, task_title: 'Midpoint progress demo & mentor feedback assessment', submission_type: 'text', estimated_hours: 4 }
      ]
    },
    {
      id: 3,
      title: 'Week 7-8: Production Deployment, Capstone Defense & PPO Evaluation',
      is_midpoint_gate: false,
      tasks: [
        { id: 301, task_title: 'Deliver final capstone project presentation and defense', submission_type: 'file', estimated_hours: 12 },
        { id: 302, task_title: 'Final TPO audit & Pre-Placement Offer (PPO) conversion review', submission_type: 'text', estimated_hours: 4 }
      ]
    }
  ]);

  // Load existing posting if editing
  useEffect(() => {
    if (targetId) {
      const existing = internships.find(i => String(i.id) === String(targetId));
      if (existing) {
        setIsEditing(true);
        setFormData({
          company_name: existing.company_name || '',
          role_title: existing.role_title || '',
          description: existing.description || 'Comprehensive corporate internship program with sequential milestone roadmaps.',
          work_mode: (existing.work_mode || 'onsite').toLowerCase(),
          location: existing.location || '',
          stipend_amount: String(existing.stipend_amount || '0'),
          total_seats: String(existing.total_seats || '5'),
          min_cgpa: String(existing.min_cgpa || '6.5'),
          start_date: existing.start_date || getTodayStr(),
          end_date: existing.end_date || getFutureDateStr(56),
          application_deadline: existing.application_deadline || getFutureDateStr(14),
          target_department_id: existing.target_department_id || ''
        });

        if (existing.milestones && existing.milestones.length > 0) {
          // If milestones were strings
          if (typeof existing.milestones[0] === 'string') {
            setMilestones(existing.milestones.map((mTitle, idx) => ({
              id: Date.now() + idx,
              title: mTitle,
              is_midpoint_gate: idx === 1,
              tasks: [
                { id: Date.now() + idx * 10 + 1, task_title: `Deliverable milestone ${idx + 1} sprint tasks`, submission_type: 'file', estimated_hours: 8 }
              ]
            })));
          } else {
            setMilestones(existing.milestones);
          }
        }
      }
    }
  }, [targetId]);

  // Handlers for Master Form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Milestone Actions
  const handleAddMilestone = () => {
    const newMIndex = milestones.length + 1;
    const newMilestone = {
      id: Date.now(),
      title: `Milestone ${newMIndex}: Phase ${newMIndex} Objectives & Deliverables`,
      is_midpoint_gate: false,
      tasks: [
        { id: Date.now() + 1, task_title: 'Initial sprint task deliverable', submission_type: 'file', estimated_hours: 6 }
      ]
    };
    setMilestones(prev => [...prev, newMilestone]);
  };

  const handleRemoveMilestone = (mId) => {
    setMilestones(prev => prev.filter(m => m.id !== mId));
  };

  const handleMilestoneTitleChange = (mId, title) => {
    setMilestones(prev => prev.map(m => m.id === mId ? { ...m, title } : m));
  };

  const handleMilestoneGateChange = (mId, is_midpoint_gate) => {
    setMilestones(prev => prev.map(m => m.id === mId ? { ...m, is_midpoint_gate } : m));
  };

  // Task Actions inside Milestone
  const handleAddTask = (mId) => {
    const newTask = {
      id: Date.now(),
      task_title: '',
      submission_type: 'file',
      estimated_hours: 6
    };
    setMilestones(prev => prev.map(m => {
      if (m.id === mId) {
        return { ...m, tasks: [...m.tasks, newTask] };
      }
      return m;
    }));
  };

  const handleRemoveTask = (mId, tId) => {
    setMilestones(prev => prev.map(m => {
      if (m.id === mId) {
        return { ...m, tasks: m.tasks.filter(t => t.id !== tId) };
      }
      return m;
    }));
  };

  const handleTaskChange = (mId, tId, field, value) => {
    setMilestones(prev => prev.map(m => {
      if (m.id === mId) {
        return {
          ...m,
          tasks: m.tasks.map(t => t.id === tId ? { ...t, [field]: value } : t)
        };
      }
      return m;
    }));
  };

  // Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company_name || !formData.role_title) {
      alert('Please fill in Company Name and Internship Role Title.');
      return;
    }

    const simpleMilestoneTitles = milestones.map((m, idx) => m.title || `Milestone ${idx + 1}`);

    const newOrUpdatedPosting = {
      id: targetId ? Number(targetId) : Date.now(),
      company_name: formData.company_name,
      role_title: formData.role_title,
      description: formData.description,
      work_mode: formData.work_mode.charAt(0).toUpperCase() + formData.work_mode.slice(1),
      location: formData.location || 'Onsite / Campus Hub',
      stipend_amount: Number(formData.stipend_amount || 0),
      total_seats: Number(formData.total_seats || 5),
      available_seats: Number(formData.total_seats || 5),
      min_cgpa: Number(formData.min_cgpa || 6.5),
      start_date: formData.start_date,
      end_date: formData.end_date,
      application_deadline: formData.application_deadline,
      target_department_id: formData.target_department_id,
      applicant_count: isEditing ? (internships.find(i => String(i.id) === String(targetId))?.applicant_count || 0) : 0,
      status: 'Published',
      milestones: simpleMilestoneTitles,
      detailed_milestones: milestones
    };

    let updatedList;
    if (isEditing) {
      updatedList = internships.map(i => String(i.id) === String(targetId) ? newOrUpdatedPosting : i);
    } else {
      updatedList = [newOrUpdatedPosting, ...internships];
    }

    setInternships(updatedList);
    saveStoredInternships(updatedList);

    placementsService.createInternship(newOrUpdatedPosting).catch(e => {
      console.warn('Backend internship persist note:', e.message);
    });

    alert(`Internship and sequential roadmap for "${formData.company_name}" published successfully!`);
    navigate('/unilms/org/internships');
  };

  return (
    <div className="container-fluid p-0">
      {/* Top Header */}
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
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
            }}
          >
            <i className="fa-solid fa-plus-circle"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {isEditing ? 'Edit Internship &amp; Roadmap' : 'Post Internship &amp; Roadmap Builder'}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Build sequential learning milestones and deliverable tasks for student execution
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/unilms/org/internships" className="btn btn-outline" style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
          <i className="fa-solid fa-arrow-left" style={{ color: '#7C3AED' }}></i>
          <span>Back to Internships</span>
        </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Card 2: Sequential Roadmap Builder */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: '#ffffff', borderRadius: '16px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h5 className="fw-bold text-dark mb-0">
                <i className="fas fa-map-signs text-success me-2"></i> Sequential Roadmap Builder
              </h5>
              <small className="text-muted">
                Define sequential milestones and tasks. Milestone 2 unlocks only after Milestone 1 is completed.
              </small>
            </div>
            <button
              type="button"
              className="btn btn-outline-success rounded-pill"
              onClick={handleAddMilestone}
              style={{ padding: '6px 16px', fontWeight: '600' }}
            >
              <i className="fas fa-plus me-1"></i> Add Milestone
            </button>
          </div>

          <div id="milestonesContainer">
            {milestones.map((m, mIdx) => (
              <div
                key={m.id}
                className="milestone-block border border-2 border-primary-subtle rounded-4 p-3 mb-4 bg-light position-relative"
                style={{ borderRadius: '14px', background: '#f8fafc', border: '1px solid #c7d2fe' }}
              >
                {milestones.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2 rounded-circle"
                    onClick={() => handleRemoveMilestone(m.id)}
                    title="Remove Milestone"
                    style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}

                <h6 className="fw-bold text-primary mb-2">Milestone {mIdx + 1}</h6>

                <div className="row g-2 mb-3">
                  <div className="col-md-9">
                    <input
                      type="text"
                      className="form-control fw-bold"
                      placeholder="Milestone Title (e.g. Week 1-2: Architecture & Setup)"
                      value={m.title}
                      onChange={e => handleMilestoneTitleChange(m.id, e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <div className="form-check pt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`midpoint_${m.id}`}
                        checked={m.is_midpoint_gate}
                        onChange={e => handleMilestoneGateChange(m.id, e.target.checked)}
                      />
                      <label className="form-check-label fw-bold small text-danger" htmlFor={`midpoint_${m.id}`}>
                        Midpoint Gate Checkpoint
                      </label>
                    </div>
                  </div>
                </div>

                {/* Tasks container inside milestone */}
                <div className="tasks-container p-2 bg-white rounded-3 border" style={{ borderRadius: '10px' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-bold text-muted text-uppercase">Deliverable Tasks</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary rounded-pill py-0"
                      onClick={() => handleAddTask(m.id)}
                      style={{ fontSize: '12px' }}
                    >
                      + Add Task
                    </button>
                  </div>

                  <div className="tasks-list">
                    {m.tasks.map((t) => (
                      <div
                        key={t.id}
                        className="task-row border rounded-3 p-2 mb-2 bg-light position-relative"
                        style={{ borderRadius: '8px', padding: '10px', background: '#f8fafc' }}
                      >
                        {m.tasks.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm text-danger position-absolute top-0 end-0"
                            onClick={() => handleRemoveTask(m.id, t.id)}
                            style={{ background: 'none', border: 'none' }}
                            title="Remove Task"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}

                        <div className="row g-2">
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Task Title (e.g. Docker configuration)"
                              value={t.task_title}
                              onChange={e => handleTaskChange(m.id, t.id, 'task_title', e.target.value)}
                              required
                            />
                          </div>

                          <div className="col-md-3">
                            <select
                              className="form-select form-select-sm"
                              value={t.submission_type}
                              onChange={e => handleTaskChange(m.id, t.id, 'submission_type', e.target.value)}
                            >
                              <option value="file">File Deliverable (PDF/ZIP)</option>
                              <option value="link">Code Link (GitHub/GitLab)</option>
                              <option value="text">Text / Explanation</option>
                            </select>
                          </div>

                          <div className="col-md-3">
                            <input
                              type="number"
                              step="0.5"
                              className="form-control form-control-sm"
                              placeholder="Est. Hours"
                              value={t.estimated_hours}
                              onChange={e => handleTaskChange(m.id, t.id, 'estimated_hours', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Publish Button */}
        <div className="text-end mb-5">
          <button
            type="submit"
            className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm"
            style={{
              background: '#7C3AED',
              borderColor: '#7C3AED',
              fontWeight: '700',
              padding: '12px 32px'
            }}
          >
            <i className="fas fa-save me-2"></i> {isEditing ? 'Update Internship & Roadmap' : 'Publish Internship & Roadmap'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrgInternshipsCreatePosting;