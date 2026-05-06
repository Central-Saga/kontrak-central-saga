@echo off
setlocal

if "%~1"=="" (
    set "ACTION=up"
) else (
    set "ACTION=%~1"
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev.ps1" -Action "%ACTION%"
exit /b %ERRORLEVEL%
