# Chạy trên Windows (máy dev) SAU KHI có IP VPS.
# Usage:
#   .\deploy\push-to-vps.ps1 -Ip 1.2.3.4
#   .\deploy\push-to-vps.ps1 -Ip 1.2.3.4 -User root -Domain lingopro.online
#
# Yêu cầu: OpenSSH client, .env.hetzner đã có trong repo root.

param(
  [Parameter(Mandatory = $true)][string]$Ip,
  [string]$User = "root",
  [string]$RemoteDir = "/opt/lingopro",
  [string]$Domain = "lingopro.online",
  [string]$RepoUrl = ""
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$EnvFile = Join-Path $Root ".env.hetzner"

if (-not (Test-Path $EnvFile)) {
  Write-Host "THIẾU $EnvFile — chạy: vercel env pull rồi tạo .env.hetzner"
  exit 1
}

Write-Host "[push] Target ${User}@${Ip}:${RemoteDir}"

# Đảm bảo thư mục + git hoặc rsync-like via scp archive
$ssh = "ssh -o StrictHostKeyChecking=accept-new ${User}@${Ip}"

Invoke-Expression "$ssh `"mkdir -p $RemoteDir`""

# Ưu tiên: nếu remote đã có git, chỉ scp env + pull; else scp tarball
$hasGit = $false
try {
  $out = Invoke-Expression "$ssh `"test -d $RemoteDir/.git && echo YES || echo NO`""
  if ($out -match "YES") { $hasGit = $true }
} catch {}

if ($hasGit) {
  Write-Host "[push] Remote đã có git → pull + env"
  Invoke-Expression "$ssh `"cd $RemoteDir && git pull --ff-only`""
} elseif ($RepoUrl -ne "") {
  Write-Host "[push] Clone $RepoUrl"
  Invoke-Expression "$ssh `"rm -rf $RemoteDir && git clone $RepoUrl $RemoteDir`""
} else {
  Write-Host "[push] Không git remote — đóng gói source (không node_modules)..."
  $tar = Join-Path $env:TEMP "lingopro-deploy.tgz"
  # tar Windows 10+
  Push-Location $Root
  if (Test-Path $tar) { Remove-Item $tar -Force }
  tar -czf $tar `
    --exclude=node_modules `
    --exclude=.next `
    --exclude=.git `
    --exclude=android `
    --exclude=ios `
    --exclude=tmp `
    --exclude=tmp-* `
    --exclude="*.log" `
    .
  Pop-Location
  scp $tar "${User}@${Ip}:/tmp/lingopro-deploy.tgz"
  Invoke-Expression "$ssh `"mkdir -p $RemoteDir && tar -xzf /tmp/lingopro-deploy.tgz -C $RemoteDir && rm /tmp/lingopro-deploy.tgz`""
}

# Env
Write-Host "[push] Upload .env"
scp $EnvFile "${User}@${Ip}:${RemoteDir}/.env"
# DOMAIN
Invoke-Expression "$ssh `"grep -q '^DOMAIN=' $RemoteDir/.env || echo DOMAIN=$Domain >> $RemoteDir/.env; chmod 600 $RemoteDir/.env`""

Write-Host "[push] Bootstrap (docker + cron)..."
Invoke-Expression "$ssh `"cd $RemoteDir && bash deploy/bootstrap-vps.sh`""

Write-Host @"

[push] XONG phía server.
BẠN còn:
  1) DNS A: $Domain → $Ip  (và www nếu dùng)
  2) Chờ 1–5 phút SSL
  3) Mở https://$Domain — test login
  4) Sau 48h ổn: pause/xóa project Vercel production

"@
