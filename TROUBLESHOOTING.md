# Troubleshooting Guide - Campus Resource Booking System

## 🔧 Common Issues & Solutions

### 1. MongoDB Connection Errors

#### Error: `MongoNetworkError: connect ECONNREFUSED`
```
MongoDB Connection Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Diagnosis:** MongoDB is not running

**Solutions:**
- **Local MongoDB:**
  ```bash
  # Windows: Check if MongoDB Service is running
  # Services (services.msc) > MongoDB Server > Status should be "Running"
  
  # Or start from command line:
  mongod
  
  # Verify connection:
  mongosh
  > show databases
  > exit
  ```

- **MongoDB Atlas (Cloud):**
  1. Check internet connection
  2. Verify connection string in .env
  3. Check IP whitelist: https://cloud.mongodb.com/v2 → Security → IP Whitelist
  4. Your current IP might be different (mobile hotspot, VPN, etc)
  5. Temporarily add 0.0.0.0/0 to allow all IPs (development only!)

#### Error: `Invalid MongoDB URI`
```
MongoParseError: Invalid connection string
```

**Check:**
- Syntax errors in MONGO_URI
- Special characters need URL encoding (use `%` encoding)
- Example: password `P@ssw0rd!` → `P%40ssw0rd%21`

**Correct format:**
```
Local:  mongodb://localhost:27017/database-name
Atlas:  mongodb+srv://user:pass@cluster.mongodb.net/database?retryWrites=true&w=majority
```

---

### 2. CORS & Connection Errors

#### Error: `Access to XMLHttpRequest blocked by CORS policy`
```
Access to XMLHttpRequest at 'http://localhost:5000/api/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Diagnosis:** Frontend and backend CORS settings don't match

**Solutions:**
1. **Check FRONTEND_URL in backend .env:**
   ```env
   FRONTEND_URL=http://localhost:5173
   ```

2. **Check dev server settings in backend/server.js:**
   - Development mode should allow all origins
   - Production mode should check FRONTEND_URL matches

3. **Use correct URLs:**
   - Avoid mixing `localhost` and `127.0.0.1`
   - ⚠️ **Windows issue:** `localhost` often resolves to IPv6 (::1), but Express listens on IPv4
   - ✅ **Solution:** Use `127.0.0.1` consistently

4. **Check frontend API configuration:**
   ```javascript
   // Should be pointing to correct backend
   const baseURL = "http://127.0.0.1:5000/api"
   ```

---

#### Error: `Network Error - No Network Connection`
```
Backend is running but frontend shows "Network Error"
```

**Diagnosis:** Frontend can't reach backend

**Steps:**
1. Test backend directly in browser:
   - Open: http://127.0.0.1:5000/
   - Should show: `{"message":"API Server Running"}`

2. Check VITE_API_URL:
   ```bash
   # frontend/.env.local should have:
   VITE_API_URL=http://127.0.0.1:5000/api
   ```

3. Restart frontend after changing .env:
   ```bash
   # Kill the running dev server and restart
   npm run dev
   ```

4. Check network tab in browser DevTools (F12):
   - Look at failed requests
   - Check request URL matches backend

---

### 3. Port Conflicts

#### Error: `Port 5000 already in use`
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**
```bash
# Option 1: Kill process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Option 2: Use different port in server.js:
const PORT = process.env.PORT || 5001;

# Option 3: Set PORT in .env:
PORT=5001
```

#### Error: `Port 5173 already in use`
```
Port 5173 is in use.
Use --port to specify a different one.
```

**Solution:**
```bash
# Specify different port:
npm run dev -- --port 5174
```

---

### 4. npm Install Issues

#### Error: `npm ERR! code ERESOLVE`
```
npm ERR! Found: peer dep version conflicts while installing
```

**Solutions:**
```bash
# Option 1: Force dependency resolution
npm install --legacy-peer-deps

# Option 2: Clean and reinstall
rm -r node_modules
npm cache clean --force
npm install
```

#### Error: `npm ERR! ENOENT: no such file or directory`
```
ENOENT: no such file or directory, open 'path/to/package.json'
```

**Diagnosis:** Wrong directory

**Solution:**
```bash
# Ensure you're in correct directory
cd backend    # for backend setup
# OR
cd frontend   # for frontend setup
npm install
```

---

### 5. Authentication & JWT Issues

#### Error: `Invalid JWT Token` when logging in
```
UnauthorizedError: invalid token
```

**Possible causes:**
1. **JWT_SECRET in .env is not set or empty**
   ```env
   JWT_SECRET=your-secret-key
   ```

2. **Backend restarted with different JWT_SECRET:**
   - Old tokens become invalid
   - Clear browser cookies and login again
   - DevTools → Application → Cookies → Delete all

3. **Token expired:**
   ```env
   JWT_EXPIRE=7d
   ```

**Fix:**
```bash
# 1. Set JWT_SECRET in .env
# 2. Restart backend: npm run dev
# 3. Clear browser cookies
# 4. Try logging in again
```

#### Error: `401 Unauthorized - Login required`
```
Accessing protected routes without valid token
```

**Solutions:**
1. Refresh token from /api/auth/refresh-token
2. Check token stored in localStorage: `DevTools → Application → Local Storage → authToken`
3. Login again if token is missing or expired

---

### 6. Image Upload / Cloudinary Issues

#### Error: `Upload failed - Cloudinary error`
```
Error: Invalid Cloudinary credentials
```

**Diagnosis:** Cloudinary credentials not set

**Solutions:**
1. **Create free Cloudinary account:**
   - Go to https://cloudinary.com
   - Sign up (free tier: 25 credits/month)

2. **Get credentials:**
   - Dashboard → Settings → Copy:
     - Cloud Name
     - API Key
     - API Secret

3. **Add to backend .env:**
   ```env
   CLOUDINARY_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Test upload:**
   - Restart backend: `npm run dev`
   - Try uploading an image

**Or skip it:**
- Images are optional
- Remove image upload fields from forms
- Everything else will work fine

---

### 7. Email / SMTP Issues

#### Error: `Failed to send email`
```
Error: Invalid SMTP credentials
```

**Using Gmail:**
1. Enable 2-Factor Authentication
2. Generate [App Password](https://myaccount.google.com/apppasswords)
3. Use app password (not main password)
4. Add to .env:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

**Using Mailtrap (for testing):**
1. Sign up at https://mailtrap.io
2. Create inbox
3. Copy SMTP credentials
4. Add to .env:
   ```env
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=587
   SMTP_USER=...
   SMTP_PASS=...
   ```

**Or disable email:**
- Emails are optional
- Comments are only needed for password resets
- App works without email setup

---

### 8. Database Seeding Issues

#### Error: `seed:demo script fails`
```
Error: Cannot connect to database
```

**Ensure:**
1. MongoDB is running
2. Backend .env is configured correctly
3. MONGO_URI is accessible

**Run seeding:**
```bash
# Make sure you're in backend directory
cd backend

# Check backend is running or will start connection
npm run seed:demo

# Expected output:
# ✓ Database connected
# ✓ Users created
# ✓ Resources created
# ✓ Demo credentials printed
```

#### Error: `Unique index violation` when seeding
```
E11000 duplicate key error
```

**Diagnosis:** Database already has seeded data

**Solutions:**
```bash
# Option 1: Delete database and reseed
# In MongoDB:
mongosh
> use campus_booking
> db.dropDatabase()
> exit

# Then run seed again:
npm run seed:demo

# Option 2: Run on different database:
# Edit .env:
MONGO_URI=mongodb://localhost:27017/campus-booking-test
npm run seed:demo
```

---

### 9. Vite Dev Server Issues

#### Error: `Vite dev server shows blank page or 502`
```
Browser shows 502 Bad Gateway or blank page
```

**Diagnosis:** Frontend can't reach backend

**Solutions:**
1. **Verify backend is running:**
   ```bash
   # Open in browser:
   http://127.0.0.1:5000/
   # Should show: {"message":"API Server Running"}
   ```

2. **Check vite.config.js proxy settings:**
   ```javascript
   // Should point to backend
   server: {
     proxy: {
       '/api': 'http://127.0.0.1:5000'
     }
   }
   ```

3. **Restart Vite dev server:**
   ```bash
   # Kill and restart
   npm run dev
   ```

4. **Clear cache:**
   ```bash
   # Delete .vite cache
   rm -r node_modules/.vite
   npm run dev
   ```

---

### 10. General Debugging Tips

#### Enable verbose logging:
```bash
# Backend - check NODE_ENV
NODE_ENV=development npm run dev

# Frontend - check browser console (F12)
# Look at Network tab for failed requests
```

#### Check all environment variables:
```bash
# Windows PowerShell:
Get-Content .env

# Windows CMD:
type .env

# Verify all required variables are set:
# - MONGO_URI
# - JWT_SECRET
# - FRONTEND_URL
# - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (if email enabled)
```

#### Restart everything in order:
```bash
1. Kill MongoDB
2. Kill Backend
3. Kill Frontend
4. Start MongoDB
5. Start Backend (wait for "MongoDB Connected")
6. Start Frontend
7. Wait for "ready in" message
8. Open http://localhost:5173
```

#### Clear browser cache:
```
DevTools (F12) → Settings → Clear Site Data
Or: Clear All Cookies and Site Data
```

#### Check logs:
- **Backend console:** Shows database, auth, API errors
- **Vite console:** Shows build and proxy errors
- **Browser DevTools (F12):**
  - Console tab: Shows JavaScript errors
  - Network tab: Shows failed API requests
  - Application tab: Shows stored tokens/cookies

---

## 📝 Still Having Issues?

**Collect information:**
1. Full error message from console
2. Which step (setup, db connection, login, etc.)
3. Your OS and Node.js version: `node --version`
4. Screenshot of error

**Common resources:**
- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)

---

Last updated: 2024
