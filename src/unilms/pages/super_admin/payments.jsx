import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { superAdminService } from '../../services/superAdmin.service';

const SuperAdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const res = await superAdminService.getPayments();
            const formatted = Array.isArray(res) ? res.map(p => ({
                id: p.id,
                invoice_id: p.invoiceId || `INV-${String(p.id).slice(0, 8).toUpperCase()}`,
                org_name: p.tenant?.name || 'Institutional Campus',
                amount: Number(p.amount) || 0,
                payment_date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : '—',
                payment_method: p.method || 'Razorpay Online',
                status: p.status || 'Paid'
            })) : [];
            setPayments(formatted);
        } catch (err) {
            console.error('Could not load payments from backend:', err);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, []);

    const filteredPayments = payments.filter(p =>
        p.invoice_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.org_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.payment_method.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const avgTransaction = payments.length > 0 ? (totalRevenue / payments.length) : 0;

    const exportCSV = () => {
        if (payments.length === 0) {
            alert('No payment records to export.');
            return;
        }
        const headers = ['Invoice ID', 'Organization', 'Amount (INR)', 'Date', 'Payment Method', 'Status'];
        const rows = filteredPayments.map(p => [
            `"${p.invoice_id}"`,
            `"${p.org_name.replace(/"/g, '""')}"`,
            p.amount,
            `"${p.payment_date}"`,
            `"${p.payment_method}"`,
            `"${p.status}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `unilms_payments_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        paginatedItems: paginatedPayments,
        totalItems
    } = useTablePagination(filteredPayments, 10);

    return (
        <>
            <section className="view-section active" style={{ padding: 'clamp(12px, 3vw, 24px) clamp(10px, 2.5vw, 20px)' }}>
                {/* Top Header Card matching Reference UI */}
                <div
                    style={{
                        background: 'var(--bg-card, #ffffff)',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        borderRadius: '16px',
                        padding: 'clamp(14px, 2.5vw, 20px) clamp(16px, 3vw, 24px)',
                        marginBottom: '22px',
                        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        <div
                            style={{
                                width: '46px',
                                height: '46px',
                                minWidth: '46px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #06B6D4, #0284C7)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
                            }}
                        >
                            <i className="fa-solid fa-credit-card"></i>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main, #1e293b)', letterSpacing: '-0.3px' }}>
                                Payment History
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                Track all subscription license renewals, incoming tenant receipts, and transaction invoices from PostgreSQL.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button 
                            type="button" 
                            className="btn btn-outline" 
                            onClick={exportCSV}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                            <i className="fa-solid fa-download"></i> Export CSV
                        </button>
                    </div>
                </div>

                {/* Dynamic Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '22px' }}>
                    <div className="stat-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Total Revenue Collected</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#16A34A', marginTop: '4px' }}>
                            ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="stat-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Transactions Count</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary, #2563EB)', marginTop: '4px' }}>
                            {payments.length}
                        </div>
                    </div>
                    <div className="stat-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Average Transaction</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#0284C7', marginTop: '4px' }}>
                            ₹{avgTransaction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '18px', maxWidth: '360px' }}>
                    <div style={{ position: 'relative' }}>
                        <i className="fa-solid fa-magnifying-glass" style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted, #94a3b8)',
                            fontSize: '14px'
                        }}></i>
                        <input
                            type="text"
                            placeholder="Search by invoice ID or organization..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px 10px 38px',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color, #e2e8f0)',
                                background: 'var(--bg-card, #ffffff)',
                                fontSize: '13.5px',
                                color: 'var(--text-main, #1e293b)',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Modern Card Wrapped Table Container */}
                <div className="table-container" style={{ background: 'var(--bg-card, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: 'var(--shadow-sm)' }}>
                    <table className="data-table" style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0, 0, 0, 0.02)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Invoice ID</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Organization</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Amount</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Date</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Method</th>
                                <th style={{ textAlign: 'center', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableSkeletonLoader columns={6} rows={pageSize || 5} />
                            ) : paginatedPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                        No payments found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedPayments.map(payment => (
                                    <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                                        <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary, #6366f1)', fontSize: '13px' }}>
                                            {payment.invoice_id}
                                        </td>
                                        <td style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--text-main, #1e293b)' }}>
                                            {payment.org_name}
                                        </td>
                                        <td style={{ padding: '14px 20px', fontWeight: '800', color: 'var(--text-main, #1e293b)', fontSize: '14px' }}>
                                            ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                            {payment.payment_date}
                                        </td>
                                        <td style={{ padding: '14px 20px', fontSize: '12.5px', color: 'var(--text-muted, #64748b)' }}>
                                            <i className="fa-solid fa-receipt me-1" style={{ color: 'var(--primary, #6366f1)' }}></i> {payment.payment_method}
                                        </td>
                                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                            <span className="badge badge-success" style={{ fontWeight: '700', padding: '4px 10px' }}>
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <TablePagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        itemName="payments"
                    />
                </div>
            </section>
        </>
    );
};

export default SuperAdminPayments;
