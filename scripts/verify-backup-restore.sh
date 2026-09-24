#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo '[BackupRestore] Usage: verify-backup-restore.sh BACKUP.sql.gz' >&2
  exit 2
fi

backup_file="$(realpath "$1")"
gzip -t "$backup_file"

container="p0-backup-restore-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"
restore_log="$(mktemp)"
cleanup() {
  docker rm -f "$container" >/dev/null 2>&1 || true
  rm -f "$restore_log"
}
trap cleanup EXIT

docker run --rm -d --name "$container" \
  -e POSTGRES_PASSWORD=restore-test-only \
  supabase/postgres:17.6.1.175 >/dev/null

ready=0
for attempt in {1..60}; do
  if docker exec "$container" pg_isready -q -U postgres; then
    ready=1
    break
  fi
  sleep 2
done
if (( ready == 0 )); then
  echo '[BackupRestore] Temporary PostgreSQL did not become ready' >&2
  exit 1
fi

if ! gzip -dc "$backup_file" | docker exec -i "$container" \
  psql -X -q -v ON_ERROR_STOP=1 -v VERBOSITY=verbose -U postgres -d postgres >"$restore_log" 2>&1; then
  sqlstate="$(sed -nE 's/.*ERROR:[[:space:]]*([0-9A-Z]{5}):.*/\1/p' "$restore_log" | head -n 1)"
  line_number="$(sed -nE 's/.*stdin:([0-9]+):.*/\1/p' "$restore_log" | head -n 1)"
  cause='OTHER'
  if grep -Eiq 'pg_cron|cron\.database_name' "$restore_log"; then cause='PG_CRON';
  elif grep -Eiq 'supabase_vault|vault extension' "$restore_log"; then cause='VAULT_EXTENSION';
  elif grep -Eiq 'role .*does not exist' "$restore_log"; then cause='MISSING_ROLE';
  elif grep -Eiq 'extension .*not available|extension .*not installed' "$restore_log"; then cause='MISSING_EXTENSION';
  elif grep -Eiq 'schema .*already exists|relation .*already exists' "$restore_log"; then cause='DUPLICATE_OBJECT';
  elif grep -Eiq 'permission denied|must be superuser' "$restore_log"; then cause='PERMISSION';
  fi
  echo "[BackupRestore] Restore FAILED; SQLSTATE: ${sqlstate:-UNKNOWN}; dump line: ${line_number:-UNKNOWN}; class: $cause. SQL output suppressed." >&2
  exit 1
fi

verified="$(docker exec "$container" psql -X -A -t -U postgres -d postgres -c \
  "SELECT (SELECT count(*) FROM pg_namespace WHERE nspname IN ('public','auth','storage')) = 3
     AND to_regclass('public.profiles') IS NOT NULL
     AND to_regclass('public.words') IS NOT NULL
     AND to_regclass('auth.users') IS NOT NULL
     AND to_regclass('storage.objects') IS NOT NULL")"
if [[ "$verified" != 't' ]]; then
  echo '[BackupRestore] Restore FAILED: required schemas/tables absent' >&2
  exit 1
fi

version="$(docker exec "$container" psql -X -A -t -U postgres -d postgres -c 'SHOW server_version')"
echo "[BackupRestore] RESTORE VERIFIED on PostgreSQL $version; required schemas/tables present"
