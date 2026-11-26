# UniLMS — Student Portal & Mobile App API Suite (Single Standalone File)

This directory contains the production-ready **Standalone Postman Collection** designed for building the **UniLMS Student Mobile Application** (Flutter / React Native / iOS / Android) and web portal integrations.

---

## 📁 File Included

| File | Description |
| :--- | :--- |
| **`UniLMS_Student_App.postman_collection.json`** | **100% Self-Contained, Standalone Postman Collection (v2.1.0)**. Contains all **45 pure Student APIs** across 12 structured folders **WITH embedded collection variables** and automated token extraction scripts. |

> [!NOTE]
> **Zero Setup Required:** All variables (`baseUrl`, `tenantCode`, `identifier`, `password`, `token`, `refreshToken`, `studentId`) are embedded directly inside this collection file. Developers do **not** need to import or configure any separate environment.

---

## 🚀 Quick Start (1-Step Import into Postman)

1. Open **Postman**.
2. Click **Import** (top left).
3. Drag & drop the single file:
   👉 **`UniLMS_Student_App.postman_collection.json`**
4. Open the **Variables** tab of the collection (or in the request body of `01. Student Multi-Tenant Login`) and fill in your campus credentials:
   - **`tenantCode`**: Your institution's Campus Code (e.g. `MST`, `DEMO`, etc.)
   - **`identifier`**: Student Roll Number or registered email
   - **`password`**: Student password
5. Click **Send** on **`01. Student Multi-Tenant Login`**.
   - *The included test script automatically saves `token`, `refreshToken`, and `studentId` directly into collection variables (`pm.collectionVariables`).*
6. **Done!** Every single endpoint across all 12 modules is immediately ready to execute without manual copying and pasting.

---

## 📂 Folder-by-Folder API Catalog (45 Pure Student Endpoints)

### 01. Authentication & Session (2 APIs)
- **`POST /api/v1/auth/login`**: Multi-tenant student login via `orgCode`, `identifier` (Roll No / Email), and `password`. Returns JWT `accessToken`, `refreshToken`, and linked `studentProfile`.
- **`POST /api/v1/auth/refresh`**: Silent token renewal using `refreshToken`.

### 02. Student Profile & Dashboard 360 (5 APIs)
- **`GET /api/v1/parent/student/:studentId/overview`**: Primary student dashboard screen. Aggregates student photo, attendance rate, total outstanding fees, today's timetable sessions, and faculty mentor details.
- **`GET /api/v1/students/portal/self-service-summary?studentId=:studentId`**: Live counters for open helpdesk tickets, pending certificate approvals, exam registrations, and notices.
- **`GET /api/v1/students/portal/digital-id?studentId=:studentId`**: Verified Student Digital ID card with barcode, program, department, valid academic year, blood group, and emergency contact.
- **`GET /api/v1/parent/student/:studentId/calendar`**: Campus academic calendar showing teaching days, holidays, sports days, and exam cycles.
- **`GET /api/v1/students/:studentId`**: Complete 360-degree demographic profile.

### 03. Academic Timetable & Schedules (1 API)
- **`GET /api/v1/parent/student/:studentId/timetable`**: Student's weekly schedule (Monday–Saturday) with period start/end times, subject codes, faculty names, and classroom numbers.

### 04. Attendance Monitoring (2 APIs)
- **`GET /api/v1/parent/student/:studentId/attendance`**: Cumulative attendance percentage, total held vs. attended classes, and recent session attendance statuses (Present, Absent, Late).
- **`GET /api/v1/parent/student/:studentId/attendance?month=YYYY-MM`**: Monthly filter for calendar attendance view.

### 05. Coursework & Study Materials (2 APIs)
- **`GET /api/v1/parent/student/:studentId/homework`**: List of assignments, deadlines, submission statuses, attachments, and teacher feedback.
- **`GET /api/v1/academics/study-materials`**: Subject-wise lecture notes, PDFs, PPT slides, and reference materials.

### 06. Digital LMS Video Courses (4 APIs)
- **`GET /api/v1/lms/courses?isPublished=true`**: Browse published e-learning courses catalog.
- **`GET /api/v1/lms/my-courses?studentId=:studentId`**: Enrolled courses and learning progress percentages.
- **`GET /api/v1/lms/courses/:courseId`**: Course syllabus hierarchy with modules and playable lessons.
- **`POST /api/v1/lms/courses/:courseId/enroll`**: Enroll student into a course.

### 07. CBT Online Quizzes & Tests (6 APIs)
- **`GET /api/v1/cbt/quizzes`**: Upcoming, live, and past computer-based online quizzes.
- **`GET /api/v1/cbt/quizzes/:quizId`**: Quiz instructions, marks, and duration.
- **`POST /api/v1/cbt/start`**: Launch CBT exam attempt (creates/resumes session).
- **`GET /api/v1/cbt/session/:sessionId`**: Live test player state, questions, timer, and saved responses.
- **`POST /api/v1/cbt/session/:sessionId/heartbeat`**: Background 30-second autosave syncing answers and remaining timer.
- **`POST /api/v1/cbt/session/:sessionId/submit`**: Conclude and submit assessment.

### 08. Examinations & Grade Cards (4 APIs)
- **`GET /api/v1/examinations/schedules`**: Published date-sheets and upcoming mid-term/end-term exams.
- **`GET /api/v1/parent/student/:studentId/marks`**: Semester grade cards, internal/external marks, credits, and SGPA/CGPA.
- **`GET /api/v1/students/portal/exam-registrations?studentId=:studentId`**: Active exam registrations and downloadable hall tickets.
- **`POST /api/v1/students/portal/exam-registrations`**: Submit semester exam registration.

### 09. Fee Obligations & Receipts (View Only) (1 API)
- **`GET /api/v1/parent/student/:studentId/fees`**: Breakdown of tuition, hostel, transport fees, paid receipts, and pending balance (matching the web portal). *(Note: Fee payments are handled by parents/accounts).*

### 10. Campus Services (Hostel & Transport) (5 APIs)
- **`GET /api/v1/hostel/allocations?studentId=:studentId`**: Assigned hostel room, bed, and block details.
- **`GET /api/v1/hostel/outings?studentId=:studentId`**: Status of gate pass and outing permissions.
- **`POST /api/v1/hostel/outings`**: Apply for day/night outing gate pass.
- **`GET /api/v1/transport/subscriptions?studentId=:studentId`**: Active bus pass details.
- **`POST /api/v1/transport/subscriptions`**: Subscribe to institutional bus route.

### 11. Placements & Career Services (5 APIs)
- **`GET /api/v1/placements/drives`**: On-campus placement drives, job roles, eligibility, and CTC packages.
- **`GET /api/v1/placements/internships`**: Verified industry internship opportunities.
- **`GET /api/v1/placements/applications`**: My job applications and status across interview rounds.
- **`POST /api/v1/placements/applications`**: Apply for recruitment drive with resume.
- **`GET /api/v1/placements/offers`**: Official placement offer letters and joining terms.

### 12. Student Self-Service & Grievances (8 APIs)
- **`GET /api/v1/students/portal/certificate-requests?studentId=:studentId`**: Status of certificate applications.
- **`POST /api/v1/students/portal/certificate-requests`**: Apply for Bonafide, Transfer, or Conduct certificates.
- **`GET /api/v1/students/portal/complaints?studentId=:studentId`**: Track submitted complaints and resolution remarks.
- **`POST /api/v1/students/portal/complaints`**: Submit confidential grievance / helpdesk ticket.
- **`GET /api/v1/students/portal/feedbacks?studentId=:studentId`**: History of submitted feedback.
- **`POST /api/v1/students/portal/feedbacks`**: Submit faculty feedback and course rating survey.
- **`GET /api/v1/students/portal/notices`**: Student diary notices and circulars.
- **`GET /api/v1/notifications`**: Real-time push notification feed.

---

## 🔒 Security & Request Headers

For all authenticated requests:
```http
Authorization: Bearer <accessToken>
X-Tenant-Code: <orgCode>
Content-Type: application/json
```
Students can only access records scoped to their authenticated `studentId` (strictly enforced by backend IDOR protection).
