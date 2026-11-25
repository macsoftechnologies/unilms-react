import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CreatorBuilder = () => {
  const [showLiveDropdown, setShowLiveDropdown] = useState(false);

  const handleSaveModal = (e) => {
    e.preventDefault();
    const activeModals = document.querySelectorAll('.modal.show');
    activeModals.forEach((m) => {
      const closeBtn = m.querySelector('.btn-close') || m.querySelector('[data-bs-dismiss="modal"]');
      if (closeBtn) closeBtn.click();
    });
  };

  return (
    <>
      <style>{`
        /* Creator Builder Custom Styles - Pixel Perfect to Design */
        .cb-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: clamp(14px, 4vw, 24px) clamp(12px, 3.5vw, 28px);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          margin-bottom: 24px;
        }

        .cb-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 16px;
        }

        .cb-actions-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* Top Action Buttons */
        .cb-btn-back {
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 6px 18px !important;
          height: 36px !important;
          border-radius: 9999px !important;
          border: 1px solid #cbd5e1 !important;
          background: #ffffff !important;
          color: #475569 !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          text-decoration: none !important;
          cursor: pointer !important;
          transition: all 0.18s ease !important;
          box-sizing: border-box !important;
        }
        .cb-btn-back:hover {
          border-color: #94a3b8 !important;
          background: #f8fafc !important;
          color: #1e293b !important;
        }

        .cb-btn-cyan {
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 7px 20px !important;
          height: 38px !important;
          border-radius: 9999px !important;
          border: 1.5px solid #06b6d4 !important;
          background: #ffffff !important;
          color: #06b6d4 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          text-decoration: none !important;
          cursor: pointer !important;
          transition: all 0.18s ease !important;
          box-sizing: border-box !important;
        }
        .cb-btn-cyan:hover {
          background: rgba(6, 182, 212, 0.08) !important;
          border-color: #0891b2 !important;
          color: #0891b2 !important;
        }

        .cb-btn-secondary {
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 7px 20px !important;
          height: 38px !important;
          border-radius: 9999px !important;
          border: 1.5px solid #94a3b8 !important;
          background: #ffffff !important;
          color: #475569 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          text-decoration: none !important;
          cursor: pointer !important;
          transition: all 0.18s ease !important;
          box-sizing: border-box !important;
        }
        .cb-btn-secondary:hover {
          background: #f8fafc !important;
          border-color: #64748b !important;
          color: #1e293b !important;
        }

        .cb-btn-primary {
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 7px 20px !important;
          height: 38px !important;
          border-radius: 9999px !important;
          border: 1.5px solid #2563eb !important;
          background: #ffffff !important;
          color: #2563eb !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          text-decoration: none !important;
          cursor: pointer !important;
          transition: all 0.18s ease !important;
          box-sizing: border-box !important;
        }
        .cb-btn-primary:hover {
          background: rgba(37, 99, 235, 0.08) !important;
          border-color: #1d4ed8 !important;
          color: #1d4ed8 !important;
        }

        .cb-btn-live {
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 8px 22px !important;
          height: 38px !important;
          border-radius: 9999px !important;
          border: none !important;
          background: #15803d !important;
          color: #ffffff !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.18s ease !important;
          box-sizing: border-box !important;
        }
        .cb-btn-live:hover {
          background: #166534 !important;
          color: #ffffff !important;
        }

        /* Badges Row */
        .cb-badges-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .cb-badge-category {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          border-radius: 9999px;
          background: #eef2ff;
          color: #6366f1;
          font-size: 12px;
          font-weight: 700;
        }

        .cb-badge-published {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          border-radius: 9999px;
          background: #15803d;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
        }

        .cb-runtime-text {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: #2563eb;
          font-weight: 500;
        }
        .cb-runtime-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2563eb;
          display: inline-block;
        }

        .cb-course-title {
          font-size: 21px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.015em;
        }

        /* Outline Header */
        .cb-outline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .cb-outline-title {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }

        .cb-chapters-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 14px;
          border-radius: 9999px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        /* Module Card */
        .cb-module-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .cb-module-header {
          padding: 16px 22px;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .cb-module-num {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #6366f1;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 15px;
          flex-shrink: 0;
        }

        .cb-module-title {
          font-weight: 800;
          font-size: 15px;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .cb-module-subtitle {
          font-size: 12.5px;
          color: #64748b;
          margin: 0;
        }

        /* Circular Action Buttons */
        .cb-btn-circle-edit {
          width: 34px !important;
          height: 34px !important;
          min-width: 34px !important;
          border-radius: 50% !important;
          border: 1.5px solid #94a3b8 !important;
          background: #ffffff !important;
          color: #475569 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          padding: 0 !important;
          transition: all 0.18s ease !important;
        }
        .cb-btn-circle-edit:hover {
          border-color: #64748b !important;
          color: #1e293b !important;
          background: #f8fafc !important;
        }

        .cb-btn-circle-delete {
          width: 34px !important;
          height: 34px !important;
          min-width: 34px !important;
          border-radius: 50% !important;
          border: 1.5px solid #ef4444 !important;
          background: #ffffff !important;
          color: #ef4444 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          padding: 0 !important;
          transition: all 0.18s ease !important;
        }
        .cb-btn-circle-delete:hover {
          background: rgba(239, 68, 68, 0.08) !important;
          border-color: #dc2626 !important;
          color: #dc2626 !important;
        }

        /* + Add Video Lesson */
        .cb-btn-add-lesson {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          padding: 5px 16px !important;
          height: 34px !important;
          border-radius: 9999px !important;
          border: 1.5px solid #2563eb !important;
          background: #ffffff !important;
          color: #2563eb !important;
          font-size: 12.5px !important;
          font-weight: 600 !important;
          text-decoration: none !important;
          cursor: pointer !important;
          transition: all 0.18s ease !important;
          box-sizing: border-box !important;
        }
        .cb-btn-add-lesson:hover {
          background: rgba(37, 99, 235, 0.08) !important;
          border-color: #1d4ed8 !important;
          color: #1d4ed8 !important;
        }

        /* Lessons Section */
        .cb-lessons-container {
          padding: 16px 22px;
          background: #f8fafc;
        }

        .cb-lesson-item {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }

        .cb-play-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .cb-lesson-title {
          font-weight: 700;
          font-size: 14px;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .cb-badge-duration {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 9999px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
        }

        .cb-badge-stream {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 9999px;
          background: #fee2e2;
          color: #ef4444;
          font-size: 11px;
          font-weight: 700;
        }

        /* Test Play (Cyan Outline Pill) */
        .cb-btn-test-play {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          padding: 5px 16px !important;
          height: 32px !important;
          border-radius: 9999px !important;
          border: 1.5px solid #06b6d4 !important;
          background: #ffffff !important;
          color: #06b6d4 !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          text-decoration: none !important;
          cursor: pointer !important;
          transition: all 0.18s ease !important;
          box-sizing: border-box !important;
        }
        .cb-btn-test-play:hover {
          background: rgba(6, 182, 212, 0.08) !important;
          border-color: #0891b2 !important;
          color: #0891b2 !important;
        }

        .cb-btn-circle-edit-sm {
          width: 32px !important;
          height: 32px !important;
          min-width: 32px !important;
          border-radius: 50% !important;
          border: 1.5px solid #94a3b8 !important;
          background: #ffffff !important;
          color: #475569 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          padding: 0 !important;
          transition: all 0.18s ease !important;
        }
        .cb-btn-circle-edit-sm:hover {
          border-color: #64748b !important;
          color: #1e293b !important;
          background: #f8fafc !important;
        }

        .cb-btn-circle-delete-sm {
          width: 32px !important;
          height: 32px !important;
          min-width: 32px !important;
          border-radius: 50% !important;
          border: 1.5px solid #ef4444 !important;
          background: #ffffff !important;
          color: #ef4444 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          padding: 0 !important;
          transition: all 0.18s ease !important;
        }
        .cb-btn-circle-delete-sm:hover {
          background: rgba(239, 68, 68, 0.08) !important;
          border-color: #dc2626 !important;
          color: #dc2626 !important;
        }

        @media (max-width: 576px) {
          .cb-actions-group {
            width: 100% !important;
            justify-content: flex-start !important;
          }
          .cb-btn-back,
          .cb-btn-cyan,
          .cb-btn-secondary,
          .cb-btn-primary {
            padding: 5px 12px !important;
            font-size: 12px !important;
            height: 32px !important;
          }
        }
        /* Dark Mode Compatibility */
        body.dark-mode .cb-card,
        body.dark-mode .cb-module-card,
        body.dark-mode .cb-module-header,
        body.dark-mode .cb-lesson-item,
        body.dark-mode .cb-chapters-badge {
          background: var(--card-bg, #151a24) !important;
          border-color: var(--border-color, rgba(255, 255, 255, 0.1)) !important;
          color: var(--text-dark, #f8fafc) !important;
        }
        body.dark-mode .cb-course-title,
        body.dark-mode .cb-outline-title,
        body.dark-mode .cb-module-title,
        body.dark-mode .cb-lesson-title {
          color: var(--text-dark, #f8fafc) !important;
        }
        body.dark-mode .cb-lessons-container {
          background: rgba(0, 0, 0, 0.25) !important;
        }
        body.dark-mode .cb-btn-back,
        body.dark-mode .cb-btn-cyan,
        body.dark-mode .cb-btn-secondary,
        body.dark-mode .cb-btn-primary,
        body.dark-mode .cb-btn-circle-edit,
        body.dark-mode .cb-btn-circle-delete,
        body.dark-mode .cb-btn-add-lesson,
        body.dark-mode .cb-btn-test-play,
        body.dark-mode .cb-btn-circle-edit-sm,
        body.dark-mode .cb-btn-circle-delete-sm {
          background: transparent !important;
        }
      `}</style>

      <div className="container-fluid p-0">
        {/* Top Header Card */}
        <div className="cb-card">
          {/* Row 1: Back Button on Left, Action Buttons on Right */}
          <div className="cb-top-row">
            <Link to="/unilms/creator/courses" className="cb-btn-back">
              <i className="fa-solid fa-arrow-left"></i>
              <span>All Courses</span>
            </Link>

            <div className="cb-actions-group">
              <Link to="/unilms/creator/preview" className="cb-btn-cyan">
                <i className="fa-regular fa-eye"></i>
                <span>Student View</span>
              </Link>
              <Link to="/unilms/creator/create" className="cb-btn-secondary">
                <i className="fa-solid fa-pen-to-square"></i>
                <span>Edit Info</span>
              </Link>
              <button
                type="button"
                className="cb-btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#addChapterModal"
              >
                <i className="fa-solid fa-folder-plus"></i>
                <span>+ Add Chapter</span>
              </button>
              <div className="dropdown position-relative">
                <button
                  type="button"
                  className="cb-btn-live"
                  onClick={() => setShowLiveDropdown(!showLiveDropdown)}
                  data-bs-toggle="dropdown"
                  aria-expanded={showLiveDropdown}
                >
                  <i className="fa-solid fa-circle-check"></i>
                  <span>Live on Portal</span>
                </button>
                <ul
                  className={`dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2 rounded-3 ${showLiveDropdown ? 'show' : ''}`}
                  style={showLiveDropdown ? { display: 'block', position: 'absolute', right: 0, top: '100%', zIndex: 1050 } : {}}
                >
                  <li>
                    <button
                      type="button"
                      className="dropdown-item py-2 fw-medium d-flex align-items-center gap-2"
                      data-bs-toggle="modal"
                      data-bs-target="#unpublishModal"
                      onClick={() => setShowLiveDropdown(false)}
                      style={{ color: '#d97706' }}
                    >
                      <i className="fa-solid fa-eye-slash"></i> Unpublish Course
                    </button>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item py-2 fw-medium text-danger d-flex align-items-center gap-2"
                      data-bs-toggle="modal"
                      data-bs-target="#deleteCourseModal"
                      onClick={() => setShowLiveDropdown(false)}
                    >
                      <i className="fa-solid fa-trash"></i> Delete Course
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Row 2: Badges */}
          <div className="cb-badges-row">
            <span className="cb-badge-category">
              <i className="fa-solid fa-layer-group me-1"></i> Cloud & DevOps Engineering
            </span>
            <span className="cb-badge-published">
              <i className="fa-solid fa-circle-check me-1"></i> Published
            </span>
            <span className="cb-runtime-text">
              <span className="cb-runtime-dot"></span> Total Runtime: <strong>75 mins</strong>
            </span>
          </div>

          {/* Row 3: Course Title */}
          <h3 className="cb-course-title brand-font">
            Enterprise Cloud Architecture & DevOps Microservices
          </h3>
        </div>

        {/* Course Curriculum Outline Section */}
        <div className="mb-4">
          <div className="cb-outline-header">
            <h5 className="cb-outline-title brand-font">
              <i className="fa-solid fa-bars-staggered text-primary"></i> Course Curriculum Outline
            </h5>
            <span className="cb-chapters-badge">
              2 Chapters Created
            </span>
          </div>

          <div className="d-flex flex-column gap-3">
            <div className="cb-module-card">
              <div className="cb-module-header">
                <div className="d-flex align-items-center gap-3">
                  <div className="cb-module-num">
                    1
                  </div>
                  <div>
                    <h5 className="cb-module-title brand-font">Module 1: Foundations of Microservices Architecture</h5>
                    <p className="cb-module-subtitle">Core concepts of distributed architecture and monolithic decomposition.</p>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="cb-btn-circle-edit"
                    data-bs-toggle="modal"
                    data-bs-target="#editChapterModal_"
                    title="Edit Chapter"
                  >
                    <i className="fa-solid fa-pen" style={{ fontSize: '11px' }}></i>
                  </button>
                  <button
                    type="button"
                    className="cb-btn-add-lesson"
                    data-bs-toggle="modal"
                    data-bs-target="#addLessonModal_"
                  >
                    <i className="fa-solid fa-circle-plus"></i> + Add Video Lesson
                  </button>
                  <button
                    type="button"
                    className="cb-btn-circle-delete"
                    data-bs-toggle="modal"
                    data-bs-target="#deleteChapterModal"
                    title="Delete Chapter"
                  >
                    <i className="fa-solid fa-trash-can" style={{ fontSize: '11px' }}></i>
                  </button>
                </div>
              </div>

              <div className="cb-lessons-container">
                <div className="row g-2">
                  <div className="col-12">
                    <div className="cb-lesson-item">
                      <div className="d-flex align-items-center gap-3">
                        <div className="cb-play-icon">
                          <i className="fa-solid fa-play"></i>
                        </div>
                        <div>
                          <div className="cb-lesson-title">Lesson 1.1: Microservices Design Principles & Decoupling</div>
                          <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                            <span className="cb-badge-duration">
                              <i className="fa-solid fa-clock me-1"></i> 30 mins
                            </span>
                            <span className="cb-badge-stream">
                              <i className="fa-brands fa-youtube me-1"></i> Stream URL
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <a
                          href="https://www.youtube.com/watch?v=lxo-0gCVhTU"
                          className="cb-btn-test-play"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <i className="fa-regular fa-eye"></i> Test Play
                        </a>
                        <button
                          type="button"
                          className="cb-btn-circle-edit-sm"
                          data-bs-toggle="modal"
                          data-bs-target="#editLessonModal_"
                          title="Edit Lesson"
                        >
                          <i className="fa-solid fa-pen" style={{ fontSize: '11px' }}></i>
                        </button>
                        <button
                          type="button"
                          className="cb-btn-circle-delete-sm"
                          title="Delete Lesson"
                        >
                          <i className="fa-solid fa-trash-can" style={{ fontSize: '11px' }}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                                        
                                        <div className="modal fade" id="editLessonModal_" tabindex="-1">
                                            <div className="modal-dialog modal-dialog-centered modal-lg">
                                                <div className="modal-content rounded-4 border-0 shadow-lg p-3">
                                                    <form onSubmit={handleSaveModal}>
                                                        <input type="hidden" name="course_id" value="" />
                                                        <input type="hidden" name="chapter_id" value="" />
                                                        <input type="hidden" name="lesson_id" value="" />
                                                        
                                                        <div className="modal-header border-0 pb-0">
                                                            <div>
                                                                <div className="badge rounded-pill px-3 py-1 mb-1" style={{"background":"rgba(79, 70, 229, 0.1)","color":"var(--primary)"}}>
                                                                    Edit Lesson &bull; Module 1: Foundations of Microservices Architecture
                                                                </div>
                                                                <h4 className="fw-bold brand-font text-dark mb-0">Edit Video Lesson</h4>
                                                            </div>
                                                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                                                        </div>

                                                        <div className="modal-body py-4">
                                                            <div className="mb-3">
                                                                <label className="form-label fw-bold text-dark">Lesson Title <span className="text-danger">*</span></label>
                                                                <input type="text" name="lesson_title" className="form-control rounded-3" defaultValue="Lesson 1.1: Microservices Design Principles & Decoupling" required />
                                                            </div>

                                                            <div className="row g-3 mb-3">
                                                                <div className="col-md-6">
                                                                    <label className="form-label fw-semibold text-dark">Video Source Method</label>
                                                                    <select name="video_type" className="form-select rounded-3">
                                                                        <option value="url" >Online Video URL (YouTube / Vimeo / CDN)</option>
                                                                        <option value="upload" >Upload Video File (.mp4 / .webm)</option>
                                                                    </select>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <label className="form-label fw-semibold text-dark">Estimated Duration (Minutes)</label>
                                                                    <input type="number" name="duration_minutes" className="form-control rounded-3" defaultValue="30" min="1" />
                                                                </div>
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="form-label fw-semibold text-dark">Video Stream URL</label>
                                                                <div className="input-group">
                                                                    <span className="input-group-text bg-light"><i className="fa-solid fa-link text-muted"></i></span>
                                                                    <input type="url" name="video_url" className="form-control" defaultValue="https://www.youtube.com/watch?v=lxo-0gCVhTU" placeholder="https://www.youtube.com/watch?v=..." />
                                                                </div>
                                                                <div className="form-text text-muted small">Supports YouTube, Vimeo, or direct cloud MP4 video links.</div>
                                                            </div>

                                                            <div className="row g-3">
                                                                <div className="col-md-6">
                                                                    <label className="form-label fw-semibold text-dark">Replace Video File (Optional)</label>
                                                                    <input type="file" name="video_file" className="form-control rounded-3" accept="video/mp4,video/webm" />
                                                                    <small className="text-success d-block mt-1"><i className="fa-solid fa-check me-1"></i> Current: microservices_intro.mp4</small>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <label className="form-label fw-semibold text-dark">Replace Slides / Notes File (Optional)</label>
                                                                    <input type="file" name="notes_file" className="form-control rounded-3" accept=".pdf,.ppt,.pptx" />
                                                                    <small className="text-primary d-block mt-1"><i className="fa-solid fa-file-pdf me-1"></i> Current: chapter1_slides.pdf</small>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="modal-footer border-0 pt-0 justify-content-center">
                                                            <button type="button" className="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
                                                            <button type="submit" className="btn btn-gradient-primary rounded-pill px-5 fw-semibold">Save Changes</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    {/* PHP Logic */}
                                </div>
                            {/* PHP Logic */}
                        </div>
                    </div>

                    
                    <div className="modal fade" id="editChapterModal_" tabindex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content rounded-4 border-0 shadow-lg p-3">
                                <form onSubmit={handleSaveModal}>
                                    <input type="hidden" name="course_id" value="" />
                                    <input type="hidden" name="chapter_id" value="" />

                                    <div className="modal-header border-0 pb-0">
                                        <h4 className="fw-bold brand-font text-dark mb-0">
                                            <i className="fa-solid fa-pen-to-square text-primary me-2"></i> Edit Chapter
                                        </h4>
                                        <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                                    </div>

                                    <div className="modal-body py-4">
                                        <div className="mb-3">
                                            <label className="form-label fw-bold text-dark">Chapter Title <span className="text-danger">*</span></label>
                                            <input type="text" name="chapter_title" className="form-control rounded-3" value="" required />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold text-dark">Chapter Outline / Summary</label>
                                            <textarea name="description" className="form-control rounded-3" rows="2" placeholder="Describe module learning goals..."></textarea>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold text-dark">Sequence Order</label>
                                            <input type="number" name="order_seq" className="form-control rounded-3" value="" />
                                        </div>
                                    </div>

                                    <div className="modal-footer border-0 pt-0">
                                        <button type="button" className="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
                                        <button type="submit" className="btn btn-gradient-primary rounded-pill px-4 fw-semibold">Update Chapter</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    
                    <div className="modal fade" id="addLessonModal_" tabindex="-1">
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content rounded-4 border-0 shadow-lg p-3">
                                <form onSubmit={handleSaveModal}>
                                    <input type="hidden" name="course_id" value="" />
                                    <input type="hidden" name="chapter_id" value="" />
                                    
                                    <div className="modal-header border-0 pb-0">
                                        <div>
                                            <div className="badge rounded-pill px-3 py-1 mb-1" style={{"background":"rgba(79, 70, 229, 0.1)","color":"var(--primary)"}}>
                                                Module 1: Foundations of Microservices Architecture
                                            </div>
                                            <h4 className="fw-bold brand-font text-dark mb-0">Add Video Lecture Lesson</h4>
                                        </div>
                                        <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                                    </div>

                                    <div className="modal-body py-4">
                                        <div className="mb-3">
                                            <label className="form-label fw-bold text-dark">Lesson Title <span className="text-danger">*</span></label>
                                            <input type="text" name="lesson_title" className="form-control rounded-3" placeholder="e.g. Lesson 1: Component Architecture & Lifecycle" required />
                                        </div>

                                        <div className="row g-3 mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold text-dark">Video Source Method</label>
                                                <select name="video_type" className="form-select rounded-3">
                                                    <option value="url">Online Video URL (YouTube / Vimeo / CDN)</option>
                                                    <option value="upload">Upload Video File (.mp4 / .webm)</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold text-dark">Estimated Duration (Minutes)</label>
                                                <input type="number" name="duration_minutes" className="form-control rounded-3" value="15" min="1" />
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold text-dark">Video Stream URL</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light"><i className="fa-solid fa-link text-muted"></i></span>
                                                <input type="url" name="video_url" className="form-control" placeholder="https://www.youtube.com/watch?v=..." />
                                            </div>
                                            <div className="form-text text-muted small">Supports YouTube, Vimeo, or direct cloud MP4 video links.</div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold text-dark">Or Upload Local Video File</label>
                                                <input type="file" name="video_file" className="form-control rounded-3" accept="video/mp4,video/webm" />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold text-dark">Lecture Slides / Notes File</label>
                                                <input type="file" name="notes_file" className="form-control rounded-3" accept=".pdf,.ppt,.pptx" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer border-0 pt-0 justify-content-center">
                                        <button type="button" className="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
                                        <button type="submit" className="btn btn-gradient-primary rounded-pill px-5 fw-semibold">Save Lesson</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                {/* PHP Logic */}
            </div>
        {/* PHP Logic */}
    </div>
</div>


<div className="modal fade" id="addChapterModal" tabindex="-1">
    <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 border-0 shadow-lg p-3">
            <form onSubmit={handleSaveModal}>
                <input type="hidden" name="course_id" value="" />

                <div className="modal-header border-0 pb-0">
                    <h4 className="fw-bold brand-font text-dark mb-0">
                        <i className="fa-solid fa-folder-plus text-primary me-2"></i> Add Course Chapter
                    </h4>
                    <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div className="modal-body py-4">
                    <div className="mb-3">
                        <label className="form-label fw-bold text-dark">Chapter Title <span className="text-danger">*</span></label>
                        <input type="text" name="chapter_title" className="form-control rounded-3" placeholder="e.g. Chapter 1: Introduction to Frameworks" required />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold text-dark">Chapter Outline / Summary</label>
                        <textarea name="description" className="form-control rounded-3" rows="2" placeholder="Brief outline of concepts covered in this chapter..."></textarea>
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold text-dark">Sequence Order</label>
                        <input type="number" name="order_seq" className="form-control rounded-3" value="" />
                    </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                    <button type="button" className="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" className="btn btn-gradient-primary rounded-pill px-4 fw-semibold">Create Chapter</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div className="modal fade" id="deleteChapterModal" tabindex="-1">
    <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 border-0 shadow-lg p-4 text-center">
            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle" style={{"width":"64px","height":"64px","background":"rgba(239, 68, 68, 0.1)","color":"#dc2626"}}>
                <i className="fa-solid fa-trash fa-2x"></i>
            </div>
            <h5 className="fw-bold text-dark mb-2 brand-font">Delete Chapter?</h5>
            <p className="text-muted small mb-4">Are you sure you want to delete chapter "Module 1: Foundations of Microservices Architecture" and all of its lessons?</p>
            <div className="d-flex justify-content-center gap-2">
                <button type="button" className="btn btn-light rounded-pill px-4 fw-semibold" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger rounded-pill px-4 fw-semibold" data-bs-dismiss="modal">Delete Chapter</button>
            </div>
        </div>
    </div>
</div>

<div className="modal fade" id="unpublishModal" tabindex="-1">
    <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 border-0 shadow-lg p-4 text-center">
            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle" style={{"width":"64px","height":"64px","background":"rgba(245, 158, 11, 0.1)","color":"#d97706"}}>
                <i className="fa-solid fa-eye-slash fa-2x"></i>
            </div>
            <h5 className="fw-bold text-dark mb-2 brand-font">Unpublish Course?</h5>
            <p className="text-muted small mb-4">This will hide "Enterprise Cloud Architecture & DevOps Microservices" from students and revert it back to Draft mode.</p>
            <div className="d-flex justify-content-center gap-2">
                <button type="button" className="btn btn-light rounded-pill px-4 fw-semibold" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn rounded-pill px-4 fw-semibold" style={{backgroundColor: '#fbbf24', color: '#000'}} data-bs-dismiss="modal">Unpublish & Make Draft</button>
            </div>
        </div>
    </div>
</div>

<div className="modal fade" id="deleteCourseModal" tabindex="-1">
    <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 border-0 shadow-lg p-4 text-center">
            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle" style={{"width":"64px","height":"64px","background":"rgba(239, 68, 68, 0.1)","color":"#dc2626"}}>
                <i className="fa-solid fa-trash fa-2x"></i>
            </div>
            <h5 className="fw-bold text-dark mb-2 brand-font">Delete Course?</h5>
            <p className="text-muted small mb-4">Are you sure you want to completely delete this course? This action cannot be undone.</p>
            <div className="d-flex justify-content-center gap-2">
                <button type="button" className="btn btn-light rounded-pill px-4 fw-semibold" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger rounded-pill px-4 fw-semibold" data-bs-dismiss="modal">Delete Course</button>
            </div>
        </div>
    </div>
</div>

</>
  );
};

export default CreatorBuilder;