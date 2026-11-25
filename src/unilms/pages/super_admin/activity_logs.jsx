import React, { useState, useEffect } from 'react';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../components';
import { superAdminService } from '../../services/superAdmin.service';

const SuperAdminActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const res = await superAdminService.getActivityLogs();
            const formatted = Array.isArray(res) ? res.map(l => ({
                id: l.id,
                created_at: l.createdAt ? new Date(l.createdAt).toLocaleString('en-GB') : '—',
                admin_email: l.user || 'admin@superadmin.com',
                action: l.action || 'System Event',
                details: l.details || '',
                ip_address: l.ipAddress || '127.0.0.1'
            })) : [];
            setLogs(formatted);
        } catch (err) {
            console.error('Could not load activity logs from backend:', err);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const filteredLogs = logs.filter(log => 
        log.admin_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ip_address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const exportCSV = () => {
        if (logs.length === 0) {
            alert('No log entries to export.');
            return;
        }
        const headers = ['Timestamp', 'Admin / User', 'Action', 'Details', 'IP Address'];
        const rows = filteredLogs.map(l => [
            `"${l.created_at}"`,
            `"${l.admin_email}"`,
            `"${l.action.replace(/"/g, '""')}"`,
            `"${l.details.replace(/"/g, '""')}"`,
            `"${l.ip_address}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `unilms_activity_logs_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        paginatedItems: paginatedLogs,
        totalItems
    } = useTablePagination(filteredLogs, 10);

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
                                background: 'linear-gradient(135deg, #64748B, #475569)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                boxShadow: '0 4px 14px rgba(100, 116, 139, 0.3)'
                            }}
                        >
                            <i className="fa-solid fa-clipboard-list"></i>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main, #1e293b)', letterSpacing: '-0.3px' }}>
                                Activity Logs
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                                Immutable audit trail of administrative logins, provisioning events, and security actions from PostgreSQL.
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
                        <span className="badge" style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: 'var(--primary, #6366f1)',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <i className="fa-solid fa-shield-halved"></i> Audit Trail
                        </span>
                    </div>
                </div>

                {/* Dynamic Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '22px' }}>
                    <div className="stat-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Total Audit Entries</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary, #2563EB)', marginTop: '4px' }}>
                            {logs.length}
                        </div>
                    </div>
                    <div className="stat-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Filtered Results</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#16A34A', marginTop: '4px' }}>
                            {filteredLogs.length}
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
                            placeholder="Filter audit log records..."
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
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Date & Time</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Admin</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>Action & Details</th>
                                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #64748b)' }}>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableSkeletonLoader columns={4} rows={pageSize || 5} />
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                        No activity logs found matching your filter.
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', fontSize: '12.5px', color: 'var(--text-muted, #64748b)' }}>
                                            <i className="fa-regular fa-clock me-1"></i> {log.created_at}
                                        </td>
                                        <td style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--text-main, #1e293b)', fontSize: '13.5px' }}>
                                            {log.admin_email}
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ fontWeight: '700', color: 'var(--text-main, #1e293b)', fontSize: '13.5px' }}>
                                                {log.action}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '3px' }}>
                                                {log.details}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '12.5px', color: 'var(--text-muted, #64748b)' }}>
                                            {log.ip_address}
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
                        itemName="activity log entries"
                    />
                </div>
            </section>
        </>
    );
};

export default SuperAdminActivityLogs;
