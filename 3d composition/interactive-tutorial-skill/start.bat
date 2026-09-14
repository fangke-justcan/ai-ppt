@echo off
rem 游戏化交互教程示例 — 本地启动（服务器 + 打开浏览器），端口 8945
cd /d "%~dp0"
start "" http://localhost:8945/
node server.js 8945
