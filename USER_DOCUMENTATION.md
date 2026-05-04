# Campus Resource Booking System
## User Documentation

Version: 1.0  
Audience: End users, staff reviewers, and administrators  
Application: CampusBook

## 1. Introduction

CampusBook is a role-based campus resource booking platform designed to help users reserve university resources such as classrooms, seminar halls, laboratories, and study spaces. The system supports the full booking lifecycle, from account registration and booking creation to approval, QR-based venue verification, check-in, check-out, notifications, and account controls.

This guide explains how each type of user interacts with the system and what to expect during common tasks.

## 2. User Roles

CampusBook supports three main roles.

### Student
Students can:
- register and log in
- browse resources
- view live availability for each resource
- submit booking requests
- track booking status in `My Bookings`
- access booking QR codes after approval
- complete check-in and check-out
- view notifications and booking history

### Staff
Staff can:
- use normal user functions such as browsing resources and booking
- review booking requests in the staff workspace
- add staff recommendation notes for pending bookings
- view staff analytics

Staff do not have final approval or rejection authority.

### Administrator
Administrators can:
- approve or reject booking requests
- manage resources
- manage users
- monitor no-show records
- verify booking QR codes at the venue
- access analytics dashboards
- manage notifications and operational workflows

## 3. Accessing the System

### Login
To log in:
1. Open the login page.
2. Enter your registered email address and password.
3. Click `Sign In`.

After successful login, the system redirects the user to the correct dashboard based on role:
- students -> `/dashboard`
- staff -> `/staff/dashboard`
- administrators -> `/admin/dashboard`

### Registration
Public registration allows creation of:
- student accounts
- staff accounts

Administrative accounts are not created through public signup.

## 4. Session and Security Behavior

CampusBook uses authenticated sessions backed by token-based access control.

Important behaviors:
- a valid session remains active across page refresh while browser session data is still present
- invalid or missing session data redirects the user to the login page
- suspended users can still log in and browse some areas, but booking actions are blocked
- role guards prevent access to pages outside the user’s permission level

## 5. Browsing Resources

Users can browse all active resources from the `Resources` section.

### Available information
Each resource page may display:
- resource name
- category and type
- location
- capacity
- description
- amenities
- live weekly availability calendar

### Live availability
The resource details page shows a weekly booking calendar rather than a complete historical log of all past bookings. The calendar is used to help users:
- identify open time slots
- avoid conflicts
- see booked or pending slots
- avoid attempting to book unavailable time periods

Past weeks are intentionally restricted to keep the interface focused on future reservations.

## 6. Creating a Booking

To create a booking:
1. Open a resource details page.
2. Choose an available future time slot.
3. Continue to the booking form.
4. Enter:
   - date and time
   - booking purpose
   - expected attendees
   - optional notes
5. Submit the request.

### Booking rules
A booking request will be rejected if:
- required fields are missing
- the start time is in the past
- the end time is before the start time
- the expected attendees exceed resource capacity
- the resource is inactive
- another pending or approved booking overlaps the same time slot

Successful booking requests are created with `pending` status.

## 7. Managing Bookings

### My Bookings
The `My Bookings` page allows users to view bookings in three ways:
- `All`
- `Active`
- `History`

In the `All` view, bookings are grouped into:
- active bookings
- history

### Booking statuses
Common statuses include:
- `pending`
- `approved`
- `rejected`
- `cancelled`
- `completed`
- `no_show`

### Cancellation
Users can cancel their own eligible bookings. Once cancelled, the record moves into booking history.

## 8. Approval Workflow

### For administrators
Administrators review requests in the approvals page.

For each pending booking, the administrator can:
- approve the booking
- reject the booking with a reason

### For staff
Staff can review pending requests and add recommendation notes, but cannot make the final approval or rejection decision.

### Approval results
When a booking is approved:
- the booking status changes to `approved`
- a QR token and QR image are generated
- the user receives a notification

When a booking is rejected:
- the booking status changes to `rejected`
- the rejection reason is stored
- the user receives a notification

## 9. QR Check-In and Check-Out

Approved bookings use QR-based verification for venue access.

### Student-side QR
After approval, the user can open the booking QR code from `My Bookings`.

### Admin scanner
At the venue, an administrator can:
- scan the QR code using the camera
- upload a QR screenshot
- paste the QR token manually into the fallback field

### Check-in rules
Check-in is allowed only:
- for approved bookings
- from 15 minutes before booking start time
- until booking end time

### Check-out
After successful check-in, the user can end the session through check-out.

On successful check-out:
- `checkOutTime` is recorded
- actual usage duration is calculated
- booking status becomes `completed`

## 10. Notifications

CampusBook notifies users about important events such as:
- booking creation
- approval
- rejection
- cancellation
- check-in
- session completion
- role changes
- suspension

The notification bell shows unread counts. Opening the notification dropdown marks unread notifications as read.

## 11. No-Show and Suspension Rules

If an approved booking is not checked in within the allowed threshold, the no-show workflow may be applied.

Repeated no-show behavior can result in:
- incremented no-show count
- temporary suspension
- cancellation of future bookings during suspension

When suspended:
- the account displays a suspension message
- new booking requests are blocked
- future bookings may be cancelled automatically

## 12. Staff Workspace

Staff members have access to a review workspace where they can:
- see booking review queues
- filter records by pending, approved, completed, and rejected
- add staff recommendation notes
- view simplified analytics

This workspace supports decision-making, but final authority remains with administrators.

## 13. Admin Dashboard

The admin area provides access to:
- booking approvals
- resource management
- user management
- no-show management
- analytics
- QR verification

The analytics dashboard summarizes:
- total bookings
- pending bookings
- approved bookings
- rejected bookings
- cancellations
- completions
- no-shows
- usage patterns

## 14. Common Issues and Guidance

### Camera does not start in the scanner
If the scanner camera does not activate:
- click a camera mode button such as `Auto Camera`
- allow camera access when the browser prompt appears
- use QR image upload or manual fallback if camera access is blocked

### Login fails
Check:
- email format
- password correctness
- whether the account has been deactivated or suspended

### Booking cannot be created
Possible reasons:
- time conflict
- booking time is in the past
- invalid attendee count
- resource is inactive
- account is suspended

### Cannot access a page
The page may be restricted by role-based route protection. The system redirects or denies access automatically when a user attempts to open a page outside their allowed role.

## 15. Best Practices

- Book resources only for realistic and necessary time ranges.
- Check in on time for approved bookings.
- End the session through check-out when finished.
- Monitor notifications regularly.
- Avoid repeated missed bookings to prevent suspension.

## 16. Summary

CampusBook provides a complete booking workflow for academic resource management. It supports secure authentication, role-based access, resource browsing, booking creation, approval processing, QR-based verification, notifications, and operational controls such as no-show handling and suspension. Users should follow the expected booking lifecycle carefully to ensure successful reservations and continued account access.
