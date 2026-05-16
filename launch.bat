@echo off
setlocal
cd /d %~dp0
where npm.cmd >nul 2>nul
if %errorlevel% neq 0 (
  echo npm.cmd not found. Please install Node.js 24 LTS.
  pause
  exit /b 1
)
call npm.cmd install
if %errorlevel% neq 0 (
  echo npm install failed
  pause
  exit /b 1
)
call npm.cmd run dev
pause
