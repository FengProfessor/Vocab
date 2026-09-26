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
  fi
  printf 'PASS %s\n' "$scenario"
}

run_case success 0
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
