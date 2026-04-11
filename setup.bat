@echo off
REM ========================================
REM Campus Resource Booking System
REM Quick Setup Batch Script for Windows
REM ========================================

setlocal enabledelayedexpansion

echo.
echo ====== Campus Resource Booking System - Setup ======
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found!
    echo Please reinstall Node.js
    pause
    exit /b 1
)

echo [OK] npm found:
npm --version
echo.

REM Backend setup
echo.
echo ====== Installing Backend Dependencies ======
cd /d "%~dp0backend"
if exist node_modules (
    echo [INFO] node_modules exists, skipping npm install
) else (
    echo [INFO] Running: npm install
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Backend npm install failed!
        pause
        exit /b 1
    )
)

REM Check for .env file
if not exist .env (
    echo.
    echo [WARNING] backend\.env file not found!
    echo [INFO] Copying from .env.example...
    if exist .env.example (
        copy .env.example .env
        echo [OK] Created backend\.env (review and update variables)
    ) else (
        echo [ERROR] .env.example not found!
        pause
        exit /b 1
    )
) else (
    echo [OK] backend\.env already exists
)

echo.
echo ====== Installing Frontend Dependencies ======
cd /d "%~dp0frontend"
if exist node_modules (
    echo [INFO] node_modules exists, skipping npm install
) else (
    echo [INFO] Running: npm install
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Frontend npm install failed!
        pause
        exit /b 1
    )
)

echo.
echo ====== Setup Complete! ======
echo.
echo Next steps:
echo.
echo 1. CONFIGURE BACKEND
echo    - Edit: backend\.env
echo    - Set MongoDB URL, JWT secret, email config
echo.
echo 2. START SERVICES (use separate terminals):
echo.
echo    Terminal 1 - Backend:
echo    cd backend
echo    npm run dev
echo.
echo    Terminal 2 - Frontend:
echo    cd frontend
echo    npm run dev
echo.
echo    Terminal 3 - MongoDB (if local):
echo    mongod
echo.
echo 3. SEED DATABASE (optional, after backend starts):
echo    cd backend
echo    npm run seed:demo
echo.
echo 4. OPEN BROWSER
echo    Frontend: http://localhost:5173
echo.
echo Demo Credentials (after seed:demo):
echo    Admin: admin@campusbook.local / Admin@123
echo    Staff: staff.coordinator@campusbook.local / Staff@123
echo    Student: student.one@campusbook.local / Student@123
echo.
echo For detailed setup guide, see: SETUP_GUIDE.md
echo.
pause
