import { Link } from 'react-router-dom';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import libraryService from '../../../services/library.service';
import studentsService from '../../../services/students.service';
import staffService from '../../../services/staff.service';

const OrgLibraryMembers = () => {
  const [members, setMembers] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    member_type: 'student',
    student_id: '',
    staff_id: '',
    max_books_allowed: 4,
    valid_till: '2027-06-30',
    status: 'active'
  });

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const [mList, sList, fList] = await Promise.all([
        libraryService.getMembers(),
        studentsService.getStudents().catch(() => []),
        staffService.getStaff().catch(() => [])
      ]);

      setMembers(Array.isArray(mList) ? mList : []);
      setStudents(Array.isArray(sList) ? sList : []);
      setStaff(Array.isArray(fList) ? fList : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Failed to load library members from PostgreSQL:', e);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase();
      const borrowerName = m.student ? `${m.student.firstName} ${m.student.lastName || ''}`.trim() : (m.staff ? `${m.staff.firstName} ${m.staff.lastName || ''}`.trim() : '');
      const rollOrCode = m.student?.rollNumber || m.staff?.employeeCode || '';
      const cardNo = m.cardNo || '';

      const matchesSearch = 
        cardNo.toLowerCase().includes(q) ||
        borrowerName.toLowerCase().includes(q) ||
        rollOrCode.toLowerCase().includes(q);

      const matchesType = typeFilter === 'All' || m.memberType?.toLowerCase() === typeFilter.toLowerCase();
      const matchesStatus = statusFilter === 'All' || m.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [members, searchQuery, typeFilter, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedMembers,
    totalItems
  } = useTablePagination(filteredMembers, 10);

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormData({
      member_type: 'student',
      student_id: '',
      staff_id: '',
      max_books_allowed: 4,
      valid_till: '2027-06-30',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mem) => {
    setEditingMember(mem);
    setFormData({
      member_type: mem.memberType,
      student_id: mem.studentId || '',
      staff_id: mem.staffId || '',
      max_books_allowed: mem.maxBooksAllowed || 4,
      valid_till: mem.validTill ? mem.validTill.split('T')[0] : '2027-06-30',
      status: mem.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await libraryService.updateMember(editingMember.id, {
          maxBooksAllowed: Number(formData.max_books_allowed),
          validTill: formData.valid_till,
          status: formData.status
        });
      } else {
        await libraryService.createMember({
          memberType: formData.member_type,
          studentId: formData.member_type === 'student' ? formData.student_id : null,
          staffId: formData.member_type === 'staff' ? formData.staff_id : null,
          maxBooksAllowed: Number(formData.max_books_allowed),
          validTill: formData.valid_till,
          status: formData.status
        });
      }

      handleCloseModal();
      await loadData();
    } catch (err) {
      alert('Failed to save library cardholder: ' + err.message);
    }
  };

  const handleDelete = (mem) => {
    confirmAction({
      title: 'Revoke Library Membership Card',
      message: `Are you sure you want to revoke membership card "${mem.cardNo}"? Active loans must be cleared prior to card cancellation.`,
      confirmText: 'Revoke Membership',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await libraryService.deleteMember(mem.id);
          await loadData();
        } catch (err) {
          alert('Failed to revoke card: ' + err.message);
        }
      }
    });
  };

  return (
    <>
      <ConfirmModal />
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
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <i className="fa-solid fa-address-card"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Library Members &amp; Borrower Registry
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: isSyncing ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: isSyncing ? '#6366F1' : '#10B981',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <i className={`fa-solid ${isSyncing ? 'fa-arrows-rotate fa-spin' : 'fa-circle-check'}`} style={{ fontSize: '9px' }}></i>
                  {isSyncing ? 'Syncing...' : 'Live Sync'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Issued borrower cards for enrolled candidates &amp; faculty members &bull; Last Synced: {lastSyncTime}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/unilms/org/library/issues" className="btn btn-outline" style={{ textDecoration: 'none', padding: '10px 16px', borderRadius: '10px' }}>
              <i className="fa-solid fa-hand-holding-hand me-1"></i> Circulation Desk
            </Link>
            <button
              onClick={handleOpenAddModal}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-plus"></i> Issue Member Card
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
            <input
              type="text"
              placeholder="Search by card number, borrower name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '42px', borderRadius: '10px' }}
            />
          </div>
          <div style={{ minWidth: '150px' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select"
              style={{ height: '42px', borderRadius: '10px' }}
            >
              <option value="All">All Types ({members.length})</option>
              <option value="student">Students</option>
              <option value="staff">Teaching Faculty</option>
            </select>
          </div>
          <div style={{ minWidth: '150px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ height: '42px', borderRadius: '10px' }}
            >
              <option value="All">All Statuses</option>
              <option value="active">Active Cards</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Borrower Card No</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Member Profile &amp; Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>Loan Limit</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Valid Till</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>Card Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={6} rows={pageSize || 8} />
                ) : paginatedMembers.length > 0 ? (
                  paginatedMembers.map((m) => {
                    const isStudent = m.memberType?.toLowerCase() === 'student';
                    const name = m.student ? `${m.student.firstName} ${m.student.lastName || ''}`.trim() : (m.staff ? `${m.staff.firstName} ${m.staff.lastName || ''}`.trim() : 'Member');
                    const rollOrCode = m.student?.rollNumber || m.staff?.employeeCode || '';

                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '800', color: '#059669' }}>
                          {m.cardNo}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#1E293B' }}>{name}</div>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isStudent ? '#EFF6FF' : '#F5F3FF',
                            color: isStudent ? '#2563EB' : '#7C3AED',
                            fontWeight: '600'
                          }}>
                            {rollOrCode} ({isStudent ? 'Enrolled Candidate' : 'Faculty'})
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#334155' }}>
                          {m.maxBooksAllowed} Books
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>
                          {m.validTill ? new Date(m.validTill).toLocaleDateString() : 'Academic Year'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: m.status?.toLowerCase() === 'active' ? '#DCFCE7' : '#FEE2E2',
                            color: m.status?.toLowerCase() === 'active' ? '#16A34A' : '#DC2626'
                          }}>
                            {m.status?.toUpperCase() || 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenEditModal(m)}
                              className="btn btn-outline"
                              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px' }}
                              title="Edit Member Limits"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(m)}
                              className="btn btn-outline"
                              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', color: '#DC2626', borderColor: '#FEE2E2' }}
                              title="Revoke Card"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      No library members found. Click 'Issue Member Card' to register a borrower.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="library members"
          />
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                  {editingMember ? 'Update Member Card' : 'Issue Library Membership Card'}
                </h3>
                <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
              </div>

              <form onSubmit={handleSubmit}>
                {!editingMember && (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Membership Type</label>
                      <select
                        value={formData.member_type}
                        onChange={(e) => setFormData({ ...formData, member_type: e.target.value })}
                        className="form-select"
                      >
                        <option value="student">Enrolled Student</option>
                        <option value="staff">Teaching Faculty</option>
                      </select>
                    </div>

                    {formData.member_type === 'student' ? (
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Select Enrolled Student *</label>
                        <select
                          required
                          value={formData.student_id}
                          onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                          className="form-select"
                        >
                          <option value="">-- Choose Candidate --</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.rollNumber} — {s.firstName} {s.lastName || ''} ({s.program?.name || 'B.Tech CSE'})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Select Faculty Member *</label>
                        <select
                          required
                          value={formData.staff_id}
                          onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                          className="form-select"
                        >
                          <option value="">-- Choose Faculty --</option>
                          {staff.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.employeeCode} — {f.firstName} {f.lastName || ''} ({f.designation})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Max Books Allowed</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.max_books_allowed}
                      onChange={(e) => setFormData({ ...formData, max_books_allowed: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Validity Date</label>
                    <input
                      type="date"
                      value={formData.valid_till}
                      onChange={(e) => setFormData({ ...formData, valid_till: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Card Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={handleCloseModal} className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#10B981', color: '#fff', padding: '8px 18px', borderRadius: '8px', border: 'none', fontWeight: '700' }}>
                    {editingMember ? 'Save Changes' : 'Issue Member Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default OrgLibraryMembers;
