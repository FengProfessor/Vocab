$ErrorActionPreference = "Continue"
$taskName = "LingoProNlmBurnWatchdog"
$ps1 = "D:\Vibe\Vocab\web-app\scripts\nlm-watchdog.ps1"
$tr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ps1`""

cmd /c "schtasks /Delete /TN `"$taskName`" /F >nul 2>&1" | Out-Null
$out = cmd /c "schtasks /Create /TN `"$taskName`" /TR `"$tr`" /SC MINUTE /MO 1 /RL LIMITED /F 2>&1"
Write-Host "schtasks: $out"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ps1
Write-Host "one-shot done"
cmd /c "schtasks /Query /TN `"$taskName`" /FO LIST 2>&1" | Select-String "Task Name|Status|Next Run|Last Run"
