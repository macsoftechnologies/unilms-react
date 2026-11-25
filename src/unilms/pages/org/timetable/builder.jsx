import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useConfirmDialog } from '../../../components';
import academicsService from '../../../services/academics.service';
import staffService from '../../../services/staff.service';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const OrgTimetableBuilder = () => {
  // Enterprise Confirmation Dialog Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [cohorts, setCohorts] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [slots, setSlots] = useState([]);

  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Drawer state for assigning a timetable period slot
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSlot, setDrawerSlot] = useState({
    id: null,
    day: 'Monday',
    periodId: '',
    periodName: '',
    subjectId: '',
    staffId: '',
    room: '',
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [cohortsRes, sectionsRes, subjectsRes, periodsRes, staffRes] = await Promise.all([
        academicsService.getCohorts(),
        academicsService.getSections(),
        academicsService.getSubjects(),
        academicsService.getTimetablePeriods(),
        staffService.getStaff ? staffService.getStaff() : Promise.resolve([]),
      ]);

      const chList = Array.isArray(cohortsRes) ? cohortsRes : [];
      const secList = Array.isArray(sectionsRes) ? sectionsRes : [];
      const subList = Array.isArray(subjectsRes) ? subjectsRes : [];
      const prdList = Array.isArray(periodsRes) ? periodsRes : [];
      const stfList = Array.isArray(staffRes) ? staffRes : [];

      setCohorts(chList);
      setSections(secList);
      setSubjects(subList);

      // Deduplicate periods by startTime-endTime to guarantee clean column layout
      const uniquePeriods = [];
      const seenTimes = new Set();
      for (const p of prdList) {
        const key = `${p.startTime}-${p.endTime}`;
        if (!seenTimes.has(key)) {
          seenTimes.add(key);
          uniquePeriods.push(p);
        }
      }
      uniquePeriods.sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0));
      setPeriods(uniquePeriods);
      setStaffList(stfList);

      if (chList.length > 0) {
        setSelectedCohortId(chList[0].id);
        const relatedSecs = secList.filter(s => s.cohortId === chList[0].id);
        if (relatedSecs.length > 0) {
          setSelectedSectionId(relatedSecs[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load initial timetable data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadSlots = async () => {
    if (!selectedCohortId) return;
    try {
      const data = await academicsService.getTimetableSlots({
        cohortId: selectedCohortId,
        sectionId: selectedSectionId || undefined,
      });
      setSlots(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load timetable slots:', e);
    }
  };

  useEffect(() => {
    if (selectedCohortId) {
      loadSlots();
      const interval = setInterval(() => {
        if (typeof document !== 'undefined' && !document.hidden) {
          loadSlots();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedCohortId, selectedSectionId]);

  const filteredSections = sections.filter(s => s.cohortId === selectedCohortId);

  const getSlot = (day, periodId) => {
    return slots.find(s => s.day === day && s.periodId === periodId);
  };

  const handleOpenSlotDrawer = (day, period) => {
    const existing = getSlot(day, period.id);
    if (existing) {
      setDrawerSlot({
        id: existing.id,
        day,
        periodId: period.id,
        periodName: period.name,
        subjectId: existing.subjectId || '',
        staffId: existing.staffId || '',
        room: existing.room || '',
      });
    } else {
      setDrawerSlot({
        id: null,
        day,
        periodId: period.id,
        periodName: period.name,
        subjectId: subjects.length > 0 ? subjects[0].id : '',
        staffId: staffList.length > 0 ? staffList[0].id : '',
        room: 'LH-101',
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!drawerSlot.subjectId || !drawerSlot.periodId) return;

    const sub = subjects.find(s => s.id === drawerSlot.subjectId);
    const faculty = staffList.find(s => s.id === drawerSlot.staffId);
    const per = periods.find(p => p.id === drawerSlot.periodId);

    const confirmed = await confirm({
      title: 'Confirm Save Timetable Slot',
      message: `Schedule ${sub?.code || 'Course'} for ${drawerSlot.day} (${per?.name || 'Period'})?`,
      details: [
        `Day & Period: ${drawerSlot.day} • ${per?.name || 'Slot'} (${per?.startTime || ''} - ${per?.endTime || ''})`,
        `Subject: ${sub?.code} - ${sub?.name}`,
        `Instructor: ${faculty ? `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim() : (faculty?.name || 'Dr. Rajesh Kumar')}`,
        `Room / Hall: ${drawerSlot.room || 'General Classroom'}`
      ],
      confirmText: 'Yes, Save Slot',
      variant: 'primary',
      icon: 'fa-solid fa-calendar-check'
    });
    if (!confirmed) return;

    try {
      await academicsService.saveTimetableSlot({
        id: drawerSlot.id,
        day: drawerSlot.day,
        periodId: drawerSlot.periodId,
        cohortId: selectedCohortId,
        sectionId: selectedSectionId || null,
        subjectId: drawerSlot.subjectId,
        staffId: drawerSlot.staffId || null,
        room: drawerSlot.room || null,
      });

      showToast(`Slot for ${drawerSlot.day} saved successfully.`);
      setIsDrawerOpen(false);
      await loadSlots();
    } catch (err) {
      alert('Failed to save slot: ' + err.message);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    const confirmed = await confirm({
      title: 'Confirm Clear Timetable Slot',
      message: 'Clear this scheduled class session from timetable grid?',
      details: 'This will vacate the room hall, free the assigned instructor, and remove the slot from student schedules.',
      confirmText: 'Yes, Clear Slot',
      variant: 'danger',
      icon: 'fa-solid fa-trash-can'
    });
    if (!confirmed) return;

    try {
      await academicsService.deleteTimetableSlot(slotId);
      showToast('Slot removed from timetable.');
      setIsDrawerOpen(false);
      await loadSlots();
    } catch (err) {
      alert('Failed to delete slot: ' + err.message);
    }
  };

  const gridMinWidth = 110 + (periods || []).reduce((acc, p) => acc + (p.isBreak ? 140 : 185), 0);

  return (
    <>
      {/* Enterprise Confirmation Dialog */}
      <ConfirmDialog />

      <section className="view-section active">
        {toastMsg && (
          <div style={{ background: '#10B981', color: '#fff', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
            <i className="fa-solid fa-circle-check"></i>
            {toastMsg}
          </div>
        )}

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
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
              }}
            >
              <i className="fa-solid fa-calendar-days"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Master Timetable Scheduler &amp; Builder
                </h2>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Assign period schedules to cohort batches &amp; sections &bull; AY 2026&ndash;2027
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/unilms/org/timetable" className="btn btn-outline" style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-arrow-left" style={{ color: '#7C3AED' }}></i>
              <span>Timetable Hub</span>
            </Link>
            <Link to="/unilms/org/timetable/periods" className="btn btn-outline" style={{ background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-clock" style={{ color: '#0284C7' }}></i>
              <span>Manage Periods</span>
            </Link>
          </div>
        </div>

        {/* Filters Bar: Select Cohort Batch & Section */}
        <div className="card" style={{ padding: '18px 24px', marginBottom: '24px', background: '#fff', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'center' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12.5px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                Select Academic Cohort / Batch <span className="text-danger">*</span>
              </label>
              <select
                className="form-control"
                value={selectedCohortId}
                onChange={(e) => {
                  setSelectedCohortId(e.target.value);
                  const relSecs = sections.filter(s => s.cohortId === e.target.value);
                  setSelectedSectionId(relSecs.length > 0 ? relSecs[0].id : '');
                }}
              >
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.program?.name ? `(${c.program.name})` : ''}
                  </option>
                ))}
                {cohorts.length === 0 && <option value="">No academic cohorts found</option>}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12.5px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                Select Class Section
              </label>
              <select
                className="form-control"
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
              >
                <option value="">All Sections / Common Timetable</option>
                {filteredSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Max: {s.maxStudents} Students)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Timetable Weekly Grid Matrix */}
        <div className="card" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Weekly Schedule Grid (Monday – Saturday)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Click on any period slot cell to assign or edit course subject, faculty instructor, and classroom.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-outline"
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-print"></i> Print Grid
            </button>
          </div>

          <style>{`
            .timetable-matrix-container {
              width: 100%;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              border: 1px solid var(--border-color);
              border-radius: 12px;
              background: #fff;
              scrollbar-width: thin;
              scrollbar-color: #a855f7 #f1f5f9;
            }
            .timetable-matrix-container::-webkit-scrollbar {
              height: 9px;
            }
            .timetable-matrix-container::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 4px;
            }
            .timetable-matrix-container::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 4px;
            }
            .timetable-matrix-container::-webkit-scrollbar-thumb:hover {
              background: #a855f7;
            }
            .timetable-matrix-table {
              border-collapse: separate !important;
              border-spacing: 0 !important;
              table-layout: fixed !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .timetable-matrix-table th,
            .timetable-matrix-table td {
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              line-height: normal !important;
              box-sizing: border-box !important;
            }
            .timetable-matrix-table td:hover .slot-placeholder-hover {
              border-color: #7c3aed !important;
              color: #7c3aed !important;
              background: rgba(124, 58, 237, 0.04) !important;
            }
          `}</style>
          <div className="timetable-matrix-container">
            <table
              className="timetable-matrix-table"
              style={{
                width: 'max-content',
                minWidth: `${gridMinWidth}px`,
                tableLayout: 'fixed'
              }}
            >
              <colgroup>
                <col style={{ width: '110px', minWidth: '110px' }} />
                {periods.map((p) => (
                  <col
                    key={p.id}
                    style={{
                      width: p.isBreak ? '140px' : '185px',
                      minWidth: p.isBreak ? '140px' : '185px'
                    }}
                  />
                ))}
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th
                    style={{
                      width: '110px',
                      minWidth: '110px',
                      textAlign: 'center',
                      padding: '14px 10px',
                      borderRight: '1px solid var(--border-color)',
                      borderBottom: '2px solid var(--border-color)',
                      verticalAlign: 'middle',
                      background: '#f1f5f9',
                      fontWeight: '800',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      position: 'sticky',
                      left: 0,
                      zIndex: 3
                    }}
                  >
                    DAY
                  </th>
                  {periods.map((p) => (
                    <th
                      key={p.id}
                      style={{
                        width: p.isBreak ? '140px' : '185px',
                        minWidth: p.isBreak ? '140px' : '185px',
                        maxWidth: p.isBreak ? '140px' : '185px',
                        textAlign: 'center',
                        padding: '12px 6px',
                        borderRight: '1px solid var(--border-color)',
                        borderBottom: '2px solid var(--border-color)',
                        verticalAlign: 'top',
                        background: p.isBreak ? '#fef3c7' : '#f8fafc',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          fontWeight: '800',
                          color: p.isBreak ? '#b45309' : '#7C3AED',
                          fontSize: '12px',
                          lineHeight: '1.25',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={p.name}
                      >
                        {p.isBreak
                          ? p.name.toLowerCase().includes('lunch')
                            ? 'Lunch Break'
                            : 'Tea Interval'
                          : p.name}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: p.isBreak ? '#92400e' : '#64748b',
                          marginTop: '3px',
                          whiteSpace: 'nowrap',
                          fontWeight: '600'
                        }}
                      >
                        {p.startTime} – {p.endTime}
                      </div>
                    </th>
                  ))}
                  {periods.length === 0 && (
                    <th style={{ textAlign: 'center', padding: '20px' }}>
                      No period slots configured. Click "Manage Periods" to set up lecture slots.
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td
                      style={{
                        width: '110px',
                        minWidth: '110px',
                        fontWeight: '800',
                        textAlign: 'center',
                        background: '#f8fafc',
                        borderRight: '1px solid var(--border-color)',
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        verticalAlign: 'middle',
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        boxShadow: '2px 0 6px rgba(0,0,0,0.04)'
                      }}
                    >
                      {day}
                    </td>
                    {periods.map((p) => {
                      if (p.isBreak) {
                        const isLunch = p.name.toLowerCase().includes('lunch');
                        return (
                          <td
                            key={p.id}
                            style={{
                              width: '140px',
                              minWidth: '140px',
                              background: '#fffbeb',
                              textAlign: 'center',
                              borderRight: '1px solid var(--border-color)',
                              borderBottom: '1px solid var(--border-color)',
                              color: '#d97706',
                              verticalAlign: 'middle',
                              padding: '10px 4px'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                              <i className={isLunch ? 'fa-solid fa-utensils' : 'fa-solid fa-mug-hot'} style={{ fontSize: '15px', color: '#d97706' }}></i>
                              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '800' }}>
                                {isLunch ? 'Lunch Break' : 'Interval'}
                              </span>
                            </div>
                          </td>
                        );
                      }

                      const slot = getSlot(day, p.id);
                      return (
                        <td
                          key={p.id}
                          style={{
                            width: '185px',
                            minWidth: '185px',
                            maxWidth: '185px',
                            padding: '8px',
                            borderRight: '1px solid var(--border-color)',
                            borderBottom: '1px solid var(--border-color)',
                            verticalAlign: 'top',
                            height: '92px',
                            cursor: 'pointer',
                            background: slot ? '#faf5ff' : '#ffffff',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => handleOpenSlotDrawer(day, p)}
                        >
                          {slot ? (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                minHeight: '74px',
                                justifyContent: 'space-between',
                                background: '#fff',
                                border: '1.5px solid #c084fc',
                                borderRadius: '8px',
                                padding: '7px 8px',
                                boxShadow: '0 2px 5px rgba(124, 58, 237, 0.06)'
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontWeight: '800',
                                    fontSize: '11.5px',
                                    color: '#6D28D9',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: '1.3'
                                  }}
                                  title={`${slot.subject?.code} - ${slot.subject?.name}`}
                                >
                                  {slot.subject?.code} - {slot.subject?.name}
                                </span>
                                {slot.staff && (
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      color: '#64748b',
                                      display: 'block',
                                      marginTop: '2px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    <i className="fa-solid fa-user-tie me-1" style={{ color: '#8b5cf6' }}></i>
                                    {slot.staff.firstName || slot.staff.name} {slot.staff.lastName || ''}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <span
                                  style={{
                                    background: '#f3e8ff',
                                    border: '1px solid #ddd6fe',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    color: '#7c3aed',
                                    fontWeight: '700',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {slot.room || 'LH-101'}
                                </span>
                                <i className="fa-solid fa-pen" style={{ fontSize: '10px', color: '#a855f7' }}></i>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="slot-placeholder-hover"
                              style={{
                                height: '100%',
                                minHeight: '74px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1.5px dashed #e2e8f0',
                                borderRadius: '8px',
                                color: '#94a3b8',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <i className="fa-solid fa-plus" style={{ fontSize: '12px' }}></i>
                              <span style={{ fontSize: '11px', marginTop: '2px', fontWeight: '600' }}>+ Assign Slot</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slide-Over Drawer for Slot Assignment */}
        {isDrawerOpen && (
          <div
            id="slotDrawerOverlay"
            onClick={(e) => {
              if (e.target.id === 'slotDrawerOverlay') setIsDrawerOpen(false);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                width: 'min(480px, 100vw)',
                height: '100vh',
                background: '#ffffff',
                boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSaveSlot} style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>
                      <i className="fa-solid fa-calendar-check"></i>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>
                        Schedule Period Slot
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                        {drawerSlot.day} &bull; {drawerSlot.periodName}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748b', cursor: 'pointer' }}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Course Subject <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-control"
                      value={drawerSlot.subjectId}
                      onChange={(e) => setDrawerSlot({ ...drawerSlot, subjectId: e.target.value })}
                      required
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.code} - {sub.name} ({sub.type || 'Theory'})
                        </option>
                      ))}
                      {subjects.length === 0 && <option value="">No subjects found</option>}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Faculty Instructor
                    </label>
                    <select
                      className="form-control"
                      value={drawerSlot.staffId}
                      onChange={(e) => setDrawerSlot({ ...drawerSlot, staffId: e.target.value })}
                    >
                      <option value="">-- Assign Instructor --</option>
                      {staffList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.firstName} {st.lastName} ({st.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Classroom / Lab Venue
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Lecture Hall 101, Lab 402"
                      value={drawerSlot.room}
                      onChange={(e) => setDrawerSlot({ ...drawerSlot, room: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {drawerSlot.id ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(drawerSlot.id)}
                      className="btn btn-outline"
                      style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                    >
                      <i className="fa-solid fa-trash me-1"></i> Clear Slot from Grid
                    </button>
                  ) : <div />}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setIsDrawerOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ background: '#7C3AED', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700' }}>
                      Save Slot
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgTimetableBuilder;
