@echo off
echo Cleaning up ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo Starting Socket Server...
start "Socket Server" cmd /c "cd /d %~dp0projet-de-synthese-soutnence\front-end && node socket-server.cjs"

echo Starting Backend...
start "Laravel Backend" cmd /c "cd /d %~dp0projet-de-synthese-soutnence\backend && php artisan serve"

echo Starting Frontend...
start "Vite Frontend" cmd /c "cd /d %~dp0projet-de-synthese-soutnence\front-end && npm run dev"

echo Done!
pause
