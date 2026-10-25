#!/usr/bin/env bash
set -Eeuo pipefail
fixture=$(mktemp -d)
trap 'rm -rf -- "$fixture"' EXIT
mkdir "$fixture/bin" "$fixture/runner"
cat > "$fixture/bin/docker" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
[[ "$*" != *postgresql://* && "$*" != *fixture6543* ]]
[[ "$*" == *postgres:17-alpine@sha256:* ]]
[[ "$1" == run && "$2" == --rm && "$3" == --env-file ]]
grep -q '^PGPASSWORD=fixture6543 value$' "$4"
grep -q '^PGPORT=5432$' "$4"
case "${DUMP_FIXTURE_MODE:-valid}" in
  valid) printf '%s\n' '-- PostgreSQL database dump' 'CREATE TABLE fixture (id integer);' ;;
  invalid) printf '%s\n' 'PRIVATE-PII-SENTINEL' ;;
  failed) echo 'PRIVATE-SECRET-SENTINEL' >&2; exit 1 ;;
  empty) : ;;
esac
MOCK
chmod +x "$fixture/bin/docker"
export PATH="$fixture/bin:$PATH"
export RUNNER_TEMP="$fixture/runner"
export DATABASE_URL='postgresql://postgres:fixture6543%20value@aws.pooler.supabase.com:6543/postgres'
export SUPABASE_PROJECT_REF=fixtureproject
export BACKUP_AGE_RECIPIENT=''
export BACKUP_REQUIRE_ENCRYPTION=false
export GITHUB_OUTPUT="$fixture/output"
bash scripts/backup/create.sh > "$fixture/log" 2>&1
directory=$(sed -n 's/^directory=//p' "$GITHUB_OUTPUT")
filename=$(sed -n 's/^filename=//p' "$GITHUB_OUTPUT")
gzip -t "$directory/$filename"
(cd "$directory" && sha256sum --check --strict "$filename.sha256")
[[ $(find "$directory" -type f | wc -l) -eq 2 ]]
[[ ! -f "${directory%/output}/connection.env" && ! -f "${directory%/output}/dump.sql" ]]
if [[ "$(uname -s)" == Linux ]]; then
  [[ "$(stat -c '%a' "$directory/$filename")" == 600 ]]
  [[ "$(stat -c '%a' "${directory%/output}")" == 700 ]]
fi
for mode in invalid failed empty; do
  export DUMP_FIXTURE_MODE="$mode"
  : > "$GITHUB_OUTPUT"
  if bash scripts/backup/create.sh > "$fixture/log" 2>&1; then echo "[BackupTest] $mode should fail" >&2; exit 1; fi
  [[ ! -s "$GITHUB_OUTPUT" ]]
  ! grep -Eq 'PRIVATE-(PII|SECRET)-SENTINEL|fixture6543' "$fixture/log"
done
unset DUMP_FIXTURE_MODE
export BACKUP_REQUIRE_ENCRYPTION=true
if bash scripts/backup/create.sh > "$fixture/log" 2>&1; then echo '[BackupTest] Missing recipient should fail' >&2; exit 1; fi
if command -v age >/dev/null && command -v age-keygen >/dev/null; then
  age-keygen -o "$fixture/identity" 2> /dev/null
  BACKUP_AGE_RECIPIENT=$(age-keygen -y "$fixture/identity")
  export BACKUP_AGE_RECIPIENT
  : > "$GITHUB_OUTPUT"
  bash scripts/backup/create.sh > "$fixture/log" 2>&1
  directory=$(sed -n 's/^directory=//p' "$GITHUB_OUTPUT")
  filename=$(sed -n 's/^filename=//p' "$GITHUB_OUTPUT")
  [[ "$filename" == *.sql.gz.age ]]
  [[ $(find "$directory" -type f | wc -l) -eq 2 ]]
  age --decrypt --identity "$fixture/identity" "$directory/$filename" | gzip -d | grep -q 'CREATE TABLE fixture'
  echo '[BackupTest] age encryption/decryption round trip PASS'
else
  echo '[BackupTest] age unavailable locally; real encryption/decryption required in Linux CI'
fi
echo '[BackupTest] dump/checksum/private files/failure redaction/TLS/encryption guard PASS'
