@echo off
:: Solicitar permisos de administrador si no los tiene
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando permisos de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo  Registrando Tarea Programada: Inventario_AutoStart_OnBoot
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command " = 'c:\Users\nbolea.SATYATEC\SynologyDrive\Software\Desarrollo\Proyectos\Varios\0001_INVENTARIO_DISPOSITIVOS';  = \"\scripts\run_docker_compose.bat\";  = New-ScheduledTaskAction -Execute ;  = New-ScheduledTaskTrigger -AtStartup;  = New-ScheduledTaskPrincipal -UserId 'NT AUTHORITY\SYSTEM' -LogonType ServiceAccount -RunLevel Highest;  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable; Register-ScheduledTask -TaskName 'Inventario_AutoStart_OnBoot' -Action  -Trigger  -Principal  -Settings  -Force; Write-Host '>>> [OK] Tarea programada registrada con exito en Windows.' -ForegroundColor Green"

echo.
echo ========================================================
echo Proceso finalizado.
echo ========================================================
pause
