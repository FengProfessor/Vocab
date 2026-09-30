> Áp dụng khi sao lưu/khôi phục database. Mục đích: mô tả workflow và khóa mã hóa còn cần operator.

# Database backup

`db-backup.yml`: 19:00 UTC (02:00 Việt Nam), hoặc operator dispatch. Không deploy/migrate/restart. Nguồn secret `SUPABASE_DB_URL`; Supabase session pooler port 5432, PostgreSQL 17 pg_dump plain SQL `--no-owner --no-privileges`, gzip integrity test, SHA-256 sidecar, GitHub artifact retention 30 ngày và Google Drive OAuth/rclone checksum verification. Drive không có retention tự động; operator quản lý dung lượng/retention riêng.

## Hardening trong PR followup

- Read-only contents permission, concurrency không hủy lượt đang chạy, timeout 30 phút.
- Tất cả external actions trong repo (checkout/setup-node/setup-go/setup-java/upload-artifact/SSH/Tailscale) pin full upstream commit SHA cùng version đang dùng; annotated Tailscale tag đã dereference sang commit. Checkout/upload-artifact backup pin full SHA từ upstream; postgres image pin manifest digest; rclone giữ version + SHA-256. [GitHub guidance](https://docs.github.com/en/actions/reference/security/secure-use) khuyến nghị immutable action SHA.
- Runner temp directory 0700, umask 077; URL parser đổi **port**, không thay password có chuỗi `6543`; giữ existing pooler identity.
- Credentials trong env-file 0600, không URI/password trên argv; xóa env, raw SQL, stderr trước upload. Không in dump/error chứa data; failure nonzero chặn upload. OAuth config temp riêng và cleanup.
- Backup + manifest vào artifact exact private output directory, thiếu file làm FAIL; upload/check cả hai lên Drive. Rclone check dùng checksum provider (Drive MD5); SHA-256 sidecar dùng khi restore/download.
- TLS tối thiểu `require`; `sslmode=disable` bị từ chối. `verify-ca/full` được giữ nếu URL yêu cầu, không fallback disable. CA validation end-to-end trong Docker chưa được kiểm chứng; không gọi transport encryption là server identity verification.

## Bật mã hóa (pending operator)

Từ máy sạch, dùng **age** tạo identity riêng và giữ private identity offline/secret manager có backup. Chỉ lưu public `age1...` recipient vào GitHub **Variables** `BACKUP_AGE_RECIPIENT`; không lưu private identity vào repo/runner. Thiết lập `BACKUP_REQUIRE_ENCRYPTION=true` sau khi xác minh recipient + phục hồi. Khi có recipient, chỉ `.sql.gz.age` + checksum được upload; encryption lỗi làm FAIL. Khi require=true mà thiếu recipient, dừng trước dump.

Chưa có operator recipient: workflow giữ gzip plaintext + cảnh báo để không làm gián đoạn backup hiện hữu. **Encryption chưa CLOSED**, bản cũ cũng chưa tự mã hóa lại. Không mở quyền artifact/Drive công khai. Backup mới cần canonical scheduled/dispatch + Drive verification sau merge; fixture CI không thay thế real backup/restore.

## Restore offline

Tải backup và `.sha256` vào môi trường isolated, `sha256sum --check <manifest>`; nếu encrypted: `age --decrypt --identity <offline-identity> <backup.sql.gz.age> > restore.sql.gz`; `gzip -t restore.sql.gz`. Khôi phục vào Supabase-compatible database thử theo quy trình đã kiểm chứng; plain dump chứa managed roles/extensions nên không giả định restore vào PostgreSQL trống sẽ tương thích. Không chạy restore SQL production ad hoc.

P0 evidence lịch sử: backup/Drive run `36131664615`, isolated restore `36113337536`/`36113855566`. Đây là evidence workflow cũ; không chứng minh encrypted backup mới đã restore. OAuth app Testing/refresh-token lifetime và recipient ownership còn operator kiểm tra.
