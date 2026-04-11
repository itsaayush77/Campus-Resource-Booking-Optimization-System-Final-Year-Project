# Quick Start Checklist - Campus Resource Booking System

## ✅ Step-by-Step Setup

### Phase 1: Prerequisites (5 minutes)
- [ ] Install Node.js v14+ from https://nodejs.org/
- [ ] Install MongoDB Community or create MongoDB Atlas account
- [ ] (Optional) Create Cloudinary account for image uploads
- [ ] (Optional) Create Mailtrap or Gmail app password for email

### Phase 2: Environment Setup (3 minutes)
- [ ] Create `backend/.env` (copy from `backend/.env.example`)
- [ ] Set `MONGO_URI` to your MongoDB connection string:
  - Local: `mongodb://localhost:27017/campus-booking`
  - Cloud: MongoDB Atlas connection string
- [ ] Set `JWT_SECRET` to a random string (for production)
- [ ] Set `FRONTEND_URL=http://localhost:5173`
- [ ] (Optional) Add Cloudinary credentials
- [ ] (Optional) Add email credentials for notifications

### Phase 3: Dependencies (5 minutes)
- [ ] Backend: `cd backend && npm install`
- [ ] Frontend: `cd frontend && npm install`

### Phase 4: Start Services (1 minute)

**Open Terminal 1 - MongoDB (if local):**
```bash
mongod
```

**Open Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# Wait for: "MongoDB Connected: localhost"
# And: "Server running on port 5000"
```

**Open Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
# Wait for: "VITE v... ready in 500ms"
```

### Phase 5: Load Demo Data (2 minutes)
- [ ] In backend terminal, run: `npm run seed:demo`
- [ ] Wait for success message with demo credentials

### Phase 6: First Test (5 minutes)
- [ ] Open browser: http://localhost:5173
- [ ] Login as: `student.one@campusbook.local` / `Student@123`
- [ ] Browse resources and create a test booking
- [ ] Login as admin: `admin@campusbook.local` / `Admin@123`
- [ ] Go to Booking Approvals and approve the test booking

---

## 📋 What's Included

### Documents Created
| File | Purpose |
|------|---------|
| **SETUP_GUIDE.md** | Complete setup walkthrough with explanations |
| **TROUBLESHOOTING.md** | Solutions for common errors |
| **API_REFERENCE.md** | Full API documentation with cURL examples |
| **setup.bat** | Automated setup for Windows (batch) |
| **setup.ps1** | Automated setup for Windows (PowerShell) |

### Configuration Files
| File | Purpose |
|------|---------|
| **backend/.env.example** | Template for environment variables |
| **frontend/.env.example** | Optional frontend configuration |

---

## 🚀 Quick Start Methods

### Method 1: Automated (Easiest)
**Windows Batch:**
```bash
setup.bat
```

**Windows PowerShell:**
```bash
powershell -ExecutionPolicy Bypass -File setup.ps1
```

### Method 2: Manual (More Control)
Follow steps in "Step-by-Step Setup" section above

### Method 3: Docker (Advanced)
Coming soon - not yet implemented

---

## 🎯 Demo Accounts (after seed:demo)

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@campusbook.local | Admin@123 | Admin |
| Coordinator | staff.coordinator@campusbook.local | Staff@123 | Staff |
| Lab Manager | staff.labs@campusbook.local | Staff@123 | Staff |
| John (Student) | student.one@campusbook.local | Student@123 | Student |

---

## 🔗 Key URLs

| Purpose | URL |
|---------|-----|
| Frontend App | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| MongoDB (local) | mongodb://localhost:27017 |
| MongoDB (Atlas) | mongodb+srv://... |

---

## 📦 Resources Created in Demo

| Resource | Type | Capacity | Managed by |
|----------|------|----------|-----------|
| Seminar Hall | Conference | 100 | Staff Coordinator |
| Library | Study | 50 | Staff Coordinator |
| Computer Lab | Lab | 30 | Staff Labs |
| Chemistry Lab | Lab | 25 | Staff Labs |
| Projector Kit | Equipment | 200 | Staff Coordinator |

---

## ⚠️ If Something Goes Wrong

1. **Check MongoDB is running:**
   ```bash
   mongosh
   > show databases
   > exit
   ```

2. **Verify ports are free:**
   - Backend: 5000
   - Frontend: 5173
   - MongoDB: 27017

3. **Check backend is working:**
   - Open: http://localhost:5000/
   - Should show: `{"message":"API Server Running"}`

4. **Check .env file:**
   - All required variables set
   - No syntax errors
   - Restart backend after changes

5. **Clear cache and restart:**
   ```bash
   # Clear browser cookies
   # DevTools (F12) → Application → Clear Site Data
   
   # Restart services
   npm run dev
   ```

**For detailed troubleshooting, see: TROUBLESHOOTING.md**

---

## 📚 Next Steps

### After Setup Works:
1. **Explore the code:**
   - Backend: `backend/routes/`, `backend/controllers/`
   - Frontend: `frontend/src/pages/`, `frontend/src/api/`

2. **Test all workflows:**
   - Student booking flow
   - Staff approval flow
   - Admin dashboard
   - Notification system

3. **Customize:**
   - Update branding (colors, logo)
   - Add your campus resources
   - Customize email templates
   - Add custom fields to forms

4. **Deploy (optional):**
   - See "Deployment Checklist" in SETUP_GUIDE.md

---

## 💡 Tips

- **Use 127.0.0.1 instead of localhost** on Windows if you get network errors
- **Keep 3 terminals open** (MongoDB, Backend, Frontend)
- **Check console logs** (F12 in browser) when something doesn't work
- **Restart services** in order: MongoDB → Backend → Frontend
- **API calls visible in Network tab** (F12 → Network) for debugging
- **Use demo accounts** to test different user roles

---

## 📞 Common Issues Quick Links

- 🔗 **MongoDB won't connect?** → See TROUBLESHOOTING.md section 1
- 🔗 **CORS error?** → See TROUBLESHOOTING.md section 2  
- 🔗 **Port already in use?** → See TROUBLESHOOTING.md section 3
- 🔗 **npm install failing?** → See TROUBLESHOOTING.md section 4
- 🔗 **Login not working?** → See TROUBLESHOOTING.md section 5
- 🔗 **Images won't upload?** → See TROUBLESHOOTING.md section 6

---

## 🎉 Success Checklist

You'll know everything is working when:
- ✅ Backend starts without errors
- ✅ "MongoDB Connected: localhost" appears
- ✅ Frontend opens at localhost:5173
- ✅ You can login with demo account
- ✅ You can see the resources list
- ✅ You can create a booking
- ✅ No red errors in browser console (F12)
- ✅ No red errors in backend terminal

---

## 📖 Documentation

| Document | Quick Summary |
|----------|---------------|
| **SETUP_GUIDE.md** | 📖 Complete setup with detailed explanations (read first!) |
| **TROUBLESHOOTING.md** | 🔧 Solutions for when things don't work |
| **API_REFERENCE.md** | 📚 All API endpoints with examples |
| **README.md** | 📝 Project overview and features |

---

**Estimated total setup time: 20-30 minutes**

Ready? Start with `setup.bat` or follow the "Step-by-Step Setup" above!

Last updated: 2024
