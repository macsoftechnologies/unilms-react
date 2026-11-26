import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeletonLoader, TablePagination, useTablePagination } from '../../../../components';
import payrollService from '../../../../services/payroll.service';

const OrgHrPayrollPayslips = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePayslip, setActivePayslip] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getPayslips();
      const list = (Array.isArray(data) ? data : []).map(p => {
        const base = Number(p.basicSalary) || 0;
        const da = Math.round(base * 0.50);
        const hra = Math.round(base * 0.27);
        const pf = Math.round(base * 0.12);
        const tax = Number(p.deductions) || Math.round(base * 0.08);
        const pt = 200;
        const totalEarnings = base + da + hra;
        const totalDeductions = pf + tax + pt;
        const netSalary = Number(p.netSalary) || (totalEarnings - totalDeductions);

        return {
          id: p.id,
          employee_code: p.staff?.employeeCode || '—',
          full_name: `${p.staff?.firstName || ''} ${p.staff?.lastName || ''}`.trim() || 'Staff Member',
          email: p.staff?.email || '—',
          designation_name: p.staff?.designation || 'Staff',
          department_name: p.staff?.department?.name || 'Department',
          base_salary: base,
          da_amount: da,
          hra_amount: hra,
          pf_amount: pf,
          tax_amount: tax,
          pt_amount: pt,
          total_earnings: totalEarnings,
          total_deductions: totalDeductions,
          net_salary: netSalary,
          bank_name: 'State Bank of India',
          bank_account: '••••4912',
          status: p.status === 'PAID' ? 'Disbursed' : 'Draft'
        };
      });
      setEmployees(list);
    } catch (err) {
      console.error('Fetch payslips error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchPayslips();
      }
    }, 30000); // 30s smart background polling
    return () => clearInterval(interval);
  }, [selectedMonth]);

  const filteredEmployees = employees.filter(e =>
    e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedEmployees,
    totalItems
  } = useTablePagination(filteredEmployees, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, setCurrentPage]);

  const totalDisbursed = employees.reduce((acc, curr) => acc + curr.net_salary, 0);
  const totalTax = employees.reduce((acc, curr) => acc + curr.tax_amount, 0);

  return (
    <>
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
                background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(219, 39, 119, 0.3)'
              }}
            >
              <i className="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Monthly Payroll &amp; Payslips
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                Review salary generation, bank disbursements &amp; generate official employee monthly payslips
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link 
              to="/unilms/org/hr/payroll/structures" 
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-network-wired" style={{ color: '#DB2777' }}></i>
              <span>Salary Structures</span>
            </Link>
            <Link 
              to="/unilms/org/staff/directory" 
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(219, 39, 119, 0.25)', whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-users"></i>
              <span>Staff Directory</span>
            </Link>
          </div>
        </div>

        {/* Statistical KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Payroll Employees
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>
                {employees.length} Staff
              </div>
              <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: '600' }}>
                {employees.length > 0 ? 'Dynamic Payroll Sync' : 'No Runs Yet'}
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-users"></i>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Net Disbursement
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                ₹{totalDisbursed.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                For {selectedMonth} Period
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-money-bill-transfer"></i>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                TDS Income Tax Deductions
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>
                ₹{totalTax.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                Calculated on Payouts
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-receipt"></i>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Bank Payout Status
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#7C3AED', marginTop: '4px' }}>
                {employees.filter(e => e.status === 'Disbursed').length} / {employees.length}
              </div>
              <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px', fontWeight: '600' }}>
                NEFT / RTGS Batches
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-building-columns"></i>
            </div>
          </div>

        </div>

        {/* Filter and Period Selection */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', background: '#fff' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '4px' }}>
                  Payroll Month Cycle
                </label>
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="form-control" 
                  style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }} 
                />
              </div>
              <div style={{ minWidth: '260px', marginTop: '18px' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control" 
                  placeholder="Search staff name or code..." 
                  style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: '0' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Emp. Code</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee Name</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department &amp; Role</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gross Earnings</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Pay</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Disbursement</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader columns={7} rows={pageSize || 5} />
                ) : paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted, #64748b)' }}>
                      <i className="fa-solid fa-file-invoice-dollar" style={{ fontSize: '26px', marginBottom: '8px', display: 'block', opacity: 0.4 }}></i>
                      No payslip records found in database.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((e) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontWeight: '700', fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                          {e.employee_code}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <strong style={{ color: '#1E293B' }}>{e.full_name}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>{e.email}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: '600', color: '#334155' }}>{e.designation_name}</div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>{e.department_name}</span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#10B981', fontWeight: '700' }}>
                        ₹{e.total_earnings.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <strong style={{ color: '#4F46E5', fontSize: '14.5px' }}>
                          ₹{e.net_salary.toLocaleString('en-IN')}
                        </strong>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div>{e.bank_name}</div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>A/C: {e.bank_account}</span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button 
                          type="button"
                          className="btn btn-outline" 
                          style={{ padding: '6px 14px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }} 
                          onClick={() => setActivePayslip(e)}
                        >
                          <i className="fa-solid fa-file-invoice me-1" style={{ color: '#4F46E5' }}></i> View Payslip
                        </button>
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
            itemName="payslips"
          />
        </div>

        {/* Payslip Detail Modal */}
        {activePayslip && (
          <div 
            className="drawer-overlay" 
            style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(15, 23, 42, 0.65)', 
              backdropFilter: 'blur(4px)',
              zIndex: 99999, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setActivePayslip(null)}
          >
            <div 
              style={{ background: '#fff', borderRadius: '16px', maxWidth: '580px', width: '100%', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: '16px', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#1E293B', fontWeight: '800' }}>SALARY PAYSLIP</h3>
                  <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>Period: {selectedMonth}</div>
                </div>
                <button type="button" onClick={() => setActivePayslip(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748B', lineHeight: 1 }}>
                  &times;
                </button>
              </div>

              <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: '10px', marginBottom: '18px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B' }}>Employee Name:</span>
                  <strong style={{ color: '#4F46E5' }}>{activePayslip.full_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B' }}>Employee Code:</span>
                  <strong>{activePayslip.employee_code}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Department &amp; Role:</span>
                  <strong>{activePayslip.designation_name} &bull; {activePayslip.department_name}</strong>
                </div>
              </div>

              <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '18px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: '8px 0', color: '#64748B' }}>Earnings</th>
                      <th style={{ textAlign: 'right', padding: '8px 0', color: '#64748B' }}>Amount (₹)</th>
                      <th style={{ textAlign: 'left', padding: '8px 0 8px 16px', color: '#64748B' }}>Deductions</th>
                      <th style={{ textAlign: 'right', padding: '8px 0', color: '#64748B' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 0' }}>Basic Pay</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{activePayslip.base_salary.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px 0 8px 16px' }}>Provident Fund (PF)</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{activePayslip.pf_amount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 0' }}>Dearness Allowance (DA)</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{activePayslip.da_amount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px 0 8px 16px' }}>Professional Tax (PT)</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{activePayslip.pt_amount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px 0' }}>HRA Allowance</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{activePayslip.hra_amount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px 0 8px 16px' }}>TDS / Income Tax</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{activePayslip.tax_amount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ fontWeight: '700', borderBottom: '2px solid #E2E8F0' }}>
                      <td style={{ padding: '10px 0' }}>Total Earnings</td>
                      <td style={{ textAlign: 'right', color: '#10B981' }}>₹{activePayslip.total_earnings.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 0 10px 16px' }}>Total Deductions</td>
                      <td style={{ textAlign: 'right', color: '#EF4444' }}>₹{activePayslip.total_deductions.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ background: '#EEF2FF', fontWeight: '800', fontSize: '15px' }}>
                      <td colSpan="2" style={{ padding: '12px', color: '#1E293B' }}>NET TAKE-HOME SALARY</td>
                      <td colSpan="2" style={{ textAlign: 'right', padding: '12px', color: '#4F46E5', fontSize: '16px' }}>
                        ₹{activePayslip.net_salary.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setActivePayslip(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => window.print()}
                  style={{ padding: '8px 18px', borderRadius: '8px', background: '#4F46E5', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <i className="fa-solid fa-print"></i> Print Payslip
                </button>
              </div>
            </div>
          </div>
        )}

      </section>
    </>
  );
};

export default OrgHrPayrollPayslips;
