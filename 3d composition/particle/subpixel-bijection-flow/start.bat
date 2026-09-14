@echo off
rem 双击启动 Subpixel Bijection Flow 本地副本
cd /d "%~dp0"
start "bijection-flow server" cmd /c "node server.js 8944"
timeout /t 1 /nobreak >nul
start "" http://localhost:8944/
