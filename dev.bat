@echo off
cd /d %~dp0
call npm.cmd install || goto :err
call npm.cmd run dev || goto :err
goto :eof
:err
echo Failed to run dev
pause
exit /b 1
