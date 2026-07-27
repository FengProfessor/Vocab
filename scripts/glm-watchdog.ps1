# Run every 1 min via Task Scheduler. Keep super + parent alive. Never kill healthy jobs.
$ErrorActionPreference = "Continue"
$root = "D:\Vibe\Vocab\web-app"
$logDir = Join-Path $root "scripts\logs"
$watchLog = Join-Path $logDir "watchdog.log"
$pidFile = Join-Path $logDir "parent.pid"
$superPidFile = Join-Path $logDir "super.pid"
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodeExe) { $nodeExe = "D:\node\node.exe" }
if (-not (Test-Path $nodeExe)) { $nodeExe = "C:\Program Files\nodejs\node.exe" }
if (-not (Test-Path $nodeExe)) { $nodeExe = "node" }

function WLog([string]$m) {
  $line = (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + " " + $m
  try { Add-Content -Path $watchLog -Value $line -Encoding UTF8 } catch {}
}

function Get-NodeByCmd([string]$pattern) {
  try {
    $list = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue
    foreach ($pr in $list) {
      if ($pr.CommandLine -and ($pr.CommandLine -like $pattern)) {
        return (Get-Process -Id $pr.ProcessId -ErrorAction SilentlyContinue)
      }
    }
  } catch {}
  return $null
}

function Get-ParentNodeProcess {
  if (Test-Path $pidFile) {
    $t = (Get-Content $pidFile -Raw -ErrorAction SilentlyContinue).Trim()
    if ($t -match '^\d+$') {
      $p = Get-Process -Id ([int]$t) -ErrorAction SilentlyContinue
      if ($p -and $p.ProcessName -eq 'node') { return $p }
    }
  }
  return (Get-NodeByCmd '*glm-burn-parent*')
}

function Get-SuperProcess {
  if (Test-Path $superPidFile) {
    $t = (Get-Content $superPidFile -Raw -ErrorAction SilentlyContinue).Trim()
    if ($t -match '^\d+$') {
      $p = Get-Process -Id ([int]$t) -ErrorAction SilentlyContinue
      if ($p -and $p.ProcessName -eq 'node') { return $p }
    }
  }
  return (Get-NodeByCmd '*glm-super-watchdog*')
}

function Test-WorkersFresh {
  $fresh = 0
  foreach ($i in 0..2) {
    $f = Join-Path $logDir ("forever-w" + $i + ".log")
    if (Test-Path $f) {
      $age = ((Get-Date) - (Get-Item $f).LastWriteTime).TotalMinutes
      if ($age -lt 8) { $fresh++ }
    }
  }
  return $fresh
}

function Start-DetachedNode([string]$scriptRel) {
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $nodeExe
  $psi.Arguments = $scriptRel
  $psi.WorkingDirectory = $root
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
  return [System.Diagnostics.Process]::Start($psi)
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# 1) Super-watchdog (checks every 60s)
$super = Get-SuperProcess
if (-not $super) {
  try {
    $sp = Start-DetachedNode "scripts\glm-super-watchdog.mjs"
    if ($sp) {
      Set-Content -Path $superPidFile -Value $sp.Id -Encoding ASCII
      WLog ("STARTED super pid=" + $sp.Id)
      Start-Sleep -Seconds 3
    }
  } catch {
    WLog ("super start fail: " + $_.Exception.Message)
  }
} else {
  WLog ("OK super pid=" + $super.Id)
}

# 2) Parent (super usually starts it; this is backup)
$parent = Get-ParentNodeProcess
$freshWorkers = Test-WorkersFresh

if ($parent -and $freshWorkers -ge 1) {
  WLog ("OK parent pid=" + $parent.Id + " freshWorkers=" + $freshWorkers)
  exit 0
}

if ($parent -and $freshWorkers -eq 0) {
  WLog ("STALE workers - kill parent pid=" + $parent.Id)
  try { Stop-Process -Id $parent.Id -Force -ErrorAction SilentlyContinue } catch {}
  Start-Sleep -Seconds 2
  $parent = $null
}

if (-not $parent) {
  WLog "DEAD parent - starting"
  try {
    $proc = Start-DetachedNode "scripts\glm-burn-parent.mjs"
    if ($proc) {
      Set-Content -Path $pidFile -Value $proc.Id -Encoding ASCII
      WLog ("STARTED parent pid=" + $proc.Id)
    } else {
      WLog "START parent failed"
    }
  } catch {
    WLog ("START exception: " + $_.Exception.Message)
  }
}
exit 0
