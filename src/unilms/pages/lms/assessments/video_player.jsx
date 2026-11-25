import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const defaultVideoAssessment = {
  title: 'Cloud Native Microservices: Container Runtimes & Kubernetes Pod Invariants',
  courseName: 'CS111: Operating Systems & Cloud Systems',
  maxMarks: 15,
  videoUrl: 'https://www.youtube.com/embed/X48VuDVv0do',
  questions: [
    {
      id: 1,
      timestamp: '02:15',
      questionText: 'What is the fundamental distinction between an OCI container runtime (runc) and a high-level runtime (containerd)?',
      marks: 5,
      options: [
        'runc directly spawns Linux cgroups and namespaces, while containerd handles image pulls and lifecycle management',
        'runc runs on Windows kernel while containerd only runs on macOS Darwin',
        'runc compiles Java bytecode while containerd manages PostgreSQL indexes',
        'There is no architectural difference between them'
      ],
      correctOption: 0
    },
    {
      id: 2,
      timestamp: '05:40',
      questionText: 'Why do Kubernetes pods share the same network namespace (localhost)?',
      marks: 5,
      options: [
        'To allow tight inter-container communication via IPC and localhost loopback',
        'To disable IP packet routing across node boundaries',
        'To force all containers in a pod to share the same CPU core',
        'To avoid allocating private IP addresses'
      ],
      correctOption: 0
    },
    {
      id: 3,
      timestamp: '08:50',
      questionText: 'What state does a Kubernetes pod transition to when its readiness probe fails?',
      marks: 5,
      options: [
        'Removed from Service endpoint traffic distribution without killing the container',
        'Immediately terminated and replaced by kubelet',
        'Marked as CrashLoopBackOff',
        'Evicted to another cluster node'
      ],
      correctOption: 0
    }
  ],
  submission: {
    finalMarks: 15,
    autoScore: 15,
    status: 'Completed'
  }
};

const LmsAssessmentsVideoPlayer = () => {
  const navigate = useNavigate();
  const [assessment] = useState(defaultVideoAssessment);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const handleBack = (e) => {
    if (window.history.length > 1) {
      e.preventDefault();
      navigate(-1);
    }
  };

  const handleSelectAnswer = (qId, optionIdx) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleFinishCheckpoint = (e) => {
    e.preventDefault();
    let calculated = 0;
    assessment.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOption) {
        calculated += q.marks;
      }
    });
    setScore(calculated);
    setIsCompleted(true);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link 
              to="/unilms/lms/assignments" 
              onClick={handleBack} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px', borderRadius: '8px', textDecoration: 'none', background: '#F1F5F9', color: '#334155', fontWeight: '700' }}
            >
              <i className="fa-solid fa-arrow-left"></i> Back to Assessments
            </Link>
            <span style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary, #6366F1)', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>
              <i className="fa-solid fa-play-circle me-1"></i> Interactive Video Checkpoint
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main, #0F172A)', margin: '4px 0' }}>
            {assessment.title}
          </h1>
          <p style={{ color: 'var(--text-muted, #64748B)', fontSize: '13.5px', margin: 0 }}>
            {assessment.courseName} &bull; Checkpoint checkpoints assess retention during key lecture segments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#fff', padding: '8px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Max Marks</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary, #6366F1)', lineHeight: '1.2' }}>{assessment.maxMarks} Pts</div>
          </div>
          <div style={{ background: '#fff', padding: '8px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Checkpoints</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0284C7', lineHeight: '1.2' }}>{assessment.questions.length} Total</div>
          </div>
        </div>
      </div>

      {isCompleted ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px', borderRadius: '20px', border: '1px solid #E2E8F0', background: '#fff', maxWidth: '680px', margin: '30px auto', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px' }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
            Interactive Assessment Completed!
          </h2>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
            All video checkpoints were evaluated successfully. Your marks are recorded in your academic dossier.
          </p>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', background: '#F8FAFC', padding: '12px 24px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '28px' }}>
            <span style={{ color: '#64748B', fontSize: '13.5px', fontWeight: '600' }}>Your Final Score:</span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#10B981' }}>
              {score} <span style={{ fontSize: '15px', color: '#64748B', fontWeight: '600' }}>/ {assessment.maxMarks} Pts</span>
            </span>
          </div>

          <div>
            <Link to="/unilms/lms/assignments" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontWeight: '700', borderRadius: '10px', background: 'var(--primary, #6366F1)', color: '#fff', textDecoration: 'none' }}>
              <i className="fa-solid fa-arrow-left"></i> Return to Course Assessments
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
          {/* Video Container */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '18px', border: '1px solid #E2E8F0', background: '#000' }}>
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
              <iframe 
                src={`${assessment.videoUrl}?enablejsapi=1&rel=0&modestbranding=1`} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                title="Lecture Video"
              />
            </div>
          </div>

          {/* Question Checkpoints List */}
          <div className="card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
              Lecture Checkpoints ({activeQuestionIdx + 1} of {assessment.questions.length})
            </h2>
            {assessment.questions.map((q, idx) => (
              <div key={q.id} style={{ marginBottom: '18px', padding: '14px', borderRadius: '12px', background: idx === activeQuestionIdx ? '#EEF2FF' : '#F8FAFC', border: `1px solid ${idx === activeQuestionIdx ? '#818CF8' : '#E2E8F0'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: '#334155' }}>
                    <i className="fa-solid fa-clock me-1"></i> {q.timestamp}
                  </span>
                  <span style={{ fontWeight: '700', fontSize: '12px', color: '#4F46E5' }}>
                    {q.marks} Marks
                  </span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{q.questionText}</p>
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} onClick={() => handleSelectAnswer(q.id, oIdx)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: selectedAnswers[q.id] === oIdx ? '#C7D2FE' : '#fff', border: '1px solid #CBD5E1', cursor: 'pointer', marginBottom: '6px', fontSize: '12.5px' }}>
                    <input type="radio" checked={selectedAnswers[q.id] === oIdx} readOnly />
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            ))}
            <button type="button" onClick={handleFinishCheckpoint} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--primary, #6366F1)', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
              Submit Checkpoint Answers
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LmsAssessmentsVideoPlayer;
