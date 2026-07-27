# Cày hết GLM-5.2: lặp batch --limit=200 cho đến fail quota / 0 rows / 3 fail liên tiếp
$ErrorActionPreference = "Continue"
Set-Location "D:\Vibe\Vocab\web-app"

$logDir = "scripts\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$log = Join-Path $logDir "glm-burn-$stamp.log"

function Log($msg) {
  $line = "$(Get-Date -Format 'HH:mm:ss') $msg"
  Add-Content -Path $log -Value $line -Encoding UTF8
  Write-Host $line
}

Log "=== GLM-5.2 BURN START log=$log ==="

$batch = 0
$totalOk = 0
$totalFail = 0
$emptyRounds = 0
$hardFail = 0

while ($true) {
  $batch++
  Log "--- batch $batch start (limit=200 delay=600) ---"
  $out = & npx tsx scripts/backfill-core-senses-glm.ts --limit=200 --delay=600 2>&1 | Out-String
  Add-Content -Path $log -Value $out -Encoding UTF8

  if ($out -match 'Done: ok=(\d+) skip=(\d+) fail=(\d+)') {
    $ok = [int]$Matches[1]
    $skip = [int]$Matches[2]
    $fail = [int]$Matches[3]
    $totalOk += $ok
    $totalFail += $fail
    Log "batch $batch result ok=$ok skip=$skip fail=$fail | cumulative ok=$totalOk fail=$totalFail"

    if ($ok -eq 0 -and $fail -eq 0) {
      $emptyRounds++
      Log "no progress round $emptyRounds"
      if ($emptyRounds -ge 2) {
        Log "STOP: no pending work"
        break
      }
    } else {
      $emptyRounds = 0
    }

    if ($fail -gt 0 -and $ok -eq 0) {
      $hardFail++
      Log "hard fail streak $hardFail"
      if ($hardFail -ge 2) {
        Log "STOP: likely quota/rate limit exhausted"
        break
      }
      Log "cooldown 60s..."
      Start-Sleep -Seconds 60
    } else {
      $hardFail = 0
    }
  } else {
    $hardFail++
    Log "unparseable output / crash streak=$hardFail"
    if ($out -match '401|429|quota|余额|不足|limit|Unauthorized|rate') {
      Log "STOP: quota or auth error detected in output"
      break
    }
    if ($hardFail -ge 3) {
      Log "STOP: too many crashes"
      break
    }
    Start-Sleep -Seconds 30
  }

  # safety: max 80 batches * 200 = 16000
  if ($batch -ge 80) {
    Log "STOP: hit max batch safety 80"
    break
  }
}

Log "=== GLM-5.2 BURN END cumulative ok=$totalOk fail=$totalFail ==="
Write-Host "LOGFILE=$log"
