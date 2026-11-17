#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd -P)"
test_root="$(mktemp -d)"
cleanup() {
  if [[ "$test_root" == /tmp/tmp.* ]] && [[ -d "$test_root" ]]; then
    rm -rf -- "$test_root"
  fi
}
trap cleanup EXIT

mkdir -p "$test_root/bin"
cat > "$test_root/bin/npm" <<'MOCK'
#!/usr/bin/env bash
printf 'npm %s\n' "$*" >> "$TEST_DEPLOY_LOG"
if [[ "$TEST_SCENARIO" == 'npm-ci-fail' && "$1" == 'ci' ]]; then
  exit 1
fi
if [[ "$1 $2" == 'run build' && "$TEST_SCENARIO" != 'missing-standalone' ]]; then
  mkdir -p .next/standalone .next/static
  touch .next/standalone/server.js .next/static/app.js
fi
MOCK
chmod +x "$test_root/bin/npm"
export PATH="$test_root/bin:$PATH"
expected_sha='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

run_case() {
  local scenario="$1" expected_status="$2"
  local case_dir="$test_root/$scenario" status=0
  mkdir -p "$case_dir/build/deploy" "$case_dir/build/public" "$case_dir/build/src/data" \
    "$case_dir/live/.next/standalone"
  printf 'old env\n' > "$case_dir/live/.env"
  printf 'old local env\n' > "$case_dir/live/.env.local"
  printf 'export BILLING_WEBHOOK_SECRET="old-billing"\nWEBHOOK_SECRET="old-alias"\nUPSTASH_REDIS_REST_URL="https://old.upstash.io"\nUPSTASH_REDIS_REST_TOKEN="old-token"\n' >> "$case_dir/live/.env.local"
  touch "$case_dir/live/.next/standalone/server.js" "$case_dir/build/public/icon.png" \
    "$case_dir/build/src/data/data.json"

  cat > "$case_dir/build/deploy/prepare-source.sh" <<'MOCK'
#!/usr/bin/env bash
printf 'prepare %s %s\n' "$1" "$2" >> "$TEST_DEPLOY_LOG"
[[ "$TEST_SCENARIO" != 'prepare-fail' ]]
MOCK
  cat > "$case_dir/build/deploy/activate-release.sh" <<'MOCK'
#!/usr/bin/env bash
printf 'activate %s %s %s\n' "$1" "$2" "$3" >> "$TEST_DEPLOY_LOG"
[[ "$TEST_SCENARIO" != 'activate-fail' ]]
MOCK
  chmod +x "$case_dir/build/deploy/"*.sh

  export TEST_SCENARIO="$scenario" TEST_DEPLOY_LOG="$case_dir/deploy.log" CRON_SECRET='test-secret'
  unset BILLING_WEBHOOK_SECRET UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN AUTH_SESSION_ENCRYPTION_KEY
  export UPSTASH_REDIS_REST_URL='https://test.upstash.io'
  export UPSTASH_REDIS_REST_TOKEN='synthetic/redis+token=_-'
  export AUTH_SESSION_ENCRYPTION_KEY='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  if [[ "$scenario" == 'configured-success' ]]; then
    export BILLING_WEBHOOK_SECRET='synthetic-billing-key-32-characters-minimum'
    export UPSTASH_REDIS_REST_URL='https://test.upstash.io'
    export UPSTASH_REDIS_REST_TOKEN='synthetic/redis+token=_-'
    export AUTH_SESSION_ENCRYPTION_KEY='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  fi
  bash "$repo_root/deploy/run-deploy.sh" "$expected_sha" "$case_dir/build" "$case_dir/live" \
    > "$case_dir/run.log" 2>&1 || status=$?
  [[ "$status" == "$expected_status" ]] || { cat "$case_dir/run.log"; return 1; }

  grep -q "^prepare $expected_sha $case_dir/build$" "$case_dir/deploy.log"
  if [[ "$scenario" == 'prepare-fail' ]]; then
    ! grep -q '^npm ' "$case_dir/deploy.log"
  elif [[ "$scenario" == 'npm-ci-fail' ]]; then
    ! grep -q '^npm run build$' "$case_dir/deploy.log"
  elif [[ "$scenario" == 'missing-standalone' ]]; then
    ! grep -q '^activate ' "$case_dir/deploy.log"
  else
    grep -q '^npm ci$' "$case_dir/deploy.log"
    grep -q '^npm run build$' "$case_dir/deploy.log"
    grep -q "^activate $case_dir/build $case_dir/live $expected_sha$" "$case_dir/deploy.log"
  fi

  if [[ "$scenario" == 'success' ]]; then
    [[ "$(cat "$case_dir/build/.next/.release-commit")" == "$expected_sha" ]]
    grep -q '^CRON_SECRET="test-secret"$' "$case_dir/build/.env"
    grep -q '^CRON_SECRET="test-secret"$' "$case_dir/build/.env.local"
    grep -q '^export BILLING_WEBHOOK_SECRET="old-billing"$' "$case_dir/build/.env.local"
    grep -q '^UPSTASH_REDIS_REST_TOKEN="synthetic/redis+token=_-"$' "$case_dir/build/.env.local"
    ! grep -Eq '^[[:space:]]*(export[[:space:]]+)?WEBHOOK_SECRET[[:space:]]*=' "$case_dir/build/.env.local"
  elif [[ "$scenario" == 'configured-success' ]]; then
    for env_file in .env .env.local; do
      grep -q '^BILLING_WEBHOOK_SECRET="synthetic-billing-key-32-characters-minimum"$' "$case_dir/build/$env_file"
      ! grep -Eq '^[[:space:]]*(export[[:space:]]+)?WEBHOOK_SECRET[[:space:]]*=' "$case_dir/build/$env_file"
      grep -q '^UPSTASH_REDIS_REST_URL="https://test.upstash.io"$' "$case_dir/build/$env_file"
      grep -q '^UPSTASH_REDIS_REST_TOKEN="synthetic/redis+token=_-"$' "$case_dir/build/$env_file"
      grep -q '^AUTH_SESSION_ENCRYPTION_KEY="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"$' "$case_dir/build/$env_file"
      [[ "$(grep -c 'BILLING_WEBHOOK_SECRET=' "$case_dir/build/$env_file")" == 1 ]]
    done
    ! grep -q 'synthetic-billing-key\|synthetic/redis+token' "$case_dir/run.log"
    grep -q '^WEBHOOK_SECRET="old-alias"$' "$case_dir/live/.env.local"
  fi
  printf 'PASS %s\n' "$scenario"
}

run_case success 0
run_case configured-success 0
run_case prepare-fail 1
run_case npm-ci-fail 1
run_case missing-standalone 1
run_case activate-fail 1

missing_secret_dir="$test_root/missing-secret"
mkdir -p "$missing_secret_dir/build" "$missing_secret_dir/live"
unset CRON_SECRET
status=0
bash "$repo_root/deploy/run-deploy.sh" "$expected_sha" "$missing_secret_dir/build" "$missing_secret_dir/live" \
  > "$missing_secret_dir.log" 2>&1 || status=$?
[[ "$status" == 1 ]]
printf 'PASS missing-secret\n'

status=0
CRON_SECRET='test-secret' bash "$repo_root/deploy/run-deploy.sh" invalid "$missing_secret_dir/build" "$missing_secret_dir/live" \
  > "$test_root/invalid-sha.log" 2>&1 || status=$?
[[ "$status" == 2 ]]
printf 'PASS invalid-sha\n'

for scenario in malformed-billing coupled-billing partial-redis malformed-redis; do
  unset BILLING_WEBHOOK_SECRET UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN
  case "$scenario" in
    malformed-billing) export BILLING_WEBHOOK_SECRET=$'bad\nDOTENV_INJECTION=value' ;;
    coupled-billing) export BILLING_WEBHOOK_SECRET='synthetic-coupled-billing-and-cron-secret' ;;
    partial-redis) export UPSTASH_REDIS_REST_URL='https://test.upstash.io' ;;
    malformed-redis)
      export UPSTASH_REDIS_REST_URL='http://127.0.0.1'
      export UPSTASH_REDIS_REST_TOKEN='synthetic-token'
      ;;
  esac
  status=0
  test_cron_secret='test-secret'
  if [[ "$scenario" == 'coupled-billing' ]]; then test_cron_secret="$BILLING_WEBHOOK_SECRET"; fi
  CRON_SECRET="$test_cron_secret" bash "$repo_root/deploy/run-deploy.sh" "$expected_sha" "$missing_secret_dir/build" "$missing_secret_dir/live" \
    > "$test_root/$scenario.log" 2>&1 || status=$?
  [[ "$status" == 1 ]]
  ! grep -q 'DOTENV_INJECTION\|synthetic-token' "$test_root/$scenario.log"
  printf 'PASS %s\n' "$scenario"
done

for scenario in missing-auth-key malformed-auth-key; do
  export UPSTASH_REDIS_REST_URL='https://test.upstash.io' UPSTASH_REDIS_REST_TOKEN='synthetic-token'
  export AUTH_SESSION_ENCRYPTION_KEY='not-valid-hex-secret'
  if [[ "$scenario" == 'missing-auth-key' ]]; then unset AUTH_SESSION_ENCRYPTION_KEY; fi
  status=0
  CRON_SECRET='test-secret' bash "$repo_root/deploy/run-deploy.sh" "$expected_sha" "$missing_secret_dir/build" "$missing_secret_dir/live" > "$test_root/$scenario.log" 2>&1 || status=$?
  [[ "$status" == 1 ]]
  ! grep -q 'not-valid-hex-secret\|synthetic-token' "$test_root/$scenario.log"
  printf 'PASS %s\n' "$scenario"
done

prebuilt_root="$test_root/prebuilt-valid"
mkdir -p "$prebuilt_root/bundle/.next/standalone" "$prebuilt_root/bundle/.next/static" \
  "$prebuilt_root/build/deploy" "$prebuilt_root/build/public" "$prebuilt_root/build/src/data" \
  "$prebuilt_root/live/.next/standalone"
printf 'old env\n' > "$prebuilt_root/live/.env"
printf 'old local env\n' > "$prebuilt_root/live/.env.local"
touch "$prebuilt_root/live/.next/standalone/server.js" "$prebuilt_root/build/public/icon.png" \
  "$prebuilt_root/build/src/data/data.json" "$prebuilt_root/bundle/.next/standalone/server.js" \
  "$prebuilt_root/bundle/.next/static/app.js"
printf '%s\n' "$expected_sha" > "$prebuilt_root/bundle/.next/.release-commit"
tar -czf "$prebuilt_root/bundle.tar.gz" -C "$prebuilt_root/bundle" .next
cat > "$prebuilt_root/build/deploy/prepare-source.sh" <<'MOCK'
#!/usr/bin/env bash
printf 'prepare %s %s\n' "$1" "$2" >> "$TEST_DEPLOY_LOG"
MOCK
cat > "$prebuilt_root/build/deploy/activate-release.sh" <<'MOCK'
#!/usr/bin/env bash
printf 'activate %s %s %s\n' "$1" "$2" "$3" >> "$TEST_DEPLOY_LOG"
MOCK
chmod +x "$prebuilt_root/build/deploy/"*.sh
export TEST_DEPLOY_LOG="$prebuilt_root/deploy.log"
export CRON_SECRET='test-secret' UPSTASH_REDIS_REST_URL='https://test.upstash.io' \
  UPSTASH_REDIS_REST_TOKEN='synthetic-token' \
  AUTH_SESSION_ENCRYPTION_KEY='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
unset BILLING_WEBHOOK_SECRET
PREBUILT_BUNDLE="$prebuilt_root/bundle.tar.gz" bash "$repo_root/deploy/run-deploy.sh" \
  "$expected_sha" "$prebuilt_root/build" "$prebuilt_root/live" > "$prebuilt_root/run.log" 2>&1
! grep -q '^npm ' "$prebuilt_root/deploy.log"
grep -q "^activate $prebuilt_root/build $prebuilt_root/live $expected_sha$" "$prebuilt_root/deploy.log"
[[ "$(cat "$prebuilt_root/build/.next/.release-commit")" == "$expected_sha" ]]
[[ ! -f "$prebuilt_root/bundle.tar.gz" ]]
[[ -f "$prebuilt_root/build/.next/standalone/public/icon.png" ]]
printf 'PASS prebuilt-valid\n'

prebuilt_bad="$test_root/prebuilt-sha-mismatch"
mkdir -p "$prebuilt_bad/bundle/.next/standalone" "$prebuilt_bad/build/deploy" \
  "$prebuilt_bad/live/.next/standalone"
printf 'old env\n' > "$prebuilt_bad/live/.env"
printf 'old local env\n' > "$prebuilt_bad/live/.env.local"
touch "$prebuilt_bad/live/.next/standalone/server.js" "$prebuilt_bad/bundle/.next/standalone/server.js"
printf '%s\n' 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' > "$prebuilt_bad/bundle/.next/.release-commit"
tar -czf "$prebuilt_bad/bad-bundle.tar.gz" -C "$prebuilt_bad/bundle" .next
cp "$prebuilt_root/build/deploy/prepare-source.sh" "$prebuilt_bad/build/deploy/prepare-source.sh"
cp "$prebuilt_root/build/deploy/activate-release.sh" "$prebuilt_bad/build/deploy/activate-release.sh"
export TEST_DEPLOY_LOG="$prebuilt_bad/deploy.log"
status=0
PREBUILT_BUNDLE="$prebuilt_bad/bad-bundle.tar.gz" bash "$repo_root/deploy/run-deploy.sh" \
  "$expected_sha" "$prebuilt_bad/build" "$prebuilt_bad/live" > "$prebuilt_bad/run.log" 2>&1 || status=$?
[[ "$status" == 1 ]]
! grep -q '^activate ' "$prebuilt_bad/deploy.log"
printf 'PASS prebuilt-sha-mismatch\n'
