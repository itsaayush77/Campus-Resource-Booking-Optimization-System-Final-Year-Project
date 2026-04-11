# Campus Resource Booking System - Complete Setup Guide

## 📋 Project Overview

This is a full-stack MERN (MongoDB, Express, React, Node.js) application for managing campus resource bookings. Students and staff can request bookings for resources like seminar halls, computer labs, and projection equipment. Admins and staff coordinators can approve/deny requests and manage resources.

**Architecture:**
- **Backend**: Node.js/Express server (Port 5000)
- **Frontend**: React with Vite (Port 5173)
- **Database**: MongoDB (Local or Atlas)

---

## ⚙️ Prerequisites

Install these before starting:
1. **Node.js** (v14+) - [Download](https://nodejs.org/)
2. **MongoDB** - Either:
   - **Local**: [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - **Cloud**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
3. **Git** (optional) - [Download](https://git-scm.com/)

---

## 🚀 Quick Start (5 Minutes)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (see section below)
# Then edit it with your configuration
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### 3. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App opens at http://localhost:5173
```

**Terminal 3 - MongoDB (if running locally):**
```bash
# On Windows (if installed via installer):
# MongoDB automatically runs as a service

# Or start manually:
mongod
```

---

## 🔧 Environment Configuration

### Backend .env File

Create a file at `backend/.env`:

```env
# Node Environment
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/campus-booking

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production-12345
JWT_EXPIRE=7d

# Cloudinary (for image uploads - optional)
CLOUDINARY_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@campusbook.local
```

**How to get credentials:**

**MongoDB Local (Free):**
- Install MongoDB Community Server
- Default: `mongodb://localhost:27017/campus-booking`

**Cloudinary (Free tier - 25 credits/month):**
1. Sign up at https://cloudinary.com
2. Go to Dashboard → Settings
3. Copy Cloud Name, API Key, and API Secret

**Gmail SMTP:**
1. Enable 2-Factor Authentication on your Google account
2. Create an [App Password](https://myaccount.google.com/apppasswords)
3. Use the app password in `SMTP_PASS`

### Frontend .env.local File (Optional)

Create `frontend/.env.local` only if your backend is on a different URL:

```env
VITE_API_URL=http://127.0.0.1:5000/api
```

**Note:** This defaults correctly in development, so you can skip it for local development.

---

## 📊 Seed Demo Data

After starting the backend, populate the database with demo users and resources:

```bash
# In the backend directory, run:
npm run seed:demo
```

This creates:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@campusbook.local | Admin@123 |
| **Staff (Coordinator)** | staff.coordinator@campusbook.local | Staff@123 |
| **Staff (Labs)** | staff.labs@campusbook.local | Staff@123 |
| **Student** | student.one@campusbook.local | Student@123 |

**Resources created:**
- Seminar Hall (managed by Staff Coordinator)
- Library (managed by Staff Coordinator)
- Computer Lab (managed by Staff Labs)
- Chemistry Lab (managed by Staff Labs)
- Projector Kit (managed by Staff Coordinator)

---

## 🧪 Testing the Application

### 1. Test Student Flow
```
Login: student.one@campusbook.local / Student@123
1. Browse Resources → Click a resource
2. Select date/time → Submit booking
3. View in "My Bookings" → Status shows "Pending"
```

### 2. Test Staff/Admin Approval
```
Login: admin@campusbook.local / Admin@123
1. Go to Admin Dashboard → Booking Approvals
2. Review pending bookings
3. Approve or Deny
4. (Student sees updated status)
```

### 3. Test Resource Management
```
Login: staff.coordinator@campusbook.local / Staff@123
1. Go to Resource Management
2. View/Edit resources you manage
3. Update availability
```

---

## 🔌 MongoDB Setup Options

### Option 1: Local MongoDB (Recommended for Development)

**Windows Installation:**
1. Download [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Run installer and accept defaults
3. MongoDB runs as a Windows Service automatically
4. Verify connection: `mongod` should start without errors

**Connection String:**
```
MONGO_URI=mongodb://localhost:27017/campus-booking
```

**Verify MongoDB is running:**
```bash
# In a terminal, run:
mongosh

# You should see a connection prompt
# Type: show databases
# Type: exit
```

### Option 2: MongoDB Atlas (Cloud - Recommended for Production)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free M0 cluster
3. Create a database user (username/password)
4. Whitelist your IP: Security → IP Whitelist
5. Get connection string from Connect button
6. Update `.env`:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-booking?retryWrites=true&w=majority
```

---

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh-token` - Refresh JWT

### Resources
- `GET /api/resources` - List all resources
- `GET /api/resources/:id` - Resource details
- `POST /api/resources` - Create (admin only)
- `PUT /api/resources/:id` - Update (admin only)
- `DELETE /api/resources/:id` - Delete (admin only)

### Bookings
- `GET /api/bookings/my-bookings` - User's bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Booking details
- `PUT /api/bookings/:id` - Update booking status (staff/admin)

### Admin
- `GET /api/admin/analytics` - Dashboard analytics
- `GET /api/admin/bookings/pending` - Pending approvals
- `PUT /api/admin/bookings/:id/approve` - Approve booking
- `PUT /api/admin/bookings/:id/deny` - Deny booking

Full API documentation available in backend code.

---

## 🐛 Troubleshooting

### "MongoDB connection error"
```
✓ Ensure MongoDB is running (mongosh should connect)
✓ Check MONGO_URI in .env
✓ If using Atlas, verify IP whitelist includes your IP
```

### "CORS error - Origin not allowed"
```
✓ Verify FRONTEND_URL in .env matches your frontend URL
✓ For 127.0.0.1 vs localhost issues, use 127.0.0.1 consistently
```

### "Cannot find module ['dotenv', 'express', etc]"
```
✓ Run: npm install in the affected directory
✓ Delete node_modules and reinstall: rm -r node_modules && npm install
```

### "Port 5000 already in use"
```
✓ Kill process: lsof -ti:5000 | xargs kill -9 (Mac/Linux)
✓ Or change in server.js: const PORT = process.env.PORT || 5001;
```

### "Vite dev server shows 502 error"
```
✓ Ensure backend is running on port 5000
✓ Check VITE_API_URL points to correct backend URL
✓ Use http://127.0.0.1:5000 instead of localhost
```

### "Images not uploading - Cloudinary error"
```
✓ Create free Cloudinary account at cloudinary.com
✓ Get Cloud Name, API Key, API Secret from Dashboard
✓ Add to .env and restart backend
✓ Or skip images for now (form will work without)
```

---

## 📦 Project Structure

```
campus-booking/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middlewares/     # Auth, validation, error handling
│   ├── services/        # Business logic
│   ├── jobs/           # Scheduled tasks (no-show handling)
│   ├── scripts/        # Seed scripts
│   ├── server.js       # Entry point
│   ├── package.json
│   └── .env            # Create this ← IMPORTANT
│
└── frontend/
    ├── src/
    │   ├── api/         # Axios API calls
    │   ├── pages/       # Page components
    │   ├── admin/       # Admin dashboard
    │   ├── bookings/    # Booking pages
    │   ├── components/  # Reusable components
    │   ├── context/     # Auth context
    │   ├── hooks/       # Custom hooks
    │   ├── router/      # Route configuration
    │   ├── utils/       # Helpers
    │   └── App.jsx
    ├── package.json
    ├── vite.config.js
    └── .env.local       # Create if needed
```

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Change `NODE_ENV=production`
- [ ] Generate strong `JWT_SECRET`
- [ ] Use MongoDB Atlas (not local)
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Set up email credentials (Gmail/SendGrid)
- [ ] Set up Cloudinary for image uploads
- [ ] Build frontend: `npm run build`
- [ ] Set node environment variables in hosting platform
- [ ] Test all user flows in production

---

## 📚 Useful Commands

```bash
# Backend
npm install              # Install dependencies
npm run dev             # Start server (watch mode)
npm run dev:nodemon     # Start with nodemon auto-reload
npm run seed:demo       # Load demo data
npm run seed:resources  # Load resources only

# Frontend
npm install             # Install dependencies
npm run dev             # Start dev server (hot reload)
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Check for code issues
```

---

## 🤝 Common Workflows

### Adding a New Resource
1. Login as Admin
2. Go to Resource Management
3. Click "Add Resource"
4. Fill in details and assign to staff
5. Students can now see it in "Browse Resources"

### Approving Bookings
1. Login as Staff/Admin
2. Go to "Booking Approvals"
3. Review booking details
4. Click Approve or Deny
5. Student gets notification (if email configured)

### User Roles & Permissions
- **Student**: Can browse resources and request bookings
- **Staff**: Can manage assigned resources and approve bookings
- **Admin**: Full access to all resources and administrative functions

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review MongoDB and Express.js documentation
3. Check console logs in Terminal for specific error messages
4. Verify all .env variables are correctly set

---

## ✅ You're Ready!

Once setup is complete, you should see:
- ✅ Backend running at http://localhost:5000
- ✅ Frontend running at http://localhost:5173
- ✅ Database populated with demo users
- ✅ Can login with demo credentials

Happy coding! 🎉
