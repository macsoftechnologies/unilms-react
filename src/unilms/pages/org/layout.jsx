import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';
import { facultyService } from '../../services/faculty.service';
import apiClient from '../../services/api';

const themeGradients = {
  purple: {
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    sidebarBg: 'radial-gradient(ellipse 130% 50% at 15% 0%, #7C3AED 0%, #6D28D9 40%, transparent 80%), radial-gradient(ellipse 80% 40% at 100% 30%, rgba(192, 132, 252, 0.28) 0%, transparent 70%), linear-gradient(180deg, #4C1D95 0%, #2E1065 35%, #170A38 70%, #0D0520 100%)',
    waveBg: 'linear-gradient(160deg, rgba(124, 58, 237, 0.55) 0%, rgba(192, 132, 252, 0.25) 65%, transparent 100%)'
  },
  blue: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    sidebarBg: 'radial-gradient(ellipse 130% 50% at 15% 0%, #2563EB 0%, #1D4ED8 40%, transparent 80%), radial-gradient(ellipse 80% 40% at 100% 30%, rgba(6, 182, 212, 0.28) 0%, transparent 70%), linear-gradient(180deg, #1E3A8A 0%, #132252 35%, #0B1437 70%, #070D24 100%)',
    waveBg: 'linear-gradient(160deg, rgba(37, 99, 235, 0.55) 0%, rgba(6, 182, 212, 0.25) 65%, transparent 100%)'
  },
  emerald: {
    primary: '#059669',
    primaryHover: '#047857',
    sidebarBg: 'radial-gradient(ellipse 130% 50% at 15% 0%, #059669 0%, #047857 40%, transparent 80%), radial-gradient(ellipse 80% 40% at 100% 30%, rgba(52, 211, 153, 0.28) 0%, transparent 70%), linear-gradient(180deg, #064E3B 0%, #022C22 35%, #061A14 70%, #020D0A 100%)',
    waveBg: 'linear-gradient(160deg, rgba(5, 150, 105, 0.55) 0%, rgba(52, 211, 153, 0.25) 65%, transparent 100%)'
  },
  amber: {
    primary: '#D97706',
    primaryHover: '#B45309',
    sidebarBg: 'radial-gradient(ellipse 130% 50% at 15% 0%, #D97706 0%, #B45309 40%, transparent 80%), radial-gradient(ellipse 80% 40% at 100% 30%, rgba(251, 191, 36, 0.28) 0%, transparent 70%), linear-gradient(180deg, #78350F 0%, #451A03 35%, #240E02 70%, #140701 100%)',
    waveBg: 'linear-gradient(160deg, rgba(217, 119, 6, 0.55) 0%, rgba(251, 191, 36, 0.25) 65%, transparent 100%)'
  },
  rose: {
    primary: '#E11D48',
    primaryHover: '#BE123C',
    sidebarBg: 'radial-gradient(ellipse 130% 50% at 15% 0%, #E11D48 0%, #BE123C 40%, transparent 80%), radial-gradient(ellipse 80% 40% at 100% 30%, rgba(251, 113, 133, 0.28) 0%, transparent 70%), linear-gradient(180deg, #881337 0%, #4C0519 35%, #26020C 70%, #140106 100%)',
    waveBg: 'linear-gradient(160deg, rgba(225, 29, 72, 0.55) 0%, rgba(251, 113, 133, 0.25) 65%, transparent 100%)'
  },
  teal: {
    primary: '#0D9488',
    primaryHover: '#0F766E',
    sidebarBg: 'radial-gradient(ellipse 130% 50% at 15% 0%, #0D9488 0%, #0F766E 40%, transparent 80%), radial-gradient(ellipse 80% 40% at 100% 30%, rgba(45, 212, 191, 0.28) 0%, transparent 70%), linear-gradient(180deg, #134E4A 0%, #042F2E 35%, #021C1C 70%, #010F0F 100%)',
    waveBg: 'linear-gradient(160deg, rgba(13, 148, 136, 0.55) 0%, rgba(45, 212, 191, 0.25) 65%, transparent 100%)'
  }
};

const OrgLayout = () => {
  const { currentTenant } = useTenant();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('org_theme_color') || 'purple');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('org_theme_mode') === 'dark');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const currentUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('unilms_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...(user || {}), ...parsed };
      }
    } catch { }
    return user || null;
  }, [user, location.pathname]);

  const userRole = (currentUser?.role || localStorage.getItem('org_user_role') || 'admin').toLowerCase();
  const isFaculty = path.startsWith('/unilms/faculty') || path.startsWith('/faculty') || userRole === 'faculty';
  const [currPersona, setCurrPersona] = useState(() => localStorage.getItem('faculty_persona') || 'faculty');

  // Dynamic Verified Faculty Privileges (isClassTeacher, isHOD)
  const [privileges, setPrivileges] = useState(() => {
    try {
      const cached = localStorage.getItem('unilms_privileges');
      if (cached) return JSON.parse(cached);
    } catch { }
    return {
      isFaculty: isFaculty,
      isClassTeacher: false,
      isHOD: false,
      designation: '',
      department: '',
      assignedSections: []
    };
  });

  // Notifications State & Real-Time Sync
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  // Fetch verified privileges from backend for faculty
  useEffect(() => {
    if (isFaculty) {
      const fetchPrivs = async () => {
        try {
          const res = await facultyService.getPrivileges({
            email: currentUser?.email || localStorage.getItem('org_user_email'),
            staffId: currentUser?.id
          });
          const privData = (res && res.isFaculty !== undefined) ? res : (res?.data || res);
          if (privData && privData.isFaculty !== undefined) {
            setPrivileges(privData);
            localStorage.setItem('unilms_privileges', JSON.stringify(privData));
            const currentP = localStorage.getItem('faculty_persona') || 'faculty';
            if (currentP === 'hod' && !privData.isHOD) {
              setCurrPersona('faculty');
              localStorage.setItem('faculty_persona', 'faculty');
            } else if (currentP === 'class_teacher' && !privData.isClassTeacher) {
              setCurrPersona('faculty');
              localStorage.setItem('faculty_persona', 'faculty');
            }
          }
        } catch (err) {
          console.warn('Could not load faculty privileges:', err);
        }
      };
      fetchPrivs();
    }
  }, [isFaculty, currentUser]);

  // Fetch in-app notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await apiClient.get('/notifications');
        const list = res.data || [];
        setNotificationsList(list);
        setUnreadCount(list.filter((n) => !n.isRead).length);
      } catch (err) {
        setNotificationsList([]);
        setUnreadCount(0);
      }
    };
    fetchNotifs();
  }, []);

  const handleMarkAllNotificationsRead = async () => {
    try {
      await apiClient.patch('/notifications/mark-all-read');
    } catch { }
    setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  // Immediate Session & Route Protection Guard (Prevents back-button access after sign out)
  useEffect(() => {
    const storedToken = localStorage.getItem('unilms_access_token');
    const storedUser = localStorage.getItem('unilms_user');
    if (!storedToken || !storedUser) {
      navigate(isFaculty ? '/unilms/faculty/login' : '/unilms/org/login', { replace: true });
    }
  }, [location.pathname, isFaculty, navigate]);

  useEffect(() => {
    const syncPersona = () => {
      const p = localStorage.getItem('faculty_persona') || 'faculty';
      setCurrPersona(p);
    };
    window.addEventListener('faculty_persona_changed', syncPersona);
    return () => window.removeEventListener('faculty_persona_changed', syncPersona);
  }, []);

  // Automatically close mobile sidebar when path changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [path]);

  // Lock body scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.classList.add('mobile-sidebar-open');
    } else {
      document.body.classList.remove('mobile-sidebar-open');
    }
    return () => {
      document.body.classList.remove('mobile-sidebar-open');
    };
  }, [isMobileSidebarOpen]);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileSidebarOpen(false);
        setShowPalette(false);
        setShowUserDropdown(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSwitchPersona = (p) => {
    if (p === 'class_teacher' && !privileges.isClassTeacher) {
      return;
    }
    if (p === 'hod' && !privileges.isHOD) {
      return;
    }
    setCurrPersona(p);
    localStorage.setItem('faculty_persona', p);
    window.dispatchEvent(new Event('faculty_persona_changed'));
  };

  const paletteRef = useRef(null);
  const userDropdownRef = useRef(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMoreModules, setShowMoreModules] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 70, right: 20 });
  const modulesCardRef = useRef(null);
  const moreModulesRef = useRef(null);
  const moreDropdownRef = useRef(null);

  const handleToggleMoreModules = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!showMoreModules && moreModulesRef.current) {
      const rect = moreModulesRef.current.getBoundingClientRect();
      const rightOffset = Math.max(16, window.innerWidth - rect.right);
      setDropdownPos({
        top: Math.round(rect.bottom + 8),
        right: Math.round(rightOffset)
      });
    }
    setShowMoreModules(prev => !prev);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setShowPalette(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (moreModulesRef.current && !moreModulesRef.current.contains(e.target) &&
          (!moreDropdownRef.current || !moreDropdownRef.current.contains(e.target))) {
        setShowMoreModules(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync theme and dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.body.setAttribute('data-theme', activeTheme);
    localStorage.setItem('org_theme_color', activeTheme);

    const t = themeGradients[activeTheme] || themeGradients.purple;
    let styleTag = document.getElementById('dynamic-theme-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-theme-style';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `
      :root, html, body {
        --primary: ${t.primary} !important;
        --primary-hover: ${t.primaryHover} !important;
      }
      .sidebar {
        background: ${t.sidebarBg} !important;
      }
      .sidebar::before {
        background: ${t.waveBg} !important;
      }
      .nav-item.active {
        background: #FFFFFF !important;
        color: ${t.primary} !important;
        border-radius: 10px !important;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16) !important;
      }
      .nav-item.active i,
      .nav-item.active span {
        color: ${t.primary} !important;
        opacity: 1 !important;
      }
      .btn-primary {
        background: ${t.primary} !important;
        color: #ffffff !important;
      }
    `;
  }, [activeTheme]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      localStorage.setItem('org_theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('org_theme_mode', 'light');
    }
  }, [darkMode]);

  // Determine active module
  let activeModule = 'admissions';
  if (path.includes('/org/admissions')) {
    activeModule = 'admissions';
  } else if (
    path.includes('/org/academics') ||
    path.includes('/org/faculty') ||
    path.includes('/org/attendance') ||
    path.includes('/org/obe') ||
    path.includes('/org/marks') ||
    path.includes('/org/timetable') ||
    path.includes('/org/students') ||
    path.includes('/org/materials') ||
    path.includes('/org/assessments') ||
    path.includes('/org/assignments') ||
    path.includes('/org/quizzes')
  ) {
    activeModule = 'academics';
  } else if (path.includes('/org/examinations')) {
    activeModule = 'examinations';
  } else if (path.includes('/org/fees')) {
    activeModule = 'fees';
  } else if (path.includes('/org/hr') || path.includes('/org/payroll')) {
    activeModule = 'hr';
  } else if (path.includes('/org/accounts')) {
    activeModule = 'accounts';
  } else if (path.includes('/org/placements') || path.includes('/org/internships')) {
    activeModule = 'placements';
  } else if (path.includes('/org/transport')) {
    activeModule = 'transport';
  } else if (path.includes('/org/library')) {
    activeModule = 'library';
  } else if (path.includes('/org/staff')) {
    activeModule = 'staff';
  } else if (path.includes('/org/correspondence')) {
    activeModule = 'correspondence';
  } else if (path.includes('/org/front_office') || path.includes('/org/front-office')) {
    activeModule = 'front_office';
  } else if (path.includes('/org/hostel')) {
    activeModule = 'hostel';
  } else if (path.includes('/org/administration')) {
    activeModule = 'administration';
  } else if (path.includes('/org/lms')) {
    activeModule = 'lms';
  } else if (path.includes('/org/mis')) {
    activeModule = 'mis';
  } else if (path.includes('/org/systems')) {
    activeModule = 'systems';
  }

  // Determine dynamic page title
  const getPageTitle = () => {
    if (path.includes('/faculty/dashboard') || path.includes('/org/faculty_dashboard')) return 'Faculty Academic Workbench';
    if (path.includes('/allocations')) return 'Subject & Faculty Allocations';
    if (path.includes('/faculty/class_teacher_monitor')) return 'Class Teacher Cohort Monitor';
    if (path.includes('/faculty/subjects')) return 'Course Subjects Directory';
    if (path.includes('/attendance')) return 'Attendance Management';
    if (path.includes('/assignments')) return 'Assignments & Tasks';
    if (path.includes('/faculty/marks')) return 'Faculty Marks Entry';
    if (path.includes('/faculty/timetable')) return 'Weekly Teaching Timetable';
    if (path.includes('/faculty/po_setup') || path.includes('/faculty/po-setup')) return 'POs & PSOs Setup';
    if (path.includes('/faculty/co_po_matrix')) return 'CO-PO Articulation Matrix';
    if (path.includes('/faculty/attainment')) return 'OBE Attainment Report';
    if (path.includes('/faculty/leaves')) return 'Faculty Leave Management';
    if (path.includes('/admissions/joining_analytics') || path.includes('/admissions/joining-analytics') || path.includes('/admissions/funnel')) return 'Admission ➔ Joining Analytics & Funnel';
    if (path.includes('/academics/student_analysis') || path.includes('/academics/student-analysis') || path.includes('/students/analysis')) return 'Student 360° Analysis & Early Warning';
    if (path.includes('/mis/dashboard') || path === '/unilms/org/mis') return 'Institutional MIS & Executive Cockpit';
    if (path.includes('/mis/reports')) return 'Central MIS Reports & Compliance';
    if (path.includes('/admissions/dashboard')) return 'Admissions Dashboard';
    if (path.includes('/admissions/leads')) return 'Leads (CRM)';
    if (path.includes('/admissions/applications')) return 'Applications';
    if (path.includes('/admissions/documents')) return 'Verification';
    if (path.includes('/admissions/offers')) return 'Offers';
    if (path.includes('/admissions/offer_letter_pdf')) return 'Offer Letter PDF';
    if (path.includes('/admissions/payments')) return 'Payments';
    if (path.includes('/admissions/enrollment')) return 'Enrollment';
    if (path.includes('/admissions/college_strength')) return 'College Strength';
    if (path.includes('/admissions/categories')) return 'Categories/Castes';
    if (path.includes('/admissions/scholarships')) return 'Scholarships';
    if (path.includes('/admissions/detained')) return 'Detained Students';

    if (path.includes('/academics/dashboard')) return 'Academics Dashboard';
    if (path.includes('/academics/departments')) return 'Academic Departments';
    if (path.includes('/academics/programs')) return 'Degree Programs';
    if (path.includes('/academics/regulations')) return 'Academic Regulations';
    if (path.includes('/academics/academic_years')) return 'Academic Years';
    if (path.includes('/academics/semesters')) return 'Semesters Setup';
    if (path.includes('/academics/cohorts')) return 'Batches & Cohorts';
    if (path.includes('/academics/sections')) return 'Class Sections';
    if (path.includes('/academics/subjects')) return 'Subjects & Curriculum';
    if (path.includes('/timetable')) return 'Timetable & Periods';
    if (path.includes('/attendance')) return 'Attendance & Roll Call';
    if (path.includes('/students')) return 'Student Directory';
    if (path.includes('/materials')) return 'Study Materials & Content Library';
    if (path.includes('/obe/admin_po_setup') || path.includes('/po_setup')) return 'POs & PSOs Setup';
    if (path.includes('/obe/faculty_mapping_matrix') || path.includes('/co_po_matrix')) return 'CO-PO Matrix';
    if (path.includes('/obe/attainment_report') || path.includes('/attainment')) return 'Attainment Report';
    if (path.includes('/obe/gap_analysis') || path.includes('/gap_analysis')) return 'CO Gap Analysis & Action Plan';
    if (path.includes('/marks/components') || path.includes('/obe/admin_components_setup')) return 'Components & Assessment Mapping';
    if (path.includes('/marks/entry') || path.includes('/marks/faculty_marks_entry')) return 'Term Marks Engine & Security State Machine';
    if (path.includes('/marks/audit')) return 'Marks Security Audit Trail';
    if (path.includes('/assessments')) return 'Marks & Assessments Management';

    if (path.includes('/examinations')) return 'Examinations Management';
    if (path.includes('/fees/matrix')) return 'Unified Fee Matrix & Packages';
    if (path.includes('/fees/invoicing')) return 'Billing & Invoicing Desk';
    if (path.includes('/fees/collections')) return 'Collections Counter & Cashier Desk';
    if (path.includes('/fees/dues_list')) return 'Collections Counter & Cashier Desk';
    if (path.includes('/fees/structures') || path.includes('/fees/program_batches') || path.includes('/fees/semester_plan') || path.includes('/fees/types')) return 'Unified Fee Matrix & Packages';
    if (path.includes('/fees/manual_assign')) return 'Billing & Invoicing Desk';
    if (path.includes('/fees/receipt_pdf')) return 'Collections Counter & Cashier Desk';
    if (path.includes('/fees')) return 'Fee Management & Collections';
    if (path.includes('/hr')) return 'HR & Payroll Management';
    if (path.includes('/accounts')) return 'Accounts & Finance';
    if (path.includes('/placements')) return 'Placements & Internships';
    if (path.includes('/transport')) return 'Campus Transport Services';
    if (path.includes('/library/books')) return 'Books Catalog';
    if (path.includes('/library/members')) return 'Library Members';
    if (path.includes('/library/issues')) return 'Issue & Return Books';
    if (path.includes('/library/categories')) return 'Book Categories';
    if (path.includes('/library/periodicals')) return 'Periodicals & Journals';
    if (path.includes('/library/stock')) return 'Stock Verification';
    if (path.includes('/library/suppliers')) return 'Suppliers & Publishers';
    if (path.includes('/library')) return 'Central Library Management';
    if (path.includes('/staff/directory')) return 'Academic Staff Directory';
    if (path.includes('/staff/duties')) return 'Academic Duties';
    if (path.includes('/staff/certificates')) return 'Staff Certificates';
    if (path.includes('/staff/checklists')) return 'Staff Checklists';
    if (path.includes('/staff')) return 'Academic Staff Directory';
    if (path.includes('/correspondence/templates')) return 'Message Templates';
    if (path.includes('/correspondence/festivals')) return 'Festival Greetings';
    if (path.includes('/correspondence')) return 'Correspondence Dashboard';

    // Front Office
    if (path.includes('/front_office/visitors') || path.includes('/front-office/visitors')) return 'Campus Visitors Book';
    if (path.includes('/front_office/call_logs') || path.includes('/front_office/calls') || path.includes('/front-office/calls')) return 'Phone Call Logs';
    if (path.includes('/front_office/postal') || path.includes('/front-office/postal')) return 'Postal Dispatch Records';
    if (path.includes('/front_office/enquiries') || path.includes('/front-office/enquiries')) return 'Admission Enquiries';
    if (path.includes('/front_office') || path.includes('/front-office')) return 'Front Office & Reception';

    // Hostel
    if (path.includes('/hostel/rooms')) return 'Hostel Rooms Setup';
    if (path.includes('/hostel/registrations')) return 'Hostel Registrations';
    if (path.includes('/hostel/outings')) return 'Hostel Outings & Passes';
    if (path.includes('/hostel')) return 'Hostel Dashboard';

    // Administration
    if (path.includes('/administration/college_details') || path.includes('/administration/college-details')) return 'College Profile & Details';
    if (path.includes('/administration/lecture_halls') || path.includes('/administration/lecture-halls')) return 'Lecture Halls Management';
    if (path.includes('/administration/locations')) return 'Campus Locations & Buildings';
    if (path.includes('/administration/agents')) return 'Agents & Admission Counselors';
    if (path.includes('/administration/holidays')) return 'Academic & Public Holidays';
    if (path.includes('/administration')) return 'Administration';

    // LMS
    if (path.includes('/lms')) return 'LMS Management & Courses';

    // System Settings
    if (path.includes('/systems/settings')) return 'Global System Settings';
    if (path.includes('/systems/users')) return 'User Management';
    if (path.includes('/systems/access_groups') || path.includes('/systems/access-groups')) return 'Access Groups & Permissions';
    if (path.includes('/systems')) return 'System Settings';

    const moduleFallbacks = {
      admissions: 'Admissions Dashboard',
      academics: 'Academics Management',
      examinations: 'Examinations Management',
      fees: 'Fee Management & Collections',
      hr: 'HR & Payroll Management',
      accounts: 'Accounts & Finance',
      placements: 'Placements & Internships',
      transport: 'Campus Transport Services',
      library: 'Central Library Management',
      staff: 'Academic Staff Directory',
      correspondence: 'Correspondence Dashboard',
      front_office: 'Front Office & Reception',
      hostel: 'Hostel Dashboard',
      administration: 'Campus Administration',
      lms: 'LMS Management & Courses',
      mis: 'Institutional MIS & Analytics',
      systems: 'Global System Settings',
    };
    return moduleFallbacks[activeModule] || 'Campus ERP Dashboard';
  };

  // Master definition of institutional modules with access group keyword mappings
  const ALL_MODULES = useMemo(() => [
    { id: 'admissions', label: 'Admissions', path: '/unilms/org/admissions/dashboard', icon: 'fa-solid fa-user-plus', bg: '#EDE9FE', color: '#7C3AED', groupKeywords: ['admission', 'crm', 'leads'] },
    { id: 'academics', label: 'Academics', path: '/unilms/org/academics/dashboard', icon: 'fa-solid fa-building-columns', bg: '#E0F2FE', color: '#0284C7', groupKeywords: ['academic', 'faculty allocation', 'curriculum'] },
    { id: 'examinations', label: 'Examinations', path: '/unilms/org/examinations', icon: 'fa-solid fa-file-pen', bg: '#D1FAE5', color: '#059669', groupKeywords: ['exam', 'marks processing', 'evaluation'] },
    { id: 'fees', label: 'Fees', path: '/unilms/org/fees/matrix', icon: 'fa-solid fa-indian-rupee-sign', bg: '#FEF3C7', color: '#D97706', groupKeywords: ['fee', 'student accounts'] },
    { id: 'hr', label: 'HR & Payroll', path: '/unilms/org/hr/employees', icon: 'fa-solid fa-users', bg: '#FCE7F3', color: '#DB2777', groupKeywords: ['hr', 'payroll', 'staff'] },
    { id: 'accounts', label: 'Accounts', path: '/unilms/org/accounts', icon: 'fa-solid fa-credit-card', bg: '#E0E7FF', color: '#4F46E5', groupKeywords: ['account', 'finance', 'ledger'] },
    { id: 'placements', label: 'Placements', path: '/unilms/org/placements', icon: 'fa-solid fa-briefcase', bg: '#FFEDD5', color: '#EA580C', groupKeywords: ['placement', 'corporate', 'drive'] },
    { id: 'transport', label: 'Transport', path: '/unilms/org/transport/vehicles', icon: 'fa-solid fa-bus', bg: '#CCFBF1', color: '#0D9488', groupKeywords: ['transport', 'vehicle', 'bus'] },
    { id: 'mis', label: 'MIS & Reports', path: '/unilms/org/mis/dashboard', icon: 'fa-solid fa-chart-pie', bg: '#EEF2FF', color: '#4338CA', groupKeywords: ['mis', 'executive', 'cockpit'] },
    { id: 'library', label: 'Library', path: '/unilms/org/library', icon: 'fa-solid fa-book-bookmark', bg: '#ECFDF5', color: '#059669', groupKeywords: ['library', 'books'] },
    { id: 'staff', label: 'Academic Staff', path: '/unilms/org/staff/directory', icon: 'fa-solid fa-user-tie', bg: '#F5F3FF', color: '#7C3AED', groupKeywords: ['staff directory', 'staff'] },
    { id: 'correspondence', label: 'Correspondence', path: '/unilms/org/correspondence', icon: 'fa-solid fa-bullhorn', bg: '#FFF1F2', color: '#E11D48', groupKeywords: ['correspondence', 'notice', 'circular'] },
    { id: 'front_office', label: 'Front Office', path: '/unilms/org/front_office', icon: 'fa-solid fa-headset', bg: '#F0F9FF', color: '#0284C7', groupKeywords: ['front office', 'visitor'] },
    { id: 'hostel', label: 'Hostel', path: '/unilms/org/hostel', icon: 'fa-solid fa-bed', bg: '#FEF3C7', color: '#D97706', groupKeywords: ['hostel', 'residential'] },
    { id: 'administration', label: 'Administration', path: '/unilms/org/administration', icon: 'fa-solid fa-building-user', bg: '#F1F5F9', color: '#475569', groupKeywords: ['campus administration', 'college details'] },
    { id: 'systems', label: 'System Settings', path: '/unilms/org/systems/settings', icon: 'fa-solid fa-gear', bg: '#F8FAFC', color: '#334155', groupKeywords: ['system', 'security', 'settings'] },
  ], []);

  // Determine if current user has Organization Admin privileges
  const isOrgAdmin = userRole === 'admin' || userRole === 'campus_admin' || userRole === 'super_admin' || Boolean(currentUser?.is_org_admin);

  // User's assigned access groups
  const userAccessGroups = useMemo(() => {
    let raw = currentUser?.access_groups;
    if (!raw) {
      try {
        const stored = localStorage.getItem('unilms_access_groups');
        if (stored) raw = JSON.parse(stored);
      } catch {}
    }
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') return [raw];
    return [];
  }, [currentUser]);

  // Compute authorized accessible modules for the top ribbon based on RBAC access groups
  const accessibleModules = useMemo(() => {
    // 1. Organization Admins have full access across all modules
    if (isOrgAdmin) {
      return ALL_MODULES;
    }

    // 2. Filter modules based on assigned Access Groups
    if (userAccessGroups.length > 0) {
      const hasFullAdmin = userAccessGroups.some(g => {
        const str = (typeof g === 'string' ? g : g.name || '').toLowerCase();
        return str.includes('admin') || str.includes('administrator');
      });
      if (hasFullAdmin) return ALL_MODULES;

      return ALL_MODULES.filter(mod => {
        return userAccessGroups.some(g => {
          const gName = (typeof g === 'string' ? g : g.name || '').toLowerCase();
          return mod.groupKeywords.some(kw => gName.includes(kw));
        });
      });
    }

    // 3. Pure faculty/student/parent without administrative access groups
    return [];
  }, [isOrgAdmin, userAccessGroups, ALL_MODULES]);

  // Split into primary tabs (up to 8) and overflow "More" dropdown
  const { primaryModules, moreModules } = useMemo(() => {
    if (accessibleModules.length <= 8) {
      return { primaryModules: accessibleModules, moreModules: [] };
    }
    return {
      primaryModules: accessibleModules.slice(0, 8),
      moreModules: accessibleModules.slice(8)
    };
  }, [accessibleModules]);

  // Display top module navigation only on administrative portals (/unilms/org/*) when authorized
  const showTopMenu = !path.startsWith('/unilms/faculty') && !path.includes('/faculty/') && accessibleModules.length > 0;

  // Institutional RBAC URL Barrier: Safely block and redirect unauthorized desk navigation
  useEffect(() => {
    if (!path.startsWith('/unilms/org/')) return;
    if (path.includes('/login') || path.includes('/profile') || path.includes('/gateway')) return;
    if (isOrgAdmin) return;

    // Check if current target module is within accessibleModules
    const isAuthorized = accessibleModules.some(m => m.id === activeModule);
    if (!isAuthorized) {
      if (isFaculty) {
        console.warn(`[RBAC] Access to administrative module "${activeModule}" denied for faculty without access group. Redirecting to Faculty Workbench.`);
        navigate('/unilms/faculty/dashboard', { replace: true });
      } else if (accessibleModules.length > 0) {
        console.warn(`[RBAC] Access denied for module "${activeModule}". Redirecting to authorized desk: ${accessibleModules[0].path}`);
        navigate(accessibleModules[0].path, { replace: true });
      }
    }
  }, [path, activeModule, isOrgAdmin, accessibleModules, isFaculty, navigate]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    try {
      if (typeof logout === 'function') {
        logout();
      }
    } catch (e) {
      console.warn('Logout hook error:', e);
    }
    // Completely clear all session, credential tokens, and user profile cache
    localStorage.removeItem('unilms_access_token');
    localStorage.removeItem('unilms_refresh_token');
    localStorage.removeItem('unilms_user');
    localStorage.removeItem('org_user_role');
    localStorage.removeItem('user_role');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('facultyEmail');
    localStorage.removeItem('faculty_persona');
    sessionStorage.clear();

    const targetLogin = isFaculty ? '/unilms/faculty/login' : '/unilms/org/login';
    // Clear history forward/backward state
    window.history.replaceState(null, '', targetLogin);
    navigate(targetLogin, { replace: true });
  };

  return (
    <div className={`org-theme ${darkMode ? 'dark-mode' : ''}`}>
      <div className={`app-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>

        {/* ================= MOBILE SIDEBAR BACKDROP ================= */}
        <div
          className={`sidebar-backdrop ${isMobileSidebarOpen ? 'active' : ''}`}
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        ></div>

        {/* ================= SIDEBAR NAVIGATION ================= */}
        <aside className={`sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to={isFaculty ? "/unilms/faculty/dashboard" : "/unilms/org/admissions/dashboard"} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="logo-icon-box">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '19px', fontWeight: '700', color: '#FFFFFF', lineHeight: '1.15', letterSpacing: '-0.3px' }}>UniLMS</span>
                <span style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                  {currentTenant?.name || 'Campus ERP'}
                </span>
              </div>
            </Link>
            <button
              type="button"
              className="mobile-sidebar-close-btn"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <nav className="sidebar-nav">
            {isFaculty ? (
              <>
                {currPersona === 'class_teacher' && (
                  <>
                    <div className="sidebar-section-title" style={{ color: '#6EE7B7' }}><i className="fa-solid fa-users-rectangle me-1"></i> Class Teacher Desk</div>
                    <Link to="/unilms/faculty/dashboard" className={`nav-item ${currPersona === 'class_teacher' && (path.includes('/faculty/dashboard') || path.includes('/org/faculty_dashboard')) ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-pie"></i> <span>Batch 360° Overview</span>
                    </Link>
                    <Link to="/unilms/faculty/class_teacher_monitor" className={`nav-item ${path.includes('class_teacher_monitor') ? 'active' : ''}`}>
                      <i className="fa-solid fa-clipboard-check"></i> <span>Proctor &amp; Defaulter Desk</span>
                    </Link>
                    <Link to="/unilms/org/academics/cohorts" className={`nav-item ${path.includes('cohorts') ? 'active' : ''}`}>
                      <i className="fa-solid fa-users"></i> <span>Batch Students</span>
                    </Link>
                  </>
                )}

                {currPersona === 'hod' && (
                  <>
                    <div className="sidebar-section-title" style={{ color: '#A5B4FC' }}><i className="fa-solid fa-landmark me-1"></i> HOD Department Desk</div>
                    <Link to="/unilms/faculty/dashboard" className={`nav-item ${currPersona === 'hod' && (path.includes('/faculty/dashboard') || path.includes('/org/faculty_dashboard')) ? 'active' : ''}`}>
                      <i className="fa-solid fa-landmark"></i> <span>Department Overview</span>
                    </Link>
                    <Link to="/unilms/faculty/subjects" className={`nav-item ${currPersona === 'hod' && path.includes('subjects') ? 'active' : ''}`}>
                      <i className="fa-solid fa-network-wired"></i> <span>Syllabus &amp; Workload</span>
                    </Link>
                    <Link to="/unilms/faculty/timetable" className={`nav-item ${currPersona === 'hod' && path.includes('timetable') ? 'active' : ''}`}>
                      <i className="fa-solid fa-calendar-days"></i> <span>Department Timetable</span>
                    </Link>
                  </>
                )}

                <div className="sidebar-section-title"><i className="fa-solid fa-chalkboard-user me-1"></i> Academic Instruction</div>
                <Link to="/unilms/faculty/dashboard" className={`nav-item ${currPersona === 'faculty' && (path === '/unilms/faculty/dashboard' || path.includes('/faculty/dashboard') || path.includes('/org/faculty_dashboard')) ? 'active' : ''}`}>
                  <i className="fa-solid fa-table-cells-large"></i> <span>Faculty Dashboard</span>
                </Link>
                <Link to="/unilms/faculty/subjects" className={`nav-item ${currPersona !== 'hod' && path.includes('/faculty/subjects') ? 'active' : ''}`}>
                  <i className="fa-solid fa-book-open"></i> <span>My Subjects</span>
                </Link>
                <Link to="/unilms/faculty/attendance" className={`nav-item ${path.includes('/attendance') ? 'active' : ''}`}>
                  <i className="fa-solid fa-clipboard-user"></i> <span>Session Attendance</span>
                </Link>
                <Link to="/unilms/faculty/assignments" className={`nav-item ${path.includes('/faculty/assignments') || path.includes('/org/assignments') || path.includes('/org/assessments') ? 'active' : ''}`}>
                  <i className="fa-solid fa-list-check"></i> <span>Assignments &amp; Tasks</span>
                </Link>
                <Link to="/unilms/faculty/materials" className={`nav-item ${path.includes('/faculty/materials') || path.includes('/org/materials') ? 'active' : ''}`}>
                  <i className="fa-solid fa-book-open-reader"></i> <span>Study Materials</span>
                </Link>
                <Link to="/unilms/faculty/marks" className={`nav-item ${path.includes('/faculty/marks') ? 'active' : ''}`}>
                  <i className="fa-solid fa-file-pen"></i> <span>Enter Marks</span>
                </Link>
                <Link to="/unilms/faculty/timetable" className={`nav-item ${currPersona !== 'hod' && path.includes('/faculty/timetable') ? 'active' : ''}`}>
                  <i className="fa-solid fa-calendar-days"></i> <span>My Timetable</span>
                </Link>

                <div className="sidebar-section-title"><i className="fa-solid fa-award me-1"></i> OBE &amp; Quality</div>
                <Link to="/unilms/faculty/po_setup" className={`nav-item ${path.includes('/faculty/po_setup') || path.includes('/faculty/po-setup') || path.includes('/org/obe/admin_po_setup') || path.includes('/org/obe/po-setup') ? 'active' : ''}`}>
                  <i className="fa-solid fa-award"></i> <span>POs &amp; PSOs Setup</span>
                </Link>
                <Link to="/unilms/faculty/co_po_matrix" className={`nav-item ${path.includes('/faculty/co_po_matrix') || path.includes('/org/obe/faculty_mapping_matrix') || path.includes('/org/obe/matrix') ? 'active' : ''}`}>
                  <i className="fa-solid fa-table-cells"></i> <span>CO-PO Matrix</span>
                </Link>
                <Link to="/unilms/faculty/attainment" className={`nav-item ${path.includes('/faculty/attainment') || path.includes('/org/obe/attainment') ? 'active' : ''}`}>
                  <i className="fa-solid fa-chart-line"></i> <span>Attainment Report</span>
                </Link>

                <div className="sidebar-section-title"><i className="fa-solid fa-user-check me-1"></i> Personal</div>
                <Link to="/unilms/faculty/leaves" className={`nav-item ${path.includes('/faculty/leaves') ? 'active' : ''}`}>
                  <i className="fa-solid fa-calendar-check"></i> <span>My Leaves</span>
                </Link>
              </>
            ) : (
              <>
                {activeModule === 'admissions' && (
                  <>
                    <div className="sidebar-section-title">CMS — ADMISSIONS</div>

                    <Link to="/unilms/org/admissions/dashboard" className={`nav-item ${path.includes('/admissions/dashboard') || path === '/unilms/org/admissions' ? 'active' : ''}`}>
                      <i className="fa-solid fa-table-cells-large"></i> <span>Dashboard</span>
                    </Link>

                    <Link to="/unilms/org/admissions/leads" className={`nav-item ${path.includes('/admissions/leads') ? 'active' : ''}`}>
                      <i className="fa-solid fa-users"></i> <span>Leads (CRM)</span>
                    </Link>

                    <Link to="/unilms/org/admissions/applications" className={`nav-item ${path.includes('/admissions/applications') ? 'active' : ''}`}>
                      <i className="fa-solid fa-file-lines"></i> <span>Applications</span>
                    </Link>

                    <Link to="/unilms/org/admissions/documents" className={`nav-item ${path.includes('/admissions/documents') ? 'active' : ''}`}>
                      <i className="fa-solid fa-shield-halved"></i> <span>Verification</span>
                    </Link>

                    <Link to="/unilms/org/admissions/offers" className={`nav-item ${path.includes('/admissions/offers') || path.includes('/admissions/offer_letter_pdf') ? 'active' : ''}`}>
                      <i className="fa-solid fa-envelope-open-text"></i> <span>Offers</span>
                    </Link>

                    <Link to="/unilms/org/admissions/payments" className={`nav-item ${path.includes('/admissions/payments') ? 'active' : ''}`}>
                      <i className="fa-solid fa-indian-rupee-sign"></i> <span>Payments</span>
                    </Link>

                    <Link to="/unilms/org/admissions/enrollment" className={`nav-item ${path.includes('/admissions/enrollment') ? 'active' : ''}`}>
                      <i className="fa-solid fa-user-plus"></i> <span>Enrollment</span>
                    </Link>

                    <div className="sidebar-section-title">ADMISSIONS EXTRAS</div>

                    <Link to="/unilms/org/admissions/college_strength" className={`nav-item ${path.includes('/admissions/college_strength') ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-column"></i> <span>College Strength</span>
                    </Link>

                    <Link to="/unilms/org/admissions/categories" className={`nav-item ${path.includes('/admissions/categories') ? 'active' : ''}`}>
                      <i className="fa-solid fa-tags"></i> <span>Categories/Castes</span>
                    </Link>

                    <Link to="/unilms/org/admissions/scholarships" className={`nav-item ${path.includes('/admissions/scholarships') ? 'active' : ''}`}>
                      <i className="fa-solid fa-award"></i> <span>Scholarships</span>
                    </Link>

                    <Link to="/unilms/org/admissions/detained" className={`nav-item ${path.includes('/admissions/detained') ? 'active' : ''}`}>
                      <i className="fa-solid fa-user-lock"></i> <span>Detained Students</span>
                    </Link>
                  </>
                )}

                {activeModule === 'academics' && (
                  <>
                    <div className="sidebar-section-title">CMS — Academics</div>
                    <Link to="/unilms/org/academics/dashboard" className={`nav-item ${path.includes('/academics/dashboard') || path === '/unilms/org/academics' ? 'active' : ''}`}>
                      <i className="fa-solid fa-graduation-cap"></i> <span>Overview</span>
                    </Link>
                    <Link to="/unilms/org/academics/departments" className={`nav-item ${path.includes('/academics/departments') ? 'active' : ''}`}>
                      <i className="fa-solid fa-building"></i> <span>Departments</span>
                    </Link>
                    <Link to="/unilms/org/academics/programs" className={`nav-item ${path.includes('/academics/programs') ? 'active' : ''}`}>
                      <i className="fa-solid fa-certificate"></i> <span>Programs</span>
                    </Link>
                    <Link to="/unilms/org/academics/regulations" className={`nav-item ${path.includes('/academics/regulations') ? 'active' : ''}`}>
                      <i className="fa-solid fa-scroll"></i> <span>Academic Regulations</span>
                    </Link>
                    <Link to="/unilms/org/academics/academic_years" className={`nav-item ${path.includes('/academics/academic_years') ? 'active' : ''}`}>
                      <i className="fa-solid fa-calendar"></i> <span>Academic Years</span>
                    </Link>
                    <Link to="/unilms/org/academics/semesters" className={`nav-item ${path.includes('/academics/semesters') ? 'active' : ''}`}>
                      <i className="fa-solid fa-layer-group"></i> <span>Semesters</span>
                    </Link>
                    <Link to="/unilms/org/academics/cohorts" className={`nav-item ${path.includes('/academics/cohorts') ? 'active' : ''}`}>
                      <i className="fa-solid fa-users"></i> <span>Batches (Cohorts)</span>
                    </Link>
                    <Link to="/unilms/org/academics/sections" className={`nav-item ${path.includes('/academics/sections') ? 'active' : ''}`}>
                      <i className="fa-solid fa-people-line"></i> <span>Class Sections</span>
                    </Link>
                    <Link to="/unilms/org/academics/subjects" className={`nav-item ${path.includes('/academics/subjects') ? 'active' : ''}`}>
                      <i className="fa-solid fa-book-open"></i> <span>Subjects</span>
                    </Link>
                    <Link to="/unilms/org/students" className={`nav-item ${path.includes('/org/students') ? 'active' : ''}`}>
                      <i className="fa-solid fa-user-graduate"></i> <span>Student Directory</span>
                    </Link>
                    <Link to="/unilms/org/academics/allocations" className={`nav-item ${path.includes('/allocations') ? 'active' : ''}`}>
                      <i className="fa-solid fa-user-tie"></i> <span>Faculty Allocations</span>
                    </Link>
                    <Link to="/unilms/org/timetable" className={`nav-item ${path.includes('/org/timetable') ? 'active' : ''}`}>
                      <i className="fa-solid fa-calendar-days"></i> <span>Timetable & Periods</span>
                    </Link>
                    <Link to="/unilms/org/attendance" className={`nav-item ${path.includes('/org/attendance') ? 'active' : ''}`}>
                      <i className="fa-solid fa-clipboard-user"></i> <span>Attendance</span>
                    </Link>
                    <Link to="/unilms/org/marks/components" className={`nav-item ${path.includes('/org/marks') || path.includes('/org/assessments') ? 'active' : ''}`}>
                      <i className="fa-solid fa-list-check"></i> <span>Marks & Assessments</span>
                    </Link>
                    <Link to="/unilms/org/materials" className={`nav-item ${path.includes('/org/materials') ? 'active' : ''}`}>
                      <i className="fa-solid fa-book"></i> <span>Study Materials</span>
                    </Link>

                    <div className="sidebar-section-title">OBE & NAAC Metric</div>
                    <Link to="/unilms/org/obe/admin_po_setup" className={`nav-item ${path.includes('/obe/admin_po_setup') || path.includes('/obe/po-setup') ? 'active' : ''}`}>
                      <i className="fa-solid fa-award"></i> <span>POs & PSOs Setup</span>
                    </Link>
                    <Link to="/unilms/org/obe/faculty_mapping_matrix" className={`nav-item ${path.includes('/obe/faculty_mapping_matrix') || path.includes('/obe/matrix') ? 'active' : ''}`}>
                      <i className="fa-solid fa-table-cells"></i> <span>CO-PO Matrix</span>
                    </Link>
                    <Link to="/unilms/org/obe/attainment_report" className={`nav-item ${path.includes('/obe/attainment') ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-line"></i> <span>Attainment Report</span>
                    </Link>
                    <Link to="/unilms/org/obe/gap_analysis" className={`nav-item ${path.includes('/obe/gap_analysis') || path.includes('/obe/gap-analysis') ? 'active' : ''}`}>
                      <i className="fa-solid fa-triangle-exclamation"></i> <span>Gap Analysis</span>
                    </Link>
                  </>
                )}

                {activeModule === 'examinations' && (
                  <>
                    <div className="sidebar-section-title">CMS — EXAMINATIONS</div>
                    <Link to="/unilms/org/examinations" className={`nav-item ${path === '/unilms/org/examinations' ? 'active' : ''}`}>
                      <i className="fa-solid fa-graduation-cap"></i> <span>Exam Setup</span>
                    </Link>
                    <Link to="/unilms/org/examinations/schedules" className={`nav-item ${path.includes('/schedules') ? 'active' : ''}`}>
                      <i className="fa-regular fa-calendar-days"></i> <span>Schedules & Timetable</span>
                    </Link>
                    <Link to="/unilms/org/examinations/applications" className={`nav-item ${path.includes('/applications') ? 'active' : ''}`}>
                      <i className="fa-solid fa-address-card"></i> <span>Student Applications</span>
                    </Link>
                    <Link to="/unilms/org/examinations/hall_tickets" className={`nav-item ${path.includes('/hall_tickets') ? 'active' : ''}`}>
                      <i className="fa-solid fa-ticket"></i> <span>Hall Tickets</span>
                    </Link>
                    <Link to="/unilms/org/examinations/invigilation" className={`nav-item ${path.includes('/invigilation') ? 'active' : ''}`}>
                      <i className="fa-solid fa-user-shield"></i> <span>Invigilation Duties</span>
                    </Link>
                    <Link to="/unilms/org/examinations/marks_entry" className={`nav-item ${path.includes('/marks_entry') ? 'active' : ''}`}>
                      <i className="fa-solid fa-pen"></i> <span>Marks Entry</span>
                    </Link>
                    <Link to="/unilms/org/examinations/backlogs" className={`nav-item ${path.includes('/backlogs') ? 'active' : ''}`}>
                      <i className="fa-solid fa-clock-rotate-left"></i> <span>Backlogs</span>
                    </Link>
                    <Link to="/unilms/org/examinations/reports" className={`nav-item ${path.includes('/reports') ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-line"></i> <span>Reports &amp; Gazette</span>
                    </Link>
                  </>
                )}

                {activeModule === 'fees' && (
                  <>
                    <div className="sidebar-section-title">CMS — Fee Management</div>
                    <Link to="/unilms/org/fees/matrix" className={`nav-item ${path.includes('/matrix') || path.includes('/structures') || path.includes('/program_batches') || path.includes('/semester_plan') || path.includes('/types') ? 'active' : ''}`}>
                      <i className="fa-solid fa-layer-group"></i> <span>Fee Matrix &amp; Packages</span>
                    </Link>
                    <Link to="/unilms/org/fees/invoicing" className={`nav-item ${path.includes('/invoicing') || path.includes('/manual_assign') ? 'active' : ''}`}>
                      <i className="fa-solid fa-file-invoice-dollar"></i> <span>Billing &amp; Invoicing</span>
                    </Link>
                    <Link to="/unilms/org/fees/collections" className={`nav-item ${path.includes('/collections') || path.includes('/dues_list') || path.includes('/receipt_pdf') ? 'active' : ''}`}>
                      <i className="fa-solid fa-cash-register"></i> <span>Collections Counter</span>
                    </Link>
                  </>
                )}

                {activeModule === 'hr' && (
                  <>
                    <div className="sidebar-section-title">CMS — HR & PAYROLL</div>
                    <Link to="/unilms/org/hr/employees" className={`nav-item ${path.includes('/employees') ? 'active' : ''}`}>
                      <i className="fa-solid fa-users-viewfinder"></i> <span>Directory</span>
                    </Link>
                    <Link to="/unilms/org/hr/appraisals" className={`nav-item ${path.includes('/appraisals') ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-line"></i> <span>Appraisals</span>
                    </Link>
                    <Link to="/unilms/org/hr/leaves" className={`nav-item ${path.includes('/leaves') ? 'active' : ''}`}>
                      <i className="fa-solid fa-person-walking-arrow-right"></i> <span>Leaves</span>
                    </Link>
                    <Link to="/unilms/org/hr/payroll/payslips" className={`nav-item ${path.includes('/payslips') ? 'active' : ''}`}>
                      <i className="fa-solid fa-file-invoice-dollar"></i> <span>Payslips</span>
                    </Link>
                    <Link to="/unilms/org/hr/payroll/structures" className={`nav-item ${path.includes('/structures') ? 'active' : ''}`}>
                      <i className="fa-solid fa-network-wired"></i> <span>Salary Structures</span>
                    </Link>
                    <Link to="/unilms/org/hr/payroll/components" className={`nav-item ${path.includes('/components') ? 'active' : ''}`}>
                      <i className="fa-solid fa-calculator"></i> <span>Pay Components</span>
                    </Link>
                  </>
                )}

                {activeModule === 'accounts' && (
                  <>
                    <div className="sidebar-section-title">CMS — Accounts & Finance</div>
                    <Link to="/unilms/org/accounts" className={`nav-item ${path === '/unilms/org/accounts' ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-pie"></i> <span>Dashboard</span>
                    </Link>
                    <Link to="/unilms/org/accounts/heads" className={`nav-item ${path.includes('/heads') ? 'active' : ''}`}>
                      <i className="fa-solid fa-tags"></i> <span>Chart of Accounts</span>
                    </Link>
                    <Link to="/unilms/org/accounts/banks" className={`nav-item ${path.includes('/banks') ? 'active' : ''}`}>
                      <i className="fa-solid fa-building-columns"></i> <span>Bank & Cash A/c</span>
                    </Link>
                    <Link to="/unilms/org/accounts/transactions" className={`nav-item ${path.includes('/transactions') ? 'active' : ''}`}>
                      <i className="fa-solid fa-money-bill-transfer"></i> <span>Transactions</span>
                    </Link>
                    <Link to="/unilms/org/accounts/daybook" className={`nav-item ${path.includes('/daybook') ? 'active' : ''}`}>
                      <i className="fa-solid fa-book"></i> <span>Day Book</span>
                    </Link>
                    <Link to="/unilms/org/accounts/pl-statement" className={`nav-item ${path.includes('/pl') ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-line"></i> <span>Profit & Loss</span>
                    </Link>
                  </>
                )}

                {activeModule === 'placements' && (
                  <>
                    <div className="sidebar-section-title">CMS — Placements & TPO</div>
                    <Link to="/unilms/org/placements" className={`nav-item ${path === '/unilms/org/placements' ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-pie"></i> <span>Dashboard</span>
                    </Link>
                    <Link to="/unilms/org/internships" className={`nav-item ${path.includes('/internships') ? 'active' : ''}`}>
                      <i className="fa-solid fa-map-signs"></i> <span>Internship Roadmaps</span>
                    </Link>
                    <Link to="/unilms/org/placements/companies" className={`nav-item ${path.includes('/companies') ? 'active' : ''}`}>
                      <i className="fa-solid fa-building"></i> <span>Partners / Companies</span>
                    </Link>
                    <Link to="/unilms/org/placements/drives" className={`nav-item ${path.includes('/drives') ? 'active' : ''}`}>
                      <i className="fa-solid fa-bullhorn"></i> <span>Recruitment Drives</span>
                    </Link>
                    <Link to="/unilms/org/placements/offers" className={`nav-item ${path.includes('/offers') ? 'active' : ''}`}>
                      <i className="fa-solid fa-briefcase"></i> <span>Job Offers</span>
                    </Link>
                  </>
                )}

                {activeModule === 'transport' && (
                  <>
                    <div className="sidebar-section-title">CMS — Transport Services</div>
                    <Link to="/unilms/org/transport/vehicles" className={`nav-item ${path.includes('/vehicles') ? 'active' : ''}`}>
                      <i className="fa-solid fa-van-shuttle"></i> <span>Vehicles Fleet</span>
                    </Link>
                    <Link to="/unilms/org/transport/routes" className={`nav-item ${path.includes('/routes') ? 'active' : ''}`}>
                      <i className="fa-solid fa-route"></i> <span>Routes Planner</span>
                    </Link>
                    <Link to="/unilms/org/transport/halts" className={`nav-item ${path.includes('/halts') ? 'active' : ''}`}>
                      <i className="fa-solid fa-map-pin"></i> <span>Stops & Pricing</span>
                    </Link>
                    <Link to="/unilms/org/transport/subscriptions" className={`nav-item ${path.includes('/subscriptions') ? 'active' : ''}`}>
                      <i className="fa-solid fa-id-card"></i> <span>Subscriptions</span>
                    </Link>
                    <Link to="/unilms/org/transport/logbook" className={`nav-item ${path.includes('/logbook') ? 'active' : ''}`}>
                      <i className="fa-solid fa-gas-pump"></i> <span>Log Book & Fuel</span>
                    </Link>
                  </>
                )}

                {activeModule === 'library' && (
                  <>
                    <div className="sidebar-section-title">CMS — LIBRARY</div>
                    <Link to="/unilms/org/library" className={`nav-item ${path === '/unilms/org/library' ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-pie"></i> <span>Dashboard</span>
                    </Link>
                    <Link to="/unilms/org/library/books" className={`nav-item ${path.includes('/library/books') ? 'active' : ''}`}>
                      <i className="fa-solid fa-book"></i> <span>Books Catalog</span>
                    </Link>
                    <Link to="/unilms/org/library/members" className={`nav-item ${path.includes('/library/members') ? 'active' : ''}`}>
                      <i className="fa-solid fa-users"></i> <span>Members</span>
                    </Link>
                    <Link to="/unilms/org/library/issues" className={`nav-item ${path.includes('/library/issues') ? 'active' : ''}`}>
                      <i className="fa-solid fa-hand-holding-hand"></i> <span>Issue / Return</span>
                    </Link>
                    <Link to="/unilms/org/library/categories" className={`nav-item ${path.includes('/library/categories') ? 'active' : ''}`}>
                      <i className="fa-solid fa-tags"></i> <span>Categories</span>
                    </Link>
                    <Link to="/unilms/org/library/periodicals" className={`nav-item ${path.includes('/library/periodicals') ? 'active' : ''}`}>
                      <i className="fa-solid fa-newspaper"></i> <span>Periodicals & Journals</span>
                    </Link>
                    <Link to="/unilms/org/library/stock" className={`nav-item ${path.includes('/library/stock') ? 'active' : ''}`}>
                      <i className="fa-solid fa-clipboard-check"></i> <span>Stock Verification</span>
                    </Link>
                    <Link to="/unilms/org/library/suppliers" className={`nav-item ${path.includes('/library/suppliers') ? 'active' : ''}`}>
                      <i className="fa-solid fa-truck-ramp-box"></i> <span>Suppliers & Publishers</span>
                    </Link>
                  </>
                )}

                {activeModule === 'staff' && (
                  <>
                    <div className="sidebar-section-title">CMS — STAFF (ACADEMIC)</div>
                    <Link to="/unilms/org/staff/directory" className={`nav-item ${path.includes('/staff/directory') || path === '/unilms/org/staff' ? 'active' : ''}`}>
                      <i className="fa-solid fa-address-book"></i> <span>Directory Lookup</span>
                    </Link>
                    <Link to="/unilms/org/staff/duties" className={`nav-item ${path.includes('/staff/duties') ? 'active' : ''}`}>
                      <i className="fa-solid fa-list-check"></i> <span>Academic Duties</span>
                    </Link>
                    <Link to="/unilms/org/staff/certificates" className={`nav-item ${path.includes('/staff/certificates') ? 'active' : ''}`}>
                      <i className="fa-solid fa-certificate"></i> <span>Certificates</span>
                    </Link>
                    <Link to="/unilms/org/staff/checklists" className={`nav-item ${path.includes('/staff/checklists') ? 'active' : ''}`}>
                      <i className="fa-solid fa-clipboard-list"></i> <span>Checklists</span>
                    </Link>
                  </>
                )}

                {activeModule === 'correspondence' && (
                  <>
                    <div className="sidebar-section-title">CMS — CORRESPONDENCE</div>
                    <Link to="/unilms/org/correspondence" className={`nav-item ${path === '/unilms/org/correspondence' || path === '/unilms/org/correspondence/' ? 'active' : ''}`}>
                      <i className="fa-solid fa-bell"></i> <span>Dashboard</span>
                    </Link>
                    <Link to="/unilms/org/correspondence/templates" className={`nav-item ${path.includes('/correspondence/templates') ? 'active' : ''}`}>
                      <i className="fa-solid fa-layer-group"></i> <span>Message Templates</span>
                    </Link>
                    <Link to="/unilms/org/correspondence/festivals" className={`nav-item ${path.includes('/correspondence/festivals') ? 'active' : ''}`}>
                      <i className="fa-solid fa-calendar-check"></i> <span>Festival Greetings</span>
                    </Link>
                  </>
                )}

                {activeModule === 'front_office' && (
                  <>
                    <div className="sidebar-section-title">CMS — FRONT OFFICE</div>
                    <Link to="/unilms/org/front_office" className={`nav-item ${path === '/unilms/org/front_office' || path === '/unilms/org/front-office' ? 'active' : ''}`}>
                      <i className="fa-solid fa-headset"></i> <span>Hub Overview</span>
                    </Link>
                    <Link to="/unilms/org/front_office/visitors" className={`nav-item ${path.includes('/front_office/visitors') || path.includes('/front-office/visitors') ? 'active' : ''}`}>
                      <i className="fa-solid fa-person-walking"></i> <span>Visitors Book</span>
                    </Link>
                    <Link to="/unilms/org/front_office/call_logs" className={`nav-item ${path.includes('/front_office/call_logs') || path.includes('/front_office/calls') || path.includes('/front-office/calls') ? 'active' : ''}`}>
                      <i className="fa-solid fa-phone"></i> <span>Call Logs</span>
                    </Link>
                    <Link to="/unilms/org/front_office/postal" className={`nav-item ${path.includes('/front_office/postal') || path.includes('/front-office/postal') ? 'active' : ''}`}>
                      <i className="fa-solid fa-envelopes-bulk"></i> <span>Postal Dispatch</span>
                    </Link>
                    <Link to="/unilms/org/front_office/enquiries" className={`nav-item ${path.includes('/front_office/enquiries') || path.includes('/front-office/enquiries') ? 'active' : ''}`}>
                      <i className="fa-solid fa-clipboard-question"></i> <span>Admission Enquiries</span>
                    </Link>
                  </>
                )}

                {activeModule === 'hostel' && (
                  <>
                    <div className="sidebar-section-title">CMS — HOSTEL</div>
                    <Link to="/unilms/org/hostel" className={`nav-item ${path === '/unilms/org/hostel' || path === '/unilms/org/hostel/' ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-pie"></i> <span>Dashboard</span>
                    </Link>
                    <Link to="/unilms/org/hostel/rooms" className={`nav-item ${path.includes('/hostel/rooms') ? 'active' : ''}`}>
                      <i className="fa-solid fa-bed"></i> <span>Rooms Setup</span>
                    </Link>
                    <Link to="/unilms/org/hostel/registrations" className={`nav-item ${path.includes('/hostel/registrations') ? 'active' : ''}`}>
                      <i className="fa-solid fa-address-card"></i> <span>Registrations</span>
                    </Link>
                    <Link to="/unilms/org/hostel/outings" className={`nav-item ${path.includes('/hostel/outings') ? 'active' : ''}`}>
                      <i className="fa-solid fa-person-walking-arrow-right"></i> <span>Outings / Passes</span>
                    </Link>
                  </>
                )}

                {activeModule === 'administration' && (
                  <>
                    <div className="sidebar-section-title">CMS — ADMINISTRATION</div>
                    <Link to="/unilms/org/administration" className={`nav-item ${path === '/unilms/org/administration' || path === '/unilms/org/administration/' ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-pie"></i> <span>Dashboard</span>
                    </Link>
                    <Link to="/unilms/org/administration/college_details" className={`nav-item ${path.includes('/administration/college_details') || path.includes('/administration/college-details') ? 'active' : ''}`}>
                      <i className="fa-solid fa-building"></i> <span>College Details</span>
                    </Link>
                    <Link to="/unilms/org/administration/lecture_halls" className={`nav-item ${path.includes('/administration/lecture_halls') || path.includes('/administration/lecture-halls') ? 'active' : ''}`}>
                      <i className="fa-solid fa-chalkboard"></i> <span>Lecture Halls</span>
                    </Link>
                    <Link to="/unilms/org/administration/locations" className={`nav-item ${path.includes('/administration/locations') ? 'active' : ''}`}>
                      <i className="fa-solid fa-map-location-dot"></i> <span>Locations</span>
                    </Link>
                    <Link to="/unilms/org/administration/agents" className={`nav-item ${path.includes('/administration/agents') ? 'active' : ''}`}>
                      <i className="fa-solid fa-users-viewfinder"></i> <span>Agents/Counselors</span>
                    </Link>
                    <Link to="/unilms/org/administration/holidays" className={`nav-item ${path.includes('/administration/holidays') ? 'active' : ''}`}>
                      <i className="fa-solid fa-umbrella-beach"></i> <span>Holidays</span>
                    </Link>
                  </>
                )}

                {activeModule === 'lms' && (
                  <>
                    <div className="sidebar-section-title">CMS — LMS</div>
                    <Link to="/unilms/org/lms/courses" className={`nav-item ${path.includes('/lms/courses') || path === '/unilms/org/lms' ? 'active' : ''}`}>
                      <i className="fa-solid fa-chalkboard-user"></i> <span>Courses</span>
                    </Link>
                  </>
                )}

                {activeModule === 'mis' && (
                  <>
                    <div className="sidebar-section-title">CMS — MIS & REPORTS</div>
                    <Link to="/unilms/org/mis/dashboard" className={`nav-item ${path === '/unilms/org/mis/dashboard' || path === '/unilms/org/mis' ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-pie"></i> <span>Executive Cockpit</span>
                    </Link>
                    <Link to="/unilms/org/mis/reports" className={`nav-item ${path.includes('/mis/reports') ? 'active' : ''}`}>
                      <i className="fa-solid fa-table-list"></i> <span>Cross-Module Reports</span>
                    </Link>

                    <div className="sidebar-section-title">EXECUTIVE DRILL-DOWN</div>
                    <Link to="/unilms/org/admissions/joining_analytics" className={`nav-item ${path.includes('/admissions/joining_analytics') ? 'active' : ''}`}>
                      <i className="fa-solid fa-filter-circle-dollar"></i> <span>Admission ➔ Joining Funnel</span>
                    </Link>
                    <Link to="/unilms/org/academics/student_analysis" className={`nav-item ${path.includes('/academics/student_analysis') ? 'active' : ''}`}>
                      <i className="fa-solid fa-chart-user"></i> <span>Student 360° & At-Risk</span>
                    </Link>
                  </>
                )}

                {activeModule === 'systems' && (
                  <>
                    <div className="sidebar-section-title">CMS — SYSTEM SETTINGS</div>
                    <Link to="/unilms/org/systems/settings" className={`nav-item ${path.includes('/systems/settings') ? 'active' : ''}`}>
                      <i className="fa-solid fa-building"></i> <span>Global Settings</span>
                    </Link>
                    <Link to="/unilms/org/systems/users" className={`nav-item ${path.includes('/systems/users') ? 'active' : ''}`}>
                      <i className="fa-solid fa-users-gear"></i> <span>Users</span>
                    </Link>
                    <Link to="/unilms/org/systems/access_groups" className={`nav-item ${path.includes('/systems/access_groups') || path.includes('/systems/access-groups') ? 'active' : ''}`}>
                      <i className="fa-solid fa-shield-halved"></i> <span>Access Groups</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </aside>

        {/* ================= MAIN CONTENT AREA ================= */}
        <main className="main-content">
          <header className={`topbar ${showTopMenu ? 'multi-row' : ''}`}>
            <div className="topbar-main-row">
              <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="mobile-sidebar-toggle"
                  onClick={() => setIsMobileSidebarOpen(prev => !prev)}
                  aria-label="Toggle navigation menu"
                >
                  <i className="fa-solid fa-bars"></i>
                </button>
                <h1 id="page-title">{getPageTitle()}</h1>
              </div>

              {/* Persona Switcher for Faculty: Render ONLY the roles the faculty member actually holds */}
              {isFaculty && (privileges.isClassTeacher || privileges.isHOD) && (
                <div className="topbar-faculty-personas">
                  <button
                    type="button"
                    className={`topbar-persona-btn ${currPersona === 'faculty' ? 'active' : ''}`}
                    onClick={() => handleSwitchPersona('faculty')}
                    title="Course Faculty Teaching Workbench"
                  >
                    <i className="fa-solid fa-chalkboard-user"></i>
                    <span>Faculty</span>
                  </button>

                  {/* Render Class Teacher ONLY if verified in DB */}
                  {privileges.isClassTeacher && (
                    <button
                      type="button"
                      className={`topbar-persona-btn ${currPersona === 'class_teacher' ? 'active' : ''}`}
                      onClick={() => handleSwitchPersona('class_teacher')}
                      title="Class Teacher section monitor"
                    >
                      <i className="fa-solid fa-users-rectangle"></i>
                      <span>Class Teacher</span>
                    </button>
                  )}

                  {/* Render HOD ONLY if verified in DB */}
                  {privileges.isHOD && (
                    <button
                      type="button"
                      className={`topbar-persona-btn ${currPersona === 'hod' ? 'active' : ''}`}
                      onClick={() => handleSwitchPersona('hod')}
                      title="HOD department leadership desk"
                    >
                      <i className="fa-solid fa-landmark"></i>
                      <span>HOD</span>
                    </button>
                  )}
                </div>
              )}

              {/* Actions Cluster (Palette, Bell, User Profile) */}
              <div className="topbar-actions-cluster">
                {/* Theme & Color Picker Trigger */}
                <div className="theme-palette-picker" ref={paletteRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowPalette(!showPalette)}
                    className="paletteBtn"
                    style={{ background: 'var(--card-bg, #ffffff)', border: '2px solid #0F172A', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)', transition: 'all 0.2s ease', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', fontSize: '15px', padding: 0 }}
                    title="Theme & Color Customizer"
                  >
                    🎨
                  </button>
                  {showPalette && (
                    <div id="paletteDropdown" style={{ display: 'block', position: 'absolute', right: 0, top: '34px', zIndex: 9999, background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: '210px', maxWidth: 'calc(100vw - 20px)', boxSizing: 'border-box', animation: 'modalFadeIn 0.2s ease' }}>
                      <div style={{ fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.4px' }}>Theme Accent Color</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '12px' }}>
                        <button type="button" onClick={() => { setActiveTheme('purple'); setShowPalette(false); }} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#7C3AED', border: '2px solid #fff', boxShadow: '0 0 0 1px #7C3AED', cursor: 'pointer' }} title="Royal Purple"></button>
                        <button type="button" onClick={() => { setActiveTheme('blue'); setShowPalette(false); }} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2563EB', border: '2px solid #fff', boxShadow: '0 0 0 1px #2563EB', cursor: 'pointer' }} title="Sapphire Blue"></button>
                        <button type="button" onClick={() => { setActiveTheme('emerald'); setShowPalette(false); }} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#059669', border: '2px solid #fff', boxShadow: '0 0 0 1px #059669', cursor: 'pointer' }} title="Emerald Green"></button>
                        <button type="button" onClick={() => { setActiveTheme('amber'); setShowPalette(false); }} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#D97706', border: '2px solid #fff', boxShadow: '0 0 0 1px #D97706', cursor: 'pointer' }} title="Sunset Amber"></button>
                        <button type="button" onClick={() => { setActiveTheme('rose'); setShowPalette(false); }} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#E11D48', border: '2px solid #fff', boxShadow: '0 0 0 1px #E11D48', cursor: 'pointer' }} title="Crimson Rose"></button>
                        <button type="button" onClick={() => { setActiveTheme('teal'); setShowPalette(false); }} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0D9488', border: '2px solid #fff', boxShadow: '0 0 0 1px #0D9488', cursor: 'pointer' }} title="Deep Teal"></button>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)' }}>Dark Theme</span>
                        <button type="button" onClick={() => setDarkMode(!darkMode)} className="darkModeToggleBtn" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '3px 8px', fontSize: '10.5px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                          <i className={`fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i> <span>Toggle</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications Bell with Interactive Alert Drawer */}
                <div className="notifications-bell-wrapper" ref={notificationsRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(prev => !prev)}
                    className="notifications-bell-btn"
                    style={{
                      background: 'none',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Institutional Notifications & Alerts"
                  >
                    <i className="fa-solid fa-bell" style={{ fontSize: '15px' }}></i>
                    {unreadCount > 0 && (
                      <span id="global_unread_badge" style={{ position: 'absolute', top: '-4px', right: '-6px', background: '#EF4444', color: 'white', fontSize: '9px', fontWeight: '700', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1', border: '1.5px solid #ffffff' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover Dropdown */}
                  {showNotifications && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        right: 0,
                        width: '350px',
                        maxWidth: 'calc(100vw - 20px)',
                        background: 'var(--bg-card, #ffffff)',
                        border: '1px solid var(--border-color, rgba(0,0,0,0.1))',
                        borderRadius: '16px',
                        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.16)',
                        padding: '14px',
                        zIndex: 9999,
                        animation: 'fadeIn 0.18s ease-out'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '13px', color: 'var(--text-main)' }}>
                          <i className="fa-solid fa-bell" style={{ color: '#7C3AED' }}></i>
                          <span>Notifications</span>
                          {unreadCount > 0 && (
                            <span style={{ background: '#EDE9FE', color: '#7C3AED', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px' }}>
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllNotificationsRead}
                            style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {notificationsList.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                            <i className="fa-solid fa-check-double" style={{ fontSize: '24px', color: '#10B981', marginBottom: '8px', display: 'block' }}></i>
                            No notifications at this time.
                          </div>
                        ) : (
                          notificationsList.map((notif) => (
                            <div
                              key={notif.id}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '10px',
                                background: notif.isRead ? 'var(--bg-main, #f8fafc)' : 'rgba(124, 58, 237, 0.04)',
                                border: notif.isRead ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(124, 58, 237, 0.2)',
                                display: 'flex',
                                gap: '10px'
                              }}
                            >
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '8px',
                                  background: notif.type === 'warning' ? '#FEF2F2' : notif.type === 'academic' ? '#EDE9FE' : '#EFF6FF',
                                  color: notif.type === 'warning' ? '#EF4444' : notif.type === 'academic' ? '#7C3AED' : '#2563EB',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '13px',
                                  flexShrink: 0
                                }}
                              >
                                <i className={`fa-solid ${notif.type === 'warning' ? 'fa-triangle-exclamation' : notif.type === 'academic' ? 'fa-graduation-cap' : 'fa-circle-info'}`}></i>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-main)', marginBottom: '2px' }}>
                                  {notif.title}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                  {notif.message}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Container with Click Dropdown */}
                <div className="user-profile-dropdown-wrapper" ref={userDropdownRef} style={{ position: 'relative' }}>
                  <div
                    className="user-profile"
                    onClick={() => setShowUserDropdown(prev => !prev)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '4px 10px 4px 4px',
                      borderRadius: '30px',
                      border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                      background: 'var(--bg-card, #ffffff)',
                      boxShadow: showUserDropdown ? '0 4px 14px rgba(0,0,0,0.1)' : 'var(--shadow-sm)',
                      transition: 'all 0.2s ease'
                    }}
                    title="Click for Executive Suite & Account Options"
                  >
                    <div className="avatar" style={{ background: '#7C3AED', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', width: '28px', height: '28px' }}>
                      {((currentUser?.name || currentUser?.email || (isFaculty ? 'Faculty' : 'Admin')).trim().charAt(0)).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="user-name" style={{ fontWeight: '600', fontSize: '12px' }}>
                          {currentUser?.email || currentUser?.name || currentUser?.employeeCode || (isFaculty ? 'Faculty Member' : 'Organization Admin')}
                        </span>
                        <i className={`fa-solid fa-chevron-down`} style={{ fontSize: '9px', color: 'var(--text-muted)', transition: 'transform 0.2s ease', transform: showUserDropdown ? 'rotate(180deg)' : 'none' }}></i>
                      </div>
                      <span className="user-role" style={{ fontSize: '10px' }}>
                        {userRole === 'admin' || userRole === 'campus_admin'
                          ? 'Organization Admin'
                          : (isFaculty
                            ? (currPersona === 'hod' ? 'HOD' : currPersona === 'class_teacher' ? 'Class Teacher' : (currentUser?.designation || 'Faculty Member'))
                            : (currentUser?.role === 'admin' || currentUser?.role === 'campus_admin' ? 'Organization Admin' : (currentUser?.role || 'Organization Admin'))
                          )
                        }
                      </span>
                    </div>
                  </div>

                  {/* Header Dropdown Menu */}
                  {showUserDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '330px',
                        maxWidth: 'calc(100vw - 20px)',
                        boxSizing: 'border-box',
                        background: 'var(--bg-card, #ffffff)',
                        border: '1px solid var(--border-color, rgba(0,0,0,0.1))',
                        borderRadius: '16px',
                        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.18)',
                        padding: '14px',
                        zIndex: 9999,
                        animation: 'fadeIn 0.18s ease-out'
                      }}
                    >
                      {/* Identity Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#7C3AED', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' }}>
                          {((currentUser?.name || currentUser?.email || (isFaculty ? 'Faculty' : 'Admin')).trim().charAt(0)).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '13.5px', color: 'var(--text-main)' }}>
                            {currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : (isFaculty ? 'Faculty Member' : 'Organization Admin'))}
                          </div>
                          <div style={{ fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                            {userRole === 'admin' || userRole === 'campus_admin'
                              ? (currentUser?.tenant?.name ? `${currentUser.tenant.name}` : (currentTenant?.name || 'Organization Admin'))
                              : (isFaculty
                                ? (currPersona === 'hod' ? 'HOD' : currPersona === 'class_teacher' ? 'Class Teacher' : (currentUser?.designation || 'Faculty Member'))
                                : (currentUser?.tenant?.name ? `${currentUser.tenant.name}` : (currentTenant?.name || 'Organization Admin'))
                              )
                            }
                          </div>
                          {currentUser?.email && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {currentUser.email}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ margin: '8px 0', borderTop: '1px solid rgba(0,0,0,0.06)' }}></div>

                      {/* Navigation Links for Admin / Faculty */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {isOrgAdmin && (
                          <>
                            <div style={{ padding: '6px 10px 4px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted, #64748b)' }}>
                              Direct View Shortcuts (New Tab)
                            </div>

                            <a
                              href="/unilms/analytics/dashboard"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setShowUserDropdown(false)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#7C3AED'; e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                            >
                              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                                <i className="fa-solid fa-chart-pie"></i>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span>MIS Executive Cockpit</span>
                                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '9px', color: '#94a3b8' }}></i>
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Boardroom KPIs, financials &amp; health</div>
                              </div>
                            </a>

                            <a
                              href="/unilms/analytics/joining_analytics"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setShowUserDropdown(false)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#0284C7'; e.currentTarget.style.background = 'rgba(2, 132, 199, 0.08)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                            >
                              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                                <i className="fa-solid fa-filter-circle-dollar"></i>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span>Admissions &amp; Yield Funnel</span>
                                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '9px', color: '#94a3b8' }}></i>
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>7-stage funnel &amp; AI narrative</div>
                              </div>
                            </a>

                            <a
                              href="/unilms/analytics/student_analysis"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setShowUserDropdown(false)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#16A34A'; e.currentTarget.style.background = 'rgba(22, 163, 74, 0.08)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                            >
                              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                                <i className="fa-solid fa-user-shield"></i>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span>Student 360° &amp; Risk Radar</span>
                                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '9px', color: '#94a3b8' }}></i>
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Attendance detention &amp; backlogs</div>
                              </div>
                            </a>

                            <a
                              href="/unilms/analytics/reports"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setShowUserDropdown(false)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#D97706'; e.currentTarget.style.background = 'rgba(217, 119, 6, 0.08)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                            >
                              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                                <i className="fa-solid fa-table-list"></i>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span>Central Reports &amp; NAAC</span>
                                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '9px', color: '#94a3b8' }}></i>
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Compliance SSR &amp; Excel exports</div>
                              </div>
                            </a>

                            <div style={{ margin: '6px 0', borderTop: '1px solid rgba(0,0,0,0.06)' }}></div>
                          </>
                        )}

                        <Link
                          to="/unilms/org/systems/settings"
                          onClick={() => setShowUserDropdown(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                        >
                          <i className="fa-solid fa-gear" style={{ width: '16px' }}></i>
                          <span>College Settings</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            setShowLogoutModal(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            background: 'none',
                            border: 'none',
                            color: '#DC2626',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            marginTop: '2px'
                          }}
                        >
                          <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '16px' }}></i>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Module Navigation Card: Shown dynamically for Org Admin & Staff with authorized Access Groups */}
            {showTopMenu && (
              <div className="org-modules-card" ref={modulesCardRef}>
                <div className="module-nav-grid">
                  {primaryModules.map((mod) => (
                    <Link
                      key={mod.id}
                      to={mod.path}
                      className={`module-nav-item ${activeModule === mod.id ? 'active' : ''}`}
                      data-module={mod.id}
                      title={mod.label}
                    >
                      <div className="module-icon-circle" style={{ background: mod.bg, color: mod.color }}>
                        <i className={mod.icon}></i>
                      </div>
                      <span className="module-nav-label">{mod.label}</span>
                    </Link>
                  ))}

                  {moreModules.length > 0 && (
                    <div className="more-modules-container" ref={moreModulesRef} id="moreModulesContainer">
                      <button
                        type="button"
                        className={`module-nav-item more-nav-item ${moreModules.some(m => m.id === activeModule) ? 'active' : ''}`}
                        data-module="more"
                        id="moreModulesBtn"
                        onClick={handleToggleMoreModules}
                        aria-haspopup="true"
                        title="More Modules"
                      >
                        <div className="module-icon-circle module-icon-more" style={{ background: '#FFFFFF', color: '#334155', border: '2px solid #7C3AED' }}>
                          <i className="fa-solid fa-table-cells-large"></i>
                        </div>
                        <span className="module-nav-label module-nav-label-more" style={{ color: '#7C3AED', fontWeight: 700 }}>More</span>
                      </button>

                      {/* Dropdown Menu Portaled to document.body */}
                      {showMoreModules && typeof document !== 'undefined' && createPortal(
                        <div
                          ref={moreDropdownRef}
                          className="more-modules-dropdown show"
                          id="moreModulesDropdown"
                          style={{
                            position: 'fixed',
                            top: `${dropdownPos.top}px`,
                            right: `${dropdownPos.right}px`,
                            zIndex: 999999,
                            display: 'block'
                          }}
                        >
                          <div className="more-dropdown-arrow"></div>
                          <div className="more-dropdown-list">
                            {moreModules.map((mod) => (
                              <Link
                                key={mod.id}
                                to={mod.path}
                                onClick={() => setShowMoreModules(false)}
                                className={`more-dropdown-item ${activeModule === mod.id ? 'active' : ''}`}
                              >
                                <div className="more-dropdown-icon" style={{ background: mod.bg, color: mod.color }}>
                                  <i className={mod.icon}></i>
                                </div>
                                <div className="more-dropdown-info">
                                  <div className="more-dropdown-title">{mod.label}</div>
                                  <div className="more-dropdown-sub">Access {mod.label} Management</div>
                                </div>
                                <i className="fa-solid fa-chevron-right more-dropdown-chevron"></i>
                              </Link>
                            ))}
                          </div>
                        </div>,
                        document.body
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </header>

          {/* Page Child Content via Outlet with Error Boundary Recovery */}
          <div className="content-body" style={{ padding: '0 16px 20px' }}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>

        </main>
      </div>

      {/* ================= CONFIRM LOGOUT MODAL ================= */}
      {showLogoutModal && (
        <div id="logoutModal" style={{ display: 'flex', position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '24px', padding: '32px 32px 28px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid var(--border-color, #e2e8f0)', animation: 'modalFadeIn 0.25s ease' }}>
            <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: 'var(--text-primary, #0F172A)' }}>
              Sign Out of LMS?
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--text-muted, #64748B)', lineHeight: '1.5' }}>
              Are you sure you want to end your {isFaculty ? 'faculty' : 'student'} session?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="btn btn-outline"
                style={{ flex: 1, padding: '10px 18px', borderRadius: '12px', border: '1.5px solid var(--border-color, #E2E8F0)', background: 'transparent', color: 'var(--text-primary, #374151)', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 18px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgLayout;
