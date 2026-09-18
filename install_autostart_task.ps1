# Script de instalacion de tarea programada de inicio automatico
$taskName = "Inventario_AutoStart_OnBoot"
$projectDir = "c:\Users\nbolea.SATYATEC\SynologyDrive\Software\Desarrollo\Proyectos\Varios\0001_INVENTARIO_DISPOSITIVOS"
$batScript = "$projectDir\scripts\run_docker_compose.bat"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Configurando Tarea Programada: $taskName" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$Action = New-ScheduledTaskAction -Execute "$batScript"
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force

Write-Host ""
Write-Host " [OK] Tarea programada registrada con exito." -ForegroundColor Green
Write-Host " La aplicacion arrancara automaticamente con el sistema (sin requerir inicio de sesion)." -ForegroundColor Green
