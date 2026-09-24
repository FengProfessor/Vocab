> Áp dụng khi tiếp tục sửa P0 trong repository Vocab. Mục đích: ghi trạng thái kiểm chứng ngắn gọn.

# Tiến độ P0

## P0-1 — Migration workflow (2026-09-24)

- Checkout riêng từ `https://github.com/FengProfessor/Vocab.git`, nhánh `main`, commit gốc `29585fb7b55a28bb303dbf3885145087b50a4fb8`.
- Đã xác nhận `jobs.apply.if` dùng `secrets` ở scope không hợp lệ; workflow migration và deploy chạy độc lập trên push.
- Đã chuyển migration thành reusable workflow; deploy dùng `needs: migrate`. Thiếu credential hoặc migration lỗi sẽ chặn deploy.
- Runner lưu filename/checksum trong schema riêng, dùng transaction lock, bỏ qua migration đã áp; referral policies có `DROP POLICY IF EXISTS` để lần chạy đầu có thể áp lại.
- PASS: `actionlint` trên mọi workflow, `node --check`, parser PostgreSQL cho 8 file SQL, `git diff --check`, `npm ci`.
- `npm run typecheck` FAIL ở tests Speaking do thiếu ba module crawler và các lỗi implicit-any có sẵn tại commit gốc.
- `npm run lint` FAIL với 102 errors, 467 warnings trong `src` có sẵn tại commit gốc.
- `npm test` không có script. Chưa chạy migration với database production; cần kiểm tra trạng thái thực tế khi có môi trường DB được ủy quyền.
- `npm run build` PASS (Next.js 16.2.9); có cảnh báo NFT trace và Firebase Admin thiếu env trong checkout sạch.
- Tại checkpoint P0-1, P0-2 đến P0-5 chưa sửa; các mục sau cập nhật trạng thái P0-2/P0-3.

## P0-2 — Restart failure handling

- Xác nhận: deploy dùng `systemctl || pm2 || echo`, sau đó in success; `script_stop` không cứu được lỗi đã bị `echo` nuốt. Workflow nhắm `lingopro.service`; Docker/PM2 có cấu hình lịch sử nhưng runtime production chưa quan sát trực tiếp.
- Files: `.github/workflows/deploy-server.yml`, `deploy/activate-release.sh`, `tests/deploy/activate-release.test.sh`.
- Trước: restart thất bại vẫn có thể báo thành công. Sau: chỉ dùng `sudo -n systemctl` cho service đã khai báo; restart, trạng thái process hoặc HTTP readiness lỗi đều trả non-zero cho job.
- Verify: mock stop/restart/process chết/HTTP lỗi PASS; Bash syntax và `actionlint` PASS.
- Status: FIXED trong mã nguồn; chưa xác minh trên server production.

## P0-3 — Health check + rollback

- Trước: `.next` hiện tại chuyển thành `.next.old`, rồi `.next.old` bị xóa trước restart; không có health check hay rollback.
- Sau: copy candidate sang thư mục tạm; giữ `.next` và env cũ trong `.next-previous.*`; stop service, kích hoạt candidate, restart, chờ 2 HTTP 200 với cùng MainPID qua tối đa 15 lần thử. Khi lỗi, dừng candidate, khôi phục `.next` và env cũ, restart và health-check release cũ. Job vẫn FAIL kể cả rollback thành công; rollback thất bại được báo riêng.
- Health: `src/app/api/health/route.ts` trả JSON `{status:'ok'}` và `Cache-Control: no-store`; không gọi database hay API bên ngoài.
- Files: `deploy/activate-release.sh`, `src/app/api/health/route.ts`, `tests/deploy/activate-release.test.sh`, `.github/workflows/deploy-server.yml`.
- Verify: 7 ca mock PASS; `npm run build` PASS; localhost Next và standalone trả HTTP 200 + `no-store`; `npx eslint src/app/api/health/route.ts` PASS.
- Status: FIXED trong mã nguồn; chưa xác minh trên server production.

## Giới hạn tại checkpoint P0-3 (lịch sử)

- Tại thời điểm checkpoint P0-3, P0-4 và P0-5 chưa sửa. Chưa deploy production, chưa restart service production, chưa chạm database production, chưa xác minh runtime production thật.
- Tại thời điểm checkpoint P0-3, repo vẫn chạy `git fetch/reset` với lỗi bị nuốt trước activation; `.next-previous.*` được giữ để rollback nên cần policy dọn dung lượng về sau.
- Files changed lượt này: `.github/workflows/deploy-server.yml`, `deploy/activate-release.sh`, `src/app/api/health/route.ts`, `tests/deploy/activate-release.test.sh`, `progress.md`.
- Commands: `git diff --check` PASS; `actionlint` toàn workflow PASS; `bash -n` PASS; `sh -n` với script SSH PASS; `bash tests/deploy/activate-release.test.sh` PASS; `npx eslint src/app/api/health/route.ts` PASS; `npm run build` PASS; localhost health endpoint PASS.
- `npm run typecheck` FAIL với đúng 10 lỗi baseline tại hai test Speaking (thiếu ba crawler modules, implicit-any); không có lỗi từ health route. `npm run lint` toàn repo NOT RUN lượt này; P0-1 đã ghi baseline 102 lỗi, 467 cảnh báo. Production deploy/restart/database checks NOT RUN theo yêu cầu.

## P0-4 — Exact commit deployment (2026-09-24)

- Issue/evidence: workflow cũ chạy cả `codex/grammar-research` nhưng fetch/reset `origin/main`; Git lỗi bị `|| echo`/`|| true` nuốt, nên commit được deploy có thể khác event SHA.
- Sau: chỉ push/dispatch `main`; event `${{ github.sha }}` truyền vào SSH dưới dạng `EXPECTED_SHA`. Bootstrap fetch và detached checkout đúng SHA; `deploy/prepare-source.sh` fetch, checkout, đối chiếu `git rev-parse HEAD`, từ chối dirty source. Không có fallback main. Build staging bằng `npm ci` + `npm run build`, ghi `.next/.release-commit`; activation đối chiếu metadata trước swap. Live Git không còn reset.
- SHA path: GitHub event → quality checkout/HEAD check → reusable migration cùng event → server EXPECTED_SHA → Git fetch/detach/HEAD check → `.next/.release-commit` → activation.
- Verify: 6 ca `prepare-source` PASS (exact, mismatch, missing, fetch fail, checkout fail, dirty); 8 ca activation PASS gồm metadata mismatch. `actionlint`, Bash/SSH syntax PASS.
- Status: **PARTIALLY FIXED** end-to-end; workflow/script trong repo đã sửa và test, nhưng **chưa kiểm chứng production**. Webhook PC ngoài repo có còn hoạt động không vẫn chưa biết.

## P0-5 — Production quality gate

- Blocking: main/SHA/checkout check, `npm ci`, actionlint, Bash và Node syntax, 2 bộ deploy tests, ESLint health route, `npm run build`.
- Reporting only: full `npm run typecheck`, `npm run lint` với `continue-on-error`; không gọi repo CI clean. Baseline TypeScript xác nhận vẫn đúng 10 lỗi TS2307/TS7006 ở 2 Speaking tests; full lint local lượt này NOT RUN, baseline cũ 102 errors/467 warnings.
- Graph: `quality → migrate (workflow_call) → deploy exact SHA → activation`; migration không còn manual dispatch riêng. `concurrency: production-deploy`, `cancel-in-progress: false`, `contents: read`.
- Bypass audit: trong `.github/workflows/` chỉ `deploy-server.yml` có SSH production; `db-backup`, mobile, cron không deploy. Repo còn `deploy/update.sh`, `push-to-vps.ps1`, `bootstrap-vps.sh` và lời nhắc webhook PC cũ, đã đánh dấu legacy nhưng trạng thái dịch vụ/webhook ngoài repo chưa xác minh.
- Verify: local build PASS; actionlint PASS; script syntax PASS; 14 deploy tests PASS; targeted ESLint PASS; PostgreSQL parser PASS 8 SQL files; `git diff --check` PASS; changed-file secret signature scan PASS. Local typecheck FAIL đúng baseline. Full lint local NOT RUN.
- Status: workflow gate FIXED; end-to-end P0-5 **PARTIALLY FIXED** do chưa chứng minh webhook/đường legacy ngoài repo đã vô hiệu.

## P0-DOC — Agent/operations handoff

- Thêm root `AGENTS.md` với startup, source precedence, canonical flow, NEVER và quy tắc không claim production verification.
- Thêm `docs/operations/production-deploy.md`, `database-migrations.md`, `rollback.md` theo workflow/script hiện có. README và kế hoạch Hetzner trỏ về runbook; script deploy cũ có nhãn legacy.
- `progress.md` tiếp tục là checkpoint, không phải hướng dẫn triển khai. Production deploy/restart/migration/DB: NOT RUN theo yêu cầu.
- Status: FIXED ở tài liệu repo; cần đối chiếu runtime production thực tế trước khi coi hạ tầng end-to-end verified.

## P0-CLOSEOUT — Production/runtime verification (2026-09-24)

### Git state

- branch: `codex/fix-migration-workflow`
- commit: P0 implementation `2c234877c3cdb3bf2355fb98bd962caca6afe18b` (local). Bản checkpoint này sẽ nằm trong commit tài liệu kế tiếp.
- remote SHA: `origin/main` được `git ls-remote` xác nhận là `29585fb7b55a28bb303dbf3885145087b50a4fb8`; branch P0 chưa có trên remote tại thời điểm kiểm tra. Chưa push vì operator chưa cho phép.

### GitHub validation

- quality: NOT RUN trên GitHub; local actionlint, Bash/SSH syntax, 14 deploy tests, targeted ESLint và `npm run build` PASS.
- migration: NOT RUN trên GitHub/production.
- deploy: NOT RUN trên GitHub/production.
- concurrency: cấu hình trong workflow đã review; hành vi thực tế NOT YET VERIFIED.
- `npm run typecheck` local FAIL đúng 10 lỗi Speaking TS2307/TS7006 đã biết. Full lint local lượt closeout NOT RUN.

### Production runtime

- service: `lingopro.service` theo workflow; host/unit thực tế NOT YET VERIFIED.
- deployment path: workflow dùng `$HOME/Vocab-build` và `$HOME/Vocab`; path thực tế NOT YET VERIFIED.
- release SHA: NOT YET VERIFIED.
- health: local build/route PASS; endpoint production NOT YET VERIFIED.
- disk/retention: `.next-previous.*` không có cleanup tự động trong repo; dung lượng production NOT YET VERIFIED.

### Legacy deploy audit

- webhook: UNKNOWN; README cũ từng mô tả deploy tự pull, chưa audit host.
- PM2: UNKNOWN; script cũ từng dùng fallback, chưa audit host.
- cron/timers: UNKNOWN ngoài repo.
- old scripts: tồn tại trong repo và gắn nhãn legacy; bản copy/caller trên host UNKNOWN.
- other controllers: UNKNOWN ngoài repo.

### Result

- P0-4: PARTIALLY FIXED.
- P0-5: PARTIALLY FIXED.
- `PRODUCTION RUNTIME VERIFICATION PENDING AUTHORIZATION`.

### Remaining risks

- Build quality trên GitHub chạy trước migration, nhưng server rebuild sau migration; khác biệt môi trường có thể làm build server fail sau khi DB đã thay đổi. Giải pháp build artifact immutable ở CI để dành cho cải thiện sau P0.
- Chưa chứng minh webhook/PM2/automation ngoài repo không thể deploy độc lập. Không thể đóng P0-4/P0-5 đến khi được phép audit runtime và xác minh GitHub workflow thật.
- Rollback folders có thể tích lũy; không xóa khi chưa xác minh bản rollback tốt và dung lượng host.

## P0-CLOSEOUT — Remote push and read-only runtime audit (2026-09-24)

### Remote branch

- local SHA: `b94796fd31ab37289d0536fc18f6100ced79f6c3` trên `codex/fix-migration-workflow`; working tree sạch trước audit.
- remote SHA: branch `codex/fix-migration-workflow` chưa tồn tại sau lần push bị từ chối; `origin/main` vẫn là `29585fb7b55a28bb303dbf3885145087b50a4fb8`.
- push result: **FAIL**. GitHub từ chối OAuth App cập nhật `.github/workflows/apply-p0-migrations.yml` vì token không có scope `workflow`. Không retry bằng credential khác, không force push, không merge.

### Canonical runtime

- host: Tailscale peer `lingo-sever`, Ubuntu 24.04.4 LTS, user audit `ubuntu`. Chỉ chạy lệnh read-only.
- `lingopro.service`: loaded, active/running, enabled, MainPID `875781`, `Restart=always`.
- WorkingDirectory: `/home/ubuntu/Vocab`.
- ExecStart: `/usr/bin/node /home/ubuntu/Vocab/.next/standalone/server.js` (chỉ ghi executable/script path).
- EnvironmentFiles path: `/home/ubuntu/Vocab/.env.local`; không đọc nội dung.
- app path: `/home/ubuntu/Vocab` và `/home/ubuntu/Vocab-build` đều tồn tại. Live Git branch `main`, HEAD `da6e196b964a3b05dacd0fec003b28e9208461a0`, có untracked `test-fcm.js`. Build Git branch `main`, HEAD `29585fb7b55a28bb303dbf3885145087b50a4fb8`, tracked `package-lock.json` sửa và untracked `test-fcm.js`.
- release SHA: `.next/.release-commit` không có ở live hoặc staging; **ACTIVE RELEASE SHA UNKNOWN**, không thể so bằng chứng với Git HEAD. Live standalone server tồn tại. Helper/activation script P0 chưa có trên staging.
- health: GET `http://127.0.0.1:3000/api/health` trả HTTP `404`, `text/html`, `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`; không có JSON `{status:"ok"}`. Đây là release cũ, chưa rollout P0.
- disk: `/` còn khoảng `89G`/`124G`; chưa có `.next-previous.*` ở live. Không xóa gì.
- preflight blocker: `prepare-source.sh` mới từ chối staging có untracked `test-fcm.js`; tracked `package-lock.json` sẽ được force checkout về commit nhưng file untracked vẫn tồn tại. Cần operator quyết định xử lý trước rollout; không tự dọn.

### Legacy controllers

- webhook: **LEGACY ACTIVE (cấu hình)**. GitHub repo có một push webhook active tới host `lingopro.online`; 10 delivery gần nhất (21–23/09) đều HTTP `404`. Không tìm thấy process/unit listener deploy tương ứng trong audit giới hạn; khả năng deploy hiện tại **UNKNOWN**. Không tắt webhook.
- PM2: daemon `PM2 v7.0.4` đang chạy dưới `ubuntu`, nhưng dump/process con chỉ có `bot-trudo` ở `/home/ubuntu/bot-trudo`; không thấy Vocab qua PM2. Không có PM2 systemd unit trong đường đã kiểm tra. Phân loại cho Vocab: **LEGACY INACTIVE** trong phạm vi quan sát; PM2 đang active cho ứng dụng khác.
- cron: crontab `ubuntu` có một `curl` tới `/api/cron/push-due` mỗi 15 phút, không có lệnh deploy. System cron files không match mẫu deploy; root crontab không đọc được bằng quyền hiện có, nên tổng thể **UNKNOWN**.
- systemd timers: không thấy timer deploy; chỉ timer hệ thống/Cloudflared thông thường, **NOT PRESENT** cho deploy trong danh sách đã kiểm tra.
- legacy scripts: `deploy/update.sh` có bản copy ở live và staging; không thấy caller trong user cron/systemd đã kiểm tra. **LEGACY INACTIVE** theo bằng chứng hiện có; root cron/automation ngoài phạm vi vẫn unknown.
- other controllers: không thấy Docker CLI, Watchtower, self-hosted GitHub runner, Supervisor hoặc forever trong process/path đã kiểm tra. Cloudflared/Tailscale đang active như mạng, không có bằng chứng tự deploy. Một số listening ports không gắn được PID bằng quyền `ubuntu`, nên controller ngoài phạm vi vẫn **UNKNOWN**.

### P0-4 assessment

- **PARTIALLY FIXED**. Code exact SHA đã commit local nhưng push bị từ chối; active release không có SHA metadata, webhook push legacy vẫn active ở GitHub, staging hiện có untracked file chặn helper. Chưa có production rollout/verification.

### P0-5 assessment

- **PARTIALLY FIXED**. Quality → migration → deploy mới chưa lên GitHub/chưa chạy thật; không thể chứng minh active webhook hoặc automation ngoài repo không bypass gate. Không trigger production deploy.

### Required operator actions

1. Cấp credential có scope GitHub `workflow` phù hợp hoặc tự push branch P0 qua quy trình được phép; sau đó xác nhận remote SHA. Không thay branch protection.
2. Review push webhook legacy còn active nhưng đang trả 404; phê duyệt riêng nếu muốn disable/chuyển thành notification.
3. Quyết định xử lý `test-fcm.js` untracked ở staging trước rollout; không tự xóa/move. Xác minh thêm root cron/ports chưa phân loại nếu cần khép kín audit controller.
4. Phê duyệt riêng cho merge, migration, deploy hoặc bất kỳ thay đổi production nào. Lượt này không thực hiện các hành động đó.

## P0-PREP — Canonical rollout preparation (2026-09-24)

### Remote branch

- local SHA: checkpoint audit đang chờ commit riêng; P0 implementation và checkpoint trước ở `b94796fd31ab37289d0536fc18f6100ced79f6c3`.
- remote SHA: branch `codex/fix-migration-workflow` chưa có trên `origin` theo lần kiểm tra gần nhất.
- push: **BLOCKED**. `gh auth status` vẫn chỉ có scopes `gist`, `read:org`, `repo`; thiếu `workflow`. Không retry, không bỏ workflow files, không force push.

### Staging cleanliness

- `test-fcm.js` classification: **UNKNOWN**; file untracked được phát hiện ở staging trong audit trước, chưa điều tra nội dung/caller lượt này vì Phase A bị chặn.
- action: NONE; chưa move/delete/reset.
- final git status trên staging: chưa kiểm tra lại lượt này; audit trước thấy `package-lock.json` modified và `test-fcm.js` untracked.

### Legacy webhook

- purpose: **UNKNOWN**; audit trước xác nhận một GitHub push webhook tới `lingopro.online`.
- previous status: active, 10 delivery gần nhất trả 404.
- final status: chưa kiểm tra lại hoặc disable lượt này do Phase A dừng ở auth.

### Controller audit

- root cron: UNKNOWN (quyền audit trước không đọc được).
- systemd: audit trước thấy `lingopro.service` active; không thấy timer deploy.
- PM2: audit trước chỉ thấy `bot-trudo`, không thấy Vocab.
- other: một số listener chưa gắn được PID; chưa audit thêm lượt này.

### Rollout readiness

- **NOT READY**.
- Reasons: branch P0 chưa lên remote; credential thiếu scope `workflow`; staging còn blocker chưa phân loại/xử lý; webhook legacy còn active theo audit trước; root cron/listener chưa khép kín. Không merge/deploy/migrate.
