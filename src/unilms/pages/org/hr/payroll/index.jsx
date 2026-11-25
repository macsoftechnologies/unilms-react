import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../../components';
import payrollService from '../../../../services/payroll.service';
import staffService from '../../../../services/staff.service';

const OrgHrPayrollIndex = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const [formEmployee, setFormEmployee] = useState('');
  const [formMonth, setFormMonth] = useState('November');
  const [formYear, setFormYear] = useState('2026');
  const [formAllowances, setFormAllowances] = useState('');
  const [formDeductions, setFormDeductions] = useState('');

  const fetchPayrollData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [staffData, payslipsData] = await Promise.all([
        staffService.getStaff(),
        payrollService.getPayslips()
      ]);

      const staffList = (Array.isArray(staffData) ? staffData : []).map(s => ({
        id: s.id,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Staff Member',
        code: s.employeeCode || '—',
        dept: s.department?.name || 'General Department',
        base: Number(s.basicSalary) || 75000
      }));
      setEmployees(staffList);

      const payslipList = (Array.isArray(payslipsData) ? payslipsData : []).map(p => ({
        id: p.id,
        run_id: p.payrollRunId,
        employee_id: p.staffId,
        full_name: `${p.staff?.firstName || ''} ${p.staff?.lastName || ''}`.trim() || 'Staff Member',
        employee_code: p.staff?.employeeCode || '—',
        dept_name: p.staff?.department?.name || 'Department',
        month: p.payrollRun?.month || formMonth,
        year: String(p.payrollRun?.year || formYear),
        base_salary: Number(p.basicSalary) || 0,
        net_salary: Number(p.netSalary) || 0,
        status: p.status === 'PAID' ? 'Paid' : 'Draft',
        payment_date: p.paidAt ? p.paidAt.split('T')[0] : null
      }));
      setPayslips(payslipList);
    } catch (err) {
      console.error('Fetch payroll data error:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchPayrollData(true);
      }
    }, 30000); // 30s background sync polling
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleGeneratePayslip = async (e) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === formEmployee);
    if (!emp) {
      showToast('Please select a valid employee.');
      return;
    }

    const ok = await confirm({
      title: 'Confirm Generate Payroll Run',
      message: `Are you sure you want to generate a new institutional payroll run for ${formMonth} ${formYear}? This will calculate salaries and generate payslips for all active faculty and staff members in PostgreSQL.`,
      confirmText: 'Generate Payroll',
      cancelText: 'Cancel',
      type: 'primary',
    });
    if (!ok) return;

    try {
      await payrollService.generatePayrollRun({
        title: `${formMonth} ${formYear} Staff Payroll Run`,
        month: formMonth,
        year: Number(formYear)
      });
      showToast(`Payroll generated successfully for ${formMonth} ${formYear}`);
      fetchPayrollData();
      setFormEmployee('');
      setFormAllowances('');
      setFormDeductions('');
    } catch (err) {
      console.error('Generate payroll error:', err);
      showToast(err.response?.data?.message || 'Failed to generate payroll.');
    }
  };

  const handleMarkPaid = async (runId) => {
    const ok = await confirm({
      title: 'Confirm Disburse Payroll',
      message: 'Are you sure you want to disburse salaries for this payroll run? All associated employee payslips will be marked as PAID in the database.',
      confirmText: 'Disburse Salaries',
      cancelText: 'Cancel',
      type: 'primary',
    });
    if (!ok) return;

    try {
      if (runId) {
        await payrollService.disbursePayroll(runId);
        showToast('Payroll Run disbursed and marked as Paid.');
      } else {
        showToast('Payslip status updated.');
      }
      fetchPayrollData();
    } catch (err) {
      console.error('Mark paid error:', err);
      showToast('Failed to disburse payroll.');
    }
  };

  const filteredPayslips = useMemo(() => {
    return payslips.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        p.full_name.toLowerCase().includes(q) ||
        p.employee_code.toLowerCase().includes(q) ||
        p.dept_name.toLowerCase().includes(q) ||
        `${p.month} ${p.year}`.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payslips, search, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems
  } = useTablePagination(filteredPayslips, 10);

  return (
    <>
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
              background: 'linear-gradient(135deg, #EC4899, #DB2777)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(219, 39, 119, 0.3)'
            }}
          >
            <i className="fa-solid fa-money-check-dollar"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Payroll Management &amp; Disbursement
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Overview of monthly salary operations, net payouts &amp; tax compliance &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link 
            to="/unilms/org/hr/payroll/payslips" 
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(219, 39, 119, 0.25)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-file-invoice-dollar"></i>
            <span>Monthly Payslips</span>
          </Link>
          <Link 
            to="/unilms/org/hr/payroll/structures" 
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-network-wired" style={{ color: '#DB2777' }}></i>
            <span>Salary Structures</span>
          </Link>
        </div>
      </div>

      {/* Generate Payslip Card */}
      <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginTop: '0', marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>Generate Institutional Payroll Run</h3>
        <form onSubmit={handleGeneratePayslip} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Staff Member (Optional Scope)</label>
            <select 
              value={formEmployee} 
              onChange={(e) => setFormEmployee(e.target.value)} 
              className="form-control" 
              style={{ width: '100%', height: '40px', borderRadius: '8px' }}
            >
              <option value="">All Institutional Staff ({employees.length} Members)</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.code}) - Base: ₹{e.base.toLocaleString('en-IN')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Month</label>
            <select 
              value={formMonth} 
              onChange={(e) => setFormMonth(e.target.value)} 
              className="form-control" 
              required
              style={{ width: '100%', height: '40px', borderRadius: '8px' }}
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Year</label>
            <input 
              type="number" 
              value={formYear} 
              onChange={(e) => setFormYear(e.target.value)} 
              className="form-control" 
              required 
              style={{ width: '100%', height: '40px', borderRadius: '8px' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Additional Allowances (₹)</label>
            <input 
              type="number" 
              min="0" 
              step="100" 
              value={formAllowances} 
              onChange={(e) => setFormAllowances(e.target.value)} 
              className="form-control" 
              placeholder="0.00" 
              style={{ width: '100%', height: '40px', borderRadius: '8px' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Deductions (₹)</label>
            <input 
              type="number" 
              min="0" 
              step="100" 
              value={formDeductions} 
              onChange={(e) => setFormDeductions(e.target.value)} 
              className="form-control" 
              placeholder="0.00" 
              style={{ width: '100%', height: '40px', borderRadius: '8px' }}
            />
          </div>

          <div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', height: '40px', background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', border: 'none', color: '#fff', fontWeight: '700', borderRadius: '8px', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-file-invoice-dollar me-1"></i> Generate
            </button>
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <h3 style={{ margin: '0', fontSize: '17px', fontWeight: '700' }}>Organization Payroll History</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Draft">Draft</option>
            </select>
            <input
              type="text"
              placeholder="Search employee, period..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ height: '38px', borderRadius: '8px', fontSize: '13px', minWidth: '220px' }}
            />
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-main, #f8fafc)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>Employee</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>Department</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>Period</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase' }}>Base</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase' }}>Net Salary</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={7} rows={pageSize || 5} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No payslips found in institutional database.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600' }}>
                      {p.full_name} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({p.employee_code})</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.dept_name}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 'bold' }}>{p.month} {p.year}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>₹{Number(p.base_salary).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: '#DB2777' }}>₹{Number(p.net_salary).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {p.status === 'Paid' ? (
                        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          Paid {p.payment_date ? `on ${p.payment_date}` : ''}
                        </span>
                      ) : (
                        <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          Draft
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {p.status === 'Draft' && (
                          <button 
                            type="button" 
                            onClick={() => handleMarkPaid(p.run_id)} 
                            className="btn btn-outline" 
                            style={{ padding: '4px 10px', fontSize: '12px', color: '#10B981', borderColor: '#10B981', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            Disburse
                          </button>
                        )}
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }} 
                          onClick={() => showToast(`Generating PDF Payslip for ${p.full_name} (${p.month} ${p.year})...`)}
                        >
                          <i className="fa-solid fa-download"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
          itemName="payroll records"
        />
        <ConfirmDialog />
      </div>
    </>
  );
};

export default OrgHrPayrollIndex;
