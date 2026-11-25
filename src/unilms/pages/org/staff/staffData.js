// Central Data Store for Academic Staff Directory Module
const STORAGE_KEY_STAFF = 'unilms_staff_members';
const STORAGE_KEY_DUTIES = 'unilms_staff_duties';
const STORAGE_KEY_CERTIFICATES = 'unilms_staff_certificates';
const STORAGE_KEY_CHECKLISTS = 'unilms_staff_checklists';

export const initialStaffMembers = [];
export const initialDuties = [];
export const initialCertificates = [];
export const initialChecklists = [];

export const staffDepartments = [
  'Computer Science & Engineering',
  'Artificial Intelligence & Data Science',
  'Electronics & Communication',
  'Mechanical & Mechatronics',
  'Mathematics & Basic Sciences',
  'Central Library & Resources',
  'Examination Cell'
];

export const staffRoles = [
  'Faculty',
  'Admin',
  'HOD',
  'Professor',
  'Associate Professor',
  'Assistant Professor'
];

// LocalStorage helpers
export const getStoredStaff = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading staff from storage', e);
  }
  return initialStaffMembers;
};

export const saveStoredStaff = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving staff to storage', e);
  }
};

export const getStoredDuties = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DUTIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading duties from storage', e);
  }
  return initialDuties;
};

export const saveStoredDuties = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY_DUTIES, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving duties to storage', e);
  }
};

export const getStoredCertificates = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CERTIFICATES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading certificates from storage', e);
  }
  return initialCertificates;
};

export const saveStoredCertificates = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY_CERTIFICATES, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving certificates to storage', e);
  }
};

export const getStoredChecklists = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHECKLISTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading checklists from storage', e);
  }
  return initialChecklists;
};

export const saveStoredChecklists = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY_CHECKLISTS, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving checklists to storage', e);
  }
};
