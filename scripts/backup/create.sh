#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

[[ -n "${RUNNER_TEMP:-}" && -n "${GITHUB_OUTPUT:-}" ]] || { echo '[Backup] Runner paths required' >&2; exit 1; }
recipient="${BACKUP_AGE_RECIPIENT:-}"
if [[ "${BACKUP_REQUIRE_ENCRYPTION:-false}" == true && -z "$recipient" ]]; then
  echo '[Backup] Encryption required but recipient missing' >&2
  exit 1
fi
if [[ -n "$recipient" ]] && ! command -v age >/dev/null; then
  echo '[Backup] age encryption tool missing' >&2
  exit 1
fi
private_dir=$(mktemp -d "$RUNNER_TEMP/lingopro-backup.XXXXXX")
chmod 700 "$private_dir"
output_dir="$private_dir/output"
mkdir -m 700 "$output_dir"
stamp=$(date -u +%Y%m%d_%H%M%S)
filename="lingopro_backup_${stamp}.sql.gz"
sql_file="$private_dir/dump.sql"
error_file="$private_dir/dump.stderr"
env_file="$private_dir/connection.env"
success=false
cleanup() {
  rm -f -- "$sql_file" "$error_file" "$env_file"
  if [[ "$success" != true ]]; then
    rm -f -- "$output_dir/$filename" "$output_dir/$filename.sha256"
    rmdir "$output_dir" "$private_dir" 2>/dev/null || true
  fi
}
trap cleanup EXIT
"${PYTHON_BIN:-python3}" scripts/backup/connection.py "$env_file"
# Credentials chỉ nằm trong env-file riêng; không truyền URI/password trên argv/log.
if ! docker run --rm --env-file "$env_file" \
  postgres:17-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24 \
  pg_dump --no-owner --no-privileges > "$sql_file" 2> "$error_file"; then
  echo '[Backup] pg_dump failed; private stderr suppressed' >&2
  exit 1
fi
[[ -s "$sql_file" ]] || { echo '[Backup] Empty SQL dump' >&2; exit 1; }
if ! head -c 200 "$sql_file" | grep -Eqi 'PostgreSQL|pg_dump|SET |CREATE |--'; then
  echo '[Backup] Invalid SQL dump; content suppressed' >&2
  exit 1
fi
gzip -9 -c "$sql_file" > "$output_dir/$filename"
gzip -t "$output_dir/$filename"
if [[ -n "$recipient" ]]; then
  if ! age --encrypt --recipient "$recipient" --output "$output_dir/$filename.age" "$output_dir/$filename" 2> "$error_file"; then
    rm -f -- "$output_dir/$filename.age"
    echo '[Backup] Encryption failed; no upload allowed' >&2
    exit 1
  fi
  rm -f -- "$output_dir/$filename"
  filename="$filename.age"
  echo '[Backup] Encryption enabled'
else
  echo '::warning::Backup encryption pending operator recipient; compressed plaintext retained under accepted temporary risk'
fi
[[ -s "$output_dir/$filename" ]] || { echo '[Backup] Empty backup' >&2; exit 1; }
(cd "$output_dir" && sha256sum "$filename" > "$filename.sha256" && sha256sum --check --strict "$filename.sha256")
printf 'directory=%s\nfilename=%s\nstamp=%s\nprivate_directory=%s\n' "$output_dir" "$filename" "$stamp" "$private_dir" >> "$GITHUB_OUTPUT"
success=true
echo '[Backup] Compressed backup and SHA-256 manifest verified'
