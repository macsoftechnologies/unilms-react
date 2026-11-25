import React, { useState, useMemo, useEffect } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { TableSkeletonLoader, TablePagination, useTablePagination, useConfirmDialog } from '../../../components';
import staffService from '../../../services/staff.service';

const OrgStaffCertificates = () => {
  const { currentTenant } = useTenant();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [certificates, setCertificates] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewCert, setPreviewCert] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    staff_id: '',
    certificate_type: 'Experience Certificate',
    issue_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [certsData, staffData] = await Promise.all([
        staffService.getCertificates(),
        staffService.getStaff()
      ]);

      const staffNormalized = (Array.isArray(staffData) ? staffData : []).map(s => ({
        id: s.id,
        full_name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Staff Member',
        employee_code: s.employeeCode || '—',
        designation: s.designation || 'Faculty'
      }));
      setStaffList(staffNormalized);

      const normalizedCerts = (Array.isArray(certsData) ? certsData : []).map(c => ({
        id: c.id,
        staff_id: c.staffId || c.staff?.id,
        staff_name: c.staff ? `${c.staff.firstName} ${c.staff.lastName || ''}`.trim() : (c.staff_name || 'Staff Member'),
        designation: c.staff?.designation || 'Faculty Member',
        certificate_type: c.certificateType || c.certificate_type || 'Experience Certificate',
        issue_date: c.issueDate ? c.issueDate.split('T')[0] : (c.issue_date || new Date().toISOString().split('T')[0]),
        signatory: c.signatory || 'Registrar & Authorized Signatory',
        status: c.status || 'Issued',
        remarks: c.remarks || ''
      }));
      setCertificates(normalizedCerts);

      if (staffNormalized.length > 0 && !formData.staff_id) {
        setFormData(prev => ({ ...prev, staff_id: staffNormalized[0].id }));
      }
    } catch (err) {
      console.error('Fetch certificates error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchData();
      }
    }, 30000); // 30s smart background polling
    return () => clearInterval(interval);
  }, []);

  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (c.staff_name && c.staff_name.toLowerCase().includes(q)) ||
        (c.certificate_type && c.certificate_type.toLowerCase().includes(q));

      const matchesType = typeFilter === 'All' || c.certificate_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [certificates, searchQuery, typeFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedCertificates,
    totalItems
  } = useTablePagination(filteredCertificates, 10);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter, setCurrentPage]);

  const handleOpenAddModal = () => {
    setFormData({
      id: '',
      staff_id: staffList[0]?.id || '',
      certificate_type: 'Experience Certificate',
      issue_date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const assignedStaff = staffList.find(s => s.id === formData.staff_id) || staffList[0];

    const ok = await confirm({
      title: 'Confirm Issue Certificate',
      message: `Are you sure you want to generate and issue an official ${formData.certificate_type} for ${assignedStaff?.full_name}? This will be archived in the institution's registry.`,
      confirmText: 'Issue Certificate',
      cancelText: 'Cancel',
      type: 'primary',
    });
    if (!ok) return;

    try {
      await staffService.createCertificate({
        staffId: formData.staff_id,
        certificateType: formData.certificate_type,
        issueDate: formData.issue_date,
        signatory: 'Registrar & Authorized Signatory'
      });

      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Issue certificate error:', err);
      alert('Failed to issue certificate');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Confirm Delete Certificate',
      message: 'Are you sure you want to permanently delete this certificate record from the institutional archives?',
      confirmText: 'Delete Certificate',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await staffService.deleteCertificate(id);
      fetchData();
    } catch (err) {
      console.error('Delete certificate error:', err);
      alert('Failed to delete certificate');
    }
  };

  return (
    <div className="staff-certificates-view">
      {/* Banner */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: '#F5F3FF', color: '#7C3AED', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            <i className="fa-solid fa-certificate"></i> Faculty Credentials & Attestations
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Staff Certificates
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Generate, attest, and archive institutional service certificates, experience letters, and NOCs.
          </p>
        </div>
        <div>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAddModal}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              background: '#7C3AED',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="fa-solid fa-plus"></i> Issue Certificate
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Issued</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '4px 0' }}>{certificates.length}</div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Attested documents</span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Experience Certificates</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', margin: '4px 0' }}>
            {certificates.filter(c => c.certificate_type.includes('Experience')).length}
          </div>
          <span style={{ fontSize: '12px', color: '#2563eb' }}>Service tenures</span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>NOC Letters</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed', margin: '4px 0' }}>
            {certificates.filter(c => c.certificate_type.includes('NOC') || c.certificate_type.includes('No Objection')).length}
          </div>
          <span style={{ fontSize: '12px', color: '#7c3aed' }}>Higher studies / Passports</span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Service & Relieving</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', margin: '4px 0' }}>
            {certificates.filter(c => c.certificate_type.includes('Service') || c.certificate_type.includes('Relieving')).length}
          </div>
          <span style={{ fontSize: '12px', color: '#16a34a' }}>Institutional clearance</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
            <input 
              type="text"
              placeholder="Search by faculty name or certificate type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{
                paddingLeft: '36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                width: '100%'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Certificate Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-control"
            style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', padding: '6px 12px' }}
          >
            <option value="All">All Types</option>
            <option value="Experience Certificate">Experience Certificate</option>
            <option value="No Objection Certificate (NOC)">No Objection Certificate (NOC)</option>
            <option value="Relieving Letter">Relieving Letter</option>
            <option value="Service Certificate">Service Certificate</option>
          </select>
        </div>
      </div>

      {/* Table matching php_source/app/Views/org/staff/certificates.php */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff Name</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Certificate Type</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Issue Date</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader columns={4} rows={pageSize || 5} />
              ) : paginatedCertificates.length > 0 ? (
                paginatedCertificates.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <strong style={{ color: '#1E293B', fontSize: '14px' }}>{c.staff_name}</strong>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: '#F5F3FF',
                        color: '#7C3AED',
                        fontSize: '12.5px',
                        fontWeight: '700'
                      }}>
                        {c.certificate_type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13.5px', color: '#334155' }}>
                      {c.issue_date}
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewCert(c)}
                          className="btn btn-outline"
                          style={{
                            padding: '5px 12px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#dc2626',
                            borderColor: '#fca5a5',
                            fontWeight: '600'
                          }}
                        >
                          <i className="fa-solid fa-file-pdf me-1"></i> Preview PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="btn btn-outline"
                          style={{
                            padding: '5px 10px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#ef4444',
                            borderColor: '#fca5a5'
                          }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    <i className="fa-solid fa-file-circle-xmark" style={{ fontSize: '32px', color: '#cbd5e1', display: 'block', marginBottom: '10px' }}></i>
                    No staff certificates found.
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
          itemName="staff certificates"
        />
      </div>

      {/* Modal matching php_source/app/Views/org/staff/certificates.php */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '520px',
            maxWidth: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                  Issue Official Certificate
                </h3>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ padding: '24px' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Select Staff *
                  </label>
                  <select
                    name="staff_id"
                    required
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  >
                    {staffList.map((sl) => (
                      <option key={sl.id} value={sl.id}>
                        {sl.full_name} ({sl.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Certificate Type *
                  </label>
                  <select
                    name="certificate_type"
                    required
                    value={formData.certificate_type}
                    onChange={(e) => setFormData({ ...formData, certificate_type: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  >
                    <option value="Experience Certificate">Experience Certificate</option>
                    <option value="No Objection Certificate (NOC)">No Objection Certificate (NOC)</option>
                    <option value="Relieving Letter">Relieving Letter</option>
                    <option value="Service Certificate">Service Certificate</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Issue Date *
                  </label>
                  <input 
                    type="date"
                    name="issue_date"
                    required
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseModal}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13.5px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '8px 22px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13.5px',
                    background: '#7C3AED',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                  }}
                >
                  Generate Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Certificate PDF Preview Modal */}
      {previewCert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1060,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '680px',
            maxWidth: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '40px', background: '#ffffff', position: 'relative' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #7C3AED', paddingBottom: '20px', marginBottom: '28px' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', letterSpacing: '0.5px' }}>
                  {currentTenant?.name?.toUpperCase() || 'INSTITUTION OF TECHNOLOGY'}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  Affiliated to State University • AICTE Approved • ISO 9001:2015 Certified
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  Campus: Knowledge City, Sector 12, Academic Hub
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{
                  display: 'inline-block',
                  borderBottom: '2px solid #334155',
                  paddingBottom: '4px',
                  fontSize: '18px',
                  fontWeight: '800',
                  color: '#1E293B',
                  textTransform: 'uppercase'
                }}>
                  {previewCert.certificate_type}
                </span>
              </div>

              <div style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155', marginBottom: '40px' }}>
                <p>
                  This is to certify that <strong>{previewCert.staff_name}</strong> is a bona fide faculty member / employee of our organization.
                </p>
                <p>
                  During their tenure with us, they have demonstrated exceptional dedication, academic leadership, and integrity in their instructional duties.
                </p>
                <p style={{ marginTop: '20px' }}>
                  <strong>Certificate Issue Date:</strong> {previewCert.issue_date}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Document Ref: AIT/CERT/{previewCert.id}/2026</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>System Generated Verification Token</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '140px', borderBottom: '1px solid #334155', marginBottom: '6px' }}></div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>Registrar Office</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Authorized Signatory</div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPreviewCert(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{
                  padding: '8px 22px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  background: '#7C3AED',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fa-solid fa-print"></i> Print Document
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
};

export default OrgStaffCertificates;