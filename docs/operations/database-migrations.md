> Áp dụng khi thay đổi schema production. Mục đích: ghi cách migration được gọi và giới hạn xác minh.

# Database migrations

**Trạng thái:** Workflow/runner **VERIFIED IN REPOSITORY**; lịch sử migration và schema production **NOT YET VERIFIED**. Không kết nối hay ghi production DB nếu chưa được operator ủy quyền.

Workflow `deploy-server.yml` gọi `apply-p0-migrations.yml` chỉ sau quality gate. Reusable workflow cài `pg@8.16.3` trong `scripts/`, kiểm tra có một trong `DATABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_DB_PASSWORD`, rồi chạy `scripts/apply-p0-migrations.mjs`. Không có dispatch độc lập. Thiếu credentials hoặc SQL/probe lỗi trả non-zero, ngăn deploy.

Runner áp dụng danh sách migration cố định trong `scripts/apply-p0-migrations.mjs` từ `supabase/migrations/` (hiện 7 file). `20260924_migration_history.sql` tạo `app_migrations.applied`; mỗi file có filename/checksum SHA-256 chuẩn hóa LF. Mỗi migration và record history ở một transaction với `pg_advisory_xact_lock`; file đã áp được skip nếu checksum khớp, khác checksum thì FAIL. Migration SQL cần tự chịu được lần chạy đầu trên trạng thái DB dự kiến; không sửa file đã ghi history. Muốn thêm migration, tạo file SQL mới và cập nhật danh sách runner.

Để kiểm tra cục bộ không ghi DB, dùng database **non-production** với biến môi trường dành riêng và `node scripts/apply-p0-migrations.mjs --dry-run`; lệnh vẫn kết nối DB, đọc history/checksum nhưng không apply SQL. Có thể parse SQL bằng PostgreSQL parser hoặc chạy trên DB thử riêng. Kết quả local không đồng nghĩa migration production đã chạy hoặc production schema đã đúng. Không chạy SQL ad hoc trên production nếu chưa được ủy quyền rõ ràng.
