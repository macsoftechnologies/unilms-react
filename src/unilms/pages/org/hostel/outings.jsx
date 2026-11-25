import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import hostelService from '../../../services/hostel.service';
import studentsService from '../../../services/students.service';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';

const OrgHostelOutings = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [outings, setOutings] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const pollTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    student_id: '',
    purpose: '',
    out_time: '',
    parent_approved: true,
  });

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsPolling(true);

    try {
      const [oList, sList] = await Promise.all([
        hostelService.getOutings(statusFilter),
        studentsService.getStudents(),
      ]);

      const normalizedOutings = (Array.isArray(oList) ? oList : []).map(o => ({
        id: o.id,
        student_id: o.studentId,
        student_name: o.student ? `${o.student.firstName} ${o.student.lastName || ''}`.trim() : 'Resident Student',
        roll_no: o.student?.rollNumber || 'N/A',
        phone: o.student?.phone || '+91 98765 00000',
        purpose: o.purpose,
        out_time: o.outTime ? new Date(o.outTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
        in_time: o.inTime ? new Date(o.inTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null,
        parent_approved: o.parentApproved === true,
        status: (o.status || 'PENDING').toUpperCase(),
      }));

      setOutings(normalizedOutings);
      setStudents(Array.isArray(sList) ? sList : []);

      if (sList && sList.length > 0 && !formData.student_id) {
        setFormData(prev => ({ ...prev, student_id: sList[0].id }));
      }

      setLastSynced(new Date());
    } catch (e) {
      console.error('Failed to load hostel outings:', e);
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData(false);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadData]);

  const filteredOutings = useMemo(() => {
    return outings.filter(o => {
      const matchesSearch =
        o.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.purpose.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [outings, searchTerm, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedOutings,
    totalItems
  } = useTablePagination(filteredOutings, 10);

  const handleApprove = async (outing) => {
    const confirmed = await confirm({
      title: 'Approve Outing Gatepass',
      message: `Approve gatepass exit for ${outing.student_name} (${outing.roll_no})?`,
      details: [
        `Resident: ${outing.student_name} (Roll: ${outing.roll_no})`,
        `Purpose: ${outing.purpose}`,
        `Parent Consent: ${outing.parent_approved ? 'Verified by Parent' : 'Unconfirmed'}`,
      ],
      confirmText: 'Approve Gatepass',
      type: 'primary',
    });

    if (!confirmed) return;

    try {
      await hostelService.updateOutingStatus(outing.id, 'APPROVED');
      await loadData(false);
    } catch (err) {
      alert('Failed to approve gatepass: ' + err.message);
    }
  };

  const handleMarkReturned = async (outing) => {
    const confirmed = await confirm({
      title: 'Log Resident Return',
      message: `Mark ${outing.student_name} (${outing.roll_no}) as returned to hostel campus?`,
      details: [
        `Resident: ${outing.student_name}`,
        `Roll Number: ${outing.roll_no}`,
        `Exit Time: ${outing.out_time}`,
        `Return Time: Current System Time`,
      ],
      confirmText: 'Confirm In-Time',
      type: 'primary',
    });

    if (!confirmed) return;

    try {
      await hostelService.updateOutingStatus(outing.id, 'RETURNED');
      await loadData(false);
    } catch (err) {
      alert('Failed to log return: ' + err.message);
    }
  };

  const handleReject = async (outing) => {
    const confirmed = await confirm({
      title: 'Reject Outing Gatepass',
      message: `Reject outing request for ${outing.student_name}?`,
      confirmText: 'Reject Request',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await hostelService.updateOutingStatus(outing.id, 'REJECTED');
      await loadData(false);
    } catch (err) {
      alert('Failed to reject gatepass: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.purpose) return;

    const matchedStudent = students.find(s => s.id === formData.student_id);
    const sName = matchedStudent ? `${matchedStudent.firstName} ${matchedStudent.lastName || ''}`.trim() : 'Student';

    const confirmed = await confirm({
      title: 'Submit Student Outing Request',
      message: `Generate outing gatepass for ${sName}?`,
      details: [
        `Candidate: ${sName} (${matchedStudent?.rollNumber})`,
        `Purpose: ${formData.purpose}`,
        `Parent Approval: ${formData.parent_approved ? 'Granted' : 'Pending'}`,
      ],
      confirmText: 'Issue Request',
      type: 'primary',
    });

    if (!confirmed) return;

    try {
      await hostelService.createOuting({
        studentId: formData.student_id,
        purpose: formData.purpose,
        outTime: formData.out_time ? new Date(formData.out_time) : new Date(),
        parentApproved: formData.parent_approved,
        status: 'PENDING',
      });

      setIsModalOpen(false);
      setFormData(prev => ({ ...prev, purpose: '', out_time: '' }));
      await loadData(false);
    } catch (err) {
      alert('Failed to create outing request: ' + err.message);
    }
  };

  return (
    <>
      <ConfirmDialog />
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
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
              }}
            >
              <i className="fa-solid fa-person-walking-arrow-right"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Hostel Outings &amp; Digital Gatepasses
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Warden approvals, biometric exit/entry verification, and parent consent telemetry &bull; AY 2026&ndash;2027
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => loadData(false)}
              className="btn btn-outline"
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              title="Refresh Data"
            >
              <i className={`fa-solid fa-rotate-right ${isPolling ? 'fa-spin' : ''}`}></i>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>New Outing Request</span>
            </button>
            <Link
              to="/unilms/org/hostel"
              className="btn btn-outline"
              style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-building"></i>
              <span>Blocks</span>
            </Link>
            <Link
              to="/unilms/org/hostel/rooms"
              className="btn btn-outline"
              style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-door-open"></i>
              <span>Rooms</span>
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search by student name, roll number, or outing purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
            />
          </div>
          <div style={{ minWidth: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
            >
              <option value="all">All Gatepass Statuses</option>
              <option value="PENDING">Pending Warden Review</option>
              <option value="APPROVED">Approved (Outside Campus)</option>
              <option value="RETURNED">Returned to Hostel</option>
              <option value="REJECTED">Rejected Requests</option>
            </select>
          </div>
        </div>

        {/* Outings Table Card */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-ticket" style={{ color: '#D97706' }}></i> Outing &amp; Gatepass Registry ({totalItems})
          </h3>

          {loading ? (
            <TableSkeletonLoader rows={6} columns={6} />
          ) : paginatedOutings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <i className="fa-solid fa-clipboard-check" style={{ fontSize: '36px', color: '#CBD5E1', marginBottom: '12px' }}></i>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>No student outings logged matching the selected filter.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Resident</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Purpose &amp; Destination</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>Out Time</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>In Time (Actual)</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'center' }}>Gatepass Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOutings.map((o) => {
                      const isPending = o.status === 'PENDING';
                      const isApproved = o.status === 'APPROVED' || o.status === 'OUTSIDE';
                      const isReturned = o.status === 'RETURNED';

                      return (
                        <tr key={o.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: '800', color: '#1E293B' }}>{o.student_name}</div>
                            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: '4px' }}>
                              {o.roll_no}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#334155' }}>
                            <div style={{ fontWeight: '600' }}>{o.purpose}</div>
                            <div style={{ fontSize: '11.5px', color: o.parent_approved ? '#059669' : '#D97706', marginTop: '2px' }}>
                              <i className={`fa-solid ${o.parent_approved ? 'fa-shield-halved' : 'fa-triangle-exclamation'} me-1`}></i>
                              {o.parent_approved ? 'Parent Consent Verified' : 'Parent Consent Unconfirmed'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#64748B' }}>
                            {o.out_time}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#64748B' }}>
                            {o.in_time || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Pending Return</span>}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: '800',
                              background: isApproved ? '#FEF3C7' : isReturned ? '#DCFCE7' : isPending ? '#EEF2FF' : '#FEE2E2',
                              color: isApproved ? '#B45309' : isReturned ? '#15803D' : isPending ? '#4F46E5' : '#B91C1C'
                            }}>
                              {o.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            {isPending && (
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(o)}
                                  style={{ background: '#DCFCE7', color: '#15803D', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(o)}
                                  style={{ background: '#FEE2E2', color: '#B91C1C', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => handleMarkReturned(o)}
                                style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <i className="fa-solid fa-arrow-left"></i> Mark Returned
                              </button>
                            )}
                            {isReturned && (
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669' }}>
                                <i className="fa-solid fa-check me-1"></i> Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <TablePagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
                totalItems={totalItems}
              />
            </>
          )}
        </div>

        {/* New Outing Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>
                  <i className="fa-solid fa-person-walking-arrow-right text-warning me-2"></i> Submit Outing Gatepass
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}>&times;</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Resident Candidate</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName || ''} ({s.rollNumber})</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Purpose / Destination</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekend Library Research, Medical Visit, etc."
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Planned Out-Time</label>
                  <input
                    type="datetime-local"
                    value={formData.out_time}
                    onChange={(e) => setFormData({ ...formData, out_time: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600', color: '#1E293B' }}>
                    <input
                      type="checkbox"
                      checked={formData.parent_approved}
                      onChange={(e) => setFormData({ ...formData, parent_approved: e.target.checked })}
                    />
                    Parent / Guardian Consent Verified via SMS / Portal
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', color: '#475569' }}>Cancel</button>
                  <button type="submit" style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#D97706', color: '#fff', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}>Generate Request</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgHostelOutings;
