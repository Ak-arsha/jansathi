@echo off
title JanSathi AI App & Backend Server
cd /d "C:\Users\Akarsha\Downloads\app"
echo ===================================================
echo   JanSathi AI App & Backend Server Running on Port 3000
echo   Open http://localhost:3000 in your browser
echo ===================================================
"C:\Program Files\nodejs\node.exe" ./node_modules/vite/bin/vite.js --port 3000 --host 127.0.0.1
pause
