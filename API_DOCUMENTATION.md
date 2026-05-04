Campus Resource Booking System
API Documentation

Authentication: Bearer token (JWT)  
Content-Type: `application/json`

 1. Overview

The CampusBook API supports authentication, resource browsing, booking management, QR-based verification, notifications, staff review workflows, user administration, and analytics.

The API follows a JSON response pattern and uses role-based protection for private routes.

 2. Authentication

Protected routes require an `Authorization` header:

```http
Authorization: Bearer <jwt_token>
```

 3. Common Response Shape

Successful responses typically follow this structure:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Error responses typically follow this structure:

```json
{
  "success": false,
  "message": "Description of the error"
}
```

Some validation errors may also include an `errors` array.

## 4. Roles and Access Levels

### Public
- register
- login
- forgot password
- reset password
- browse active resources
- view resource details

### Authenticated user
- get own profile
- update profile
- change password
- create booking
- view own bookings
- cancel own booking
- check in
- check out
- view notifications

### Staff or Admin
- staff review queue
- staff review note submission
- staff analytics
- staff-visible resources

### Admin only
- booking approval and rejection
- manual no-show marking
- user management
- resource management
- analytics summary

## 5. Domain Models

### User
Important fields:
- `id`
- `name`
- `email`
- `role`
- `phoneNumber`
- `department`
- `isActive`
- `isSuspended`
- `suspendedUntil`
- `noShowCount`

### Resource
Important fields:
- `_id`
- `name`
- `type`
- `category`
- `location`
- `capacity`
- `description`
- `amenities`
- `availability`
- `isActive`

### Booking
Important fields:
- `_id`
- `userId`
- `resourceId`
- `startTime`
- `endTime`
- `purpose`
- `expectedAttendees`
- `notes`
- `status`
- `qrCode`
- `qrCodeImage`
- `checkInTime`
- `checkOutTime`
- `actualUsageDuration`
- `approvedBy`
- `approvedAt`
- `rejectionReason`
- `cancellationReason`

### Notification
Important fields:
- `_id`
- `userId`
- `type`
- `title`
- `message`
- `isRead`
- `readAt`
- `relatedBooking`

## 6. Booking Status Lifecycle

Common booking statuses:
- `pending`
- `approved`
- `rejected`
- `cancelled`
- `completed`
- `no_show`

Typical lifecycle:

```text
pending -> approved -> checked in -> completed
pending -> rejected
pending/approved -> cancelled
approved without check-in -> no_show
```

## 7. Authentication Endpoints

### POST `/auth/register`
Register a public user account.

Access: Public

Request body:

```json
{
  "name": "Ram KC",
  "email": "ram@gmail.com",
  "password": "Ram@12345",
  "role": "student",
  "phoneNumber": "9812345678",
  "department": "Computing"
}
```

Notes:
- public signup only accepts `student` or `staff`
- admin accounts cannot be created from this endpoint

Success:
- `201 Created`

### POST `/auth/login`
Authenticate a user and return a token.

Access: Public

Request body:

```json
{
  "email": "ram@gmail.com",
  "password": "Ram@12345"
}
```

Success:
- `200 OK`

Returns:
- `token`
- `tokenExpiresIn`
- serialized user object

Possible failures:
- invalid credentials
- inactive account
- suspended account

### POST `/auth/forgot-password`
Request a password reset email.

Access: Public

Request body:

```json
{
  "email": "ram@gmail.com"
}
```

Behavior:
- always returns a safe generic success message
- avoids leaking whether an email exists

### POST `/auth/reset-password/:token`
Reset account password using a reset token.

Access: Public

Request body:

```json
{
  "newPassword": "Newpass123"
}
```

### GET `/auth/me`
Get the currently authenticated user profile.

Access: Private

### PUT `/auth/profile`
Update profile details.

Access: Private

Request body example:

```json
{
  "name": "Updated Name",
  "phoneNumber": "9800000000",
  "department": "Other"
}
```

### PUT `/auth/change-password`
Change the password for the current user.

Access: Private

Request body:

```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass123"
}
```

### POST `/auth/logout`
Logout endpoint for authenticated sessions.

Access: Private

## 8. Resource Endpoints

### GET `/resources`
List resources.

Access: Public

Query parameters:
- `category`
- `type`
- `search`
- `isActive` (admin only)

Behavior:
- public users see active resources only
- admins can filter by `isActive`

### GET `/resources/:id`
Get a single resource by ID.

Access: Public

### GET `/resources/:id/bookings`
Get live booking availability for a resource.

Access: Private

Query parameters:
- `startDate=YYYY-MM-DD`
- `endDate=YYYY-MM-DD`

Returns:
- `resource`
- `bookings`

Important note:
- this endpoint is used for the live availability calendar
- it returns active booking conflicts (`pending` and `approved`), not a full historical archive of all past usage

### POST `/resources`
Create a resource.

Access: Admin

### PUT `/resources/:id`
Update a resource.

Access: Admin

### DELETE `/resources/:id`
Delete a resource.

Access: Admin

Important:
- deletion is blocked if the resource has future active bookings

### PATCH `/resources/:id/toggle`
Activate or deactivate a resource.

Access: Admin

## 9. Booking Endpoints

### POST `/bookings`
Create a new booking request.

Access: Private

Request body:

```json
{
  "resourceId": "resource_object_id",
  "startTime": "2026-04-25T10:00:00+05:45",
  "endTime": "2026-04-25T11:00:00+05:45",
  "purpose": "Project meeting",
  "expectedAttendees": 5,
  "notes": "Optional notes"
}
```

Business rules:
- all required fields must be present
- `startTime` must be in the future
- `endTime` must be after `startTime`
- `expectedAttendees` must be a positive integer
- capacity cannot be exceeded
- overlapping pending/approved bookings are rejected
- inactive resources cannot be booked

Success:
- `201 Created`
- booking created with `pending` status

### GET `/bookings/my`
Get active bookings for the current user.

Access: Private

Returns bookings excluding:
- `completed`
- `cancelled`
- `rejected`
- `no_show`

### GET `/bookings/my/history`
Get booking history for the current user.

Access: Private

Returns bookings with status:
- `completed`
- `cancelled`
- `rejected`
- `no_show`

### GET `/bookings/:id`
Get a single booking by ID.

Access: Private

Access rule:
- the booking owner can access it
- admin can access it

### PATCH `/bookings/:id/cancel`
Cancel an eligible booking.

Access: Private

Request body:

```json
{
  "reason": "Optional cancellation reason"
}
```

### POST `/bookings/:id/check-in`
Check in to an approved booking using a QR token.

Access: Private

Request body:

```json
{
  "token": "bookingId|randomToken"
}
```

Business rules:
- only approved bookings can be checked in
- token must exactly match booking QR token
- check-in allowed from 15 minutes before start time until end time
- already checked-in bookings return a conflict response

### POST `/bookings/:id/check-out`
Check out of an approved booking after successful check-in.

Access: Private

Business rules:
- booking must be approved
- `checkInTime` must exist
- booking must not already be checked out
- on success, status becomes `completed`
- `actualUsageDuration` is calculated in minutes

## 10. Admin Booking Endpoints

### GET `/admin/bookings`
List admin-visible bookings.

Access: Admin

Query parameter:
- `status`

### PATCH `/admin/bookings/:id/approve`
Approve a pending booking.

Access: Admin

Business rules:
- only pending bookings can be approved
- resource must still be active
- booking must not conflict with another active booking
- approval must happen before the no-show grace threshold passes

On approval:
- status becomes `approved`
- `approvedBy` and `approvedAt` are set
- QR token and QR image are generated

### PATCH `/admin/bookings/:id/reject`
Reject a pending booking.

Access: Admin

Request body:

```json
{
  "reason": "Resource not suitable for requested activity"
}
```

On rejection:
- status becomes `rejected`
- rejection reason is stored
- QR fields are cleared

### PATCH `/admin/bookings/:id/mark-no-show`
Manually mark an approved booking as no-show.

Access: Admin

Business rules:
- only approved bookings can be marked no-show
- bookings with existing check-in cannot be marked no-show

Response may include updated user penalty information:
- `noShowCount`
- `isSuspended`
- `suspendedUntil`

## 11. Staff Endpoints

### GET `/staff/bookings/review`
Get staff-visible bookings for review and monitoring.

Access: Staff or Admin

Query parameter:
- `status=all|pending|approved|completed`

Returns:
- `counts`
- `bookings`

### GET `/staff/bookings/pending`
Get pending bookings for the staff review queue.

Access: Staff or Admin

### PATCH `/staff/bookings/:id/review`
Save a staff recommendation note for a pending booking.

Access: Staff or Admin

Request body:

```json
{
  "recommendation": "recommend_approve",
  "comment": "Looks appropriate for the requested use."
}
```

Allowed recommendation values:
- `no_recommendation`
- `recommend_approve`
- `recommend_reject`

### GET `/staff/analytics`
Get simplified analytics for staff.

Access: Staff or Admin

### GET `/staff/resources`
Get resources associated with the staff member’s department or assignment.

Access: Staff or Admin

## 12. Notification Endpoints

### GET `/notifications`
Get notifications for the current user.

Access: Private

Returns:
- full notification list
- `unreadCount`

### PATCH `/notifications/read-all`
Mark all unread notifications as read.

Access: Private

### PATCH `/notifications/read-many`
Mark selected notifications as read.

Access: Private

Request body:

```json
{
  "notificationIds": ["id1", "id2", "id3"]
}
```

### PATCH `/notifications/:id/read`
Mark one notification as read.

Access: Private

## 13. User Administration Endpoints

### GET `/admin/users`
List all users.

Access: Admin

### PATCH `/admin/users/:id/role`
Change a user role between `student` and `staff`.

Access: Admin

Request body:

```json
{
  "role": "staff"
}
```

Rules:
- admin role cannot be changed here
- admin cannot change own role

### PATCH `/admin/users/:id/toggle-active`
Activate or deactivate a user account.

Access: Admin

Rules:
- admin cannot deactivate own account

### PATCH `/admin/users/:id/suspend`
Suspend a user.

Access: Admin

Request body options:

```json
{
  "days": 3,
  "reason": "Repeated no-shows"
}
```

or

```json
{
  "suspendedUntil": "2026-04-30T00:00:00.000Z",
  "reason": "Manual suspension"
}
```

### PATCH `/admin/users/:id/unsuspend`
Remove a user suspension.

Access: Admin

## 14. Analytics Endpoint

### GET `/admin/analytics/summary`
Get admin analytics summary.

Access: Admin

Query parameters:
- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`

Summary includes:
- status counts
- top resources
- peak booking hours
- bookings by day
- today and this-week counts
- utilization metrics
- usage insights

## 15. Notification Types

Examples of notification types used by the system include:
- `booking_created`
- `booking_request`
- `booking_approved`
- `booking_rejected`
- `booking_cancelled`
- `booking_checked_in`
- `booking_completed`
- `role_updated`
- `account_suspended`

## 16. Common Error Scenarios

### `400 Bad Request`
Examples:
- invalid ID
- malformed request body
- invalid token payload
- overlapping booking
- check-in outside allowed time window

### `401 Unauthorized`
Examples:
- missing token
- invalid login credentials

### `403 Forbidden`
Examples:
- role not authorized
- inactive account
- suspended account

### `404 Not Found`
Examples:
- booking not found
- resource not found
- notification not found

### `409 Conflict`
Examples:
- time slot conflict
- already checked in
- approval conflict with another booking

## 17. Practical Postman Workflow

Recommended execution order for common manual testing:

1. Register or log in
2. Fetch resources
3. Create booking
4. Log in as admin
5. Approve or reject booking
6. Fetch approved booking and copy `qrCode`
7. Check in with `POST /bookings/:id/check-in`
8. Check out with `POST /bookings/:id/check-out`
9. Review notifications
10. Review analytics

## 18. Notes for Integrators

- Time values are stored and processed as dates; always send ISO-compatible date strings.
- QR verification uses the raw `bookingId|token` string, not just the booking ID.
- Resource availability endpoint is intended for live scheduling support, not historical reporting.
- Session behavior on the frontend relies on authenticated state plus browser session persistence.

## 19. Summary

The CampusBook API provides a complete backend for a multi-role academic booking platform. It includes secure authentication, resource discovery, booking lifecycle management, admin approval controls, staff review tools, notification handling, QR-based venue verification, user administration, and analytics reporting. The API is designed to support both browser-based application flows and Postman/manual integration testing.
