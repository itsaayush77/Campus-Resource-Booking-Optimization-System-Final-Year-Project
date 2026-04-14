# CHAPTER 4: TESTING AND ANALYSIS

## 4.1 TEST PLAN

Testing for Campus Resource Booking System was structured in two distinct phases:

**Unit Testing** validates individual API endpoints and backend logic in isolation using Postman. Tests are classified as:
- **Positive (Happy Path)**: Valid inputs, expected successful response
- **Negative (Invalid Input)**: Invalid/missing data, expected error response
- **Edge Case**: Boundary conditions, null-safety checks, state validation

**System Testing** validates the fully integrated application as experienced by end users in the browser, testing complete user journeys from registration through to check-out operations across student, staff, and admin interfaces.

All tests are manually executed using:
- **Postman**: API endpoint testing (HTTP status, response body validation)
- **Chrome/Edge Browser**: UI workflow testing with dedicated test accounts
- **MongoDB Compass**: Database state verification and document inspection

The screenshot evidence codes referenced below are defined in the Screenshot Evidence Guide:
- **SS-API-xx**: Postman API response screenshots
- **SS-UI-xx**: Browser UI screenshots
- **SS-DB-xx**: MongoDB database document screenshots

---

## 4.1.1 UNIT TESTING — TEST PLAN

Unit tests validate individual API endpoints and backend functions in isolation. All 65 test cases are organized by functional area and executed using Postman to verify correct HTTP status codes and response bodies for both valid and invalid inputs.

### 4.2 UNIT TESTING

## Authentication and Access Control

| Test No | Test Case | Evidence Type |
|---------|-----------|---------------|
| 1 | To register without providing any credentials (empty form submission) | Postman (SS-API-01) |
| 2 | To register using incorrect email format (e.g., user@domain, missing @) | Postman (SS-API-01) |
| 3 | To register using incorrect phone number (non-numeric or fewer than 10 digits) | Postman (SS-API-01) |
| 4 | To register using mismatched password and confirm password fields | Postman (SS-API-01) |
| 5 | To register with valid credentials and confirm password validation | Postman (SS-API-01) |
| 6 | To check if user registration and verification email is received successfully | MongoDB Compass (SS-DB-01) |
| 7 | To login with incorrect email format | Postman (SS-API-02) |
| 8 | To login with incorrect password (valid email, wrong password) | Postman (SS-API-02) |
| 9 | To login with unregistered email address | Postman (SS-API-02) |
| 10 | To login with valid credentials and check JWT token generation | Postman (SS-API-02) |
| 11 | To check if login redirects student role to /dashboard | Browser (SS-UI-02) |
| 12 | To check if login redirects admin role to /admin/dashboard | Browser (SS-UI-03) |
| 13 | To check if login redirects staff role to /staff/dashboard | Browser (SS-UI-02) |
| 14 | To check if forgot password works with unregistered email address | Postman (SS-API-02) |
| 15 | To check if forgot password works with valid email and reset link generation | Postman (SS-API-02) |
| 16 | To check if reset password rejects invalid or expired reset token | Postman (SS-API-02) |
| 17 | To check if reset password validates mismatched password fields | Postman (SS-API-02) |
| 18 | To check if reset password works with valid token and matching passwords | Postman (SS-API-02) |
| 19 | To check if password reset email contains valid reset link with token | Postman (SS-API-02) |
| 20 | To check if protected pages deny access without authentication token (401 error) | Postman (SS-API-02) |
| 21 | To check if protected pages deny access with invalid/expired authentication token | Postman (SS-API-02) |
| 22 | To check if protected routes allow access with valid authentication token | Postman (SS-API-02) |
| 23 | To check if logout clears authentication token from localStorage | Browser (SS-UI-01) |

## Resource Management

| Test No | Test Case | Evidence Type |
|---------|-----------|---------------|
| 24 | To check if browse resources endpoint returns all available resources | Postman (SS-API-03) |
| 25 | To check if browse resources filter by category/resource type returns filtered subset | Postman (SS-API-03) |
| 26 | To check if browse resources search by resource name returns matching results | Postman (SS-API-03) |
| 27 | To check if browse resources displays resource availability calendar correctly | Browser (SS-UI-04) |
| 28 | To check if resource details page loads with complete information (name, description, capacity) | Browser (SS-UI-05) |
| 29 | To check if resource details shows booking history for selected resource | Browser (SS-UI-05) |

## Booking Creation and Admin Workflow

| Test No | Test Case | Evidence Type |
|---------|-----------|---------------|
| 30 | To check if booking form validates required fields (date, time, purpose) | Browser (SS-UI-06) |
| 31 | To check if booking creation with valid data is accepted and record created (201 status) | Postman (SS-API-04) |
| 32 | To check if booking creation prevents double-booking on same resource/time slot (409 error) | Postman (SS-API-04) |
| 33 | To check if booking creation calculates correct duration from start and end time | Postman (SS-API-04) |
| 34 | To check if booking endpoint returns validation error for overlapping bookings | Postman (SS-API-04) |
| 35 | To check if admin approval updates booking status to "approved" in database | Postman (SS-API-06) |
| 36 | To check if admin rejection updates booking status to "rejected" with reason stored | Postman (SS-API-07) |
| 37 | To check if booking approvals page displays all pending bookings with resource and user details | Browser (SS-UI-08) |
| 38 | To check if booking approvals handles missing resourceId population gracefully without crash | Postman (SS-API-05) |
| 39 | To check if booking approvals handles missing userId population gracefully without crash | Postman (SS-API-05) |
| 40 | To check if booking status normalization handles case-insensitive status values correctly | Postman (SS-API-05) |

## Check-In, Check-Out and QR Code

| Test No | Test Case | Evidence Type |
|---------|-----------|---------------|
| 41 | To check if check-in requires valid booking ID (returns error for invalid ID) | Postman (SS-API-08) |
| 42 | To check if check-in updates checkInTime field with current timestamp on success | Postman (SS-API-08) |
| 43 | To check if check-in marks booking status as "checked-in" | MongoDB Compass (SS-DB-03) |
| 44 | To check if check-in fails when user attempts to check-in outside booking time window | Postman (SS-API-08) |
| 45 | To check if check-out requires valid booking ID (returns error for invalid ID) | Postman (SS-API-09) |
| 46 | To check if check-out updates checkOutTime field with current timestamp on success | Postman (SS-API-09) |
| 47 | To check if check-out calculates actualUsageDuration correctly from checkInTime to checkOutTime | MongoDB Compass (SS-DB-03) |
| 48 | To check if check-out marks booking status as "checked-out" on success | Postman (SS-API-09) |
| 49 | To check if check-out fails when no prior check-in record exists for booking | Postman (SS-API-09) |
| 50 | To check if QR code generation creates valid cryptographic token for approved booking | Browser (SS-UI-09) |
| 51 | To check if QR code encodes booking token (token-based format, not URL-based) | Browser (SS-UI-09) |

## No-Show Detection and Penalty System

| Test No | Test Case | Evidence Type |
|---------|-----------|---------------|
| 52 | To check if no-show detection marks overdue unchecked bookings as no-show after 15 minutes | MongoDB Compass (SS-DB-04) |
| 53 | To check if no-show service identifies bookings with zero check-in after startTime | MongoDB Compass (SS-DB-04) |
| 54 | To check if no-show penalty is applied on second no-show occurrence | MongoDB Compass (SS-DB-04) |
| 55 | To check if no-show penalty triggers 3-day user account suspension | MongoDB Compass (SS-DB-04) |
| 56 | To check if no-show penalty cancels all future pending bookings during suspension | MongoDB Compass (SS-DB-04) |
| 57 | To check if no-show scheduler cron job runs every 5 minutes to detect overdue bookings | MongoDB Compass (SS-DB-04) |

## Notifications and Analytics

| Test No | Test Case | Evidence Type |
|---------|-----------|---------------|
| 58 | To check if notification creation for booking_request includes correct resourceId and userId | Postman (SS-API-10) |
| 59 | To check if notification routing directs booking_request type to /admin/approvals | Postman (SS-API-10) |
| 60 | To check if notification routing directs unknown notification types to /notifications page | Postman (SS-API-10) |
| 61 | To check if notification bell displays count of unread notifications | Browser (SS-UI-10) |
| 62 | To check if notification list displays all notifications with correct timestamp | MongoDB Compass (SS-DB-05) |
| 63 | To check if mark notification as read updates isRead field to true in database | MongoDB Compass (SS-DB-05) |
| 64 | To check if analytics dashboard displays total bookings count (aggregated correctly) | Browser (SS-UI-03) |
| 65 | To check if analytics dashboard displays pending/approved/rejected booking counts correctly | Browser (SS-UI-03) |

---

---

## 4.1.2 SYSTEM TESTING — TEST PLAN

System tests validate the fully integrated application as experienced by end users. Each test case defines a realistic user scenario, sequence of steps performed through the UI, and expected observable outcomes. Tests were executed manually in Chrome/Edge using dedicated student, staff, and admin test accounts in separate browser sessions.

The 30 system test cases progress from individual flows (registration, login, resource browsing) through cross-role workflows (approval, check-in/out, notifications) to the complete end-to-end journey.

### 4.3 SYSTEM TESTING

## System tests

| Test No | Test Case | Evidence Type |
|---------|-----------|---------------|
| 1 | To check user registration flow including signup form, email verification, and successful account creation | Browser (SS-UI-01) + MongoDB (SS-DB-01) |
| 2 | To check user login with valid credentials, JWT token storage, and redirect to user dashboard | Browser (SS-UI-02) |
| 3 | To check student user cannot access /admin/dashboard (role guard prevents access) | Browser (SS-UI-02, SS-UI-03) |
| 4 | To check admin user cannot access /dashboard (role guard prevents access) | Browser (SS-UI-03) |
| 5 | To check staff user cannot access /my-bookings (role guard prevents access) | Browser (SS-UI-02) |
| 6 | To check if valid token in localStorage persists user session across page refresh | Browser (SS-UI-02) |
| 7 | To check if expired token triggers automatic logout and redirect to login page | Browser (SS-UI-01) |
| 8 | To check if invalid token in localStorage logs user out and clears session | Browser (SS-UI-01) |
| 9 | To check browse resources, filter by availability, and select resource for booking | Browser (SS-UI-04) |
| 10 | To check if resource details page displays booking history for selected resource | Browser (SS-UI-05) |
| 11 | To check booking creation flow: select resource, choose date/time, fill purpose, submit with pending status | Browser (SS-UI-06) + MongoDB (SS-DB-02) |
| 12 | To check if booking appears in "My Bookings" with pending status immediately after creation | Browser (SS-UI-07) |
| 13 | To check if admin views all pending bookings in Approvals page with resource and user details visible | Browser (SS-UI-08) + Postman (SS-API-05) |
| 14 | To check if admin approval updates booking status to "approved" and frontend reflects change | Postman (SS-API-06) + Browser (SS-UI-08) |
| 15 | To check if admin rejection updates status to "rejected" and student receives notification with reason | Postman (SS-API-07) + Browser (SS-UI-10) |
| 16 | To check full admin approval workflow: view pending, select booking, click Approve, status changes, notification sent | Browser (SS-UI-08, SS-UI-10) + Postman (SS-API-06) |
| 17 | To check if student can view approved booking, click Check-In, and QR code modal appears with booking token | Browser (SS-UI-09) |
| 18 | To check if check-in process saves checkInTime, marks booking as "checked-in" when QR is scanned | Postman (SS-API-08) + MongoDB (SS-DB-03) |
| 19 | To check if check-in validation prevents check-in before booking startTime (fails if too early) | Postman (SS-API-08) + Browser (SS-UI-09) |
| 20 | To check if check-out process saves checkOutTime and calculates actualUsageDuration correctly | Postman (SS-API-09) + MongoDB (SS-DB-03) |
| 21 | To check if approved booking without check-in after 15 minutes is auto-marked as no-show by scheduler | MongoDB (SS-DB-04) |
| 22 | To check if first no-show appears in user profile with flag visible but no suspension | MongoDB (SS-DB-04) |
| 23 | To check if second no-show triggers 3-day user account suspension and blocks new bookings | MongoDB (SS-DB-04) |
| 24 | To check if during suspension all future pending bookings are auto-cancelled with notifications sent | MongoDB (SS-DB-04) + Browser (SS-UI-10) |
| 25 | To check if after 3-day suspension expires, user can create new bookings again normally | MongoDB (SS-DB-04) |
| 26 | To check if notification created on booking approval updates bell icon and notification list | Browser (SS-UI-10) + MongoDB (SS-DB-05) |
| 27 | To check if admin clicking booking_request notification is routed to /admin/approvals | Browser (SS-UI-10) |
| 28 | To check if clicking unknown notification type routes to /notifications page | Browser (SS-UI-10) |
| 29 | To check if analytics dashboard displays total, pending, approved, and rejected booking counts correctly | Browser (SS-UI-03) |
| 30 | To check complete end-to-end workflow: Register, Login, Browse, Book, Wait for Approval, Check-In, Check-Out, View Duration | Browser (SS-UI-01 to SS-UI-10) + Postman (SS-API-01 to SS-API-09) + MongoDB (SS-DB-01 to SS-DB-05) |

---

---

# 4.4 TEST RESULTS AND EVIDENCE DOCUMENTATION

## Evidence Guide

The following evidence codes reference screenshot captures from test execution. Screenshots should be collected during actual test runs and referenced by their IDs when documenting results.

| Evidence ID | Description | Test Tools | Category |
|-------------|-------------|-----------|----------|
| SS-API-01 | POST /auth/register - user registration response with status code | Postman | API |
| SS-API-02 | POST /auth/login - login response with JWT token in body | Postman | API |
| SS-API-03 | GET /api/resources - list of all available resources with data | Postman | API |
| SS-API-04 | POST /api/bookings - booking creation response status 201 | Postman | API |
| SS-API-05 | GET /api/admin/bookings - pending bookings with resource/user details | Postman | API |
| SS-API-06 | PUT /api/admin/bookings/:id/approve - approval status update response | Postman | API |
| SS-API-07 | PUT /api/admin/bookings/:id/reject - rejection status and reason response | Postman | API |
| SS-API-08 | POST /api/bookings/:id/check-in - checkInTime timestamp recorded in response | Postman | API |
| SS-API-09 | POST /api/bookings/:id/check-out - checkOutTime and actualUsageDuration calculated | Postman | API |
| SS-API-10 | GET /api/notifications - notification list with type and routing information | Postman | API |
| SS-UI-01 | Login page with valid credentials entered and visible form fields | Chrome/Edge | UI |
| SS-UI-02 | Student/User dashboard after successful login with role-based content | Chrome/Edge | UI |
| SS-UI-03 | Admin dashboard with navigation links (Bookings, Dashboard, Analytics) visible | Chrome/Edge | UI |
| SS-UI-04 | Browse Resources page showing resource list and availability calendar | Chrome/Edge | UI |
| SS-UI-05 | Resource Details page with booking history list for selected resource | Chrome/Edge | UI |
| SS-UI-06 | Booking Form page with all required fields filled (date, time, duration, purpose) | Chrome/Edge | UI |
| SS-UI-07 | My Bookings page showing pending approval booking with status badge | Chrome/Edge | UI |
| SS-UI-08 | Admin Booking Approvals page with pending bookings table and action buttons | Chrome/Edge | UI |
| SS-UI-09 | Check-In QR modal with booking token visible and scannable QR code | Chrome/Edge | UI |
| SS-UI-10 | Notification Bell showing unread count badge and notification list on click | Chrome/Edge | UI |
| SS-DB-01 | MongoDB User document after registration showing email, phone, role fields | MongoDB Compass | Database |
| SS-DB-02 | MongoDB Booking document after creation showing resourceId, userId, status, dates | MongoDB Compass | Database |
| SS-DB-03 | MongoDB Booking document after check-in/out showing checkInTime, checkOutTime, actualUsageDuration | MongoDB Compass | Database |
| SS-DB-04 | MongoDB User document showing no-show flag, suspension status, and suspension end date | MongoDB Compass | Database |
| SS-DB-05 | MongoDB Notification document showing type, resourceId, userId, isRead status | MongoDB Compass | Database |

---

## Test Execution Summary

**Unit Testing**: 65 test cases covering authentication, resource management, bookings, check-in/out, no-show penalties, and notifications.

**System Testing**: 30 end-to-end test scenarios covering complete user workflows including registration, login, resource browsing, booking creation, admin approval, check-in/out, no-show detection, and analytics.

**Total Test Cases**: 95 tests across all modules and workflows.

**Evidence Required**: 25 screenshot captures documenting API responses, UI screens, and database states during test execution.
