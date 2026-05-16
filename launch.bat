@echo off
cd /d %~dp0
call npm.cmd install || goto :err
call npm.cmd start || goto :err
goto :eof
:err
echo Launch failed
pause
exit /b 1
