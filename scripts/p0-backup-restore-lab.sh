#!/usr/bin/env bash
set -Eeuo pipefail

backup_file="$(realpath "${1:?backup file required}")"
expected_hash='13fa0f546f543ad813c4dac4e8cc371b2dd432011350aea9a80e9ee1299374cd'
actual_hash="$(sha256sum "$backup_file" | cut -d ' ' -f 1)"
if [[ "$actual_hash" != "$expected_hash" ]]; then
  echo '[RestoreLab] Artifact checksum mismatch' >&2
  exit 1
fi
gzip -t "$backup_file"

container="p0-restore-${GITHUB_RUN_ID:-local}"
sql_dir="$(mktemp -d)"
restore_log="$(mktemp)"
chmod 755 "$sql_dir"
cleanup() {
  docker rm -f "$container" >/dev/null 2>&1 || true
  rm -f "$sql_dir/backup.sql" "$restore_log"
  rmdir "$sql_dir" 2>/dev/null || true
}
trap cleanup EXIT
gzip -dc "$backup_file" > "$sql_dir/backup.sql"
chmod 644 "$sql_dir/backup.sql"

docker run -d --name "$container" --network none \
  -e POSTGRES_PASSWORD=restore-lab-only \
  -v "$sql_dir:/restore:ro" \
  supabase/postgres:17.6.1.175 \
  postgres -D /etc/postgresql -c cron.launch_active_jobs=off >/dev/null

ready=0
for attempt in {1..60}; do
  if docker exec "$container" pg_isready -q -U supabase_admin; then
    ready=1
    break
  fi
  if [[ "$(docker inspect -f '{{.State.Running}}' "$container")" == 'false' ]]; then
    echo '[RestoreLab] Isolated PostgreSQL exited during startup' >&2
    docker logs "$container" 2>&1 | grep -Ei 'fatal|error|permission denied|could not|no such' | tail -n 12 || true
    exit 1
  fi
  sleep 2
done
if (( ready == 0 )); then
  echo '[RestoreLab] Isolated PostgreSQL not ready' >&2
  exit 1
fi

version="$(docker exec "$container" psql -X -A -t -U supabase_admin -d postgres -c 'SHOW server_version')"
cron_state="$(docker exec "$container" psql -X -A -t -U supabase_admin -d postgres -c 'SHOW cron.launch_active_jobs')"
if [[ "$cron_state" != 'off' ]]; then
  echo '[RestoreLab] Cron execution was not disabled' >&2
  exit 1
fi
echo "[RestoreLab] PostgreSQL $version ready; cron jobs disabled; network isolated"

# Dùng init chuẩn để có đủ reserved roles, nhưng restore vào database trống.
# pg_cron chỉ được cài trong một database nên chuyển nó khỏi database bootstrap.
docker exec -i "$container" psql -X -q -v ON_ERROR_STOP=1 -U supabase_admin -d postgres <<'SQL'
DROP EXTENSION IF EXISTS pg_cron CASCADE;
CREATE DATABASE restore_test;
ALTER SYSTEM SET cron.database_name = 'restore_test';
SQL
docker restart "$container" >/dev/null
for attempt in {1..60}; do
  if docker exec "$container" pg_isready -q -U supabase_admin -d restore_test; then break; fi
  sleep 2
done
cron_database="$(docker exec "$container" psql -X -A -t -U supabase_admin -d restore_test -c 'SHOW cron.database_name')"
cron_state="$(docker exec "$container" psql -X -A -t -U supabase_admin -d restore_test -c 'SHOW cron.launch_active_jobs')"
if [[ "$cron_database" != 'restore_test' || "$cron_state" != 'off' ]]; then
  echo '[RestoreLab] Safe pg_cron settings were not applied' >&2
  exit 1
fi

existing_schemas="$(docker exec "$container" psql -X -A -t -U supabase_admin -d restore_test -c \
  "SELECT count(*) FROM pg_namespace WHERE nspname IN ('auth','storage','extensions','cron','graphql','graphql_public','realtime','vault')")"
echo "[RestoreLab] Preexisting Supabase schema count: $existing_schemas"
if [[ "$existing_schemas" != '0' ]]; then
  echo '[RestoreLab] Expected target-already-initialized conflict; no schemas dropped' >&2
  exit 1
fi

if ! docker exec "$container" psql -X -q -v ON_ERROR_STOP=1 -v VERBOSITY=verbose \
  -U supabase_admin -d restore_test -f /restore/backup.sql >"$restore_log" 2>&1; then
  sqlstate="$(sed -nE 's/.*ERROR:[[:space:]]*([0-9A-Z]{5}):.*/\1/p' "$restore_log" | head -n 1)"
  line_number="$(sed -nE 's/.*backup.sql:([0-9]+):.*/\1/p' "$restore_log" | head -n 1)"
  category='UNKNOWN'
  if grep -Eiq 'role .*does not exist' "$restore_log"; then category='FIXABLE_RESTORE_PREREQUISITE_ROLE';
  elif grep -Eiq 'extension .*not available|extension .*not installed' "$restore_log"; then category='ENVIRONMENT_MISMATCH_EXTENSION';
  elif grep -Eiq 'schema .*already exists|relation .*already exists' "$restore_log"; then category='EXPECTED_TARGET_ALREADY_INITIALIZED';
  elif grep -Eiq 'pg_cron|cron\.database_name' "$restore_log"; then category='ENVIRONMENT_MISMATCH_PG_CRON';
  elif grep -Eiq 'permission denied|must be superuser' "$restore_log"; then category='FIXABLE_RESTORE_PREREQUISITE_PERMISSION';
  fi
  echo "[RestoreLab] Restore failed; SQLSTATE=${sqlstate:-UNKNOWN}; line=${line_number:-UNKNOWN}; category=$category. SQL output suppressed." >&2
  exit 1
fi

objects_ok="$(docker exec "$container" psql -X -A -t -U supabase_admin -d restore_test -c \
  "SELECT to_regclass('public.profiles') IS NOT NULL
      AND to_regclass('public.words') IS NOT NULL
      AND to_regclass('public.orders') IS NOT NULL
      AND to_regclass('public.srs_progress') IS NOT NULL
      AND to_regclass('public.referral_links') IS NOT NULL
      AND to_regclass('public.reward_transactions') IS NOT NULL
      AND to_regclass('auth.users') IS NOT NULL
      AND to_regclass('storage.objects') IS NOT NULL")"
[[ "$objects_ok" == 't' ]] || { echo '[RestoreLab] Critical tables missing' >&2; exit 1; }

docker exec "$container" psql -X -q -U supabase_admin -d restore_test -c \
  'SELECT count(*) FROM public.profiles; SELECT count(*) FROM public.words; SELECT count(*) FROM public.orders;' >/dev/null
functions_ok="$(docker exec "$container" psql -X -A -t -U supabase_admin -d restore_test -c \
  "SELECT (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
            WHERE n.nspname='public' AND p.proname IN
            ('confirm_paid_order','get_word_summary','fn_resolve_referral_code','claim_onboarding_xp')) >= 4
      AND (SELECT count(*) FROM pg_policies WHERE schemaname='public') > 0")"
[[ "$functions_ok" == 't' ]] || { echo '[RestoreLab] Critical functions or policies missing' >&2; exit 1; }

docker restart "$container" >/dev/null
for attempt in {1..30}; do
  if docker exec "$container" pg_isready -q -U supabase_admin -d restore_test; then break; fi
  sleep 2
done
restart_ok="$(docker exec "$container" psql -X -A -t -U supabase_admin -d restore_test -c \
  "SELECT to_regclass('public.profiles') IS NOT NULL AND to_regclass('auth.users') IS NOT NULL")"
[[ "$restart_ok" == 't' ]] || { echo '[RestoreLab] Restart/queryability failed' >&2; exit 1; }
echo '[RestoreLab] RESTORE VERIFIED: schemas, tables, counts, functions, policies, restart/queryability'
