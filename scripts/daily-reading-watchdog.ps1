# Daily Reading Watchdog — runs from Task Scheduler every night at 2:00 AM.
# Ensures the NLM daily reading generator runs to completion.
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
  if (Test-Path $pidFile) {
    $t = (Get-Content $pidFile -Raw -ErrorAction SilentlyContinue).Trim()
    if ($t -match '^\d+$') {
      $p = Get-Process -Id ([int]$t) -ErrorAction SilentlyContinue
      if ($p) { return $p }
    }
  }
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
  # NLM queries can take 10-20 min per classroom
  return ($age -lt 60)
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
  WLog "Starting daily reading generation"
}

# Rotate log if too large (>5MB)
if ((Test-Path $workLog) -and ((Get-Item $workLog).Length -gt 5MB)) {
  $archiveLog = $workLog + "." + (Get-Date -Format "yyyyMMdd-HHmmss") + ".old"
  Move-Item -Path $workLog -Destination $archiveLog -Force -ErrorAction SilentlyContinue
}

$arg = "/c npx tsx scripts/generate-daily-reading-nlm.ts --profile=burn-minh --delay=12000 >> `"$workLog`" 2>&1"
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
