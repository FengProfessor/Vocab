# Install Task Scheduler job (no admin). Safe re-run.
$ErrorActionPreference = "Continue"
$taskName = "LingoProGLMBurnWatchdog"
$ps1 = "D:\Vibe\Vocab\web-app\scripts\glm-watchdog.ps1"
$tr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ps1`""

# Delete old if exists (ignore missing)
cmd /c "schtasks /Delete /TN `"$taskName`" /F >nul 2>&1"

# Create every 1 minute, current user, LIMITED (no UAC)
$out = cmd /c "schtasks /Create /TN `"$taskName`" /TR `"$tr`" /SC MINUTE /MO 1 /RL LIMITED /F 2>&1"
Write-Host "schtasks create: $out"

# Verify
$q = cmd /c "schtasks /Query /TN `"$taskName`" /FO LIST 2>&1"
Write-Host $q

# Run watchdog once now
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ps1
Write-Host "Watchdog one-shot done."
