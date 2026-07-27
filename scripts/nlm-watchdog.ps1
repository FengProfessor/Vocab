# Every 1 min: keep NLM forever burn alive. Profile burn-minh.
$ErrorActionPreference = "Continue"
$root = "D:\Vibe\Vocab\web-app"
$logDir = Join-Path $root "scripts\logs"
$watchLog = Join-Path $logDir "nlm-watchdog.log"
$pidFile = Join-Path $logDir "nlm.pid"
$workLog = Join-Path $logDir "nlm-forever.log"

function WLog([string]$m) {
  $line = (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + " " + $m
  try { Add-Content -Path $watchLog -Value $line -Encoding UTF8 } catch {}
}

function Get-NlmWorker {
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
      if ($pr.CommandLine -and ($pr.CommandLine -like '*backfill-core-senses-nlm*')) {
        return (Get-Process -Id $pr.ProcessId -ErrorAction SilentlyContinue)
      }
    }
  } catch {}
  return $null
}

function Test-LogFresh {
  if (-not (Test-Path $workLog)) { return $false }
  $age = ((Get-Date) - (Get-Item $workLog).LastWriteTime).TotalMinutes
  # NLM query batch co the im 10-20 phut
  return ($age -lt 40)
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$worker = Get-NlmWorker
$fresh = Test-LogFresh

if ($worker -and $fresh) {
  WLog ("OK nlm pid=" + $worker.Id + " logFresh=1")
  exit 0
}

if ($worker -and -not $fresh) {
  WLog ("STALE nlm pid=" + $worker.Id + " - kill and restart")
  try {
    # kill process tree via taskkill
    & taskkill /PID $worker.Id /T /F 2>$null | Out-Null
  } catch {}
  # also kill any leftover node nlm
  try {
    $list = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue
    foreach ($pr in $list) {
      if ($pr.CommandLine -and ($pr.CommandLine -like '*backfill-core-senses-nlm*')) {
        Stop-Process -Id $pr.ProcessId -Force -ErrorAction SilentlyContinue
      }
    }
  } catch {}
  Start-Sleep -Seconds 2
  $worker = $null
}

if (-not $worker) {
  WLog "DEAD nlm - starting forever"
}

$arg = "/c npx tsx scripts/backfill-core-senses-nlm.ts --profile=burn-minh --forever --limit=40 --batch-size=4 --delay=10000 >> `"$workLog`" 2>&1"
try {
  $proc = Start-Process -FilePath "cmd.exe" -ArgumentList $arg -WorkingDirectory $root -WindowStyle Hidden -PassThru
  if ($proc) {
    Set-Content -Path $pidFile -Value $proc.Id -Encoding ASCII
    WLog ("STARTED nlm cmd pid=" + $proc.Id)
  } else {
    WLog "START failed"
  }
} catch {
  WLog ("START exception: " + $_.Exception.Message)
}
exit 0
