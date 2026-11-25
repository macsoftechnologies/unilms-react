import { Link } from 'react-router-dom';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import libraryService from '../../../services/library.service';

const OrgLibraryBooks = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const { confirmAction, ConfirmModal } = useConfirmDialog();

  const [formData, setFormData] = useState({
    accession_no: '',
    isbn: '',
    title: '',
    author: '',
    category_id: '',
    rack_no: 'Rack A1, Shelf 1',
    total_copies: 5,
    publisher: '',
    edition: '1st Edition'
  });

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsSyncing(true);

    try {
      const [bookList, catList] = await Promise.all([
        libraryService.getBooks(),
        libraryService.getCategories(),
      ]);
      setBooks(Array.isArray(bookList) ? bookList : []);
      setCategories(Array.isArray(catList) ? catList : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Failed to load library books from PostgreSQL:', e);
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

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (b.accessionNo && b.accessionNo.toLowerCase().includes(q)) ||
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.toLowerCase().includes(q));

      const matchesCat = selectedCategory === 'All' || b.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [books, searchQuery, selectedCategory]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedBooks,
    totalItems
  } = useTablePagination(filteredBooks, 10);

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setFormData({
      accession_no: `LIB-CS-00${books.length + 1}`,
      isbn: '',
      title: '',
      author: '',
      category_id: categories[0]?.id || '',
      rack_no: 'Rack A1, Shelf 1',
      total_copies: 5,
      publisher: '',
      edition: '1st Edition'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book) => {
    setEditingBook(book);
    setFormData({
      accession_no: book.accessionNo,
      isbn: book.isbn || '',
      title: book.title,
      author: book.author,
      category_id: book.categoryId || categories[0]?.id || '',
      rack_no: book.rackNo || '',
      total_copies: book.totalCopies || 1,
      publisher: book.publisher || '',
      edition: book.edition || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accession_no || !formData.title || !formData.author) {
      alert('Accession No, Title, and Author are mandatory fields.');
      return;
    }

    try {
      if (editingBook) {
        await libraryService.updateBook(editingBook.id, {
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          categoryId: formData.category_id || null,
          rackNo: formData.rack_no,
          totalCopies: Number(formData.total_copies),
          publisher: formData.publisher,
          edition: formData.edition
        });
      } else {
        await libraryService.createBook({
          accessionNo: formData.accession_no,
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          categoryId: formData.category_id || null,
          rackNo: formData.rack_no,
          totalCopies: Number(formData.total_copies),
          publisher: formData.publisher,
          edition: formData.edition
        });
      }

      handleCloseModal();
      await loadData();
    } catch (err) {
      alert('Failed to save book record: ' + err.message);
    }
  };

  const handleDelete = (book) => {
    confirmAction({
      title: 'Discard / Delete Book Title',
      message: `Are you sure you want to delete "${book.title}" (Accession: ${book.accessionNo}) from the OPAC catalog?`,
      confirmText: 'Delete Book',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await libraryService.deleteBook(book.id);
          await loadData();
        } catch (err) {
          alert('Failed to delete book: ' + err.message);
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
              <i className="fa-solid fa-book"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  OPAC Book Catalog &amp; Accession Register
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
                Cataloged academic books, shelf rack identifiers &amp; available volume inventory &bull; Last Synced: {lastSyncTime}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/unilms/org/library/categories" className="btn btn-outline" style={{ textDecoration: 'none', padding: '10px 16px', borderRadius: '10px' }}>
              <i className="fa-solid fa-layer-group me-1"></i> Manage Sections
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
              <i className="fa-solid fa-plus"></i> Accession Book
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
            <input
              type="text"
              placeholder="Search title, author, accession no, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', height: '42px', borderRadius: '10px' }}
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-select"
              style={{ height: '42px', borderRadius: '10px' }}
            >
              <option value="All">All Categories ({books.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Books Table */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Accession No</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Book Title &amp; Author</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Category / Discipline</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Shelf Rack</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>Circulation Availability</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={6} rows={pageSize || 8} />
                ) : paginatedBooks.length > 0 ? (
                  paginatedBooks.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '800', color: '#059669' }}>
                        {b.accessionNo}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#1E293B' }}>{b.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>by {b.author}</div>
                        {b.isbn && <span style={{ fontSize: '11px', color: '#94A3B8' }}>ISBN: {b.isbn}</span>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                        <span style={{ background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          {b.category?.name || 'General Section'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        {b.rackNo || 'Main Stack'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          background: b.availableCopies > 0 ? '#DCFCE7' : '#FEE2E2',
                          color: b.availableCopies > 0 ? '#16A34A' : '#DC2626',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: '700',
                          fontSize: '11.5px',
                          display: 'inline-block'
                        }}>
                          {b.availableCopies > 0 ? `${b.availableCopies} / ${b.totalCopies} Available` : 'All Issued'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEditModal(b)}
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px' }}
                            title="Edit Book Details"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(b)}
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', color: '#DC2626', borderColor: '#FEE2E2' }}
                            title="Delete Book"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      No catalog books found matching filter.
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
            itemName="books"
          />
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                  {editingBook ? 'Edit Book Record' : 'Accession New Book into OPAC'}
                </h3>
                <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Accession No *</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingBook}
                      value={formData.accession_no}
                      onChange={(e) => setFormData({ ...formData, accession_no: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>ISBN</label>
                    <input
                      type="text"
                      placeholder="e.g. 978-0262046305"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Book Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full academic title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Author(s) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Primary author and co-authors..."
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Discipline / Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="form-select"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Shelf Rack Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Rack A1, Shelf 3"
                      value={formData.rack_no}
                      onChange={(e) => setFormData({ ...formData, rack_no: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Total Physical Copies</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.total_copies}
                      onChange={(e) => setFormData({ ...formData, total_copies: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Publisher</label>
                    <input
                      type="text"
                      placeholder="e.g. Pearson / MIT Press"
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={handleCloseModal} className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#10B981', color: '#fff', padding: '8px 18px', borderRadius: '8px', border: 'none', fontWeight: '700' }}>
                    {editingBook ? 'Save Changes' : 'Accession Book'}
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

export default OrgLibraryBooks;
