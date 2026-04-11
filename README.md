# Campus Resource Booking System

A full-stack campus booking platform with role-based access, admin approvals, QR check-in/out, notifications, no-show handling, and analytics.

## Tech Stack
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express + MongoDB (Mongoose)
- Auth: JWT-based authentication with role guards

## Prerequisites
- Node.js 18+
- npm 9+
- MongoDB running locally or a cloud MongoDB URI

## 1) Clone and Install

```bash
# from repository root
cd backend
npm install

cd ../frontend
npm install
```

## 2) Configure Environment

Create backend environment file:

```bash
cd backend
cp .env.example .env
```

Update required values in `backend/.env`:
- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- SMTP keys (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)

Optional for local password-reset testing:
- `EXPOSE_RESET_LINK=true`

## 3) Seed Realistic Demo Data

From `backend`:

```bash
npm run seed:demo
```

This creates:
- Multiple resources across categories (classroom, lab, seminar hall, sports facility, equipment, auditorium, library room)
- Demo users (students, staff, and admin)
- Sample bookings across states (pending, approved, rejected, cancelled, completed, no_show)
- Sample notifications

Demo credentials:
- Admin: `admin@campusbook.local` / `Admin@123`
- Staff: `staff.coordinator@campusbook.local` / `Staff@123`
- Student: `student.one@campusbook.local` / `Student@123`

## 4) Run Backend and Frontend

Terminal 1 (backend):

```bash
cd backend
npm run dev
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

Open the app at `http://localhost:5173`.

## 5) Fresh-Clone Sanity Checklist (Clean DB)
- Login works for seeded admin/staff/student users.
- Browse resources and create a booking request.
- Admin approves/rejects from booking approvals.
- Approved booking supports QR check-in/out flow.
- Notifications appear in bell and notifications page.
- Analytics page and dashboard KPIs load.

## Production Notes
- Set strong `JWT_SECRET`.
- Configure a real SMTP provider.
- Set `NODE_ENV=production` and correct `FRONTEND_URL`.
