#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 2 || ! "${1:-}" =~ ^[0-9a-f]{40}$ ]]; then
  echo '[Deploy] Usage: prepare-source.sh EXPECTED_SHA BUILD_DIR (40 lowercase hex characters)' >&2
  exit 2
fi

expected_sha="$1"
build_dir="$2"
repo_url='https://github.com/FengProfessor/Vocab.git'

mkdir -p "$build_dir"
cd "$build_dir"
if [[ ! -d .git ]]; then
  if [[ -n "$(ls -A .)" ]]; then
    echo '[Deploy] Build directory is nonempty and is not a Git repository' >&2
    exit 1
  fi
  git init -q
  git remote add origin "$repo_url"
else
  git remote set-url origin "$repo_url"
fi

echo "[Deploy] Expected commit: $expected_sha"
git fetch --no-tags origin "$expected_sha"
git checkout --detach --force "$expected_sha"
actual_sha="$(git rev-parse HEAD)"
echo "[Deploy] Actual checked-out commit: $actual_sha"
if [[ "$actual_sha" != "$expected_sha" ]]; then
  echo '[Deploy] Checked-out commit differs from expected commit' >&2
  exit 1
fi
if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  echo '[Deploy] Staging source contains tracked edits or untracked files' >&2
  exit 1
fi
