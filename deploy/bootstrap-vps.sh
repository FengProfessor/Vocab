#!/usr/bin/env bash
# Chạy TRÊN VPS (Ubuntu 22/24) với quyền root hoặc sudo.
# Mục tiêu: Docker + firewall + deploy LingoPro từ thư mục hiện tại.
#
# Cách dùng:
#   cd /opt/lingopro   # repo đã clone hoặc scp
#   # .env đã có (copy từ .env.hetzner)
#   sudo bash deploy/bootstrap-vps.sh
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "[bootstrap] dir=$APP_DIR"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "[bootstrap] Cần root: sudo bash deploy/bootstrap-vps.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl git ufw

# Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "[bootstrap] Cài Docker..."
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

# Compose plugin
if ! docker compose version >/dev/null 2>&1; then
  echo "[bootstrap] docker compose plugin thiếu — cài lại get.docker.com hoặc apt docker-compose-plugin"
  exit 1
fi

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "[bootstrap] THIẾU $APP_DIR/.env"
  echo "  scp .env.hetzner root@IP:/opt/lingopro/.env"
  exit 1
fi
chmod 600 "$APP_DIR/.env"

# DOMAIN default
if ! grep -qE '^DOMAIN=' "$APP_DIR/.env"; then
  echo "DOMAIN=lingopro.online" >> "$APP_DIR/.env"
fi

echo "[bootstrap] Build & start..."
docker compose pull caddy || true
docker compose up -d --build

echo "[bootstrap] Cài cron check-expired (19:00 UTC)..."
bash "$APP_DIR/deploy/install-cron.sh"

echo "[bootstrap] Xong."
echo "  docker compose ps"
echo "  docker compose logs -f --tail=100"
echo "  → Trỏ DNS A lingopro.online về IP máy này, chờ SSL."
