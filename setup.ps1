#!/usr/bin/env pwsh
# ========================================
# Campus Resource Booking System
# Quick Setup PowerShell Script for Windows
# ========================================
# Run with: powershell -ExecutionPolicy Bypass -File setup.ps1

$ErrorActionPreference = "Continue"
$RootPath = Split-Path -Parent $MyInvocation.MyCommandPath

Write-Host ""
Write-Host "====== Campus Resource Booking System - Setup ======" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$NodeCheck = & where.exe node 2>$null
if (-not $NodeCheck) {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please download from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[OK] Node.js found:" -ForegroundColor Green
& node --version
Write-Host ""

# Check npm
$NpmCheck = & where.exe npm 2>$null
if (-not $NpmCheck) {
    Write-Host "[ERROR] npm is not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[OK] npm found:" -ForegroundColor Green
& npm --version
Write-Host ""

# Backend setup
Write-Host ""
Write-Host "====== Installing Backend Dependencies ======" -ForegroundColor Cyan
$BackendPath = Join-Path $RootPath "backend"
Set-Location $BackendPath

if (Test-Path "node_modules") {
    Write-Host "[INFO] node_modules exists, skipping npm install" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Running: npm install" -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Backend npm install failed!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "[WARNING] backend\.env file not found!" -ForegroundColor Yellow
    Write-Host "[INFO] Copying from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[OK] Created backend\.env (review and update variables)" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] .env.example not found!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "[OK] backend\.env already exists" -ForegroundColor Green
}

# Frontend setup
Write-Host ""
Write-Host "====== Installing Frontend Dependencies ======" -ForegroundColor Cyan
$FrontendPath = Join-Path $RootPath "frontend"
Set-Location $FrontendPath

if (Test-Path "node_modules") {
    Write-Host "[INFO] node_modules exists, skipping npm install" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Running: npm install" -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Frontend npm install failed!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Summary
Write-Host ""
Write-Host "====== Setup Complete! ======" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. CONFIGURE BACKEND" -ForegroundColor Yellow
Write-Host "   - Edit: backend\.env"
Write-Host "   - Set MongoDB URL, JWT secret, email config"
Write-Host ""
Write-Host "2. START SERVICES (use separate terminals):" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Terminal 1 - Backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   Terminal 2 - Frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   Terminal 3 - MongoDB (if local):" -ForegroundColor White
Write-Host "   mongod" -ForegroundColor Gray
Write-Host ""
Write-Host "3. SEED DATABASE (optional, after backend starts):" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run seed:demo" -ForegroundColor Gray
Write-Host ""
Write-Host "4. OPEN BROWSER" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo Credentials (after seed:demo):" -ForegroundColor Yellow
Write-Host "   Admin: admin@campusbook.local / Admin@123" -ForegroundColor Gray
Write-Host "   Staff: staff.coordinator@campusbook.local / Staff@123" -ForegroundColor Gray
Write-Host "   Student: student.one@campusbook.local / Student@123" -ForegroundColor Gray
Write-Host ""
Write-Host "For detailed setup guide, see: SETUP_GUIDE.md" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
