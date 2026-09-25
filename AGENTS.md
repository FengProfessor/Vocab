> Áp dụng khi sửa hạ tầng production của Vocab. Mục đích: một luồng deploy có thể kiểm chứng và bàn giao.

# Quy tắc vận hành production

## Khởi đầu bắt buộc

Trước khi sửa production: đọc `AGENTS.md`, `progress.md`, `docs/operations/production-deploy.md`, `docs/operations/database-migrations.md`, `docs/operations/rollback.md`; sau đó xem workflow/script hiện tại và chạy `git status`. Không dựa riêng vào hội thoại cũ.

Thứ tự nguồn sự thật khi có mâu thuẫn: workflow đang chạy → script deploy → `AGENTS.md` → `docs/operations/` → `progress.md` → tài liệu cũ. Khi thấy lệch, sửa tài liệu và mã liên quan trước khi tuyên bố hoàn tất.

## Luồng duy nhất

Push `main` hoặc dispatch trên `main` → quality gate → migration → checkout đúng event SHA → build → `activate-release.sh` → restart `lingopro.service` → process và HTTP health check → thành công. Migration lỗi phải chặn deploy. Production SQL chỉ qua workflow chuẩn, trừ khi được ủy quyền rõ ràng để xử lý sự cố.

Chỉ một controller được phép triển khai production: workflow chuẩn. Truy cập SSH production, trigger deploy, migration, restart hoặc vô hiệu hóa automation trên host cần operator cho phép rõ ràng. Kiểm tra read-only trên host cũng cần quyền truy cập được cấp.

## Lệnh tắt của người dùng

| Lệnh | Ý nghĩa |
|---|---|
| `commit đi` | Commit thay đổi hiện tại; không push. |
| `push đi` | Commit nếu cần rồi push branch hiện tại; không merge `main`. |
| `deploy đi` | Commit, push và release production qua canonical workflow của repo; không deploy thủ công. |
| `lên production` | Giống `deploy đi`. |

Với mọi deploy, tuân thủ workflow chuẩn và các preflight/điểm dừng trong repo. Không SSH deploy thủ công, `git pull`, dùng PM2 hoặc đi vòng CI, migration, health check.

## NEVER

- Không deploy production bằng `git pull`, `origin/main`, Docker/PM2 script cũ, hoặc webhook tự pull không qua quality/migration.
- Không swap `.next` hay restart thủ công để đi vòng `activate-release.sh`.
- Không gọi rollback thành công là deploy thành công. Restart, process hoặc readiness lỗi thì job phải FAIL.
- Không triển khai hay dùng đường production khác trước khi cập nhật workflow GitHub Actions chuẩn, script deploy, `AGENTS.md` và tài liệu operations.
- Không tuyên bố đã kiểm chứng production nếu chưa thực sự chạy trên production.

Các lệnh và điều kiện thực tế: xem `docs/operations/production-deploy.md`, `database-migrations.md`, `rollback.md`. `progress.md` chỉ là checkpoint.
