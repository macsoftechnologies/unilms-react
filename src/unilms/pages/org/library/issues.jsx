import { Link } from 'react-router-dom';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import libraryService from '../../../services/library.service';

const OrgLibraryIssues = () => {
  const [issues, setIssues] = useState([]);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    book_id: '',
    member_id: '',
    issue_date: todayStr,
    due_date: defaultDueDate,
    remarks: ''
  });

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const [issueList, bookList, memberList] = await Promise.all([
        libraryService.getIssues(),
        libraryService.getBooks(),
        libraryService.getMembers()
      ]);
      setIssues(Array.isArray(issueList) ? issueList : []);
      setBooks(Array.isArray(bookList) ? bookList : []);
      setMembers(Array.isArray(memberList) ? memberList : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Failed to load library issues from PostgreSQL:', e);
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

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      const q = searchQuery.toLowerCase();
      const borrowerName = i.student ? `${i.student.firstName} ${i.student.lastName || ''}`.trim() : (i.staff ? `${i.staff.firstName} ${i.staff.lastName || ''}`.trim() : '');
      const rollOrCode = i.student?.rollNumber || i.staff?.employeeCode || '';
      const bookTitle = i.book?.title || '';
      const accNo = i.book?.accessionNo || '';

      const matchesSearch = 
        accNo.toLowerCase().includes(q) ||
        bookTitle.toLowerCase().includes(q) ||
        borrowerName.toLowerCase().includes(q) ||
        rollOrCode.toLowerCase().includes(q);

      const isOverdue = i.status === 'OVERDUE' || (i.status === 'ISSUED' && new Date(i.dueDate) < new Date());
      let matchesStatus = true;
      if (statusFilter === 'ISSUED') matchesStatus = i.status === 'ISSUED' && !isOverdue;
      else if (statusFilter === 'RETURNED') matchesStatus = i.status === 'RETURNED';
      else if (statusFilter === 'OVERDUE') matchesStatus = isOverdue;

      return matchesSearch && matchesStatus;
    });
  }, [issues, searchQuery, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedIssues,
    totalItems
  } = useTablePagination(filteredIssues, 10);

  const availableBooks = useMemo(() => {
    return books.filter(b => (b.availableCopies || 0) > 0);
  }, [books]);

  const handleOpenIssueModal = () => {
    setFormData({
      book_id: availableBooks[0]?.id || '',
      member_id: members[0]?.id || '',
      issue_date: todayStr,
      due_date: defaultDueDate,
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.book_id || !formData.member_id) {
      alert('Please select both a book title and a library member.');
      return;
    }

    const member = members.find(m => m.id === formData.member_id);
    const studentId = member?.studentId || null;
    const staffId = member?.staffId || null;

    try {
      await libraryService.issueBook({
        bookId: formData.book_id,
        studentId,
        staffId,
        issueDate: formData.issue_date,
        dueDate: formData.due_date,
        remarks: formData.remarks || null
      });

      handleCloseModal();
      await loadData();
    } catch (err) {
      alert('Failed to issue book: ' + err.message);
    }
  };

  const handleReturn = (issue) => {
    const isOverdue = new Date(issue.dueDate) < new Date() && issue.status !== 'RETURNED';
    let assessedFine = 0;
    if (isOverdue) {
      const diffDays = Math.ceil((new Date() - new Date(issue.dueDate)) / (1000 * 60 * 60 * 24));
      assessedFine = Math.max(0, diffDays * 10);
    }

    confirmAction({
      title: 'Return Book Copy to Circulation',
      message: `Confirm return of "${issue.book?.title}" (Accession: ${issue.book?.accessionNo})? ${assessedFine > 0 ? `Assessed Overdue Fine: ₹${assessedFine}.` : ''}`,
      confirmText: 'Confirm Book Return',
      confirmVariant: assessedFine > 0 ? 'warning' : 'primary',
      onConfirm: async () => {
        try {
          await libraryService.returnBook(issue.id, assessedFine);
          await loadData();
        } catch (err) {
          alert('Failed to return book: ' + err.message);
        }
      }
    });
  };

  const handleRenew = (issue) => {
    confirmAction({
      title: 'Renew Book Loan',
      message: `Extend loan period for "${issue.book?.title}" by +14 days from current due date?`,
      confirmText: 'Renew for 14 Days',
      confirmVariant: 'primary',
      onConfirm: async () => {
        try {
          await libraryService.renewBook(issue.id, 14);
          await loadData();
        } catch (err) {
          alert('Failed to renew book: ' + err.message);
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
              <i className="fa-solid fa-hand-holding-hand"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Circulation Desk: Issues &amp; Returns
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
                Issue book loans to students &amp; faculty, assess overdue fines &amp; process returns &bull; Last Synced: {lastSyncTime}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/unilms/org/library/books" className="btn btn-outline" style={{ textDecoration: 'none', padding: '10px 16px', borderRadius: '10px' }}>
              <i className="fa-solid fa-book me-1"></i> Catalog OPAC
            </Link>
            <button
              onClick={handleOpenIssueModal}
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
              <i className="fa-solid fa-plus"></i> Issue Book
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
            <input
              type="text"
              placeholder="Search by book title, accession no, borrower name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '42px', borderRadius: '10px' }}
            />
          </div>
          <div style={{ minWidth: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ height: '42px', borderRadius: '10px' }}
            >
              <option value="All">All Loan Statuses ({issues.length})</option>
              <option value="ISSUED">Active Loans</option>
              <option value="OVERDUE">Overdue Books</option>
              <option value="RETURNED">Returned History</option>
            </select>
          </div>
        </div>

        {/* Circulation Table */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Accession &amp; Book Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Borrower Member</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Issue Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Due Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>Fine (₹)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={7} rows={pageSize || 8} />
                ) : paginatedIssues.length > 0 ? (
                  paginatedIssues.map((i) => {
                    const borrowerName = i.student ? `${i.student.firstName} ${i.student.lastName || ''}`.trim() : (i.staff ? `${i.staff.firstName} ${i.staff.lastName || ''}`.trim() : 'Borrower');
                    const rollOrCode = i.student?.rollNumber || i.staff?.employeeCode || '';
                    const isOverdue = i.status === 'OVERDUE' || (i.status === 'ISSUED' && new Date(i.dueDate) < new Date());

                    return (
                      <tr key={i.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: '800', color: '#059669', display: 'block' }}>{i.book?.accessionNo}</span>
                          <span style={{ fontWeight: '600', color: '#1E293B' }}>{i.book?.title}</span>
                          {i.book?.rackNo && <div style={{ fontSize: '11px', color: '#94A3B8' }}>{i.book.rackNo}</div>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#334155' }}>{borrowerName}</div>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: i.student ? '#EFF6FF' : '#F5F3FF',
                            color: i.student ? '#2563EB' : '#7C3AED',
                            fontWeight: '600'
                          }}>
                            {rollOrCode} ({i.student ? 'Student' : 'Faculty'})
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>
                          {i.issueDate ? new Date(i.issueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ color: isOverdue ? '#DC2626' : '#334155', fontWeight: isOverdue ? '800' : '600' }}>
                            {i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'N/A'}
                          </span>
                          {isOverdue && <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: '700' }}>Past Due Date</div>}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            background: i.status === 'RETURNED' ? '#DCFCE7' : (isOverdue ? '#FEE2E2' : '#FEF3C7'),
                            color: i.status === 'RETURNED' ? '#16A34A' : (isOverdue ? '#DC2626' : '#D97706')
                          }}>
                            {i.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: Number(i.fineAmount) > 0 ? '#DC2626' : '#64748B' }}>
                          {Number(i.fineAmount) > 0 ? `₹${i.fineAmount}` : '₹0'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {i.status !== 'RETURNED' ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                onClick={() => handleReturn(i)}
                                className="btn btn-outline"
                                style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11.5px', background: '#DCFCE7', borderColor: '#BBF7D0', color: '#16A34A', fontWeight: '700' }}
                                title="Return Book"
                              >
                                <i className="fa-solid fa-arrow-down-left-and-arrow-up-right-to-center me-1"></i> Return
                              </button>
                              <button
                                onClick={() => handleRenew(i)}
                                className="btn btn-outline"
                                style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11.5px', color: '#2563EB', borderColor: '#BFDBFE' }}
                                title="Renew for 14 Days"
                              >
                                <i className="fa-solid fa-rotate"></i>
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Returned on {new Date(i.returnDate).toLocaleDateString()}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      No circulation records found. Click 'Issue Book' to register a loan.
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
            itemName="circulation records"
          />
        </div>

        {/* Issue Book Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Circulation: Issue Book Loan</h3>
                <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Select Available Book *</label>
                  <select
                    required
                    value={formData.book_id}
                    onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
                    className="form-select"
                  >
                    <option value="">-- Choose Book from OPAC --</option>
                    {availableBooks.map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.accessionNo}] {b.title} ({b.availableCopies} avail)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Borrower Member Card *</label>
                  <select
                    required
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    className="form-select"
                  >
                    <option value="">-- Choose Member Card --</option>
                    {members.map((m) => {
                      const name = m.student ? `${m.student.firstName} ${m.student.lastName || ''}`.trim() : (m.staff ? `${m.staff.firstName} ${m.staff.lastName || ''}`.trim() : 'Cardholder');
                      const rollOrCode = m.student?.rollNumber || m.staff?.employeeCode || '';
                      return (
                        <option key={m.id} value={m.id}>
                          {m.cardNo} — {name} ({rollOrCode})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Issue Date</label>
                    <input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Due Date (+14 days)</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Circulation Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Semester project reference"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={handleCloseModal} className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#10B981', color: '#fff', padding: '8px 18px', borderRadius: '8px', border: 'none', fontWeight: '700' }}>
                    Confirm &amp; Issue Book
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

export default OrgLibraryIssues;
