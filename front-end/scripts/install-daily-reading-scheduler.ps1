# Install Windows Task Scheduler job for nightly daily reading generation.
# Run this once as Administrator:
#   powershell -ExecutionPolicy Bypass -File scripts/install-daily-reading-scheduler.ps1

$taskName = "LingoPro-DailyReading"
$root = "D:\Vibe\Vocab\web-app"
$watchdog = Join-Path $root "scripts\daily-reading-watchdog.ps1"

# Remove existing if any
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# Create trigger: 2:00 AM daily (Vietnam time = machine local time)
$trigger = New-ScheduledTaskTrigger -Daily -At "02:00"

# Action: run the watchdog script
$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-ExecutionPolicy Bypass -NoProfile -File `"$watchdog`"" `
  -WorkingDirectory $root

# Settings
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -WakeToRun `
  -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
  -RestartCount 2 `
  -RestartInterval (New-TimeSpan -Minutes 5)

try {
  Register-ScheduledTask `
    -TaskName $taskName `
    -Trigger $trigger `
    -Action $action `
    -Settings $settings `
    -Description "LingoPro: Generate daily reading exercises via NLM at 2AM" `
    -RunLevel Highest `
    -Force -ErrorAction Stop
} catch {
  Write-Host "Notice: Non-admin environment detected, registering task for current user..." -ForegroundColor Yellow
  Register-ScheduledTask `
    -TaskName $taskName `
    -Trigger $trigger `
    -Action $action `
    -Settings $settings `
    -Description "LingoPro: Generate daily reading exercises via NLM at 2AM" `
    -Force
}

Write-Host "Task '$taskName' registered successfully." -ForegroundColor Green
Write-Host "Trigger: Daily at 02:00 AM"
Write-Host "Watchdog: $watchdog"
Write-Host ""
Write-Host "To test manually:"
Write-Host "  Start-ScheduledTask -TaskName '$taskName'"
Write-Host ""
Write-Host "To check status:"
Write-Host "  Get-ScheduledTask -TaskName '$taskName' | Select State,LastRunTime"
