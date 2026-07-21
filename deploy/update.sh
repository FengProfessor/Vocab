#!/usr/bin/env bash
# Cập nhật code trên VPS (git pull + rebuild)
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

if [[ -d .git ]]; then
  git pull --ff-only
fi

docker compose up -d --build
docker image prune -f
echo "[update] OK $(date -u +%Y-%m-%dT%H:%M:%SZ)"
