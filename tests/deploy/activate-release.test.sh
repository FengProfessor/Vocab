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
cat > "$test_root/bin/sudo" <<'MOCK'
#!/usr/bin/env bash
[[ "${1:-}" == '-n' ]] && shift
exec "$@"
MOCK
cat > "$test_root/bin/systemctl" <<'MOCK'
#!/usr/bin/env bash
case "$1" in
  stop)
    if [[ "$TEST_SCENARIO" == 'stop-fail' ]]; then exit 1; fi
    printf 'inactive\n' > "$TEST_SERVICE_STATE"
    ;;
  restart)
    marker="$(cat "$TEST_LIVE_APP_DIR/.next/marker")"
    if [[ "$TEST_SCENARIO" == 'restart-fail' && "$marker" == 'candidate' ]] ||
       [[ "$TEST_SCENARIO" == 'rollback-restart-fail' && "$marker" == 'previous' ]]; then
      exit 1
    fi
    printf 'active\n' > "$TEST_SERVICE_STATE"
    ;;
  is-active)
    if [[ "$TEST_SCENARIO" == 'process-dies' ]] && [[ "$(cat "$TEST_LIVE_APP_DIR/.next/marker")" == 'candidate' ]]; then
      exit 1
    fi
    [[ "$(cat "$TEST_SERVICE_STATE")" == 'active' ]]
    ;;
  show)
    printf '12345\n'
    ;;
  *) exit 2 ;;
esac
MOCK
cat > "$test_root/bin/curl" <<'MOCK'
#!/usr/bin/env bash
marker="$(cat "$TEST_LIVE_APP_DIR/.next/marker")"
if [[ "$marker" == 'candidate' && "$TEST_SCENARIO" != 'success' && "$TEST_SCENARIO" != 'restart-fail' ]] ||
   [[ "$marker" == 'previous' && "$TEST_SCENARIO" == 'rollback-health-fail' ]]; then
  printf '503'
  exit 22
fi
printf '200'
MOCK
cat > "$test_root/bin/sleep" <<'MOCK'
#!/usr/bin/env bash
exit 0
MOCK
chmod +x "$test_root/bin/"*
export PATH="$test_root/bin:$PATH"

run_case() {
  local scenario="$1" expected_status="$2" expected_marker="$3"
  local case_dir="$test_root/$scenario"
  mkdir -p "$case_dir/staging/.next/standalone" "$case_dir/live/.next/standalone"
  touch "$case_dir/staging/.next/standalone/server.js" "$case_dir/live/.next/standalone/server.js"
  printf 'candidate\n' > "$case_dir/staging/.next/marker"
  printf '%s\n' 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' > "$case_dir/staging/.next/.release-commit"
  if [[ "$scenario" == 'candidate-sha-mismatch' ]]; then
    printf '%s\n' 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' > "$case_dir/staging/.next/.release-commit"
  fi
  printf 'previous\n' > "$case_dir/live/.next/marker"
  printf 'candidate env\n' > "$case_dir/staging/.env"
  printf 'candidate local env\n' > "$case_dir/staging/.env.local"
  printf 'previous env\n' > "$case_dir/live/.env"
  printf 'previous local env\n' > "$case_dir/live/.env.local"
  printf 'active\n' > "$case_dir/service.state"
  export TEST_LIVE_APP_DIR="$case_dir/live" TEST_SERVICE_STATE="$case_dir/service.state" TEST_SCENARIO="$scenario"

  local status=0
  bash "$repo_root/deploy/activate-release.sh" "$case_dir/staging" "$case_dir/live" 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' > "$case_dir/run.log" 2>&1 || status=$?
  [[ "$status" == "$expected_status" ]] || { cat "$case_dir/run.log"; return 1; }
  [[ "$(cat "$case_dir/live/.next/marker")" == "$expected_marker" ]] || { cat "$case_dir/run.log"; return 1; }
  [[ "$(cat "$case_dir/live/.env")" == "$expected_marker env" ]] || { cat "$case_dir/run.log"; return 1; }
  [[ "$(cat "$case_dir/live/.env.local")" == "$expected_marker local env" ]] || { cat "$case_dir/run.log"; return 1; }
  if [[ "$scenario" == 'success' ]]; then
    grep -q 'Candidate HEALTHY' "$case_dir/run.log"
    local previous_count
    previous_count="$(find "$case_dir/live" -path '*/.next-previous.*/.next/marker' -exec grep -l '^previous$' {} + | wc -l)"
    [[ "$previous_count" -eq 1 ]]
  elif [[ "$scenario" == 'candidate-sha-mismatch' ]]; then
    grep -q 'Candidate release commit does not match expected SHA' "$case_dir/run.log"
  elif [[ "$scenario" == 'stop-fail' || "$scenario" == 'rollback-restart-fail' || "$scenario" == 'rollback-health-fail' ]]; then
    grep -q 'Rollback FAILED' "$case_dir/run.log"
  else
    grep -q 'Rollback SUCCEEDED; candidate deployment remains FAILED' "$case_dir/run.log"
  fi
  printf 'PASS %s\n' "$scenario"
}

run_case success 0 candidate
run_case candidate-sha-mismatch 1 previous
run_case stop-fail 1 previous
run_case restart-fail 1 previous
run_case process-dies 1 previous
run_case candidate-health-fail 1 previous
run_case rollback-restart-fail 1 previous
run_case rollback-health-fail 1 previous
