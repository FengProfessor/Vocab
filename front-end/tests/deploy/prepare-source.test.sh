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
cat > "$test_root/bin/git" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$TEST_GIT_LOG"
case "$1" in
  fetch) [[ "$TEST_SCENARIO" != 'fetch-fail' ]] ;;
  checkout) [[ "$TEST_SCENARIO" != 'checkout-fail' ]] ;;
  rev-parse)
    if [[ "$TEST_SCENARIO" == 'wrong-sha' ]]; then
      printf '%s\n' 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    else
      printf '%s\n' 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    fi
    ;;
  status)
    if [[ "$TEST_SCENARIO" == 'dirty-source' ]]; then
      printf '%s\n' ' M tracked-file'
    fi
    ;;
esac
MOCK
chmod +x "$test_root/bin/git"
export PATH="$test_root/bin:$PATH"
expected_sha='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

run_case() {
  local scenario="$1" expected_status="$2"
  local case_dir="$test_root/$scenario" status=0
  mkdir -p "$case_dir/build/.git"
  export TEST_SCENARIO="$scenario" TEST_GIT_LOG="$case_dir/git.log"
  bash "$repo_root/deploy/prepare-source.sh" "$expected_sha" "$case_dir/build" > "$case_dir/run.log" 2>&1 || status=$?
  [[ "$status" == "$expected_status" ]] || { cat "$case_dir/run.log"; return 1; }
  grep -q '^fetch --no-tags origin aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa$' "$case_dir/git.log"
  if [[ "$scenario" == 'fetch-fail' ]]; then
    ! grep -q '^checkout ' "$case_dir/git.log"
  elif [[ "$scenario" == 'checkout-fail' ]]; then
    ! grep -q '^rev-parse ' "$case_dir/git.log"
  else
    grep -q '^checkout --detach --force aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa$' "$case_dir/git.log"
    grep -q '^rev-parse HEAD$' "$case_dir/git.log"
  fi
  printf 'PASS %s\n' "$scenario"
}

run_case exact-sha 0
run_case wrong-sha 1
run_case fetch-fail 1
run_case checkout-fail 1
run_case dirty-source 1

mkdir -p "$test_root/missing/build/.git"
export TEST_SCENARIO=missing-sha TEST_GIT_LOG="$test_root/missing/git.log"
status=0
bash "$repo_root/deploy/prepare-source.sh" '' "$test_root/missing/build" > "$test_root/missing/run.log" 2>&1 || status=$?
[[ "$status" == 2 && ! -e "$TEST_GIT_LOG" ]]
printf 'PASS missing-sha\n'
