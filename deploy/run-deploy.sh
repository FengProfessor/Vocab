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
