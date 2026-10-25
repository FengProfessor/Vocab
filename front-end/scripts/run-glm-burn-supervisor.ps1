# Supervisor: keep 3 GLM backfill workers alive until pending low or quota error
$ErrorActionPreference = "Continue"
Set-Location "D:\Vibe\Vocab\web-app"
$logDir = "D:\Vibe\Vocab\web-app\scripts\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$supLog = Join-Path $logDir ("supervisor-" + $stamp + ".log")

function Write-SupLog([string]$msg) {
  $line = (Get-Date -Format "HH:mm:ss") + " " + $msg
  Add-Content -Path $supLog -Value $line -Encoding UTF8
  Write-Host $line
}

function Start-Worker([int]$wid, [int]$offset) {
  $out = Join-Path $logDir ("sup-w" + $wid + "-" + $stamp + ".out")
  $cmd = "cd /d D:\Vibe\Vocab\web-app && npx tsx scripts/backfill-core-senses-glm.ts --limit=1000 --offset=$offset --delay=300 >> `"$out`" 2>&1"
  $p = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -WindowStyle Hidden -PassThru
  Write-SupLog ("start worker" + $wid + " pid=" + $p.Id + " offset=" + $offset)
  return [pscustomobject]@{ Wid = $wid; Pid = $p.Id; Offset = $offset; Out = $out }
}

Write-SupLog "=== SUPERVISOR START ==="

Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$workers = New-Object System.Collections.ArrayList
[void]$workers.Add((Start-Worker 1 0))
Start-Sleep -Seconds 2
[void]$workers.Add((Start-Worker 2 1000))
Start-Sleep -Seconds 2
[void]$workers.Add((Start-Worker 3 2000))

$deadRounds = 0
$round = 0

while ($true) {
  $round++
  Start-Sleep -Seconds 45

  $nodeCount = @(Get-Process -Name node -ErrorAction SilentlyContinue).Count
  $pendingLine = ""
  try {
    $pendingLine = (& npx tsx scripts/tmp-count-pending-core.ts 2>$null | Select-Object -Last 1)
  } catch {
    $pendingLine = "count_error"
  }
  Write-SupLog ("round=" + $round + " pending=" + $pendingLine + " node=" + $nodeCount)

  $quotaHit = $false
  Get-ChildItem -Path $logDir -Filter ("sup-w*-" + $stamp + ".out") -ErrorAction SilentlyContinue | ForEach-Object {
    $text = ""
    try { $text = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue } catch {}
    if ($text -and ($text -match "401 Unauthorized|insufficient|quota exceeded|limit_requests|余额不足|Token has been exhausted")) {
      $quotaHit = $true
      Write-SupLog ("QUOTA in " + $_.Name)
    }
  }
  if ($quotaHit) {
    Write-SupLog "STOP quota or auth"
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    break
  }

  $alive = 0
  $newWorkers = New-Object System.Collections.ArrayList
  foreach ($w in $workers) {
    $proc = Get-Process -Id $w.Pid -ErrorAction SilentlyContinue
    if ($proc) {
      $alive++
      [void]$newWorkers.Add($w)
      continue
    }

    $tail = ""
    if (Test-Path $w.Out) {
      try { $tail = (Get-Content $w.Out -Tail 30 -ErrorAction SilentlyContinue) -join "`n" } catch {}
    }

    if ($tail -match "Done: ok=0 skip=\d+ fail=0") {
      $nextOff = $w.Offset + 3000
      Write-SupLog ("worker" + $w.Wid + " clean empty, restart offset=" + $nextOff)
      [void]$newWorkers.Add((Start-Worker $w.Wid $nextOff))
    } elseif ($tail -match "Done: ok=") {
      Write-SupLog ("worker" + $w.Wid + " batch done, restart offset=" + $w.Offset)
      [void]$newWorkers.Add((Start-Worker $w.Wid $w.Offset))
    } else {
      Write-SupLog ("worker" + $w.Wid + " died mid-run, restart offset=" + $w.Offset)
      [void]$newWorkers.Add((Start-Worker $w.Wid $w.Offset))
    }
    Start-Sleep -Seconds 2
  }
  $workers = $newWorkers

  if ($alive -eq 0) { $deadRounds++ } else { $deadRounds = 0 }
  if ($deadRounds -ge 6) {
    Write-SupLog "STOP workers keep dying"
    break
  }

  if ($pendingLine -match '"pending":(\d+)') {
    $p = [int]$Matches[1]
    if ($p -lt 30) {
      Write-SupLog ("STOP pending almost done: " + $p)
      break
    }
  }

  if ($round -ge 600) {
    Write-SupLog "STOP max rounds"
    break
  }
}

Write-SupLog "=== SUPERVISOR END ==="
