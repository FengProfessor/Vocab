#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 3 || ! "${3:-}" =~ ^[0-9a-f]{40}$ ]]; then
  echo '[Deploy] Usage: activate-release.sh STAGING_APP_DIR LIVE_APP_DIR EXPECTED_SHA' >&2
  exit 2
fi

staging_app_dir="$(cd "$1" && pwd -P)"
live_app_dir="$(cd "$2" && pwd -P)"
expected_sha="$3"
service='lingopro.service'
health_url='http://127.0.0.1:3000/api/health'

if [[ ! -f "$staging_app_dir/.next/standalone/server.js" ]]; then
  echo '[Deploy] Candidate standalone server is missing' >&2
  exit 1
fi
if [[ ! -f "$staging_app_dir/.next/.release-commit" ]] ||
   [[ "$(cat "$staging_app_dir/.next/.release-commit")" != "$expected_sha" ]]; then
  echo '[Deploy] Candidate release commit does not match expected SHA' >&2
  exit 1
fi
if [[ ! -f "$staging_app_dir/.env" || ! -f "$staging_app_dir/.env.local" ]]; then
  echo '[Deploy] Candidate environment files are missing' >&2
  exit 1
fi
if [[ ! -f "$live_app_dir/.next/standalone/server.js" ]]; then
  echo '[Deploy] No previous standalone release; refusing unprotected activation' >&2
  exit 1
fi

wait_for_ready() {
  local attempt pid code last_pid='' consecutive=0
  for attempt in {1..15}; do
    if sudo -n systemctl is-active --quiet "$service"; then
      pid="$(sudo -n systemctl show -p MainPID --value "$service")" || pid=''
      if [[ "$pid" =~ ^[1-9][0-9]*$ ]]; then
        code="$(curl --silent --show-error --noproxy '*' --max-time 3 \
          --output /dev/null --write-out '%{http_code}' "$health_url")" || code=''
        if [[ "$code" == '200' ]]; then
          if [[ "$pid" == "$last_pid" ]]; then
            consecutive=$((consecutive + 1))
          else
            consecutive=1
          fi
          if (( consecutive >= 2 )); then
            echo "[Deploy] Ready: HTTP 200, stable service PID $pid"
            return 0
          fi
          last_pid="$pid"
        else
          consecutive=0
          last_pid=''
        fi
      fi
    else
      consecutive=0
      last_pid=''
    fi
    if (( attempt < 15 )); then sleep 2; fi
  done
  echo '[Deploy] Readiness failed after 15 bounded attempts' >&2
  return 1
}

candidate_dir="$(mktemp -d "$live_app_dir/.next-candidate.XXXXXX")"
rollback_dir="$(mktemp -d "$live_app_dir/.next-previous.XXXXXX")"
activation_started=0
previous_moved=0
candidate_activated=0
env_changed=0
env_local_changed=0
had_env=0
had_env_local=0

rollback_on_failure() {
  local candidate_status=$?
  trap - EXIT
  if (( candidate_status == 0 )); then return; fi
  echo '[Deploy] Candidate deployment FAILED' >&2
  if (( activation_started == 0 )); then
    echo '[Deploy] Previous release unchanged; rollback not needed' >&2
    exit "$candidate_status"
  fi

  echo '[Deploy] Rollback attempted' >&2
  if ! sudo -n systemctl stop "$service"; then
    echo '[Deploy] Rollback FAILED: cannot stop candidate service' >&2
    exit "$candidate_status"
  fi
  if (( candidate_activated == 1 )) && [[ -d "$live_app_dir/.next" ]]; then
    if ! mv "$live_app_dir/.next" "$candidate_dir/.failed-next"; then
      echo '[Deploy] Rollback FAILED: cannot move failed candidate' >&2
      exit "$candidate_status"
    fi
  fi
  if (( previous_moved == 1 )) && [[ -d "$rollback_dir/.next" ]]; then
    if ! mv "$rollback_dir/.next" "$live_app_dir/.next"; then
      echo '[Deploy] Rollback FAILED: cannot restore previous release' >&2
      exit "$candidate_status"
    fi
  elif [[ ! -d "$live_app_dir/.next" ]]; then
    echo '[Deploy] Rollback FAILED: previous release is missing' >&2
    exit "$candidate_status"
  fi
  if (( env_changed == 1 )); then
    if [[ -f "$live_app_dir/.env" ]] && ! mv "$live_app_dir/.env" "$candidate_dir/.failed-env"; then
      echo '[Deploy] Rollback FAILED: cannot preserve candidate env' >&2
      exit "$candidate_status"
    fi
    if (( had_env == 1 )) && ! cp -a "$rollback_dir/.env" "$live_app_dir/.env"; then
      echo '[Deploy] Rollback FAILED: cannot restore previous env' >&2
      exit "$candidate_status"
    fi
  fi
  if (( env_local_changed == 1 )); then
    if [[ -f "$live_app_dir/.env.local" ]] && ! mv "$live_app_dir/.env.local" "$candidate_dir/.failed-env.local"; then
      echo '[Deploy] Rollback FAILED: cannot preserve candidate env.local' >&2
      exit "$candidate_status"
    fi
    if (( had_env_local == 1 )) && ! cp -a "$rollback_dir/.env.local" "$live_app_dir/.env.local"; then
      echo '[Deploy] Rollback FAILED: cannot restore previous env.local' >&2
      exit "$candidate_status"
    fi
  fi
  if ! sudo -n systemctl restart "$service"; then
    echo '[Deploy] Rollback FAILED: previous service restart failed' >&2
    exit "$candidate_status"
  fi
  if ! wait_for_ready; then
    echo '[Deploy] Rollback FAILED: previous release is not healthy' >&2
    exit "$candidate_status"
  fi
  echo '[Deploy] Rollback SUCCEEDED; candidate deployment remains FAILED' >&2
  exit "$candidate_status"
}
trap rollback_on_failure EXIT

echo '[Deploy] Preparing candidate without touching the running release'
cp -a "$staging_app_dir/.next" "$candidate_dir/.next"

echo "[Deploy] Stopping $service for release switch"
activation_started=1
sudo -n systemctl stop "$service"
if [[ -f "$live_app_dir/.env" ]]; then
  cp -a "$live_app_dir/.env" "$rollback_dir/.env"
  had_env=1
fi
env_changed=1
cp -a "$staging_app_dir/.env" "$live_app_dir/.env"
if [[ -f "$live_app_dir/.env.local" ]]; then
  cp -a "$live_app_dir/.env.local" "$rollback_dir/.env.local"
  had_env_local=1
fi
env_local_changed=1
cp -a "$staging_app_dir/.env.local" "$live_app_dir/.env.local"
mv "$live_app_dir/.next" "$rollback_dir/.next"
previous_moved=1
mv "$candidate_dir/.next" "$live_app_dir/.next"
candidate_activated=1

echo "[Deploy] Restarting $service"
sudo -n systemctl restart "$service"
wait_for_ready

trap - EXIT
echo "[Deploy] Candidate HEALTHY; previous release preserved at $rollback_dir/.next"
