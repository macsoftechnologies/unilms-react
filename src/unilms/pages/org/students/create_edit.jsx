import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import studentsService from '../../../services/students.service';
import academicsService from '../../../services/academics.service';

const OrgStudentsCreateEdit = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('id');

  const [programsList, setProgramsList] = useState([]);
  const [cohortsList, setCohortsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    roll_number: '',
    first_name: '',
    last_name: '',
    program_id: '',
    cohort_id: '',
    cohort_name: '',
    status: 'Active',
    email: '',
    phone: '',
    password: '',
    parent_name: '',
    parent_phone: '',
    mother_name: '',
    blood_group: 'B+',
    aadhar_number: '',
    emergency_contact: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [progs, chs] = await Promise.all([
          academicsService.getPrograms(),
          academicsService.getCohorts()
        ]);
        setProgramsList(Array.isArray(progs) ? progs : []);
        setCohortsList(Array.isArray(chs) ? chs : []);

        if (editId) {
          const st = await studentsService.getStudentById(editId);
          if (st) {
            setFormData({
              roll_number: st.rollNumber || st.roll_number || '',
              first_name: st.firstName || st.first_name || '',
              last_name: st.lastName || st.last_name || '',
              program_id: st.programId || st.program_id || '',
              cohort_id: st.cohortId || st.cohort_id || '',
              cohort_name: st.cohort?.name || st.cohort_name || '',
              status: st.status || 'Active',
              email: st.email || '',
              phone: st.phone || '',
              password: '',
              parent_name: st.parentName || st.parent_name || '',
              parent_phone: st.parentPhone || st.parent_phone || '',
              mother_name: '',
              blood_group: st.bloodGroup || 'B+',
              aadhar_number: '',
              emergency_contact: '',
              address: st.address || '',
              city: '',
              state: '',
              pincode: ''
            });
          }
        } else {
          const allSt = await studentsService.getStudents();
          const count = (Array.isArray(allSt) ? allSt.length : 0) + 1;
          setFormData(prev => ({
            ...prev,
            roll_number: `26CSE${String(count).padStart(3, '0')}`,
            program_id: progs.length > 0 ? progs[0].id : '',
            cohort_id: chs.length > 0 ? chs[0].id : ''
          }));
        }
      } catch (err) {
        console.error('Load student form error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [editId]);

  const handleProgramChange = (e) => {
    const progId = e.target.value;
    setFormData(prev => ({
      ...prev,
      program_id: progId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roll_number.trim() || !formData.first_name.trim()) return;

    try {
      const payload = {
        rollNumber: formData.roll_number,
        firstName: formData.first_name,
        lastName: formData.last_name,
        programId: formData.program_id || null,
        cohortId: formData.cohort_id || null,
        status: formData.status,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || undefined,
        parentName: formData.parent_name,
        parentPhone: formData.parent_phone,
        bloodGroup: formData.blood_group,
        address: formData.address
      };

      if (editId) {
        await studentsService.updateStudent(editId, payload);
      } else {
        await studentsService.createStudent(payload);
      }

      setSavedSuccess(true);
      setTimeout(() => {
        navigate('/unilms/org/students');
      }, 1200);
    } catch (err) {
      console.error('Save student error:', err);
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  return (
    <section className="view-section active">
      {savedSuccess && (
        <div style={{ background: '#10B981', color: '#fff', padding: '14px 20px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)' }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: '18px' }}></i>
          Student master record saved successfully! Redirecting to directory...
        </div>
      )}

      {/* Top Header Card matching Reference UI (Image 1 & 2) */}
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
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {editId ? 'Edit Student Record' : 'Register New Student (Full Form)'}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
              Enter comprehensive student master academic credentials, portal login, and biographical profile &bull; AY 2026&ndash;2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/unilms/org/students" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', whiteSpace: 'nowrap' }}>
          <i className="fa-solid fa-arrow-left" style={{ color: '#2563EB' }}></i>
          <span>Student Directory</span>
        </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '30px', borderRadius: '14px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        {/* Section 1 */}
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#7c3aed', marginBottom: '20px', borderBottom: '2px solid rgba(124, 58, 237, 0.12)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-id-card"></i> 1. Academic & Identification Information
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Roll Number / Admission No. *</label>
            <input 
              type="text" 
              required
              value={formData.roll_number}
              onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
              className="form-control" 
              placeholder="e.g. 23CSE004"
              style={{ fontWeight: '700', borderRadius: '8px' }} 
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>First Name *</label>
            <input 
              type="text" 
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="form-control" 
              placeholder="First Name" 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Last Name</label>
            <input 
              type="text" 
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="form-control" 
              placeholder="Last Name" 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Program Assignment *</label>
            <select 
              value={formData.program_id}
              onChange={handleProgramChange}
              className="form-control" 
              style={{ borderRadius: '8px' }}
            >
              <option value="">-- Choose Degree Program --</option>
              {programsList.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Cohort / Batch Assignment</label>
            <select 
              value={formData.cohort_id}
              onChange={(e) => {
                const ch = cohortsList.find(c => c.id === e.target.value);
                setFormData({ ...formData, cohort_id: e.target.value, cohort_name: ch?.name || '' });
              }}
              className="form-control" 
              style={{ borderRadius: '8px' }}
            >
              <option value="">-- Select Cohort --</option>
              {cohortsList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Enrollment Status</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="form-control"
              style={{ borderRadius: '8px' }}
            >
              <option value="Active">Active</option>
              <option value="Promoted">Promoted</option>
              <option value="Detained">Detained</option>
              <option value="Graduated">Graduated</option>
              <option value="Dropped">Dropped Out</option>
            </select>
          </div>
        </div>

        {/* Section 2 */}
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#7c3aed', marginBottom: '20px', borderBottom: '2px solid rgba(124, 58, 237, 0.12)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-lock"></i> 2. Portal Login & Contact Details
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Student Email Address *</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-control" 
              placeholder="student@college.edu" 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Student Mobile Number</label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="form-control" 
              placeholder="+91 98765 43210" 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
              {editId ? 'Reset Password (Leave blank to keep current)' : 'Initial Password'}
            </label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="form-control"  
              placeholder="••••••••" 
              style={{ borderRadius: '8px' }}
            />
          </div>
        </div>

        {/* Section 3 */}
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#7c3aed', marginBottom: '20px', borderBottom: '2px solid rgba(124, 58, 237, 0.12)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-users"></i> 3. Guardian & Biographical Information
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Father / Guardian Name</label>
            <input 
              type="text" 
              value={formData.parent_name}
              onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
              className="form-control" 
              placeholder="Father or Guardian Name" 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Parent / Guardian Phone</label>
            <input 
              type="text" 
              value={formData.parent_phone}
              onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
              className="form-control" 
              placeholder="+91 98765 00001" 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Mother Name</label>
            <input 
              type="text" 
              value={formData.mother_name}
              onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
              className="form-control" 
              placeholder="Mother Name" 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Blood Group</label>
            <select 
              value={formData.blood_group}
              onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
              className="form-control"
              style={{ borderRadius: '8px' }}
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Aadhaar / National ID</label>
            <input 
              type="text" 
              value={formData.aadhar_number}
              onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
              className="form-control" 
              placeholder="XXXX XXXX XXXX" 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Emergency Contact</label>
            <input 
              type="text" 
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              className="form-control" 
              placeholder="Emergency Phone" 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Street Address</label>
            <input 
              type="text" 
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="form-control" 
              placeholder="House / Flat No., Street, Area" 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>City</label>
            <input 
              type="text" 
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="form-control" 
              placeholder="City" 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>State</label>
            <input 
              type="text" 
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="form-control" 
              placeholder="State" 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Pincode / Postal Code</label>
            <input 
              type="text" 
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="form-control" 
              placeholder="e.g. 560001" 
              style={{ borderRadius: '8px' }}
            />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Link to="/unilms/org/students" className="btn btn-outline" style={{ borderRadius: '10px', padding: '10px 20px', fontWeight: '600', textDecoration: 'none', color: 'var(--text-primary)' }}>
            Cancel
          </Link>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              padding: '10px 28px', 
              borderRadius: '10px', 
              fontWeight: '700', 
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', 
              border: 'none', 
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)', 
              color: '#fff', 
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="fa-solid fa-floppy-disk"></i> {editId ? 'Update Student Record' : 'Save Student Record'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default OrgStudentsCreateEdit;