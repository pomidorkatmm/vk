@echo off
cd /d %~dp0
call npm.cmd install || goto :err
call npm.cmd run build || goto :err
call npm.cmd run dist || goto :err
echo Build completed. Check dist\
pause
exit /b 0
:err
echo Build failed
pause
exit /b 1
