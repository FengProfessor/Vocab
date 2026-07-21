#!/usr/bin/env bash
# Cài crontab: gọi /api/cron/check-expired mỗi ngày 19:00 UTC
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$APP_DIR/.env"
LOG_FILE="/var/log/lingopro-cron.log"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[cron] Missing $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
set -a
# Chỉ lấy CRON_SECRET + DOMAIN an toàn
CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//')"
DOMAIN="$(grep -E '^DOMAIN=' "$ENV_FILE" | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//' || true)"
DOMAIN="${DOMAIN:-lingopro.online}"
set +a

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "[cron] CRON_SECRET trống trong .env — bỏ qua cron"
  exit 1
fi

CRON_LINE="0 19 * * * curl -fsS -H \"Authorization: Bearer ${CRON_SECRET}\" \"https://${DOMAIN}/api/cron/check-expired\" >> ${LOG_FILE} 2>&1"

# Xóa dòng cũ lingopro cron rồi thêm mới
TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v 'lingopro\|/api/cron/check-expired' >"$TMP" || true
echo "$CRON_LINE" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"
touch "$LOG_FILE"
chmod 644 "$LOG_FILE" || true

echo "[cron] Đã cài: 0 19 * * * → https://${DOMAIN}/api/cron/check-expired"
