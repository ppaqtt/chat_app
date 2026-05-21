@echo off
chcp 65001 >nul 2>&1
title Chat App Launcher

echo.
echo ================================================
echo          Chat Application Launcher
echo ================================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js first
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo.
echo Starting chat server...
echo.

node start.js

pause
