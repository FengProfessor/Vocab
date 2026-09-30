#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 3 || ! "${1:-}" =~ ^[0-9a-f]{40}$ ]]; then
  echo '[Deploy] Usage: run-deploy.sh EXPECTED_SHA BUILD_DIR LIVE_DIR' >&2
  exit 2
fi
if [[ -z "${CRON_SECRET:-}" ]]; then
  echo '[Deploy] CRON_SECRET is required' >&2
  exit 1
fi

# Chặn ký tự có thể phá dotenv; không ghi giá trị credential vào log.
if [[ -n "${BILLING_WEBHOOK_SECRET:-}" ]]; then
  if [[ ! "$BILLING_WEBHOOK_SECRET" =~ ^[A-Za-z0-9_-]+$ ]] ||
     (( ${#BILLING_WEBHOOK_SECRET} < 32 || ${#BILLING_WEBHOOK_SECRET} > 512 )); then
    echo '[Deploy] BILLING_WEBHOOK_SECRET must be 32-512 URL-safe characters' >&2
    exit 1
  fi
  if [[ "$BILLING_WEBHOOK_SECRET" == "$CRON_SECRET" ]]; then
    echo '[Deploy] Billing and cron credentials must be distinct' >&2
    exit 1
  fi
fi
if [[ -n "${UPSTASH_REDIS_REST_URL:-}" || -n "${UPSTASH_REDIS_REST_TOKEN:-}" ]]; then
  if [[ ! "${UPSTASH_REDIS_REST_URL:-}" =~ ^https://[a-zA-Z0-9-]+\.upstash\.io/?$ ]] ||
     [[ ! "${UPSTASH_REDIS_REST_TOKEN:-}" =~ ^[A-Za-z0-9._=+/\-]+$ ]]; then
    echo '[Deploy] Both valid Upstash REST settings are required together' >&2
    exit 1
  fi
fi

expected_sha="$1"
build_dir="$2"
live_dir="$3"

bash "$build_dir/deploy/prepare-source.sh" "$expected_sha" "$build_dir"

staging_app_dir="$build_dir"
if [[ -d "$build_dir/web-app" ]]; then
  staging_app_dir="$build_dir/web-app"
fi
cd "$staging_app_dir"
echo "[Deploy] Staging app directory: $staging_app_dir"

if [[ -f "$live_dir/.env" ]]; then
  cp "$live_dir/.env" .env
fi
if [[ -f "$live_dir/.env.local" ]]; then
  cp "$live_dir/.env.local" .env.local
fi

echo '[Deploy] Updating CRON_SECRET in staging'
touch .env .env.local
sed -i '/^CRON_SECRET=/d' .env
printf 'CRON_SECRET="%s"\n' "$CRON_SECRET" >> .env
sed -i '/^CRON_SECRET=/d' .env.local
printf 'CRON_SECRET="%s"\n' "$CRON_SECRET" >> .env.local

# Stage A: giữ auth legacy trong code; alias riêng giúp SePay đổi key sau rollout.
# Biến không truyền từ CI được giữ nguyên từ env live, không xóa cấu hình host.
set_staging_env() {
  local name="$1" value="$2" env_file
  for env_file in .env .env.local; do
    sed -i "/^[[:space:]]*\(export[[:space:]]\+\)\?${name}[[:space:]]*=/d" "$env_file"
    printf '%s="%s"\n' "$name" "$value" >> "$env_file"
  done
}
if [[ -n "${BILLING_WEBHOOK_SECRET:-}" ]]; then
  set_staging_env BILLING_WEBHOOK_SECRET "$BILLING_WEBHOOK_SECRET"
  set_staging_env WEBHOOK_SECRET "$BILLING_WEBHOOK_SECRET"
  echo '[Deploy] Dedicated billing webhook credential staged (compatibility alias enabled)'
fi
if [[ -n "${UPSTASH_REDIS_REST_URL:-}" ]]; then
  set_staging_env UPSTASH_REDIS_REST_URL "$UPSTASH_REDIS_REST_URL"
  set_staging_env UPSTASH_REDIS_REST_TOKEN "$UPSTASH_REDIS_REST_TOKEN"
  echo '[Deploy] Distributed limiter configuration staged'
fi

echo '[Deploy] Installing dependencies in staging'
npm ci

echo '[Deploy] Building application in staging'
export NODE_OPTIONS='--max-old-space-size=4096'
npm run build

if [[ ! -d .next/standalone ]]; then
  echo '[Deploy] Build failed: .next/standalone was not generated' >&2
  exit 1
fi
printf '%s\n' "$expected_sha" > .next/.release-commit

echo '[Deploy] Copying static assets to the standalone bundle'
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true
mkdir -p .next/standalone/src
cp -r src/data .next/standalone/src/ 2>/dev/null || true

live_app_dir="$live_dir"
if [[ -d "$live_dir/web-app" ]]; then
  live_app_dir="$live_dir/web-app"
fi
echo "[Deploy] Live app directory: $live_app_dir"

if ! bash "$build_dir/deploy/activate-release.sh" "$staging_app_dir" "$live_app_dir" "$expected_sha"; then
  echo '[Deploy] Deployment failed; see activation and rollback status above' >&2
  exit 1
fi

echo '[Deploy] Deployment completed after service and HTTP readiness checks'
