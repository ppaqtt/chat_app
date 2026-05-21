@echo off
chcp 65001 >nul
title 聊天应用启动器
echo.
echo ================================================
echo          聊天应用一键启动器
echo ================================================
echo.
echo 正在启动服务，请稍候...
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查localtunnel是否安装
where lt >nul 2>&1
if errorlevel 1 (
    echo 正在安装localtunnel...
    npm install -g localtunnel
)

REM 启动Node.js脚本
node start.js

pause
