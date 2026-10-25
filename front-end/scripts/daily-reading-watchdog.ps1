# Daily Reading Watchdog -- runs from Task Scheduler every night at 2:00 AM.
# Ensures the NLM daily reading generator runs to completion.
[CmdletBinding()]
param(
  [switch]$Force
)

$ErrorActionPreference = "Continue"
$root = "D:\Vibe\Vocab\web-app"
$logDir = Join-Path $root "scripts\logs"
$watchLog = Join-Path $logDir "daily-reading-watchdog.log"
$pidFile = Join-Path $logDir "daily-reading.pid"
$workLog = Join-Path $logDir "daily-reading.log"

function WLog([string]$m) {
  $line = (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + " " + $m
  try { Add-Content -Path $watchLog -Value $line -Encoding UTF8 } catch {}
}

function Get-DailyReadingWorker {
  # 1. Validate pidFile against Win32_Process to prevent PID reuse killing innocent processes
  if (Test-Path $pidFile) {
    $t = (Get-Content $pidFile -Raw -ErrorAction SilentlyContinue).Trim()
    if ($t -match '^\d+$') {
      try {
        $pr = Get-CimInstance Win32_Process -Filter "ProcessId = $t" -ErrorAction SilentlyContinue
        if ($pr -and $pr.CommandLine -and ($pr.CommandLine -like '*generate-daily-reading-nlm*')) {
          return (Get-Process -Id $pr.ProcessId -ErrorAction SilentlyContinue)
        }
      } catch {}
      # Stale PID file: clean up
      Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }
  }

  # 2. Check any running process by commandline
  try {
    $list = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue
    foreach ($pr in $list) {
      if ($pr.CommandLine -and ($pr.CommandLine -like '*generate-daily-reading-nlm*')) {
        return (Get-Process -Id $pr.ProcessId -ErrorAction SilentlyContinue)
      }
    }
  } catch {}
  return $null
}

function Test-LogFresh {
  if (-not (Test-Path $workLog)) { return $false }
  $age = ((Get-Date) - (Get-Item $workLog).LastWriteTime).TotalMinutes
  # NLM queries loop through active users queue with delay
  return ($age -lt 60)
}

function Test-AlreadyCompletedToday {
  if (-not (Test-Path $workLog)) { return $false }
  $todayStr = (Get-Date -Format "yyyy-MM-dd")
  $lastWrite = (Get-Item $workLog).LastWriteTime.ToString("yyyy-MM-dd")
  if ($lastWrite -ne $todayStr) { return $false }
  try {
    $tail = Get-Content $workLog -Tail 20 -ErrorAction SilentlyContinue
    $fullTail = [string]::Join("`n", $tail)
    if ($fullTail -match '=== Done ===' -and $fullTail -match 'ok=\d+') {
      return $true
    }
  } catch {}
  return $false
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$worker = Get-DailyReadingWorker
$fresh = Test-LogFresh

if ($worker -and $fresh) {
  WLog ("OK daily-reading pid=" + $worker.Id + " logFresh=1")
  exit 0
}

if ($worker -and -not $fresh) {
  WLog ("STALE daily-reading pid=" + $worker.Id + " - kill and restart")
  try {
    & taskkill /PID $worker.Id /T /F 2>$null | Out-Null
  } catch {}
  try {
    $list = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue
    foreach ($pr in $list) {
      if ($pr.CommandLine -and ($pr.CommandLine -like '*generate-daily-reading-nlm*')) {
        Stop-Process -Id $pr.ProcessId -Force -ErrorAction SilentlyContinue
      }
    }
  } catch {}
  Start-Sleep -Seconds 2
  $worker = $null
}

if (-not $worker) {
  if (Test-AlreadyCompletedToday -and -not $Force) {
    WLog "Daily reading generation already completed for today -- skipping."
    exit 0
  }
  WLog "Starting daily reading generation"
}

# Rotate log if too large (>5MB)
if ((Test-Path $workLog) -and ((Get-Item $workLog).Length -gt 5MB)) {
  $archiveLog = $workLog + "." + (Get-Date -Format "yyyyMMdd-HHmmss") + ".old"
  Move-Item -Path $workLog -Destination $archiveLog -Force -ErrorAction SilentlyContinue
}

$arg = '/c npx tsx scripts/generate-daily-reading-nlm.ts --profile=burn-minh --delay=12000 >> "' + $workLog + '" 2>&1'
try {
  $proc = Start-Process -FilePath "cmd.exe" -ArgumentList $arg -WorkingDirectory $root -WindowStyle Hidden -PassThru
  if ($proc) {
    Set-Content -Path $pidFile -Value $proc.Id -Encoding ASCII
    WLog ("STARTED daily-reading cmd pid=" + $proc.Id)
  } else {
    WLog "START failed"
  }
} catch {
  WLog ("START exception: " + $_.Exception.Message)
}
exit 0
