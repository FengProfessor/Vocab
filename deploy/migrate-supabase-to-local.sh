#!/usr/bin/env bash
# ==============================================================================
# Script Chuyển Đổi CSDL Từ Supabase Cloud Về PostgreSQL Self-Hosted (LingoPro)
# ==============================================================================
# Chạy script này trên máy PC Server Ubuntu (~/Vocab/web-app/deploy/migrate-supabase-to-local.sh)
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "🚀 [Migrate-DB] Bắt đầu tiến trình chuyển đổi CSDL từ Supabase Cloud về Self-Hosted..."

# 1. Kiểm tra / Cài đặt PostgreSQL Server nếu chưa có
if ! command -v psql >/dev/null 2>&1; then
  echo "📦 Cài đặt PostgreSQL Client & Server..."
  sudo apt-get update -y
  sudo apt-get install -y postgresql postgresql-contrib
  sudo systemctl enable --now postgresql
fi

# 2. Đọc biến môi trường từ .env.local
ENV_FILE="$APP_DIR/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="$APP_DIR/.env"
fi

SUPABASE_URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
SERVICE_KEY=$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
DB_PASS=$(grep -E '^SUPABASE_DB_PASSWORD=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)

# 3. Tạo Database Local & User
LOCAL_DB="lingopro_db"
LOCAL_USER="lingopro_user"
LOCAL_PASS="lingopro_selfhost_pass_2026"

echo "🔑 Đang tạo Database Local ($LOCAL_DB) & User ($LOCAL_USER)..."
sudo -u postgres psql -c "CREATE USER $LOCAL_USER WITH PASSWORD '$LOCAL_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $LOCAL_DB OWNER $LOCAL_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $LOCAL_DB TO $LOCAL_USER;" 2>/dev/null || true

# 4. Import Schema gốc từ tệp schema.sql
if [ -f "$APP_DIR/supabase/schema.sql" ]; then
  echo "📝 Nạp cấu trúc Schema (supabase/schema.sql) vào Database Local..."
  sudo -u postgres psql -d "$LOCAL_DB" -f "$APP_DIR/supabase/schema.sql" || true
fi

# 5. Khôi phục dữ liệu nếu có file backup SQL
BACKUP_FILE="${1:-}"
if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
  echo "📥 Đang khôi phục dữ liệu từ tệp $BACKUP_FILE..."
  sudo -u postgres psql -d "$LOCAL_DB" -f "$BACKUP_FILE"
fi

# 6. Cập nhật DATABASE_URL trong .env.local
LOCAL_CONN_STRING="postgresql://$LOCAL_USER:$LOCAL_PASS@localhost:5432/$LOCAL_DB"
if grep -qE '^DATABASE_URL=' "$ENV_FILE"; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$LOCAL_CONN_STRING|" "$ENV_FILE"
else
  echo "" >> "$ENV_FILE"
  echo "DATABASE_URL=$LOCAL_CONN_STRING" >> "$ENV_FILE"
fi

echo "✅ [Migrate-DB] Chuyển đổi thành công! DATABASE_URL đã được trỏ về $LOCAL_CONN_STRING."
echo "🔄 Hãy chạy lệnh restart service: sudo systemctl restart lingopro.service"
