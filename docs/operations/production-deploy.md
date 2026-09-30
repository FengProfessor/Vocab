> Áp dụng khi triển khai Vocab lên production. Mục đích: mô tả luồng hiện có trong `.github/workflows/deploy-server.yml`.

# Production deploy

**Trạng thái:** Canonical flow VERIFIED qua run 36699466025 và independent host probes tại SHA 805cc56e65f75362d5310f351f44b9504d43a6c5 (2026-09-30). Không xác nhận các rollout độc lập chạy sau đó. Không trigger workflow/SSH production nếu operator chưa ủy quyền rõ ràng.

## Trigger và commit

Workflow `deploy-server.yml` chạy khi push `main` hoặc `workflow_dispatch` chọn `main`. Job quality từ chối ref khác `refs/heads/main`, kiểm tra `${{ github.sha }}` là SHA 40 ký tự, checkout và đối chiếu HEAD. Workflow có `contents: read` và concurrency `production-deploy`, `cancel-in-progress: false`; không hủy lượt đang migration/activate. GitHub Actions chỉ giữ tối đa một lượt pending trong một concurrency group, nên một commit đang đợi có thể bị lượt mới thay thế.

## Quality gate

Trước khi chạm DB hoặc server, job `quality` chạy trên Ubuntu: `npm ci`, actionlint mọi workflow, Bash syntax các script deploy/test, `node --check` migration runner và test render SSH, các bộ test deploy/security và isolated Redis Lua integration, ESLint riêng health route, và `npm run build`. Test render tái tạo payload shell mà SSH action gửi sang host và chạy `bash -n`, nhằm phát hiện lỗi do action biến đổi script. Mỗi bước này blocking. Full `npm run typecheck` và `npm run lint` chạy với `continue-on-error: true` để báo nợ baseline, không được gọi là repo sạch. Baseline tại checkpoint: 10 lỗi Speaking TypeScript, lint 110 errors/465 warnings (verified Phase 2B, bằng prior run 36691839537); kiểm tra lại khi sửa các phần đó. `npm test` không có script.

## Migration và build production

`migrate` cần `quality`; gọi reusable `apply-p0-migrations.yml` với secrets được kế thừa. `deploy` cần `migrate`. Lỗi migration chặn deploy. SSH chỉ chạy bootstrap tối thiểu: nhận event SHA qua action environment, kiểm tra SHA, fetch và detached checkout đúng SHA vào `$HOME/Vocab-build`, rồi gọi `deploy/run-deploy.sh` từ chính commit đó. Không dùng `script_stop` vì drone-ssh 1.7.3 chèn lệnh vào từng dòng và có thể phá cú pháp shell nhiều dòng. `run-deploy.sh` gọi `prepare-source.sh` để đối chiếu `git rev-parse HEAD` và từ chối source bẩn. Git lỗi hoặc SHA sai làm job FAIL, không fallback branch. Server chép env từ `$HOME/Vocab`, cập nhật CRON_SECRET, chạy `npm ci` và `npm run build`. SHA được ghi trong `.next/.release-commit`; activation xác nhận metadata khớp SHA trước khi đổi release. Live Git checkout không bị reset; runtime lấy bundle từ staging.

## Phase 2B config

Runner chuyển BILLING_WEBHOOK_SECRET và UPSTASH_REDIS_REST_URL/TOKEN vào staging; bỏ alias WEBHOOK_SECRET trước canonical activation. Absent optional transport giữ copied dedicated/Redis settings; billing thiếu config reject, limiter thiếu/lỗi config HTTP 503 không fallback RAM. Billing phải khác CRON_SECRET; Upstash cần pair URL/token hợp lệ. Không in giá trị hoặc ghi env live ngoài activation. Rollback bundle/env giữ flow hiện hữu.

## Activation và thành công

`deploy/activate-release.sh` sao chép candidate, giữ `.next` và env trước đó trong `.next-previous.*`, dừng `lingopro.service`, thay bundle/env, restart bằng `sudo -n systemctl`. Readiness cần service active, MainPID dương và hai HTTP 200 liên tiếp của `http://127.0.0.1:3000/api/health` với cùng PID, tối đa 15 lần thử. Chỉ khi tất cả pass mới in thành công. Health route trả `{status:"ok"}`, `no-store`; đây là kiểm tra tiến trình HTTP, chưa chứng minh DB hoặc nghiệp vụ hoạt động.

## Khi lỗi

Quality lỗi: không migration. Migration lỗi: không SSH/deploy. Fetch/checkout/build lỗi: chưa activation. Activation/restart/health lỗi: script cố khôi phục bundle và env cũ, restart và kiểm tra health cũ; deploy vẫn FAIL. Rollback lỗi cần xử lý thủ công theo `rollback.md`. Không hủy lượt deploy đang chạy.

## Đường cũ

`deploy/update.sh`, `deploy/push-to-vps.ps1`, `deploy/bootstrap-vps.sh`, hướng dẫn webhook tự pull trong README và kế hoạch Hetzner/PM2 là **LEGACY / NON-CANONICAL**. Không dùng các lệnh đó để deploy production. Cần xác nhận ngoài repo rằng PC webhook, Vercel hay Docker daemon cũ đã tắt; code repo không chứng minh trạng thái host ngoài.
