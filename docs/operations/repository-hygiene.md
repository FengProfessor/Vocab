> Áp dụng khi dọn repo. Mục đích: chỉ untrack generated files đã phân loại.

# Repository hygiene

| Nhóm | Phân loại / hành động |
|---|---|
| package/config/src/tests/migrations/deploy | SOURCE; giữ |
| AGENTS/progress/PROJECT/GEMINI/TEST_* | DOCUMENTATION; entrypoints giữ, bổ sung links docs; không di chuyển làm hỏng references |
| `scripts/**/__pycache__/*.pyc` | GENERATED ARTIFACT; bỏ tracking, ignore `__pycache__/`, `*.py[cod]`; source Python giữ |
| `scripts/logs/*.out/*.err/*.pid`, `scripts/lists/_staging/*.err` | GENERATED runtime output/PID; bỏ tracking, ignore; giữ files trên máy và source/runbook trong cùng thư mục |
| Root audit_output/build_error/ped_audit_out/short_fb_output/ui_qa_output* | GENERATED/HISTORICAL hoặc UNKNOWN ownership; giữ trong lượt này, chưa in data hoặc migrate lịch sử thiếu evidence |
| Root one-off check/fix/generation scripts | SOURCE/UNKNOWN operational references; giữ tới khi kiểm tra usages/path assumptions |
| Docker/PM2/Vercel/old webhook deployment files | LEGACY / NON-CANONICAL; giữ để operator quyết định riêng |
| Future browser reports / root backup dump files | GENERATED/TEMPORARY; thêm ignore, không commit secret/database dumps |

Hygiene commit tách khỏi security/dependency commit. `git rm --cached` chỉ thay tracking, không xóa log/bytecode trên máy hay production. Không coi gitignore là cách xóa dữ liệu nhạy cảm khỏi lịch sử Git; nếu log cũ từng chứa secrets, cần audit/rotation riêng trước history rewrite có phê duyệt.
