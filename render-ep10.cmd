@echo off
setlocal
cd /d "%~dp0" || exit /b 1
call "node_modules\.bin\remotion.cmd" render src/index.ts ep10 out/ep10.mp4 --muted
exit /b %errorlevel%
