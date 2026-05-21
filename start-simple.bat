@echo off
chcp 65001 >nul 2>&1
title 聊天应用启动器

echo.
echo ================================================
echo          聊天应用一键启动器
echo ================================================
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js 已安装
echo.
echo 正在启动聊天服务器...
echo.

REM 启动服务器
node server.js

pause
