> Áp dụng khi triển khai Vocab lên production. Mục đích: mô tả luồng hiện có trong `.github/workflows/deploy-server.yml`.

# Production deploy

Release Phân Hệ Khảo Thí & Luyện Thi VNU Test Bậc 3 (ULIS ĐHQGHN) ngày 15/10/2026: [canonical run 38682217908](https://github.com/FengProfessor/Vocab/actions/runs/38682217908) SUCCESS, SHA `a6968686fd59648a97ec750a98f108f97da6ebf2`; quality/migration/deploy PASS (SKIP13/applied0). Log deploy xác nhận checkout đúng SHA, service `lingopro.service` ổn định với PID 584731 và HTTP 200 (`/home/ubuntu/Vocab/.next-previous.zsoFfW/.next` được bảo toàn). 13 bộ đề 4 kỹ năng (325 Reading, 260 Listening, 26 Writing, 26 Speaking), 39 file MP3 vật lý có header chuẩn, 240 từ vựng B1 8 chủ đề, phòng thi Technical Minimalist header 40px và 100% câu hỏi + 3 đáp án A/B/C above-the-fold, Zero Bulk Leaks & HMAC On-Demand explain. Kiểm tra HTTPS độc lập: `/api/health`, `/vnu-bac-3`, `/vnu-bac-3/exam/ulis-sample-test-01`, `/audio/vnu-bac3/sample-01/listening-part1.mp3`, `/student` đều trả 200. Bằng chứng chi tiết ghi trong `progress.md`.

Release tinh gọn Desktop UI & Luyện thi chuẩn hóa Above-the-fold ngày 15/10/2026: [canonical run 38674871171](https://github.com/FengProfessor/Vocab/actions/runs/38674871171) SUCCESS, SHA `8f3d193fb855a790223e8c73979a356d7d124dbd`; quality/migration/deploy PASS. Log deploy xác nhận checkout đúng SHA, service `lingopro.service` ổn định với PID 581932 và HTTP 200 (`/home/ubuntu/Vocab/.next-previous.mJ5pqF/.next` được bảo toàn). Header máy tính tinh gọn py-2.5, nén 2 thẻ Hero CTA xuống ~78px, đưa 4 thẻ Luyện thi chuẩn hóa lên ngay dưới Hero CTA (100% above the fold trên desktop không cần cuộn chuột); giữ nguyên 100% layout mobile. Cập nhật secret Supabase credentials. Kiểm tra HTTPS độc lập: `/api/health`, `/student`, `/` đều trả 200. Bằng chứng chi tiết ghi trong `progress.md`.

Release tách biệt UI Máy tính & Điện thoại (Bản B Bento) ngày 14/10/2026: [canonical run 38587603469](https://github.com/FengProfessor/Vocab/actions/runs/38587603469) SUCCESS, SHA `21ea46452ca70fc462725920d3f222eb61be3b6f`; quality/migration/deploy PASS. Log deploy xác nhận checkout đúng SHA, service `lingopro.service` ổn định và HTTP 200. Tách rõ `if (isDesktop)` với Hero CTA chọn nhanh, lịch tháng ô cố định cân đối, Bento Kỹ năng & Luyện thi, khôi phục Kho từ vựng đầy đủ trên PC; giữ nguyên 100% bố cục mobile. Kiểm tra HTTPS độc lập: `/api/health` và `/student` đều trả 200. Bằng chứng chi tiết ghi trong `progress.md`.

Release tối ưu tốc độ, cache & sửa lỗi chớp `/auth` khi bấm Back ngày 14/10/2026: [canonical run 38435978706](https://github.com/FengProfessor/Vocab/actions/runs/38435978706) SUCCESS, SHA `49b0f33b6ddbd07ecf2dee056faae6ab680d60f8`; quality/migration/deploy PASS, SKIP13/applied0. Log deploy xác nhận checkout đúng SHA, service PID 506288 ổn định và HTTP 200 (`/home/ubuntu/Vocab/.next-previous.LsGETS/.next` được bảo toàn). Kiểm tra HTTPS độc lập: `/api/health`, `/`, `/student`, `/auth` đều trả 200. Bằng chứng chi tiết ghi trong `progress.md`.

Release giao diện Student Dashboard tối giản ngày 13/10/2026: [canonical run 38426725446](https://github.com/FengProfessor/Vocab/actions/runs/38426725446) SUCCESS, SHA `d62c237885b736bcaee6a7c3664d9620023f9933`; quality/migration/deploy PASS, SKIP13/applied0. Log deploy xác nhận checkout đúng SHA, service PID 502402 ổn định và HTTP 200. Đã loại bỏ danh sách từ và gói từ khỏi Dashboard, đưa Kỹ năng và Luyện thi lên liền kề mức độ nhớ. Kiểm tra HTTPS độc lập: health/root/student đều trả 200. Bằng chứng chi tiết ghi trong `progress.md`.


**Trạng thái:** Latest Phase3A canonical `36810782924` tại `52551271445322c3b07bcbb6b296d66cd97ec4ef` **VERIFIED**: quality/migration/activation/health PASS, staging HEAD/build/live markers match; service active/MainPID1300582 stable, local/public health/root200. Migration SKIP10/applied0. Phase3A auth error/CSRF/admin denial public GET probes PASS. Dedicated auth login/storage/logout/replay smoke remains previous verified cutover `36784213532`/`44ad7c92`; current anonymous probes do not claim new full authenticated journeys. Historical hardening `36786992699`/`c0abdb76` and baseline notes below do not replace current progress evidence. Không trigger workflow/SSH production nếu operator chưa ủy quyền rõ ràng.

## Trigger và commit

Workflow `deploy-server.yml` chạy khi push `main` hoặc `workflow_dispatch` chọn `main`. Job quality từ chối ref khác `refs/heads/main`, kiểm tra `${{ github.sha }}` là SHA 40 ký tự, checkout và đối chiếu HEAD. Workflow có `contents: read` và concurrency `production-deploy`, `cancel-in-progress: false`; không hủy lượt đang migration/activate. GitHub Actions chỉ giữ tối đa một lượt pending trong một concurrency group, nên một commit đang đợi có thể bị lượt mới thay thế.

## Quality gate

Trước khi chạm DB hoặc server, job `quality` chạy trên Ubuntu: `npm ci`, actionlint mọi workflow, Bash syntax các script deploy/test, `node --check` migration runner và test render SSH, các bộ test deploy, ESLint riêng health route, và `npm run build`; CSP/backup fixture tests và local production browser smoke là blocking gates trong PR followup. Test render tái tạo payload shell mà SSH action gửi sang host và chạy `bash -n`, nhằm phát hiện lỗi do action biến đổi script. Mỗi bước này blocking. Full `npm run typecheck` và `npm run lint` chạy với `continue-on-error: true` để báo nợ baseline, không được gọi là repo sạch. Baseline tại checkpoint: 10 lỗi Speaking TypeScript, full lint 122 errors/448 warnings tại clean a683048 (debt baseline, cần đo lại khi thay source); kiểm tra lại khi sửa các phần đó. `npm test` không có script.

## Migration và build production

Phase3A bổ sung blocking targeted auth tests/lint, real Next proxy HTTP và exact 10-diagnostic Speaking typecheck baseline guard (`tests/security/typecheck-baseline.txt`). Full lint/typecheck vẫn reporting debt; latest full lint116 errors/464 warnings, không phải clean repo. Targeted followup pack lint2 existing errors phải khớp exact fixture, không được thêm lỗi hay tắt rule. Actual latest quality Node22.23.3/npm10.9.9; migration reusable Node22.23.2/npm10.9.8. Các version này là observed evidence, không thay thế cấu hình runtime đang chọn trong workflow.

`migrate` cần `quality`; gọi reusable `apply-p0-migrations.yml` với secrets được kế thừa. `deploy` cần `migrate`. Lỗi migration chặn deploy. SSH chỉ chạy bootstrap tối thiểu: nhận event SHA qua action environment, kiểm tra SHA, fetch và detached checkout đúng SHA vào `$HOME/Vocab-build`, rồi gọi `deploy/run-deploy.sh` từ chính commit đó. Không dùng `script_stop` vì drone-ssh 1.7.3 chèn lệnh vào từng dòng và có thể phá cú pháp shell nhiều dòng. `run-deploy.sh` gọi `prepare-source.sh` để đối chiếu `git rev-parse HEAD` và từ chối source bẩn. Git lỗi hoặc SHA sai làm job FAIL, không fallback branch. Server chép env từ `$HOME/Vocab`, cập nhật CRON_SECRET, chạy `npm ci` và `npm run build`. SHA được ghi trong `.next/.release-commit`; activation xác nhận metadata khớp SHA trước khi đổi release. Live Git checkout không bị reset; runtime lấy bundle từ staging.

## Activation và thành công

`deploy/activate-release.sh` sao chép candidate, giữ `.next` và env trước đó trong `.next-previous.*`, dừng `lingopro.service`, thay bundle/env, restart bằng `sudo -n systemctl`. Readiness cần service active, MainPID dương và hai HTTP 200 liên tiếp của `http://127.0.0.1:3000/api/health` với cùng PID, tối đa 15 lần thử. Chỉ khi tất cả pass mới in thành công. Health route trả `{status:"ok"}`, `no-store`; đây là kiểm tra tiến trình HTTP, chưa chứng minh DB hoặc nghiệp vụ hoạt động.

## Khi lỗi

Quality lỗi: không migration. Migration lỗi: không SSH/deploy. Fetch/checkout/build lỗi: chưa activation. Activation/restart/health lỗi: script cố khôi phục bundle và env cũ, restart và kiểm tra health cũ; deploy vẫn FAIL. Rollback lỗi cần xử lý thủ công theo `rollback.md`. Không hủy lượt deploy đang chạy.

## Đường cũ

`deploy/update.sh`, `deploy/push-to-vps.ps1`, `deploy/bootstrap-vps.sh`, hướng dẫn webhook tự pull trong README và kế hoạch Hetzner/PM2 là **LEGACY / NON-CANONICAL**. Không dùng các lệnh đó để deploy production. Cần xác nhận ngoài repo rằng PC webhook, Vercel hay Docker daemon cũ đã tắt; code repo không chứng minh trạng thái host ngoài.

## Auth session cutover

Quality requires AUTH_SESSION_ENCRYPTION_KEY (64 hex) and both Upstash variables before migration. The canonical runner stages these values, checks format and preserves matching env during activation/rollback. Server-only encrypted sessions fail closed on missing config/outage. Dedicated browser smoke is required to close C02; HTTP health alone is insufficient.
