import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Gateway from './pages/Gateway.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const SuperAdminRedirect = () => {
  const { path } = useParams();
  return <Navigate to={`/unilms/superadmin/${path || 'dashboard'}`} replace />;
};
const SuperAdminActivityLogs = lazy(() => import('./pages/super_admin/activity_logs.jsx'));
const SuperAdminCreators = lazy(() => import('./pages/super_admin/creators.jsx'));
const SuperAdminDashboard = lazy(() => import('./pages/super_admin/dashboard.jsx'));
const SuperAdminExpiring = lazy(() => import('./pages/super_admin/expiring.jsx'));
const SuperAdminLayout = lazy(() => import('./pages/super_admin/layout.jsx'));
const SuperAdminLogin = lazy(() => import('./pages/super_admin/login.jsx'));
const SuperAdminOrganizations = lazy(() => import('./pages/super_admin/organizations.jsx'));
const SuperAdminOrgForm = lazy(() => import('./pages/super_admin/org_form.jsx'));
const SuperAdminPayments = lazy(() => import('./pages/super_admin/payments.jsx'));
const SuperAdminPlans = lazy(() => import('./pages/super_admin/plans.jsx'));
const SuperAdminSettings = lazy(() => import('./pages/super_admin/settings.jsx'));
const SuperAdminUsers = lazy(() => import('./pages/super_admin/users.jsx'));
const SuperAdminViewOrganization = lazy(() => import('./pages/super_admin/view_organization.jsx'));
const LmsAssessmentsCbtPlayer = lazy(() => import('./pages/lms/assessments/cbt_player.jsx'));
const LmsAssessmentsEssayEditor = lazy(() => import('./pages/lms/assessments/essay_editor.jsx'));
const LmsAssessmentsFileSubmit = lazy(() => import('./pages/lms/assessments/file_submit.jsx'));
const LmsAssessmentsIndex = lazy(() => import('./pages/lms/assessments/index.jsx'));
const LmsAssessmentsVideoPlayer = lazy(() => import('./pages/lms/assessments/video_player.jsx'));
const LmsAssignmentsIndex = lazy(() => import('./pages/lms/assignments/index.jsx'));
const LmsAssignmentsView = lazy(() => import('./pages/lms/assignments/view.jsx'));
const LmsAttendanceIndex = lazy(() => import('./pages/lms/attendance/index.jsx'));
const LmsCareerIndex = lazy(() => import('./pages/lms/career/index.jsx'));
const LmsCareerLayout = lazy(() => import('./pages/lms/career/layout.jsx'));
const LmsCareerMockInterview = lazy(() => import('./pages/lms/career/mock_interview.jsx'));
const LmsCareerPortfolio = lazy(() => import('./pages/lms/career/portfolio.jsx'));
const LmsCareerResume = lazy(() => import('./pages/lms/career/resume.jsx'));
const LmsDashboard = lazy(() => import('./pages/lms/dashboard.jsx'));
const LmsFeesIndex = lazy(() => import('./pages/lms/fees/index.jsx'));
const LmsInternshipsApply = lazy(() => import('./pages/lms/internships/apply.jsx'));
const LmsInternshipsIndex = lazy(() => import('./pages/lms/internships/index.jsx'));
const LmsInternshipsWorkspace = lazy(() => import('./pages/lms/internships/workspace.jsx'));
const LmsLayout = lazy(() => import('./pages/lms/layout.jsx'));
const LmsLearnIndex = lazy(() => import('./pages/lms/learn/index.jsx'));
const LmsLogin = lazy(() => import('./pages/lms/login.jsx'));
const LmsMaterialsIndex = lazy(() => import('./pages/lms/materials/index.jsx'));
const LmsMaterialsWatchCourse = lazy(() => import('./pages/lms/materials/watch_course.jsx'));
const LmsObeIndex = lazy(() => import('./pages/lms/obe/index.jsx'));
const LmsPlacementsIndex = lazy(() => import('./pages/lms/placements/index.jsx'));
const LmsPortalCertificateRequests = lazy(() => import('./pages/lms/portal/certificate_requests.jsx'));
const LmsPortalComplaints = lazy(() => import('./pages/lms/portal/complaints.jsx'));
const LmsPortalDiary = lazy(() => import('./pages/lms/portal/diary.jsx'));
const LmsPortalExamApplications = lazy(() => import('./pages/lms/portal/exam_applications.jsx'));
const LmsPortalFeedback = lazy(() => import('./pages/lms/portal/feedback.jsx'));
const LmsPortalGradeCard = lazy(() => import('./pages/lms/portal/grade_card.jsx'));
const LmsPortalHostel = lazy(() => import('./pages/lms/portal/hostel.jsx'));
const LmsPortalSelfService = lazy(() => import('./pages/lms/portal/self_service.jsx'));
const LmsPortalTransport = lazy(() => import('./pages/lms/portal/transport.jsx'));
const LmsQuizzesExam = lazy(() => import('./pages/lms/quizzes/exam.jsx'));
const LmsQuizzesIndex = lazy(() => import('./pages/lms/quizzes/index.jsx'));
const LmsTimetableIndex = lazy(() => import('./pages/lms/timetable/index.jsx'));
const OrgAcademicsAcademicYears = lazy(() => import('./pages/org/academics/academic_years.jsx'));
const OrgAcademicsCohorts = lazy(() => import('./pages/org/academics/cohorts.jsx'));
const OrgAcademicsDashboard = lazy(() => import('./pages/org/academics/dashboard.jsx'));
const OrgAcademicsStudentAnalysis = lazy(() => import('./pages/org/academics/student_analysis.jsx'));
const OrgAcademicsDepartments = lazy(() => import('./pages/org/academics/departments.jsx'));
const OrgAcademicsPrograms = lazy(() => import('./pages/org/academics/programs.jsx'));
const OrgAcademicsRegulations = lazy(() => import('./pages/org/academics/regulations.jsx'));
const OrgAcademicsSections = lazy(() => import('./pages/org/academics/sections.jsx'));
const OrgAcademicsSemesters = lazy(() => import('./pages/org/academics/semesters.jsx'));
const OrgAcademicsSubjects = lazy(() => import('./pages/org/academics/subjects.jsx'));
const OrgAcademicsTimetableBuilder = lazy(() => import('./pages/org/academics/timetable_builder.jsx'));
const OrgAcademicsTimetableSchedules = lazy(() => import('./pages/org/academics/timetable_schedules.jsx'));
const OrgAcademicsTimetableTemplates = lazy(() => import('./pages/org/academics/timetable_templates.jsx'));
const OrgAccountsBanks = lazy(() => import('./pages/org/accounts/banks.jsx'));
const OrgAccountsDaybook = lazy(() => import('./pages/org/accounts/daybook.jsx'));
const OrgAccountsHeads = lazy(() => import('./pages/org/accounts/heads.jsx'));
const OrgAccountsIndex = lazy(() => import('./pages/org/accounts/index.jsx'));
const OrgAccountsPlStatement = lazy(() => import('./pages/org/accounts/pl_statement.jsx'));
const OrgAccountsTransactions = lazy(() => import('./pages/org/accounts/transactions.jsx'));
const OrgAdministrationAgents = lazy(() => import('./pages/org/administration/agents.jsx'));
const OrgAdministrationBankDetails = lazy(() => import('./pages/org/administration/bank_details.jsx'));
const OrgAdministrationCertificates = lazy(() => import('./pages/org/administration/certificates.jsx'));
const OrgAdministrationCollegeDetails = lazy(() => import('./pages/org/administration/college_details.jsx'));
const OrgAdministrationComplaints = lazy(() => import('./pages/org/administration/complaints.jsx'));
const OrgAdministrationDiary = lazy(() => import('./pages/org/administration/diary.jsx'));
const OrgAdministrationHolidays = lazy(() => import('./pages/org/administration/holidays.jsx'));
const OrgAdministrationIndex = lazy(() => import('./pages/org/administration/index.jsx'));
const OrgAdministrationLectureHalls = lazy(() => import('./pages/org/administration/lecture_halls.jsx'));
const OrgAdministrationLocations = lazy(() => import('./pages/org/administration/locations.jsx'));
const OrgAdministrationSettings = lazy(() => import('./pages/org/administration/settings.jsx'));
const OrgAdmissionsApplications = lazy(() => import('./pages/org/admissions/applications.jsx'));
const OrgAdmissionsCategories = lazy(() => import('./pages/org/admissions/categories.jsx'));
const OrgAdmissionsCollegeStrength = lazy(() => import('./pages/org/admissions/college_strength.jsx'));
const OrgAdmissionsDashboard = lazy(() => import('./pages/org/admissions/dashboard.jsx'));
const OrgAdmissionsJoiningAnalytics = lazy(() => import('./pages/org/admissions/joining_analytics.jsx'));
const OrgAdmissionsDetained = lazy(() => import('./pages/org/admissions/detained.jsx'));
const OrgAdmissionsDocuments = lazy(() => import('./pages/org/admissions/documents.jsx'));
const OrgAdmissionsEnrollment = lazy(() => import('./pages/org/admissions/enrollment.jsx'));
const OrgAdmissionsLeads = lazy(() => import('./pages/org/admissions/leads.jsx'));
const OrgAdmissionsOffers = lazy(() => import('./pages/org/admissions/offers.jsx'));
const OrgAdmissionsOfferLetterPdf = lazy(() => import('./pages/org/admissions/offer_letter_pdf.jsx'));
const OrgAdmissionsPayments = lazy(() => import('./pages/org/admissions/payments.jsx'));
const OrgAdmissionsScholarships = lazy(() => import('./pages/org/admissions/scholarships.jsx'));
const OrgAssessmentsCreate = lazy(() => import('./pages/org/assessments/create.jsx'));
const OrgAssessmentsGrade = lazy(() => import('./pages/org/assessments/grade.jsx'));
const OrgAssessmentsIndex = lazy(() => import('./pages/org/assessments/index.jsx'));
const OrgAssessmentsSubmissions = lazy(() => import('./pages/org/assessments/submissions.jsx'));
const OrgAssignmentsForm = lazy(() => import('./pages/org/assignments/form.jsx'));
const OrgAssignmentsIndex = lazy(() => import('./pages/org/assignments/index.jsx'));
const OrgAssignmentsSubmissions = lazy(() => import('./pages/org/assignments/submissions.jsx'));
const OrgAttendanceAdminDashboard = lazy(() => import('./pages/org/attendance/admin_dashboard.jsx'));
const OrgAttendanceFacultyDashboard = lazy(() => import('./pages/org/attendance/faculty_dashboard.jsx'));
const OrgAttendanceIndex = lazy(() => import('./pages/org/attendance/index.jsx'));
const OrgAttendanceMarkSession = lazy(() => import('./pages/org/attendance/mark_session.jsx'));
const OrgAttendanceReport = lazy(() => import('./pages/org/attendance/report.jsx'));
const OrgAttendanceTake = lazy(() => import('./pages/org/attendance/take.jsx'));
const OrgCertificatesGenerate = lazy(() => import('./pages/org/certificates/generate.jsx'));
const OrgCertificatesPrintSlip = lazy(() => import('./pages/org/certificates/print_slip.jsx'));
const OrgCertificatesTemplates = lazy(() => import('./pages/org/certificates/templates.jsx'));
const OrgCorrespondenceFestivals = lazy(() => import('./pages/org/correspondence/festivals.jsx'));
const OrgCorrespondenceIndex = lazy(() => import('./pages/org/correspondence/index.jsx'));
const OrgCorrespondenceTemplates = lazy(() => import('./pages/org/correspondence/templates.jsx'));
const OrgDashboard = lazy(() => import('./pages/org/dashboard.jsx'));
const OrgExaminationsApplications = lazy(() => import('./pages/org/examinations/applications.jsx'));
const OrgExaminationsBacklogs = lazy(() => import('./pages/org/examinations/backlogs.jsx'));
const OrgExaminationsExternalRegistrations = lazy(() => import('./pages/org/examinations/external_registrations.jsx'));
const OrgExaminationsFinance = lazy(() => import('./pages/org/examinations/finance.jsx'));
const OrgExaminationsHallTickets = lazy(() => import('./pages/org/examinations/hall_tickets.jsx'));
const OrgExaminationsIndex = lazy(() => import('./pages/org/examinations/index.jsx'));
const OrgExaminationsInvigilation = lazy(() => import('./pages/org/examinations/invigilation.jsx'));
const OrgExaminationsMarksEnter = lazy(() => import('./pages/org/examinations/marks_enter.jsx'));
const OrgExaminationsMarksEntry = lazy(() => import('./pages/org/examinations/marks_entry.jsx'));
const OrgExaminationsPrintHallTicket = lazy(() => import('./pages/org/examinations/print_hall_ticket.jsx'));
const OrgExaminationsReports = lazy(() => import('./pages/org/examinations/reports.jsx'));
const OrgExaminationsSchedules = lazy(() => import('./pages/org/examinations/schedules.jsx'));
const OrgExaminationsSetPapers = lazy(() => import('./pages/org/examinations/set_papers.jsx'));
const OrgFacultyAllocations = lazy(() => import('./pages/org/academics/allocations.jsx'));
const OrgFacultyClassTeacherMonitor = lazy(() => import('./pages/faculty/class_teacher_monitor.jsx'));
const OrgFacultyProfiles = lazy(() => import('./pages/faculty/profiles.jsx'));
const OrgFacultyDashboard = lazy(() => import('./pages/faculty/dashboard.jsx'));
const OrgFacultyLogin = lazy(() => import('./pages/org/faculty_login.jsx'));
const FacultyAllocations = lazy(() => import('./pages/faculty/allocations.jsx'));
const FacultyAssignments = lazy(() => import('./pages/faculty/assignments.jsx'));
const FacultyAttainment = lazy(() => import('./pages/faculty/attainment.jsx'));
const FacultyAttendance = lazy(() => import('./pages/faculty/attendance.jsx'));
const FacultyClassTeacherMonitor = lazy(() => import('./pages/faculty/class_teacher_monitor.jsx'));
const FacultyCoPoMatrix = lazy(() => import('./pages/faculty/co_po_matrix.jsx'));
const FacultyDashboard = lazy(() => import('./pages/faculty/dashboard.jsx'));
const FacultyLeaves = lazy(() => import('./pages/faculty/leaves.jsx'));
const FacultyMarks = lazy(() => import('./pages/faculty/marks.jsx'));
const FacultyMaterials = lazy(() => import('./pages/faculty/materials.jsx'));
const FacultyPoSetup = lazy(() => import('./pages/faculty/po_setup.jsx'));
const FacultyProfiles = lazy(() => import('./pages/faculty/profiles.jsx'));
const FacultySubjects = lazy(() => import('./pages/faculty/subjects.jsx'));
const FacultyTimetable = lazy(() => import('./pages/faculty/timetable.jsx'));
const OrgFeesMatrix = lazy(() => import('./pages/org/fees/matrix.jsx'));
const OrgFeesInvoicing = lazy(() => import('./pages/org/fees/invoicing.jsx'));
const OrgFeesCollections = lazy(() => import('./pages/org/fees/collections.jsx'));
const OrgFeesDuesList = lazy(() => import('./pages/org/fees/dues_list.jsx'));
const OrgFeesManualAssign = lazy(() => import('./pages/org/fees/manual_assign.jsx'));
const OrgFeesProgramBatches = lazy(() => import('./pages/org/fees/program_batches.jsx'));
const OrgFeesReceiptPdf = lazy(() => import('./pages/org/fees/receipt_pdf.jsx'));
const OrgFeesSemesterPlan = lazy(() => import('./pages/org/fees/semester_plan.jsx'));
const OrgFeesStructures = lazy(() => import('./pages/org/fees/structures.jsx'));
const OrgFeesTypes = lazy(() => import('./pages/org/fees/types.jsx'));
const OrgFrontOfficeCallLogs = lazy(() => import('./pages/org/front_office/call_logs.jsx'));
const OrgFrontOfficeEnquiries = lazy(() => import('./pages/org/front_office/enquiries.jsx'));
const OrgFrontOfficeIndex = lazy(() => import('./pages/org/front_office/index.jsx'));
const OrgFrontOfficePassPrint = lazy(() => import('./pages/org/front_office/pass_print.jsx'));
const OrgFrontOfficePostal = lazy(() => import('./pages/org/front_office/postal.jsx'));
const OrgFrontOfficeVisitors = lazy(() => import('./pages/org/front_office/visitors.jsx'));
const OrgHostelIndex = lazy(() => import('./pages/org/hostel/index.jsx'));
const OrgHostelOutings = lazy(() => import('./pages/org/hostel/outings.jsx'));
const OrgHostelRegistrations = lazy(() => import('./pages/org/hostel/registrations.jsx'));
const OrgHostelRooms = lazy(() => import('./pages/org/hostel/rooms.jsx'));
const OrgHrAppraisalsIndex = lazy(() => import('./pages/org/hr/appraisals/index.jsx'));
const OrgHrEmployeesIndex = lazy(() => import('./pages/org/hr/employees/index.jsx'));
const OrgHrLeavesIndex = lazy(() => import('./pages/org/hr/leaves/index.jsx'));
const OrgHrPayrollComponents = lazy(() => import('./pages/org/hr/payroll/components.jsx'));
const OrgHrPayrollIndex = lazy(() => import('./pages/org/hr/payroll/index.jsx'));
const OrgHrPayrollPayslips = lazy(() => import('./pages/org/hr/payroll/payslips.jsx'));
const OrgHrPayrollStructures = lazy(() => import('./pages/org/hr/payroll/structures.jsx'));
const OrgHrSettingsIndex = lazy(() => import('./pages/org/hr/settings/index.jsx'));
const OrgInternshipsApplications = lazy(() => import('./pages/org/internships/applications.jsx'));
const OrgInternshipsCreatePosting = lazy(() => import('./pages/org/internships/create_posting.jsx'));
const OrgInternshipsFacultyMentorship = lazy(() => import('./pages/org/internships/faculty_mentorship.jsx'));
const OrgInternshipsIndex = lazy(() => import('./pages/org/internships/index.jsx'));
const OrgInternshipsReviewStudent = lazy(() => import('./pages/org/internships/review_student.jsx'));
const OrgInternshipsTpoAudit = lazy(() => import('./pages/org/internships/tpo_audit.jsx'));
const OrgLayout = lazy(() => import('./pages/org/layout.jsx'));
const OrgLmsCourses = lazy(() => import('./pages/org/lms/courses.jsx'));
const OrgLibraryBooks = lazy(() => import('./pages/org/library/books.jsx'));
const OrgLibraryCategories = lazy(() => import('./pages/org/library/categories.jsx'));
const OrgLibraryIndex = lazy(() => import('./pages/org/library/index.jsx'));
const OrgLibraryIssues = lazy(() => import('./pages/org/library/issues.jsx'));
const OrgLibraryMembers = lazy(() => import('./pages/org/library/members.jsx'));
const OrgLibraryPeriodicals = lazy(() => import('./pages/org/library/periodicals.jsx'));
const OrgLibraryStock = lazy(() => import('./pages/org/library/stock.jsx'));
const OrgLibrarySuppliers = lazy(() => import('./pages/org/library/suppliers.jsx'));
const OrgLogin = lazy(() => import('./pages/org/login.jsx'));
const OrgMarksAuditTrail = lazy(() => import('./pages/org/marks/audit_trail.jsx'));
const OrgMarksComponents = lazy(() => import('./pages/org/marks/components.jsx'));
const OrgMarksFacultyMarksEntry = lazy(() => import('./pages/org/marks/faculty_marks_entry.jsx'));
const OrgMaterialsForm = lazy(() => import('./pages/org/materials/form.jsx'));
const OrgMaterialsIndex = lazy(() => import('./pages/org/materials/index.jsx'));
const OrgMisDashboard = lazy(() => import('./pages/org/mis/dashboard.jsx'));
const OrgMisReports = lazy(() => import('./pages/org/mis/reports.jsx'));
const OrgObeAdminComponentsSetup = lazy(() => import('./pages/org/obe/admin_components_setup.jsx'));
const OrgObeAdminPoSetup = lazy(() => import('./pages/org/obe/admin_po_setup.jsx'));
const OrgObeAssessmentConfig = lazy(() => import('./pages/org/obe/assessment_config.jsx'));
const OrgObeAttainmentReport = lazy(() => import('./pages/org/obe/attainment_report.jsx'));
const OrgObeFacultyCoSetup = lazy(() => import('./pages/org/obe/faculty_co_setup.jsx'));
const OrgObeFacultyMappingMatrix = lazy(() => import('./pages/org/obe/faculty_mapping_matrix.jsx'));
const OrgObeFacultyMarksEntry = lazy(() => import('./pages/org/obe/faculty_marks_entry.jsx'));
const OrgObeGapAnalysis = lazy(() => import('./pages/org/obe/gap_analysis.jsx'));
const OrgObePoReport = lazy(() => import('./pages/org/obe/po_report.jsx'));
const OrgObeTargetsSetup = lazy(() => import('./pages/org/obe/targets_setup.jsx'));
const OrgPlacementsApplications = lazy(() => import('./pages/org/placements/applications.jsx'));
const OrgPlacementsCompanies = lazy(() => import('./pages/org/placements/companies.jsx'));
const OrgPlacementsDrives = lazy(() => import('./pages/org/placements/drives.jsx'));
const OrgPlacementsIndex = lazy(() => import('./pages/org/placements/index.jsx'));
const OrgPlacementsInternships = lazy(() => import('./pages/org/placements/internships.jsx'));
const OrgPlacementsOffers = lazy(() => import('./pages/org/placements/offers.jsx'));
const OrgQuizzesBuilder = lazy(() => import('./pages/org/quizzes/builder.jsx'));
const OrgQuizzesForm = lazy(() => import('./pages/org/quizzes/form.jsx'));
const OrgQuizzesIndex = lazy(() => import('./pages/org/quizzes/index.jsx'));
const OrgQuizzesResults = lazy(() => import('./pages/org/quizzes/results.jsx'));
const OrgStaffCertificates = lazy(() => import('./pages/org/staff/certificates.jsx'));
const OrgStaffChecklists = lazy(() => import('./pages/org/staff/checklists.jsx'));
const OrgStaffDirectory = lazy(() => import('./pages/org/staff/directory.jsx'));
const OrgStaffDuties = lazy(() => import('./pages/org/staff/duties.jsx'));
const OrgStudentsBulkPromote = lazy(() => import('./pages/org/students/bulk_promote.jsx'));
const OrgStudentsCreateEdit = lazy(() => import('./pages/org/students/create_edit.jsx'));
const OrgStudentsImport = lazy(() => import('./pages/org/students/import.jsx'));
const OrgStudentsIndex = lazy(() => import('./pages/org/students/index.jsx'));
const OrgStudentsParents = lazy(() => import('./pages/org/students/parents.jsx'));
const OrgStudentsProfile = lazy(() => import('./pages/org/students/profile.jsx'));
const OrgSystemsAccessGroups = lazy(() => import('./pages/org/systems/access_groups.jsx'));
const OrgSystemsAccessGroupForm = lazy(() => import('./pages/org/systems/access_group_form.jsx'));
const OrgSystemsSettings = lazy(() => import('./pages/org/systems/settings.jsx'));
const OrgSystemsUsers = lazy(() => import('./pages/org/systems/users.jsx'));
const OrgTimetableBuilder = lazy(() => import('./pages/org/timetable/builder.jsx'));
const OrgTimetableIndex = lazy(() => import('./pages/org/timetable/index.jsx'));
const OrgTimetablePeriods = lazy(() => import('./pages/org/timetable/periods.jsx'));
const OrgTransportHalts = lazy(() => import('./pages/org/transport/halts.jsx'));
const OrgTransportLogbook = lazy(() => import('./pages/org/transport/logbook.jsx'));
const OrgTransportRoutes = lazy(() => import('./pages/org/transport/routes.jsx'));
const OrgTransportSubscriptions = lazy(() => import('./pages/org/transport/subscriptions.jsx'));
const OrgTransportVehicles = lazy(() => import('./pages/org/transport/vehicles.jsx'));
const ParentAssignments = lazy(() => import('./pages/parent/assignments.jsx'));
const ParentAttendance = lazy(() => import('./pages/parent/attendance.jsx'));
const ParentDashboard = lazy(() => import('./pages/parent/dashboard.jsx'));
const ParentFees = lazy(() => import('./pages/parent/fees.jsx'));
const ParentLayout = lazy(() => import('./pages/parent/layout.jsx'));
const ParentLogin = lazy(() => import('./pages/parent/login.jsx'));
const ParentMarks = lazy(() => import('./pages/parent/marks.jsx'));
const ParentTimetable = lazy(() => import('./pages/parent/timetable.jsx'));
const CreatorBuilder = lazy(() => import('./pages/creator/builder.jsx'));
const CreatorCourses = lazy(() => import('./pages/creator/courses.jsx'));
const CreatorCreate = lazy(() => import('./pages/creator/create.jsx'));
const CreatorLayout = lazy(() => import('./pages/creator/layout.jsx'));
const CreatorLogin = lazy(() => import('./pages/creator/login.jsx'));
const CreatorPreview = lazy(() => import('./pages/creator/preview.jsx'));
const SupervisorInvalidToken = lazy(() => import('./pages/supervisor/invalid_token.jsx'));
const SupervisorPortal = lazy(() => import('./pages/supervisor/portal.jsx'));
const ExecutiveAnalyticsLayout = lazy(() => import('./pages/analytics/layout.jsx'));


const PageLoader = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    width: '100%',
    padding: '40px 20px',
    color: '#6366f1',
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid rgba(99, 102, 241, 0.15)',
      borderTopColor: '#6366f1',
      borderRadius: '50%',
      animation: 'unilmsSpin 0.75s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite'
    }} />
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes unilmsSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    ` }} />
  </div>
);

const AppRoutes = () => {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route path="/" element={<Gateway />} />
        <Route path="/unilms" element={<Navigate to="/" replace />} />
        <Route path="/unilms/" element={<Navigate to="/" replace />} />

        {/* Clean Direct Portal Routes */}
        <Route path="/org/login" element={<OrgLogin />} />
        <Route path="/lms/login" element={<LmsLogin />} />
        <Route path="/parent/login" element={<ParentLogin />} />
        <Route path="/creator/login" element={<CreatorLogin />} />
        <Route path="/superadmin/login" element={<SuperAdminLogin />} />
        <Route path="/super-admin/login" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/super_admin/login" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/faculty/login" element={<Navigate to="/org/login" replace />} />

        {/* Clean Portal Shortcuts */}
        <Route path="/org" element={<Navigate to="/org/login" replace />} />
        <Route path="/lms" element={<Navigate to="/lms/login" replace />} />
        <Route path="/parent" element={<Navigate to="/parent/login" replace />} />
        <Route path="/creator" element={<Navigate to="/creator/login" replace />} />
        <Route path="/superadmin" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/super_admin" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/super-admin" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/faculty" element={<Navigate to="/org/login" replace />} />

        {/* Backward Compatibility: Redirect /unilms/ logins to clean URLs */}
        <Route path="/unilms/super_admin" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/unilms/super-admin" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/unilms/superadmin" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/unilms/lms" element={<Navigate to="/lms/login" replace />} />
        <Route path="/unilms/faculty" element={<Navigate to="/org/login" replace />} />
        <Route path="/unilms/org" element={<Navigate to="/org/login" replace />} />
        <Route path="/unilms/parent" element={<Navigate to="/parent/login" replace />} />
        <Route path="/unilms/creator" element={<Navigate to="/creator/login" replace />} />
        <Route path="/unilms/superadmin/login" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/unilms/super-admin/login" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/unilms/super_admin/login" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/unilms/lms/login" element={<Navigate to="/lms/login" replace />} />
        <Route path="/unilms/org/login" element={<Navigate to="/org/login" replace />} />
        <Route path="/unilms/parent/login" element={<Navigate to="/parent/login" replace />} />
        <Route path="/unilms/creator/login" element={<Navigate to="/creator/login" replace />} />
        <Route path="/unilms/faculty/login" element={<Navigate to="/org/login" replace />} />
        
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} fallbackLogin="/unilms/superadmin/login" />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/unilms/superadmin/activity_logs" element={<SuperAdminActivityLogs />} />
            <Route path="/unilms/superadmin/creators" element={<SuperAdminCreators />} />
            <Route path="/unilms/superadmin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/unilms/superadmin/expiring" element={<SuperAdminExpiring />} />
            <Route path="/unilms/superadmin/organizations" element={<SuperAdminOrganizations />} />
            <Route path="/unilms/superadmin/org_form" element={<SuperAdminOrgForm />} />
            <Route path="/unilms/superadmin/payments" element={<SuperAdminPayments />} />
            <Route path="/unilms/superadmin/plans" element={<SuperAdminPlans />} />
            <Route path="/unilms/superadmin/settings" element={<SuperAdminSettings />} />
            <Route path="/unilms/superadmin/users" element={<SuperAdminUsers />} />
            <Route path="/unilms/superadmin/view_organization" element={<SuperAdminViewOrganization />} />

            {/* Canonical aliases (/super-admin/* & /super_admin/*) redirecting to /superadmin/* */}
            <Route path="/unilms/super-admin/:path" element={<SuperAdminRedirect />} />
            <Route path="/unilms/super_admin/:path" element={<SuperAdminRedirect />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin', 'campus_admin', 'super_admin']} fallbackLogin="/unilms/org/login" />}>
          <Route element={<ExecutiveAnalyticsLayout />}>
            <Route path="/unilms/analytics" element={<OrgMisDashboard />} />
            <Route path="/unilms/analytics/dashboard" element={<OrgMisDashboard />} />
            <Route path="/unilms/analytics/mis" element={<OrgMisDashboard />} />
            <Route path="/unilms/analytics/joining_analytics" element={<OrgAdmissionsJoiningAnalytics />} />
            <Route path="/unilms/analytics/funnel" element={<OrgAdmissionsJoiningAnalytics />} />
            <Route path="/unilms/analytics/student_analysis" element={<OrgAcademicsStudentAnalysis />} />
            <Route path="/unilms/analytics/at_risk" element={<OrgAcademicsStudentAnalysis />} />
            <Route path="/unilms/analytics/reports" element={<OrgMisReports />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['student', 'admin', 'campus_admin', 'super_admin']} fallbackLogin="/unilms/lms/login" />}>
          <Route element={<LmsCareerLayout />}>
            <Route path="/unilms/lms/learn" element={<LmsLearnIndex />} />
            <Route path="/unilms/lms/career" element={<LmsCareerIndex />} />
            <Route path="/unilms/lms/career/mock_interview" element={<LmsCareerMockInterview />} />
            <Route path="/unilms/lms/career/portfolio" element={<LmsCareerPortfolio />} />
            <Route path="/unilms/lms/career/resume" element={<LmsCareerResume />} />
          </Route>
          <Route element={<LmsLayout />}>
            <Route path="/unilms/lms/assessments/cbt_player" element={<LmsAssessmentsCbtPlayer />} />
            <Route path="/unilms/lms/assessments/essay_editor" element={<LmsAssessmentsEssayEditor />} />
            <Route path="/unilms/lms/assessments/file_submit" element={<LmsAssessmentsFileSubmit />} />
            <Route path="/unilms/lms/assessments" element={<LmsAssessmentsIndex />} />
            <Route path="/unilms/lms/assessments/video_player" element={<LmsAssessmentsVideoPlayer />} />
            <Route path="/unilms/lms/assignments" element={<LmsAssignmentsIndex />} />
            <Route path="/unilms/lms/assignments/view" element={<LmsAssignmentsView />} />
            <Route path="/unilms/lms/attendance" element={<LmsAttendanceIndex />} />
            <Route path="/unilms/lms/dashboard" element={<LmsDashboard />} />
            <Route path="/unilms/lms/fees" element={<LmsFeesIndex />} />
            <Route path="/unilms/lms/internships/apply" element={<LmsInternshipsApply />} />
            <Route path="/unilms/lms/internships" element={<LmsInternshipsIndex />} />
            <Route path="/unilms/lms/internships/workspace" element={<LmsInternshipsWorkspace />} />
            <Route path="/unilms/lms/materials" element={<LmsMaterialsIndex />} />
            <Route path="/unilms/lms/materials/watch_course" element={<LmsMaterialsWatchCourse />} />
            <Route path="/unilms/lms/obe" element={<LmsObeIndex />} />
            <Route path="/unilms/lms/placements" element={<LmsPlacementsIndex />} />
            <Route path="/unilms/lms/portal/certificate_requests" element={<LmsPortalCertificateRequests />} />
            <Route path="/unilms/lms/portal/complaints" element={<LmsPortalComplaints />} />
            <Route path="/unilms/lms/portal/diary" element={<LmsPortalDiary />} />
            <Route path="/unilms/lms/portal/exam_applications" element={<LmsPortalExamApplications />} />
            <Route path="/unilms/lms/portal/feedback" element={<LmsPortalFeedback />} />
            <Route path="/unilms/lms/portal/grade_card" element={<LmsPortalGradeCard />} />
            <Route path="/unilms/lms/portal/hostel" element={<LmsPortalHostel />} />
            <Route path="/unilms/lms/portal/self_service" element={<LmsPortalSelfService />} />
            <Route path="/unilms/lms/portal/transport" element={<LmsPortalTransport />} />
            <Route path="/unilms/lms/quizzes/exam" element={<LmsQuizzesExam />} />
            <Route path="/unilms/lms/quizzes" element={<LmsQuizzesIndex />} />
            <Route path="/unilms/lms/timetable" element={<LmsTimetableIndex />} />
          </Route>
        </Route>
        <Route path="/unilms/faculty/login" element={<OrgFacultyLogin />} />

        {/* Dedicated Faculty Workspace Routes (Protected for Faculty and Admin) */}
        <Route element={<ProtectedRoute allowedRoles={['faculty', 'admin', 'campus_admin', 'super_admin']} fallbackLogin="/unilms/faculty/login" />}>
          <Route element={<OrgLayout />}>
            <Route path="/unilms/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/unilms/faculty/subjects" element={<FacultySubjects />} />
            <Route path="/unilms/faculty/attendance" element={<FacultyAttendance />} />
            <Route path="/unilms/faculty/assignments" element={<FacultyAssignments />} />
            <Route path="/unilms/faculty/materials" element={<FacultyMaterials />} />
            <Route path="/unilms/faculty/materials/form" element={<FacultyMaterials defaultView="create" />} />
            <Route path="/unilms/faculty/materials/create" element={<FacultyMaterials defaultView="create" />} />
            <Route path="/unilms/faculty/materials/edit/:id" element={<FacultyMaterials defaultView="create" />} />
            <Route path="/unilms/faculty/marks" element={<FacultyMarks />} />
            <Route path="/unilms/faculty/timetable" element={<FacultyTimetable />} />
            <Route path="/unilms/faculty/po_setup" element={<FacultyPoSetup />} />
            <Route path="/unilms/faculty/po-setup" element={<FacultyPoSetup />} />
            <Route path="/unilms/faculty/co_po_matrix" element={<FacultyCoPoMatrix />} />
            <Route path="/unilms/faculty/attainment" element={<FacultyAttainment />} />
            <Route path="/unilms/faculty/leaves" element={<FacultyLeaves />} />
            <Route path="/unilms/faculty/profiles" element={<FacultyProfiles />} />

            {/* Org Faculty Mirrors for Full Compatibility */}
            <Route path="/unilms/org/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/unilms/org/faculty_dashboard" element={<FacultyDashboard />} />
            <Route path="/unilms/org/faculty/subjects" element={<FacultySubjects />} />
            <Route path="/unilms/org/faculty/attendance" element={<FacultyAttendance />} />
            <Route path="/unilms/org/faculty/assignments" element={<FacultyAssignments />} />
            <Route path="/unilms/org/faculty/materials" element={<FacultyMaterials />} />
            <Route path="/unilms/org/faculty/materials/form" element={<FacultyMaterials defaultView="create" />} />
            <Route path="/unilms/org/faculty/materials/create" element={<FacultyMaterials defaultView="create" />} />
            <Route path="/unilms/org/faculty/marks" element={<FacultyMarks />} />
            <Route path="/unilms/org/faculty/timetable" element={<FacultyTimetable />} />
            <Route path="/unilms/org/faculty/po_setup" element={<FacultyPoSetup />} />
            <Route path="/unilms/org/faculty/co_po_matrix" element={<FacultyCoPoMatrix />} />
            <Route path="/unilms/org/faculty/attainment" element={<FacultyAttainment />} />
            <Route path="/unilms/org/faculty/leaves" element={<FacultyLeaves />} />
            <Route path="/unilms/org/faculty/profiles" element={<FacultyProfiles />} />
          </Route>
        </Route>

        {/* HOD Leadership Workspace (Strictly Guarded for HODs) */}
        <Route element={<ProtectedRoute allowedRoles={['faculty', 'admin', 'campus_admin', 'super_admin']} requiredPrivilege="hod" fallbackLogin="/unilms/faculty/login" />}>
          <Route element={<OrgLayout />}>
            <Route path="/unilms/faculty/allocations" element={<FacultyAllocations />} />
            <Route path="/unilms/org/faculty/allocations" element={<OrgFacultyAllocations />} />
          </Route>
        </Route>

        {/* Class Teacher Proctoring Workspace (Strictly Guarded for Assigned Class Teachers) */}
        <Route element={<ProtectedRoute allowedRoles={['faculty', 'admin', 'campus_admin', 'super_admin']} requiredPrivilege="class_teacher" fallbackLogin="/unilms/faculty/login" />}>
          <Route element={<OrgLayout />}>
            <Route path="/unilms/faculty/class_teacher_monitor" element={<FacultyClassTeacherMonitor />} />
            <Route path="/unilms/org/faculty/class_teacher_monitor" element={<FacultyClassTeacherMonitor />} />
          </Route>
        </Route>

        {/* Institutional ERP Administrative Desks (Protected by Role & Access Groups via OrgLayout RBAC) */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'campus_admin', 'super_admin', 'staff', 'faculty']} fallbackLogin="/unilms/org/login" />}>
          <Route element={<OrgLayout />}>
          <Route path="/unilms/org/academics" element={<OrgAcademicsDashboard />} />
          <Route path="/unilms/org/academics/academic_years" element={<OrgAcademicsAcademicYears />} />
          <Route path="/unilms/org/academics/cohorts" element={<OrgAcademicsCohorts />} />
          <Route path="/unilms/org/academics/dashboard" element={<OrgAcademicsDashboard />} />
          <Route path="/unilms/org/academics/student_analysis" element={<OrgAcademicsStudentAnalysis />} />
          <Route path="/unilms/org/academics/student-analysis" element={<OrgAcademicsStudentAnalysis />} />
          <Route path="/unilms/org/students/analysis" element={<OrgAcademicsStudentAnalysis />} />
          <Route path="/unilms/org/academics/departments" element={<OrgAcademicsDepartments />} />
          <Route path="/unilms/org/academics/programs" element={<OrgAcademicsPrograms />} />
          <Route path="/unilms/org/academics/regulations" element={<OrgAcademicsRegulations />} />
          <Route path="/unilms/org/academics/sections" element={<OrgAcademicsSections />} />
          <Route path="/unilms/org/academics/semesters" element={<OrgAcademicsSemesters />} />
          <Route path="/unilms/org/academics/subjects" element={<OrgAcademicsSubjects />} />
          <Route path="/unilms/org/academics/faculty/allocations" element={<OrgFacultyAllocations />} />
          <Route path="/unilms/org/academice/faculty/allocations" element={<OrgFacultyAllocations />} />
          <Route path="/unilms/org/academics/allocations" element={<OrgFacultyAllocations />} />
          <Route path="/unilms/org/academics/faculty_allocations" element={<OrgFacultyAllocations />} />
          <Route path="/unilms/org/academics/timetable_builder" element={<OrgTimetableBuilder />} />
          <Route path="/unilms/org/academics/timetable_schedules" element={<OrgTimetableIndex />} />
          <Route path="/unilms/org/academics/timetable_templates" element={<OrgTimetablePeriods />} />
          <Route path="/unilms/org/accounts/banks" element={<OrgAccountsBanks />} />
          <Route path="/unilms/org/accounts/daybook" element={<OrgAccountsDaybook />} />
          <Route path="/unilms/org/accounts/heads" element={<OrgAccountsHeads />} />
          <Route path="/unilms/org/accounts" element={<OrgAccountsIndex />} />
          <Route path="/unilms/org/accounts/pl_statement" element={<OrgAccountsPlStatement />} />
          <Route path="/unilms/org/accounts/pl-statement" element={<OrgAccountsPlStatement />} />
          <Route path="/unilms/org/accounts/transactions" element={<OrgAccountsTransactions />} />
          <Route path="/unilms/org/administration/agents" element={<OrgAdministrationAgents />} />
          <Route path="/unilms/org/administration/bank_details" element={<OrgAdministrationBankDetails />} />
          <Route path="/unilms/org/administration/bank-details" element={<OrgAdministrationBankDetails />} />
          <Route path="/unilms/org/administration/certificates" element={<OrgAdministrationCertificates />} />
          <Route path="/unilms/org/administration/college_details" element={<OrgAdministrationCollegeDetails />} />
          <Route path="/unilms/org/administration/college-details" element={<OrgAdministrationCollegeDetails />} />
          <Route path="/unilms/org/administration/complaints" element={<OrgAdministrationComplaints />} />
          <Route path="/unilms/org/administration/diary" element={<OrgAdministrationDiary />} />
          <Route path="/unilms/org/administration/holidays" element={<OrgAdministrationHolidays />} />
          <Route path="/unilms/org/administration" element={<OrgAdministrationIndex />} />
          <Route path="/unilms/org/administration/lecture_halls" element={<OrgAdministrationLectureHalls />} />
          <Route path="/unilms/org/administration/lecture-halls" element={<OrgAdministrationLectureHalls />} />
          <Route path="/unilms/org/administration/locations" element={<OrgAdministrationLocations />} />
          <Route path="/unilms/org/administration/settings" element={<OrgAdministrationSettings />} />
          <Route path="/unilms/org/admissions/applications" element={<OrgAdmissionsApplications />} />
          <Route path="/unilms/org/admissions/categories" element={<OrgAdmissionsCategories />} />
          <Route path="/unilms/org/admissions/college_strength" element={<OrgAdmissionsCollegeStrength />} />
          <Route path="/unilms/org/admissions/dashboard" element={<OrgAdmissionsDashboard />} />
          <Route path="/unilms/org/admissions/joining_analytics" element={<OrgAdmissionsJoiningAnalytics />} />
          <Route path="/unilms/org/admissions/joining-analytics" element={<OrgAdmissionsJoiningAnalytics />} />
          <Route path="/unilms/org/admissions/funnel" element={<OrgAdmissionsJoiningAnalytics />} />
          <Route path="/unilms/org/admissions/detained" element={<OrgAdmissionsDetained />} />
          <Route path="/unilms/org/admissions/documents" element={<OrgAdmissionsDocuments />} />
          <Route path="/unilms/org/admissions/enrollment" element={<OrgAdmissionsEnrollment />} />
          <Route path="/unilms/org/admissions/leads" element={<OrgAdmissionsLeads />} />
          <Route path="/unilms/org/admissions/offers" element={<OrgAdmissionsOffers />} />
          <Route path="/unilms/org/admissions/offer_letter_pdf" element={<OrgAdmissionsOfferLetterPdf />} />
          <Route path="/unilms/org/admissions/payments" element={<OrgAdmissionsPayments />} />
          <Route path="/unilms/org/admissions/scholarships" element={<OrgAdmissionsScholarships />} />
          <Route path="/unilms/org/assessments/create" element={<OrgAssessmentsCreate />} />
          <Route path="/unilms/org/assessments/grade" element={<OrgAssessmentsGrade />} />
          <Route path="/unilms/org/assessments" element={<OrgAssessmentsIndex />} />
          <Route path="/unilms/org/assessments/submissions" element={<OrgAssessmentsSubmissions />} />
          <Route path="/unilms/org/assignments/form" element={<OrgAssignmentsForm />} />
          <Route path="/unilms/org/assignments" element={<OrgAssignmentsIndex />} />
          <Route path="/unilms/org/assignments/submissions" element={<OrgAssignmentsSubmissions />} />
          <Route path="/unilms/org/attendance/admin_dashboard" element={<OrgAttendanceAdminDashboard />} />
          <Route path="/unilms/org/attendance/faculty_dashboard" element={<OrgAttendanceFacultyDashboard />} />
          <Route path="/unilms/org/attendance" element={<OrgAttendanceIndex />} />
          <Route path="/unilms/org/attendance/mark_session" element={<OrgAttendanceMarkSession />} />
          <Route path="/unilms/org/attendance/mark-session" element={<OrgAttendanceMarkSession />} />
          <Route path="/unilms/org/attendance/report" element={<OrgAttendanceReport />} />
          <Route path="/unilms/org/attendance/take" element={<OrgAttendanceTake />} />
          <Route path="/unilms/org/certificates/generate" element={<OrgCertificatesGenerate />} />
          <Route path="/unilms/org/certificates/print_slip" element={<OrgCertificatesPrintSlip />} />
          <Route path="/unilms/org/certificates/templates" element={<OrgCertificatesTemplates />} />
          <Route path="/unilms/org/correspondence/festivals" element={<OrgCorrespondenceFestivals />} />
          <Route path="/unilms/org/correspondence" element={<OrgCorrespondenceIndex />} />
          <Route path="/unilms/org/correspondence/templates" element={<OrgCorrespondenceTemplates />} />
          <Route path="/unilms/org/dashboard" element={<OrgDashboard />} />
          <Route path="/unilms/org/examinations/applications" element={<OrgExaminationsApplications />} />
          <Route path="/unilms/org/examinations/backlogs" element={<OrgExaminationsBacklogs />} />
          <Route path="/unilms/org/examinations/external_registrations" element={<OrgExaminationsExternalRegistrations />} />
          <Route path="/unilms/org/examinations/finance" element={<OrgExaminationsFinance />} />
          <Route path="/unilms/org/examinations/hall_tickets" element={<OrgExaminationsHallTickets />} />
          <Route path="/unilms/org/examinations" element={<OrgExaminationsIndex />} />
          <Route path="/unilms/org/examinations/invigilation" element={<OrgExaminationsInvigilation />} />
          <Route path="/unilms/org/examinations/marks_enter" element={<OrgExaminationsMarksEnter />} />
          <Route path="/unilms/org/examinations/marks_entry" element={<OrgExaminationsMarksEntry />} />
          <Route path="/unilms/org/examinations/print_hall_ticket" element={<OrgExaminationsPrintHallTicket />} />
          <Route path="/unilms/org/examinations/reports" element={<OrgExaminationsReports />} />
          <Route path="/unilms/org/examinations/schedules" element={<OrgExaminationsSchedules />} />
          <Route path="/unilms/org/examinations/set_papers" element={<OrgExaminationsSetPapers />} />
          <Route path="/unilms/org/fees/dashboard" element={<Navigate to="/unilms/org/fees/matrix" replace />} />
          <Route path="/unilms/org/fees" element={<Navigate to="/unilms/org/fees/matrix" replace />} />
          <Route path="/org/fees/dashboard" element={<Navigate to="/unilms/org/fees/matrix" replace />} />
          <Route path="/org/fees" element={<Navigate to="/unilms/org/fees/matrix" replace />} />
          <Route path="/unilms/org/fees/matrix" element={<OrgFeesMatrix />} />
          <Route path="/unilms/org/fees/invoicing" element={<OrgFeesInvoicing />} />
          <Route path="/unilms/org/fees/collections" element={<OrgFeesCollections />} />
          <Route path="/unilms/org/fees/dues_list" element={<OrgFeesDuesList />} />
          <Route path="/unilms/org/fees/manual_assign" element={<OrgFeesManualAssign />} />
          <Route path="/unilms/org/fees/program_batches" element={<OrgFeesProgramBatches />} />
          <Route path="/unilms/org/fees/receipt_pdf" element={<OrgFeesReceiptPdf />} />
          <Route path="/unilms/org/fees/semester_plan" element={<OrgFeesSemesterPlan />} />
          <Route path="/unilms/org/fees/structures" element={<OrgFeesStructures />} />
          <Route path="/unilms/org/fees/types" element={<OrgFeesTypes />} />
          <Route path="/unilms/org/front_office/call_logs" element={<OrgFrontOfficeCallLogs />} />
          <Route path="/unilms/org/front_office/calls" element={<OrgFrontOfficeCallLogs />} />
          <Route path="/unilms/org/front_office/enquiries" element={<OrgFrontOfficeEnquiries />} />
          <Route path="/unilms/org/front_office" element={<OrgFrontOfficeIndex />} />
          <Route path="/unilms/org/front_office/pass_print" element={<OrgFrontOfficePassPrint />} />
          <Route path="/unilms/org/front_office/postal" element={<OrgFrontOfficePostal />} />
          <Route path="/unilms/org/front_office/visitors" element={<OrgFrontOfficeVisitors />} />
          <Route path="/unilms/org/front-office" element={<OrgFrontOfficeIndex />} />
          <Route path="/unilms/org/front-office/visitors" element={<OrgFrontOfficeVisitors />} />
          <Route path="/unilms/org/front-office/calls" element={<OrgFrontOfficeCallLogs />} />
          <Route path="/unilms/org/front-office/postal" element={<OrgFrontOfficePostal />} />
          <Route path="/unilms/org/front-office/enquiries" element={<OrgFrontOfficeEnquiries />} />
          <Route path="/unilms/org/hostel" element={<OrgHostelIndex />} />
          <Route path="/unilms/org/hostel/outings" element={<OrgHostelOutings />} />
          <Route path="/unilms/org/hostel/registrations" element={<OrgHostelRegistrations />} />
          <Route path="/unilms/org/hostel/rooms" element={<OrgHostelRooms />} />
          <Route path="/unilms/org/hr/appraisals" element={<OrgHrAppraisalsIndex />} />
          <Route path="/unilms/org/hr/employees" element={<OrgHrEmployeesIndex />} />
          <Route path="/unilms/org/hr/leaves" element={<OrgHrLeavesIndex />} />
          <Route path="/unilms/org/hr/payroll/components" element={<OrgHrPayrollComponents />} />
          <Route path="/unilms/org/payroll/components" element={<OrgHrPayrollComponents />} />
          <Route path="/unilms/org/hr/payroll" element={<OrgHrPayrollIndex />} />
          <Route path="/unilms/org/payroll" element={<OrgHrPayrollIndex />} />
          <Route path="/unilms/org/hr/payroll/payslips" element={<OrgHrPayrollPayslips />} />
          <Route path="/unilms/org/payroll/payslips" element={<OrgHrPayrollPayslips />} />
          <Route path="/unilms/org/hr/payroll/structures" element={<OrgHrPayrollStructures />} />
          <Route path="/unilms/org/payroll/structures" element={<OrgHrPayrollStructures />} />
          <Route path="/unilms/org/hr/settings" element={<OrgHrSettingsIndex />} />
          <Route path="/unilms/org/internships/applications" element={<OrgInternshipsApplications />} />
          <Route path="/unilms/org/internships/create_posting" element={<OrgInternshipsCreatePosting />} />
          <Route path="/unilms/org/internships/create_posting/:id" element={<OrgInternshipsCreatePosting />} />
          <Route path="/unilms/org/placements/create_posting" element={<OrgInternshipsCreatePosting />} />
          <Route path="/unilms/org/internships/faculty_mentorship" element={<OrgInternshipsFacultyMentorship />} />
          <Route path="/unilms/org/internships" element={<OrgInternshipsIndex />} />
          <Route path="/unilms/org/internships/review_student" element={<OrgInternshipsReviewStudent />} />
          <Route path="/unilms/org/internships/tpo_audit" element={<OrgInternshipsTpoAudit />} />
          <Route path="/unilms/org/lms" element={<OrgLmsCourses />} />
          <Route path="/unilms/org/lms/courses" element={<OrgLmsCourses />} />
          <Route path="/unilms/org/library/books" element={<OrgLibraryBooks />} />
          <Route path="/unilms/org/library/categories" element={<OrgLibraryCategories />} />
          <Route path="/unilms/org/library" element={<OrgLibraryIndex />} />
          <Route path="/unilms/org/library/issues" element={<OrgLibraryIssues />} />
          <Route path="/unilms/org/library/members" element={<OrgLibraryMembers />} />
          <Route path="/unilms/org/library/periodicals" element={<OrgLibraryPeriodicals />} />
          <Route path="/unilms/org/library/stock" element={<OrgLibraryStock />} />
          <Route path="/unilms/org/library/suppliers" element={<OrgLibrarySuppliers />} />
          <Route path="/unilms/org/marks/components" element={<OrgMarksComponents />} />
          <Route path="/unilms/org/marks/entry" element={<OrgMarksFacultyMarksEntry />} />
          <Route path="/unilms/org/marks/auditTrail" element={<OrgMarksAuditTrail />} />
          <Route path="/unilms/org/marks/audit_trail" element={<OrgMarksAuditTrail />} />
          <Route path="/unilms/org/marks/faculty_marks_entry" element={<OrgMarksFacultyMarksEntry />} />
          <Route path="/unilms/org/materials/form" element={<OrgMaterialsForm />} />
          <Route path="/unilms/org/materials/create" element={<OrgMaterialsForm />} />
          <Route path="/unilms/org/materials/edit/:id" element={<OrgMaterialsForm />} />
          <Route path="/unilms/org/materials/edit" element={<OrgMaterialsForm />} />
          <Route path="/unilms/org/materials" element={<OrgMaterialsIndex />} />
          <Route path="/unilms/org/obe/admin_components_setup" element={<OrgObeAdminComponentsSetup />} />
          <Route path="/unilms/org/obe/admin_po_setup" element={<OrgObeAdminPoSetup />} />
          <Route path="/unilms/org/obe/po-setup" element={<OrgObeAdminPoSetup />} />
          <Route path="/unilms/org/obe/assessment_config" element={<OrgObeAssessmentConfig />} />
          <Route path="/unilms/org/obe/attainment_report" element={<OrgObeAttainmentReport />} />
          <Route path="/unilms/org/obe/attainment" element={<OrgObeAttainmentReport />} />
          <Route path="/unilms/org/obe/faculty_co_setup" element={<OrgObeFacultyCoSetup />} />
          <Route path="/unilms/org/obe/faculty_mapping_matrix" element={<OrgObeFacultyMappingMatrix />} />
          <Route path="/unilms/org/obe/matrix" element={<OrgObeFacultyMappingMatrix />} />
          <Route path="/unilms/org/obe/faculty_marks_entry" element={<OrgObeFacultyMarksEntry />} />
          <Route path="/unilms/org/obe/gap_analysis" element={<OrgObeGapAnalysis />} />
          <Route path="/unilms/org/obe/gap-analysis" element={<OrgObeGapAnalysis />} />
          <Route path="/unilms/org/obe/po_report" element={<OrgObePoReport />} />
          <Route path="/unilms/org/obe/targets_setup" element={<OrgObeTargetsSetup />} />
          <Route path="/unilms/org/placements/applications" element={<OrgPlacementsApplications />} />
          <Route path="/unilms/org/placements/drives/:id/applications" element={<OrgPlacementsApplications />} />
          <Route path="/unilms/org/placements/companies" element={<OrgPlacementsCompanies />} />
          <Route path="/unilms/org/placements/drives" element={<OrgPlacementsDrives />} />
          <Route path="/unilms/org/placements" element={<OrgPlacementsIndex />} />
          <Route path="/unilms/org/placements/internships" element={<OrgPlacementsInternships />} />
          <Route path="/unilms/org/internships" element={<OrgPlacementsInternships />} />
          <Route path="/unilms/org/placements/offers" element={<OrgPlacementsOffers />} />
          <Route path="/unilms/org/quizzes/builder" element={<OrgQuizzesBuilder />} />
          <Route path="/unilms/org/quizzes/form" element={<OrgQuizzesForm />} />
          <Route path="/unilms/org/quizzes" element={<OrgQuizzesIndex />} />
          <Route path="/unilms/org/quizzes/results" element={<OrgQuizzesResults />} />
          <Route path="/unilms/org/staff" element={<OrgStaffDirectory />} />
          <Route path="/unilms/org/staff/certificates" element={<OrgStaffCertificates />} />
          <Route path="/unilms/org/staff/checklists" element={<OrgStaffChecklists />} />
          <Route path="/unilms/org/staff/directory" element={<OrgStaffDirectory />} />
          <Route path="/unilms/org/staff/duties" element={<OrgStaffDuties />} />
          <Route path="/unilms/org/students/bulk_promote" element={<OrgStudentsBulkPromote />} />
          <Route path="/unilms/org/students/create_edit" element={<OrgStudentsCreateEdit />} />
          <Route path="/unilms/org/students/import" element={<OrgStudentsImport />} />
          <Route path="/unilms/org/students" element={<OrgStudentsIndex />} />
          <Route path="/unilms/org/students/parents" element={<OrgStudentsParents />} />
          <Route path="/unilms/org/students/profile" element={<OrgStudentsProfile />} />
          <Route path="/unilms/org/students/profile_360" element={<OrgStudentsProfile />} />
          <Route path="/unilms/org/mis" element={<OrgMisDashboard />} />
          <Route path="/unilms/org/mis/dashboard" element={<OrgMisDashboard />} />
          <Route path="/unilms/org/mis/reports" element={<OrgMisReports />} />
          <Route path="/unilms/org/systems" element={<OrgSystemsSettings />} />
          <Route path="/unilms/org/systems/settings" element={<OrgSystemsSettings />} />
          <Route path="/unilms/org/systems/access_groups" element={<OrgSystemsAccessGroups />} />
          <Route path="/unilms/org/systems/access-groups" element={<OrgSystemsAccessGroups />} />
          <Route path="/unilms/org/systems/access_group_form" element={<OrgSystemsAccessGroupForm />} />
          <Route path="/unilms/org/systems/access-group-form" element={<OrgSystemsAccessGroupForm />} />
          <Route path="/unilms/org/systems/access-groups/create" element={<OrgSystemsAccessGroupForm />} />
          <Route path="/unilms/org/systems/access-groups/edit/:id" element={<OrgSystemsAccessGroupForm />} />
          <Route path="/unilms/org/systems/access_groups/create" element={<OrgSystemsAccessGroupForm />} />
          <Route path="/unilms/org/systems/access_groups/edit/:id" element={<OrgSystemsAccessGroupForm />} />
          <Route path="/unilms/org/systems/users" element={<OrgSystemsUsers />} />
          <Route path="/unilms/org/timetable/builder" element={<OrgTimetableBuilder />} />
          <Route path="/unilms/org/timetable" element={<OrgTimetableIndex />} />
          <Route path="/unilms/org/timetable/periods" element={<OrgTimetablePeriods />} />
          <Route path="/unilms/org/transport/halts" element={<OrgTransportHalts />} />
          <Route path="/unilms/org/transport/logbook" element={<OrgTransportLogbook />} />
          <Route path="/unilms/org/transport/routes" element={<OrgTransportRoutes />} />
          <Route path="/unilms/org/transport/subscriptions" element={<OrgTransportSubscriptions />} />
          <Route path="/unilms/org/transport/vehicles" element={<OrgTransportVehicles />} />
          <Route path="/unilms/org/transport" element={<OrgTransportVehicles />} />
        </Route>
      </Route>
        <Route path="/unilms/org/login" element={<OrgLogin />} />
        <Route element={<ProtectedRoute allowedRoles={['parent', 'admin', 'campus_admin', 'super_admin']} fallbackLogin="/unilms/parent/login" />}>
          <Route element={<ParentLayout />}>
            <Route path="/unilms/parent/homework" element={<ParentAssignments />} />
            <Route path="/unilms/parent/attendance" element={<ParentAttendance />} />
            <Route path="/unilms/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/unilms/parent/fees" element={<ParentFees />} />
            <Route path="/unilms/parent/marks" element={<ParentMarks />} />
            <Route path="/unilms/parent/timetable" element={<ParentTimetable />} />
          </Route>
        </Route>
        <Route path="/unilms/parent/login" element={<ParentLogin />} />
        <Route element={<ProtectedRoute allowedRoles={['faculty', 'admin', 'campus_admin', 'super_admin']} fallbackLogin="/unilms/creator/login" />}>
          <Route element={<CreatorLayout />}>
            <Route path="/unilms/creator/builder" element={<CreatorBuilder />} />
            <Route path="/unilms/creator/courses" element={<CreatorCourses />} />
            <Route path="/unilms/creator/create" element={<CreatorCreate />} />
            <Route path="/unilms/creator/preview" element={<CreatorPreview />} />
          </Route>
        </Route>
        <Route path="/unilms/creator/login" element={<CreatorLogin />} />
        <Route path="/unilms/faculty/invalid_token" element={<SupervisorInvalidToken />} />
        <Route path="/unilms/faculty/portal" element={<SupervisorPortal />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRoutes;
