# UniLMS — Student Portal & Mobile App API Suite (Single Standalone File)

This directory contains the production-ready **Standalone Postman Collection** designed for building the **UniLMS Student Mobile Application** (Flutter / React Native / iOS / Android) and web portal integrations.

The collection structure matches the **UniLMS Student Portal Navigation Menu**:

```
UniLMS Student Mobile App API Suite
├── 00. Authentication & Session
│   ├── 01. Student Multi-Tenant Login
│   ├── 02. Refresh Session Access Token
│   ├── 03. Student Logout
│   └── 04. Get Current Student Profile Dossier
├── 01. Academics & Learning
│   ├── Dashboard (Overview, Digital ID Card, Calendar, Summary Counters)
│   ├── Assessments & Assignments (Homework, Submissions, Guidelines)
│   ├── CBT Quizzes & Tests (List, Instructions, Session, Autosave, Submit)
│   ├── Class Timetable (Weekly Schedule Monday–Saturday)
│   ├── Attendance Monitor (Cumulative %, Monthly Filter, College Holidays)
│   ├── Semester Grade Card (SGPA/CGPA, Transcripts, Date-Sheets)
│   ├── Course Materials & Notes (Lecture Notes, LMS Video Lessons, Enroll)
│   └── OBE Outcomes & Matrix (NBA/NAAC PO1-PO12, PSOs, CO-PO Matrix)
├── 02. Career & Industry
│   ├── Industry Internships (Verified Openings, Stipends)
│   └── Placements Hub (Recruitment Drives, Applications, Job Offers)
└── 03. Campus Life & Services
    ├── Fee Ledger & Dues (Tuition, Receipts, Balance Summary)
    ├── Self Service Desk (Helpdesk Overview, Circulars, Push Feed)
    ├── Certificate Requests (Bonafide, Transfer, Conduct Applications)
    ├── Exam Registration (Semester Exam Enrollment, Hall Tickets)
    ├── Student Academic Diary (Daily Circulars, Planner Calendar)
    ├── Hostel Accommodation (Bed Allocation, Outing Gate Passes)
    ├── Campus Transport & Bus (Digital Bus Pass, Route Pickups)
    ├── Grievance & Support (Confidential Ticket Submission & Redressal)
    └── Course Feedback (Faculty Evaluations & Course Ratings)
```

---

## 📁 Included Files

| File | Description |
| :--- | :--- |
| **`UniLMS_Student_App.postman_collection.json`** | **100% Self-Contained, Standalone Postman Collection (v2.1.0)**. Contains all **53 pure Student APIs** across the 4 primary navmenu modules and 19 subfolders **WITH embedded collection variables** and automated token extraction scripts. |
| **`Collection.zip`** | Pre-packaged ZIP archive containing the JSON collection and this technical documentation for easy distribution to mobile app developers. |

> [!NOTE]
> **Zero Setup Required:** All variables (`baseUrl`, `tenantCode`, `identifier`, `password`, `token`, `refreshToken`, `studentId`) are embedded directly inside this collection file. Developers do **not** need to import or configure any separate environment.

---

## 🚀 Quick Start (1-Step Import into Postman)

1. Open **Postman**.
2. Click **Import** (top left).
3. Drag & drop the single file:
   👉 **`UniLMS_Student_App.postman_collection.json`**
4. Open the **Variables** tab of the collection (or in the request body of `01. Student Multi-Tenant Login`) and fill in your campus credentials:
   - **`baseUrl`**: `https://api.unilms.in/api/v1` (Production) or `http://localhost:3000/api/v1` (Local)
   - **`tenantCode`**: Your institution's Campus Code (e.g. `MST`, `DEMO`, etc.)
   - **`identifier`**: Student Roll Number or registered email (e.g. `student1@unilms.com`)
   - **`password`**: Student password (e.g. `Student@123`)
5. Click **Send** on **`01. Student Multi-Tenant Login`**.
   - *The included test script automatically saves `token`, `refreshToken`, `studentId`, and `tenantCode` directly into collection variables (`pm.collectionVariables`).*
6. **Done!** Every single endpoint across all 19 subfolders is immediately ready to execute without manual copying and pasting.

---

## 📂 Detailed Folder-by-Folder API Catalog (53 Endpoints)

### 00. Authentication & Session (4 APIs)
- **`POST /api/v1/auth/login`**: Multi-tenant student login via `orgCode`, `identifier` (Roll No / Email), and `password`. Returns JWT `accessToken`, `refreshToken`, and linked `studentProfile`. Automatically sets Postman variables.
- **`POST /api/v1/auth/refresh`**: Silent token renewal using `refreshToken`.
- **`POST /api/v1/auth/logout`**: Client-side session termination clearing authentication tokens.
- **`GET /api/v1/students/:studentId`**: Complete 360-degree demographic and academic profile dossier.

---

### 01. Academics & Learning (25 APIs across 8 Subfolders)

#### 1. Dashboard
- **`GET /api/v1/parent/student/:studentId/overview`**: Primary dashboard payload returning student profile photo, overall attendance %, fee balance, today scheduled periods, and class teacher.
- **`GET /api/v1/students/portal/digital-id?studentId=:studentId`**: Generates secure verified mobile student ID with barcode, academic batch, validity, blood group, and emergency contact numbers.
- **`GET /api/v1/parent/student/:studentId/calendar`**: Full semester institutional calendar listing instructional class days, sports days, celebrations, and exam windows.
- **`GET /api/v1/students/portal/self-service-summary?studentId=:studentId`**: Micro-counters for pending helpdesk tickets, certificate issuance status, and circular alerts.

#### 2. Assessments & Assignments
- **`GET /api/v1/parent/student/:studentId/homework`**: Returns active subject assignments, due dates, attachments, student submissions, and teacher evaluation comments.
- **`GET /api/v1/academics/study-materials`**: Downloadable project rubrics, assignment guidelines, and reference problem sets.

#### 3. CBT Quizzes & Tests
- **`GET /api/v1/cbt/quizzes`**: Returns list of upcoming, live active, and evaluated CBT assessments.
- **`GET /api/v1/cbt/quizzes/:quizId`**: Detailed assessment instructions, negative marking criteria, total questions, and maximum duration in minutes.
- **`POST /api/v1/cbt/start`**: Initializes or reconnects to an active CBT session with server-validated countdown timer.
- **`GET /api/v1/cbt/session/:sessionId`**: Fetches question set, multiple choice options, saved choices, and server remaining time in seconds.
- **`POST /api/v1/cbt/session/:sessionId/heartbeat`**: Silent 30-second background sync keeping active answers persisted and syncing timer.
- **`POST /api/v1/cbt/session/:sessionId/submit`**: Concludes exam attempt, submits responses for automated grading, and records score in student gradebook.

#### 4. Class Timetable
- **`GET /api/v1/parent/student/:studentId/timetable`**: Student's weekly academic schedule (Monday through Saturday) covering Period 1 to Period 7, tea/lunch intervals, faculty names, and lecture halls.

#### 5. Attendance Monitor
- **`GET /api/v1/parent/student/:studentId/attendance`**: Overall attendance %, minimum 75% cutoff status, safe buffer sessions, subject-wise breakdown, and verified classroom logs signed by faculty.
- **`GET /api/v1/parent/student/:studentId/attendance?month=YYYY-MM`**: Filters attendance records for a specific calendar month view to calculate monthly percentage and present/absent counts.
- **`GET /api/v1/tenants/settings/org_holidays`**: List of institutional and national holidays (Republic Day, Gandhi Jayanti, Diwali) recognized as non-instructional days.

#### 6. Semester Grade Card
- **`GET /api/v1/parent/student/:studentId/marks`**: Continuous internal evaluation (CIE), end-semester exam marks, credits earned, and SGPA/CGPA standing.
- **`GET /api/v1/examinations/schedules`**: Official published schedule for mid-term and end-term university examinations.

#### 7. Course Materials & Notes
- **`GET /api/v1/academics/study-materials`**: Downloadable PDF notes, presentation slides, and curriculum references grouped by course subject.
- **`GET /api/v1/lms/courses?isPublished=true`**: Catalog of published self-paced online courses and masterclasses available on campus.
- **`GET /api/v1/lms/my-courses?studentId=:studentId`**: Enrolled courses, completed video percentages, and lesson certificates.
- **`GET /api/v1/lms/courses/:courseId`**: Detailed modular syllabus, video streaming links, and lesson transcripts.
- **`POST /api/v1/lms/courses/:courseId/enroll`**: Enrolls logged-in student into a campus online masterclass or technical skill track.

#### 8. OBE Outcomes & Matrix
- **`GET /api/v1/obe/pos`**: Fetches persistent Washington Accord Tier-1 outcomes (PO1 to PO12, PSO1, PSO2) auto-provisioned from PostgreSQL.
- **`GET /api/v1/obe/matrix/:subjectId`**: Subject-level Course Outcomes (CO1-CO5) correlated against Program Outcomes (1=Low, 2=Medium, 3=High).

---

### 02. Career & Industry (5 APIs across 2 Subfolders)

#### 1. Industry Internships
- **`GET /api/v1/placements/internships`**: Verified corporate internship openings, locations, stipend amounts, and eligibility requirements.

#### 2. Placements Hub
- **`GET /api/v1/placements/drives`**: Active recruitment drives, hiring partners, CTC packages, criteria cutoffs, and scheduled test dates.
- **`GET /api/v1/placements/applications`**: Track application statuses across Shortlisting, Technical Rounds, HR Interview, and Final Selection.
- **`POST /api/v1/placements/applications`**: Applies to recruitment drive with student resume link and CGPA clearance.
- **`GET /api/v1/placements/offers`**: Official campus job offer letters, confirmed CTC packages, designation, and joining instructions.

---

### 03. Campus Life & Services (19 APIs across 9 Subfolders)

#### 1. Fee Ledger & Dues
- **`GET /api/v1/parent/student/:studentId/fees`**: Detailed statement of tuition, lab, library, hostel fees, payment transaction receipts, and outstanding dues (matching the web portal).

#### 2. Self Service Desk
- **`GET /api/v1/students/portal/self-service-summary?studentId=:studentId`**: Quick metrics on open grievance tickets, certificate approvals, and academic notifications.
- **`GET /api/v1/students/portal/notices`**: Official university circulars, exam notices, and student welfare bulletins.
- **`GET /api/v1/notifications`**: Push notification feed for classroom attendance, assignment deadlines, and hostel gate approvals.

#### 3. Certificate Requests
- **`GET /api/v1/students/portal/certificate-requests?studentId=:studentId`**: Status of certificate applications (Pending Review, Approved, Issued, Rejected).
- **`POST /api/v1/students/portal/certificate-requests`**: Applies for Bonafide, Transfer, Conduct, or Study certificates with purpose statement.

#### 4. Exam Registration
- **`GET /api/v1/students/portal/exam-registrations?studentId=:studentId`**: Active exam registrations, approved hall ticket barcodes, and designated exam hall numbers.
- **`POST /api/v1/students/portal/exam-registrations`**: Registers student for regular or backlog end-semester examination subjects.

#### 5. Student Academic Diary
- **`GET /api/v1/students/portal/notices`**: Daily diary bulletins published by department heads and academic deans.
- **`GET /api/v1/parent/student/:studentId/calendar`**: Working days vs. non-instructional days as tracked in student academic planner.

#### 6. Hostel Accommodation
- **`GET /api/v1/hostel/allocations?studentId=:studentId`**: Assigned hostel block name, floor, room number, bed ID, and resident warden contact.
- **`GET /api/v1/hostel/outings?studentId=:studentId`**: Track day outing, weekend leave, and vacation gate pass permissions.
- **`POST /api/v1/hostel/outings`**: Submits gate pass request with out/in times and guardian consent notification.

#### 7. Campus Transport & Bus
- **`GET /api/v1/transport/subscriptions?studentId=:studentId`**: Active digital bus pass, designated route name, vehicle number, driver name, and allocated boarding stop.
- **`POST /api/v1/transport/subscriptions`**: Subscribes student to an institutional transport route.

#### 8. Grievance & Support
- **`GET /api/v1/students/portal/complaints?studentId=:studentId`**: Track filed grievances, assigned grievance cell officer, and official redressal response remarks.
- **`POST /api/v1/students/portal/complaints`**: Submits confidential support ticket across Academic, Hostel, Transport, or General categories.

#### 9. Course Feedback
- **`GET /api/v1/students/portal/feedbacks?studentId=:studentId`**: Review previous course evaluation submissions and survey completion statuses.
- **`POST /api/v1/students/portal/feedbacks`**: Submits anonymous rating and qualitative feedback for course teacher.

---

## 🔒 Security & Authorization

All endpoints except `POST /auth/login` and `POST /auth/refresh` require:
1. **Bearer Token Header**: `Authorization: Bearer <accessToken>`
2. **Tenant Header**: `x-tenant-code: <tenantCode>` (e.g. `MST`, `DEMO`)

In this Postman collection, both headers are handled automatically through collection-level settings and variables.
