import React from 'react';
import { Link } from 'react-router-dom';
const CreatorPreview = () => {
  return (
    <>

<div className="container-fluid p-0">
    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
            <Link to="/unilms/creator/courses" className="btn btn-sm btn-outline-secondary rounded-pill px-3 mb-2 d-inline-flex align-items-center gap-1">
                <i className="fa-solid fa-arrow-left"></i>
                <span>Back to Courses</span>
            </Link>
            <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge rounded-pill px-2.5 py-1" style={{"background":"rgba(79, 70, 229, 0.1)","color":"var(--primary)","fontWeight":"700"}}>
                    <i className="fa-solid fa-eye me-1"></i> Student View Preview
                </span>
                <span className="badge bg-light text-secondary border rounded-pill px-2.5 py-1">
                    Cloud & DevOps &bull; 75 mins total
                </span>
            </div>
            <h2 className="fw-bold text-dark mb-0 brand-font">Cloud & DevOps Engineering</h2>
        </div>
        <div className="d-flex gap-2">
            <Link to="/unilms/creator/create" className="btn btn-outline-secondary rounded-pill px-3">
                <i className="fa-solid fa-pen-to-square me-1"></i> Edit Info
            </Link>
            <Link to="/unilms/creator/builder" className="btn btn-gradient-primary rounded-pill px-3">
                <i className="fa-solid fa-photo-film me-1"></i> Studio Builder
            </Link>
        </div>
    </div>

    <div className="row g-4 align-items-start">
        
        <div className="col-lg-8">
            <div className="modern-card overflow-hidden mb-3 bg-dark border-0 shadow-sm" style={{"borderRadius":"16px"}}>
                <video controls style={{"width":"100%","aspectRatio":"16/9","display":"block","background":"#000"}} poster="">
                    <source src="" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>

            <div className="modern-card p-3 p-md-4 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                    <h4 className="fw-bold text-dark mb-0 brand-font">Cloud Infrastructure Basics</h4>
                    <span className="badge bg-light text-secondary border rounded-pill px-2.5 py-1">
                        <i className="fa-solid fa-clock me-1 text-primary"></i> 20 mins
                    </span>
                </div>
                <p className="text-muted small mb-0">Comprehensive course on cloud infrastructure and DevOps practices.</p>

                <div className="mt-3 p-3 bg-light border rounded-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <strong className="text-dark d-block small"><i className="fa-solid fa-file-powerpoint text-primary me-1"></i> Lecture Slides & Study Companion Notes</strong>
                        <small className="text-muted">Interactive notes, architecture guidelines & tool reference</small>
                    </div>
                    <button type="button" onClick={() => {}} className="btn btn-sm btn-primary rounded-pill px-3" data-bs-toggle="modal" data-bs-target="#creatorSlidesModal">
                        <i className="fa-solid fa-book-open-reader me-1"></i> View Slides & Notes
                    </button>
                </div>
            </div>
        </div>

        
        <div className="col-lg-4">
            <div className="modern-card p-3 p-md-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark mb-0 brand-font">
                        <i className="fa-solid fa-list-ul text-primary me-2"></i> Course Playlist
                    </h5>
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">2 Lessons</span>
                </div>

                <div className="d-flex flex-column gap-3">
                    <div className="border rounded-3 overflow-hidden bg-white shadow-sm">
                        <div className="p-2 px-3 bg-light fw-bold small text-dark border-bottom d-flex justify-content-between align-items-center">
                            <span>Ch 1: Introduction to DevOps</span>
                            <span className="text-muted" style={{"fontSize":"10px","fontWeight":"normal"}}>2 lessons</span>
                        </div>
                        <div className="list-group list-group-flush">
                            <Link to="" className="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2 px-3 small " style={{"fontSize":"12.5px"}}>
                                <div className="d-flex align-items-center gap-2 overflow-hidden">
                                    <i className="fa-solid fa-play text-muted" style={{"fontSize":"11px"}}></i>
                                    <span className="text-truncate">What is DevOps?</span>
                                </div>
                                <small className="text-muted ms-2 flex-shrink-0">15m</small>
                            </Link>
                            <Link to="" className="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2 px-3 small bg-primary bg-opacity-10 text-primary fw-bold" style={{"fontSize":"12.5px"}}>
                                <div className="d-flex align-items-center gap-2 overflow-hidden">
                                    <i className="fa-solid fa-circle-play text-primary" style={{"fontSize":"11px"}}></i>
                                    <span className="text-truncate">Cloud Infrastructure Basics</span>
                                </div>
                                <small className="text-muted ms-2 flex-shrink-0">20m</small>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>


<div className="modal fade" id="creatorSlidesModal" tabindex="-1" aria-hidden="true" style={{"display":"none","background":"rgba(15, 23, 42, 0.7)","backdropFilter":"blur(6px)"}}>
    <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
            <div className="modal-header bg-light border-bottom p-3 px-4">
                <div>
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2.5 py-1 mb-1">
                        📖 Companion Lecture Slides & Study Notes
                    </span>
                    <h5 className="modal-title fw-bold text-dark brand-font mb-0">
                        Lecture Companion & Study Notes
                    </h5>
                </div>
                <button type="button" className="btn-close" onClick={() => {}}></button>
            </div>
            <div className="modal-body p-4 d-flex flex-column gap-3" style={{"maxHeight":"70vh","overflowY":"auto"}}>
                <div className="p-3 bg-light border rounded-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold text-primary small"><i className="fa-solid fa-layer-group me-1"></i> Slide 1: Core Theoretical Foundations</span>
                        <span className="badge bg-success bg-opacity-10 text-success">Key Takeaways</span>
                    </div>
                    <ul className="small text-muted mb-0 ps-3">
                        <li><strong>Concept Overview</strong>: Modular decomposition of state management and asynchronous lifecycle pipelines.</li>
                        <li><strong>Design Rationale</strong>: Enforces strict single-responsibility principles across decoupled backend services.</li>
                        <li><strong>Complexity & Efficiency</strong>: Optimized logarithmic {"$\\mathcal{O}(\\log N)$"} execution time and sub-millisecond API response benchmarks.</li>
                    </ul>
                </div>

                <div className="p-3 bg-light border rounded-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold text-info small"><i className="fa-solid fa-terminal me-1"></i> Slide 2: Technical Tools & Developer Guide</span>
                        <span className="badge bg-info bg-opacity-10 text-info">Tooling Guide</span>
                    </div>
                    <div className="bg-dark text-info font-monospace p-2 rounded-2 small mb-2" style={{"fontSize":"11px"}}>
                        # Start local containerized development stack<br />
                        $ docker-compose up -d --build
                    </div>
                    <p className="small text-muted mb-0">Integrates directly with VS Code, Postman Workspaces, and Docker Orchestration.</p>
                </div>
            </div>
            <div className="modal-footer bg-light p-3 px-4">
                <button type="button" className="btn btn-sm btn-primary rounded-pill px-4" onClick={() => {}}>Close Viewer</button>
            </div>
        </div>
    </div>
</div>



</>
  );
};

export default CreatorPreview;