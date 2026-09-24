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

## P0-PREP — Authorized branch push and read-only follow-up (2026-09-24)

### Push

- `gh auth status` đã có scope `workflow`; trước push working tree sạch, branch `codex/fix-migration-workflow`, HEAD `c9c10c7e6d4a4d498bcc2e4fe344849ecf5b655b` gồm các commit P0/checkpoint.
- `deploy-server.yml` chỉ auto-trigger trên push `main`; push branch P0 không trigger production deploy. `git push origin refs/heads/codex/fix-migration-workflow:refs/heads/codex/fix-migration-workflow` PASS.
- `git ls-remote origin refs/heads/codex/fix-migration-workflow` trả đúng `c9c10c7e6d4a4d498bcc2e4fe344849ecf5b655b`, khớp local HEAD. `gh run list --branch` trả `[]`: không thấy Actions tự chạy trên branch. Không dispatch, merge hoặc deploy production.

### Staging blocker

- `/home/ubuntu/Vocab-build` hiện ` M package-lock.json` và `?? test-fcm.js`.
- `test-fcm.js`: `ubuntu:ubuntu`, mode `664`, 1395 bytes, mtime 07/09/2026; không tracked hiện tại và không có commit trong Git history đã kiểm tra. Nội dung là script thử FCM dùng tên biến env Supabase/Firebase, gọi Firebase messaging send; không phát hiện literal private key/token theo mẫu quét. Không in giá trị env.
- Không thấy reference tới file trong repo script/config, systemd, user cron hoặc active Node process đã kiểm tra. Phân loại **TEMP DEBUG** theo bằng chứng hiện có; root cron không đọc được nên không tuyên bố phủ định tuyệt đối. Action: NONE, chưa move/delete. Helper exact-SHA sẽ fail-closed vì file untracked vẫn ở staging; `git checkout --force` chỉ phục hồi tracked `package-lock.json`, không dọn file này.

### Legacy webhook

- GitHub hook `661520620`: **ACTIVE**, event `push`, target path `/api/deploy` trên `lingopro.online` (URL có query; không ghi/query secret), tạo/cập nhật 05/08/2026. Delivery từ push branch P0 ngày 24/09/2026 trả HTTP 404; 10 delivery trước cũng 404.
- Không có route `/api/deploy` trong source live/staging đã kiểm tra. README cũ mô tả webhook tự pull/deploy; không có bằng chứng hook phục vụ notification khác. Phân loại **LEGACY ACTIVE (configured, endpoint đang 404)**; khả năng deploy hiện tại chưa chứng minh. Action: NONE, không disable/delete.

### Root automation / other controllers

- `sudo -n -l` chỉ cho restart/status một số systemd service; không cho đọc root crontab hoặc owner các listener bằng sudo. Root crontab **UNKNOWN**.
- `/etc/crontab`, `/etc/cron.d` và unit files đọc được không match mẫu `git pull/fetch`, build, `update.sh`, webhook deploy; không thấy systemd timer/service deploy khác ngoài `lingopro.service`. User cron không reference `test-fcm.js` hay lệnh deploy.
- PM2 audit trước: daemon active cho `bot-trudo`, không thấy Vocab. Một số listening ports chưa gắn được PID với quyền hiện tại; controller ở đó vẫn **UNKNOWN**.

### P0 rollout readiness

- **NOT READY**: remote branch/commit đã đúng và workflow files đã lên remote, nhưng staging còn untracked debug file làm helper fail, webhook legacy còn active, root cron/listener chưa phân loại hết. Chưa có GitHub quality/migration/deploy run trên code P0 và production vẫn chạy release cũ.
- Cần operator phê duyệt riêng nếu muốn move `test-fcm.js`, disable webhook, cấp quyền đọc root automation bổ sung, merge/deploy/migration. Lượt này không thay đổi production.

## P0-PREP FINAL — Staging blocker and legacy webhook (2026-09-24)

### Staging

- Previous: `/home/ubuntu/Vocab-build` có ` M package-lock.json` và `?? test-fcm.js`. File debug thuộc `ubuntu:ubuntu`, mode `664`, 1395 bytes, mtime 07/09/2026; không có caller rõ ràng trong audit đã thực hiện.
- Action: operator cho phép **MOVE** `test-fcm.js`; đã move, không delete/execute, không sửa source hay reset `package-lock.json`.
- Archive path: `/home/ubuntu/legacy-debug/test-fcm.js` ngoài hai repo; metadata owner/mode/size/mtime giữ nguyên, archive tồn tại và original path không còn.
- Final git status: chỉ ` M package-lock.json`; không có untracked file. `git checkout --detach --force` trong canonical workflow sẽ ghi đè tracked modification khi rollout; chưa chạy lệnh đó trên host.
- Classification: **TEMP DEBUG** theo nội dung và audit caller trước đó.

### Webhook

- Previous: hook GitHub `661520620`, active, event `push`, target `/api/deploy` trên `lingopro.online` (query không ghi), delivery gần nhất HTTP 404.
- Action: operator cho phép **DISABLE**; PATCH chỉ `active=false`, không delete hoặc test delivery.
- Final status: GET độc lập xác nhận hook `661520620` **inactive**, event vẫn `push`, host/path không đổi.

### Known controller state

- Canonical service: `lingopro.service` active theo audit trước; không restart/deploy lượt này.
- PM2: đang phục vụ `bot-trudo`, không thấy Vocab.
- cron: user cron không có deploy; root crontab chưa đọc được theo quyền hiện có.
- timers: không thấy timer deploy trong danh sách đã kiểm tra.
- unknown audit areas: owner một số listener và root cron vẫn UNKNOWN; không có bằng chứng controller Vocab khác đang active trong phạm vi audit hiện có.

### Rollout readiness

- **READY WITH DOCUMENTED AUDIT LIMITATION**: branch remote khớp P0 SHA `c9c10c7e6d4a4d498bcc2e4fe344849ecf5b655b` trước checkpoint này, staging không còn untracked blocker, webhook legacy đã disabled, không phát hiện controller deploy Vocab khác đang active.
- Giới hạn: root cron/listener chưa quan sát đủ; `package-lock.json` tracked vẫn modified đến khi canonical checkout; quality/migration/deploy production chưa chạy; build server diễn ra sau migration. Cần phê duyệt riêng để merge/rollout P0.

## P0-ROLLOUT — Preflight stopped on backup health (2026-09-24)

### Merge

- Reviewed P0 branch SHA: `312c6a3fe1db20a785fb3f461b79c3e30af47c3f`.
- `origin/main` before rollout: `29585fb7b55a28bb303dbf3885145087b50a4fb8`.
- Merge-base is the same `origin/main` SHA; main has 0 commits unique to it and P0 has 4 commits unique to it. No main advancement or overlapping new main changes.
- Result: **NOT MERGED**. `ROLLOUT_SHA`: none. GitHub PR/merge, production workflow and migration not triggered.

### Quality and migration

- Required local/CI quality checks were not run in this rollout attempt because backup precheck stopped the rollout before merge. Earlier P0 local tests remain historical evidence only.
- Migration SQL was not executed. Final SQL safety review and production migration status remain pending.

### Backup precheck — STOP reason

- Current mechanism: `.github/workflows/db-backup.yml` runs nightly PostgreSQL dump, verifies nonempty SQL and gzip integrity, uploads a 30-day GitHub artifact, then archives to Google Drive.
- 10 most recent workflow runs (14–23 September 2026 UTC) all have overall conclusion `failure`.
- Latest run `35926321842` (23 September 2026 UTC): dump/verification and GitHub artifact upload steps succeeded, Google Drive archival step failed, overall run failed.
- Latest artifact `lingopro-backup-20260923_220540` (ID `10779865508`, about 19.8 MB) is listed nonexpired in GitHub, expiring 23 October 2026. This supports a recent GitHub copy, but the backup workflow's permanent-copy path is unhealthy; artifact download/restore was not tested here.
- Per rollout stop rule for clearly unhealthy backup status: **STOP before merge/migration**. Do not treat the partial backup success as a healthy end-to-end backup system.

### Deployment and runtime

- Deployment, activation, service restart, production health, public smoke: **NOT RUN**.
- Rollback: **NOT TRIGGERED**.
- Webhook `661520620` was disabled before this attempt; no new rollout event was emitted.

### P0 status and audit limits

- P0-1, P0-2, P0-3: fixed in source and locally verified; production verification pending.
- P0-4, P0-5: partially fixed; GitHub/production end-to-end verification pending.
- P0-DOC: fixed in repository; this entry records the failed preflight.
- Root cron and ownership of some listeners remain audit limitations.
- Residual architectural risk remains: server rebuild happens after migration. Future work: CI build once, immutable artifact, migration, deploy exact prebuilt artifact. No redesign in this attempt.

## P0-BACKUP — Restore verification and backup repair (2026-09-24)

### Backup inspected

- Workflow: `.github/workflows/db-backup.yml`. `pg_dump --no-owner --no-privileges` writes **plain SQL**, gzip compresses it, validates nonempty content and `gunzip -t`, uploads a 30-day GitHub artifact, then uploads to Google Drive. The Drive action uses base64 service-account credentials and a folder ID from GitHub secrets; values were not read or printed.
- Source run: `35926321842` (23 September 2026 UTC). Artifact: `lingopro-backup-20260923_220540`, ID `10779865508`, created `2026-09-23T22:07:03Z`, expires `2026-10-23T22:07:02Z`.

### Artifact integrity

- Download: PASS. Extracted file `lingopro_backup_20260923_220540.sql.gz`, 19,770,335 bytes; SHA-256 `13fa0f546f543ad813c4dac4e8cc371b2dd432011350aea9a80e9ee1299374cd`.
- Gzip decompression: PASS; uncompressed SQL 97,301,602 bytes. Header reports PostgreSQL database dump from server 17.6, pg_dump 17.11. Structural scan found SQL metadata, 81 `CREATE TABLE` and 83 `COPY` statements. No customer rows or dump contents printed.

### Restore test

- Environment: GitHub hosted runner, disposable `supabase/postgres:17.6.1.175` container; no connection to production app or DB. Container server version was not captured.
- Result: **NOT RESTORE VERIFIED**. Manual restore-only workflow runs `35997795653`, `35998017473`, `35998253237`, `35998476794`, `35998677868`, `35998964133` all failed. The SQL was accepted far enough to encounter `pg_cron` constraint (`P0001`) in a new database, then a preinitialized-schema collision (`42P06`) when restoring into `postgres`. Suppressing image init scripts caused the disposable container to exit before PostgreSQL readiness. No successful full restore or post-restore schema query.
- These failures show the test environment is not yet suitable; they do not prove the downloaded dump is corrupt or restorable. The temporary restore job/script was removed from the final branch after the unsuccessful diagnostic attempts.

### Google Drive

- Failure cause: logs of source run and two earlier runs show unsupported action input `uploadFrom`, followed by `missing input 'filename'`. The action manifest at commit `935eccf4c2812e4d492c3d7c7ff59ca7520bf129` requires `filename`.
- Fix on P0 branch: change only the input to `filename` and pin the third-party action to that reviewed commit SHA. No secret changes.
- Verification: `actionlint` on all workflows and `git diff --check` PASS. No fresh backup run was triggered after restore test failed. Google Drive upload remains **UNVERIFIED/FAILED on main** until the fix runs through the canonical backup workflow. Backup workflow was not made reporting-only.

### Backup state

- Creation: **PASS** in run `35926321842`.
- GitHub copy: **PASS**, artifact nonexpired and downloadable.
- Secondary copy: **FAIL** in that run; branch fix unverified.
- Restoreability: **NOT VERIFIED**; isolated restore test failed.

### Rollout readiness

- **BACKUP NOT READY**. No merge `main`, production migration, deploy or restart in this task. P0 rollout must not resume automatically.

### Remaining risks

- Existing GitHub artifacts expire after 30 days; current main backup workflow still uses the bad input until a separately authorized main update occurs.
- A matching disposable Supabase PostgreSQL restore environment, including required extensions/roles and clean schema, is needed to validate a backup end to end. Only after restore verification should a new canonical backup run test the Drive fix.
