# API Reference & Features - Campus Resource Booking System

## 📚 API Overview

**Base URL:** `http://localhost:5000/api`

Most endpoints require authentication via JWT token in `Authorization: Bearer <token>` header.

---

## 🔐 Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@student.local",
  "password": "SecurePass@123",
  "role": "student"  // "student", "staff", or "admin"
}

Response: { token, user { id, name, email, role } }
```

### Login
```
POST /auth/login
{
  "email": "john@student.local",
  "password": "SecurePass@123"
}

Response: { token, user, refreshToken }
```

### Logout
```
POST /auth/logout
Authorization: Bearer <token>

Response: { message: "Logged out successfully" }
```

### Refresh Token
```
POST /auth/refresh-token
Authorization: Bearer <token>

Response: { token }
```

### Forgot Password
```
POST /auth/forgot-password
{
  "email": "john@student.local"
}

Response: { message: "Reset link sent to email" }
```

### Reset Password
```
POST /auth/reset-password/:token
{
  "password": "NewSecure@123"
}

Response: { message: "Password reset successful" }
```

---

## 📦 Resource Endpoints

### Get All Resources
```
GET /resources
?status=available&sort=name

Response: [
  {
    _id: "...",
    name: "Seminar Hall A",
    description: "Large hall for presentations",
    capacity: 100,
    location: "Building A, Floor 2",
    image: "url",
    status: "available",
    managedBy: { id, name }
  }
]
```

### Get Resource Details
```
GET /resources/:id

Response: {
  _id: "...",
  name: "...",
  capacity: 100,
  availability: [
    { day: "Monday", startTime: "09:00", endTime: "17:00" },
    { day: "Tuesday", startTime: "09:00", endTime: "17:00" }
  ]
}
```

### Create Resource (Admin Only)
```
POST /resources
Authorization: Bearer <token>
{
  "name": "New Lab",
  "description": "State-of-the-art laboratory",
  "capacity": 50,
  "location": "Building B",
  "availability": [
    { day: "Monday", startTime: "09:00", endTime: "17:00" }
  ],
  "managedBy": "staff-user-id"
}
```

### Update Resource (Admin/Staff)
```
PUT /resources/:id
Authorization: Bearer <token>
{
  "name": "Updated Name",
  "capacity": 75,
  "availability": [...]
}
```

### Delete Resource (Admin Only)
```
DELETE /resources/:id
Authorization: Bearer <token>
```

---

## 📅 Booking Endpoints

### Create Booking
```
POST /bookings
Authorization: Bearer <token>
{
  "resourceId": "resource-id",
  "date": "2024-12-15",
  "startTime": "14:00",
  "endTime": "16:00",
  "purpose": "Team meeting",
  "attendees": 20
}

Response: {
  _id: "booking-id",
  status: "pending",
  createdAt: "2024-11-20T10:30:00Z"
}
```

### Get My Bookings
```
GET /bookings/my-bookings
Authorization: Bearer <token>
?status=pending

Response: [
  {
    _id: "...",
    resourceId: { name: "Seminar Hall" },
    date: "2024-12-15",
    startTime: "14:00",
    endTime: "16:00",
    status: "pending",
    createdAt: "..."
  }
]
```

### Get Booking Details
```
GET /bookings/:id
Authorization: Bearer <token>
```

### Cancel Booking
```
PUT /bookings/:id
Authorization: Bearer <token>
{
  "status": "cancelled",
  "reason": "Schedule conflict"
}
```

### QR Code Check-in (at booking time)
```
POST /bookings/:id/check-in
Authorization: Bearer <token>

Response: { message: "Checked in successfully", checkInTime: "..." }
```

---

## ✅ Booking Approval Endpoints (Staff/Admin)

### Get Pending Bookings
```
GET /bookings/pending
Authorization: Bearer <token>
?resourceId=resource-id&status=pending

Response: [ { booking details } ]
```

### Approve Booking
```
PUT /bookings/:id/approve
Authorization: Bearer <token>
{
  "approvalNotes": "Approved for event"
}

Response: { status: "approved" }
```

### Deny Booking
```
PUT /bookings/:id/deny
Authorization: Bearer <token>
{
  "denialReason": "Not available at that time"
}

Response: { status: "denied" }
```

### Mark as No-Show
```
PUT /bookings/:id/no-show
Authorization: Bearer <token>

Response: { status: "no-show" }
```

---

## 👥 Admin Endpoints

### Dashboard Analytics
```
GET /admin/analytics
Authorization: Bearer <token>

Response: {
  totalBookings: 150,
  totalUsers: 45,
  totalResources: 8,
  bookingsByStatus: {
    pending: 5,
    approved: 100,
    denied: 10,
    completed: 35
  },
  recentBookings: [...],
  resourceUsage: [...]
}
```

### Get All Users (Admin Only)
```
GET /admin/users
Authorization: Bearer <token>
?role=student&search=name

Response: [ { id, name, email, role } ]
```

### Update User Role (Admin Only)
```
PUT /admin/users/:id
Authorization: Bearer <token>
{
  "role": "staff"
}
```

### Suspend User (Admin Only)
```
PUT /admin/users/:id/suspend
Authorization: Bearer <token>
```

---

## 🔔 Notification Endpoints

### Get My Notifications
```
GET /notifications
Authorization: Bearer <token>

Response: [
  {
    _id: "...",
    type: "booking_approved",
    message: "Your booking has been approved",
    read: false,
    createdAt: "..."
  }
]
```

### Mark Notification as Read
```
PUT /notifications/:id/read
Authorization: Bearer <token>
```

### Delete Notification
```
DELETE /notifications/:id
Authorization: Bearer <token>
```

---

## 🧪 Health Check

### API Status
```
GET /
Response: { message: "API Server Running" }
```

---

## 📊 Booking Status Flow

```
pending → approved → completed
   ↓
  denied

completed → checked-in → no-show
```

---

## 🔑 User Roles & Permissions

| Action | Student | Staff | Admin |
|--------|---------|-------|-------|
| Browse Resources | ✅ | ✅ | ✅ |
| Create Booking | ✅ | ✅ | ✅ |
| View Own Bookings | ✅ | ✅ | ✅ |
| View All Bookings | ❌ | ✅ | ✅ |
| Approve Booking | ❌ | ✅* | ✅ |
| Create Resource | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ❌ | ✅ |

*Staff can only approve bookings for resources they manage

---

## 🔄 Common Workflows

### 1. Student Books a Resource
```
1. GET /resources → Browse available resources
2. GET /resources/:id → View details and availability
3. POST /bookings → Create booking (status: pending)
4. Notification: Booking created
5. Wait for staff approval
```

### 2. Staff Approves Booking
```
1. GET /bookings/pending → View pending requests
2. PUT /bookings/:id/approve → Approve with notes
3. Notification: Student notified of approval
4. At booking time → Student can check in
```

### 3. Student Checks In
```
1. At resource location with phone
2. POST /bookings/:id/check-in → Scan QR or manual check-in
3. Booking status changes to checked-in
4. Staff sees resource is in use
```

### 4. No-Show Handling
```
1. If student doesn't check-in by end time
2. Automated job runs (scheduled)
3. PUT /bookings/:id/no-show → Mark as no-show
4. Impact on student's account (future limits)
```

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists or conflict |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## 🧪 Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student.one@campusbook.local","password":"Student@123"}'
```

### Get Resources
```bash
curl http://localhost:5000/api/resources
```

### Get My Bookings (with token)
```bash
curl http://localhost:5000/api/bookings/my-bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📱 Frontend Routes

| Route | Component | Role |
|-------|-----------|------|
| `/` | Home | All |
| `/login` | Login | All |
| `/signup` | Register | All |
| `/resources` | Browse Resources | Student+ |
| `/resources/:id` | Resource Details | Student+ |
| `/resources/:id/book` | Booking Form | Student+ |
| `/my-bookings` | My Bookings List | Student+ |
| `/notifications` | Notifications | Student+ |
| `/profile` | User Profile | Student+ |
| `/admin` | Admin Dashboard | Admin |
| `/admin/approvals` | Booking Approvals | Staff+ |
| `/admin/resources` | Resource Management | Admin |
| `/admin/analytics` | Analytics | Admin |
| `/admin/users` | User Management | Admin |

---

Last updated: 2024
