-- Lưu vết migration chạy bởi scripts/apply-p0-migrations.mjs.
-- Schema riêng chỉ dành cho DB owner; không cấp quyền truy cập cho API roles.
CREATE SCHEMA IF NOT EXISTS app_migrations;
REVOKE ALL ON SCHEMA app_migrations FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS app_migrations.applied (
  filename text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE app_migrations.applied FROM PUBLIC, anon, authenticated;
