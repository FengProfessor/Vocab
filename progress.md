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

## P0-BACKUP2 — Supabase-aware restore verification (2026-09-25)

### Source backup

- Method: **CURRENT BACKUP FORMAT: RAW LOGICAL PG_DUMP**. Exact credential-free command shape: `docker run --rm postgres:17-alpine pg_dump --no-owner --no-privileges -U "$PG_USER" "$PG_URL"`; output is plain SQL compressed with gzip. It is not `supabase db dump`.
- PostgreSQL source version: `17.6`, inferred from the dump header; dump client version `17.11`. A direct production `select version()` was not run because this task used the existing read-only backup path and did not expose DB credentials.
- Original artifact: `lingopro-backup-20260923_220540`, run `35926321842`, ID `10779865508`, SHA-256 `13fa0f546f543ad813c4dac4e8cc371b2dd432011350aea9a80e9ee1299374cd`.

### Restore environment

- Type: isolated GitHub-hosted Docker container using `supabase/postgres:17.6.1.175`; server PostgreSQL `17.6`. No production application connection or credentials were provided to the restore job.
- Safety: Docker network `none`; `cron.launch_active_jobs=off`; `pg_cron` moved from bootstrap database to the clean restore database before loading SQL. No restored cron/webhook could reach an external endpoint.
- Supabase bootstrap supplied required reserved roles. Restore target was a new `restore_test` database with no preexisting `auth`, `storage`, `extensions`, `cron`, `graphql`, `graphql_public`, `realtime`, or `vault` schema.
- Extensions represented in the dump: `pg_cron`, `pg_stat_statements`, `pgcrypto`, `supabase_vault`, `uuid-ossp`.

### Restore result

- Existing artifact restore run `36113337536`: **PASS / RESTORE VERIFIED**.
- New artifact restore run `36113855566`: **PASS / RESTORE VERIFIED** on the same isolated process. Artifact `lingopro-backup-20260925_083237`, ID `10853968048`, SHA-256 `9c63fc6a4e6454a611963bd971a00e73d0584727e12acb42cb8dc103a0bc93cb`.
- Schema/table verification: `public.profiles`, `public.words`, `public.orders`, `public.srs_progress`, `public.referral_links`, `public.reward_transactions`, `auth.users`, and `storage.objects` exist. These names were selected from the actual dump and repository migrations, not guessed.
- Safe count queries completed for representative application tables without printing row data or counts. Critical functions `confirm_paid_order`, `get_word_summary`, `fn_resolve_referral_code`, `claim_onboarding_xp` and public policies were inspectable.
- Container restart completed; restored database remained queryable and critical tables remained present. `app_migrations.applied` was not expected in the 23 September artifact because the P0 migration/history system had not run on production.

### Errors classified

- **EXPECTED / BENIGN:** schema/object conflicts when attempting to restore a full raw dump into the image's already initialized `postgres` database.
- **ENVIRONMENT MISMATCH:** generic/incorrect database placement for `pg_cron`; default image init suppressed required Supabase roles/schemas.
- **FIXABLE RESTORE PREREQUISITE:** standard `postgres`/reserved roles needed by extensions such as `supabase_vault`; resolved by retaining Supabase's normal bootstrap and restoring into a separate clean database.
- **ENVIRONMENT RACE:** temporary PostgreSQL opened during image init before final server startup; resolved by waiting for the image's init-complete marker.
- **FATAL BACKUP DEFECT:** none observed in the two successful final restores.
- **UNKNOWN fatal errors:** none remain in the successful restore path.

### Google Drive

- Fix in branch: action input changed from invalid `uploadFrom` to `filename`; third-party action pinned to immutable commit `935eccf4c2812e4d492c3d7c7ff59ca7520bf129`.
- New canonical backup workflow run: `36113438708` on `codex/fix-migration-workflow`.
- Database dump: **PASS**. Gzip validation: **PASS**. GitHub Artifact: **PASS**. Google Drive: **FAIL**. Overall: **FAIL**.
- Exact failure class: configuration/secret missing. Repository secret inventory does not contain `GDRIVE_FOLDER_ID` or `GDRIVE_CREDENTIALS`; action stopped at `missing input 'folderId'`. No secret value was read or printed. Operator must provision both secret types and share the Drive folder with the service account before another validation run.

### Backup format assessment

- Raw `pg_dump` did restore successfully, but only after reproducing Supabase roles/extensions, isolating a clean database, relocating `pg_cron`, and handling Supabase bootstrap behavior. It includes Supabase internal schemas and cron metadata, increasing restore risk and operational complexity.
- Supabase's documented CLI flow separates roles, schema, and data and applies Supabase-specific filtering for internal schemas/reserved roles. Recommendation: **MIGRATE BACKUP FORMAT TO SUPABASE CLI** as a separate reviewed change; do not switch format inside the P0 rollout.
- The temporary hard-coded restore-lab workflow/script was removed from the final tree after capturing successful run evidence, so it cannot accidentally become a stale production workflow.

### Final status

- **BACKUP NOT READY**. Restoreability is verified for both the prior and newly generated artifacts, but secondary durable storage is still failing and no operator acceptance of redundancy debt was given.
- Do not resume P0 rollout automatically. `main`, production migrations, deployment, and production service remain untouched.

### Google Drive credential retry (2026-09-25)

- Operator added repository secrets named `GDRIVE_CREDENTIALS` and `GDRIVE_FOLDER_ID`; names and update timestamps were confirmed without reading values.
- Canonical backup retry run `36122073995`: dump **PASS**, gzip validation **PASS**, GitHub Artifact **PASS**, Google Drive **FAIL**, overall **FAIL**.
- New GitHub artifact: `lingopro-backup-20260925_100601`, ID `10858082671`, created `2026-09-25T10:07:35Z`, expires `2026-10-25T10:07:34Z`.
- Exact Drive failure: `base64 decoding of 'credentials' failed with error: illegal base64 data at input byte 0`. The pinned action contract requires `GDRIVE_CREDENTIALS` to contain the service-account JSON encoded as base64, not raw JSON. No secret value was printed.
- `GDRIVE_CREDENTIALS` must be replaced with a base64 encoding of the complete service-account JSON. Folder access remains unverified until a subsequent run reaches the Drive API.
- Final status remains **BACKUP NOT READY**; no merge, migration, deploy, or production restart occurred.

### Google Drive quota retry (2026-09-25)

- Retry `36123775829` confirmed the repository still held the earlier non-base64 credential value: dump **PASS**, gzip validation **PASS**, GitHub Artifact **PASS**, Google Drive **FAIL** with the same base64 decode error.
- `GDRIVE_CREDENTIALS` was then replaced from the operator-provided service-account JSON through a direct base64 pipe; credential content was neither displayed nor written into the repository. The secret timestamp advanced to `2026-09-25T10:26:36Z`.
- Canonical backup retry `36124014754` on branch HEAD `8725283dab06d223016830e1b73d8eafd4428833`: dump **PASS**, gzip validation **PASS**, GitHub Artifact **PASS**, Google Drive **FAIL**, overall **FAIL**.
- New GitHub artifact: `lingopro-backup-20260925_102712`, ID `10859491161`, size `19,909,241` bytes, created `2026-09-25T10:29:01Z`, expires `2026-10-25T10:28:59Z`.
- Exact Drive failure: HTTP `403 storageQuotaExceeded`; Google reports that service accounts have no Drive storage quota. Sharing an ordinary My Drive folder with Editor permission does not provide quota because the service account would own the uploaded file.
- The pinned action supports Shared Drives (`SupportsAllDrives(true)`) but authenticates only with service-account credentials. The next remediation is either a folder in a supported Google Workspace Shared Drive, or a separately reviewed workflow change to OAuth 2.0 user authentication.
- Final status remains **BACKUP NOT READY**. No merge, migration, deploy, production restart, or manual production action occurred.

### Google Drive OAuth preparation (2026-09-25)

- Operator selected OAuth 2.0 with the personal Gmail account. Local workflow now replaces the service-account upload action with rclone `1.75.1`, downloaded from the official release URL and verified against SHA-256 `982b5aa772841168f8e380f139e9e787b2a105403e32b94da8676a0e1c0a13ab`.
- The workflow expects one GitHub secret, `GDRIVE_RCLONE_CONFIG`, writes it to a permission-restricted runner temp file, uploads with retries, and performs a post-upload checksum check. The config file is removed when the step exits.
- OAuth scope is `drive.file`; the workflow targets `LingoPro Automated Backups`, which limits access to files and folders created by this OAuth application. The manually created folder shared with the service account is not reused.
- OAuth client type `installed` was confirmed without printing its ID or secret. Browser authorization for `taphong2002@gmail.com` completed with `drive.file`; a credential-free `rclone lsd` access test **PASS**.
- Repository secret `GDRIVE_RCLONE_CONFIG` was created at `2026-09-25T11:49:50Z` through stdin; its value was not printed. The pinned Windows and Linux rclone archives both matched their official SHA-256 checksums, and the expected Linux executable layout was confirmed.
- Verification: `actionlint v1.7.12` **PASS** and `git diff --check` **PASS**. A canonical backup run is still required to verify folder creation, upload, and remote checksum.
- Final status remains **BACKUP NOT READY**. No merge, migration, deploy, production restart, or manual production action occurred.

### Google Drive OAuth verification (2026-09-25)

- OAuth workflow commit `4fe41f7bf4fc2f3e1913bfa4e517e92b13c3a208` was pushed to `codex/fix-migration-workflow`; remote SHA matched local SHA. The production deploy workflow remained restricted to pushes on `main`, and no deploy run was triggered by the branch push.
- Canonical backup run `36131664615`: database dump **PASS**, gzip validation **PASS**, GitHub Artifact **PASS**, pinned rclone checksum/install **PASS**, Google Drive OAuth upload **PASS**, remote checksum **PASS**, overall **PASS**.
- Backup file `lingopro_backup_20260925_115121.sql.gz` is visible through the OAuth remote under `LingoPro Automated Backups`. GitHub artifact `lingopro-backup-20260925_115121`, ID `10861689980`, size `19,910,241` bytes, expires `2026-10-25T11:52:51Z`.
- Existing recent backup artifacts were already restored successfully in isolated Supabase-compatible runs `36113337536` and `36113855566`; no new restore defect was introduced by changing only the secondary upload mechanism.
- **BACKUP READY** for P0 rollout: a current verified dump exists in both GitHub Artifact storage and Google Drive, and restoreability has been demonstrated independently.
- Follow-up: the Google OAuth app was authorized while in Testing mode. Publish the personal-use app before the seven-day test grant expires so future scheduled uploads keep working without weekly reauthorization.
- No merge to `main`, production migration, deployment, or production restart occurred. Resume P0 rollout only under separate operator authorization.

## P0-ROLLOUT — Lockfile repair and CI stop (2026-09-26)

- Root cause of run `36133377900`: `package-lock.json` was incomplete for npm 10 and omitted the optional peer dependency trees required by Puppeteer (`proxy-agent` 8.x and related packages). No transitive package was added directly to `package.json`.
- Lockfile repair: regenerated with Node `22.23.2` and npm `10.9.8`, matching CI. `package.json` stayed byte-for-byte unchanged. The diff added 30 missing package entries / 469 lines, removed 0 entries, changed 0 existing entries, and introduced no unrelated dependency upgrade.
- Clean project-directory verification: `npm ci` **PASS** (1,917 packages); `npm run build` **PASS**; actionlint `v1.7.11` **PASS**; deployment script/migration syntax **PASS**; 14 deployment safety tests **PASS**; health-route ESLint **PASS**; `npm run typecheck` returned the documented baseline only: 10 Speaking errors (TS2307/TS7006). Post-failure audit confirmed the machine-wide npm cache already contained the removed `google-img-scrap@1.2.1` tarball, which masked the registry 404 locally; the fresh GitHub runner is authoritative for this failure.
- Lockfile-only commit `465168ce7bce3338c0ef5a5e8a3d512cb7618d3c` was pushed through PR `#3`; PR merge moved `main` to `96d42b6742664d0bd6cbf72f1ef49aa5cdff6427`.
- New canonical workflow run: `36205709901` — **FAIL** at Quality → `Install dependencies` (`npm ci`). The original lockfile mismatch is gone; CI reached package download and failed with HTTP 404 for `google-img-scrap@1.2.1` because `https://registry.npmjs.org/google-img-scrap/-/google-img-scrap-1.2.1.tgz` is no longer available.
- Migration executed: **NO** (job skipped). Deploy/restart/health executed: **NO** (job skipped). No manual migration, SSH deploy, restart, or CI bypass was attempted.
- Final production SHA: **N/A — deployment did not execute**. Production remains unchanged; last read-only observation recorded live Git HEAD `da6e196b964a3b05dacd0fec003b28e9208461a0`, while the active release marker remains unknown.
- Status: **STOPPED** on the exact new CI failure as required. Resolving the unavailable direct dependency is a separate reviewed change.

## P0-SECURITY — Remove malicious `google-img-scrap` (2026-09-26)

- Advisory: GitHub `GHSA-mwh7-p59x-2f4g` classifies every version (`>= 0`) as malware, has no patched version, and directs operators to treat any machine where it was installed or run as fully compromised.
- Usage audit: no import, `require`, dynamic import, type reference, npm script, or runtime call exists in the repository. The only executable dependency references were the direct entry in `package.json`, the root/package entries in `package-lock.json`, and its transitive dependency tree. The product image feature already uses the independent Pixabay/Pexels/DuckDuckGo/Wikipedia/Openverse/generative pipeline, so no feature code was changed or disabled and no replacement package was added.
- Removal commit `da2dd0f684aece82b092f84fbe819a753d004903`: removed the direct manifest entry and 55 package entries from the lockfile in total (the package itself plus 54 transitive-only entries). No existing package version was upgraded. PR `#4` is open and **NOT MERGED**; `main` remains `96d42b6742664d0bd6cbf72f1ef49aa5cdff6427`.
- Clean local verification used Node `22.23.2` / npm `10.9.8`, a Git archive checkout with no `node_modules`, and a newly created empty npm cache on `D:`. `npm ci` **PASS** with 1,871 packages; the package name was absent from the clean source, cache, lockfile, and installed tree. `npm run build` **PASS**; actionlint `v1.7.11`, Bash/migration syntax, 14 deploy tests, and health-route ESLint **PASS**; typecheck returned exactly the documented 10 Speaking errors.
- Clean GitHub-hosted verification run `36208696454` at exact SHA `da2dd0f684aece82b092f84fbe819a753d004903`: Ubuntu and macOS `npm ci` **PASS**; Android and iOS mobile jobs completed **PASS**. This workflow does not migrate or deploy production.
- Developer-machine evidence: installed copies were found in three older checkouts: version `1.1.8` created `2026-06-13`, version `1.2.1` created `2026-06-17`, and version `1.2.1` created `2026-09-23`; npm logs also prove version `1.2.1` was installed into the temporary verification checkout on `2026-09-26`. Inspected package manifests contain no lifecycle hook, repository/history searches found no code invocation, and PowerShell history contains no package command. This lowers evidence of execution but does not override the advisory; exposure **cannot be ruled out**.
- Credential classes present and potentially readable by the same Windows account include GitHub credentials, deploy/GitLab SSH private keys, Google OAuth and service-account JSON, Supabase service-role credentials, Firebase private key, Cloudflare/Gemini/Groq/Hugging Face/OpenRouter/Zhipu/image-provider/email/notification/payment API keys, bot/cron/webhook secrets, Vercel credentials, and the current `NLM_AUTH_TOKEN`. The user `.npmrc` contains only a cache setting; no npm auth token was found there. No secret values were printed.
- P0 status: **STOPPED**. Dependency and clean-runner gates pass, but rollout must not resume until the operator completes incident response from a separate trusted machine: isolate/reimage this host, revoke sessions/tokens, rotate the credential classes above and SSH keys, update dependent services/GitHub secrets, and review provider audit logs from at least `2026-06-13` onward.

### Operator residual-risk acceptance and rollout resume (2026-09-26)

- Operator explicitly accepts the residual security risk, defers Ubuntu reimage/credential rotation, and authorizes reuse of the current production server for the canonical P0 rollout. This is a temporary risk acceptance, not evidence that the host is clean.
- Clean dependency evidence remains valid: local empty-cache `npm ci` **PASS** and GitHub-hosted run `36208696454` **PASS** at package-removal SHA `da2dd0f684aece82b092f84fbe819a753d004903`; `google-img-scrap` is absent from `package.json`, `package-lock.json`, source, clean cache, and clean installed tree.
- Read-only production preflight: `https://lingopro.online/` returns HTTP 200. The current old release still returns HTTP 404 at `/api/health`, matching the recorded pre-P0 state; the canonical candidate must provide the new JSON health endpoint. Latest known successful production deploy remains run `35870637554` at SHA `da6e196b964a3b05dacd0fec003b28e9208461a0`.
- Required GitHub secret names for the canonical path are present: `SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY`, `TAILSCALE_AUTHKEY`, `SUPABASE_DB_URL`, and `CRON_SECRET`; values were not read or printed. Direct local SSH verification was not available because production host access is held in GitHub Secrets. Canonical workflow exact-SHA checkout, server-side `npm ci`, build, activation, restart, health, and release-SHA verification are the authoritative server checks.
- Authorized next action: merge PR `#4`, then allow only `.github/workflows/deploy-server.yml` to execute quality → migration → exact-SHA deploy → restart → health. Stop on the first failed stage; no SSH/manual migration/restart/deploy or CI bypass.

### Canonical rollout migration failure and repair (2026-09-26)

- PR `#4` merged at main SHA `7d9d45e7fffb89d38dd1e826b9b42a985325dde6`. Canonical run `36223006832` passed Quality, then failed in migration job `108352271617` at `20260718_words_example_vi.sql` with `cannot remove parameter defaults from existing function`. Deploy/restart/health were skipped; the production app remained on the old release.
- Read-only production audit run `36223830665` identified `public.get_due_words_list(uuid, uuid, integer)`, owner `postgres`, defaults `p_classroom_id DEFAULT NULL::uuid` and `p_limit DEFAULT 50`. It already returns `example_vi text`, is SQL `STABLE SECURITY DEFINER`, has fixed `search_path = pg_catalog, public`, grants EXECUTE to `postgres` and `service_role`, and has no catalog-tracked dependent objects.
- Root cause: the old migration attempted `CREATE OR REPLACE` without the existing defaults. PostgreSQL rejects removal of argument defaults. The stale body would also have regressed authorization, search path, volatility, optimized due-only behavior and defaults if forced through.
- Failed-file state: `words.example_vi text` and the newer RPC predated the run. The column comment remained NULL and the function remained unchanged after failure, so the migration transaction rolled back and left no partial change among all objects it touched.
- The three preceding migrations have rows in `app_migrations.applied`; their production checksums exactly match repository LF-normalized SHA-256 values. The failed words migration has no history row. A canonical rerun must skip the three recorded files.
- Fix commit `c28110c`: retain idempotent column/comment statements, remove the stale function replacement, and assert through `pg_proc` that the exact function exists and returns `example_vi text`. This preserves defaults, OID, body, owner, ACL, attributes and dependencies. No DROP FUNCTION or CASCADE is used.
- PostgreSQL 17 regression run `36224105912`: **PASS** for first application, direct SQL rerun, default-argument behavior, expected `example_vi` output, unchanged function definition/OID/owner/ACL/attributes, and preservation of a dependent view.
- Clean GitHub runner run `36224338651`, Node `22.23.2` / npm `10.9.8`: `npm ci`, actionlint `v1.7.11`, migration/runner and Bash syntax, deployment safety tests, health-route ESLint, `git diff --check`, and `npm run build` all **PASS**. Typecheck exactly matches the documented 10 Speaking TS2307/TS7006 errors.
- Temporary harness run `36224034702` unintentionally started the backup job because of an overly broad test-mode condition; it was canceled during dump before artifact and Drive upload. Corrected isolated run: `36224105912`. No schema or deploy action occurred through the harness.
- Rollout remains paused until this fix is merged through PR and the canonical workflow runs quality → migration → exact-SHA deploy → restart → health. Stop on any failure; no manual SQL, SSH deploy or restart.

### Canonical rerun stopped at deploy script parsing (2026-09-26)

- PR `#5` merged to `main` at exact SHA `9aabd1de7d4b874f442a75f6db89a7fec3de60c8`. Canonical workflow run `36224587351` used that exact SHA.
- Quality job `108356017747`: **PASS**. Migration job `108356565583`: **PASS**. The three prior history entries were logged as `SKIP already applied`; the repaired words migration and the remaining three P0 migrations were applied successfully, history recorded, and post-apply probes completed.
- Deploy job `108356646829`: **FAIL** at `Deploy via SSH`. Tailscale and SSH connection succeeded; the remote script printed its start and staging directory, then Bash stopped with `bash: -c: line 24: syntax error near unexpected token ';'` and exit status 2.
- The remote script did not reach Git fetch/checkout, server-side `npm ci`, build, activation, service restart or health checks. Public `/api/health` remains HTTP 404, consistent with the old app release. Final production application SHA remains unchanged/unknown beyond the previously observed old release.
- Rollout status: **STOPPED** at the new exact failure as required. Migration is complete; no manual SSH, restart, deploy, SQL, rerun or CI bypass was attempted. The deploy-script parsing defect requires a separate reviewed fix.
