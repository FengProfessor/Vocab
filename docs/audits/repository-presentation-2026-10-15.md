> Áp dụng khi review diện mạo và tài liệu GitHub. Mục đích: ghi phát hiện có bằng chứng, phân biệt phần đã sửa và phần cần audit trước khi dọn.

# Quét lại repository — 15/10/2026

Phạm vi: `FengProfessor/Vocab`, PR #25, đối chiếu `main` tại `1e9c76e39f5e0a781348b6f5dc4584811e36a977`. Không phải audit toàn bộ bảo mật ứng dụng hay chứng nhận production.

## Đã xử lý

| Phát hiện | Kết quả |
| --- | --- |
| `main` có 5 commit mới; `progress.md` xung đột với checkpoint của PR | Đồng bộ `origin/main` vào nhánh PR, giữ nguyên log release; chuyển riêng checkpoint trình bày sang [log tài liệu](log.md) để tránh lặp xung đột khi append release. |
| `GEMINI.md` chỉ cách swap `.next`, restart và xóa bản cũ thủ công | Thay hướng dẫn đó bằng canonical workflow, quyền operator và liên kết runbook. |
| `PROJECT.md` gọi kết quả Speaking cũ là E2E/typecheck 0 lỗi hiện tại | Gắn phạm vi handoff lịch sử, liên kết phân loại test và baseline hiện hành. |
| `TEST_READY.md` gọi test mô phỏng là E2E và PASS hiện tại | Ghi rõ contract/fixture dùng in-memory shims; số liệu PASS là snapshot lịch sử. |
| `TEST_INFRA.md` gọi handoff vắng trong repo là nguồn thẩm quyền | Đánh dấu tài liệu và nguồn tham chiếu lịch sử; trỏ tới phân loại test hiện hành. |

## Còn cần phân loại trước khi dọn

| Nhóm đang tracked | Bằng chứng / bước tiếp theo |
| --- | --- |
| 15 script trong `scratch/` | Có script migration, reset SRS và trigger cron; kiểm tra usages, đường dẫn và quyền sở hữu trước khi di chuyển hoặc bỏ tracking. |
| `tmp/EN-TEACHER-AUDIT-REPORT.md` | Còn tham chiếu tại `docs/grammar/EN-TEACHER-FINAL-SPOT.md` và `docs/grammar/EN-TEACHER-REAUDIT-REPORT.md`; sửa liên kết nếu chuyển chỗ. |
| 7 output ở root | `audit_output.json`, `build_error.txt`, `ped_audit_out.txt`, `short_fb_output.txt`, `ui_qa_output.txt`, `ui_qa_output2.txt`, `ui_qa_output_final.txt`; kiểm tra nội dung, nguồn sinh và giá trị lịch sử trước khi dọn. |
| LICENSE | Chưa có; chủ repo cần chọn điều khoản phù hợp với mã nguồn và tài liệu học. README đã công khai tình trạng này. |
| Kênh báo lỗ hổng riêng | Private vulnerability reporting đang tắt tại thời điểm quét; chưa có kênh riêng được xác nhận để viết `SECURITY.md`. |

`/scratch/` và `/tmp/` đã có trong `.gitignore`, nhưng quy tắc ignore không bỏ tracking file đã commit. Cách xử lý tiếp theo tuân theo [repository hygiene](../operations/repository-hygiene.md). Không tự xóa, untrack hoặc đổi vị trí các file chưa xác định usages.

## Kiểm tra trình bày

- About, tám topics và homepage `https://lingopro.online` khớp thông tin đã cập nhật qua GitHub API.
- Banner và ảnh homepage trên nhánh PR trả HTTP 200 với đúng MIME; ba badge công nghệ trả HTTP 200.
- Badge release trả HTTP 200 và phản ánh workflow của **main**, không xác nhận checks của PR.
- Link tương đối, đồng bộ Anh–Việt và cấu trúc YAML của hai issue form hợp lệ.
- Markdownlint của báo cáo và mục lục tài liệu đạt; typecheck sau đồng bộ `main` khớp đúng baseline 10 lỗi Speaking.
- Issue form mới chỉ dùng được từ default branch sau khi merge; ảnh và README mới hiện có trên nhánh PR.
- Log lint/typecheck của lần kiểm tra trước nằm tại [checkpoint trình bày](log.md); kết quả đó không được đổi thành tuyên bố toàn repo sạch lỗi.

PR vẫn ở trạng thái draft. Merge vào `main` tự kích hoạt production workflow và cần operator cho phép theo [AGENTS.md](../../AGENTS.md).
