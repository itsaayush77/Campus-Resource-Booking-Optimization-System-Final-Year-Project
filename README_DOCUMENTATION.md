# 📚 Documentation Guide

This project includes comprehensive documentation to help you set up, understand, and troubleshoot the Campus Resource Booking System.

## Where to Start? 🎯

### For First-Time Setup:
1. **Start here:** [QUICK_START.md](./QUICK_START.md) (5 min read)
2. **Detailed guide:** [SETUP_GUIDE.md](./SETUP_GUIDE.md) (Complete walkthrough)
3. **Hit a problem?** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) (Solutions)

### For Development:
1. **API endpoints:** [API_REFERENCE.md](./API_REFERENCE.md)
2. **Project structure:** See directory layout below
3. **Code documentation:** Comments in source files

---

## 📄 Available Documents

### 1. **QUICK_START.md** ⚡
**Best for:** Getting running in 20-30 minutes

- Checklist format
- Step-by-step instructions
- Key URLs and demo accounts
- Quick troubleshooting links
- Estimated times per step

**Read if you want:** To set up and test the application ASAP

---

### 2. **SETUP_GUIDE.md** 📖
**Best for:** Understanding the full setup process

- Project overview and architecture
- Detailed prerequisites
- Environment variable explanations
- MongoDB setup options (local + cloud)
- Seed data walkthrough
- API endpoint overview
- Role-based access permissions
- Deployment checklist
- 30+ pages of detailed information

**Read if you want:** To fully understand the system before setting up

---

### 3. **TROUBLESHOOTING.md** 🔧
**Best for:** When something doesn't work

- 10 major categories of issues
- Error messages with solutions
- Step-by-step diagnostic procedures
- Network, database, and CORS debugging
- Email and image upload setup
- Database seeding issues
- Browser DevTools tips
- Clear before/after instructions

**Read if you want:** To fix something that broke

---

### 4. **API_REFERENCE.md** 📚
**Best for:** Understanding API endpoints

- Complete endpoint documentation
- Request/response examples
- Authentication flow
- Booking status flow
- User roles and permissions
- Common workflows
- Error codes
- cURL testing examples
- Frontend route mapping

**Read if you want:** To build with the API or understand how it works

---

### 5. **QUICK_START_WINDOWS.md** (this file)
**Best for:** Windows-specific setup

- Windows batch script (`setup.bat`)
- PowerShell script (`setup.ps1`)
- Windows-specific troubleshooting
- Service management commands

**Read if you want:** To use automated Windows scripts

---

## 🚀 Quick Setup (TL;DR)

```bash
# 1. Run automated setup
setup.bat
# OR
powershell -ExecutionPolicy Bypass -File setup.ps1

# 2. Create backend/.env with:
MONGO_URI=mongodb://localhost:27017/campus-booking
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# 3. Start services (3 terminals):
# Terminal 1:
mongod

# Terminal 2:
cd backend && npm run dev

# Terminal 3:
cd frontend && npm run dev

# 4. Seed demo data:
npm run seed:demo  # (in backend directory)

# 5. Open browser:
http://localhost:5173
```

---

## 📊 Project Structure

```
campus-booking/
├── QUICK_START.md           ← START HERE!
├── SETUP_GUIDE.md           ← Complete setup guide
├── TROUBLESHOOTING.md       ← Solutions for problems
├── API_REFERENCE.md         ← API documentation
├── setup.bat                ← Windows batch installer
├── setup.ps1                ← Windows PowerShell installer
│
├── backend/
│   ├── .env.example         ← Copy to .env and configure
│   ├── server.js            ← Main server file
│   ├── package.json
│   │
│   ├── config/
│   │   └── db.js            ← Database connection
│   │
│   ├── models/
│   │   ├── User.js          ← User schema
│   │   ├── Bookings.js      ← Booking schema
│   │   ├── Resource.js      ← Resource schema
│   │   └── Notification.js  ← Notification schema
│   │
│   ├── routes/
│   │   ├── authRoutes.js    ← /api/auth endpoints
│   │   ├── resourceRoutes.js ← /api/resources endpoints
│   │   ├── bookingRoutes.js ← /api/bookings endpoints
│   │   └── ...
│   │
│   ├── controllers/
│   │   ├── authController.js ← Auth logic
│   │   ├── bookingController.js ← Booking logic
│   │   └── ...
│   │
│   ├── services/
│   │   └── notificationService.js
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js ← JWT verification
│   │   └── ...
│   │
│   ├── jobs/
│   │   └── noShowScheduler.js ← Scheduled tasks
│   │
│   └── scripts/
│       ├── seedResources.js  ← Load resources
│       └── seedDemoData.js   ← Load full demo
│
└── frontend/
    ├── .env.example         ← Optional config
    ├── package.json
    ├── vite.config.js       ← Build config
    │
    ├── src/
    │   ├── main.jsx         ← Entry point
    │   ├── App.jsx          ← Main app component
    │   │
    │   ├── api/             ← API calls (axios)
    │   │   ├── api.js       ← Base config
    │   │   ├── authApi.js
    │   │   └── ...
    │   │
    │   ├── pages/           ← Page components
    │   │   ├── Home.jsx
    │   │   ├── auth/
    │   │   │   ├── Login.jsx
    │   │   │   └── Signup.jsx
    │   │   └── resources/
    │   │       ├── BrowseResources.jsx
    │   │       └── BookingForm.jsx
    │   │
    │   ├── components/      ← Reusable components
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── ...
    │   │
    │   ├── admin/           ← Admin pages
    │   │   ├── AdminDashboard.jsx
    │   │   └── BookingApprovals.jsx
    │   │
    │   ├── context/         ← State management
    │   │   └── AuthContext.jsx
    │   │
    │   ├── hooks/           ← Custom hooks
    │   │   └── userAuth.js
    │   │
    │   └── utils/           ← Helper functions
    │       ├── authStorage.js
    │       └── helpers.js
    └── ...
```

---

## 🔧 Configuration Files

### Backend (.env)
```env
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/campus-booking
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com       # Optional
SMTP_PORT=587                  # Optional
SMTP_USER=your-email@gmail.com # Optional
SMTP_PASS=your-app-password    # Optional
```

### Frontend (.env.local - Optional)
```env
VITE_API_URL=http://127.0.0.1:5000/api
```

---

## 🧪 Key Scripts

```bash
# Backend
npm install                # Install dependencies
npm run dev               # Start server with auto-reload
npm run seed:demo         # Load demo data + users
npm run seed:resources    # Load resources only

# Frontend
npm install               # Install dependencies
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Check code quality
```

---

## 📌 Common Tasks

### Setting up from scratch
→ See **QUICK_START.md**

### Detailed setup with explanations
→ See **SETUP_GUIDE.md**

### Something doesn't work
→ Check **TROUBLESHOOTING.md**

### Building with the API
→ Use **API_REFERENCE.md**

### Deploying to production
→ See "Deployment Checklist" in **SETUP_GUIDE.md**

### Adding custom features
→ Review code in `backend/routes/` and `frontend/src/pages/`

---

## 🎯 Learning Path

**New to the project?**
1. Read: QUICK_START.md (5 min)
2. Run: setup.bat or setup.ps1
3. Test: Login and create a booking
4. Explore: Review code in key directories

**Developing features?**
1. Study: API_REFERENCE.md
2. Check: Backend routes and controllers
3. Check: Frontend components and API calls
4. Test: Using demo accounts

**Deploying?**
1. Read: SETUP_GUIDE.md → Deployment section
2. Configure: Production environment variables
3. Build: `npm run build` in frontend
4. Deploy: Your hosting platform

---

## 💡 Tips

- **Use the quick references:** Bookmark QUICK_START.md and API_REFERENCE.md
- **Check Troubleshooting first:** Many issues have known solutions
- **Keep console.log friendly:** Check browser DevTools (F12) for errors
- **Port mapping:** Backend (5000), Frontend (5173), MongoDB (27017)
- **Token storage:** Check Application tab in DevTools for auth token

---

## 🔗 External Resources

- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Mongoose Docs](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/)

---

## ❓ FAQ

**Q: Which document should I read first?**
A: **QUICK_START.md** - it's designed for this

**Q: How long does setup take?**
A: 20-30 minutes (automated setup is faster)

**Q: Can I skip MongoDB setup?**
A: No, it's required for the database

**Q: Do I need Cloudinary and email?**
A: No, but some features won't work without them

**Q: How do I test the API?**
A: Use demo accounts or see cURL examples in API_REFERENCE.md

**Q: Can I change the port?**
A: Yes, see TROUBLESHOOTING.md section on port conflicts

---

## 📞 Need Help?

1. **Check TROUBLESHOOTING.md** - Most issues are documented
2. **Look at the code comments** - Well documented
3. **Check browser console** (F12) - JavaScript errors shown there
4. **Check backend terminal** - Server errors shown there
5. **Verify .env file** - Missing variables cause many issues

---

**Last Updated:** 2024

**Version:** 1.0

**Status:** Ready for Development

Happy coding! 🚀
