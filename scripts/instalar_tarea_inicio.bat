@echo off
:: Solicitar permisos de administrador si no los tiene
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando permisos de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo  Registrando Tarea Programada de Inicio Automatico
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_autostart_task.ps1"
echo.
pause
